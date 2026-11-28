/**
 * The Energy page's model, restarted 2026-11-26 (docs/pro-ui/ENERGY.md §0): the home's power right
 * now, today hour by hour, the periods behind it, devices, the grid's price and carbon (Nordpool /
 * Tibber, Electricity Maps), the sun and the solar forecast (sun.sun, Forecast.Solar), gas, water
 * and lifetime impact. Pure: the Energy Studio fills it from sample homes; the live page will fill
 * it from Home Assistant once a direction is approved.
 *
 * Power is in kW. Grid is + importing, − exporting; battery is + charging, − discharging.
 */

export type Period = 'day' | 'week' | 'month' | 'year';
export type Source = 'solar' | 'battery' | 'grid' | 'export';
export type PriceLevel = 'low' | 'normal' | 'high';

export interface PowerNow {
  /** null: no solar in HA. */
  solar: number | null;
  home: number;
  /** null: no grid sensor (rare). */
  grid: number | null;
  /** null: no battery. */
  battery: number | null;
  /** Battery charge, %. */
  soc: number | null;
}

/**
 * Five minutes of today as power, kW (Home Assistant's "Power sources" graph draws today from the
 * power sensors' 5-minute statistics). `future`: not compiled yet (HA writes a 5-minute statistic
 * when its five minutes are over), part of the axis but not drawn.
 */
export interface PowerSlot {
  at: number;
  solar: number;
  home: number;
  gridIn: number;
  gridOut: number;
  batteryIn: number;
  batteryOut: number;
  future: boolean;
}

/** One hour of today. kWh in the hour; `future` hours keep only forecast, price and carbon. */
export interface HourSlot {
  at: number;
  solar: number;
  home: number;
  gridIn: number;
  gridOut: number;
  batteryIn: number;
  batteryOut: number;
  soc: number | null;
  /** Price per kWh (Nordpool / Tibber), null without a price sensor. */
  price: number | null;
  /** Grid carbon intensity, g CO₂/kWh (Electricity Maps). */
  co2: number | null;
  /** Solar forecast for the hour, kWh (Forecast.Solar). */
  forecast: number | null;
  future: boolean;
}

/** One bar of a week, month or year. */
export interface PeriodSlot {
  label: string;
  used: number;
  solar: number;
  gridIn: number;
  gridOut: number;
  cost: number;
}

export interface EnergyTotals {
  used: number;
  solar: number;
  gridIn: number;
  gridOut: number;
  batteryIn: number;
  batteryOut: number;
  /** What the grid cost, minus what export earned. */
  cost: number;
  exportCredit: number;
  /** Share of use that did not come from the grid, %. */
  selfSufficiency: number;
}

export type DeviceKind = 'ev' | 'heat' | 'water' | 'kitchen' | 'laundry' | 'media' | 'office' | 'other';

export interface EnergyDevice {
  id: string;
  name: string;
  kind: DeviceKind;
  /** Drawing now, kW (0 when idle). */
  power: number;
  /** Used today, kWh. */
  today: number;
}

export interface Utility {
  kind: 'gas' | 'water';
  unit: string;
  today: number;
  cost: number;
  /** The last seven days, oldest first. */
  week: number[];
}

export interface EnergyHome {
  now: number;
  currency: string;
  live: PowerNow;
  battery: { capacity: number } | null;
  grid: {
    price: number | null;
    priceLevel: PriceLevel | null;
    co2: number | null;
    /** Share of the grid mix from fossil fuels now, %. */
    fossil: number | null;
  };
  sun: { up: boolean; elevation: number; rising: number; setting: number } | null;
  forecast: { today: number; remaining: number; /** null: no forecast for tomorrow (Forecast.Solar not installed). */ tomorrow: number | null } | null;
  today: HourSlot[];
  /** Today in 5-minute steps for the power chart, like HA's; absent until they load (the chart then uses `today`). */
  power?: PowerSlot[];
  totals: Record<Period, EnergyTotals>;
  history: Record<Exclude<Period, 'day'>, PeriodSlot[]>;
  devices: EnergyDevice[];
  gas: Utility | null;
  water: Utility | null;
  impact: { lifetimeKwh: number; co2AvoidedKg: number; trees: number } | null;
}

export const PERIODS: { id: Period; label: string }[] = [
  { id: 'day', label: 'Today' },
  { id: 'week', label: 'Week' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' }
];

const EPS = 0.03;
const pos = (n: number | null) => Math.max(0, n ?? 0);

/** Where the home's power comes from now, and where the surplus goes (kW). */
export function liveFlows(live: PowerNow) {
  const solar = pos(live.solar);
  const home = Math.max(0, live.home);
  const charge = pos(live.battery);
  const discharge = pos(live.battery === null ? null : -live.battery);
  const exporting = pos(live.grid === null ? null : -live.grid);
  const solarToHome = Math.min(solar, home);
  const batteryToHome = Math.min(discharge, home - solarToHome);
  const gridToHome = Math.max(0, home - solarToHome - batteryToHome);
  const solarToBattery = Math.min(charge, solar - solarToHome);
  const gridToBattery = Math.max(0, charge - solarToBattery);
  const solarToGrid = Math.min(exporting, Math.max(0, solar - solarToHome - solarToBattery));
  const batteryToGrid = Math.max(0, exporting - solarToGrid);
  return { solarToHome, batteryToHome, gridToHome, solarToBattery, gridToBattery, solarToGrid, batteryToGrid };
}

/** The home's draw split by source, %, summing to 100 (or all 0 when the home uses nothing). */
export function homeMix(live: PowerNow): Record<'solar' | 'battery' | 'grid', number> {
  const f = liveFlows(live);
  const total = f.solarToHome + f.batteryToHome + f.gridToHome;
  if (total < EPS) return { solar: 0, battery: 0, grid: 0 };
  const solar = Math.round((f.solarToHome / total) * 100);
  const battery = Math.round((f.batteryToHome / total) * 100);
  return { solar, battery, grid: Math.max(0, 100 - solar - battery) };
}

export const fmtPower = (kw: number) => {
  const a = Math.abs(kw);
  return a < 1 ? `${Math.round(a * 1000)} W` : `${a.toFixed(a < 10 ? 1 : 0)} kW`;
};
export const fmtKwh = (kwh: number) => {
  const a = Math.max(0, kwh);
  return a >= 1000 ? `${(a / 1000).toFixed(1)} MWh` : a >= 100 ? `${Math.round(a)} kWh` : `${a.toFixed(1)} kWh`;
};
export const fmtMoney = (n: number, currency: string) => `${n < -0.005 ? '−' : ''}${currency}${Math.abs(n).toFixed(2)}`;
export const fmtPrice = (n: number, currency: string) => `${currency}${n.toFixed(2)}/kWh`;
export const clock = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export interface EnergyVerdict {
  /** Where the home's power mostly comes from (or that it is sending power out). */
  source: Source;
  /** The answer in a few words: "Running on sunshine", "Sending 2.1 kW to the grid". */
  title: string;
  /** One line under it. */
  detail: string;
}

/** The page's one clear answer about right now. */
export function energyVerdict(home: EnergyHome): EnergyVerdict {
  const { live } = home;
  const mix = homeMix(live);
  const exporting = pos(live.grid === null ? null : -live.grid);
  const charging = pos(live.battery);
  const parts = [`Home uses ${fmtPower(live.home)}`];
  if (live.soc !== null) parts.push(charging > EPS ? `battery charging, ${live.soc}%` : pos(live.battery === null ? null : -live.battery) > EPS ? `battery ${live.soc}%` : `battery ${live.soc}%, idle`);
  const detail = parts.join(' · ');
  if (exporting > EPS) return { source: 'export', title: `Sending ${fmtPower(exporting)} to the grid`, detail };
  if (mix.solar >= 90) return { source: 'solar', title: 'Running on sunshine', detail };
  if (mix.battery >= 60) return { source: 'battery', title: 'Running on the battery', detail };
  if (mix.grid >= 60 || (mix.solar === 0 && mix.battery === 0)) return { source: 'grid', title: `Drawing ${fmtPower(pos(live.grid))} from the grid`, detail };
  const lead = mix.solar >= mix.battery ? (['solar', 'Sun'] as const) : (['battery', 'Battery'] as const);
  return { source: lead[0], title: `${lead[1]} ${Math.max(mix.solar, mix.battery)}%, grid ${mix.grid}%`, detail };
}

/** The cheapest and cleanest hours still ahead today (from the price and carbon forecasts). */
export function bestHours(home: EnergyHome) {
  const ahead = home.today.filter((h) => h.at + 3600_000 > home.now);
  const min = (key: 'price' | 'co2') => ahead.filter((h) => h[key] !== null).reduce<HourSlot | null>((best, h) => (best === null || (h[key] as number) < (best[key] as number) ? h : best), null);
  return { cheapest: min('price'), cleanest: min('co2') };
}

/** Hours of battery left at the current discharge (null when not discharging). */
export function batteryHoursLeft(home: EnergyHome, floor = 10): number | null {
  const d = pos(home.live.battery === null ? null : -home.live.battery);
  if (!home.battery || home.live.soc === null || d < EPS) return null;
  return Math.max(0, ((home.live.soc - floor) / 100) * home.battery.capacity) / d;
}

/** Devices ranked by today's use, plus what no device accounts for. */
export function rankedDevices(home: EnergyHome) {
  const list = [...home.devices].sort((a, b) => b.today - a.today);
  const tracked = list.reduce((s, d) => s + d.today, 0);
  return { list, untracked: Math.max(0, home.totals.day.used - tracked) };
}

/** The cheapest run of `hours` consecutive hours still ahead today, by average price. */
export function cheapestWindow(home: EnergyHome, hours = 2): { from: number; to: number; price: number } | null {
  const ahead = home.today.filter((h) => h.at + 3600_000 > home.now && h.price !== null);
  let best: { from: number; to: number; price: number } | null = null;
  for (let i = 0; i + hours <= ahead.length; i++) {
    const run = ahead.slice(i, i + hours);
    if (run[run.length - 1].at - run[0].at !== (hours - 1) * 3600_000) continue;
    const price = run.reduce((a, h) => a + (h.price as number), 0) / hours;
    if (!best || price < best.price) best = { from: run[0].at, to: run[0].at + hours * 3600_000, price };
  }
  return best;
}

/** Where a time sits on today's chart axis, 0…1 (the chart puts hour i at i / 23). */
export const dayAxisFraction = (home: EnergyHome, t: number) => {
  const day = new Date(home.now);
  day.setHours(0, 0, 0, 0);
  return Math.min(1, Math.max(0, (t - day.getTime()) / 3600_000 / axisSpanHours(home)));
};

/** The power chart's axis runs from the first slot to the last: 00:00–23:00 hourly, 00:00–23:55 in 5-minute steps. */
export function axisSpanHours(home: EnergyHome): number {
  const slots = home.power?.length ? home.power : home.today;
  if (slots.length < 2) return 23;
  return (slots[slots.length - 1].at - slots[0].at) / 3600_000;
}
