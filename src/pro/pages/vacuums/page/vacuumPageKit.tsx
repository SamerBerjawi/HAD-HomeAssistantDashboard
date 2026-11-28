/**
 * The Vacuums page's pieces (docs/pro-ui/VACUUM_TILES.md, batch 4): a cleaner drawn for the rail,
 * its facts, its sections, what "Now" holds and why a section moves up in Moment order. Shared by
 * the studio's page preview and, once chosen, the page itself.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, DropletIcon, Home01Icon, PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils';
import { agoText } from '../../../areas/tileTypes';
import { busy, chores, mainAction, partsBySoonest, statusWords, wearTone, type Cleaner, type CleanerAction } from '../../../lib/vacuums/cleaner';
import { CH, ChoreButton, clockText, dayText, RobotTop, RunButtons, toneHue } from '../tiles/cleanerTileKit';
import { Upright } from '../tiles/stick/StickStatusTiles';
import { Station } from '../tiles/robot/StationTiles';
import type { VacuumTileType } from '../studio/vacuumCatalog';

type TileId = VacuumTileType['id'];
export type SectionId = 'cleaning' | 'upkeep' | 'record' | 'settings' | 'stick' | 'energy';

const away = (c: Cleaner) => busy(c) || c.activity === 'paused' || c.activity === 'error';
const partDue = (c: Cleaner) => partsBySoonest(c).find((p) => wearTone(p) === 'due' || wearTone(p) === 'soon');

/** The cleaner drawn on its own: the robot from above, the stick in its station. */
export function CleanerArt({ c, px }: { c: Cleaner; px: number }) {
  const hue = toneHue(statusWords(c).tone);
  return c.kind === 'stick' ? <Upright c={c} h={px} /> : <RobotTop px={px * 0.62} hue={hue} working={c.activity === 'cleaning' || c.activity === 'washing' || c.activity === 'drying'} />;
}

/** The rail's picture: the cleaner on a soft floor, lit in its state colour. */
export function CleanerStage({ c, px }: { c: Cleaner; px: number }) {
  const hue = toneHue(statusWords(c).tone);
  return (
    <div className="relative grid place-items-center overflow-hidden rounded-[28px] bg-[var(--surface)]" style={{ height: px + 40 }}>
      <span aria-hidden className="absolute inset-x-[15%] bottom-[10%] h-[22%] rounded-[50%] blur-xl" style={{ background: `color-mix(in srgb, ${hue} 30%, transparent)` }} />
      <div className="relative">
        <CleanerArt c={c} px={px} />
      </div>
    </div>
  );
}

/** Where the cleaner lives, for Home base: the robot in (or beside) its station, the stick upright. */
export function HomeArt({ c, px }: { c: Cleaner; px: number }) {
  if (c.kind === 'stick') return <Upright c={c} h={px} />;
  if (!c.station) return <RobotTop px={px * 0.55} hue={toneHue(statusWords(c).tone)} working={c.activity === 'cleaning'} />;
  return (
    <span className="relative flex items-end">
      <Station c={c} px={px} />
      {away(c) ? <RobotTop px={px * 0.34} hue={toneHue(statusWords(c).tone)} working={c.activity === 'cleaning'} className="-ml-1 mb-1" /> : null}
    </span>
  );
}

export interface Fact {
  k: string;
  v: string;
  hue?: string;
}

export function facts(c: Cleaner, now: number): Fact[] {
  const out: Fact[] = [];
  if (c.battery !== null) out.push({ k: c.charging ? 'Charging' : 'Battery', v: `${c.battery}%`, hue: c.battery <= 20 ? CH.bad : undefined });
  if (c.kind === 'robot') {
    out.push({ k: 'Last clean', v: away(c) ? 'Now' : c.run?.at ? `${dayText(c.run.at, now)} ${clockText(c.run.at)}` : '—' });
    if (c.station) {
      const todo = chores(c).length;
      out.push({ k: 'Station', v: todo ? `${todo} to do` : 'Ready', hue: todo ? CH.watch : undefined });
    }
    const p = partsBySoonest(c)[0];
    if (p && p.percent !== null) out.push({ k: p.name, v: `${p.percent}%`, hue: wearTone(p) === 'due' ? CH.bad : wearTone(p) === 'soon' ? CH.watch : undefined });
  } else if (c.dock) {
    out.push({ k: 'Where', v: c.dock.inStation === false ? 'In use' : 'In station' });
    out.push({ k: 'Bag', v: c.dock.bagFull ? 'Full' : 'OK', hue: c.dock.bagFull ? CH.watch : undefined });
    if (c.dock.lastEmptied) out.push({ k: 'Emptied', v: agoText(c.dock.lastEmptied, now) });
  }
  return out;
}

export function FactRow({ c, now }: { c: Cleaner; now: number }) {
  return (
    <dl className="flex flex-wrap gap-x-5 gap-y-2">
      {facts(c, now).map((f) => (
        <div key={f.k}>
          <dt className="text-[12px] opacity-60">{f.k}</dt>
          <dd className="text-[16px] font-semibold tabular-nums" style={f.hue ? { color: f.hue } : undefined}>
            {f.v}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** "How it is": the verdict in its colour and the detail, the Room page's Ready card. */
export function StatusCard({ c, compact }: { c: Cleaner; compact?: boolean }) {
  const s = statusWords(c);
  const hue = toneHue(s.tone);
  return (
    <div className={cn('rounded-[20px]', compact ? 'px-3 py-2.5' : 'px-4 py-3.5')} style={{ background: `color-mix(in srgb, ${hue} 12%, transparent)` }}>
      <p className={cn('font-semibold', compact ? 'text-[15px]' : 'text-[17px]')} style={{ color: hue }}>
        {s.word}
      </p>
      {s.detail ? <p className="text-[13px] opacity-70">{s.detail}</p> : null}
    </div>
  );
}

/** The cleaner's usual buttons: Start / Pause and Dock for a robot, Empty for a stick. */
export function QuickActions({ c, act }: { c: Cleaner; act: (a: CleanerAction) => void }) {
  if (c.kind === 'robot') return <RunButtons c={c} act={act} size="sm" />;
  if (!c.actions.includes('empty')) return null;
  return <ChoreButton icon={Delete02Icon} label={c.dock?.emptying ? 'Emptying' : 'Empty now'} isDisabled={c.dock?.inStation === false || !!c.dock?.emptying || !!c.dock?.bagFull} onPress={() => act({ type: 'empty' })} />;
}

/** The phone dock's round buttons: the main action, Dock, and the station's chore. */
export function DockButtons({ c, act }: { c: Cleaner; act: (a: CleanerAction) => void }) {
  const m = mainAction(c);
  const off = c.activity === 'offline';
  const round = 'size-10 min-w-0 rounded-full p-0';
  const chore = c.kind === 'robot' && c.actions.includes('wash') ? { type: 'wash' as const, icon: DropletIcon, label: 'Wash the mop', hue: CH.water } : c.actions.includes('empty') ? { type: 'empty' as const, icon: Delete02Icon, label: 'Empty the bin', hue: CH.idle } : null;
  const choreOff = off || away(c) || c.activity === 'washing' || c.activity === 'drying' || c.activity === 'emptying' || (c.kind === 'stick' && (c.dock?.inStation === false || !!c.dock?.bagFull));
  return (
    <>
      {m ? (
        <Button isIconOnly aria-label={`${c.name}: ${m.label.toLowerCase()}`} isDisabled={off} onPress={() => act({ type: m.type })} className={cn(round, 'text-white')} style={{ background: m.type === 'pause' ? CH.watch : CH.on }}>
          <HugeiconsIcon icon={m.type === 'pause' ? PauseIcon : PlayIcon} size={18} />
        </Button>
      ) : null}
      {c.actions.includes('dock') ? (
        <Button isIconOnly variant="tertiary" aria-label={`${c.name}: send to the station`} isDisabled={off || !away(c) || c.activity === 'returning'} onPress={() => act({ type: 'dock' })} className={round}>
          <HugeiconsIcon icon={Home01Icon} size={18} />
        </Button>
      ) : null}
      {chore ? (
        <Button isIconOnly variant="ghost" aria-label={chore.label} isDisabled={choreOff} onPress={() => act({ type: chore.type })} className={round} style={{ background: `color-mix(in srgb, ${chore.hue} 16%, transparent)`, color: chore.hue }}>
          <HugeiconsIcon icon={chore.icon} size={18} />
        </Button>
      ) : null}
    </>
  );
}

export interface SectionSpec {
  id: SectionId;
  title: string;
  summary: string;
  tiles: TileId[];
}

/** The page's sections for a cleaner, in their fixed order; a section with nothing to show is left out. */
export function sectionsOf(c: Cleaner): SectionSpec[] {
  if (c.kind === 'stick')
    return [
      { id: 'stick' as const, title: 'Stick', summary: `${c.dock?.inStation === false ? 'In use' : 'In station'}${c.battery !== null ? ` · ${c.battery}%` : ''}`, tiles: ['stick', 'dock'] as TileId[] },
      { id: 'energy' as const, title: 'Energy', summary: c.energy?.kWh != null ? `${c.energy.kWh.toLocaleString()} kWh used` : '', tiles: ['energy'] as TileId[] }
    ].filter((s) => s.id !== 'energy' || c.energy);
  const todo = chores(c);
  const part = partDue(c);
  const on = c.settings.filter((s) => s.on).length;
  return [
    { id: 'cleaning' as const, title: 'Cleaning', summary: away(c) ? statusWords(c).detail || statusWords(c).word : statusWords(c).word, tiles: ['status', 'rooms'] as TileId[] },
    { id: 'upkeep' as const, title: 'Station and parts', summary: todo.length ? todo[0].todo : part ? `${part.name} soon` : 'All fine', tiles: ['station', 'care'] as TileId[] },
    { id: 'record' as const, title: 'Record', summary: c.lifetime?.areaM2 ? `${Math.round(c.lifetime.areaM2).toLocaleString()} m² cleaned` : `${c.history.length} runs`, tiles: ['history', 'lifetime'] as TileId[] },
    { id: 'settings' as const, title: 'Settings', summary: `${on} of ${c.settings.length} on`, tiles: ['settings'] as TileId[] }
  ].filter((s) => (s.id === 'upkeep' ? c.station || c.parts.length : s.id === 'settings' ? c.settings.length : s.id === 'record' ? c.history.length || c.lifetime : true));
}

/** Moment order: why a section comes first now, ranked (problems before what it is doing). */
export function momentWhy(c: Cleaner): Partial<Record<SectionId, { why: string; rank: number }>> {
  const w: Partial<Record<SectionId, { why: string; rank: number }>> = {};
  if (c.kind === 'stick') {
    if (c.dock?.bagFull) w.stick = { why: 'Bag full', rank: 1 };
    else if (c.dock?.emptying) w.stick = { why: 'Emptying', rank: 3 };
    else if (c.dock?.inStation === false) w.stick = { why: 'In use', rank: 3 };
    return w;
  }
  if (c.activity === 'error') w.cleaning = { why: 'Stuck', rank: 0 };
  else if (away(c)) w.cleaning = { why: c.activity === 'paused' ? 'Paused' : 'Cleaning now', rank: 3 };
  if (chores(c).length) w.upkeep = { why: 'Needs you', rank: 1 };
  else if (partsBySoonest(c).some((p) => wearTone(p) === 'due')) w.upkeep = { why: 'Part due', rank: 2 };
  else if (c.activity === 'washing' || c.activity === 'drying') w.upkeep = { why: c.activity === 'washing' ? 'Washing' : 'Drying', rank: 3 };
  return w;
}

/** All | Now: the tiles that are on or need the owner now. */
export function nowIds(c: Cleaner): Set<TileId> {
  const s = new Set<TileId>();
  if (c.kind === 'stick') {
    if (c.dock?.inStation === false || c.charging) s.add('stick');
    if (c.dock?.bagFull || c.dock?.emptying) s.add('dock');
    return s;
  }
  if (away(c)) s.add('status');
  if (c.activity === 'cleaning') s.add('rooms');
  if (chores(c).length || c.activity === 'washing' || c.activity === 'drying' || c.activity === 'emptying') s.add('station');
  if (partDue(c)) s.add('care');
  return s;
}
