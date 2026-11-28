/**
 * Vehicle tiles (docs/pro-ui/VEHICLE_TILES.md): the Mobility page rebuilt in the Room page's
 * layout and tile language (owner, 2026-11-27). Each tile shows one part of a vehicle (its charge,
 * its charging, the charge limit…) and is drawn with the Area tiles' kit, so the two pages read
 * as one family: 26 px radius, semibold name, state under it, round icon chips, colour for what is
 * on or needs a look.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import type { TileSize } from '../../../areas/tileTypes';
import { HUE } from '../../../areas/tiles/ambient/ambientKit';
import { clock, fmtDistance, type MobilityAction, type Vehicle } from '../../../lib/mobilityHome';

export interface VehicleTileProps {
  v: Vehicle;
  size: TileSize;
  act: (a: MobilityAction) => void;
  /** The page's clock (the sample's in the studio). */
  now: number;
}

export const VHUE = { charge: HUE.power, low: 'hsl(36 95% 52%)', heat: HUE.heat, cool: HUE.cool, idle: HUE.idle, info: 'hsl(212 80% 58%)' } as const;

export const pct = (n: number | null | undefined) => Math.max(0, Math.min(100, n ?? 0));
export const chargeHue = (v: Vehicle) => ((v.level ?? 100) < 20 ? VHUE.low : VHUE.charge);
export const rangeText = (v: Vehicle) => (v.range !== null ? fmtDistance(v.range, v.unit) : null);

/** What the charging is doing, in words: the word for the tile and its detail line. */
export function chargingWords(v: Vehicle): { word: string; detail: string; tone: 'on' | 'idle' | 'warn' | 'done' } {
  const c = v.charging;
  if (!c) return { word: 'No charger', detail: '', tone: 'idle' };
  const limit = c.target !== null ? `${c.target}%` : null;
  switch (c.state) {
    case 'charging':
      return { word: 'Charging', detail: [c.power !== null ? `${c.power.toFixed(1)} kW` : null, limit && c.readyAt ? `${limit} by ${clock(c.readyAt)}` : limit ? `to ${limit}` : null].filter(Boolean).join(' · '), tone: 'on' };
    case 'complete':
      return { word: 'Charged', detail: limit ? `To ${limit}, still plugged in` : 'Still plugged in', tone: 'done' };
    case 'stopped':
      return { word: 'Paused', detail: limit ? `Plugged in, stops at ${limit}` : 'Plugged in', tone: 'warn' };
    case 'waiting':
      return { word: 'Waiting', detail: c.readyAt ? `Ready by ${clock(c.readyAt)}` : 'Plugged in, scheduled', tone: 'idle' };
    default:
      return { word: c.plugged ? 'Plugged in' : 'Unplugged', detail: c.plugged ? '' : limit ? `Charges to ${limit}` : '', tone: 'idle' };
  }
}

/** The verdict on the charge, the Reading · Status way: what it means for today. */
export function chargeVerdict(v: Vehicle): { word: string; advice: string; hue: string } {
  const lvl = v.level ?? 0;
  const charging = v.charging?.state === 'charging';
  if (v.level === null) return { word: 'Unknown', advice: 'Not reporting its charge', hue: VHUE.idle };
  if (lvl < 15) return { word: 'Very low', advice: charging ? 'Charging now' : 'Plug in before you go', hue: 'hsl(4 82% 56%)' };
  if (lvl < 30) return { word: 'Low', advice: charging ? 'Charging now' : 'Charge tonight', hue: VHUE.low };
  if (lvl < 60) return { word: 'Enough', advice: 'For a day around town', hue: VHUE.charge };
  return { word: 'Plenty', advice: charging ? 'Topping up' : 'Ready for a long day', hue: VHUE.charge };
}

/** A round icon chip, as the Room tiles have in their corner. */
export function IconChip({ icon, hue, px = 30, on = true, className }: { icon: IconSvgElement; hue?: string; px?: number; on?: boolean; className?: string }) {
  return (
    <span
      className={cn('grid shrink-0 place-items-center rounded-full', className)}
      style={{ width: px, height: px, background: on && hue ? `color-mix(in srgb, ${hue} 16%, transparent)` : 'color-mix(in srgb, currentColor 8%, transparent)', color: on && hue ? hue : undefined }}
    >
      <HugeiconsIcon icon={icon} size={Math.round(px * 0.5)} />
    </span>
  );
}

/** The big number with its unit smaller, as the Room tiles write values. */
export function Big({ n, unit, className, style }: { n: ReactNode; unit?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <p className={cn('font-semibold leading-none tracking-[-0.03em] tabular-nums', className)} style={style}>
      {n}
      {unit ? <span className="ml-0.5 text-[0.5em] font-medium opacity-60">{unit}</span> : null}
    </p>
  );
}

/** A tinted wash from the corner, as Reading · Status does for a verdict. */
export const wash = (hue: string, strength = 14) => ({ background: `linear-gradient(150deg, color-mix(in srgb, ${hue} ${strength}%, var(--surface)), var(--surface) 75%)` });

// ---------------------------------------------------------------------------------------------
// Cabin (batch 2)
// ---------------------------------------------------------------------------------------------

/** The cabin temperatures cars accept (FordPass: 16–28 in halves; Lo / Hi beyond). */
export const TEMP_MIN = 16;
export const TEMP_MAX = 28;
export const stepTemp = (t: number | null, d: number) => Math.min(TEMP_MAX, Math.max(TEMP_MIN, Math.round(((t ?? 21) + d) * 2) / 2));
export const deg = (t: number | null | undefined) => (t == null ? '—' : `${Number.isInteger(t) ? t : t.toFixed(1)}°`);

/** What the cabin is doing, in words, and its colour (warm while heating, cool while cooling). */
export function climateWords(v: Vehicle): { word: string; detail: string; on: boolean; hue: string; name: string } {
  const k = v.climate;
  const name = k?.remoteStart ? 'Remote start' : 'Climate';
  if (!k) return { word: 'No climate', detail: '', on: false, hue: VHUE.idle, name };
  const left = k.minutesLeft != null ? `${k.minutesLeft} min left` : null;
  if (k.running) {
    const cooling = k.cabin != null && k.target != null && k.cabin > k.target + 1;
    const warming = k.cabin != null && k.target != null && k.cabin < k.target - 1;
    return {
      word: warming ? 'Warming up' : cooling ? 'Cooling down' : k.cabin != null && k.target != null ? 'Comfortable' : 'On',
      detail: [left, k.cabin != null ? `${deg(k.cabin)} inside` : null].filter(Boolean).join(' · '),
      on: true,
      hue: cooling ? VHUE.cool : VHUE.heat,
      name
    };
  }
  return { word: 'Off', detail: k.cabin != null ? `${deg(k.cabin)} inside` : k.outside != null ? `${deg(k.outside)} outside` : '', on: false, hue: VHUE.heat, name };
}

// ---------------------------------------------------------------------------------------------
// Security (batch 3)
// ---------------------------------------------------------------------------------------------

type OpenItem = Vehicle['security']['open'][number];
const WHAT: Record<OpenItem['what'], string> = { door: 'door', window: 'window', boot: 'Boot', bonnet: 'Bonnet', 'charge-port': 'Charge port' };
/** "Rear left window", "Boot". */
export const openLabel = (o: OpenItem) => (o.where ? `${o.where[0].toUpperCase()}${o.where.slice(1)} ${WHAT[o.what]}` : WHAT[o.what].replace(/^./, (c) => c.toUpperCase()));

/** The car's security in one verdict: what the Doors tile and the rail say. */
export function securityWords(v: Vehicle): { word: string; detail: string; tone: 'safe' | 'watch' | 'alarm' | 'idle' } {
  const s = v.security;
  if (s.alarm === 'triggered') return { word: 'Alarm', detail: 'The alarm is going off', tone: 'alarm' };
  if (s.stolen) return { word: 'Reported stolen', detail: 'Tracking is on', tone: 'alarm' };
  if (s.crashed) return { word: 'Crash detected', detail: 'Check on the rider', tone: 'alarm' };
  if (s.locked === false) return { word: 'Unlocked', detail: s.open.length ? `${openLabel(s.open[0])} open` : 'Lock it before you go', tone: 'watch' };
  if (s.open.length) return { word: s.open.length === 1 ? `${openLabel(s.open[0])} open` : `${s.open.length} open`, detail: s.locked ? 'Locked' : '', tone: 'watch' };
  if (s.locked) return { word: 'Locked', detail: s.alarm === 'armed' ? 'Alarm set · all closed' : 'All closed', tone: 'safe' };
  return { word: 'Unknown', detail: 'Not reporting its locks', tone: 'idle' };
}

// ---------------------------------------------------------------------------------------------
// Which parts a vehicle gets (owner, 2026-11-27): every part its kind has, greyed when this model
// reports nothing for it, so cars of one kind share a layout and nothing silently disappears.
// ---------------------------------------------------------------------------------------------

export const NOT_ON_CAR = 'Not available on this car';
const CAR_ONLY = new Set(['climate', 'temp', 'extras', 'doors', 'openings', 'tyres', 'allowance']);
const PLUG_IN = new Set(['charging', 'limit', 'efficiency', 'sessions']);

/** Whether a part belongs on this vehicle's page at all (not whether it has data: missing data shows greyed). */
export function partApplies(id: string, v: Vehicle): boolean {
  if (PLUG_IN.has(id)) return v.kind === 'car' && (v.powertrain === 'ev' || v.powertrain === 'phev');
  if (CAR_ONLY.has(id)) return v.kind === 'car';
  return true;
}

/** Whether the tile sits in dark mode (the studio draws both themes side by side, so ask the DOM). */
export function useDark<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [dark, setDark] = useState(false);
  // Every render: the studio flips themes around a mounted tile.
  useLayoutEffect(() => setDark(!!ref.current?.closest('.dark')));
  return [ref, dark] as const;
}

// ---------------------------------------------------------------------------------------------
// Condition (batch 5)
// ---------------------------------------------------------------------------------------------

export const OK = 'hsl(152 55% 42%)';
export const WARN = 'hsl(36 95% 50%)';
export const BAD = 'hsl(4 82% 54%)';

/** The car's health readings with a verdict each (12 V, oil, battery health and temperature). */
export function healthReadings(v: Vehicle): { id: string; name: string; value: string; note: string; hue: string; share: number | null }[] {
  const c = v.condition;
  const out: ReturnType<typeof healthReadings> = [];
  if (c.battery12v !== null) {
    // Volts on most makes; a few report %.
    const volts = c.battery12v < 20;
    const low = volts ? c.battery12v < 12.0 : c.battery12v < 40;
    const bad = volts ? c.battery12v < 11.6 : c.battery12v < 20;
    out.push({ id: '12v', name: '12 V battery', value: volts ? `${c.battery12v.toFixed(1)} V` : `${c.battery12v}%`, note: bad ? 'Very low, may not start' : low ? 'Low, drive or charge soon' : 'Good', hue: bad ? BAD : low ? WARN : OK, share: volts ? Math.max(0, Math.min(1, (c.battery12v - 11) / 2)) : c.battery12v / 100 });
  }
  if (c.oil !== null) out.push({ id: 'oil', name: 'Oil life', value: `${c.oil}%`, note: c.oil < 5 ? 'Change it now' : c.oil < 15 ? 'Change it soon' : 'Good', hue: c.oil < 5 ? BAD : c.oil < 15 ? WARN : OK, share: c.oil / 100 });
  if (c.batteryHealth !== null) out.push({ id: 'health', name: 'Battery health', value: `${c.batteryHealth}%`, note: c.batteryHealth < 80 ? 'Worn, range is lower' : 'Good', hue: c.batteryHealth < 80 ? WARN : OK, share: c.batteryHealth / 100 });
  if (c.batteryTemp !== null) out.push({ id: 'temp', name: 'Battery temperature', value: `${Math.round(c.batteryTemp)}°`, note: c.batteryTemp < 0 ? 'Cold, charges slower' : c.batteryTemp > 40 ? 'Hot' : 'Good', hue: c.batteryTemp > 40 ? WARN : c.batteryTemp < 0 ? VHUE.info : OK, share: Math.max(0, Math.min(1, (c.batteryTemp + 10) / 55)) });
  return out;
}
