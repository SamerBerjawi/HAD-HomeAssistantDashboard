/**
 * Reading A · "Gauge". A half-dial with the comfortable range marked in green and a needle at the
 * value, in the colour of how good it is. You see at once whether it's in the band and how far
 * out. Larger sizes add the comfort word, the ideal range and the low / high of the last hours.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { arcPath } from '../../gestures';
import { TileFrame, TileName, TileState } from '../../tileKit';
import type { ReadingTileModel, TileProps } from '../../tileTypes';
import { LEVEL_HUE, readingIcon, readingOf, ReadingValue, type Reading } from '../climate/climateParts';

function Dial({ r, info, px, labels, fluid }: { r: ReadingTileModel; info: Reading; px: number; labels?: boolean; fluid?: boolean }) {
  const stroke = Math.max(4, Math.round(px * 0.075));
  const rad = px / 2 - stroke / 2 - 1;
  const cx = px / 2;
  const cy = px / 2;
  const [lo, hi] = info.scale;
  const ang = (v: number) => 180 + Math.max(0, Math.min(1, (v - lo) / (hi - lo))) * 180;
  const val = r.available ? r.value : null;
  const a = val === null ? null : (ang(val) * Math.PI) / 180;
  const needle = rad - stroke * 1.4;
  const h = px / 2 + stroke / 2 + 2;
  return (
    <svg aria-hidden viewBox={`0 0 ${px} ${h + (labels ? 14 : 0)}`} width={fluid ? '100%' : px} height={fluid ? undefined : h + (labels ? 14 : 0)} className="block shrink-0 overflow-visible">
      <path d={arcPath(cx, cy, rad, 180, 360)} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={stroke} strokeLinecap="round" />
      {info.band ? <path d={arcPath(cx, cy, rad, ang(Math.max(lo, info.band[0])), ang(Math.min(hi, info.band[1])))} fill="none" stroke={LEVEL_HUE.good} strokeOpacity={0.55} strokeWidth={stroke} strokeLinecap="round" /> : null}
      {a !== null ? (
        <g className="transition-transform duration-500">
          <line x1={cx + rad * 0.5 * Math.cos(a)} y1={cy + rad * 0.5 * Math.sin(a)} x2={cx + needle * Math.cos(a)} y2={cy + needle * Math.sin(a)} stroke={info.hue} strokeWidth={Math.max(2, stroke * 0.45)} strokeLinecap="round" />
          <circle cx={cx + rad * Math.cos(a)} cy={cy + rad * Math.sin(a)} r={stroke * 0.7} fill="white" stroke={info.hue} strokeWidth={Math.max(2, stroke * 0.4)} />
        </g>
      ) : null}
      {labels ? (
        <>
          <text x={stroke / 2} y={h + 10} fontSize={10} fill="currentColor" fillOpacity={0.5} textAnchor="start">
            {lo}
          </text>
          <text x={px - stroke / 2} y={h + 10} fontSize={10} fill="currentColor" fillOpacity={0.5} textAnchor="end">
            {hi}
          </text>
        </>
      ) : null}
    </svg>
  );
}

export default function ReadingGauge({ e: r, size }: TileProps<ReadingTileModel>) {
  const info = readingOf(r);
  const frame = cn('pro-surface', !r.available && 'opacity-60');
  const icon = readingIcon(r);
  const Word = ({ className }: { className?: string }) => (info.word ? <p className={cn('break-words font-semibold', className)} style={{ color: info.level === 'none' ? undefined : info.hue }}>{info.word}</p> : null);
  const Value = ({ className }: { className?: string }) => <ReadingValue info={info} className={className} />;
  const range = info.lo !== null && info.hi !== null ? `6 h: ${readingOf({ ...r, value: info.lo }).value} – ${readingOf({ ...r, value: info.hi }).value}` : '';

  if (size === 'xs') {
    return (
      <TileFrame label={r.name} className={frame}>
        <div className="flex h-full items-center gap-3 px-3.5">
          <div className="pt-2">
            <Dial r={r} info={info} px={48} />
          </div>
          <div className="min-w-0 flex-1">
            <TileName className="line-clamp-1 truncate text-[14px]">{r.name}</TileName>
            <TileState className="text-[12px] opacity-100">
              <span className="font-semibold">{info.value}</span>
              {info.word ? <span style={{ color: info.hue }}> · {info.word}</span> : null}
            </TileState>
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 's') {
    return (
      <TileFrame label={r.name} className={frame}>
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-center gap-1.5">
            <HugeiconsIcon icon={icon} size={15} className="shrink-0 opacity-60" />
            <TileName className="line-clamp-1 flex-1 truncate text-[14px]">{r.name}</TileName>
          </div>
          <div className="mt-auto flex flex-col items-center">
            <Dial r={r} info={info} px={112} />
            <Value className="-mt-6 text-[22px]" />
            <Word className="mt-1 text-[12px]" />
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 'w') {
    return (
      <TileFrame label={r.name} className={frame}>
        <div className="flex h-full items-center gap-4 p-4">
          <Dial r={r} info={info} px={150} labels />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <TileName className="line-clamp-1">{r.name}</TileName>
            <Value className="mt-1 text-[28px]" />
            <Word className="text-[13px]" />
            {info.ideal ? <TileState className="text-[12px]">Ideal {info.ideal}</TileState> : null}
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 't') {
    return (
      <TileFrame label={r.name} className={frame}>
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center gap-1.5">
            <HugeiconsIcon icon={icon} size={15} className="shrink-0 opacity-60" />
            <TileName className="line-clamp-1 flex-1">{r.name}</TileName>
          </div>
          <div className="my-auto flex flex-col items-center">
            <Dial r={r} info={info} px={132} labels />
            <Value className="mt-2 text-[30px]" />
            <Word className="mt-1.5 text-[14px]" />
          </div>
          <div className="space-y-0.5 text-[12px] opacity-60">
            {info.ideal ? <p>Ideal {info.ideal}</p> : null}
            {range ? <p>{range}</p> : null}
          </div>
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={r.name} className={frame}>
      <div className="flex h-full flex-col p-5">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={icon} size={17} className="shrink-0 opacity-60" />
          <TileName className="flex-1 text-[17px]">{r.name}</TileName>
        </div>
        <div className="flex min-h-0 flex-1 items-center gap-5">
          <div className="relative flex w-[54%] max-w-[220px] shrink-0 flex-col items-center">
            <Dial r={r} info={info} px={210} labels fluid />
            <Value className="absolute bottom-[16%] text-[28px]" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Word className="text-[19px] leading-tight" />
            {info.advice ? <p className="text-[14px] leading-snug opacity-75">{info.advice}</p> : null}
            <div className="mt-2 space-y-0.5 text-[12px] opacity-60">
              {info.ideal ? <p>Ideal {info.ideal}</p> : null}
              {range ? <p>{range}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </TileFrame>
  );
}
