/**
 * Fills the Energy page's model (`energyHome.ts`) from Home Assistant (docs/pro-ui/ENERGY.md §0):
 * the Energy dashboard's statistics for today and the periods behind it, live power, and the
 * related integrations when they are installed: a price sensor (Nordpool, Tibber, or the grid's
 * price entity), grid carbon (Electricity Maps), `sun.sun`, Forecast.Solar and Huawei's lifetime
 * impact. Pure: the hook (`useEnergyHome`) fetches, this maps. Anything missing is left out
 * (null), never guessed.
 */
import type { ExtractedEnergyStatisticIds } from '@/services/haEnergyPreferences';
import type { TransformedEnergyBucket, TransformedEnergyModel, TransformedEnergyTotals, TransformedFinancials } from '@/services/energy/types';
import type { HAState, ResolvedEntity } from '@/types';
import type { InstantaneousPowerTelemetry } from '@/utils/energyMath';
import type { DeviceKind, EnergyDevice, EnergyHome, EnergyTotals, HourSlot, Period, PeriodSlot, PowerSlot, PriceLevel, Utility } from './energyHome';

const HOUR = 3600_000;
const r2 = (n: number) => Math.round(n * 100) / 100;
const fin = (n: unknown): number | null => {
  const v = typeof n === 'number' ? n : typeof n === 'string' ? Number.parseFloat(n) : NaN;
  return Number.isFinite(v) ? v : null;
};
const num = (s: HAState | undefined): number | null => (!s || s.state === 'unavailable' || s.state === 'unknown' ? null : fin(s.state));

export interface EnergyHomeLiveInput {
  now: number;
  currency: string;
  /** Today, hourly (`useEnergyData` with period 'day'). */
  day: TransformedEnergyModel;
  /** The last seven days, this month by day, this year by month; missing while they load. */
  periods: Partial<Record<Exclude<Period, 'day'>, TransformedEnergyModel>>;
  realtime: InstantaneousPowerTelemetry;
  states: Readonly<Record<string, HAState>>;
  resolvedEntities?: Readonly<Record<string, ResolvedEntity>>;
  ids?: ExtractedEnergyStatisticIds | null;
  /** Today's grid carbon history (the CO₂ sensor's states since midnight), for the carbon lane. */
  co2History?: readonly { state: string; timestamp: number }[];
}

// ---------------------------------------------------------------------------------------------
// Finding the related sensors
// ---------------------------------------------------------------------------------------------

const unitOf = (s: HAState | undefined) => String(s?.attributes?.unit_of_measurement ?? '').toLowerCase();

/** Grid carbon intensity now (Electricity Maps, CO2 Signal). */
export function findCo2Entity(states: Readonly<Record<string, HAState>>): string | null {
  const ids = Object.keys(states).filter((id) => id.startsWith('sensor.'));
  return (
    ids.find((id) => /co2_intensity|carbon_intensity|grid_carbon/.test(id) && num(states[id]) !== null) ??
    ids.find((id) => /gco2/.test(unitOf(states[id]).replace(/\s|eq|\//g, '')) && num(states[id]) !== null) ??
    null
  );
}

export function findFossilEntity(states: Readonly<Record<string, HAState>>): string | null {
  return Object.keys(states).find((id) => id.startsWith('sensor.') && /fossil_fuel_percentage|grid_fossil_fuel/.test(id) && num(states[id]) !== null) ?? null;
}

/** The price sensor: the grid's price entity in the Energy dashboard first, then Nordpool / Tibber-style sensors. */
export function findPriceEntity(states: Readonly<Record<string, HAState>>, ids?: ExtractedEnergyStatisticIds | null): string | null {
  const configured = [...(ids?.gridImport ?? []).map((g) => g.priceEntity), ...(ids?.allPriceEntityIds ?? [])].find((id): id is string => !!id && !!states[id]);
  if (configured) return configured;
  return (
    Object.keys(states).find((id) => {
      const a = states[id].attributes ?? {};
      return id.startsWith('sensor.') && (Array.isArray(a.raw_today) || (Array.isArray(a.today) && a.today.length >= 24) || /nordpool|electricity_price|tibber_price/.test(id));
    }) ?? null
  );
}

// ---------------------------------------------------------------------------------------------
// Prices
// ---------------------------------------------------------------------------------------------

/** Sensors that report cents (Nordpool's `price_in_cents`, "ct/kWh", "c/kWh") are scaled to the currency. */
function priceScale(s: HAState): number {
  if (s.attributes?.price_in_cents === true) return 0.01;
  const u = unitOf(s);
  return /^(ct|c|cents?|öre|ore|p)\b|^(ct|c|p)\//.test(u) ? 0.01 : 1;
}

/**
 * Today's price per hour from the sensor's attributes, averaging quarter-hours: Nordpool
 * `raw_today: [{start, value}]` or `today: number[]` (24 or 96), Tibber-style `today: [{total,
 * startsAt}]`. null where the sensor says nothing for the hour.
 */
export function hourlyPrices(s: HAState | undefined, dayStart: number): (number | null)[] {
  const out: number[][] = Array.from({ length: 24 }, () => []);
  if (!s) return out.map(() => null);
  const scale = priceScale(s);
  const a = s.attributes ?? {};
  const put = (t: number, v: unknown) => {
    const n = fin(v);
    const i = Math.floor((t - dayStart) / HOUR);
    if (n !== null && i >= 0 && i < 24) out[i].push(n * scale);
  };
  const list: unknown = Array.isArray(a.raw_today) ? a.raw_today : a.today;
  if (Array.isArray(list)) {
    if (list.every((v) => typeof v === 'number' || typeof v === 'string')) {
      const per = list.length % 24 === 0 && list.length > 0 ? list.length / 24 : 0;
      if (per) list.forEach((v, k) => put(dayStart + Math.floor(k / per) * HOUR, v));
    } else {
      for (const p of list as Record<string, unknown>[]) {
        if (!p || typeof p !== 'object') continue;
        const at = Date.parse(String(p.start ?? p.startsAt ?? p.start_time ?? p.time ?? ''));
        if (Number.isFinite(at)) put(at, p.value ?? p.total ?? p.price);
      }
    }
  }
  return out.map((v) => (v.length ? v.reduce((x, y) => x + y, 0) / v.length : null));
}

export function priceLevel(price: number | null, day: readonly (number | null)[]): PriceLevel | null {
  const known = day.filter((p): p is number => p !== null).sort((a, b) => a - b);
  if (price === null || known.length < 6) return null;
  const at = (q: number) => known[Math.min(known.length - 1, Math.floor(q * known.length))];
  return price <= at(1 / 3) ? 'low' : price >= at(2 / 3) ? 'high' : 'normal';
}

// ---------------------------------------------------------------------------------------------
// Sun, forecast, carbon
// ---------------------------------------------------------------------------------------------

/** Today's sunrise and sunset from `sun.sun`, whose next_* times roll over once each has passed. */
export function sunToday(s: HAState | undefined, now: number): EnergyHome['sun'] {
  if (!s) return null;
  const next = (k: string) => Date.parse(String(s.attributes?.[k] ?? ''));
  let rising = next('next_rising');
  let setting = next('next_setting');
  if (!Number.isFinite(rising) || !Number.isFinite(setting)) return null;
  const up = s.state === 'above_horizon';
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);
  const tomorrow = day.getTime() + 24 * HOUR;
  // Up: today's sunrise has passed, so next_rising is tomorrow's; bring it back to today. Down after
  // sunset: next_setting is tomorrow's; bring it back, and keep tomorrow's sunrise (the page reads a
  // sunrise later than the sunset as tomorrow's).
  if (up && rising >= tomorrow) rising -= 24 * HOUR;
  if (!up && setting >= tomorrow) setting -= 24 * HOUR;
  return { up, elevation: fin(s.attributes?.elevation) ?? 0, rising, setting };
}

/** Forecast.Solar's (or Solcast's) estimate for tomorrow, kWh. */
export function forecastTomorrow(states: Readonly<Record<string, HAState>>): number | null {
  const id = Object.keys(states).find((k) => k.startsWith('sensor.') && /energy_production_tomorrow$|forecast_tomorrow$/.test(k) && num(states[k]) !== null);
  if (!id) return null;
  const v = num(states[id]) as number;
  return r2(unitOf(states[id]) === 'wh' ? v / 1000 : v);
}

/** Carbon per hour: the mean of the hour's states, carrying the last one through quiet hours; the current hour uses `nowValue`. */
export function hourlyCo2(history: readonly { state: string; timestamp: number }[], dayStart: number, now: number, nowValue: number | null): (number | null)[] {
  const points = history.map((p) => ({ t: p.timestamp, v: fin(p.state) })).filter((p): p is { t: number; v: number } => p.v !== null).sort((a, b) => a.t - b.t);
  const cur = Math.floor((now - dayStart) / HOUR);
  let last: number | null = null;
  let k = 0;
  return Array.from({ length: 24 }, (_, i) => {
    if (i > cur) return null;
    if (i === cur && nowValue !== null) return Math.round(nowValue);
    const end = dayStart + (i + 1) * HOUR;
    const inHour: number[] = [];
    while (k < points.length && points[k].t < end) {
      if (points[k].t >= dayStart + i * HOUR) inHour.push(points[k].v);
      last = points[k].v;
      k++;
    }
    const v = inHour.length ? inHour.reduce((a, b) => a + b, 0) / inHour.length : last;
    return v === null ? null : Math.round(v);
  });
}

// ---------------------------------------------------------------------------------------------
// Battery
// ---------------------------------------------------------------------------------------------

/** Usable capacity, kWh: a capacity sensor when there is one, else a floor from today's throughput. */
export function batteryCapacity(states: Readonly<Record<string, HAState>>, totals: TransformedEnergyTotals): number {
  const id = Object.keys(states).find((k) => k.startsWith('sensor.') && /(rated|usable|battery)_capacity|capacity_battery/.test(k) && /k?wh/.test(unitOf(states[k])) && (num(states[k]) ?? 0) > 0);
  if (id) {
    const v = num(states[id]) as number;
    return r2(unitOf(states[id]) === 'wh' ? v / 1000 : v);
  }
  return Math.max(10, r2(totals.batteryCharge), r2(totals.batteryDischarge));
}

/** Charge at the end of each past hour, walked back from the charge now. */
export function socCurve(hours: readonly { batteryIn: number; batteryOut: number; future: boolean }[], socNow: number | null, capacity: number): (number | null)[] {
  if (socNow === null) return hours.map(() => null);
  const out: (number | null)[] = hours.map(() => null);
  let soc = socNow;
  for (let i = hours.length - 1; i >= 0; i--) {
    if (hours[i].future) continue;
    out[i] = Math.round(Math.min(100, Math.max(0, soc)));
    soc -= ((hours[i].batteryIn - hours[i].batteryOut) / capacity) * 100;
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------------------------

const KIND_RULES: [DeviceKind, RegExp][] = [
  ['ev', /\b(ev|car|tesla|wallbox|charger|zappi|easee|go-?e|vehicle|auto)\b/i],
  ['heat', /heat ?pump|heating|boiler|furnace|radiator|warmtepomp|wärmepumpe|air ?con|hvac|\bac\b/i],
  ['water', /water heater|hot water|geyser|immersion|cylinder/i],
  ['kitchen', /oven|fridge|freezer|dishwasher|kitchen|cooktop|hob|stove|microwave|kettle|coffee/i],
  ['laundry', /wash|dryer|laundry/i],
  ['media', /\btv\b|television|media|console|playstation|xbox|sonos|speaker|audio/i],
  ['office', /office|desk|computer|\bpc\b|monitor|server|nas|router|network|printer/i]
];
export const deviceKind = (name: string): DeviceKind => KIND_RULES.find(([, re]) => re.test(name))?.[0] ?? 'other';

/** A device's power now: a power sensor on the same HA device as its energy statistic. */
function devicePower(statId: string, resolved: Readonly<Record<string, ResolvedEntity>> | undefined, states: Readonly<Record<string, HAState>>): number {
  const own = resolved?.[statId];
  const candidates = own?.device_id ? Object.values(resolved ?? {}).filter((e) => e.device_id === own.device_id && e.entity_id !== statId) : [];
  const power = candidates.find((e) => e.domain === 'sensor' && (e.attributes?.device_class === 'power' || /^k?w$/i.test(String(e.attributes?.unit_of_measurement ?? ''))));
  if (!power) return 0;
  const s = states[power.entity_id];
  const v = num(s);
  if (v === null) return 0;
  return Math.max(0, unitOf(s) === 'kw' ? v : v / 1000);
}

// ---------------------------------------------------------------------------------------------
// Totals and history
// ---------------------------------------------------------------------------------------------

export function toTotals(t: TransformedEnergyTotals, f: TransformedFinancials): EnergyTotals {
  return {
    used: r2(t.homeConsumption),
    solar: r2(t.solar),
    gridIn: r2(t.gridImport),
    gridOut: r2(t.gridExport),
    batteryIn: r2(t.batteryCharge),
    batteryOut: r2(t.batteryDischarge),
    cost: r2(f.gridImportCost - f.gridExportCompensation),
    exportCredit: r2(f.gridExportCompensation),
    selfSufficiency: Math.round(Math.min(100, Math.max(0, t.selfSufficiencyPercentage)))
  };
}

const LABEL: Record<Exclude<Period, 'day'>, (t: number) => string> = {
  week: (t) => new Date(t).toLocaleDateString([], { weekday: 'short' }),
  month: (t) => String(new Date(t).getDate()),
  year: (t) => new Date(t).toLocaleDateString([], { month: 'short' })
};

/**
 * One bar per bucket up to now. HA gives costs for the period only, so each bar's cost is its
 * import at the period's average price (what the grid cost, as in the studio).
 */
export function historySlots(m: TransformedEnergyModel | undefined, period: Exclude<Period, 'day'>, now: number): PeriodSlot[] {
  if (!m) return [];
  const rate = m.totals.gridImport > 0.01 ? m.financials.gridImportCost / m.totals.gridImport : 0;
  return m.buckets
    .filter((b) => b.startMs <= now)
    .map((b) => ({ label: LABEL[period](b.startMs), used: r2(b.homeConsumption), solar: r2(b.solar), gridIn: r2(b.gridImport), gridOut: r2(b.gridExport), cost: r2(b.gridImport * rate) }));
}

function utility(kind: 'gas' | 'water', day: TransformedEnergyModel, week: TransformedEnergyModel | undefined, now: number): Utility | null {
  const has = kind === 'gas' ? day.hasGas : day.hasWater;
  if (!has) return null;
  const pick = (b: TransformedEnergyBucket) => (kind === 'gas' ? b.gasUsage : b.waterUsage);
  const unit = (kind === 'gas' ? day.totals.gasUnit : day.totals.waterUnit) || (kind === 'gas' ? 'm³' : 'L');
  return {
    kind,
    unit,
    today: r2(kind === 'gas' ? day.totals.gasUsage : day.totals.waterUsage),
    cost: r2(kind === 'gas' ? day.financials.gasCost : day.financials.waterCost),
    week: (week?.buckets ?? []).filter((b) => b.startMs <= now).slice(-7).map((b) => r2(pick(b)))
  };
}

// ---------------------------------------------------------------------------------------------
// Lifetime impact (Huawei FusionSolar's "energy information" sensors)
// ---------------------------------------------------------------------------------------------

/** Lifetime CO₂ avoided and trees from Huawei's sensors (kg or t); energy made is estimated at 0.4 kg CO₂/kWh. */
export function lifetimeImpact(states: Readonly<Record<string, HAState>>): EnergyHome['impact'] {
  const co2 = states['sensor.energy_information_lifetime_co2_emission_reduction'];
  const trees = num(states['sensor.energy_information_lifetime_equivalent_tree_planted']);
  const co2Raw = num(co2);
  if ((co2Raw ?? 0) <= 0 && (trees ?? 0) <= 0) return null;
  const co2Kg = co2Raw === null ? 0 : /^(t|ton|tons|tonnes?)$/.test(unitOf(co2).trim()) ? co2Raw * 1000 : co2Raw;
  return { lifetimeKwh: Math.round(co2Kg / 0.4), co2AvoidedKg: Math.round(co2Kg), trees: trees === null ? 0 : Math.round(trees * 10) / 10 };
}

// ---------------------------------------------------------------------------------------------
// The page model
// ---------------------------------------------------------------------------------------------

const FIVE_MIN = 5 * 60_000;

/**
 * Today's 5-minute buckets (`useEnergyData`'s `powerBuckets`, kWh per five minutes, from the power
 * sensors where Energy has them) as kW for the power chart, as HA's own graph draws today. A slot
 * whose five minutes are not over has no statistic yet, so it counts as future. Null when the
 * buckets aren't a whole day (not loaded yet).
 */
export function fiveMinutePower(buckets: readonly TransformedEnergyBucket[] | undefined, dayStart: number, now: number): PowerSlot[] | null {
  const today = (buckets ?? []).filter((b) => b.startMs >= dayStart && b.startMs < dayStart + 86400_000).sort((a, b) => a.startMs - b.startMs);
  if (today.length < 200) return null;
  const kw = (v: number | undefined, future: boolean) => (future || v === undefined || !Number.isFinite(v) ? 0 : r2(Math.max(0, v) * 12));
  return today.map((b) => {
    const future = b.startMs + FIVE_MIN > now;
    return { at: b.startMs, solar: kw(b.solar, future), home: kw(b.homeConsumption, future), gridIn: kw(b.gridImport, future), gridOut: kw(b.gridExport, future), batteryIn: kw(b.batteryCharge, future), batteryOut: kw(b.batteryDischarge, future), future };
  });
}

export function buildEnergyHome(input: EnergyHomeLiveInput): EnergyHome {
  const { now, day, periods, realtime, states } = input;
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const dayStart = midnight.getTime();

  const priceId = findPriceEntity(states, input.ids);
  const priceState = priceId ? states[priceId] : undefined;
  const prices = hourlyPrices(priceState, dayStart);
  const curHour = Math.min(23, Math.max(0, Math.floor((now - dayStart) / HOUR)));
  const fixed = input.ids?.gridImport.find((g) => fin(g.fixedPrice) !== null)?.fixedPrice ?? null;
  const priceNow = prices[curHour] ?? (priceState && num(priceState) !== null ? r2((num(priceState) as number) * priceScale(priceState)) : fixed);

  const co2Id = findCo2Entity(states);
  const co2Now = co2Id ? num(states[co2Id]) : null;
  const co2 = co2Id ? hourlyCo2(input.co2History ?? [], dayStart, now, co2Now) : Array.from({ length: 24 }, () => null);
  const fossilId = findFossilEntity(states);

  const hasForecast = day.hasSolar && day.buckets.some((b) => b.solarForecast !== null);
  const bucketAt = (at: number) => day.buckets.find((b) => b.startMs >= at && b.startMs < at + HOUR);
  const raw = Array.from({ length: 24 }, (_, i) => {
    const at = new Date(midnight.getFullYear(), midnight.getMonth(), midnight.getDate(), i).getTime();
    const b = bucketAt(at);
    const future = at > now;
    const e = (v: number | undefined) => (future || v === undefined ? 0 : r2(v));
    return {
      at,
      solar: e(b?.solar),
      home: e(b?.homeConsumption),
      gridIn: e(b?.gridImport),
      gridOut: e(b?.gridExport),
      batteryIn: e(b?.batteryCharge),
      batteryOut: e(b?.batteryDischarge),
      price: prices[i],
      co2: co2[i],
      forecast: hasForecast && b?.solarForecast != null ? r2(b.solarForecast) : hasForecast ? 0 : null,
      future
    };
  });

  const hasBattery = day.hasBattery;
  const soc = hasBattery && realtime.batterySoC !== null ? Math.round(Math.min(100, Math.max(0, realtime.batterySoC))) : null;
  const capacity = hasBattery ? batteryCapacity(states, day.totals) : 0;
  const socs = hasBattery ? socCurve(raw, soc, capacity) : raw.map(() => null);
  const today: HourSlot[] = raw.map((h, i) => ({ ...h, soc: socs[i] }));

  const forecastTotal = day.totals.solarForecastTotal;
  const elapsed = Math.min(1, Math.max(0, (now - today[curHour].at) / HOUR));
  const remaining = today.reduce((s, h, i) => s + (i > curHour ? h.forecast ?? 0 : i === curHour ? (h.forecast ?? 0) * (1 - elapsed) : 0), 0);

  const power = fiveMinutePower(day.powerBuckets, dayStart, now);

  const dayTotals = toTotals(day.totals, day.financials);
  const totalsOf = (p: Exclude<Period, 'day'>) => (periods[p] ? toTotals(periods[p]!.totals, periods[p]!.financials) : dayTotals);

  const devices: EnergyDevice[] = day.devices
    .filter((d) => Number.isFinite(d.kwh) && d.kwh > 0.005)
    .map((d) => ({ id: d.statId, name: d.name, kind: deviceKind(d.name), power: r2(devicePower(d.statId, input.resolvedEntities, states)), today: r2(d.kwh) }));

  return {
    now,
    currency: input.currency,
    live: {
      solar: day.hasSolar ? r2(Math.max(0, realtime.solarPowerKW)) : null,
      home: r2(Math.max(0, realtime.homeConsumptionKW)),
      grid: day.hasGrid ? r2(realtime.gridPowerKW) : null,
      battery: hasBattery ? r2(-realtime.batteryPowerKW) : null,
      soc
    },
    battery: hasBattery ? { capacity } : null,
    grid: {
      price: priceNow === null ? null : r2(priceNow),
      priceLevel: priceLevel(priceNow, prices),
      co2: co2Now === null ? null : Math.round(co2Now),
      fossil: fossilId ? Math.round(num(states[fossilId]) as number) : null
    },
    sun: sunToday(states['sun.sun'], now),
    forecast: day.hasSolar && (forecastTotal !== null || hasForecast) ? { today: r2(forecastTotal ?? today.reduce((s, h) => s + (h.forecast ?? 0), 0)), remaining: r2(remaining), tomorrow: forecastTomorrow(states) } : null,
    today,
    ...(power ? { power } : {}),
    totals: { day: dayTotals, week: totalsOf('week'), month: totalsOf('month'), year: totalsOf('year') },
    history: { week: historySlots(periods.week, 'week', now), month: historySlots(periods.month, 'month', now), year: historySlots(periods.year, 'year', now) },
    devices,
    gas: utility('gas', day, periods.week, now),
    water: utility('water', day, periods.week, now),
    impact: lifetimeImpact(states)
  };
}
