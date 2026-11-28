/**
 * Vacuum, batch 5 concepts.
 * - A · "Dock": the robot seen from above inside its battery ring, the state in words, and one
 *   big button for the obvious next step (Start, Pause, Resume, Retry); Dock beside it.
 * - B · "Rooms": the rooms it knows as chips; pick some and press "Clean 2 rooms". Suction from
 *   Large. Plain vacuums without rooms fall back to Start / Dock.
 * - C · "Path": a little floor plan; the trail it has cleaned draws through the rooms of this
 *   run, the robot at its end, the room it's in now highlighted.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { RoboticIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { TileProps, VacuumTileModel } from '../../tileTypes';
import { BatteryNote, Shell } from '../security/securityParts';
import { VAC, VacButton, vacInfo } from './vacuumParts';

/* ── A · Dock ── */
function Robot({ v, px }: { v: VacuumTileModel; px: number }) {
  const info = vacInfo(v);
  const bat = v.battery ?? 0;
  const r = px / 2 - 3;
  const c = 2 * Math.PI * r;
  const body = px * 0.62;
  return (
    <span aria-hidden className="relative grid shrink-0 place-items-center" style={{ width: px, height: px }}>
      <svg width={px} height={px} className="absolute inset-0 -rotate-90">
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={4} />
        {v.available && v.battery !== null ? <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke={bat <= 20 ? 'hsl(4 82% 54%)' : info.hue} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${(c * bat) / 100} ${c}`} /> : null}
      </svg>
      <span
        className={cn('relative grid place-items-center rounded-full shadow-[0_4px_12px_-4px_rgba(0,0,0,0.35),inset_0_-3px_0_rgba(0,0,0,0.08)]', 'bg-[linear-gradient(160deg,hsl(0_0%_100%),hsl(220_10%_86%))] dark:bg-[linear-gradient(160deg,hsl(225_8%_36%),hsl(225_10%_20%))]', info.busy && 'motion-safe:animate-[had-wander_3s_ease-in-out_infinite]')}
        style={{ width: body, height: body }}
      >
        <span className="absolute inset-x-[18%] top-[8%] h-[16%] rounded-t-full bg-black/10 dark:bg-white/10" />
        <span className="size-[26%] rounded-full" style={{ background: info.hue, boxShadow: info.busy ? `0 0 10px ${info.hue}` : undefined }} />
      </span>
    </span>
  );
}

export function VacuumDock({ e: v, size, act }: TileProps<VacuumTileModel>) {
  const info = vacInfo(v);
  const both = (
    <div className={cn('flex gap-2', size === 't' && 'flex-col')}>
      <VacButton v={v} act={act} kind="main" className={size === 't' || size === 's' ? 'flex-1' : ''} size={size === 's' ? 'sm' : 'md'} />
      {size !== 's' ? <VacButton v={v} act={act} kind="dock" /> : null}
    </div>
  );
  return (
    <Shell
      size={size}
      label={v.name}
      name={v.name}
      className={cn('pro-surface', size === 't' && '[container-type:size]', !v.available && 'opacity-60')}
      state={<span style={{ color: info.hue }}>{info.word}</span>}
      detail={info.detail}
      visual={(px) => <span className={size === 't' ? '[@container(max-height:319px)]:[zoom:0.45]' : undefined}><Robot v={v} px={size === 'xs' ? 44 : size === 's' ? 52 : px} /></span>}
      aside={size === 'xs' ? <VacButton v={v} act={act} kind="main" size="sm" iconOnly /> : <BatteryNote battery={v.battery} always={size === 'l'} />}
      strip={size === 'xs' ? undefined : both}
    />
  );
}

/* ── B · Rooms ── */
function RoomChips({ v, act, max, column }: { v: VacuumTileModel; act: TileProps<VacuumTileModel>['act']; max: number; column?: boolean }) {
  const busy = v.state === 'cleaning' || v.state === 'returning';
  return (
    <div className={cn('flex gap-1.5', column ? 'flex-col' : 'flex-wrap')}>
      {v.rooms.slice(0, max).map((r) => {
        const on = v.target.includes(r);
        const here = busy && v.room === r;
        return (
          <Button
            key={r}
            size="sm"
            variant="ghost"
            data-tile-control=""
            aria-label={`${v.name}: ${on ? 'skip' : 'clean'} ${r}`}
            aria-pressed={on}
            isDisabled={!v.available || busy}
            onPress={() => act({ type: 'rooms', rooms: on ? v.target.filter((x) => x !== r) : [...v.target, r] })}
            className={cn('h-8 min-w-0 gap-1.5 rounded-full px-3 text-[12px] font-semibold disabled:opacity-100', column && 'justify-start', on ? 'text-white' : 'bg-[color-mix(in_srgb,currentColor_7%,transparent)]')}
            style={on ? { background: VAC } : undefined}
          >
            {here ? <span className="size-1.5 rounded-full bg-white motion-safe:animate-pulse" /> : null}
            {r}
          </Button>
        );
      })}
    </div>
  );
}

export function VacuumRooms({ e: v, size, act }: TileProps<VacuumTileModel>) {
  const info = vacInfo(v);
  const can = v.rooms.length > 0;
  const fan =
    size === 'l' && v.fanSpeeds.length && v.available ? (
      <div role="group" aria-label={`${v.name} suction`} className="flex gap-1 rounded-full bg-[color-mix(in_srgb,currentColor_6%,transparent)] p-1">
        {v.fanSpeeds.map((f) => (
          <Button
            key={f}
            size="sm"
            variant="ghost"
            data-tile-control=""
            aria-label={`${v.name} suction: ${f}`}
            aria-pressed={v.fanSpeed === f}
            onPress={() => act({ type: 'fanSpeed', speed: f })}
            className={cn('h-7 min-w-0 flex-1 basis-0 rounded-full px-2 text-[12px] font-semibold', v.fanSpeed === f ? 'bg-[var(--surface)] shadow-sm' : 'opacity-60')}
          >
            {f}
          </Button>
        ))}
      </div>
    ) : null;
  if (size === 'xs' || size === 's' || !can) {
    return (
      <Shell
        size={size}
        label={v.name}
        name={v.name}
        className={cn('pro-surface', !v.available && 'opacity-60')}
        state={<span style={{ color: info.hue }}>{v.target.length && v.state === 'cleaning' ? `${info.word} ${v.target.length} rooms` : info.word}</span>}
        detail={info.detail}
        visual={(px) => <span className="grid shrink-0 place-items-center rounded-2xl" style={{ width: size === 'xs' ? 38 : Math.round(px * 0.45), height: size === 'xs' ? 38 : Math.round(px * 0.45), background: `color-mix(in srgb, ${info.hue} 14%, transparent)`, color: info.hue }}><HugeiconsIcon icon={RoboticIcon} size={20} /></span>}
        aside={size === 'xs' ? <VacButton v={v} act={act} kind="main" size="sm" iconOnly /> : <BatteryNote battery={v.battery} />}
        strip={size === 'xs' ? undefined : <div className="flex gap-2"><VacButton v={v} act={act} kind="main" size="sm" className="flex-1" />{size !== 's' ? <VacButton v={v} act={act} kind="dock" size="sm" /> : null}</div>}
      />
    );
  }
  const head = (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-[15px] font-semibold leading-tight">{v.name}</p>
        <p className="truncate text-[13px] opacity-70">
          <span style={{ color: info.hue }}>{info.word}</span>
          {info.detail ? ` · ${info.detail}` : ''}
        </p>
      </div>
      <BatteryNote battery={v.battery} always={size === 'l'} />
    </div>
  );
  const buttons = (
    <div className="flex gap-2">
      <VacButton v={v} act={act} kind="main" size={size === 'w' ? 'sm' : 'md'} className="flex-1" />
      <VacButton v={v} act={act} kind="dock" size={size === 'w' ? 'sm' : 'md'} iconOnly={size === 'w'} />
    </div>
  );
  return (
    <section aria-label={v.name} className={cn('pro-surface relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[26px]', size === 'l' ? 'gap-3 p-5' : 'gap-2.5 p-3.5', !v.available && 'opacity-60')}>
      {head}
      <div className="min-h-0 flex-1 overflow-hidden">
        <RoomChips v={v} act={act} max={size === 'w' ? 6 : 8} column={size === 't'} />
      </div>
      {fan}
      {buttons}
    </section>
  );
}

/* ── C · Path ── */
const PLAN: Record<string, [number, number, number, number]> = {
  'Living Room': [0, 0, 50, 40],
  Kitchen: [50, 0, 50, 24],
  Hallway: [50, 24, 50, 16],
  Bedroom: [0, 40, 38, 30],
  Office: [38, 40, 32, 30],
  Bathroom: [70, 40, 30, 30]
};
/** Back-and-forth lanes through each room, as one polyline. */
function trail(rooms: string[]): [number, number][] {
  const pts: [number, number][] = [];
  for (const r of rooms) {
    const box = PLAN[r];
    if (!box) continue;
    const [x, y, w, h] = box;
    const lanes = Math.max(2, Math.round(h / 6));
    for (let i = 0; i < lanes; i++) {
      const ly = y + 3 + ((h - 6) * i) / (lanes - 1);
      const [a, b] = i % 2 ? [x + w - 4, x + 4] : [x + 4, x + w - 4];
      pts.push([a, ly], [b, ly]);
    }
  }
  return pts;
}
function upTo(pts: [number, number][], frac: number): [number, number][] {
  if (pts.length < 2) return pts;
  const seg = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let left = seg.reduce((a, b) => a + b, 0) * frac;
  const out: [number, number][] = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    if (left >= seg[i]) {
      out.push(pts[i + 1]);
      left -= seg[i];
    } else {
      const t = left / seg[i];
      out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t]);
      break;
    }
  }
  return out;
}

function FloorPlan({ v, className }: { v: VacuumTileModel; className?: string }) {
  const info = vacInfo(v);
  const rooms = v.rooms.length ? v.rooms : [];
  const run = v.target.length ? v.target : v.room ? [v.room] : [];
  const pts = trail(run);
  const frac = v.state === 'docked' ? 0 : Math.max(0, Math.min(1, (v.progress ?? 0) / 100));
  const done = upTo(pts, frac);
  const bot = done[done.length - 1];
  const line = (p: [number, number][]) => p.map((q, i) => `${i ? 'L' : 'M'} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');
  return (
    <svg aria-hidden viewBox="-1 -1 102 72" className={cn('block', className)} preserveAspectRatio="xMidYMid meet">
      {(rooms.length ? rooms : ['Living Room']).map((r) => {
        const b = PLAN[r];
        if (!b) return null;
        const here = info.busy && v.room === r;
        const inRun = run.includes(r);
        return (
          <g key={r}>
            <rect x={b[0]} y={b[1]} width={b[2]} height={b[3]} rx={2} fill={here ? `color-mix(in srgb, ${VAC} 22%, transparent)` : inRun ? `color-mix(in srgb, ${VAC} 9%, transparent)` : 'color-mix(in srgb, currentColor 5%, transparent)'} stroke="currentColor" strokeOpacity={0.18} strokeWidth={0.6} />
            <text x={b[0] + 2.5} y={b[1] + 5.5} fontSize={3.6} fill="currentColor" fillOpacity={0.5}>
              {r}
            </text>
          </g>
        );
      })}
      {done.length > 1 ? <path d={line(done)} fill="none" stroke={info.hue} strokeOpacity={0.75} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {/* the dock */}
      <rect x={47} y={66} width={6} height={3} rx={1} fill="currentColor" fillOpacity={0.35} />
      {info.busy || v.state === 'paused' || v.state === 'error' ? (
        bot ? <circle cx={bot[0]} cy={bot[1]} r={2.6} fill="white" stroke={info.hue} strokeWidth={1.2} /> : null
      ) : (
        <circle cx={50} cy={64} r={2.4} fill="white" stroke={info.hue} strokeWidth={1.2} />
      )}
    </svg>
  );
}

export function VacuumPath({ e: v, size, act }: TileProps<VacuumTileModel>) {
  const info = vacInfo(v);
  const pct = v.progress !== null && v.state !== 'docked' ? `${v.progress}%` : null;
  if (size === 'xs') {
    return (
      <Shell
        size={size}
        label={v.name}
        name={v.name}
        className={cn('pro-surface', !v.available && 'opacity-60')}
        state={<span style={{ color: info.hue }}>{pct ? `${info.word} · ${pct}` : info.word}</span>}
        visual={() => <FloorPlan v={v} className="h-[46px] w-[62px] shrink-0" />}
        aside={<VacButton v={v} act={act} kind="main" size="sm" iconOnly />}
      />
    );
  }
  const plan = <FloorPlan v={v} className="h-full w-full" />;
  if (size === 'w' || size === 'l') {
    return (
      <section aria-label={v.name} className={cn('pro-surface relative flex h-full w-full min-w-0 overflow-hidden rounded-[26px]', size === 'l' ? 'flex-col gap-3 p-5' : 'gap-3 p-3', !v.available && 'opacity-60')}>
        <div className={cn('min-h-0', size === 'l' ? 'flex-1' : 'w-[52%] shrink-0')}>{plan}</div>
        <div className={cn('flex min-w-0 flex-col', size === 'l' ? 'flex-row items-end gap-3' : 'flex-1 py-1')}>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-[15px] font-semibold leading-tight">{v.name}</p>
            <p className="mt-0.5 truncate text-[13px]">
              <span style={{ color: info.hue }} className="font-semibold">
                {info.word}
              </span>
              {pct ? <span className="opacity-70"> · {pct}</span> : null}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[12px] opacity-60">{info.detail}</p>
          </div>
          <div className={cn('flex gap-1.5', size === 'w' && 'mt-auto')}>
            <VacButton v={v} act={act} kind="main" size="sm" className={size === 'w' ? 'flex-1' : ''} />
            <VacButton v={v} act={act} kind="dock" size="sm" iconOnly />
          </div>
        </div>
      </section>
    );
  }
  return (
    <section aria-label={v.name} className={cn('pro-surface relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[26px]', size === 't' ? 'gap-2 p-3.5' : 'gap-1.5 p-3', !v.available && 'opacity-60')}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[14px] font-semibold leading-tight">{v.name}</p>
          <p className="truncate text-[12px]">
            <span style={{ color: info.hue }} className="font-semibold">
              {info.word}
            </span>
            {pct ? <span className="opacity-70"> · {pct}</span> : null}
          </p>
        </div>
        {size === 's' ? <VacButton v={v} act={act} kind="main" size="sm" iconOnly /> : null}
      </div>
      <div className="min-h-0 flex-1">{plan}</div>
      {size === 't' ? (
        <>
          <p className="line-clamp-2 text-[12px] opacity-60">{info.detail}</p>
          <div className="flex gap-1.5">
            <VacButton v={v} act={act} kind="main" size="sm" className="flex-1" />
            <VacButton v={v} act={act} kind="dock" size="sm" iconOnly />
          </div>
        </>
      ) : null}
    </section>
  );
}

