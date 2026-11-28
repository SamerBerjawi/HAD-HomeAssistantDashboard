/**
 * Reading B · "Trend". The number and where it's heading: a big value, the change over the last
 * hour ("↑ 0.4° in 1 h"), and a line of the last six hours with its low and high marked and a dot
 * at now. The comfortable band shades the chart from Wide up, so "is this normal" is answered too.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../tileKit';
import type { ReadingTileModel, TileProps } from '../../tileTypes';
import { deltaText, LEVEL_HUE, readingIcon, readingOf, ReadingValue, smoothPath, type Reading } from '../climate/climateParts';

const LINE = 'hsl(215 80% 58%)';

function Chart({ r, info, band, marks, className }: { r: ReadingTileModel; info: Reading; band?: boolean; marks?: boolean; className?: string }) {
  const h = r.history;
  if (!r.available || h.length < 2 || info.lo === null || info.hi === null) {
    return <div aria-hidden className={cn('grid place-items-center text-[12px] opacity-40', className)}>No history</div>;
  }
  const span = info.hi - info.lo || 1;
  const range: [number, number] = [info.lo - span * 0.25, info.hi + span * 0.25];
  const W = 100;
  const H = 40;
  const pad = 0;
  const y = (v: number) => `${(1 - (v - range[0]) / (range[1] - range[0])) * 100}%`;
  const path = smoothPath(h, W, H, pad, range);
  const id = `trend-${r.entityId.replace(/\W/g, '')}`;
  const last = h[h.length - 1];
  const lab = (v: number) => readingOf({ ...r, value: v }).value;
  return (
    <div aria-hidden className={cn('relative', className)}>
      {band && info.band ? (
        <div className="absolute inset-0 overflow-hidden rounded-sm">
          <div
            className="absolute inset-x-0"
            style={{ top: y(Math.min(range[1], info.band[1])), bottom: `calc(100% - ${y(Math.max(range[0], info.band[0]))})`, background: `color-mix(in srgb, ${LEVEL_HUE.good} 10%, transparent)` }}
          />
        </div>
      ) : null}
      {marks ? (
        <>
          {[info.hi, info.lo].map((v, i) => (
            <div key={i} className="absolute inset-x-0 border-t border-dashed border-current opacity-20" style={{ top: y(v) }} />
          ))}
          <span className="absolute right-0 -translate-y-full pb-0.5 text-[10px] tabular-nums opacity-55" style={{ top: y(info.hi) }}>
            {lab(info.hi)}
          </span>
          <span className="absolute right-0 pt-0.5 text-[10px] tabular-nums opacity-55" style={{ top: y(info.lo) }}>
            {lab(info.lo)}
          </span>
        </>
      ) : null}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={LINE} stopOpacity={0.22} />
            <stop offset="1" stopColor={LINE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={`${path} L ${W} ${H} L 0 ${H} Z`} fill={`url(#${id})`} />
        <path d={path} fill="none" stroke={LINE} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
      </svg>
      <span className="absolute right-0 size-2.5 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-[var(--surface)]" style={{ top: y(last), background: LINE, boxShadow: `0 0 0 3px color-mix(in srgb, ${LINE} 22%, transparent)` }} />
    </div>
  );
}

export default function ReadingTrend({ e: r, size }: TileProps<ReadingTileModel>) {
  const info = readingOf(r);
  const delta = deltaText(r, info.delta);
  const frame = cn('pro-surface', !r.available && 'opacity-60');
  const icon = readingIcon(r);
  const lab = (v: number | null) => (v === null ? '—' : readingOf({ ...r, value: v }).value);
  const Value = ({ className }: { className?: string }) => <ReadingValue info={info} className={className} />;
  const Delta = ({ className }: { className?: string }) => (delta ? <p className={cn('truncate text-[12px] font-medium opacity-60', className)}>{r.available ? delta : 'Unavailable'}</p> : !r.available ? <p className={cn('text-[12px] opacity-60', className)}>Unavailable</p> : null);
  const Head = ({ className }: { className?: string }) => (
    <div className={cn('flex items-center gap-1.5', className)}>
      <HugeiconsIcon icon={icon} size={15} className="shrink-0 opacity-60" />
      <TileName className="line-clamp-1 flex-1 truncate text-[14px]">{r.name}</TileName>
    </div>
  );

  if (size === 'xs') {
    return (
      <TileFrame label={r.name} className={frame}>
        <div className="flex h-full items-center gap-3 px-3.5">
          <div className="min-w-0 flex-1">
            <TileState className="text-[12px]">{r.name}</TileState>
            <Value className="mt-0.5 text-[20px]" />
          </div>
          <Chart r={r} info={info} className="h-8 w-[42%] shrink-0 mr-1" />
        </div>
      </TileFrame>
    );
  }
  if (size === 's') {
    return (
      <TileFrame label={r.name} className={frame}>
        <div className="flex h-full flex-col">
          <div className="px-3.5 pt-3.5">
            <Head />
            <Value className="mt-2.5 text-[28px]" />
            <Delta className="mt-1" />
          </div>
          <Chart r={r} info={info} className="mx-3.5 mb-3.5 mt-auto h-10" />
        </div>
      </TileFrame>
    );
  }
  if (size === 'w') {
    return (
      <TileFrame label={r.name} className={frame}>
        <div className="flex h-full gap-4 p-4">
          <div className="flex w-[38%] min-w-0 shrink-0 flex-col">
            <Head />
            <Value className="mt-auto text-[30px]" />
            <Delta className="mt-1.5" />
          </div>
          <Chart r={r} info={info} band marks className="my-2 mr-1 flex-1" />
        </div>
      </TileFrame>
    );
  }
  if (size === 't') {
    return (
      <TileFrame label={r.name} className={frame}>
        <div className="flex h-full flex-col p-4">
          <Head />
          <Value className="mt-3 text-[32px]" />
          <Delta className="mt-1.5" />
          <Chart r={r} info={info} band marks className="my-4 mr-1 min-h-0 flex-1" />
          <div className="flex justify-between text-[11px] opacity-55">
            <span>6 h ago</span>
            <span>Now</span>
          </div>
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={r.name} className={frame}>
      <div className="flex h-full flex-col p-5">
        <Head />
        <div className="mt-3 flex items-end gap-4">
          <Value className="text-[44px]" />
          <div className="pb-1">
            <Delta className="text-[13px]" />
            {info.word ? (
              <p className="text-[13px] font-semibold" style={{ color: info.hue }}>
                {info.word}
              </p>
            ) : null}
          </div>
        </div>
        <Chart r={r} info={info} band marks className="my-4 mr-1 min-h-0 flex-1" />
        <div className="flex justify-between text-[11px] tabular-nums opacity-55">
          <span>6 h ago</span>
          <span>
            Low {lab(info.lo)} · High {lab(info.hi)}
          </span>
          <span>Now</span>
        </div>
      </div>
    </TileFrame>
  );
}
