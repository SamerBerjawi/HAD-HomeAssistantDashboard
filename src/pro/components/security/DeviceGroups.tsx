import { useMemo, useState } from 'react';
import { SearchField, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  AlarmSmokeIcon,
  Alert02Icon,
  BlindsIcon,
  DashboardSquare01Icon,
  DashboardSquare02Icon,
  DoorIcon,
  DropletIcon,
  GarageIcon,
  Megaphone01Icon,
  Motion01Icon,
  SecurityCheckIcon,
  Sofa01Icon,
  SquareLock02Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { entityName } from '../../hooks/useSecurityData';
import {
  bentoSpan,
  groupByRoom,
  groupByType,
  groupHasDanger,
  packOrder,
  type DeviceGroup,
  type DeviceItem,
  type SecurityEntities
} from '../../lib/securityLogic';
import { BentoCard, BentoGrid } from '../../ui/magicui/BentoGrid';
import { DeviceRow } from './DeviceRow';

type View = 'type' | 'room';
type FilterMode = 'all' | 'issues';
const VIEW_KEY = 'had_pro_security_group_view';

const GROUP_ICON: Record<DeviceGroup['kind'], IconSvgElement> = {
  lock: SquareLock02Icon,
  garage: GarageIcon,
  siren: Megaphone01Icon,
  openings: DoorIcon,
  hazards: AlarmSmokeIcon,
  motion: Motion01Icon,
  room: Sofa01Icon,
  door: DoorIcon,
  window: BlindsIcon,
  leak: DropletIcon,
  smoke: AlarmSmokeIcon
};

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'room' ? 'room' : 'type';
  } catch {
    return 'type';
  }
}

interface DeviceGroupsProps {
  entities: SecurityEntities;
  deviceBatteryByEntityId?: Record<string, number>;
  onError: (m: string | null) => void;
  onSelectDevice?: (item: DeviceItem) => void;
}

/**
 * Device groups in a Magic UI bento grid, sized by content, by type or by room,
 * with `All` / `Issues` filtering, optional search when 8+ devices, and danger tint on hazard cards.
 */
export function DeviceGroups({
  entities,
  deviceBatteryByEntityId = {},
  onError,
  onSelectDevice
}: DeviceGroupsProps) {
  const [view, setView] = useState<View>(readView);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [query, setQuery] = useState('');

  const totalCount =
    entities.locks.length +
    (entities.garages?.length ?? 0) +
    (entities.sirens?.length ?? 0) +
    entities.doorSensors.length +
    entities.windowSensors.length +
    entities.motionSensors.length +
    entities.leakSensors.length +
    entities.smokeSensors.length;

  const groups = useMemo(() => {
    const raw = view === 'room' ? groupByRoom(entities) : groupByType(entities);
    const trimmed = query.trim().toLowerCase();

    const filtered = raw
      .map((g) => {
        const items = g.items.filter((item) => {
          if (filterMode === 'issues' && !item.problem && item.tone !== 'warning' && item.tone !== 'danger') {
            return false;
          }
          if (trimmed) {
            const hay = `${entityName(item.entity)} ${item.entity.area?.name ?? ''} ${item.stateLabel}`.toLowerCase();
            if (!hay.includes(trimmed)) return false;
          }
          return true;
        });
        return { ...g, items };
      })
      .filter((g) => g.items.length > 0);

    return packOrder(filtered);
  }, [entities, view, filterMode, query]);

  if (totalCount === 0) return null;

  const changeView = (next: View) => {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* per-viewer convenience only */
    }
  };

  return (
    <section aria-label="Devices" className="flex flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold">
          <HugeiconsIcon icon={DashboardSquare02Icon} size={18} className="text-[var(--accent)]" />
          Devices
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {totalCount >= 8 ? (
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
            aria-label="Filter devices by state"
            size="sm"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([filterMode])}
            onSelectionChange={(keys) => {
              const next = [...keys][0] as FilterMode | undefined;
              if (next) setFilterMode(next);
            }}
          >
            <ToggleButton id="all">
              <HugeiconsIcon icon={DashboardSquare01Icon} size={14} />
              All
            </ToggleButton>
            <ToggleButton id="issues">
              <HugeiconsIcon icon={Alert02Icon} size={14} />
              Issues
            </ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            aria-label="Group devices"
            size="sm"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([view])}
            onSelectionChange={(keys) => {
              const next = [...keys][0] as View | undefined;
              if (next) changeView(next);
            }}
          >
            <ToggleButton id="type">
              <HugeiconsIcon icon={DashboardSquare02Icon} size={16} />
              By type
            </ToggleButton>
            <ToggleButton id="room">
              <HugeiconsIcon icon={Sofa01Icon} size={16} />
              By room
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </header>

      {groups.length === 0 ? (
        <div className="pro-surface flex items-center gap-3 px-4 py-3 text-sm text-muted">
          <HugeiconsIcon icon={SecurityCheckIcon} size={18} className="text-success" />
          {filterMode === 'issues' && !query.trim()
            ? 'No active security issues across your devices.'
            : 'No security devices match your filter.'}
        </div>
      ) : (
        <BentoGrid>
          {groups.map((g) => {
            const hasDanger = groupHasDanger(g.items);
            const iconClass = hasDanger
              ? 'bg-danger/15 text-danger'
              : g.problems
                ? 'bg-warning/15 text-warning'
                : undefined;
            const summaryClass = hasDanger
              ? 'font-medium text-danger'
              : g.problems
                ? 'font-medium text-warning'
                : 'text-muted';

            return (
              <BentoCard
                key={g.id}
                icon={GROUP_ICON[g.kind]}
                iconClassName={iconClass}
                title={g.title}
                aside={<span className={cn('shrink-0 text-xs', summaryClass)}>{g.summary}</span>}
                className={bentoSpan(g.items.length)}
              >
                <ul
                  className={cn(
                    '-my-2.5 flex flex-col divide-y divide-separator',
                    g.items.length >= 4 &&
                      (g.items.some((i) => i.kind === 'lock' || i.kind === 'garage' || i.kind === 'siren')
                        ? '@xl:grid @xl:grid-cols-2 @xl:gap-x-6 @xl:divide-y-0'
                        : '@md:grid @md:grid-cols-2 @md:gap-x-6 @md:divide-y-0')
                  )}
                >
                  {g.items.map((item) => (
                    <DeviceRow
                      key={item.entity.entity_id}
                      item={item}
                      secondary={view === 'room' ? 'type' : 'area'}
                      batteryPct={deviceBatteryByEntityId[item.entity.entity_id]}
                      onError={onError}
                      onSelect={onSelectDevice}
                    />
                  ))}
                </ul>
              </BentoCard>
            );
          })}
        </BentoGrid>
      )}
    </section>
  );
}
