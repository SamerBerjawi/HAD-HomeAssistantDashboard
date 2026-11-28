/**
 * Sample homes for the Energy Studio restart (docs/pro-ui/ENERGY.md §0). Pure and deterministic:
 * each home is simulated hour by hour (solar, load, battery, grid, price, carbon, forecast) up to
 * "now", so every number on the page adds up. Never Home Assistant.
 */
import type { DeviceKind, EnergyDevice, EnergyHome, EnergyTotals, HourSlot, PeriodSlot, Utility } from '../../../lib/energyHome';

export type StudioEnergyId = 'sunny' | 'evening' | 'cloudy' | 'grid';

export const STUDIO_ENERGY_STATES: { id: StudioEnergyId; label: string; summary: string }[] = [
  { id: 'sunny', label: 'Sunny afternoon', summary: 'Solar surplus, battery charging, exporting' },
  { id: 'evening', label: 'Evening, car charging', summary: 'Sun down, battery covering the house, EV on the grid' },
  { id: 'cloudy', label: 'Cloudy winter', summary: 'Little sun, heat pump, battery empty, importing' },
  { id: 'grid', label: 'Grid only', summary: 'No solar, battery or forecast: a flat with a price sensor' }
];

interface Scenario {
  hour: number;
  peak: number;
  cloud: number;
  load: number;
  batteryKwh: number;
  startSoc: number;
  season: number;
  rising: number;
  setting: number;
  /** Extra load by hour (the car, the heat pump). */
  extra: (h: number) => number;
  devices: { name: string; kind: DeviceKind; power: number; share: number }[];
  hasPrice: boolean;
  hasCo2: boolean;
  gas: boolean;
  water: boolean;
}

const SCENARIOS: Record<StudioEnergyId, Scenario> = {
  sunny: {
    hour: 14.4, peak: 5.6, cloud: 1, load: 1, batteryKwh: 10, startSoc: 0.32, season: 1, rising: 6.1, setting: 20.6,
    extra: (h) => (h >= 13 && h < 15 ? 1.1 : 0),
    devices: [
      { name: 'Dishwasher', kind: 'kitchen', power: 1.1, share: 0.12 },
      { name: 'Fridge', kind: 'kitchen', power: 0.09, share: 0.08 },
      { name: 'Office', kind: 'office', power: 0.21, share: 0.1 },
      { name: 'Washing machine', kind: 'laundry', power: 0, share: 0.09 },
      { name: 'TV & media', kind: 'media', power: 0, share: 0.05 },
      { name: 'Water heater', kind: 'water', power: 0, share: 0.16 }
    ],
    hasPrice: true, hasCo2: true, gas: true, water: true
  },
  evening: {
    hour: 20.3, peak: 4.9, cloud: 0.95, load: 1.1, batteryKwh: 10, startSoc: 0.22, season: 0.85, rising: 6.4, setting: 19.7,
    extra: (h) => (h >= 19.5 ? 7.2 : 0),
    devices: [
      { name: 'EV charger', kind: 'ev', power: 7.2, share: 0.3 },
      { name: 'Oven', kind: 'kitchen', power: 0.4, share: 0.08 },
      { name: 'TV & media', kind: 'media', power: 0.18, share: 0.05 },
      { name: 'Fridge', kind: 'kitchen', power: 0.08, share: 0.05 },
      { name: 'Water heater', kind: 'water', power: 0, share: 0.12 },
      { name: 'Washing machine', kind: 'laundry', power: 0, share: 0.06 }
    ],
    hasPrice: true, hasCo2: true, gas: true, water: true
  },
  cloudy: {
    hour: 11.2, peak: 1.3, cloud: 0.8, load: 1.25, batteryKwh: 10, startSoc: 0.12, season: 0.35, rising: 8.3, setting: 16.6,
    extra: (h) => (h < 8 || h > 16 ? 1.6 : 1.1),
    devices: [
      { name: 'Heat pump', kind: 'heat', power: 1.2, share: 0.42 },
      { name: 'Water heater', kind: 'water', power: 0, share: 0.12 },
      { name: 'Office', kind: 'office', power: 0.24, share: 0.06 },
      { name: 'Fridge', kind: 'kitchen', power: 0.09, share: 0.04 },
      { name: 'Kettle', kind: 'kitchen', power: 0, share: 0.02 }
    ],
    hasPrice: true, hasCo2: true, gas: false, water: true
  },
  grid: {
    hour: 19.1, peak: 0, cloud: 1, load: 0.8, batteryKwh: 0, startSoc: 0, season: 0.7, rising: 7.1, setting: 18.2,
    extra: () => 0,
    devices: [
      { name: 'Oven', kind: 'kitchen', power: 1.8, share: 0.14 },
      { name: 'Fridge', kind: 'kitchen', power: 0.08, share: 0.09 },
      { name: 'TV & media', kind: 'media', power: 0.12, share: 0.06 }
    ],
    hasPrice: true, hasCo2: false, gas: true, water: false
  }
};

const CURRENCY = '€';
const EXPORT_RATE = 0.08;
const r = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
/** Deterministic noise in [0, 1). */
const noise = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

const solarAt = (s: Scenario, h: number) => (s.peak && h > s.rising && h < s.setting ? s.peak * s.cloud * Math.sin((Math.PI * (h - s.rising)) / (s.setting - s.rising)) * (0.94 + noise(h) * 0.1) : 0);
const loadAt = (s: Scenario, h: number) => (0.34 + (h >= 6.5 && h < 9 ? 0.8 : 0) + (h >= 12 && h < 14 ? 0.5 : 0) + (h >= 17 && h < 22 ? 1.1 : 0)) * s.load * (0.92 + noise(h + 50) * 0.16) + s.extra(h);
const priceAt = (h: number) => r(0.17 + (h >= 7 && h < 9 ? 0.08 : 0) + (h >= 17 && h < 21 ? 0.12 : 0) - (h >= 11 && h < 15 ? 0.06 : 0) + noise(h + 7) * 0.02, 3);
const co2At = (s: Scenario, h: number) => Math.round(310 - (h >= 9 && h < 17 ? 170 * s.season : 0) + (h >= 17 && h < 21 ? 60 : 0) + noise(h + 99) * 30);

function simulateDay(s: Scenario, dayStart: number): HourSlot[] {
  let soc = s.batteryKwh * s.startSoc;
  const out: HourSlot[] = [];
  for (let h = 0; h < 24; h++) {
    const future = h > Math.floor(s.hour);
    const frac = h === Math.floor(s.hour) ? s.hour - h : 1;
    const solar = future ? 0 : solarAt(s, h + 0.5) * frac;
    const home = future ? 0 : loadAt(s, h + 0.5) * frac;
    let batteryIn = 0;
    let batteryOut = 0;
    let gridIn = 0;
    let gridOut = 0;
    const surplus = solar - home;
    if (surplus > 0) {
      batteryIn = s.batteryKwh ? Math.min(surplus, 3.3 * frac, s.batteryKwh * 0.98 - soc) : 0;
      gridOut = surplus - Math.max(0, batteryIn);
    } else {
      batteryOut = s.batteryKwh ? Math.min(-surplus, 3.3 * frac, Math.max(0, soc - s.batteryKwh * 0.1)) : 0;
      gridIn = -surplus - batteryOut;
    }
    batteryIn = Math.max(0, batteryIn);
    soc += batteryIn - batteryOut;
    out.push({
      at: dayStart + h * 3600_000,
      solar: r(solar), home: r(home), gridIn: r(gridIn), gridOut: r(gridOut), batteryIn: r(batteryIn), batteryOut: r(batteryOut),
      soc: s.batteryKwh && !future ? Math.round((soc / s.batteryKwh) * 100) : null,
      price: s.hasPrice ? priceAt(h) : null,
      co2: s.hasCo2 ? co2At(s, h) : null,
      forecast: s.peak ? r(solarAt(s, h + 0.5) * 1.03) : null,
      future
    });
  }
  return out;
}

function totalsOf(slots: { used: number; solar: number; gridIn: number; gridOut: number; batteryIn?: number; batteryOut?: number; cost: number }[]): EnergyTotals {
  const sum = (k: 'used' | 'solar' | 'gridIn' | 'gridOut' | 'batteryIn' | 'batteryOut' | 'cost') => r(slots.reduce((a, x) => a + (x[k] ?? 0), 0));
  const used = sum('used');
  const gridOut = sum('gridOut');
  const exportCredit = r(gridOut * EXPORT_RATE);
  return { used, solar: sum('solar'), gridIn: sum('gridIn'), gridOut, batteryIn: sum('batteryIn'), batteryOut: sum('batteryOut'), cost: r(sum('cost') - exportCredit), exportCredit, selfSufficiency: used ? Math.round(Math.max(0, 1 - sum('gridIn') / used) * 100) : 0 };
}

const WEEKDAY = (t: number) => new Date(t).toLocaleDateString([], { weekday: 'short' });
const MONTH = (m: number) => new Date(2026, m, 1).toLocaleDateString([], { month: 'short' });

/** A past day's totals, scaled by a season factor (0 winter … 1 summer). */
function pastDay(s: Scenario, i: number, season: number): Omit<PeriodSlot, 'label'> {
  const sun = s.peak ? s.peak * 5.2 * (0.35 + 0.65 * season) * (0.55 + noise(i) * 0.5) : 0;
  const used = (12 + (1 - season) * 9) * s.load * (0.85 + noise(i + 3) * 0.3) + (s.extra(20) > 5 && noise(i + 9) > 0.6 ? 18 : 0);
  const selfUse = Math.min(sun * 0.55, used * 0.75) + (s.batteryKwh ? Math.min(s.batteryKwh * 0.7, sun * 0.25) : 0);
  const gridIn = Math.max(0, used - selfUse);
  const gridOut = Math.max(0, sun - selfUse);
  return { used: r(used, 1), solar: r(sun, 1), gridIn: r(gridIn, 1), gridOut: r(gridOut, 1), cost: r(gridIn * 0.21) };
}

function utility(kind: 'gas' | 'water', s: Scenario): Utility {
  const base = kind === 'gas' ? 2.4 + (1 - s.season) * 5 : 0.32;
  const week = Array.from({ length: 7 }, (_, i) => r(base * (0.8 + noise(i + (kind === 'gas' ? 200 : 300)) * 0.4), kind === 'gas' ? 1 : 2));
  const today = r(week[6] * Math.min(1, s.hour / 22), kind === 'gas' ? 1 : 2);
  return { kind, unit: kind === 'gas' ? 'm³' : 'm³', today, cost: r(today * (kind === 'gas' ? 1.15 : 3.4)), week };
}

export function studioEnergyHome(id: StudioEnergyId, now = Date.now()): EnergyHome {
  const s = SCENARIOS[id];
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  const dayStart = day.getTime();
  const at = dayStart + s.hour * 3600_000;
  const today = simulateDay(s, dayStart);
  const cur = today[Math.floor(s.hour)];
  const frac = s.hour - Math.floor(s.hour) || 1;
  const kw = (v: number) => r(v / frac);

  const dayTotals = totalsOf(today.filter((h) => !h.future).map((h) => ({ used: h.home, solar: h.solar, gridIn: h.gridIn, gridOut: h.gridOut, batteryIn: h.batteryIn, batteryOut: h.batteryOut, cost: h.gridIn * (h.price ?? 0.21) })));
  const todaySlot: PeriodSlot = { label: WEEKDAY(at), used: dayTotals.used, solar: dayTotals.solar, gridIn: dayTotals.gridIn, gridOut: dayTotals.gridOut, cost: dayTotals.cost + dayTotals.exportCredit };
  const week: PeriodSlot[] = [...Array.from({ length: 6 }, (_, i) => ({ label: WEEKDAY(at - (6 - i) * 86400_000), ...pastDay(s, i, s.season) })), todaySlot];
  const month: PeriodSlot[] = [...Array.from({ length: 29 }, (_, i) => ({ label: String(new Date(at - (29 - i) * 86400_000).getDate()), ...pastDay(s, i + 20, s.season) })), { ...todaySlot, label: String(new Date(at).getDate()) }];
  const thisMonth = new Date(at).getMonth();
  const year: PeriodSlot[] = Array.from({ length: 12 }, (_, m) => {
    const season = 0.5 - 0.5 * Math.cos(((m - 0.5) / 12) * 2 * Math.PI);
    const days = Array.from({ length: m === thisMonth ? new Date(at).getDate() : 30 }, (_, d) => pastDay(s, m * 31 + d, season));
    const t = totalsOf(days);
    return { label: MONTH(m), used: r(t.used, 0), solar: r(t.solar, 0), gridIn: r(t.gridIn, 0), gridOut: r(t.gridOut, 0), cost: r(t.cost + t.exportCredit, 0) };
  }).filter((_, m) => m <= thisMonth);

  const used = dayTotals.used;
  const shareSum = s.devices.reduce((a, d) => a + d.share, 0);
  const devices: EnergyDevice[] = s.devices.map((d, i) => ({ id: `d${i}`, name: d.name, kind: d.kind, power: d.power, today: r(used * d.share * Math.min(1, 0.85 / shareSum)) }));

  const solarNow = s.peak ? kw(cur.solar) : null;
  const home = kw(cur.home);
  const battery = s.batteryKwh ? kw(cur.batteryIn - cur.batteryOut) : null;
  const grid = kw(cur.gridIn - cur.gridOut);
  const price = cur.price;
  const prices = today.map((h) => h.price ?? 0);
  const sorted = [...prices].sort((a, b) => a - b);
  const level = price === null ? null : price <= sorted[7] ? 'low' : price >= sorted[17] ? 'high' : 'normal';
  const hourNow = s.hour;
  const remaining = r(today.filter((h) => h.forecast !== null && h.at + 3600_000 > at).reduce((a, h) => a + (h.forecast ?? 0) * (h.at < at ? 1 - frac : 1), 0), 1);

  return {
    now: at,
    currency: CURRENCY,
    live: { solar: solarNow, home, grid, battery, soc: s.batteryKwh ? cur.soc : null },
    battery: s.batteryKwh ? { capacity: s.batteryKwh } : null,
    grid: { price, priceLevel: level, co2: cur.co2, fossil: cur.co2 === null ? null : Math.round((cur.co2 / 520) * 100) },
    sun: { up: hourNow > s.rising && hourNow < s.setting, elevation: Math.round(Math.max(-30, 58 * s.season * Math.sin((Math.PI * (hourNow - s.rising)) / (s.setting - s.rising)))), rising: dayStart + s.rising * 3600_000 + (hourNow > s.setting ? 86400_000 : 0), setting: dayStart + s.setting * 3600_000 },
    forecast: s.peak ? { today: r(today.reduce((a, h) => a + (h.forecast ?? 0), 0), 1), remaining, tomorrow: r(s.peak * 5.2 * s.season * (0.8 + noise(77) * 0.3), 1) } : null,
    today,
    totals: { day: dayTotals, week: totalsOf(week), month: totalsOf(month), year: totalsOf(year) },
    history: { week, month, year },
    devices,
    gas: s.gas ? utility('gas', s) : null,
    water: s.water ? utility('water', s) : null,
    impact: s.peak ? { lifetimeKwh: 18_420, co2AvoidedKg: 7_368, trees: 402 } : null
  };
}
