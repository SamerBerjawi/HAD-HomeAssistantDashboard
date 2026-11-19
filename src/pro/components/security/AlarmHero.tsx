import { useEffect, useRef, useState } from 'react';
import { AlertDialog, Button, ListBox, Select, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Airplane01Icon,
  Alert02Icon,
  BlindsIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  DoorIcon,
  Home01Icon,
  Logout03Icon,
  Moon02Icon,
  PowerIcon,
  SecurityCheckIcon,
  Shield01Icon,
  ShieldUserIcon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  TimeQuarterPassIcon
} from '@hugeicons/core-free-icons';
import { haWebSocketService } from '@/services/haWebSocket';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { errorMessageField } from '@/lib/errors';
import { cn } from '@/lib/utils';
import type { ResolvedEntity } from '@/types';
import { timeAgo } from '../../lib/pageSentences';
import {
  alarmCodeIsNumeric,
  alarmModes,
  alarmNeedsCode,
  alarmStateLabel,
  alarmTone,
  shouldConfirmArming,
  type AlarmModeId,
  type Tone
} from '../../lib/securityLogic';
import { useMinuteTick } from '../../hooks/useMinuteTick';
import { entityName } from '../../hooks/useSecurityData';
import { BorderBeam } from '../../ui/magicui/BorderBeam';
import { AlarmCodeSheet } from './AlarmCodeSheet';

const MODE_ICON: Record<AlarmModeId, IconSvgElement> = {
  disarmed: PowerIcon,
  armed_home: Home01Icon,
  armed_away: Logout03Icon,
  armed_night: Moon02Icon,
  armed_vacation: Airplane01Icon,
  armed_custom_bypass: Shield01Icon
};

export const TONE_TILE: Record<Tone, string> = {
  default: 'bg-default text-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger'
};

const TONE_WASH: Record<Tone, string> = {
  default: '',
  success: 'bg-gradient-to-br from-success/10 to-transparent',
  warning: 'bg-gradient-to-br from-warning/12 to-transparent',
  danger: 'bg-gradient-to-br from-danger/15 to-transparent'
};

function stateIcon(state: string): IconSvgElement {
  if (state === 'triggered') return Alert02Icon;
  if (state === 'arming' || state === 'pending' || state === 'disarming') return TimeQuarterPassIcon;
  if (state.startsWith('armed')) return SecurityCheckIcon;
  return Shield01Icon;
}

function readDelaySeconds(alarm: ResolvedEntity): number {
  const attrs = alarm.attributes as Record<string, unknown> | undefined;
  const raw = attrs?.delay ?? attrs?.arming_time ?? attrs?.delay_time;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  return 30;
}

interface AlarmHeroProps {
  alarm: ResolvedEntity;
  /** All alarm panels; a picker shows when there is more than one. */
  alarms: ResolvedEntity[];
  openings: ResolvedEntity[];
  unlockedLocks?: ResolvedEntity[];
  onError: (message: string | null) => void;
}

/**
 * Alarm hero (DESIGN.md 7.5): state-tinted shield tile, BorderBeam when triggered,
 * arming/entry delay countdown bar, readiness summary, Lock-all-and-arm confirmation,
 * and segmented modes (Off · Home · Away · Night + optional Vacation/Custom).
 */
export function AlarmHero({
  alarm,
  alarms,
  openings,
  unlockedLocks = [],
  onError
}: AlarmHeroProps) {
  const setSelectedAlarm = useAutoLayoutStore((s) => s.setSelectedAlarmEntityId);
  const callHAService = useAutoLayoutStore((s) => s.callHAService);
  const updateEntityState = useAutoLayoutStore((s) => s.updateEntityState);
  useMinuteTick();

  const [busy, setBusy] = useState(false);
  const [confirmMode, setConfirmMode] = useState<AlarmModeId | null>(null);
  const [codeMode, setCodeMode] = useState<AlarmModeId | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [delayNow, setDelayNow] = useState(() => Date.now());
  const confirmOpenedAt = useRef(0);

  const state = alarm.state || 'disarmed';
  const isDelayState = state === 'arming' || state === 'pending';
  const tone = alarmTone(state);
  const modes = alarmModes(alarm);
  const current = modes.find((m) => m.id === state)?.id;
  const changedBy = alarm.attributes?.changed_by as string | undefined;
  const changedAt = alarm.last_changed ? (Date.now() - Date.parse(alarm.last_changed)) / 60000 : null;

  useEffect(() => {
    if (!isDelayState) return;
    setDelayNow(Date.now());
    const id = window.setInterval(() => setDelayNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [isDelayState, alarm.last_changed]);

  const delayTotalSec = readDelaySeconds(alarm);
  const delayElapsedSec =
    isDelayState && alarm.last_changed
      ? Math.max(0, (delayNow - Date.parse(alarm.last_changed)) / 1000)
      : 0;
  const delayRemainingSec = Math.max(0, Math.ceil(delayTotalSec - delayElapsedSec));
  const delayPct = Math.min(100, Math.max(0, (delayElapsedSec / delayTotalSec) * 100));

  const send = async (mode: AlarmModeId, code?: string) => {
    const service = modes.find((m) => m.id === mode)!.service;
    setBusy(true);
    onError(null);
    try {
      await callHAService('alarm_control_panel', service, code ? { code } : {}, { entity_id: alarm.entity_id });
      if (haWebSocketService.isDemo()) updateEntityState(alarm.entity_id, mode, { changed_by: 'You' });
      setCodeMode(null);
    } catch (e) {
      const message = errorMessageField(e) || 'Home Assistant rejected the change';
      if (code) setCodeError(message);
      else onError(message);
    } finally {
      setBusy(false);
    }
  };

  const proceed = (mode: AlarmModeId) => {
    if (alarmNeedsCode(alarm, mode)) {
      setCodeError(null);
      setCodeMode(mode);
    } else {
      void send(mode);
    }
  };

  const select = (mode: AlarmModeId) => {
    if (mode === state) return;
    if (shouldConfirmArming(mode, openings.length, unlockedLocks.length)) {
      confirmOpenedAt.current = performance.now();
      setConfirmMode(mode);
    } else proceed(mode);
  };

  const armAnyway = () => {
    if (performance.now() - confirmOpenedAt.current < 400) return;
    const mode = confirmMode!;
    setConfirmMode(null);
    proceed(mode);
  };

  const lockAllAndArm = async () => {
    if (performance.now() - confirmOpenedAt.current < 400) return;
    const mode = confirmMode!;
    setConfirmMode(null);
    setBusy(true);
    onError(null);
    try {
      if (unlockedLocks.length > 0) {
        await callHAService('lock', 'lock', {}, { entity_id: unlockedLocks.map((l) => l.entity_id) });
      }
      proceed(mode);
    } catch (e) {
      onError(errorMessageField(e) || 'Could not lock all doors before arming');
    } finally {
      setBusy(false);
    }
  };

  const modeLabel = (id: AlarmModeId | null) =>
    id === 'disarmed' ? 'disarm' : `arm ${modes.find((m) => m.id === id)?.label ?? ''}`;

  const readinessIssues: string[] = [];
  if (openings.length > 0) {
    readinessIssues.push(openings.length === 1 ? '1 opening open' : `${openings.length} openings open`);
  }
  if (unlockedLocks.length > 0) {
    readinessIssues.push(
      unlockedLocks.length === 1 ? '1 lock unlocked' : `${unlockedLocks.length} locks unlocked`
    );
  }

  return (
    <section aria-label="Alarm" className="pro-surface relative overflow-hidden">
      {state === 'triggered' ? (
        <BorderBeam colorFrom="var(--danger)" colorTo="#fb7185" duration={3.5} borderWidth={2} />
      ) : null}

      <div className={cn('flex flex-col gap-5 p-5 md:p-6', TONE_WASH[tone])}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <span
              className={cn(
                'grid size-16 shrink-0 place-items-center rounded-2xl',
                TONE_TILE[tone],
                state === 'triggered' && 'animate-pulse'
              )}
            >
              <HugeiconsIcon icon={stateIcon(state)} size={32} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="text-2xl font-bold tracking-tight" aria-live="polite">
                {alarmStateLabel(state)}
              </h2>
              {(changedBy || changedAt !== null) && (
                <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted">
                  {changedBy && (
                    <span className="inline-flex items-center gap-1">
                      <HugeiconsIcon icon={ShieldUserIcon} size={14} />
                      by {changedBy}
                    </span>
                  )}
                  {changedAt !== null && !Number.isNaN(changedAt) && (
                    <span className="inline-flex items-center gap-1">
                      <HugeiconsIcon icon={Clock01Icon} size={14} />
                      {timeAgo(changedAt)}
                    </span>
                  )}
                </p>
              )}
              {alarms.length > 1 ? (
                <Select
                  aria-label="Alarm panel"
                  selectedKey={alarm.entity_id}
                  onSelectionChange={(key) => key && setSelectedAlarm(String(key))}
                  className="w-fit max-w-full"
                >
                  <Select.Trigger className="h-8 min-h-8 gap-1.5 px-2.5 text-sm text-foreground">
                    <HugeiconsIcon icon={Shield01Icon} size={14} className="shrink-0 text-muted" />
                    <Select.Value className="truncate text-foreground">
                      {() => <span className="truncate text-foreground">{entityName(alarm)}</span>}
                    </Select.Value>
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover className="pro" data-page="security">
                    <ListBox>
                      {alarms.map((a) => (
                        <ListBox.Item key={a.entity_id} id={a.entity_id} textValue={entityName(a)}>
                          <HugeiconsIcon
                            icon={a.state?.startsWith('armed') ? SecurityCheckIcon : Shield01Icon}
                            size={16}
                            className="shrink-0"
                          />
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate">{entityName(a)}</span>
                            <span className="text-xs text-muted">{alarmStateLabel(a.state)}</span>
                          </span>
                          <ListBox.ItemIndicator />
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              ) : (
                <p className="inline-flex items-center gap-1 text-sm text-muted">
                  <HugeiconsIcon icon={Shield01Icon} size={14} />
                  <span className="truncate">{entityName(alarm)}</span>
                </p>
              )}
            </div>
          </div>

          <span
            className={cn(
              'hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex',
              readinessIssues.length > 0
                ? 'bg-warning/15 text-warning'
                : 'bg-success/15 text-success'
            )}
          >
            <HugeiconsIcon
              icon={readinessIssues.length > 0 ? Alert02Icon : CheckmarkCircle02Icon}
              size={13}
            />
            {readinessIssues.length > 0 ? readinessIssues.join(' · ') : 'Ready to arm'}
          </span>
        </div>

        {isDelayState ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-warning/10 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning">
                <HugeiconsIcon icon={TimeQuarterPassIcon} size={15} />
                {state === 'arming' ? 'Exit delay in progress' : 'Entry delay — disarm now'}
                {delayRemainingSec > 0 ? ` · ${delayRemainingSec}s` : ''}
              </span>
              <Button size="sm" variant="danger" isPending={busy} onPress={() => proceed('disarmed')}>
                <HugeiconsIcon icon={PowerIcon} size={14} />
                {state === 'arming' ? 'Cancel arming' : 'Disarm'}
              </Button>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-warning/20">
              <div
                className="h-full rounded-full bg-warning transition-all duration-200"
                style={{ width: `${delayPct}%` }}
              />
            </div>
          </div>
        ) : null}

        <ToggleButtonGroup
          aria-label="Alarm mode"
          selectionMode="single"
          disallowEmptySelection
          fullWidth
          isDisabled={busy || state === 'unavailable'}
          selectedKeys={current ? new Set([current]) : new Set()}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as AlarmModeId | undefined;
            if (next) select(next);
          }}
        >
          {modes.map((m) => (
            <ToggleButton
              key={m.id}
              id={m.id}
              aria-label={m.id === 'disarmed' ? 'Disarm' : `Arm ${m.label}`}
              className="h-auto min-w-0 flex-col gap-0.5 px-1 py-2 text-xs sm:h-10 sm:flex-row sm:gap-2 sm:px-3 sm:py-0 sm:text-sm"
            >
              <HugeiconsIcon icon={MODE_ICON[m.id]} size={18} />
              {m.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      <AlertDialog.Backdrop isOpen={confirmMode !== null} onOpenChange={(open) => !open && setConfirmMode(null)}>
        <AlertDialog.Container size="sm">
          <AlertDialog.Dialog className="pro" data-page="security">
            <AlertDialog.Header>
              <AlertDialog.Icon status="warning" />
              <AlertDialog.Heading>
                {readinessIssues.length > 0 ? readinessIssues.join(' · ') : 'Unsecured entries'}
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <ul className="flex flex-col gap-1.5">
                {openings.map((o) => (
                  <li key={o.entity_id} className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon
                      icon={o.attributes?.device_class === 'window' ? BlindsIcon : DoorIcon}
                      size={16}
                      className="text-warning"
                    />
                    {entityName(o)}
                  </li>
                ))}
                {unlockedLocks.map((l) => (
                  <li key={l.entity_id} className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon icon={SquareUnlock02Icon} size={16} className="text-warning" />
                    {entityName(l)} (unlocked)
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted">
                Arm {modes.find((m) => m.id === confirmMode)?.label} anyway?
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer className="flex-wrap gap-2">
              <Button size="sm" variant="tertiary" onPress={() => setConfirmMode(null)}>
                Cancel
              </Button>
              {unlockedLocks.length > 0 ? (
                <Button size="sm" variant="primary" isPending={busy} onPress={() => void lockAllAndArm()}>
                  <HugeiconsIcon icon={SquareLock02Icon} size={15} />
                  Lock all &amp; arm
                </Button>
              ) : null}
              <Button
                size="sm"
                variant={unlockedLocks.length > 0 ? 'secondary' : 'primary'}
                onPress={armAnyway}
              >
                <HugeiconsIcon icon={SecurityCheckIcon} size={15} />
                Arm anyway
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>

      <AlarmCodeSheet
        isOpen={codeMode !== null}
        actionLabel={modeLabel(codeMode)}
        numeric={alarmCodeIsNumeric(alarm)}
        error={codeError}
        onCancel={() => setCodeMode(null)}
        onSubmit={(code) => codeMode && void send(codeMode, code)}
      />
    </section>
  );
}
