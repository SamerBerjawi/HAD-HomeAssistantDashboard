/**
 * Vacuum tiles · batch 1 · Robot status (docs/pro-ui/VACUUM_TILES.md): what the robot is doing
 * and the one obvious next step.
 * A · Radar: the robot from above, its laser turret spinning, sonar rings rippling out while it
 *     works, the battery a ring around it (Dreame and Roborock's home screen, made calm).
 * B · Trail: the run as a serpentine cleaning path that draws in as the area grows, the robot at
 *     its tip (the apps' live map, without a map).
 * C · Mission: the job as steps (Clean → Return → Wash → Dry), the step under way lit; the
 *     station's own work is part of the run (Dreame's self-wash flow).
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, DropletIcon, Home01Icon, RoboticIcon, Sun03Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { minutesText, statusWords } from '../../../../lib/vacuums/cleaner';
import { BatteryText, Big, CH, IconChip, RobotTop, RunButtons, runShare, toneHue, wash, XsRow, type CleanerTileProps } from '../cleanerTileKit';

const working = (c: CleanerTileProps['c']) => ['cleaning', 'returning', 'washing', 'drying', 'emptying'].includes(c.activity);
const runLine = (c: CleanerTileProps['c']) => [c.run?.areaM2 != null ? `${c.run.areaM2} m²` : null, c.run?.minutes != null ? minutesText(c.run.minutes) : null].filter(Boolean).join(' · ');

// ---------------------------------------------------------------------------------------------
// A · Radar
// ---------------------------------------------------------------------------------------------

function Radar({ c, px }: { c: CleanerTileProps['c']; px: number }) {
  const s = statusWords(c);
  const hue = toneHue(s.tone);
  const bat = c.battery ?? 0;
  const r = px / 2 - 3;
  const len = 2 * Math.PI * r;
  const on = c.activity === 'cleaning';
  return (
    <span aria-hidden className="relative grid shrink-0 place-items-center" style={{ width: px, height: px }}>
      {on
        ? [0, 1, 2].map((i) => (
            <span key={i} className="absolute inset-[14%] rounded-full border motion-safe:animate-ping" style={{ borderColor: `color-mix(in srgb, ${hue} 45%, transparent)`, animationDuration: '2.4s', animationDelay: `${i * 0.8}s` }} />
          ))
        : null}
      <svg width={px} height={px} className="absolute inset-0 -rotate-90">
        <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={4} />
        {c.battery !== null ? <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke={bat <= 20 ? CH.bad : hue} strokeWidth={4} strokeLinecap="round" strokeDasharray={`${(len * bat) / 100} ${len}`} /> : null}
      </svg>
      <RobotTop px={px * 0.6} hue={hue} working={working(c)} />
    </span>
  );
}

export function StatusRadar({ c, size, act }: CleanerTileProps) {
  const s = statusWords(c);
  const hue = toneHue(s.tone);
  const bg = wash(hue, s.tone === 'ok' || s.tone === 'idle' ? 6 : 14);
  if (size === 'xs') return <XsRow label={c.name} style={bg} visual={<Radar c={c} px={44} />} word={s.word} hue={hue} detail={s.detail} aside={<RunButtons c={c} act={act} size="sm" iconOnly />} />;
  if (size === 's')
    return (
      <TileFrame label={c.name} className="pro-surface" style={bg}>
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-start justify-between">
            <Radar c={c} px={58} />
            <BatteryText c={c} />
          </div>
          <p className="mt-auto truncate text-[15px] font-semibold" style={{ color: hue }}>
            {s.word}
          </p>
          <TileState>{s.detail || c.name}</TileState>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label={c.name} className="pro-surface" style={bg}>
        <div className="flex h-full items-center gap-4 p-4">
          <Radar c={c} px={112} />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="min-w-0">
              <TileName>{c.name}</TileName>
              <p className="truncate text-[20px] font-semibold leading-tight" style={{ color: hue }}>
                {s.word}
              </p>
              <TileState>{s.detail}</TileState>
            </div>
            <RunButtons c={c} act={act} size="sm" />
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label={c.name} className="pro-surface" style={bg}>
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <TileName className="text-[17px]">{c.name}</TileName>
          <BatteryText c={c} />
        </div>
        <div className="grid flex-1 place-items-center">
          <Radar c={c} px={150} />
        </div>
        <p className="text-center text-[22px] font-semibold leading-tight" style={{ color: hue }}>
          {s.word}
        </p>
        <TileState className="mb-3 text-center">{s.detail || c.run?.mode || ''}</TileState>
        <RunButtons c={c} act={act} />
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Trail
// ---------------------------------------------------------------------------------------------

/** A back-and-forth cleaning path in a 100 × 60 box, drawn to `share`, the robot at its tip. */
function Trail({ c, className }: { c: CleanerTileProps['c']; className?: string }) {
  const s = statusWords(c);
  const hue = toneHue(s.tone);
  const share = c.activity === 'cleaning' || c.activity === 'paused' || c.activity === 'error' ? runShare(c) ?? 0.4 : c.run?.areaM2 ? 1 : 0;
  const rows = 6;
  const pts: [number, number][] = [];
  for (let i = 0; i < rows; i++) {
    const y = 6 + i * 9.6;
    pts.push(i % 2 ? [94, y] : [6, y], i % 2 ? [6, y] : [94, y]);
  }
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
  // The tip: walk the polyline to `share` of its length.
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let left = total * share;
  let tip = pts[0];
  for (let i = 0; i < segs.length; i++) {
    if (left <= segs[i]) {
      const t = segs[i] ? left / segs[i] : 0;
      tip = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t];
      break;
    }
    left -= segs[i];
    tip = pts[i + 1];
  }
  const docked = !['cleaning', 'paused', 'error', 'returning'].includes(c.activity);
  return (
    <div aria-hidden className={cn('relative', className)}>
      <svg viewBox="0 0 100 60" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
        <path d={d} fill="none" stroke="currentColor" strokeOpacity={0.08} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d={d} fill="none" stroke={hue} strokeOpacity={docked ? 0.35 : 0.85} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" pathLength={100} strokeDasharray="100 100" strokeDashoffset={100 - share * 100} vectorEffect="non-scaling-stroke" style={{ transition: 'stroke-dashoffset 600ms ease' }} />
      </svg>
      {!docked ? <RobotTop px={22} hue={hue} working={c.activity === 'cleaning'} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${tip[0]}%`, top: `${(tip[1] / 60) * 100}%` }} /> : null}
      {docked ? (
        <span className="absolute -bottom-1 right-0 grid size-6 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${CH.ok} 18%, transparent)`, color: CH.ok }}>
          <HugeiconsIcon icon={Home01Icon} size={13} />
        </span>
      ) : null}
    </div>
  );
}

export function StatusTrail({ c, size, act }: CleanerTileProps) {
  const s = statusWords(c);
  const hue = toneHue(s.tone);
  const run = runLine(c);
  if (size === 'xs')
    return (
      <TileFrame label={c.name} className="pro-surface">
        <div className="flex h-full items-center gap-3 px-3">
          <Trail c={c} className="h-9 w-14 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold" style={{ color: hue }}>
              {s.word}
            </p>
            <TileState className="text-[12px]">{run || s.detail}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label={c.name} className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <Trail c={c} className="h-14 w-full" />
          <p className="mt-auto truncate text-[15px] font-semibold" style={{ color: hue }}>
            {s.word}
          </p>
          <TileState>{run || s.detail}</TileState>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label={c.name} className="pro-surface">
        <div className="flex h-full gap-4 p-4">
          <div className="flex w-[46%] min-w-0 flex-col">
            <TileName>{c.name}</TileName>
            <p className="truncate text-[18px] font-semibold leading-tight" style={{ color: hue }}>
              {s.word}
            </p>
            <TileState>{c.run?.room ?? s.detail}</TileState>
            <RunButtons c={c} act={act} size="sm" dock={false} className="mt-auto" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <Trail c={c} className="w-full flex-1" />
            <p className="mt-2 text-right text-[13px] font-semibold tabular-nums opacity-80">{run || '—'}</p>
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label={c.name} className="pro-surface">
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <TileName className="text-[17px]">{c.name}</TileName>
            <p className="truncate text-[22px] font-semibold leading-tight" style={{ color: hue }}>
              {s.word}
            </p>
          </div>
          <BatteryText c={c} />
        </div>
        <Trail c={c} className="my-4 w-full flex-1" />
        <div className="mb-3 grid grid-cols-3 gap-2 text-[12px]">
          <Fact label="Area" value={c.run?.areaM2 != null ? `${c.run.areaM2} m²` : '—'} />
          <Fact label="Time" value={minutesText(c.run?.minutes ?? null)} />
          <Fact label={c.activity === 'cleaning' ? 'Room' : 'Mode'} value={(c.activity === 'cleaning' ? c.run?.room : c.run?.mode?.split(' · ')[0]) ?? '—'} />
        </div>
        <RunButtons c={c} act={act} />
      </div>
    </TileFrame>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate opacity-60">{label}</p>
      <p className="truncate text-[15px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Mission
// ---------------------------------------------------------------------------------------------

const STEPS = [
  { id: 'clean', name: 'Clean', icon: RoboticIcon },
  { id: 'return', name: 'Return', icon: Home01Icon },
  { id: 'wash', name: 'Wash', icon: DropletIcon },
  { id: 'dry', name: 'Dry', icon: Sun03Icon }
] as const;

/** The step under way (0–3), 4 when the last run finished, -1 when there is no run to show. */
function stepOf(c: CleanerTileProps['c']): number {
  switch (c.activity) {
    case 'cleaning':
    case 'paused':
    case 'error':
      return 0;
    case 'returning':
      return 1;
    case 'washing':
      return 2;
    case 'drying':
      return 3;
    default:
      return c.run ? 4 : -1;
  }
}

function Steps({ c, labels, className }: { c: CleanerTileProps['c']; labels?: boolean; className?: string }) {
  const s = statusWords(c);
  const hue = toneHue(s.tone);
  const steps = c.station ? STEPS : STEPS.slice(0, 2);
  const at = stepOf(c);
  return (
    <ol aria-label="Steps of the run" className={cn('flex items-center', className)}>
      {steps.map((st, i) => {
        const done = at > i;
        const now = at === i;
        const color = now ? hue : done ? CH.ok : undefined;
        return (
          <li key={st.id} className="flex flex-1 items-center last:flex-none">
            <span className="flex flex-col items-center gap-1">
              <span
                className={cn('grid size-8 place-items-center rounded-full', now && c.activity !== 'paused' && c.activity !== 'error' && 'motion-safe:animate-pulse')}
                style={{ background: color ? `color-mix(in srgb, ${color} ${now ? 22 : 14}%, transparent)` : 'color-mix(in srgb, currentColor 7%, transparent)', color, boxShadow: now ? `0 0 0 2px ${color}` : undefined }}
              >
                <HugeiconsIcon icon={done ? CheckmarkCircle02Icon : st.icon} size={15} />
              </span>
              {labels ? <span className={cn('text-[11px] font-medium', !now && 'opacity-60')}>{st.name}</span> : null}
            </span>
            {i < steps.length - 1 ? <span className="mx-1 h-0.5 flex-1 rounded-full" style={{ background: done ? CH.ok : 'color-mix(in srgb, currentColor 10%, transparent)', marginBottom: labels ? 18 : 0 }} /> : null}
          </li>
        );
      })}
    </ol>
  );
}

export function StatusMission({ c, size, act }: CleanerTileProps) {
  const s = statusWords(c);
  const hue = toneHue(s.tone);
  if (size === 'xs') return <XsRow label={c.name} visual={<IconChip icon={STEPS[Math.max(0, Math.min(3, stepOf(c)))].icon} hue={hue} px={34} />} word={s.word} hue={hue} detail={s.detail} aside={<RunButtons c={c} act={act} size="sm" iconOnly />} />;
  if (size === 's')
    return (
      <TileFrame label={c.name} className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <Steps c={c} />
          <p className="mt-auto truncate text-[15px] font-semibold" style={{ color: hue }}>
            {s.word}
          </p>
          <TileState>{s.detail || c.name}</TileState>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label={c.name} className="pro-surface">
        <div className="flex h-full flex-col p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <TileName>{c.name}</TileName>
              <p className="truncate text-[18px] font-semibold leading-tight" style={{ color: hue }}>
                {s.word} <span className="text-[13px] font-medium opacity-70">{s.detail}</span>
              </p>
            </div>
            <RunButtons c={c} act={act} size="sm" iconOnly />
          </div>
          <Steps c={c} labels className="mt-auto" />
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label={c.name} className="pro-surface">
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <TileName className="text-[17px]">{c.name}</TileName>
          <BatteryText c={c} />
        </div>
        <p className="mt-1 text-[24px] font-semibold leading-tight" style={{ color: hue }}>
          {s.word}
        </p>
        <TileState>{s.detail}</TileState>
        <Steps c={c} labels className="my-auto" />
        <div className="mb-3 flex items-end justify-between gap-3">
          <Big n={c.run?.areaM2 ?? '—'} unit="m²" className="text-[34px]" />
          <p className="text-right text-[13px] opacity-70">
            {minutesText(c.run?.minutes ?? null)}
            <br />
            {c.run?.mode ?? ''}
          </p>
        </div>
        <RunButtons c={c} act={act} />
      </div>
    </TileFrame>
  );
}
