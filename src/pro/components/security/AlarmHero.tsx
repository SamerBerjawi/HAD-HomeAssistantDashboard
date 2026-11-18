import { useRef, useState } from 'react';
import { AlertDialog, Button, ListBox, Select, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  BlindsIcon,
  Clock01Icon,
  DoorIcon,
  Home01Icon,
  Logout03Icon,
  Moon02Icon,
  PowerIcon,
  SecurityCheckIcon,
  Shield01Icon,
  ShieldUserIcon,
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
import { entityName } from '../../hooks/useSecurityData';
import { AlarmCodeSheet } from './AlarmCodeSheet';

const MODE_ICON: Record<AlarmModeId, IconSvgElement> = {
  disarmed: PowerIcon,
  armed_home: Home01Icon,
  armed_away: Logout03Icon,
  armed_night: Moon02Icon
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

interface AlarmHeroProps {
  alarm: ResolvedEntity;
  /** All alarm panels; a picker shows when there is more than one. */
  alarms: ResolvedEntity[];
  openings: ResolvedEntity[];
  onError: (message: string | null) => void;
}

/** Alarm hero (DESIGN.md 7.5): state-tinted shield tile, who/when, modes as a segmented control. */
export function AlarmHero({ alarm, alarms, openings, onError }: AlarmHeroProps) {
  const setSelectedAlarm = useAutoLayoutStore((s) => s.setSelectedAlarmEntityId);
  const callHAService = useAutoLayoutStore((s) => s.callHAService);
  const updateEntityState = useAutoLayoutStore((s) => s.updateEntityState);
  const [busy, setBusy] = useState(false);
  const [confirmMode, setConfirmMode] = useState<AlarmModeId | null>(null);
  const [codeMode, setCodeMode] = useState<AlarmModeId | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const confirmOpenedAt = useRef(0);

  const state = alarm.state || 'disarmed';
  const tone = alarmTone(state);
  const modes = alarmModes(alarm);
  const current = modes.find((m) => m.id === state)?.id;
  const changedBy = alarm.attributes?.changed_by as string | undefined;
  const changedAt = alarm.last_changed ? (Date.now() - Date.parse(alarm.last_changed)) / 60000 : null;

  const send = async (mode: AlarmModeId, code?: string) => {
    const service = modes.find((m) => m.id === mode)!.service;
    setBusy(true);
    onError(null);
    try {
      await callHAService('alarm_control_panel', service, code ? { code } : {}, { entity_id: alarm.entity_id });
      // Demo has no HA to echo the change back.
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
    if (shouldConfirmArming(mode, openings.length)) {
      confirmOpenedAt.current = performance.now();
      setConfirmMode(mode);
    } else proceed(mode);
  };

  const armAnyway = () => {
    // Ignore the tail of the tap that opened the dialog (a ghost click on "Arm anyway").
    if (performance.now() - confirmOpenedAt.current < 400) return;
    const mode = confirmMode!;
    setConfirmMode(null);
    proceed(mode);
  };

  const modeLabel = (id: AlarmModeId | null) => (id === 'disarmed' ? 'disarm' : `arm ${modes.find((m) => m.id === id)?.label ?? ''}`);

  return (
    <section aria-label="Alarm" className="pro-surface relative overflow-hidden">
      <div className={cn('flex flex-col gap-5 p-5 md:p-6', TONE_WASH[tone])}>
        <div className="flex items-center gap-4">
          <span className={cn('grid size-16 shrink-0 place-items-center rounded-2xl', TONE_TILE[tone], state === 'triggered' && 'animate-pulse')}>
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
                <Select.Trigger className="h-8 min-h-8 gap-1.5 px-2.5 text-sm">
                  <HugeiconsIcon icon={Shield01Icon} size={14} className="shrink-0 text-muted" />
                  <Select.Value className="truncate" />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover className="pro" data-page="security">
                  <ListBox>
                    {alarms.map((a) => (
                      <ListBox.Item key={a.entity_id} id={a.entity_id} textValue={entityName(a)}>
                        <HugeiconsIcon icon={a.state?.startsWith('armed') ? SecurityCheckIcon : Shield01Icon} size={16} className="shrink-0" />
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
                {openings.length === 1 ? '1 opening is open' : `${openings.length} openings are open`}
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <ul className="flex flex-col gap-1.5">
                {openings.map((o) => (
                  <li key={o.entity_id} className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon icon={o.attributes?.device_class === 'window' ? BlindsIcon : DoorIcon} size={16} className="text-warning" />
                    {entityName(o)}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted">Arm {modes.find((m) => m.id === confirmMode)?.label} anyway?</p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="tertiary" onPress={() => setConfirmMode(null)}>
                Cancel
              </Button>
              <Button variant="primary" onPress={armAnyway}>
                <HugeiconsIcon icon={SecurityCheckIcon} size={16} />
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
