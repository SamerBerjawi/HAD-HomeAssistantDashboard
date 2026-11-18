import { useMemo, useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { AlarmSmokeIcon, DashboardSquare02Icon, DoorIcon, Motion01Icon, Sofa01Icon, SquareLock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { BentoCard, BentoGrid } from '../../ui/magicui/BentoGrid';
import { bentoSpan, groupByRoom, groupByType, packOrder, type DeviceGroup, type SecurityEntities } from '../../lib/securityLogic';
import { DeviceRow } from './DeviceRow';

type View = 'type' | 'room';
const VIEW_KEY = 'had_pro_security_group_view';

const GROUP_ICON: Record<DeviceGroup['kind'], IconSvgElement> = {
  lock: SquareLock02Icon,
  openings: DoorIcon,
  hazards: AlarmSmokeIcon,
  motion: Motion01Icon,
  room: Sofa01Icon,
  door: DoorIcon,
  window: DoorIcon,
  leak: AlarmSmokeIcon,
  smoke: AlarmSmokeIcon
};

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'room' ? 'room' : 'type';
  } catch {
    return 'type';
  }
}

/** Device groups in a Magic UI bento grid, sized by content, by type or by room (DESIGN.md 7.5). */
export function DeviceGroups({ entities, onError }: { entities: SecurityEntities; onError: (m: string | null) => void }) {
  const [view, setView] = useState<View>(readView);
  const groups = useMemo(() => packOrder(view === 'room' ? groupByRoom(entities) : groupByType(entities)), [entities, view]);
  if (groups.length === 0) return null;

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
      <header className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold">
          <HugeiconsIcon icon={DashboardSquare02Icon} size={18} className="text-[var(--accent)]" />
          Devices
        </h2>
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
      </header>

      <BentoGrid>
        {groups.map((g) => (
          <BentoCard
            key={g.id}
            icon={GROUP_ICON[g.kind]}
            iconClassName={g.problems ? 'bg-warning/15 text-warning' : undefined}
            title={g.title}
            aside={<span className={cn('shrink-0 text-xs', g.problems ? 'font-medium text-warning' : 'text-muted')}>{g.summary}</span>}
            className={bentoSpan(g.items.length)}
          >
            <ul
              className={cn(
                '-my-2.5 flex flex-col divide-y divide-separator',
                // Two columns once the card is wide enough: sooner for sensor rows, later when rows carry a lock button.
                g.items.length >= 4 &&
                  (g.items.some((i) => i.kind === 'lock')
                    ? '@xl:grid @xl:grid-cols-2 @xl:gap-x-6 @xl:divide-y-0'
                    : '@md:grid @md:grid-cols-2 @md:gap-x-6 @md:divide-y-0')
              )}
            >
              {g.items.map((item) => (
                <DeviceRow key={item.entity.entity_id} item={item} secondary={view === 'room' ? 'type' : 'area'} onError={onError} />
              ))}
            </ul>
          </BentoCard>
        ))}
      </BentoGrid>
    </section>
  );
}
