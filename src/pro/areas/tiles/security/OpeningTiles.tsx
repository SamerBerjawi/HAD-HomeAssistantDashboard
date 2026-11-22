/**
 * Door & window, batch 4 concepts (read-only sensors).
 * - A · "Plan": the opening drawn as on a floor plan: a door leaf swings out on its arc, a window's
 *   two sashes part, a garage door's panels lift. Closed is a straight line in green.
 * - B · "Day": when it was open over the last 24 hours, as bars on a strip ("Opened 4 times
 *   today"), so a door left open last night still shows.
 * - C · "Badge": a colour bar down the edge and the word, Closed or Open, with how long. Built to
 *   sit in rows of many; a door open too long turns the whole tile red.
 */
import { cn } from '@/lib/utils';
import type { OpeningTileModel, TileProps } from '../../tileTypes';
import { ALARM, BatteryNote, CALM, IconDot, openingIcon, openingInfo, openingSince, Shell, span } from './securityParts';

/* ── A · Plan ── */
function PlanGlyph({ o, px }: { o: OpeningTileModel; px: number }) {
  const { hue } = openingInfo(o);
  const open = o.available && o.isOn;
  const w = px;
  const h = px;
  const wall = { stroke: 'currentColor', strokeOpacity: 0.35, strokeWidth: Math.max(2, px / 22), strokeLinecap: 'round' as const };
  const leaf = { stroke: hue, strokeWidth: Math.max(3, px / 14), strokeLinecap: 'round' as const, style: { transition: 'all 500ms cubic-bezier(.2,.8,.2,1)' } };
  const y = h * 0.72;
  const x0 = w * 0.18;
  const x1 = w * 0.82;
  const L = x1 - x0;
  if (o.deviceClass === 'garage_door') {
    // Four panels fill the opening; open, they roll up under the lintel and only the first shows.
    const top = h * 0.22;
    const ph = (y - top) / 4;
    return (
      <svg aria-hidden width={w} height={h} className="shrink-0 overflow-visible">
        <path d={`M ${x0} ${y} V ${top} H ${x1} V ${y}`} fill="none" {...wall} />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={x0 + 4} y={top + 2 + (open ? 0 : i * ph)} width={L - 8} height={ph - 3} rx={2} fill={hue} fillOpacity={open ? (i === 0 ? 0.9 : 0) : 0.85 - i * 0.12} style={{ transition: 'all 500ms cubic-bezier(.2,.8,.2,1)' }} />
        ))}
      </svg>
    );
  }
  if (o.deviceClass === 'window') {
    const a = open ? 55 : 0;
    const half = L / 2;
    const tip = (x: number, dir: 1 | -1) => [x + dir * half * Math.cos((a * Math.PI) / 180), y - half * Math.sin((a * Math.PI) / 180)];
    const [lx, ly] = tip(x0, 1);
    const [rx, ry] = tip(x1, -1);
    return (
      <svg aria-hidden width={w} height={h} className="shrink-0 overflow-visible">
        <line x1={w * 0.04} y1={y} x2={x0} y2={y} {...wall} />
        <line x1={x1} y1={y} x2={w * 0.96} y2={y} {...wall} />
        <line x1={x0} y1={y} x2={lx} y2={ly} {...leaf} />
        <line x1={x1} y1={y} x2={rx} y2={ry} {...leaf} />
        {open ? <path d={`M ${x0 + half} ${y} A ${half} ${half} 0 0 0 ${lx} ${ly} M ${x1 - half} ${y} A ${half} ${half} 0 0 1 ${rx} ${ry}`} fill="none" stroke={hue} strokeOpacity={0.35} strokeDasharray="3 3" strokeWidth={1.5} /> : null}
      </svg>
    );
  }
  const a = open ? 70 : 0;
  const ex = x0 + L * Math.cos((a * Math.PI) / 180);
  const ey = y - L * Math.sin((a * Math.PI) / 180);
  return (
    <svg aria-hidden width={w} height={h} className="shrink-0 overflow-visible">
      <line x1={w * 0.04} y1={y} x2={x0} y2={y} {...wall} />
      <line x1={x1} y1={y} x2={w * 0.96} y2={y} {...wall} />
      {open ? <path d={`M ${x1} ${y} A ${L} ${L} 0 0 0 ${ex} ${ey}`} fill="none" stroke={hue} strokeOpacity={0.4} strokeDasharray="3 3" strokeWidth={1.5} /> : null}
      <line x1={x0} y1={y} x2={ex} y2={ey} {...leaf} />
      <circle cx={x0} cy={y} r={Math.max(2.5, px / 20)} fill={hue} />
    </svg>
  );
}

export function OpeningPlan({ e: o, size }: TileProps<OpeningTileModel>) {
  const info = openingInfo(o);
  return (
    <Shell
      size={size}
      label={o.name}
      name={o.name}
      className={cn('pro-surface', !o.available && 'opacity-60')}
      state={<span style={{ color: info.hue }}>{size === 'xs' || size === 's' ? openingSince(o) || info.word : info.word}</span>}
      detail={size === 'xs' || size === 's' ? undefined : openingSince(o)}
      visual={(px) => <PlanGlyph o={o} px={size === 'xs' ? 44 : size === 's' ? 56 : px} />}
      aside={<BatteryNote battery={o.battery} />}
    />
  );
}

/* ── B · Day ── */
function DayStrip({ o, labels, className }: { o: OpeningTileModel; labels?: boolean; className?: string }) {
  const now = Date.now();
  const DAY = 24 * 3_600_000;
  const x = (t: number) => Math.max(0, Math.min(1, 1 - (now - t) / DAY));
  const { hue } = openingInfo(o);
  return (
    <div aria-hidden className={className}>
      <div className="relative h-5 overflow-hidden rounded-md bg-[color-mix(in_srgb,currentColor_6%,transparent)]">
        {[6, 12, 18].map((hh) => (
          <span key={hh} className="absolute inset-y-0 w-px bg-current opacity-10" style={{ left: `${(hh / 24) * 100}%` }} />
        ))}
        {o.spells.map(([a, b], i) => {
          const l = x(a);
          const r = x(b ?? now);
          return <span key={i} className="absolute inset-y-1 rounded-sm" style={{ left: `${l * 100}%`, width: `max(3px, ${(r - l) * 100}%)`, background: b === null ? hue : 'hsl(36 95% 50%)', opacity: b === null ? 1 : 0.75 }} />;
        })}
      </div>
      {labels ? (
        <div className="mt-1 flex justify-between text-[10px] opacity-50">
          <span>24 h ago</span>
          <span>12 h</span>
          <span>Now</span>
        </div>
      ) : null}
    </div>
  );
}

export function OpeningDay({ e: o, size }: TileProps<OpeningTileModel>) {
  const info = openingInfo(o);
  const n = o.spells.length;
  const summary = !o.available ? '' : n ? `Opened ${n === 1 ? 'once' : `${n} times`} in 24 h` : 'Not opened in 24 h';
  return (
    <Shell
      size={size}
      label={o.name}
      name={o.name}
      className={cn('pro-surface', !o.available && 'opacity-60')}
      state={
        <span>
          <span style={{ color: info.hue }} className="font-semibold">
            {info.word}
          </span>
          {o.available && size !== 'l' && size !== 't' ? <span className="opacity-80"> · {summary}</span> : null}
        </span>
      }
      detail={size === 'l' || size === 't' ? `${openingSince(o)}${summary ? ` · ${summary}` : ''}` : openingSince(o)}
      visual={(px) => (size === 'xs' ? <IconDot icon={openingIcon(o)} hue={info.hue} px={36} /> : size === 'w' ? null : <IconDot icon={openingIcon(o)} hue={info.hue} px={size === 's' ? 34 : Math.round(px * 0.45)} solid={o.isOn && o.available} />)}
      aside={<BatteryNote battery={o.battery} />}
      strip={o.available ? <DayStrip o={o} labels={size === 'l' || size === 't' || size === 'w'} /> : undefined}
    />
  );
}

/* ── C · Badge ── */
export function OpeningBadge({ e: o, size }: TileProps<OpeningTileModel>) {
  const info = openingInfo(o);
  const raw = o.available && o.lastChanged ? span(o.lastChanged) : '';
  const since = raw === 'now' ? 'just now' : raw;
  const alarm = info.long && o.available;
  const word = (cls: string) => (
    <span className={cn('font-semibold leading-none tracking-[-0.02em]', cls)} style={{ color: alarm ? 'white' : info.hue }}>
      {info.word}
    </span>
  );
  return (
    <div className="relative h-full w-full">
      <Shell
        size={size}
        label={o.name}
        name={o.name}
        className={cn(!alarm && 'pro-surface', alarm && 'text-white', !o.available && 'opacity-60', size === 'xs' ? '[&>div]:pl-5' : '[&>div]:pl-6')}
        style={alarm ? { background: `linear-gradient(150deg, ${ALARM}, color-mix(in srgb, ${ALARM} 75%, black))` } : undefined}
        state={size === 'xs' ? <span className={alarm ? 'opacity-90' : ''}>{info.word} · {since}</span> : word(size === 'l' ? 'text-[40px]' : size === 's' ? 'text-[24px]' : 'text-[28px]')}
        detail={o.available && since ? (alarm ? `Open for ${since}. Close it?` : since === 'just now' ? 'Just now' : `For ${since}`) : undefined}
        visual={() => null}
        aside={<BatteryNote battery={o.battery} className={alarm ? '!text-white' : ''} />}
      />
      {/* the colour bar down the edge */}
      <span aria-hidden className="pointer-events-none absolute inset-y-3 left-2.5 w-1.5 rounded-full" style={{ background: alarm ? 'white' : o.available ? info.hue : CALM }} />
    </div>
  );
}
