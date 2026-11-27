/**
 * Security devices: Needs a look + tabs (owner pick, round 5, docs/pro-ui/SECURITY.md §7). Devices
 * that want a look (unlocked, open, wet, sounding, offline) first as the chosen Area tiles; the
 * rest in tabs (All, Locks, Openings, Garages, Safety, Sirens, Motion, Today), the same on phone
 * and desktop.
 */
import { useState, type ReactNode } from 'react';
import { Tabs } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { AlarmSmokeIcon, Alert02Icon, GarageIcon, Megaphone01Icon, Clock01Icon, DoorOpenIcon, GridViewIcon, Motion02Icon, SquareLock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ChosenTile } from '../../areas/tiles/chosenTiles';
import type { LockTileModel, TileAction, TileSize } from '../../areas/tileTypes';
import { isSiren, securityIssues, type SecurityDevice, type SecurityHome } from '../../lib/securityPage';
import { SirenTile } from './SirenTile';
import { clock, EVENT_ICON, eventColor, TONE, type DesignProps } from './parts';

export type DevicesProps = DesignProps;

export const GAP = 12;
export const ROW = 148;
const TODAY_W = 340;

/** Unlocked, jammed, open, wet or offline: the tile wants a look. */
export function needsLook(d: SecurityDevice): boolean {
  if (!d.available) return true;
  if (d.kind === 'lock') return (d as LockTileModel).state !== 'locked';
  if (d.kind === 'opening' || d.kind === 'safety' || d.kind === 'cover' || d.kind === 'siren') return d.isOn;
  return false;
}

/** A device's tile: the chosen Area tile, or the studio's siren tile. */
export function SecurityTile({ d, size, act }: { d: SecurityDevice; size: TileSize; act: DesignProps['act'] }) {
  if (isSiren(d)) return <SirenTile e={d} size={size} onToggle={() => act({ type: 'device', id: d.entityId, action: { type: 'toggle' } })} />;
  return <ChosenTile e={d} size={size} act={(a: TileAction) => act({ type: 'device', id: d.entityId, action: a })} />;
}

export const sizeOf = (d: SecurityDevice): TileSize => (d.kind === 'opening' && d.isOn ? 'w' : 's');

/** Tiles on a 2 / 4 / 6 column grid; open doors and windows take two columns for their day strip. */
export function TileGrid({ list, width, act, label }: { list: SecurityDevice[]; width: number; act: DesignProps['act']; label: string }) {
  const cols = width < 600 ? 2 : width < 1000 ? 4 : 6;
  return (
    <div role="list" aria-label={label} className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: ROW, gap: GAP, gridAutoFlow: 'dense' }}>
      {list.map((d) => {
        const size = sizeOf(d);
        return (
          <div key={d.entityId} role="listitem" className={cn(size === 'w' && 'col-span-2')}>
            <SecurityTile d={d} size={size} act={act} />
          </div>
        );
      })}
    </div>
  );
}

export function GroupHeading({ icon, title, note, warn }: { icon: IconSvgElement; title: string; note: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline gap-2.5 px-1">
      <HugeiconsIcon icon={icon} size={17} className="shrink-0 translate-y-0.5 text-muted" />
      <h3 className="text-lg font-light">{title}</h3>
      <span className="text-sm" style={{ color: warn ? TONE.warning : 'var(--muted)' }}>
        {note}
      </span>
    </div>
  );
}

/** On desktop, Today sits beside the cameras (owner, 2026-11-26) instead of in the tabs. */
export const todayBesideCameras = (home: SecurityHome, width: number) => width >= 900 && home.cameras.length > 0;

/**
 * The day's events on a timeline, each icon in its kind's colour. `fill`: fill the parent's height
 * and scroll inside it (beside the cameras, clipped to their height).
 */
export function TodayList({ home, limit = 7, bare, fill }: { home: SecurityHome; limit?: number; bare?: boolean; fill?: boolean }) {
  const events = home.events.slice(0, limit);
  const list = events.length ? (
    <ol className="relative flex flex-col gap-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]">
      {events.map((e) => {
        const color = eventColor(e);
        return (
          <li key={e.id} className="relative flex items-start gap-3">
            <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full" style={{ color, background: `color-mix(in oklab, ${color} 16%, var(--surface))` }}>
              <HugeiconsIcon icon={EVENT_ICON[e.kind]} size={15} />
            </span>
            <div className="min-w-0 pt-1">
              <p className="text-sm leading-5">{e.text}</p>
              <p className="text-xs text-muted tabular-nums">{clock(e.at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  ) : (
    <p className="text-sm text-muted">Nothing has happened yet today.</p>
  );
  if (bare) return list;
  return (
    <section aria-label="Today" className={cn('pro-surface flex flex-col gap-1 rounded-[26px] p-5', fill && 'h-full min-h-0 pr-2')}>
      <h3 className="mb-2 text-lg font-light">Today</h3>
      {fill ? <div className="-mr-1 min-h-0 flex-1 overflow-y-auto pr-3 [scrollbar-width:thin]">{list}</div> : list}
    </section>
  );
}

export const KINDS: { kind: SecurityDevice['kind']; title: string; icon: IconSvgElement }[] = [
  { kind: 'lock', title: 'Locks', icon: SquareLock02Icon },
  { kind: 'opening', title: 'Doors & windows', icon: DoorOpenIcon },
  { kind: 'cover', title: 'Garages & gates', icon: GarageIcon },
  { kind: 'safety', title: 'Smoke & water', icon: AlarmSmokeIcon },
  { kind: 'siren', title: 'Sirens', icon: Megaphone01Icon },
  { kind: 'motion', title: 'Motion', icon: Motion02Icon }
];

export function kindNote(kind: SecurityDevice['kind'], list: SecurityDevice[]): { note: string; warn: boolean } {
  const bad = list.filter(needsLook).length;
  const all = list.length;
  if (kind === 'lock') return { note: bad ? `${bad} of ${all} not locked` : 'All locked', warn: bad > 0 };
  if (kind === 'opening') return { note: bad ? `${bad} open or offline` : 'All closed', warn: bad > 0 };
  if (kind === 'safety') return { note: bad ? `${bad} alert${bad > 1 ? 's' : ''}` : 'All clear', warn: bad > 0 };
  if (kind === 'cover') return { note: bad ? `${bad} open` : 'All closed', warn: bad > 0 };
  if (kind === 'siren') return { note: bad ? `${bad} sounding` : 'Quiet', warn: bad > 0 };
  const now = list.filter((d) => d.isOn).length;
  return { note: now ? `Motion in ${now}` : 'Quiet', warn: false };
}

/** C · Needs you, then tabs: the devices that want a look sit first, everything else in tabs. Today is a tab on phones; on desktop it sits beside the cameras. */
export function DevicesTabs({ home, width, act }: DevicesProps) {
  const look = home.devices.filter(needsLook);
  const [tab, setTab] = useState('all');
  const tabs: { id: string; title: string; icon: IconSvgElement; list: SecurityDevice[] | null }[] = [
    { id: 'all', title: 'All', icon: GridViewIcon, list: home.devices },
    ...KINDS.map((k) => ({ id: k.kind, title: k.kind === 'opening' ? 'Openings' : k.kind === 'safety' ? 'Safety' : k.kind === 'cover' ? 'Garages' : k.title, icon: k.icon, list: home.devices.filter((d) => d.kind === k.kind) })).filter((t) => t.list.length),
    ...(todayBesideCameras(home, width) ? [] : [{ id: 'today', title: 'Today', icon: Clock01Icon, list: null }])
  ];
  const issues = securityIssues(home).length;
  return (
    <div className="flex flex-col gap-6">
      {look.length ? (
        <section aria-label="Needs a look" className="flex flex-col gap-3">
          <GroupHeading icon={Alert02Icon} title="Needs a look" note={`${look.length} device${look.length > 1 ? 's' : ''}`} warn={issues > 0} />
          <TileGrid list={look} width={width} act={act} label="Needs a look" />
        </section>
      ) : null}
      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))}>
        <Tabs.ListContainer className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none]">
          <Tabs.List aria-label="Devices and activity" className="w-max">
            {tabs.map((t) => (
              <Tabs.Tab key={t.id} id={t.id} className="gap-1.5 whitespace-nowrap px-3">
                <HugeiconsIcon icon={t.icon} size={15} />
                {t.title}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
        {tabs.map((t) => (
          <Tabs.Panel key={t.id} id={t.id} className="px-0 pt-4">
            {t.list ? <TileGrid list={t.list.filter((d) => !needsLook(d))} width={width} act={act} label={t.title} /> : <TodayList home={home} limit={20} />}
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
}

