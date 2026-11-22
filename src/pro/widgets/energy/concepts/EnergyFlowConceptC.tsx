/**
 * Energy flow concept C — Innovative ("energy map"). The day's use as a map of blocks, each as
 * big as what it used: the biggest users take the most room, what nothing tracks is a hatched
 * block. You see at a glance what the house spends its energy on.
 */
import type { ProOverviewEnergyModel } from '../../../lib/overviewEnergy';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { useEnergyEmptyState } from '../EnergyParts';
import { kwh } from './shared';

interface Block {
  id: string;
  name: string;
  v: number;
  hue: number | null;
}
interface Placed extends Block {
  x: number;
  y: number;
  w: number;
  h: number;
}

const HUES = [32, 190, 280, 140, 340, 210, 60];

/** Simple treemap: split the area along its longer side, largest first. */
function layout(items: Block[], x: number, y: number, w: number, h: number): Placed[] {
  if (items.length === 0) return [];
  if (items.length === 1) return [{ ...items[0], x, y, w, h }];
  const total = items.reduce((s, i) => s + i.v, 0);
  let acc = 0;
  let cut = 0;
  while (cut < items.length - 1 && acc + items[cut].v <= total / 2) acc += items[cut++].v;
  if (cut === 0) acc = items[cut++].v;
  const share = acc / total;
  const [a, b] = [items.slice(0, cut), items.slice(cut)];
  return w >= h ? [...layout(a, x, y, w * share, h), ...layout(b, x + w * share, y, w * (1 - share), h)] : [...layout(a, x, y, w, h * share), ...layout(b, x, y + h * share, w, h * (1 - share))];
}

export default function EnergyFlowConceptC({ model: m, onOpenDetails }: DesignedWidgetProps<ProOverviewEnergyModel>) {
  const empty = useEnergyEmptyState();
  const blocks: Block[] = [
    ...m.topConsumers.map((d, i) => ({ id: d.id, name: d.name, v: d.kwh, hue: HUES[i % HUES.length] as number | null })),
    ...(m.untrackedKwh > 0.05 ? [{ id: 'untracked', name: 'Not tracked', v: m.untrackedKwh, hue: null }] : [])
  ]
    .filter((b) => b.v > 0)
    .sort((a, b) => b.v - a.v);
  const total = blocks.reduce((s, b) => s + b.v, 0) || 1;
  const placed = layout(blocks, 0, 0, 100, 100);

  return (
    <WidgetSurface label="Energy flow" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Energy flow" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3">
        {empty ? (
          <div className="mt-auto p-0.5">{empty}</div>
        ) : (
          <>
            <p className="shrink-0 truncate px-0.5 pr-8 text-sm font-semibold">
              {m.homeKwhText} <span className="font-normal text-muted">· what used it</span>
            </p>
            <ul aria-label="Energy by user" className="relative min-h-0 flex-1">
              {placed.map((b) => {
                const pct = Math.round((b.v / total) * 100);
                const small = b.w * b.h < 260;
                return (
                  <li key={b.id} className="absolute p-[2px]" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }} aria-label={`${b.name}: ${kwh(b.v)}, ${pct}%`}>
                    <span
                      className="flex size-full flex-col justify-between overflow-hidden rounded-lg p-1.5 text-left"
                      style={
                        b.hue === null
                          ? { background: 'repeating-linear-gradient(135deg, var(--default) 0 6px, transparent 6px 12px)', color: 'var(--muted)' }
                          : { background: `linear-gradient(150deg, hsl(${b.hue} 80% 62%), hsl(${b.hue + 18} 75% 50%))`, color: 'white' }
                      }
                    >
                      <span className="block truncate text-[11px] font-semibold leading-tight">{b.name}</span>
                      {small ? null : (
                        <span className="block text-[10px] tabular-nums opacity-85">
                          {kwh(b.v)} · {pct}%
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
