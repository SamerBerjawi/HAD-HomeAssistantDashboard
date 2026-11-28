/**
 * Vacuum tiles · batch 2 · Stick (docs/pro-ui/VACUUM_TILES.md): the stick vacuum, its battery and
 * whether it is home in its station.
 * A · Upright: the stick drawn standing in its clean station, its battery pack lit cell by cell;
 *     lifted out, the station waits with a dashed outline.
 * B · Gauge: the battery as a big arc (Dyson's run-time screen), a chip for In station / In use.
 * C · Status: the verdict first (Ready, Charging 64%, Off the station), a slim battery bar.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { BatteryCharging01Icon, CheckmarkCircle02Icon, Home01Icon, VacuumCleanerIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { arcPath } from '../../../../areas/gestures';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { agoText } from '../../../../areas/tileTypes';
import { statusWords } from '../../../../lib/vacuums/cleaner';
import { BatteryText, Big, CH, IconChip, toneHue, wash, XsRow, type CleanerTileProps } from '../cleanerTileKit';

const batHue = (c: CleanerTileProps['c']) => ((c.battery ?? 100) <= 20 ? CH.bad : c.charging ? CH.on : CH.ok);
const home = (c: CleanerTileProps['c']) => c.dock?.inStation !== false;
const placeWord = (c: CleanerTileProps['c']) => (home(c) ? 'In station' : 'In use');

// ---------------------------------------------------------------------------------------------
// A · Upright
// ---------------------------------------------------------------------------------------------

/** The stick in its station, from the front, `h` px tall. */
export function Upright({ c, h }: { c: CleanerTileProps['c']; h: number }) {
  const w = h * 0.42;
  const cells = 5;
  const lit = Math.round(((c.battery ?? 0) / 100) * cells);
  const hue = batHue(c);
  const inSt = home(c);
  const emptying = c.activity === 'emptying';
  return (
    <div aria-hidden className="relative shrink-0" style={{ width: w, height: h }}>
      {/* station tower */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-[10px] rounded-b-[6px] bg-[linear-gradient(170deg,hsl(0_0%_99%),hsl(220_10%_86%))] shadow-[0_8px_18px_-10px_rgba(0,0,0,0.45)] ring-1 ring-black/5 dark:bg-[linear-gradient(170deg,hsl(225_8%_32%),hsl(225_10%_18%))] dark:ring-white/10" style={{ width: w, height: h * 0.42 }}>
        {emptying ? (
          <span className="absolute inset-x-[30%] top-[18%] h-[50%] overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
            <span className="absolute inset-0 rounded-full border-2 border-dashed motion-safe:animate-spin [animation-duration:1.2s]" style={{ borderColor: CH.on }} />
          </span>
        ) : (
          <span className="absolute inset-x-[34%] top-[22%] h-[10%] rounded-full" style={{ background: c.dock?.bagFull ? CH.watch : 'color-mix(in srgb, currentColor 12%, transparent)' }} />
        )}
      </div>
      {/* the stick, or its outline when it is out */}
      <div className={cn('absolute left-1/2 -translate-x-1/2 transition-transform duration-500', !inSt && '-translate-y-[14%] opacity-0')} style={{ bottom: h * 0.3, width: w * 0.5, height: h * 0.7 }}>
        <span className="absolute left-1/2 top-0 h-[16%] w-[70%] -translate-x-1/2 rounded-t-full border-[3px] border-b-0 border-[hsl(225_10%_30%)] dark:border-[hsl(225_8%_70%)]" />
        <span className="absolute left-1/2 top-[15%] h-[40%] w-[64%] -translate-x-1/2 overflow-hidden rounded-[8px] bg-[hsl(225_10%_26%)] p-[10%] dark:bg-[hsl(225_8%_14%)]">
          <span className="flex h-full flex-col-reverse gap-[8%]">
            {Array.from({ length: cells }, (_, i) => (
              <span key={i} className={cn('flex-1 rounded-[2px]', c.charging && i === lit - 1 && 'motion-safe:animate-pulse')} style={{ background: i < lit ? hue : 'rgba(255,255,255,0.08)' }} />
            ))}
          </span>
        </span>
        <span className="absolute left-1/2 top-[55%] h-[45%] w-[14%] -translate-x-1/2 rounded-b-full bg-[hsl(220_10%_70%)] dark:bg-[hsl(225_8%_45%)]" />
      </div>
      {!inSt ? <span className="absolute left-1/2 -translate-x-1/2 rounded-[8px] border-2 border-dashed opacity-40" style={{ bottom: h * 0.3, width: w * 0.5, height: h * 0.62, borderColor: 'currentColor' }} /> : null}
    </div>
  );
}

export function StickUpright({ c, size, now }: CleanerTileProps) {
  const s = statusWords(c);
  const hue = toneHue(s.tone);
  const last = c.dock?.lastEmptied ? `Emptied ${agoText(c.dock.lastEmptied, now).toLowerCase()}` : '';
  if (size === 'xs') return <XsRow label={c.name} visual={<Upright c={c} h={52} />} word={s.word} hue={hue} detail={placeWord(c)} aside={<BatteryText c={c} />} />;
  if (size === 's')
    return (
      <TileFrame label={c.name} className="pro-surface">
        <div className="flex h-full gap-3 p-3.5">
          <Upright c={c} h={118} />
          <div className="flex min-w-0 flex-1 flex-col justify-end">
            <Big n={c.battery ?? '—'} unit="%" className="text-[26px]" />
            <p className="truncate text-[14px] font-semibold" style={{ color: hue }}>
              {s.word}
            </p>
          </div>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label={c.name} className="pro-surface">
        <div className="flex h-full items-end gap-4 p-4">
          <Upright c={c} h={118} />
          <div className="min-w-0 flex-1 self-stretch">
            <TileName>{c.name}</TileName>
            <p className="truncate text-[18px] font-semibold leading-tight" style={{ color: hue }}>
              {s.word}
            </p>
            <TileState>{[placeWord(c), last].filter(Boolean).join(' · ')}</TileState>
          </div>
          <Big n={c.battery ?? '—'} unit="%" className="text-[40px]" />
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label={c.name} className="pro-surface">
      <div className="flex h-full flex-col p-5">
        <TileName className="text-[17px]">{c.name}</TileName>
        <p className="truncate text-[22px] font-semibold leading-tight" style={{ color: hue }}>
          {s.word}
        </p>
        <div className="flex flex-1 items-end justify-between gap-4">
          <Upright c={c} h={190} />
          <div className="pb-1 text-right">
            <Big n={c.battery ?? '—'} unit="%" className="text-[48px]" />
            <TileState className="mt-1">{placeWord(c)}</TileState>
            <TileState>{last}</TileState>
          </div>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Gauge
// ---------------------------------------------------------------------------------------------

function Gauge({ c, px, children }: { c: CleanerTileProps['c']; px: number; children?: React.ReactNode }) {
  const stroke = Math.max(6, Math.round(px * 0.09));
  const r = px / 2 - stroke;
  const from = 135;
  const sweep = 270;
  const b = c.battery ?? 0;
  const hue = batHue(c);
  return (
    <div className="relative shrink-0" style={{ width: px, height: px }} role="img" aria-label={`${b}% battery`}>
      <svg aria-hidden width={px} height={px} className="absolute inset-0">
        <path d={arcPath(px / 2, px / 2, r, from, from + sweep)} fill="none" stroke="currentColor" strokeOpacity={0.1} strokeWidth={stroke} strokeLinecap="round" />
        {b > 0 ? <path d={arcPath(px / 2, px / 2, r, from, from + (sweep * b) / 100)} fill="none" stroke={hue} strokeWidth={stroke} strokeLinecap="round" className={cn(c.charging && 'motion-safe:animate-pulse')} style={{ filter: `drop-shadow(0 0 ${stroke / 2}px color-mix(in srgb, ${hue} 50%, transparent))` }} /> : null}
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

function PlaceChip({ c }: { c: CleanerTileProps['c'] }) {
  const inSt = home(c);
  const hue = inSt ? CH.ok : CH.on;
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: `color-mix(in srgb, ${hue} 14%, transparent)`, color: hue }}>
      <HugeiconsIcon icon={inSt ? Home01Icon : VacuumCleanerIcon} size={12} />
      {placeWord(c)}
    </span>
  );
}

export function StickGauge({ c, size }: CleanerTileProps) {
  const s = statusWords(c);
  const hue = toneHue(s.tone);
  if (size === 'xs') return <XsRow label={c.name} visual={<Gauge c={c} px={44}><HugeiconsIcon icon={c.charging ? BatteryCharging01Icon : VacuumCleanerIcon} size={15} /></Gauge>} word={`${c.battery ?? '—'}%`} detail={s.word} aside={<PlaceChip c={c} />} />;
  if (size === 's')
    return (
      <TileFrame label={c.name} className="pro-surface">
        <div className="flex h-full flex-col items-center p-3">
          <Gauge c={c} px={96}>
            <Big n={c.battery ?? '—'} unit="%" className="text-[24px]" />
          </Gauge>
          <p className="-mt-2 truncate text-[13px] font-semibold" style={{ color: hue }}>
            {s.word}
          </p>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label={c.name} className="pro-surface">
        <div className="flex h-full items-center gap-4 p-4">
          <Gauge c={c} px={118}>
            <Big n={c.battery ?? '—'} unit="%" className="text-[28px]" />
          </Gauge>
          <div className="min-w-0 flex-1">
            <TileName>{c.name}</TileName>
            <p className="truncate text-[18px] font-semibold" style={{ color: hue }}>
              {s.word}
            </p>
            <div className="mt-2">
              <PlaceChip c={c} />
            </div>
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label={c.name} className="pro-surface">
      <div className="flex h-full flex-col items-center p-5">
        <div className="flex w-full items-start justify-between gap-2">
          <TileName className="text-[17px]">{c.name}</TileName>
          <PlaceChip c={c} />
        </div>
        <Gauge c={c} px={190}>
          <div className="text-center">
            <Big n={c.battery ?? '—'} unit="%" className="text-[48px]" />
            <p className="mt-1 text-[14px] font-semibold" style={{ color: hue }}>
              {s.word}
            </p>
          </div>
        </Gauge>
        <TileState className="mt-auto">{c.model ?? ''}</TileState>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Status
// ---------------------------------------------------------------------------------------------

export function StickStatus({ c, size, now }: CleanerTileProps) {
  const s = statusWords(c);
  const hue = toneHue(s.tone);
  const bar = (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,currentColor_8%,transparent)]">
      <span className="block h-full rounded-full" style={{ width: `${c.battery ?? 0}%`, background: batHue(c) }} />
    </span>
  );
  const icon = s.tone === 'ok' ? CheckmarkCircle02Icon : c.charging ? BatteryCharging01Icon : VacuumCleanerIcon;
  const bg = wash(hue, s.tone === 'ok' ? 8 : 12);
  if (size === 'xs') return <XsRow label={c.name} style={bg} visual={<IconChip icon={icon} hue={hue} px={34} />} word={s.word} hue={hue} detail={placeWord(c)} aside={<BatteryText c={c} />} />;
  return (
    <TileFrame label={c.name} className="pro-surface" style={bg}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 'w' ? 'p-4' : 'p-3.5')}>
        <div className="flex items-start justify-between gap-2">
          <IconChip icon={icon} hue={hue} px={size === 'l' ? 40 : 30} />
          <BatteryText c={c} />
        </div>
        {size === 'l' ? <TileName className="mt-3 text-[17px]">{c.name}</TileName> : null}
        <p className={cn('mt-auto truncate font-semibold leading-tight', size === 'l' ? 'text-[30px]' : size === 'w' ? 'text-[22px]' : 'text-[16px]')} style={{ color: hue }}>
          {s.word}
        </p>
        <TileState className="mb-2">{size === 's' ? placeWord(c) : [size === 'w' ? c.name : null, placeWord(c), c.dock?.lastEmptied ? `emptied ${agoText(c.dock.lastEmptied, now).toLowerCase()}` : null].filter(Boolean).join(' · ')}</TileState>
        {bar}
      </div>
    </TileFrame>
  );
}
