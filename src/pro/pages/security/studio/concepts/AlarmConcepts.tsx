/**
 * Section 1 — Alarm Hero (always pinned above phone tabs):
 * A · Shield Halo Console (bespoke SVG concentric perimeter-readiness ring + panel switcher + mode bar)
 * B · Interactive Mode Deck (4 bold tactile mode tiles with plain-English scope subtitles)
 * C · Sentinel Command Strip (compact architectural header + SmoothTab mode switcher + readiness pills)
 */
import { Button, Chip, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert02Icon,
  Camera01Icon,
  CheckmarkCircle02Icon,
  DoorIcon,
  GarageIcon,
  Key01Icon,
  MegaphoneOffIcon,
  Shield01Icon,
  SquareLock02Icon,
  User02Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { alarmStateLabel, alarmTone, type AlarmModeId, type Tone } from '../../../../lib/securityLogic';
import { SmoothTab } from '../../../../ui/kokonutui/SmoothTab';
import {
  ALARM_MODE_META,
  alarmStateIcon,
  TONE_COLOR,
  TONE_TINT
} from './securityHelpers';
import type { SecurityConceptProps } from './types';

function summarizePerimeter(snap: SecurityConceptProps['snap']) {
  const locks = snap.devices.filter((d) => d.kind === 'lock');
  const lockedCount = locks.filter((d) => d.state === 'locked').length;
  const openDoorsWin = snap.devices.filter(
    (d) => (d.kind === 'door' || d.kind === 'window') && d.state === 'on'
  ).length;
  const openGarages = snap.devices.filter((d) => d.kind === 'garage' && d.state === 'open').length;
  const hazards = snap.devices.filter((d) => (d.kind === 'smoke' || d.kind === 'leak') && d.problem).length;
  const activeSirens = snap.devices.filter((d) => d.kind === 'siren' && d.state === 'on').length;
  const jammed = locks.filter((d) => d.state === 'jammed').length;

  const zones: { id: string; label: string; tone: Tone }[] = [
    { id: 'locks', label: 'Locks', tone: jammed > 0 ? 'danger' : lockedCount < locks.length ? 'warning' : 'success' },
    { id: 'openings', label: 'Entries', tone: openDoorsWin > 0 ? 'warning' : 'success' },
    { id: 'garages', label: 'Garage', tone: openGarages > 0 ? 'warning' : 'success' },
    { id: 'hazards', label: 'Hazards', tone: hazards > 0 || activeSirens > 0 ? 'danger' : 'success' }
  ];

  const readyCount = zones.filter((z) => z.tone === 'success').length;
  return { locks, lockedCount, openDoorsWin, openGarages, hazards, activeSirens, zones, readyCount };
}

function ShieldHaloSvg({
  state,
  tone,
  zones
}: {
  state: string;
  tone: Tone;
  zones: { id: string; label: string; tone: Tone }[];
}) {
  const r = 48;
  const c = 2 * Math.PI * r;
  const segLen = c / zones.length;
  const color = TONE_COLOR[tone];

  return (
    <div className="relative grid size-32 shrink-0 place-items-center">
      <svg viewBox="0 0 120 120" className="size-full" role="img" aria-label={`Alarm ${alarmStateLabel(state)} perimeter ring`}>
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
        <HugeiconsIcon icon={alarmStateIcon(state)} size={28} style={{ color }} />
        <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
          {state === 'triggered' ? 'ALERT' : state.startsWith('armed') ? 'ARMED' : 'OFF'}
        </span>
      </div>
    </div>
  );
}

/** 1A · Shield Halo Console */
export function AlarmA({ snap, dispatch, compact }: SecurityConceptProps) {
  const alarm = snap.alarms.find((a) => a.id === snap.activeAlarmId) ?? snap.alarms[0];
  if (!alarm) return null;
  const tone = alarmTone(alarm.state);
  const perim = summarizePerimeter(snap);
  const motionCam = snap.cameras.find((c) => c.motion);

  return (
    <section
      aria-label="Alarm shield halo console"
      className={cn('pro-eb @container flex flex-col gap-4 p-4', alarm.state === 'triggered' && 'ring-2 ring-danger')}
      style={{ ['--eb-tint' as string]: TONE_TINT[tone] }}
    >
      <div className={cn('flex gap-4', compact ? 'flex-col items-center text-center' : 'flex-wrap items-center justify-between')}>
        <div className={cn('flex min-w-0 items-center gap-4', compact && 'flex-col')}>
          <ShieldHaloSvg state={alarm.state} tone={tone} zones={perim.zones} />

          <div className="min-w-0">
            <div className={cn('flex flex-wrap items-center gap-2', compact && 'justify-center')}>
              <h3 className="text-xl font-bold tracking-tight leading-none">{alarmStateLabel(alarm.state)}</h3>
              <Chip size="sm" variant="soft" color={tone}>
                <HugeiconsIcon icon={alarm.needsCode ? Key01Icon : Shield01Icon} size={12} />
                <Chip.Label>{alarm.needsCode ? 'PIN protected' : 'Instant arm'}</Chip.Label>
              </Chip>
            </div>

            <p className="mt-1.5 text-xs text-muted">
              {alarm.name} · by {alarm.changedBy} · {alarm.changedAgo}
            </p>

            <div className={cn('mt-2 flex flex-wrap items-center gap-1.5', compact && 'justify-center')}>
              {snap.people.map((p) => (
                <Chip key={p.id} size="sm" variant="soft" color={p.home ? 'success' : 'default'}>
                  <HugeiconsIcon icon={User02Icon} size={11} />
                  <Chip.Label>
                    {p.name} · {p.location}
                  </Chip.Label>
                </Chip>
              ))}
              {snap.alarms.length > 1 ? (
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => {
                    const idx = snap.alarms.findIndex((a) => a.id === alarm.id);
                    const next = snap.alarms[(idx + 1) % snap.alarms.length];
                    dispatch({ type: 'selectAlarm', alarmId: next.id });
                  }}
                  className="h-6 rounded-full px-2.5 text-[11px]"
                >
                  Switch panel ({snap.alarms.length})
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className={cn('flex flex-col gap-2', compact ? 'w-full' : 'items-end')}>
          <ToggleButtonGroup
            aria-label="Alarm mode"
            size="sm"
            selectionMode="single"
            disallowEmptySelection
            className={cn(compact ? 'grid w-full grid-cols-4' : 'flex-wrap')}
            selectedKeys={new Set([alarm.state])}
            onSelectionChange={(keys) => {
              const mode = [...keys][0] as AlarmModeId | undefined;
              if (mode) dispatch({ type: 'arm', mode });
            }}
          >
            {alarm.supportedModes.map((m) => (
              <ToggleButton key={m} id={m} className="gap-1.5 text-xs">
                <HugeiconsIcon icon={ALARM_MODE_META[m].icon} size={14} />
                {compact ? ALARM_MODE_META[m].short : ALARM_MODE_META[m].short}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <p className="text-[11px] text-muted tabular-nums">
            {perim.readyCount}/{perim.zones.length} perimeter zones sealed
          </p>
        </div>
      </div>

      {alarm.state === 'triggered' ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-danger/15 px-3 py-2.5 text-xs">
          <span className="flex items-center gap-2 font-semibold text-danger">
            <HugeiconsIcon icon={Alert02Icon} size={16} />
            Triggered by {alarm.triggerSource ?? 'perimeter sensor'}
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {perim.activeSirens > 0 ? (
              <Button size="sm" variant="primary" onPress={() => dispatch({ type: 'silenceSirens' })} className="gap-1.5 text-xs">
                <HugeiconsIcon icon={MegaphoneOffIcon} size={14} />
                Silence siren
              </Button>
            ) : null}
            {motionCam ? (
              <Button size="sm" variant="secondary" onPress={() => dispatch({ type: 'selectCamera', cameraId: motionCam.id })} className="gap-1.5 text-xs">
                <HugeiconsIcon icon={Camera01Icon} size={14} />
                View {motionCam.name}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/** 1B · Interactive Mode Deck */
export function AlarmB({ snap, dispatch, compact }: SecurityConceptProps) {
  const alarm = snap.alarms.find((a) => a.id === snap.activeAlarmId) ?? snap.alarms[0];
  if (!alarm) return null;
  const tone = alarmTone(alarm.state);
  const perim = summarizePerimeter(snap);

  return (
    <section
      aria-label="Alarm interactive mode deck"
      className={cn('pro-surface @container flex flex-col gap-3.5 p-4', alarm.state === 'triggered' && 'ring-2 ring-danger')}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-2xl"
            style={{ background: `color-mix(in oklab, ${TONE_COLOR[tone]} 16%, transparent)`, color: TONE_COLOR[tone] }}
          >
            <HugeiconsIcon icon={alarmStateIcon(alarm.state)} size={20} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold leading-tight">{alarmStateLabel(alarm.state)}</h3>
              <span className="text-xs text-muted">· {alarm.name}</span>
            </div>
            <p className="text-xs text-muted">
              {perim.lockedCount}/{perim.locks.length} locked · {perim.openDoorsWin} entries open · {alarm.changedAgo}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {perim.activeSirens > 0 ? (
            <Button size="sm" variant="primary" onPress={() => dispatch({ type: 'silenceSirens' })} className="gap-1.5 text-xs">
              <HugeiconsIcon icon={MegaphoneOffIcon} size={14} />
              Silence siren
            </Button>
          ) : null}
          <Chip size="sm" variant="soft" color={tone}>
            <HugeiconsIcon icon={alarm.state.startsWith('armed') ? CheckmarkCircle02Icon : Alert02Icon} size={12} />
            <Chip.Label>{alarm.changedBy}</Chip.Label>
          </Chip>
        </div>
      </header>

      <div className={cn('grid gap-2.5', compact ? 'grid-cols-2' : 'grid-cols-2 @[560px]:grid-cols-4')}>
        {alarm.supportedModes.map((mode) => {
          const meta = ALARM_MODE_META[mode];
          const active = alarm.state === mode;
          return (
            <Button
              key={mode}
              fullWidth
              variant={active ? 'primary' : 'tertiary'}
              onPress={() => dispatch({ type: 'arm', mode })}
              className={cn(
                'flex h-auto min-h-[74px] flex-col items-start justify-between gap-2 rounded-2xl p-3 text-left',
                active && 'ring-2 ring-[var(--accent)]/40'
              )}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <HugeiconsIcon icon={meta.icon} size={18} />
                {active ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} /> : null}
              </div>
              <div className="min-w-0 w-full">
                <span className="block truncate text-xs font-bold leading-tight">{meta.short}</span>
                <span className={cn('mt-0.5 block truncate text-[10px]', active ? 'opacity-85' : 'text-muted')}>
                  {meta.desc}
                </span>
              </div>
            </Button>
          );
        })}
      </div>
    </section>
  );
}

/** 1C · Sentinel Command Strip */
export function AlarmC({ snap, dispatch, compact }: SecurityConceptProps) {
  const alarm = snap.alarms.find((a) => a.id === snap.activeAlarmId) ?? snap.alarms[0];
  if (!alarm) return null;
  const tone = alarmTone(alarm.state);
  const perim = summarizePerimeter(snap);

  const tabItems = alarm.supportedModes.map((m) => ({
    id: m,
    title: ALARM_MODE_META[m].short,
    icon: ALARM_MODE_META[m].icon
  }));

  return (
    <section
      aria-label="Alarm sentinel command strip"
      className={cn('pro-surface flex flex-col gap-3 p-3.5', alarm.state === 'triggered' && 'ring-2 ring-danger')}
    >
      <div className={cn('flex gap-3', compact ? 'flex-col' : 'flex-wrap items-center justify-between')}>
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl"
            style={{ background: `color-mix(in oklab, ${TONE_COLOR[tone]} 16%, transparent)`, color: TONE_COLOR[tone] }}
          >
            <HugeiconsIcon icon={alarmStateIcon(alarm.state)} size={18} />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">{alarmStateLabel(alarm.state)}</p>
            <p className="text-[11px] text-muted">
              {alarm.name} · {alarm.changedAgo}
            </p>
          </div>
        </div>

        <div className={cn(compact ? 'w-full' : 'min-w-[280px]')}>
          <SmoothTab
            items={tabItems}
            value={alarm.supportedModes.includes(alarm.state as AlarmModeId) ? alarm.state : undefined}
            onChange={(id) => dispatch({ type: 'arm', mode: id as AlarmModeId })}
            label="Alarm modes"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] pt-2.5">
        <Chip size="sm" variant="soft" color={perim.lockedCount === perim.locks.length ? 'success' : 'warning'}>
          <HugeiconsIcon icon={SquareLock02Icon} size={12} />
          <Chip.Label>
            Locks {perim.lockedCount}/{perim.locks.length}
          </Chip.Label>
        </Chip>
        <Chip size="sm" variant="soft" color={perim.openDoorsWin === 0 ? 'success' : 'warning'}>
          <HugeiconsIcon icon={DoorIcon} size={12} />
          <Chip.Label>{perim.openDoorsWin === 0 ? 'Entries closed' : `${perim.openDoorsWin} open`}</Chip.Label>
        </Chip>
        <Chip size="sm" variant="soft" color={perim.openGarages === 0 ? 'success' : 'warning'}>
          <HugeiconsIcon icon={GarageIcon} size={12} />
          <Chip.Label>{perim.openGarages === 0 ? 'Garage closed' : 'Garage open'}</Chip.Label>
        </Chip>
        <Chip size="sm" variant="soft" color={perim.hazards === 0 ? 'success' : 'danger'}>
          <HugeiconsIcon icon={Alert02Icon} size={12} />
          <Chip.Label>{perim.hazards === 0 ? 'Hazards clear' : `${perim.hazards} hazard`}</Chip.Label>
        </Chip>
        {perim.activeSirens > 0 ? (
          <Button size="sm" variant="primary" onPress={() => dispatch({ type: 'silenceSirens' })} className="ml-auto h-6 gap-1 rounded-full px-2.5 text-[11px]">
            <HugeiconsIcon icon={MegaphoneOffIcon} size={12} />
            Silence
          </Button>
        ) : null}
      </div>
    </section>
  );
}
