/**
 * Vehicle tiles · batch 1 · Battery & range (docs/pro-ui/VEHICLE_TILES.md): how much charge, and
 * how far it gets you. Three concepts in the Area tiles' language.
 * A · Halo: the charge as a ring around the battery (the Light tile's halo), the limit a tick.
 * B · Fill: the tile is the battery, filled with charge from the left; the limit a hairline.
 * C · Status: the verdict first ("Plenty", "Low, charge tonight"), the numbers second (Reading · Status).
 */
import { BatteryCharging01Icon, BatteryFullIcon, BatteryLowIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { arcPath, RING_START, RING_SWEEP } from '../../../../areas/gestures';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { Big, chargeHue, chargeVerdict, IconChip, pct, rangeText, wash, type VehicleTileProps } from '../vehicleTileKit';

const batteryIcon = (v: VehicleTileProps['v']) => (v.charging?.state === 'charging' ? BatteryCharging01Icon : (v.level ?? 100) < 20 ? BatteryLowIcon : BatteryFullIcon);
const NAME = (v: VehicleTileProps['v']) => (v.kind === 'bike' ? 'Battery' : 'Charge');

// ---------------------------------------------------------------------------------------------
// A · Halo
// ---------------------------------------------------------------------------------------------

function Ring({ v, px, children }: { v: VehicleTileProps['v']; px: number; children?: React.ReactNode }) {
  const level = pct(v.level);
  const hue = chargeHue(v);
  const stroke = Math.max(5, Math.round(px * 0.08));
  const r = px / 2 - stroke / 2 - 2;
  const c = px / 2;
  const at = (p: number) => RING_START + (RING_SWEEP * p) / 100;
  const limit = v.kind === 'car' ? v.charging?.target ?? null : null;
  const tick = limit !== null ? [c + (r - stroke) * Math.cos((at(limit) * Math.PI) / 180), c + (r - stroke) * Math.sin((at(limit) * Math.PI) / 180), c + (r + stroke) * Math.cos((at(limit) * Math.PI) / 180), c + (r + stroke) * Math.sin((at(limit) * Math.PI) / 180)] : null;
  const charging = v.charging?.state === 'charging';
  return (
    <div className="relative shrink-0" style={{ width: px, height: px }} role="img" aria-label={`${level}% charge${limit !== null ? `, limit ${limit}%` : ''}`}>
      <svg aria-hidden width={px} height={px} className="absolute inset-0">
        <path d={arcPath(c, c, r, RING_START, RING_START + RING_SWEEP)} fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={stroke} strokeLinecap="round" />
        {level > 0 ? <path d={arcPath(c, c, r, RING_START, Math.max(RING_START + 0.5, at(level)))} fill="none" stroke={hue} strokeWidth={stroke} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${stroke}px color-mix(in srgb, ${hue} 55%, transparent))` }} className={cn(charging && 'motion-safe:animate-pulse')} /> : null}
        {tick ? <line x1={tick[0]} y1={tick[1]} x2={tick[2]} y2={tick[3]} stroke="currentColor" strokeOpacity={0.7} strokeWidth={2} strokeLinecap="round" /> : null}
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function BatteryHalo({ v, size }: VehicleTileProps) {
  const hue = chargeHue(v);
  const range = rangeText(v);
  const limit = v.kind === 'car' ? v.charging?.target ?? null : null;
  const glow = { backgroundImage: `radial-gradient(90% 80% at 20% 20%, color-mix(in srgb, ${hue} ${Math.round(8 + pct(v.level) / 6)}%, transparent), transparent 70%)` };
  const icon = <HugeiconsIcon icon={batteryIcon(v)} size={18} style={{ color: hue }} />;
  if (size === 'xs')
    return (
      <TileFrame label={NAME(v)} className="pro-surface" style={glow}>
        <div className="flex h-full items-center gap-2.5 px-3">
          <Ring v={v} px={44}>
            <HugeiconsIcon icon={batteryIcon(v)} size={15} style={{ color: hue }} />
          </Ring>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold tabular-nums">{v.level ?? '—'}%</p>
            <TileState className="text-[12px]">{range ?? NAME(v)}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label={NAME(v)} className="pro-surface" style={glow}>
        <div className="flex h-full flex-col p-3.5">
          <Ring v={v} px={66}>
            <span className="text-[15px] font-semibold tabular-nums">{v.level ?? '—'}<span className="text-[10px] opacity-60">%</span></span>
          </Ring>
          <TileName className="mt-auto">{NAME(v)}</TileName>
          <TileState>{[range, limit !== null ? `limit ${limit}%` : null].filter(Boolean).join(' · ')}</TileState>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label={NAME(v)} className="pro-surface" style={glow}>
        <div className="flex h-full items-center gap-4 p-4">
          <Ring v={v} px={112}>{icon}</Ring>
          <div className="min-w-0 flex-1">
            <TileName>{NAME(v)}</TileName>
            <Big n={v.level ?? '—'} unit="%" className="mt-1 text-[40px]" />
            <TileState className="mt-1.5">{[range ? `${range} range` : null, limit !== null ? `limit ${limit}%` : null].filter(Boolean).join(' · ')}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label={NAME(v)} className="pro-surface" style={glow}>
      <div className="flex h-full flex-col items-center p-5">
        <TileName className="self-start text-[17px]">{NAME(v)}</TileName>
        <Ring v={v} px={176}>
          <div className="text-center">
            <Big n={v.level ?? '—'} unit="%" className="text-[44px]" />
            {range ? <p className="mt-1 text-[13px] opacity-60 tabular-nums">{range}</p> : null}
          </div>
        </Ring>
        <div className="mt-auto grid w-full grid-cols-3 gap-2 text-center text-[12px]">
          <Fact label="Range" value={range ?? '—'} />
          <Fact label="Limit" value={limit !== null ? `${limit}%` : '—'} />
          <Fact label="Last session" value={v.charging?.lastSessionKwh != null ? `${v.charging.lastSessionKwh} kWh` : '—'} />
        </div>
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
// B · Fill
// ---------------------------------------------------------------------------------------------

/** The tile filled with charge from the left; the limit a hairline; a sheen while charging. */
function FillLayer({ v }: { v: VehicleTileProps['v'] }) {
  const level = pct(v.level);
  const hue = chargeHue(v);
  const limit = v.kind === 'car' ? v.charging?.target ?? null : null;
  const charging = v.charging?.state === 'charging';
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-y-0 left-0 overflow-hidden transition-[width] duration-500" style={{ width: `${level}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${hue} 10%, transparent), color-mix(in srgb, ${hue} 30%, transparent))`, borderRight: `2px solid color-mix(in srgb, ${hue} 70%, transparent)` }}>
        {charging ? <span className="pro-battery-sheen absolute inset-0" style={{ background: `linear-gradient(90deg, transparent, color-mix(in srgb, ${hue} 35%, transparent), transparent)` }} /> : null}
      </div>
      {limit !== null ? <span className="absolute inset-y-3 w-px border-l border-dashed border-current opacity-35" style={{ left: `${limit}%` }} /> : null}
    </div>
  );
}

export function BatteryFill({ v, size }: VehicleTileProps) {
  const range = rangeText(v);
  const limit = v.kind === 'car' ? v.charging?.target ?? null : null;
  const hue = chargeHue(v);
  const label = `${NAME(v)}: ${v.level ?? '—'}%${range ? `, ${range}` : ''}`;
  if (size === 'xs')
    return (
      <TileFrame label={label} className="pro-surface">
        <FillLayer v={v} />
        <div className="flex h-full items-center justify-between gap-2 px-3.5">
          <Big n={v.level ?? '—'} unit="%" className="text-[22px]" />
          <TileState className="text-[12px]">{range ?? ''}</TileState>
        </div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label={label} className="pro-surface">
        <FillLayer v={v} />
        <div className="flex h-full flex-col p-3.5">
          <div className="flex items-center gap-1.5">
            <HugeiconsIcon icon={batteryIcon(v)} size={16} style={{ color: hue }} />
            <TileName className="text-[14px]">{NAME(v)}</TileName>
          </div>
          <Big n={v.level ?? '—'} unit="%" className="mt-auto text-[38px]" />
          <TileState className="mt-1">{range ?? ''}</TileState>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label={label} className="pro-surface">
      <FillLayer v={v} />
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon icon={batteryIcon(v)} size={17} style={{ color: hue }} />
          <TileName className="flex-1">{NAME(v)}</TileName>
          {limit !== null ? <span className="text-[12px] opacity-60 tabular-nums">limit {limit}%</span> : null}
        </div>
        <div className="mt-auto flex items-end gap-5">
          <Big n={v.level ?? '—'} unit="%" className={size === 'l' ? 'text-[72px]' : 'text-[46px]'} />
          {range ? <Big n={Math.round(v.range ?? 0).toLocaleString()} unit={v.unit} className={cn('pb-1 opacity-80', size === 'l' ? 'text-[34px]' : 'text-[24px]')} /> : null}
        </div>
        {size === 'l' ? <TileState className="mt-2">{v.charging?.state === 'charging' ? 'Charging' : v.charging?.plugged ? 'Plugged in' : 'Not plugged in'}{v.charging?.lastSessionKwh != null ? ` · last session ${v.charging.lastSessionKwh} kWh` : ''}</TileState> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Status
// ---------------------------------------------------------------------------------------------

function Band({ v, labels }: { v: VehicleTileProps['v']; labels?: boolean }) {
  const level = pct(v.level);
  const verdict = chargeVerdict(v);
  const limit = v.kind === 'car' ? v.charging?.target ?? null : null;
  return (
    <div aria-hidden>
      <div className="relative h-2 rounded-full bg-[color-mix(in_srgb,currentColor_9%,transparent)]">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: '20%', background: `color-mix(in srgb, hsl(36 95% 52%) 30%, transparent)` }} />
        {limit !== null ? <span className="absolute -inset-y-1 w-0.5 rounded-full bg-current opacity-50" style={{ left: `${limit}%` }} /> : null}
        <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[var(--surface)]" style={{ left: `${level}%`, background: verdict.hue }} />
      </div>
      {labels ? (
        <div className="relative mt-1.5 h-3 text-[10px] tabular-nums opacity-50">
          <span className="absolute left-0">0</span>
          <span className="absolute left-[20%] -translate-x-1/2">20</span>
          {limit !== null && limit <= 85 ? <span className="absolute -translate-x-1/2" style={{ left: `${limit}%` }}>limit</span> : null}
          <span className="absolute right-0">{limit !== null && limit > 85 ? `limit ${limit} · 100` : '100'}</span>
        </div>
      ) : null}
    </div>
  );
}

export function BatteryStatus({ v, size }: VehicleTileProps) {
  const verdict = chargeVerdict(v);
  const range = rangeText(v);
  const facts = [`${v.level ?? '—'}%`, range].filter(Boolean).join(' · ');
  const Word = ({ className }: { className?: string }) => (
    <p className={cn('font-semibold leading-[1.05] tracking-[-0.02em]', className)} style={{ color: verdict.hue }}>
      {verdict.word}
    </p>
  );
  const chip = (px?: number) => <IconChip icon={batteryIcon(v)} hue={verdict.hue} px={px} />;
  if (size === 'xs')
    return (
      <TileFrame label={NAME(v)} style={wash(verdict.hue)} className="shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="flex h-full items-center gap-2.5 px-3">
          {chip(34)}
          <div className="min-w-0 flex-1">
            <Word className="truncate text-[15px]" />
            <TileState className="text-[12px]">{facts}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  if (size === 's')
    return (
      <TileFrame label={NAME(v)} style={wash(verdict.hue)}>
        <div className="flex h-full flex-col p-3.5">
          {chip()}
          <Word className="mt-auto text-[21px]" />
          <p className="mt-1 line-clamp-1 text-[12px] leading-tight opacity-75">{verdict.advice}</p>
          <TileState className="mt-1 text-[12px]">{`${NAME(v)} · ${facts}`}</TileState>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label={NAME(v)} style={wash(verdict.hue)}>
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center gap-2">
            {chip()}
            <TileName className="line-clamp-1 flex-1">{NAME(v)}</TileName>
            <span className="text-[17px] font-semibold tabular-nums">{facts}</span>
          </div>
          <Word className="mt-auto truncate text-[26px]" />
          <p className="mt-1 truncate text-[13px] opacity-75">{verdict.advice}</p>
          <div className="mt-3">
            <Band v={v} />
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label={NAME(v)} style={wash(verdict.hue)}>
      <div className="flex h-full flex-col p-5">
        <div className="flex items-center gap-2.5">
          {chip(38)}
          <TileName className="flex-1 text-[17px]">{NAME(v)}</TileName>
        </div>
        <Word className="mt-auto text-[40px]" />
        <p className="mt-2 text-[15px] opacity-75">{verdict.advice}</p>
        <div className="mt-5 flex items-end gap-5">
          <Big n={v.level ?? '—'} unit="%" className="text-[28px]" />
          {range ? <Big n={Math.round(v.range ?? 0).toLocaleString()} unit={v.unit} className="text-[28px]" /> : null}
        </div>
        <div className="mt-3">
          <Band v={v} labels />
        </div>
      </div>
    </TileFrame>
  );
}
