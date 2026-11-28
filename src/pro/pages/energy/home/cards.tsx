/**
 * Energy round 4: the cards under Today in C (docs/pro-ui/ENERGY.md §0), on tablets and desktop.
 * Phones keep the decided tabs after Today. Same blocks (`parts.tsx`) in each; what changes is how
 * they are grouped and how much shows at once.
 */
import { useState, type ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Analytics01Icon, BatteryCharging01Icon, CoinsIcon, Fire02Icon, Leaf01Icon, Plug01Icon, SolarPanel01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { fmtKwh, fmtMoney, rankedDevices, type EnergyHome } from '../../../lib/energyHome';
import { BLOCKS, COLOR, History, SkinnedBlock, type DesignProps } from './parts';

type BlockId = (typeof BLOCKS)[number]['id'];
const present = (home: EnergyHome) => BLOCKS.filter((b) => b.has(home) && b.id !== 'grid');

/** A grid cell whose card fills the row's height. */
function Cell({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('min-w-0 [&>section]:h-full', className)}>{children}</div>;
}

/**
 * A · Bento (owner pick for tablets and desktop, round 4): a 12-column grid with fixed places. Solar, Battery and a tall Devices card; Costs and
 * Gas & water under the first two; History wide with Impact beside it. Cards in a row share a height.
 */
export function CardsBento({ home, width }: DesignProps) {
  const blocks = present(home);
  const has = (id: BlockId) => blocks.some((b) => b.id === id);
  const desk = width >= 1000;
  const span: Partial<Record<BlockId | 'history', string>> = desk
    ? {
        solar: 'col-span-4',
        battery: 'col-span-4',
        devices: 'col-span-4 row-span-2',
        // Without Gas & water, Impact takes its place beside Costs and History runs full width.
        costs: has('utilities') || has('impact') ? 'col-span-4' : 'col-span-8',
        utilities: 'col-span-4',
        impact: 'col-span-4',
        history: has('impact') && has('utilities') ? 'col-span-8' : 'col-span-12'
      }
    : { devices: 'row-span-2', history: 'col-span-2', impact: 'col-span-2' };
  return (
    <div className={cn('grid gap-4 [grid-auto-flow:dense]', desk ? 'grid-cols-12' : 'grid-cols-2')}>
      {blocks
        .filter((b) => b.id !== 'impact')
        .map(({ id, Block }) => (
          <Cell key={id} className={span[id]}>
            <SkinnedBlock id={id} Block={Block} home={home} />
          </Cell>
        ))}
      <Cell className={span.history}>
        <History home={home} width={desk ? (width * 8) / 12 : width} />
      </Cell>
      {has('impact')
        ? BLOCKS.filter((b) => b.id === 'impact').map(({ id, Block }) => (
            <Cell key={id} className={span.impact}>
              <SkinnedBlock id={id} Block={Block} home={home} />
            </Cell>
          ))
        : null}
    </div>
  );
}

function GroupTitle({ icon, title, note }: { icon: IconSvgElement; title: string; note: string }) {
  return (
    <div className="flex items-baseline gap-2.5 px-1">
      <HugeiconsIcon icon={icon} size={17} className="shrink-0 translate-y-0.5 text-muted" />
      <h3 className="text-lg font-light">{title}</h3>
      <span className="truncate text-sm text-muted">{note}</span>
    </div>
  );
}

/**
 * B · Two columns: what the home makes and stores on one side (Solar, Battery, Impact), what it
 * uses and pays on the other (Devices, Costs, Gas & water), each under a heading with one line of
 * summary. History runs across the bottom.
 */
export function CardsColumns({ home, width }: DesignProps) {
  const blocks = present(home);
  const made = blocks.filter((b) => b.id === 'solar' || b.id === 'battery' || b.id === 'impact');
  const used = blocks.filter((b) => b.id === 'devices' || b.id === 'costs' || b.id === 'utilities');
  const t = home.totals.day;
  const columns = [
    made.length ? { id: 'made', icon: SolarPanel01Icon, title: 'Made and stored', note: home.live.solar !== null ? `${fmtKwh(t.solar)} of sun today` : '', list: made } : null,
    { id: 'used', icon: Plug01Icon, title: 'Used and paid', note: `${fmtKwh(t.used)} · ${fmtMoney(t.cost, home.currency)} today`, list: used }
  ].filter((c) => c !== null);
  return (
    <div className="flex flex-col gap-6">
      <div className={cn('grid items-start gap-6', columns.length === 2 && 'grid-cols-2')}>
        {columns.map((c) => (
          <section key={c.id} aria-label={c.title} className="flex min-w-0 flex-col gap-3">
            <GroupTitle icon={c.icon} title={c.title} note={c.note} />
            {c.list.map(({ id, Block }) => (
              <SkinnedBlock key={id} id={id} Block={Block} home={home} />
            ))}
          </section>
        ))}
      </div>
      <History home={home} width={width} />
    </div>
  );
}

interface Tile {
  id: BlockId | 'history';
  icon: IconSvgElement;
  color: string;
  label: string;
  value: string;
  sub: string;
}

function tiles(home: EnergyHome): Tile[] {
  const d = home.totals.day;
  const top = rankedDevices(home).list[0];
  const all: (Tile | null)[] = [
    home.live.solar !== null ? { id: 'solar', icon: SolarPanel01Icon, color: COLOR.solar, label: 'Solar', value: fmtKwh(d.solar), sub: home.forecast && home.forecast.remaining >= 0.1 ? `${fmtKwh(home.forecast.remaining)} still to come` : 'made today' } : null,
    home.battery && home.live.soc !== null ? { id: 'battery', icon: BatteryCharging01Icon, color: COLOR.battery, label: 'Battery', value: `${home.live.soc}%`, sub: (home.live.battery ?? 0) > 0.03 ? 'charging' : (home.live.battery ?? 0) < -0.03 ? 'powering the home' : 'idle' } : null,
    top ? { id: 'devices', icon: Plug01Icon, color: 'var(--accent)', label: 'Devices', value: top.name, sub: `${fmtKwh(top.today)} today, the most` } : null,
    { id: 'costs', icon: CoinsIcon, color: 'var(--foreground)', label: 'Costs', value: fmtMoney(d.cost, home.currency), sub: `${fmtMoney(home.totals.month.cost, home.currency)} this month` },
    home.gas || home.water ? { id: 'utilities', icon: Fire02Icon, color: home.gas ? COLOR.gas : COLOR.water, label: home.gas && home.water ? 'Gas & water' : home.gas ? 'Gas' : 'Water', value: home.gas ? `${home.gas.today} m³` : `${home.water!.today} m³`, sub: home.gas && home.water ? `water ${home.water.today} m³` : 'today' } : null,
    home.impact ? { id: 'impact', icon: Leaf01Icon, color: COLOR.clean, label: 'Impact', value: `${(home.impact.co2AvoidedKg / 1000).toFixed(1)} t`, sub: 'CO₂ avoided, lifetime' } : null,
    { id: 'history', icon: Analytics01Icon, color: 'var(--muted)', label: 'History', value: fmtKwh(home.totals.month.used), sub: 'used this month' }
  ];
  return all.filter((x): x is Tile => x !== null);
}

/**
 * C · Tiles + detail (owner pick for phones, round 4; the row scrolls sideways there): one row of small tiles, each with its headline number (Solar made, Battery
 * charge, the biggest device, today's cost…). Choosing a tile opens its full card under the row,
 * so only one detail shows at a time.
 */
export function CardsTiles({ home, width }: DesignProps) {
  const list = tiles(home);
  const [id, setId] = useState<Tile['id']>(list[0].id);
  const cur = list.find((t) => t.id === id) ?? list[0];
  const phone = width < 640;
  const cols = width >= 1000 ? list.length : Math.min(4, list.length);
  const block = BLOCKS.find((b) => b.id === cur.id);
  return (
    <div className="flex flex-col gap-4">
      <div
        role="group"
        aria-label="Energy sections"
        className={cn(phone ? '-mx-1 flex gap-2.5 overflow-x-auto px-1 py-1 [scrollbar-width:none]' : 'grid gap-3')}
        style={phone ? undefined : { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {list.map((t) => {
          const on = t.id === cur.id;
          return (
            <Button
              key={t.id}
              aria-pressed={on}
              variant="ghost"
              onPress={() => setId(t.id)}
              className={cn('pro-surface h-auto min-w-0 flex-col items-start gap-1.5 rounded-[22px] text-left data-[hovered=true]:bg-[var(--surface)]', phone ? 'w-[136px] shrink-0 p-3.5' : 'w-full p-4')}
              style={on ? { boxShadow: '0 0 0 2px var(--accent)' } : undefined}
            >
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <HugeiconsIcon icon={t.icon} size={15} style={{ color: t.color }} />
                {t.label}
              </span>
              <span className="w-full truncate text-xl font-light tabular-nums tracking-tight">{t.value}</span>
              <span className="w-full truncate text-xs font-normal text-muted">{t.sub}</span>
            </Button>
          );
        })}
      </div>
      <div aria-label={cur.label} aria-live="polite">
        {cur.id === 'history' ? <History home={home} width={width} /> : block ? <SkinnedBlock id={block.id} Block={block.Block} home={home} /> : null}
      </div>
    </div>
  );
}
