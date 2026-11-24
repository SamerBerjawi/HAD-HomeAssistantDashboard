/**
 * Section 5 — Device Groups + Edge States Preview:
 * A · Adaptive Bento Cards (By type / By room toggle + domain cards + Lock/Close actions)
 * B · Interactive Tile Deck (Area-tile-inspired visual status tiles + category filter pills)
 * C · Floor-by-Floor Security Accordion (Ground / First / Exterior expandable security tree)
 */
import { useMemo, useState } from 'react';
import { Alert, Button, Chip, Skeleton, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert02Icon,
  ArrowDown01Icon,
  ArrowRight01Icon,
  BatteryLowIcon,
  CheckmarkCircle02Icon,
  GarageIcon,
  GridViewIcon,
  Home01Icon,
  Layers01Icon,
  MegaphoneOffIcon,
  Shield01Icon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  WifiOff01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { StudioSecurityDevice } from '../studioSecurity';
import { deviceGroupLabel, deviceKindIcon, TONE_COLOR } from './securityHelpers';
import type { SecurityConceptProps } from './types';

function DeviceActionControl({
  device,
  dispatch
}: {
  device: StudioSecurityDevice;
  dispatch: SecurityConceptProps['dispatch'];
}) {
  if (device.kind === 'lock') {
    const locked = device.state === 'locked';
    return (
      <Button
        size="sm"
        variant={locked ? 'tertiary' : 'primary'}
        onPress={() => dispatch({ type: 'toggleLock', deviceId: device.id })}
        className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[11px]"
        aria-label={locked ? `Hold to unlock ${device.name}` : `Lock ${device.name}`}
      >
        <HugeiconsIcon icon={locked ? SquareUnlock02Icon : SquareLock02Icon} size={12} />
        {locked ? 'Unlock' : 'Lock'}
      </Button>
    );
  }
  if (device.kind === 'garage') {
    const open = device.state === 'open';
    return (
      <Button
        size="sm"
        variant={open ? 'primary' : 'tertiary'}
        onPress={() => dispatch({ type: 'toggleGarage', deviceId: device.id })}
        className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[11px]"
      >
        <HugeiconsIcon icon={GarageIcon} size={12} />
        {open ? 'Close' : 'Open'}
      </Button>
    );
  }
  if (device.kind === 'siren' && device.state === 'on') {
    return (
      <Button
        size="sm"
        variant="primary"
        onPress={() => dispatch({ type: 'silenceSirens' })}
        className="h-7 shrink-0 gap-1 rounded-full px-2.5 text-[11px]"
      >
        <HugeiconsIcon icon={MegaphoneOffIcon} size={12} />
        Silence
      </Button>
    );
  }
  return (
    <Chip size="sm" variant="soft" color={device.tone}>
      <Chip.Label>{device.stateLabel}</Chip.Label>
    </Chip>
  );
}

/** 5A · Adaptive Bento Cards */
export function DeviceGroupsA({ snap, dispatch, compact }: SecurityConceptProps) {
  const [groupBy, setGroupBy] = useState<'type' | 'room'>('type');

  const groups = useMemo(() => {
    const map = new Map<string, StudioSecurityDevice[]>();
    for (const d of snap.devices) {
      const key = groupBy === 'type' ? deviceGroupLabel(d.kind) : d.area;
      const list = map.get(key) ?? [];
      list.push(d);
      map.set(key, list);
    }
    return [...map.entries()]
      .map(([title, items]) => ({
        title,
        items: [...items].sort((a, b) => Number(b.problem) - Number(a.problem)),
        problems: items.filter((i) => i.problem).length
      }))
      .sort((a, b) => b.problems - a.problems || b.items.length - a.items.length);
  }, [snap.devices, groupBy]);

  return (
    <section aria-label="Security device bento groups" className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={Layers01Icon} size={16} className="text-[var(--accent)]" />
          Security devices ({snap.devices.length})
        </span>
        <ToggleButtonGroup
          aria-label="Group devices by"
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={new Set([groupBy])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as 'type' | 'room' | undefined;
            if (next) setGroupBy(next);
          }}
        >
          <ToggleButton id="type" className="text-xs">By type</ToggleButton>
          <ToggleButton id="room" className="text-xs">By room</ToggleButton>
        </ToggleButtonGroup>
      </header>

      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3')}>
        {groups.map((g) => (
          <article key={g.title} className="pro-surface flex flex-col gap-2.5 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">{g.title}</h3>
              <Chip size="sm" variant="soft" color={g.problems > 0 ? 'warning' : 'success'}>
                <Chip.Label>{g.problems > 0 ? `${g.problems} attention` : `${g.items.length} OK`}</Chip.Label>
              </Chip>
            </div>
            <div className="flex flex-col gap-2">
              {g.items.map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2 rounded-xl bg-default/45 px-2.5 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-lg"
                      style={{
                        background: d.problem
                          ? `color-mix(in oklab, ${TONE_COLOR[d.tone]} 18%, transparent)`
                          : 'var(--default)',
                        color: d.problem ? TONE_COLOR[d.tone] : 'var(--foreground)'
                      }}
                    >
                      <HugeiconsIcon icon={d.offline ? WifiOff01Icon : deviceKindIcon(d)} size={14} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{d.name}</p>
                      <p className="flex items-center gap-1.5 truncate text-[10px] text-muted">
                        <span>{groupBy === 'type' ? d.area : deviceGroupLabel(d.kind)}</span>
                        {typeof d.batteryPct === 'number' && d.batteryPct <= 20 ? (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-warning">
                            <HugeiconsIcon icon={BatteryLowIcon} size={11} />
                            {d.batteryPct}%
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                  <DeviceActionControl device={d} dispatch={dispatch} />
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** 5B · Interactive Tile Deck */
export function DeviceGroupsB({ snap, dispatch, compact }: SecurityConceptProps) {
  const [filter, setFilter] = useState<'all' | 'locks' | 'openings' | 'motion' | 'hazards'>('all');

  const items = useMemo(() => {
    const list = snap.devices.filter((d) => {
      if (filter === 'all') return true;
      if (filter === 'locks') return d.kind === 'lock' || d.kind === 'garage';
      if (filter === 'openings') return d.kind === 'door' || d.kind === 'window';
      if (filter === 'motion') return d.kind === 'motion';
      return d.kind === 'smoke' || d.kind === 'leak' || d.kind === 'siren';
    });
    return [...list].sort((a, b) => Number(b.problem) - Number(a.problem));
  }, [snap.devices, filter]);

  return (
    <section aria-label="Interactive security tile deck" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={GridViewIcon} size={16} className="text-[var(--accent)]" />
          Sensor & lock tiles
        </span>
        <ToggleButtonGroup
          aria-label="Filter device tiles"
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          className="flex-wrap"
          selectedKeys={new Set([filter])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as typeof filter | undefined;
            if (next) setFilter(next);
          }}
        >
          <ToggleButton id="all" className="text-xs">All</ToggleButton>
          <ToggleButton id="locks" className="text-xs">Locks</ToggleButton>
          <ToggleButton id="openings" className="text-xs">Openings</ToggleButton>
          <ToggleButton id="motion" className="text-xs">Motion</ToggleButton>
          <ToggleButton id="hazards" className="text-xs">Hazards</ToggleButton>
        </ToggleButtonGroup>
      </header>

      <div className={cn('grid gap-2.5', compact ? 'grid-cols-2' : 'grid-cols-3 lg:grid-cols-4')}>
        {items.map((d) => (
          <article
            key={d.id}
            className="flex flex-col justify-between gap-3 rounded-2xl p-3"
            style={{
              background: d.problem
                ? `color-mix(in oklab, ${TONE_COLOR[d.tone]} 12%, var(--background))`
                : 'color-mix(in oklab, var(--default) 55%, transparent)'
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className="grid size-9 place-items-center rounded-xl"
                style={{
                  background: `color-mix(in oklab, ${TONE_COLOR[d.tone]} 18%, transparent)`,
                  color: TONE_COLOR[d.tone]
                }}
              >
                <HugeiconsIcon icon={d.offline ? WifiOff01Icon : deviceKindIcon(d)} size={18} />
              </span>
              {d.kind === 'lock' || d.kind === 'garage' || (d.kind === 'siren' && d.state === 'on') ? (
                <DeviceActionControl device={d} dispatch={dispatch} />
              ) : (
                <span className="size-2.5 rounded-full" style={{ background: TONE_COLOR[d.tone] }} />
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-xs font-bold leading-tight">{d.name}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted">
                {d.area} · {d.stateLabel}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** 5C · Floor-by-Floor Security Accordion */
export function DeviceGroupsC({ snap, dispatch }: SecurityConceptProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const floors = useMemo(() => {
    const map = new Map<string, StudioSecurityDevice[]>();
    for (const d of snap.devices) {
      const list = map.get(d.floor) ?? [];
      list.push(d);
      map.set(d.floor, list);
    }
    return [...map.entries()].map(([floor, items]) => ({
      floor,
      items: [...items].sort((a, b) => Number(b.problem) - Number(a.problem)),
      problems: items.filter((i) => i.problem).length
    }));
  }, [snap.devices]);

  const toggle = (floor: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(floor)) next.delete(floor);
      else next.add(floor);
      return next;
    });
  };

  return (
    <section aria-label="Floor-by-floor security tree" className="pro-surface flex flex-col gap-2.5 p-4">
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={Home01Icon} size={16} className="text-[var(--accent)]" />
          By floor & room
        </span>
        <span className="text-xs text-muted">{floors.length} zones</span>
      </header>

      <div className="flex flex-col gap-2">
        {floors.map((f) => {
          const isClosed = collapsed.has(f.floor);
          return (
            <div key={f.floor} className="rounded-2xl bg-default/40 p-2">
              <Button
                variant="ghost"
                fullWidth
                onPress={() => toggle(f.floor)}
                className="flex h-9 items-center justify-between gap-2 px-2"
              >
                <span className="flex items-center gap-2 text-xs font-bold">
                  <HugeiconsIcon icon={isClosed ? ArrowRight01Icon : ArrowDown01Icon} size={14} className="text-muted" />
                  {f.floor}
                  <span className="font-normal text-muted">({f.items.length})</span>
                </span>
                <Chip size="sm" variant="soft" color={f.problems > 0 ? 'warning' : 'success'}>
                  <HugeiconsIcon icon={f.problems > 0 ? Alert02Icon : CheckmarkCircle02Icon} size={11} />
                  <Chip.Label>{f.problems > 0 ? `${f.problems} open/alert` : 'Sealed'}</Chip.Label>
                </Chip>
              </Button>

              {!isClosed ? (
                <div className="mt-1.5 flex flex-col divide-y divide-[color-mix(in_oklab,var(--foreground)_8%,transparent)] px-2">
                  {f.items.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-2 py-2 text-xs">
                      <span className="flex min-w-0 items-center gap-2">
                        <HugeiconsIcon icon={deviceKindIcon(d)} size={14} style={{ color: TONE_COLOR[d.tone] }} className="shrink-0" />
                        <span className="truncate font-medium">{d.name}</span>
                        <span className="hidden truncate text-[11px] text-muted sm:inline">· {d.area}</span>
                      </span>
                      <DeviceActionControl device={d} dispatch={dispatch} />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Edge States Preview: Loading Skeleton, Empty No-Devices Card, and Error Alert. */
export function SecurityStatesPreview({ compact }: { compact?: boolean }) {
  return (
    <div className={cn('grid gap-4', compact ? 'grid-cols-1' : 'grid-cols-3')}>
      <article className="pro-surface flex flex-col gap-3 p-4" aria-label="Loading skeleton">
        <p className="text-xs font-semibold text-muted">Initial loading state</p>
        <Skeleton className="h-24 rounded-xl" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
        <Skeleton className="h-20 rounded-xl" />
      </article>

      <article className="pro-surface flex flex-col items-center justify-center gap-3 p-5 text-center">
        <span className="pro-soft grid size-12 place-items-center rounded-2xl">
          <HugeiconsIcon icon={Shield01Icon} size={24} />
        </span>
        <div>
          <h3 className="text-sm font-semibold">No security devices yet</h3>
          <p className="mt-1 text-xs text-muted">
            Add alarm panels, locks, cameras, or contact and hazard sensors in Home Assistant and they appear here.
          </p>
        </div>
      </article>

      <article className="pro-surface flex flex-col justify-between gap-3 p-4">
        <p className="text-xs font-semibold text-muted">HA service error state</p>
        <Alert status="danger">
          <Alert.Indicator>
            <HugeiconsIcon icon={Alert02Icon} size={18} />
          </Alert.Indicator>
          <Alert.Content>
            <Alert.Title>Couldn’t arm Home Alarm</Alert.Title>
            <Alert.Description>PIN rejected by Home Assistant panel. Try again.</Alert.Description>
          </Alert.Content>
        </Alert>
      </article>
    </div>
  );
}
