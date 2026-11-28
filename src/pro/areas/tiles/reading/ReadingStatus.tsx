/**
 * Reading C · "Status". The verdict first: "Comfortable", "Dry", "Stuffy", in green, amber or red,
 * with what to do about it ("Open a window"). The number comes second. The tile takes a soft wash
 * of the verdict's colour so a room's problems stand out from across the page. From Tall up, a
 * band meter shows where the value sits against the ideal range.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../tileKit';
import type { ReadingTileModel, TileProps } from '../../tileTypes';
import { LEVEL_HUE, readingIcon, readingOf, ReadingValue, type Reading } from '../climate/climateParts';

function BandMeter({ r, info, labels, className }: { r: ReadingTileModel; info: Reading; labels?: boolean; className?: string }) {
  if (!info.band || r.value === null || !r.available) return null;
  const [lo, hi] = info.scale;
  const f = (v: number) => `${Math.max(0, Math.min(1, (v - lo) / (hi - lo))) * 100}%`;
  return (
    <div aria-hidden className={className}>
      <div className="relative h-2 rounded-full bg-[color-mix(in_srgb,currentColor_9%,transparent)]">
        <div className="absolute inset-y-0 rounded-full" style={{ left: f(info.band[0]), right: `calc(100% - ${f(info.band[1])})`, background: `color-mix(in srgb, ${LEVEL_HUE.good} 45%, transparent)` }} />
        <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[var(--surface)]" style={{ left: f(r.value), background: info.hue }} />
      </div>
      {labels ? (
        <div className="relative mt-1.5 h-3 text-[10px] tabular-nums opacity-50">
          <span className="absolute left-0">{lo}</span>
          <span className="absolute right-0">{hi}</span>
        </div>
      ) : null}
    </div>
  );
}

export default function ReadingStatus({ e: r, size }: TileProps<ReadingTileModel>) {
  const info = readingOf(r);
  const icon = readingIcon(r);
  const judged = r.available && info.level !== 'none';
  const wash = judged ? { background: `linear-gradient(150deg, color-mix(in srgb, ${info.hue} ${info.level === 'good' ? 12 : 20}%, var(--surface)), var(--surface) 75%)` } : undefined;
  const frame = cn(!judged && 'pro-surface', judged && 'shadow-[0_1px_2px_rgba(0,0,0,0.06)]', !r.available && 'opacity-60');
  // Unknown device classes have no verdict: the value leads instead.
  const word = !r.available ? 'Unavailable' : info.word || info.value;
  const Word = ({ className }: { className?: string }) => (
    <p className={cn('font-semibold leading-[1.05] tracking-[-0.02em]', className)} style={judged ? { color: info.hue } : undefined}>
      {word}
    </p>
  );
  const Chip = ({ px = 30 }: { px?: number }) => (
    <span className="grid shrink-0 place-items-center rounded-full" style={{ width: px, height: px, background: judged ? `color-mix(in srgb, ${info.hue} 16%, transparent)` : 'color-mix(in srgb, currentColor 8%, transparent)', color: judged ? info.hue : undefined }}>
      <HugeiconsIcon icon={icon} size={Math.round(px * 0.5)} style={{ width: Math.round(px * 0.5), height: Math.round(px * 0.5) }} />
    </span>
  );
  const facts = judged ? `${r.name} · ${info.value}` : r.name;

  if (size === 'xs') {
    return (
      <TileFrame label={r.name} className={frame} style={wash}>
        <div className="flex h-full items-center gap-2.5 px-3">
          <Chip px={34} />
          <div className="min-w-0 flex-1">
            <Word className="truncate text-[15px]" />
            <TileState className="text-[12px]">{facts}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  }
  if (size === 's') {
    return (
      <TileFrame label={r.name} className={frame} style={wash}>
        <div className="flex h-full flex-col p-3.5">
          <Chip />
          <Word className="mt-auto line-clamp-2 text-[21px]" />
          {judged && info.advice ? <p className="mt-1 line-clamp-1 text-[12px] leading-tight opacity-75">{info.advice}</p> : null}
          <TileState className="mt-1 text-[12px]">{facts}</TileState>
        </div>
      </TileFrame>
    );
  }
  if (size === 'w') {
    return (
      <TileFrame label={r.name} className={frame} style={wash}>
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center gap-2">
            <Chip />
            <TileName className="line-clamp-1 flex-1">{r.name}</TileName>
            {judged ? <span className="text-[17px] font-semibold tabular-nums">{info.value}</span> : null}
          </div>
          <Word className="mt-auto truncate text-[26px]" />
          {judged && info.advice ? <p className="mt-1 truncate text-[13px] opacity-75">{info.advice}</p> : null}
          <BandMeter r={r} info={info} className="mt-3" />
        </div>
      </TileFrame>
    );
  }
  if (size === 't') {
    return (
      <TileFrame label={r.name} className={frame} style={wash}>
        <div className="flex h-full flex-col p-4">
          <Chip px={36} />
          <TileName className="mt-3 line-clamp-1">{r.name}</TileName>
          <Word className="mt-auto line-clamp-2 break-words text-[22px]" />
          {judged && info.advice ? <p className="mt-1.5 text-[13px] leading-snug opacity-75">{info.advice}</p> : null}
          {judged ? <ReadingValue info={info} className="mt-4 text-[22px]" /> : null}
          <BandMeter r={r} info={info} labels className="mt-2" />
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={r.name} className={frame} style={wash}>
      <div className="flex h-full flex-col p-5">
        <div className="flex items-center gap-2.5">
          <Chip px={38} />
          <TileName className="flex-1 text-[17px]">{r.name}</TileName>
        </div>
        <Word className="mt-auto text-[40px]" />
        {judged && info.advice ? <p className="mt-2 text-[15px] opacity-75">{info.advice}</p> : null}
        <div className="mt-5 flex items-end gap-5">
          {judged ? <ReadingValue info={info} className="text-[28px]" /> : null}
          {info.ideal && judged ? <p className="pb-0.5 text-[13px] opacity-60">Ideal {info.ideal}</p> : null}
        </div>
        <BandMeter r={r} info={info} labels className="mt-3" />
      </div>
    </TileFrame>
  );
}
