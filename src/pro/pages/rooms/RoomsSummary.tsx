/**
 * Home summary on the Rooms page (optional): rooms lit, rooms with someone in them, open doors
 * and windows, the temperature range and power. The first three filter the rooms below; tap
 * again to show all.
 */
import type { ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { BulbIcon, Door01Icon, FlashIcon, TemperatureIcon, UserMultipleIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { RoomsTotals } from '../../lib/roomsPage';
import { temp } from './shared';

export type SummaryFilter = 'lit' | 'occupied' | 'open';

/** The filter each summary tile applies, and its label in the floor filter. */
export const SUMMARY_FILTERS: Record<SummaryFilter, { label: string; icon: IconSvgElement }> = {
  lit: { label: 'Lit', icon: BulbIcon },
  occupied: { label: 'Someone there', icon: UserMultipleIcon },
  open: { label: 'Open', icon: Door01Icon }
};

function Tile({ icon, value, label, tone, selected, onPress }: { icon: IconSvgElement; value: ReactNode; label: string; tone?: 'warn'; selected?: boolean; onPress?: () => void }) {
  const body = (
    <>
      <HugeiconsIcon icon={icon} size={16} className={cn('shrink-0', tone === 'warn' ? 'text-[hsl(24_90%_55%)]' : 'text-[var(--accent)]')} />
      <span className="flex flex-col items-start leading-tight">
        <span className="text-base font-semibold tabular-nums">{value}</span>
        <span className="text-[11px] font-normal text-muted">{label}</span>
      </span>
    </>
  );
  const box = 'pro-surface flex h-auto min-w-28 shrink-0 items-center justify-start gap-2.5 rounded-[18px] px-3 py-2';
  if (!onPress) return <li className={box}>{body}</li>;
  return (
    <li className="shrink-0">
      <Button variant="ghost" onPress={onPress} aria-pressed={selected} className={cn(box, selected && 'outline-2 outline-solid -outline-offset-2 outline-[var(--accent)]')}>
        {body}
      </Button>
    </li>
  );
}

export function RoomsSummary({ totals, filter, onFilter }: { totals: RoomsTotals; filter: string; onFilter: (f: SummaryFilter | 'all') => void }) {
  const toggle = (f: SummaryFilter) => () => onFilter(filter === f ? 'all' : f);
  const range = totals.minTemp === null || totals.maxTemp === null ? '–' : totals.minTemp === totals.maxTemp ? temp(totals.minTemp) : `${temp(totals.minTemp)}–${temp(totals.maxTemp)}`;
  return (
    <ul aria-label="Home summary" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
      <Tile icon={BulbIcon} value={`${totals.roomsLit}/${totals.rooms}`} label="rooms lit" selected={filter === 'lit'} onPress={toggle('lit')} />
      <Tile icon={UserMultipleIcon} value={totals.occupied} label="someone there" selected={filter === 'occupied'} onPress={toggle('occupied')} />
      <Tile icon={Door01Icon} value={totals.open} label="open" tone={totals.open ? 'warn' : undefined} selected={filter === 'open'} onPress={toggle('open')} />
      <Tile icon={TemperatureIcon} value={range} label="temperatures" />
      {totals.powerWatts > 0 ? <Tile icon={FlashIcon} value={totals.powerWatts >= 1000 ? `${(totals.powerWatts / 1000).toFixed(1)} kW` : `${totals.powerWatts} W`} label="power now" /> : null}
    </ul>
  );
}
