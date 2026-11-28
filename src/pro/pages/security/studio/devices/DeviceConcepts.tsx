/** Round 5 alternatives (docs/pro-ui/SECURITY.md §7); the chosen Needs a look + tabs lives in `pages/security/SecurityDevices.tsx`. */
import { useState, type ReactNode } from 'react';
import { Tabs } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { AlarmSmokeIcon, Alert02Icon, GarageIcon, Megaphone01Icon, Clock01Icon, DoorOpenIcon, GridViewIcon, Motion02Icon, SquareLock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ChosenTile } from '../../../../areas/tiles/chosenTiles';
import type { LockTileModel, TileAction, TileSize } from '../../../../areas/tileTypes';
import { isSiren, securityIssues, type StudioDevice, type StudioHome } from '../studioSecurity';
import { clock, EVENT_ICON, TONE, type DesignProps } from '../designs/parts';
import { GroupHeading, KINDS, kindNote, needsLook, TileGrid, TodayList } from '../../SecurityDevices';
export { DevicesTabs, SecurityTile, needsLook, TodayList } from '../../SecurityDevices';

export type DevicesProps = DesignProps;
const TODAY_W = 340;

/** Devices on the left, Today in a 340 px column on wide screens; on phones Today goes under. */
function WithToday({ home, width, children }: { home: StudioHome; width: number; children: (w: number) => ReactNode }) {
  const wide = width >= 900;
  const devWidth = wide ? width - TODAY_W - 24 : width;
  return (
    <div className={cn('flex gap-6', wide ? 'flex-row items-start' : 'flex-col')}>
      <div className="flex min-w-0 flex-1 flex-col gap-6">{children(devWidth)}</div>
      <div className={cn(wide && 'shrink-0')} style={wide ? { width: TODAY_W } : undefined}>
        <TodayList home={home} />
      </div>
    </div>
  );
}

/** A · By type: Locks, Doors & windows, Smoke & water, Motion, each with a one-line status; tiles that need a look lead. */
export function DevicesByType({ home, width, act }: DevicesProps) {
  return (
    <WithToday home={home} width={width}>
      {(w) =>
        KINDS.map((k) => {
          const list = home.devices.filter((d) => d.kind === k.kind).sort((a, b) => Number(needsLook(b)) - Number(needsLook(a)));
          if (!list.length) return null;
          const n = kindNote(k.kind, list);
          return (
            <section key={k.kind} aria-label={k.title} className="flex flex-col gap-3">
              <GroupHeading icon={k.icon} title={k.title} note={n.note} warn={n.warn} />
              <TileGrid list={list} width={w} act={act} label={k.title} />
            </section>
          );
        })
      }
    </WithToday>
  );
}

/** B · By area: one group per area (Entrance, Kitchen, Garage…), areas with something to look at first. */
export function DevicesByArea({ home, width, act }: DevicesProps) {
  const areas = [...new Set(home.devices.map((d) => d.area))]
    .map((area) => ({ area, list: home.devices.filter((d) => d.area === area) }))
    .sort((a, b) => b.list.filter(needsLook).length - a.list.filter(needsLook).length || a.area.localeCompare(b.area));
  return (
    <WithToday home={home} width={width}>
      {(w) =>
        areas.map(({ area, list }) => {
          const bad = list.filter(needsLook).length;
          return (
            <section key={area} aria-label={area} className="flex flex-col gap-3">
              <GroupHeading icon={GridViewIcon} title={area} note={bad ? `${bad} to look at` : 'Secure'} warn={bad > 0} />
              <TileGrid list={list} width={w} act={act} label={area} />
            </section>
          );
        })
      }
    </WithToday>
  );
}
