/**
 * Vacuum tiles · batch 2 · Clean station and Energy (docs/pro-ui/VACUUM_TILES.md): the stick's
 * auto-empty station (the dust bag, how often it emptied, the last time) and what it costs to run.
 *
 * Clean station
 * A · Bag: the dust bag drawn, a dot inside for every empty since the bag was changed; amber and
 *     full when the station says so. Empty now.
 * B · Swirl: the empty itself: a cyclone that spins while the bin empties, "Emptied 2 h ago" big.
 * C · Ledger: plain rows: Dust bag OK / Full, Empties so far, Last emptied; Empty now.
 *
 * Energy
 * A · Split: the energy used as a bar, the part the station's AI saved in green beside it.
 * B · Live: power now big, a pulse while charging; the totals small.
 * C · Numbers: used, saved and last session as three figures.
 * The bag's size isn't reported, so the Bag's dots count empties, they don't measure fill.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, CheckmarkCircle02Icon, Delete02Icon, FlashIcon, Recycle01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { agoText } from '../../../../areas/tileTypes';
import { Big, CH, ChoreButton, IconChip, wash, XsRow, type CleanerTileProps } from '../cleanerTileKit';

function dockWords(c: CleanerTileProps['c'], now: number) {
  const d = c.dock;
  if (!d) return { word: 'No station', detail: '', hue: CH.idle };
  if (d.emptying) return { word: 'Emptying', detail: 'Into the dust bag', hue: CH.on };
  if (d.bagFull) return { word: 'Dust bag full', detail: 'Replace the bag', hue: CH.watch };
  return { word: 'Bag OK', detail: d.lastEmptied ? `Emptied ${agoText(d.lastEmptied, now).toLowerCase()}` : 'Not emptied yet', hue: CH.ok };
}

function EmptyButton({ c, act }: CleanerTileProps) {
  if (!c.actions.includes('empty')) return null;
  const off = c.dock?.inStation === false || !!c.dock?.emptying || !!c.dock?.bagFull;
  return <ChoreButton icon={Delete02Icon} label={c.dock?.emptying ? 'Emptying' : 'Empty now'} isDisabled={off} onPress={() => act({ type: 'empty' })} />;
}

// ---------------------------------------------------------------------------------------------
// Clean station · A · Bag
// ---------------------------------------------------------------------------------------------

function Bag({ c, h }: { c: CleanerTileProps['c']; h: number }) {
  const n = c.dock?.cycles ?? 0;
  const full = !!c.dock?.bagFull;
  const hue = full ? CH.watch : CH.idle;
  const shown = Math.min(n, 48);
  return (
    <div aria-hidden className="relative shrink-0" style={{ width: h * 0.72, height: h }}>
      <svg viewBox="0 0 72 100" className="absolute inset-0 h-full w-full overflow-visible">
        <path d="M14 10 H58 L64 88 Q64 96 56 96 H16 Q8 96 8 88 Z" fill={`color-mix(in srgb, ${hue} ${full ? 22 : 8}%, transparent)`} stroke={hue} strokeOpacity={full ? 1 : 0.5} strokeWidth={2} strokeLinejoin="round" />
        <rect x={20} y={4} width={32} height={10} rx={3} fill="currentColor" fillOpacity={0.2} />
      </svg>
      <div className="absolute inset-x-[18%] bottom-[9%] top-[20%] flex flex-wrap-reverse content-start gap-[3px]">
        {Array.from({ length: shown }, (_, i) => (
          <span key={i} className={cn('size-[7px] rounded-full', c.dock?.emptying && i === shown - 1 && 'motion-safe:animate-bounce')} style={{ background: full ? CH.watch : 'color-mix(in srgb, currentColor 35%, transparent)' }} />
        ))}
      </div>
    </div>
  );
}

export function DockBag(p: CleanerTileProps) {
  const { c, size, now } = p;
  const w = dockWords(c, now);
  const cycles = c.dock?.cycles;
  const bg = c.dock?.bagFull ? wash(CH.watch, 10) : undefined;
  if (size === 'xs') return <XsRow label="Clean station" style={bg} visual={<Bag c={c} h={50} />} word={w.word} hue={w.hue} detail={cycles != null ? `${cycles} empties` : w.detail} />;
  if (size === 's')
    return (
      <TileFrame label="Clean station" className="pro-surface" style={bg}>
        <div className="flex h-full gap-3 p-3.5">
          <Bag c={c} h={116} />
          <div className="flex min-w-0 flex-1 flex-col justify-end">
            <Big n={cycles ?? '—'} className="text-[26px]" />
            <p className="text-[11px] opacity-60">empties</p>
            <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-tight" style={{ color: w.hue }}>
              {w.word}
            </p>
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Clean station" className="pro-surface" style={bg}>
      <div className={cn('flex h-full gap-4', size === 'l' ? 'flex-col p-5' : 'p-4')}>
        {size === 'l' ? <TileName className="text-[17px]">Clean station</TileName> : null}
        <div className={cn('flex gap-4', size === 'l' && 'flex-1 items-center justify-center')}>
          <Bag c={c} h={size === 'l' ? 170 : 116} />
          {size === 'l' ? (
            <div>
              <Big n={cycles ?? '—'} className="text-[44px]" />
              <p className="text-[12px] opacity-60">empties into this bag</p>
            </div>
          ) : null}
        </div>
        <div className={cn('flex min-w-0 flex-1 flex-col', size === 'l' && 'flex-none')}>
          {size === 'w' ? <TileName>Clean station</TileName> : null}
          <p className="truncate text-[18px] font-semibold leading-tight" style={{ color: w.hue }}>
            {w.word}
          </p>
          <TileState>{size === 'w' && cycles != null ? `${cycles} empties · ${w.detail}` : w.detail}</TileState>
          <div className="mt-auto pt-2 empty:hidden">
            <EmptyButton {...p} />
          </div>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// Clean station · B · Swirl
// ---------------------------------------------------------------------------------------------

function Swirl({ c, px }: { c: CleanerTileProps['c']; px: number }) {
  const spinning = !!c.dock?.emptying;
  const hue = c.dock?.bagFull ? CH.watch : spinning ? CH.on : CH.idle;
  return (
    <span aria-hidden className="relative grid shrink-0 place-items-center rounded-full" style={{ width: px, height: px, background: `color-mix(in srgb, ${hue} 10%, transparent)` }}>
      {[0.92, 0.68, 0.44].map((k, i) => (
        <span
          key={k}
          className={cn('absolute rounded-full border-2 border-transparent', spinning && 'motion-safe:animate-spin')}
          style={{ width: px * k, height: px * k, borderTopColor: hue, borderRightColor: i === 1 ? hue : 'transparent', opacity: 0.4 + i * 0.25, animationDuration: `${0.7 + i * 0.35}s`, animationDirection: i % 2 ? 'reverse' : 'normal' }}
        />
      ))}
      <HugeiconsIcon icon={c.dock?.bagFull ? Alert02Icon : Recycle01Icon} size={Math.round(px * 0.22)} style={{ color: hue }} />
    </span>
  );
}

export function DockSwirl(p: CleanerTileProps) {
  const { c, size, now } = p;
  const w = dockWords(c, now);
  const ago = c.dock?.lastEmptied ? agoText(c.dock.lastEmptied, now) : '—';
  if (size === 'xs') return <XsRow label="Clean station" visual={<Swirl c={c} px={44} />} word={c.dock?.emptying || c.dock?.bagFull ? w.word : `Emptied ${ago.toLowerCase()}`} hue={w.hue} detail={c.dock?.cycles != null ? `${c.dock.cycles} empties` : ''} />;
  if (size === 's')
    return (
      <TileFrame label="Clean station" className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <Swirl c={c} px={62} />
          <p className="mt-auto text-[12px] opacity-60">{c.dock?.emptying ? 'Now' : 'Last emptied'}</p>
          <p className="truncate text-[17px] font-semibold" style={{ color: c.dock?.emptying || c.dock?.bagFull ? w.hue : undefined }}>
            {c.dock?.emptying ? 'Emptying' : ago}
          </p>
          {c.dock?.bagFull ? <p className="truncate text-[13px] font-medium" style={{ color: CH.watch }}>Dust bag full</p> : null}
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Clean station" className="pro-surface">
      <div className={cn('flex h-full', size === 'l' ? 'flex-col items-center p-5 text-center' : 'items-center gap-4 p-4')}>
        {size === 'l' ? <TileName className="self-start text-[17px]">Clean station</TileName> : null}
        <Swirl c={c} px={size === 'l' ? 150 : 104} />
        <div className={cn('min-w-0', size === 'l' ? 'mt-3' : 'flex-1')}>
          <p className="text-[12px] opacity-60">{c.dock?.emptying ? 'Now' : 'Last emptied'}</p>
          <Big n={c.dock?.emptying ? 'Emptying' : ago} className={size === 'l' ? 'text-[34px]' : 'text-[26px]'} />
          <p className="mt-1 truncate text-[13px] leading-tight opacity-70" style={c.dock?.bagFull ? { color: CH.watch, opacity: 1 } : undefined}>
            {[c.dock?.bagFull ? 'Dust bag full' : null, c.dock?.cycles != null ? `${c.dock.cycles} empties` : null].filter(Boolean).join(' · ')}
          </p>
          <div className="mt-2 empty:hidden">
            <EmptyButton {...p} />
          </div>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// Clean station · C · Ledger
// ---------------------------------------------------------------------------------------------

export function DockLedger(p: CleanerTileProps) {
  const { c, size, now } = p;
  const w = dockWords(c, now);
  const icon = c.dock?.bagFull ? Alert02Icon : c.dock?.emptying ? Recycle01Icon : CheckmarkCircle02Icon;
  if (size === 'xs' || size === 's')
    return size === 'xs' ? (
      <XsRow label="Clean station" visual={<IconChip icon={icon} hue={w.hue} px={34} />} word={w.word} hue={w.hue} detail={w.detail} />
    ) : (
      <TileFrame label="Clean station" className="pro-surface" style={c.dock?.bagFull ? wash(CH.watch, 10) : undefined}>
        <div className="flex h-full flex-col p-3.5">
          <IconChip icon={icon} hue={w.hue} />
          <p className="mt-auto truncate text-[15px] font-semibold" style={{ color: w.hue }}>
            {w.word}
          </p>
          <TileState>{w.detail}</TileState>
        </div>
      </TileFrame>
    );
  const rows = [
    { name: 'Dust bag', value: c.dock?.bagFull ? 'Full' : c.dock ? 'OK' : '—', hue: c.dock?.bagFull ? CH.watch : CH.ok },
    { name: 'Empties', value: c.dock?.cycles != null ? String(c.dock.cycles) : '—' },
    { name: 'Last emptied', value: c.dock?.lastEmptied ? agoText(c.dock.lastEmptied, now) : '—' },
    { name: 'Stick', value: c.dock?.inStation === false ? 'Off the station' : 'In station' }
  ];
  return (
    <TileFrame label="Clean station" className="pro-surface" style={c.dock?.bagFull ? wash(CH.watch, 10) : undefined}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-center gap-2.5">
          <IconChip icon={icon} hue={w.hue} />
          <div className="min-w-0">
            <TileName>Clean station</TileName>
            <p className="truncate text-[14px] font-semibold" style={{ color: w.hue }}>
              {w.word}
            </p>
          </div>
        </div>
        <dl className={cn('mt-3 grid gap-x-4 gap-y-1.5 text-[13px]', size === 'w' ? 'grid-cols-2' : 'grid-cols-1')}>
          {rows.slice(0, size === 'w' ? 2 : 4).map((r) => (
            <div key={r.name} className="flex items-baseline justify-between gap-2">
              <dt className="opacity-60">{r.name}</dt>
              <dd className="font-semibold tabular-nums" style={r.hue ? { color: r.hue } : undefined}>
                {r.value}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-auto pt-2 empty:hidden">
          <EmptyButton {...p} />
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// Energy
// ---------------------------------------------------------------------------------------------

const kwh = (n: number | null | undefined) => (n == null ? '—' : n < 1 ? `${Math.round(n * 1000)} Wh` : `${n.toFixed(1)} kWh`);

export function EnergySplit({ c, size }: CleanerTileProps) {
  const e = c.energy;
  const used = e?.kWh ?? 0;
  const saved = e?.savedKwh ?? 0;
  const share = used + saved > 0 ? used / (used + saved) : 1;
  const bar = (h: number) => (
    <span className="flex w-full overflow-hidden rounded-full" style={{ height: h }}>
      <span style={{ width: `${share * 100}%`, background: CH.on }} />
      <span className="flex-1" style={{ background: `color-mix(in srgb, ${CH.ok} 70%, transparent)` }} />
    </span>
  );
  if (size === 'xs') return <XsRow label="Energy" visual={<IconChip icon={FlashIcon} hue={CH.on} px={34} />} word={kwh(e?.kWh)} detail={e?.savedKwh != null ? `${kwh(e.savedKwh)} saved` : 'used'} />;
  return (
    <TileFrame label="Energy" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 'w' ? 'p-4' : 'p-3.5')}>
        <div className="flex items-center justify-between gap-2">
          <TileName>Energy</TileName>
          <IconChip icon={FlashIcon} hue={CH.on} px={28} />
        </div>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <Big n={e?.kWh != null ? e.kWh.toFixed(1) : '—'} unit="kWh" className={size === 's' ? 'text-[26px]' : 'text-[36px]'} />
            <p className="text-[11px] opacity-60">used in all</p>
          </div>
          {size !== 's' ? (
            <div className="text-right">
              <p className="text-[18px] font-semibold tabular-nums" style={{ color: CH.ok }}>
                {kwh(e?.savedKwh)}
              </p>
              <p className="text-[11px] opacity-60">saved by AI mode</p>
            </div>
          ) : null}
        </div>
        <div className="mt-2">{bar(size === 'l' ? 12 : 8)}</div>
        {size === 's' ? <TileState className="mt-1">{kwh(e?.savedKwh)} saved</TileState> : null}
        {size === 'l' ? <TileState className="mt-3">Last session {kwh(e?.lastKwh)} · now {e?.powerW != null ? `${Math.round(e.powerW)} W` : '—'}</TileState> : null}
      </div>
    </TileFrame>
  );
}

export function EnergyLive({ c, size }: CleanerTileProps) {
  const e = c.energy;
  const w = e?.powerW ?? null;
  const live = (w ?? 0) > 5;
  const hue = live ? CH.on : CH.idle;
  const pulse = (
    <svg aria-hidden viewBox="0 0 120 30" preserveAspectRatio="none" className="h-8 w-full">
      <path d="M0 15 H40 L48 4 L56 26 L64 8 L70 15 H120" fill="none" stroke={hue} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength={100} strokeDasharray={live ? '30 70' : '100 0'} className={cn(live && 'motion-safe:animate-[had-dash_1.6s_linear_infinite]')} style={{ opacity: live ? 1 : 0.35 }} />
    </svg>
  );
  if (size === 'xs') return <XsRow label="Energy" visual={<IconChip icon={FlashIcon} hue={hue} px={34} />} word={w != null ? `${Math.round(w)} W` : '—'} detail={live ? 'Charging now' : `${kwh(e?.kWh)} in all`} />;
  return (
    <TileFrame label="Energy" className="pro-surface" style={live ? wash(CH.on, 10) : undefined}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 'w' ? 'p-4' : 'p-3.5')}>
        <TileName>Power</TileName>
        <TileState>{live ? 'Charging now' : 'Resting'}</TileState>
        <div className="my-auto">{pulse}</div>
        <div className="flex items-end justify-between gap-3">
          <Big n={w != null ? Math.round(w) : '—'} unit="W" className={size === 's' ? 'text-[28px]' : 'text-[40px]'} style={{ color: live ? hue : undefined }} />
          {size !== 's' ? (
            <p className="text-right text-[12px] opacity-70">
              {kwh(e?.kWh)} in all
              <br />
              <span style={{ color: CH.ok }}>{kwh(e?.savedKwh)} saved</span>
            </p>
          ) : null}
        </div>
      </div>
    </TileFrame>
  );
}

export function EnergyNumbers({ c, size }: CleanerTileProps) {
  const e = c.energy;
  const items = [
    { name: 'Used', value: kwh(e?.kWh) },
    { name: 'Saved', value: kwh(e?.savedKwh), hue: CH.ok },
    { name: 'Last session', value: kwh(e?.lastKwh) }
  ];
  if (size === 'xs') return <XsRow label="Energy" visual={<IconChip icon={FlashIcon} hue={CH.on} px={34} />} word={items[0].value} detail={`${items[1].value} saved`} />;
  return (
    <TileFrame label="Energy" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : size === 'w' ? 'p-4' : 'p-3.5')}>
        <TileName>Energy</TileName>
        <div className={cn('mt-auto grid gap-2', size === 's' ? 'grid-cols-1' : size === 'w' ? 'grid-cols-3' : 'grid-cols-1 gap-4')}>
          {items.slice(0, size === 's' ? 2 : 3).map((x) => (
            <div key={x.name} className={cn('min-w-0', size === 's' && 'flex items-baseline justify-between gap-2')}>
              <p className="truncate text-[12px] opacity-60">{x.name}</p>
              <p className={cn('truncate font-semibold tabular-nums', size === 's' ? 'text-[15px]' : size === 'w' ? 'text-[20px]' : 'text-[30px]')} style={x.hue ? { color: x.hue } : undefined}>
                {x.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </TileFrame>
  );
}
