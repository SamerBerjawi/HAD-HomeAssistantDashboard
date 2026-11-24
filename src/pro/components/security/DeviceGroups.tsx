import { useMemo, useState } from 'react';
import { Button, SearchField, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  AlarmSmokeIcon,
  Alert02Icon,
  BatteryLowIcon,
  DoorIcon,
  GridViewIcon,
  Motion01Icon,
  SecurityCheckIcon,
  SquareLock02Icon,
  WifiDisconnected01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { entityName } from '../../hooks/useSecurityData';
import {
  deviceItem,
  kindRank,
  LOW_BATTERY_THRESHOLD,
  type DeviceItem,
  type SecurityEntities,
  type Tone
} from '../../lib/securityLogic';
import { GarageAction, KIND_ICON, LockAction, SirenAction } from './DeviceRow';

type CategoryFilter = 'all' | 'locks' | 'openings' | 'motion' | 'hazards' | 'issues';

const TONE_COLOR: Record<Tone, string> = {
  default: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)'
};

const CATEGORY_META: ReadonlyArray<{ id: CategoryFilter; label: string; icon: IconSvgElement }> = [
  { id: 'all', label: 'All', icon: GridViewIcon },
  { id: 'locks', label: 'Locks', icon: SquareLock02Icon },
  { id: 'openings', label: 'Openings', icon: DoorIcon },
  { id: 'motion', label: 'Motion', icon: Motion01Icon },
  { id: 'hazards', label: 'Hazards', icon: AlarmSmokeIcon },
  { id: 'issues', label: 'Issues', icon: Alert02Icon }
];

interface DeviceGroupsProps {
  entities: SecurityEntities;
  deviceBatteryByEntityId?: Record<string, number>;
  onError: (m: string | null) => void;
  onSelectDevice?: (item: DeviceItem) => void;
}

/**
 * Device Groups — Concept B · Interactive Tile Deck (DESIGN.md 7.5, SECURITY.md §3):
 * Area-tile-inspired visual device grid with category filters, optional search when 8+ devices,
 * direct Lock / Garage / Siren controls (press-and-hold on Unlock / Open / Test), and tap to
 * inspect in SecurityDeviceSheet.
 */
export function DeviceGroups({
  entities,
  deviceBatteryByEntityId = {},
  onError,
  onSelectDevice
}: DeviceGroupsProps) {
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [query, setQuery] = useState('');

  const allItems = useMemo<DeviceItem[]>(() => {
    const list: DeviceItem[] = [
      ...entities.locks.map((e) => deviceItem(e, 'lock')),
      ...(entities.garages ?? []).map((e) => deviceItem(e, 'garage')),
      ...(entities.sirens ?? []).map((e) => deviceItem(e, 'siren')),
      ...entities.doorSensors.map((e) => deviceItem(e, 'door')),
      ...entities.windowSensors.map((e) => deviceItem(e, 'window')),
      ...entities.motionSensors.map((e) => deviceItem(e, 'motion')),
      ...entities.smokeSensors.map((e) => deviceItem(e, 'smoke')),
      ...entities.leakSensors.map((e) => deviceItem(e, 'leak'))
    ];
    return list.sort(
      (a, b) =>
        Number(b.problem) - Number(a.problem) ||
        (b.tone === 'danger' ? 1 : 0) - (a.tone === 'danger' ? 1 : 0) ||
        kindRank(a.kind) - kindRank(b.kind) ||
        entityName(a.entity).localeCompare(entityName(b.entity))
    );
  }, [entities]);

  const availableCategories = useMemo(() => {
    return CATEGORY_META.filter((c) => {
      if (c.id === 'all' || c.id === 'issues') return true;
      if (c.id === 'locks') return allItems.some((i) => i.kind === 'lock' || i.kind === 'garage');
      if (c.id === 'openings') return allItems.some((i) => i.kind === 'door' || i.kind === 'window');
      if (c.id === 'motion') return allItems.some((i) => i.kind === 'motion');
      return allItems.some((i) => i.kind === 'smoke' || i.kind === 'leak' || i.kind === 'siren');
    });
  }, [allItems]);

  const effectiveFilter = availableCategories.some((c) => c.id === filter) ? filter : 'all';

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (effectiveFilter === 'locks' && item.kind !== 'lock' && item.kind !== 'garage') return false;
      if (effectiveFilter === 'openings' && item.kind !== 'door' && item.kind !== 'window') return false;
      if (effectiveFilter === 'motion' && item.kind !== 'motion') return false;
      if (
        effectiveFilter === 'hazards' &&
        item.kind !== 'smoke' &&
        item.kind !== 'leak' &&
        item.kind !== 'siren'
      ) {
        return false;
      }
      if (effectiveFilter === 'issues' && !item.problem && item.tone !== 'warning' && item.tone !== 'danger') {
        return false;
      }
      if (q) {
        const hay = `${entityName(item.entity)} ${item.entity.area?.name ?? ''} ${item.stateLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [allItems, effectiveFilter, query]);

  if (allItems.length === 0) return null;

  return (
    <section aria-label="Devices" className="pro-surface flex flex-col gap-3.5 p-4 sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={GridViewIcon} size={16} className="text-[var(--accent)]" />
          Sensor & lock tiles
          <span className="text-xs font-normal text-muted tabular-nums">· {allItems.length}</span>
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {allItems.length >= 8 ? (
            <SearchField
              aria-label="Search security devices"
              value={query}
              onChange={setQuery}
              className="w-44 sm:w-52"
            >
              <SearchField.Group className="h-8 min-h-8 rounded-xl px-2">
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Filter devices…" className="text-xs" />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
          ) : null}

          <ToggleButtonGroup
            aria-label="Filter device tiles"
            size="sm"
            selectionMode="single"
            disallowEmptySelection
            className="flex-wrap"
            selectedKeys={new Set([effectiveFilter])}
            onSelectionChange={(keys) => {
              const next = [...keys][0] as CategoryFilter | undefined;
              if (next) setFilter(next);
            }}
          >
            {availableCategories.map((c) => (
              <ToggleButton key={c.id} id={c.id} className="gap-1 text-xs">
                <HugeiconsIcon icon={c.icon} size={13} />
                {c.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      </header>

      {visibleItems.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-2xl bg-default/40 px-4 py-3 text-xs text-muted">
          <HugeiconsIcon icon={SecurityCheckIcon} size={16} className="text-success" />
          {effectiveFilter === 'issues' && !query.trim()
            ? 'No active security issues across your devices.'
            : 'No security devices match your filter.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {visibleItems.map((item) => {
            const name = entityName(item.entity);
            const isOffline = item.entity.state === 'unavailable' || item.entity.state === 'unknown';
            const battery = deviceBatteryByEntityId[item.entity.entity_id];
            const isLowBattery = typeof battery === 'number' && battery <= LOW_BATTERY_THRESHOLD;
            const hasDirectAction =
              !isOffline &&
              (item.kind === 'lock' || item.kind === 'garage' || item.kind === 'siren');

            return (
              <article
                key={item.entity.entity_id}
                className="flex flex-col justify-between gap-3 rounded-2xl p-3"
                style={{
                  background: item.problem
                    ? `color-mix(in oklab, ${TONE_COLOR[item.tone]} 12%, var(--background))`
                    : 'color-mix(in oklab, var(--default) 55%, transparent)'
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-xl"
                    style={{
                      background: `color-mix(in oklab, ${TONE_COLOR[item.tone]} 18%, transparent)`,
                      color: TONE_COLOR[item.tone]
                    }}
                  >
                    <HugeiconsIcon
                      icon={isOffline ? WifiDisconnected01Icon : KIND_ICON[item.kind]}
                      size={18}
                    />
                  </span>

                  {hasDirectAction ? (
                    item.kind === 'lock' ? (
                      <LockAction item={item} onError={onError} />
                    ) : item.kind === 'garage' ? (
                      <GarageAction item={item} onError={onError} />
                    ) : (
                      <SirenAction item={item} onError={onError} />
                    )
                  ) : (
                    <span
                      className="mt-1 size-2.5 shrink-0 rounded-full"
                      style={{ background: TONE_COLOR[item.tone] }}
                      aria-hidden
                    />
                  )}
                </div>

                <Button
                  variant="ghost"
                  fullWidth
                  onPress={() => onSelectDevice?.(item)}
                  aria-label={`Inspect ${name} (${item.stateLabel})`}
                  className="-mx-1.5 flex h-auto flex-col items-start gap-0.5 rounded-xl px-1.5 py-1 text-left"
                >
                  <span className="w-full truncate text-xs font-bold leading-tight text-foreground">
                    {name}
                  </span>
                  <span className="flex w-full items-center gap-1.5 text-[11px] text-muted">
                    <span className="truncate">
                      {item.entity.area?.name ? `${item.entity.area.name} · ` : ''}
                      {item.stateLabel}
                    </span>
                    {isLowBattery ? (
                      <span className="ml-auto inline-flex shrink-0 items-center gap-0.5 font-mono font-semibold text-warning">
                        <HugeiconsIcon icon={BatteryLowIcon} size={11} />
                        {battery}%
                      </span>
                    ) : null}
                  </span>
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
