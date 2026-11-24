/**
 * Section 2 — Needs Attention / Perimeter Readiness:
 * A · Triage Priority Stack (severity-grouped rows with 1-tap Lock / Close / Silence actions)
 * B · Perimeter Radar Matrix (4-zone visual status grid lighting up green/orange/red with click filter)
 * C · Compact Alert Ticker (slim 1-row banner when clear, dense severity pills + quick-fix bar when active)
 */
import { useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert02Icon,
  BatteryLowIcon,
  CheckmarkCircle02Icon,
  DoorIcon,
  GarageIcon,
  MegaphoneOffIcon,
  Shield01Icon,
  SquareLock02Icon,
  WifiOff01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { Tone } from '../../../../lib/securityLogic';
import type { StudioSecurityDevice } from '../studioSecurity';
import { deviceKindIcon, TONE_COLOR } from './securityHelpers';
import type { SecurityConceptProps } from './types';

function collectIssues(snap: SecurityConceptProps['snap']) {
  const critical = snap.devices.filter((d) => d.problem && d.tone === 'danger');
  const warning = snap.devices.filter((d) => d.problem && d.tone === 'warning');
  const lowBattery = snap.devices.filter((d) => typeof d.batteryPct === 'number' && d.batteryPct <= 20);
  const unlockedLocks = snap.devices.filter((d) => d.kind === 'lock' && d.state === 'unlocked');
  const openGarages = snap.devices.filter((d) => d.kind === 'garage' && d.state === 'open');
  const activeSirens = snap.devices.filter((d) => d.kind === 'siren' && d.state === 'on');
  const totalCount = critical.length + warning.length + lowBattery.length;
  return { critical, warning, lowBattery, unlockedLocks, openGarages, activeSirens, totalCount };
}

/** 2A · Triage Priority Stack */
export function AttentionA({ snap, dispatch, compact }: SecurityConceptProps) {
  const issues = collectIssues(snap);

  if (issues.totalCount === 0) {
    if (compact) {
      return (
        <section aria-label="Perimeter status" className="pro-surface flex items-center justify-between gap-2 px-3.5 py-2.5">
          <span className="flex items-center gap-2 text-xs font-semibold text-success">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
            All secure
          </span>
          <span className="text-[11px] text-muted">0 open · all locks sealed</span>
        </section>
      );
    }
    return (
      <section aria-label="Perimeter status" className="pro-surface flex h-full flex-col items-center justify-center gap-2.5 p-6 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-success/15 text-success">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} />
        </span>
        <div>
          <h3 className="text-sm font-semibold">All secure</h3>
          <p className="mt-0.5 text-xs text-muted">All doors, windows, locks, and hazard sensors report clear.</p>
        </div>
      </section>
    );
  }

  const renderRow = (d: StudioSecurityDevice) => (
    <div key={d.id} className="flex items-center justify-between gap-2 rounded-xl bg-default/50 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="grid size-7 shrink-0 place-items-center rounded-lg"
          style={{
            background: `color-mix(in oklab, ${TONE_COLOR[d.tone]} 16%, transparent)`,
            color: TONE_COLOR[d.tone]
          }}
        >
          <HugeiconsIcon icon={d.offline ? WifiOff01Icon : deviceKindIcon(d)} size={15} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold">{d.name}</p>
          <p className="truncate text-[11px] text-muted">
            {d.area} · {d.stateLabel}
          </p>
        </div>
      </div>

      {d.kind === 'lock' && d.state === 'unlocked' ? (
        <Button size="sm" variant="secondary" onPress={() => dispatch({ type: 'toggleLock', deviceId: d.id })} className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[11px]">
          <HugeiconsIcon icon={SquareLock02Icon} size={12} />
          Lock
        </Button>
      ) : d.kind === 'garage' && d.state === 'open' ? (
        <Button size="sm" variant="secondary" onPress={() => dispatch({ type: 'toggleGarage', deviceId: d.id })} className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[11px]">
          <HugeiconsIcon icon={GarageIcon} size={12} />
          Close
        </Button>
      ) : d.kind === 'siren' && d.state === 'on' ? (
        <Button size="sm" variant="primary" onPress={() => dispatch({ type: 'silenceSirens' })} className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[11px]">
          <HugeiconsIcon icon={MegaphoneOffIcon} size={12} />
          Silence
        </Button>
      ) : (
        <Chip size="sm" variant="soft" color={d.tone}>
          <Chip.Label>{d.stateLabel}</Chip.Label>
        </Chip>
      )}
    </div>
  );

  return (
    <section aria-label="Needs attention priority stack" className="pro-surface flex h-full flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon
            icon={Alert02Icon}
            size={16}
            className={issues.critical.length > 0 ? 'text-danger' : 'text-warning'}
          />
          Needs attention ({issues.totalCount})
        </span>
        {issues.unlockedLocks.length >= 2 ? (
          <Button size="sm" variant="primary" onPress={() => dispatch({ type: 'lockAll' })} className="h-7 gap-1 rounded-full px-2.5 text-xs">
            <HugeiconsIcon icon={SquareLock02Icon} size={13} />
            Lock all ({issues.unlockedLocks.length})
          </Button>
        ) : null}
      </header>

      <div className="flex flex-col gap-2">
        {issues.critical.map(renderRow)}
        {issues.warning.map(renderRow)}
        {issues.lowBattery.map((d) => (
          <div key={`bat-${d.id}`} className="flex items-center justify-between gap-2 rounded-xl bg-default/40 px-3 py-2 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-muted">
              <HugeiconsIcon icon={BatteryLowIcon} size={15} className="shrink-0 text-warning" />
              <span className="truncate font-medium text-foreground">{d.name}</span>
            </span>
            <Chip size="sm" variant="soft" color="warning">
              <Chip.Label className="tabular-nums">{d.batteryPct}%</Chip.Label>
            </Chip>
          </div>
        ))}
      </div>
    </section>
  );
}

/** 2B · Perimeter Radar Matrix */
export function AttentionB({ snap, dispatch }: SecurityConceptProps) {
  const [selectedZone, setSelectedZone] = useState<'locks' | 'entries' | 'hazards' | 'health' | null>(null);
  const issues = collectIssues(snap);

  const lockItems = snap.devices.filter((d) => d.kind === 'lock');
  const entryItems = snap.devices.filter((d) => d.kind === 'door' || d.kind === 'window' || d.kind === 'garage');
  const hazardItems = snap.devices.filter((d) => d.kind === 'smoke' || d.kind === 'leak' || d.kind === 'siren');
  const healthIssues = snap.devices.filter((d) => d.offline || (typeof d.batteryPct === 'number' && d.batteryPct <= 20));

  const zones: {
    id: 'locks' | 'entries' | 'hazards' | 'health';
    title: string;
    icon: typeof SquareLock02Icon;
    tone: Tone;
    summary: string;
    items: StudioSecurityDevice[];
  }[] = [
    {
      id: 'locks',
      title: 'Locks',
      icon: SquareLock02Icon,
      tone: lockItems.some((d) => d.tone === 'danger') ? 'danger' : lockItems.some((d) => d.problem) ? 'warning' : 'success',
      summary: lockItems.some((d) => d.problem)
        ? `${lockItems.filter((d) => d.problem).length} need action`
        : `${lockItems.length}/${lockItems.length} locked`,
      items: lockItems.filter((d) => d.problem)
    },
    {
      id: 'entries',
      title: 'Entries',
      icon: DoorIcon,
      tone: entryItems.some((d) => d.tone === 'danger') ? 'danger' : entryItems.some((d) => d.problem) ? 'warning' : 'success',
      summary: entryItems.some((d) => d.problem)
        ? `${entryItems.filter((d) => d.problem).length} open`
        : 'All closed',
      items: entryItems.filter((d) => d.problem)
    },
    {
      id: 'hazards',
      title: 'Hazards',
      icon: Alert02Icon,
      tone: hazardItems.some((d) => d.problem) ? 'danger' : 'success',
      summary: hazardItems.some((d) => d.problem)
        ? `${hazardItems.filter((d) => d.problem).length} active`
        : 'All clear',
      items: hazardItems.filter((d) => d.problem)
    },
    {
      id: 'health',
      title: 'Health',
      icon: BatteryLowIcon,
      tone: healthIssues.some((d) => d.offline) ? 'danger' : healthIssues.length > 0 ? 'warning' : 'success',
      summary: healthIssues.length > 0 ? `${healthIssues.length} alert` : '100% online',
      items: healthIssues
    }
  ];

  const activeZone = zones.find((z) => z.id === selectedZone && z.items.length > 0) ?? zones.find((z) => z.items.length > 0) ?? null;

  return (
    <section aria-label="Perimeter radar matrix" className="pro-surface flex h-full flex-col gap-3 p-4">
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={Shield01Icon} size={16} className="text-[var(--accent)]" />
          Perimeter readiness
        </span>
        {issues.unlockedLocks.length > 0 ? (
          <Button size="sm" variant="primary" onPress={() => dispatch({ type: 'lockAll' })} className="h-7 gap-1 rounded-full px-2.5 text-xs">
            <HugeiconsIcon icon={SquareLock02Icon} size={12} />
            Lock all
          </Button>
        ) : (
          <Chip size="sm" variant="soft" color={issues.totalCount === 0 ? 'success' : 'warning'}>
            <Chip.Label>{issues.totalCount === 0 ? 'Sealed' : `${issues.totalCount} active`}</Chip.Label>
          </Chip>
        )}
      </header>

      <div className="grid grid-cols-2 gap-2">
        {zones.map((z) => (
          <Button
            key={z.id}
            fullWidth
            variant="tertiary"
            onPress={() => setSelectedZone(z.id)}
            className={cn(
              'flex h-auto flex-col items-start gap-1.5 rounded-2xl p-3 text-left',
              activeZone?.id === z.id && z.items.length > 0 && 'ring-2 ring-[var(--accent)]'
            )}
            style={{
              background: `color-mix(in oklab, ${TONE_COLOR[z.tone]} 12%, var(--surface))`
            }}
          >
            <div className="flex w-full items-center justify-between">
              <HugeiconsIcon icon={z.icon} size={16} style={{ color: TONE_COLOR[z.tone] }} />
              <span className="size-2 rounded-full" style={{ background: TONE_COLOR[z.tone] }} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-foreground">{z.title}</span>
              <span className="block text-[11px] text-muted">{z.summary}</span>
            </div>
          </Button>
        ))}
      </div>

      {activeZone && activeZone.items.length > 0 ? (
        <div className="flex flex-col gap-1.5 rounded-xl bg-default/45 p-2.5 text-xs">
          {activeZone.items.slice(0, 3).map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2">
              <span className="truncate font-medium">
                {d.name} <span className="text-muted">· {d.stateLabel}</span>
              </span>
              {d.kind === 'lock' && d.state === 'unlocked' ? (
                <Button size="sm" variant="secondary" onPress={() => dispatch({ type: 'toggleLock', deviceId: d.id })} className="h-6 rounded-full px-2 text-[10px]">
                  Lock
                </Button>
              ) : d.kind === 'garage' && d.state === 'open' ? (
                <Button size="sm" variant="secondary" onPress={() => dispatch({ type: 'toggleGarage', deviceId: d.id })} className="h-6 rounded-full px-2 text-[10px]">
                  Close
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/** 2C · Compact Alert Ticker */
export function AttentionC({ snap, dispatch }: SecurityConceptProps) {
  const issues = collectIssues(snap);

  if (issues.totalCount === 0) {
    return (
      <section aria-label="Compact perimeter banner" className="pro-surface flex items-center justify-between gap-3 px-4 py-3">
        <span className="flex items-center gap-2 text-xs font-semibold text-success">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
          Perimeter sealed — nothing needs attention
        </span>
        <span className="text-[11px] text-muted tabular-nums">{snap.devices.length} devices OK</span>
      </section>
    );
  }

  return (
    <section aria-label="Compact alert ticker" className="pro-surface flex flex-col gap-2.5 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          <HugeiconsIcon
            icon={Alert02Icon}
            size={15}
            className={issues.critical.length > 0 ? 'text-danger' : 'text-warning'}
          />
          {issues.totalCount} alert{issues.totalCount > 1 ? 's' : ''}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {issues.activeSirens.length > 0 ? (
            <Button size="sm" variant="primary" onPress={() => dispatch({ type: 'silenceSirens' })} className="h-7 gap-1 rounded-full px-2.5 text-[11px]">
              <HugeiconsIcon icon={MegaphoneOffIcon} size={12} />
              Silence
            </Button>
          ) : null}
          {issues.unlockedLocks.length > 0 ? (
            <Button size="sm" variant="secondary" onPress={() => dispatch({ type: 'lockAll' })} className="h-7 gap-1 rounded-full px-2.5 text-[11px]">
              <HugeiconsIcon icon={SquareLock02Icon} size={12} />
              Lock all ({issues.unlockedLocks.length})
            </Button>
          ) : null}
          {issues.openGarages.map((g) => (
            <Button key={g.id} size="sm" variant="tertiary" onPress={() => dispatch({ type: 'toggleGarage', deviceId: g.id })} className="h-7 gap-1 rounded-full px-2.5 text-[11px]">
              <HugeiconsIcon icon={GarageIcon} size={12} />
              Close garage
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[...issues.critical, ...issues.warning].map((d) => (
          <Chip key={d.id} size="sm" variant="soft" color={d.tone}>
            <HugeiconsIcon icon={d.offline ? WifiOff01Icon : deviceKindIcon(d)} size={12} />
            <Chip.Label>
              {d.name}: {d.stateLabel}
            </Chip.Label>
          </Chip>
        ))}
        {issues.lowBattery.map((d) => (
          <Chip key={`lb-${d.id}`} size="sm" variant="soft" color="warning">
            <HugeiconsIcon icon={BatteryLowIcon} size={12} />
            <Chip.Label>
              {d.name} ({d.batteryPct}%)
            </Chip.Label>
          </Chip>
        ))}
      </div>
    </section>
  );
}
