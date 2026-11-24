import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertDialog,
  Avatar,
  Button,
  Chip,
  ListBox,
  Select
} from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Airplane01Icon,
  Alert02Icon,
  BlindsIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  DoorIcon,
  GarageIcon,
  Home01Icon,
  Key01Icon,
  Logout03Icon,
  MegaphoneOffIcon,
  Moon02Icon,
  PowerIcon,
  SecurityCheckIcon,
  Shield01Icon,
  ShieldUserIcon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  TimeQuarterPassIcon,
  Video01Icon
} from '@hugeicons/core-free-icons';
import { haWebSocketService } from '@/services/haWebSocket';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { errorMessageField } from '@/lib/errors';
import { cn } from '@/lib/utils';
import type { ResolvedEntity } from '@/types';
import { timeAgo } from '../../lib/pageSentences';
import { resolveAlarmTriggerDiagnostic } from '../../lib/securityCameras';
import {
  alarmCodeIsNumeric,
  alarmModes,
  alarmNeedsCode,
  alarmStateLabel,
  alarmTone,
  shouldConfirmArming,
  type ActivityEvent,
  type AlarmModeId,
  type Tone
} from '../../lib/securityLogic';
import { useMinuteTick } from '../../hooks/useMinuteTick';
import { useHaPicture } from '../../widgets/shared/useHaPicture';
import { entityName } from '../../hooks/useSecurityData';
import { BorderBeam } from '../../ui/magicui/BorderBeam';
import { AlarmCodeSheet } from './AlarmCodeSheet';
import { HoldToConfirmButton } from './HoldToConfirmButton';

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

const TONE_TINT: Record<Tone, string> = {
  default: '168, 85, 247',
  success: '34, 197, 94',
  warning: '245, 158, 11',
  danger: '239, 68, 68'
};

const TONE_COLOR: Record<Tone, string> = {
  default: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)'
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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function ShieldHaloSvg({
  state,
  tone,
  zones
}: {
  state: string;
  tone: Tone;
  zones: readonly { id: string; tone: Tone }[];
}) {
  const r = 48;
  const c = 2 * Math.PI * r;
  const segLen = c / zones.length;
  const color = TONE_COLOR[tone];

  return (
    <div className="relative grid size-28 shrink-0 place-items-center sm:size-32">
      <svg
        viewBox="0 0 120 120"
        className="size-full"
        role="img"
        aria-label={`Alarm ${alarmStateLabel(state)} perimeter ring`}
      >
        <g transform="rotate(-90 60 60)">
          {zones.map((z, idx) => (
            <circle
              key={z.id}
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke={TONE_COLOR[z.tone]}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(4, segLen - 10)} ${c}`}
              strokeDashoffset={-(idx * segLen + 5)}
              opacity="0.88"
            />
          ))}
        </g>
        <circle
          cx="60"
          cy="60"
          r="35"
          fill={color}
          fillOpacity="0.14"
          stroke={color}
          strokeOpacity="0.35"
          strokeWidth="1.5"
        />
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <HugeiconsIcon
          icon={stateIcon(state)}
          size={28}
          style={{ color }}
          className={state === 'triggered' ? 'animate-pulse' : undefined}
        />
        <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
          {state === 'triggered' ? 'ALERT' : state.startsWith('armed') ? 'ARMED' : 'OFF'}
        </span>
      </div>
    </div>
  );
}

interface AlarmHeroProps {
  alarm: ResolvedEntity;
  alarms: ResolvedEntity[];
  openings: ResolvedEntity[];
  openGarages?: ResolvedEntity[];
  unlockedLocks?: ResolvedEntity[];
  jammedLocks?: ResolvedEntity[];
  activeSirens?: ResolvedEntity[];
  hazards?: ResolvedEntity[];
  people?: ResolvedEntity[];
  cameras?: ResolvedEntity[];
  events?: ActivityEvent[];
  serverUrl?: string | null;
  onFocusCamera?: (cameraId: string) => void;
  onError: (message: string | null) => void;
}

/**
 * Alarm Hero — Concept A · Shield Halo Console (DESIGN.md 7.5, SECURITY.md §3):
 * Concentric 4-zone perimeter readiness SVG ring around the shield, subtle state glow,
 * BorderBeam when triggered, Who's Home avatars, panel picker, PIN sheet, open-entry dialog,
 * and press-and-hold (`HoldToConfirmButton`) for critical modes (Away, Vacation, code-free Disarm).
 */
export function AlarmHero({
  alarm,
  alarms,
  openings,
  openGarages = [],
  unlockedLocks = [],
  jammedLocks = [],
  activeSirens = [],
  hazards = [],
  people = [],
  cameras = [],
  events = [],
  serverUrl = null,
  onFocusCamera,
  onError
}: AlarmHeroProps) {
  const setSelectedAlarm = useAutoLayoutStore((s) => s.setSelectedAlarmEntityId);
  const callHAService = useAutoLayoutStore((s) => s.callHAService);
  const updateEntityState = useAutoLayoutStore((s) => s.updateEntityState);
  const resolvedEntities = useAutoLayoutStore((s) => s.resolvedEntities);
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
  const hasCode = Boolean(alarm.attributes?.code_format);

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

  const entityById = useMemo(
    () => new Map(Object.entries(resolvedEntities || {})),
    [resolvedEntities]
  );

  const diagnostic = useMemo(
    () =>
      resolveAlarmTriggerDiagnostic({
        alarm,
        hazards,
        openings: [...openGarages, ...openings],
        events,
        cameras,
        entityById
      }),
    [alarm, hazards, openGarages, openings, events, cameras, entityById]
  );

  const homePeople = useMemo(() => people.filter((p) => p.state === 'home'), [people]);
  const everyoneAway = people.length > 0 && homePeople.length === 0;
  const canArmAway = modes.some((m) => m.id === 'armed_away');

  const zones: { id: string; tone: Tone }[] = [
    {
      id: 'locks',
      tone: jammedLocks.length > 0 ? 'danger' : unlockedLocks.length > 0 ? 'warning' : 'success'
    },
    { id: 'openings', tone: openings.length > 0 ? 'warning' : 'success' },
    { id: 'garages', tone: openGarages.length > 0 ? 'warning' : 'success' },
    { id: 'hazards', tone: hazards.length > 0 || activeSirens.length > 0 ? 'danger' : 'success' }
  ];
  const sealedZones = zones.filter((z) => z.tone === 'success').length;

  const send = async (mode: AlarmModeId, code?: string) => {
    const service = modes.find((m) => m.id === mode)!.service;
    setBusy(true);
    onError(null);
    try {
      await callHAService('alarm_control_panel', service, code ? { code } : {}, {
        entity_id: alarm.entity_id
      });
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

  const silenceSirens = async () => {
    setBusy(true);
    onError(null);
    try {
      await callHAService('siren', 'turn_off', {}, { entity_id: activeSirens.map((s) => s.entity_id) });
    } catch (e) {
      onError(errorMessageField(e) || 'Could not silence siren');
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
    if (shouldConfirmArming(mode, openings.length + openGarages.length, unlockedLocks.length)) {
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

  const secureAndArm = async () => {
    if (performance.now() - confirmOpenedAt.current < 400) return;
    const mode = confirmMode!;
    setConfirmMode(null);
    setBusy(true);
    onError(null);
    try {
      const jobs: Promise<unknown>[] = [];
      if (unlockedLocks.length > 0) {
        jobs.push(
          callHAService('lock', 'lock', {}, { entity_id: unlockedLocks.map((l) => l.entity_id) })
        );
      }
      if (openGarages.length > 0) {
        jobs.push(
          callHAService(
            'cover',
            'close_cover',
            {},
            { entity_id: openGarages.map((g) => g.entity_id) }
          )
        );
      }
      if (jobs.length > 0) await Promise.all(jobs);
      proceed(mode);
    } catch (e) {
      onError(errorMessageField(e) || 'Could not secure entries before arming');
    } finally {
      setBusy(false);
    }
  };

  const modeLabel = (id: AlarmModeId | null) =>
    id === 'disarmed' ? 'disarm' : `arm ${modes.find((m) => m.id === id)?.label ?? ''}`;

  const requiresHold = (mode: AlarmModeId): boolean => {
    if (mode === current) return false;
    if (mode === 'armed_away' || mode === 'armed_vacation') return true;
    if (mode === 'disarmed' && state !== 'disarmed' && !alarmNeedsCode(alarm, 'disarmed')) return true;
    return false;
  };

  const readinessIssues: string[] = [];
  const totalOpenings = openings.length + openGarages.length;
  if (totalOpenings > 0) {
    readinessIssues.push(totalOpenings === 1 ? '1 opening open' : `${totalOpenings} openings open`);
  }
  if (unlockedLocks.length > 0) {
    readinessIssues.push(
      unlockedLocks.length === 1 ? '1 lock unlocked' : `${unlockedLocks.length} locks unlocked`
    );
  }
  const canAutoSecure = unlockedLocks.length > 0 || openGarages.length > 0;

  return (
    <section
      aria-label="Alarm"
      className={cn(
        'pro-eb @container relative flex h-full flex-col justify-between gap-4 p-4 sm:p-5',
        state === 'triggered' && 'ring-2 ring-danger'
      )}
      style={{ ['--eb-tint' as string]: TONE_TINT[tone] }}
    >
      {state === 'triggered' ? (
        <BorderBeam colorFrom="var(--danger)" colorTo="#fb7185" duration={3.5} borderWidth={2} />
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-4 text-center @[520px]:flex-row @[520px]:items-center @[520px]:justify-between @[520px]:text-left">
          <div className="flex min-w-0 flex-col items-center gap-3.5 @[520px]:flex-row">
            <ShieldHaloSvg state={state} tone={tone} zones={zones} />

            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center justify-center gap-2 @[520px]:justify-start">
                <h2 className="text-2xl font-bold tracking-tight leading-none" aria-live="polite">
                  {alarmStateLabel(state)}
                </h2>
                <Chip size="sm" variant="soft" color={tone}>
                  <HugeiconsIcon icon={hasCode ? Key01Icon : Shield01Icon} size={12} />
                  <Chip.Label>{hasCode ? 'PIN protected' : `${sealedZones}/4 zones sealed`}</Chip.Label>
                </Chip>
              </div>

              {(changedBy || changedAt !== null) && (
                <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-xs text-muted @[520px]:justify-start">
                  {changedBy && (
                    <span className="inline-flex items-center gap-1">
                      <HugeiconsIcon icon={ShieldUserIcon} size={13} />
                      by {changedBy}
                    </span>
                  )}
                  {changedAt !== null && !Number.isNaN(changedAt) && (
                    <span className="inline-flex items-center gap-1">
                      <HugeiconsIcon icon={Clock01Icon} size={13} />
                      {timeAgo(changedAt)}
                    </span>
                  )}
                </p>
              )}

              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5 @[520px]:justify-start">
                {alarms.length > 1 ? (
                  <Select
                    aria-label="Alarm panel"
                    selectedKey={alarm.entity_id}
                    onSelectionChange={(key) => key && setSelectedAlarm(String(key))}
                    className="w-fit max-w-full"
                  >
                    <Select.Trigger className="min-h-8 items-center gap-1.5 px-2.5 py-1 text-xs leading-normal text-foreground">
                      <HugeiconsIcon icon={Shield01Icon} size={13} className="shrink-0 text-muted" />
                      <Select.Value className="truncate leading-normal text-foreground">
                        {() => <span className="truncate leading-normal text-foreground">{entityName(alarm)}</span>}
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
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
                    <HugeiconsIcon icon={Shield01Icon} size={13} />
                    <span className="truncate">{entityName(alarm)}</span>
                  </span>
                )}

                <span
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                    readinessIssues.length > 0
                      ? 'bg-warning/15 text-warning'
                      : 'bg-success/15 text-success'
                  )}
                >
                  <HugeiconsIcon
                    icon={readinessIssues.length > 0 ? Alert02Icon : CheckmarkCircle02Icon}
                    size={12}
                  />
                  {readinessIssues.length > 0 ? readinessIssues.join(' · ') : 'Ready to arm'}
                </span>
              </div>
            </div>
          </div>

          {activeSirens.length > 0 ? (
            <Button size="sm" variant="danger" isPending={busy} onPress={() => void silenceSirens()}>
              <HugeiconsIcon icon={MegaphoneOffIcon} size={15} />
              Silence siren
            </Button>
          ) : null}
        </div>

        {people.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {(homePeople.length > 0 ? homePeople : people).slice(0, 4).map((p) => {
                  const pName = entityName(p);
                  const pic = p.attributes?.entity_picture as string | undefined;
                  return (
                    <Avatar
                      key={p.entity_id}
                      size="sm"
                      className={cn(
                        'size-6 text-[10px] ring-2 ring-surface',
                        p.state !== 'home' && 'opacity-55 grayscale'
                      )}
                    >
                      <PersonPhoto picture={pic} name={pName} serverUrl={serverUrl} />
                      <Avatar.Fallback>{initials(pName)}</Avatar.Fallback>
                    </Avatar>
                  );
                })}
              </div>
              <span className="text-xs text-muted">
                {homePeople.length > 0
                  ? `${homePeople.length} of ${people.length} home`
                  : 'Everyone is away'}
              </span>
            </div>

            {everyoneAway && state === 'disarmed' && canArmAway ? (
              <HoldToConfirmButton
                icon={Logout03Icon}
                label="Arm Away"
                hintLabel="Hold to arm away"
                ariaLabel="Hold to arm Away"
                holdMs={1200}
                variant="tertiary"
                className="h-7 min-h-7 rounded-full bg-warning/15 px-2.5 text-xs font-medium text-warning"
                onConfirm={() => select('armed_away')}
              />
            ) : null}
          </div>
        ) : null}

        {diagnostic ? (
          <div
            className={cn(
              'flex flex-wrap items-center justify-between gap-2 rounded-2xl p-3',
              state === 'triggered' ? 'bg-danger/15' : 'bg-warning/12'
            )}
          >
            <span
              className={cn(
                'inline-flex min-w-0 items-center gap-2 text-xs font-semibold',
                state === 'triggered' ? 'text-danger' : 'text-warning'
              )}
            >
              <HugeiconsIcon icon={Alert02Icon} size={15} className="shrink-0" />
              <span className="truncate">{diagnostic.summary}</span>
            </span>
            {diagnostic.cameraId && onFocusCamera ? (
              <Button
                size="sm"
                variant={state === 'triggered' ? 'danger' : 'secondary'}
                onPress={() => onFocusCamera(diagnostic.cameraId!)}
              >
                <HugeiconsIcon icon={Video01Icon} size={14} />
                View camera
              </Button>
            ) : null}
          </div>
        ) : null}

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
      </div>

      {/* Mode controls: critical modes (Away, Vacation, code-free Disarm) use HoldToConfirmButton */}
      <div className="flex flex-col gap-1.5">
        <div
          role="group"
          aria-label="Alarm mode"
          className={cn(
            'grid gap-2',
            modes.length >= 4
              ? 'grid-cols-2 @[420px]:grid-cols-4'
              : modes.length === 3
                ? 'grid-cols-3'
                : 'grid-cols-2'
          )}
        >
          {modes.map((m) => {
            const active = current === m.id;
            const hold = requiresHold(m.id);
            const aria =
              m.id === 'disarmed'
                ? hold
                  ? 'Disarm alarm (press and hold)'
                  : 'Disarm'
                : hold
                  ? `Arm ${m.label} (press and hold)`
                  : `Arm ${m.label}`;

            if (hold) {
              return (
                <HoldToConfirmButton
                  key={m.id}
                  icon={MODE_ICON[m.id]}
                  label={m.label}
                  hintLabel={m.id === 'disarmed' ? 'Hold to disarm' : `Hold ${m.label.toLowerCase()}`}
                  ariaLabel={aria}
                  holdMs={1200}
                  variant="tertiary"
                  fullWidth
                  isDisabled={busy || state === 'unavailable'}
                  className="h-10 rounded-xl text-xs font-semibold sm:text-sm"
                  onConfirm={() => select(m.id)}
                />
              );
            }

            return (
              <Button
                key={m.id}
                size="sm"
                fullWidth
                variant={active ? 'primary' : 'tertiary'}
                aria-label={aria}
                aria-pressed={active}
                isDisabled={busy || state === 'unavailable'}
                onPress={() => select(m.id)}
                className="h-10 gap-1.5 rounded-xl text-xs font-semibold sm:text-sm"
              >
                <HugeiconsIcon icon={MODE_ICON[m.id]} size={15} />
                <span className="truncate">{m.label}</span>
              </Button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted">
          Press and hold Away{!hasCode && state !== 'disarmed' ? ' or Off' : ''} to confirm critical alarm changes.
        </p>
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
                {openGarages.map((g) => (
                  <li key={g.entity_id} className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon icon={GarageIcon} size={16} className="text-warning" />
                    {entityName(g)} (open)
                  </li>
                ))}
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
              {canAutoSecure ? (
                <Button size="sm" variant="primary" isPending={busy} onPress={() => void secureAndArm()}>
                  <HugeiconsIcon icon={SquareLock02Icon} size={15} />
                  {openGarages.length > 0 ? 'Secure & arm' : 'Lock all & arm'}
                </Button>
              ) : null}
              <Button
                size="sm"
                variant={canAutoSecure ? 'secondary' : 'primary'}
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

function PersonPhoto({ picture, name, serverUrl }: { picture?: string | null; name: string; serverUrl?: string | null }) {
  const src = useHaPicture(picture ?? null, serverUrl);
  return src ? <Avatar.Image src={src} alt={name} /> : null;
}
