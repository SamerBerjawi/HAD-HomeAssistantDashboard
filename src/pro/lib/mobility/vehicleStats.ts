/**
 * Vehicle statistics (docs/pro-ui/VEHICLE_TILES.md, batch 7): what the Statistics tiles say about
 * a vehicle's months. Pure: the history comes from Home Assistant's long-term statistics or the
 * server's daily snapshot (`VehicleHistory`), the clock from the page.
 */
import type { VehicleHistory, VehicleMonth } from '../mobilityHome';

const DAY = 86400_000;
const daysIn = (t: number) => new Date(new Date(t).getFullYear(), new Date(t).getMonth() + 1, 0).getDate();
/** How far through its month `now` is (0–1). */
export const monthShare = (now: number) => new Date(now).getDate() / daysIn(now);
export const monthName = (t: number, long = false) => new Date(t).toLocaleDateString(undefined, { month: long ? 'long' : 'short' });
const ym = (t: number) => new Date(t).getFullYear() * 12 + new Date(t).getMonth();

/** This month so far, where it is heading, last month, and the same month a year ago. */
export function monthCompare(h: VehicleHistory, now: number) {
  const find = (back: number) => h.months.find((m) => ym(m.start) === ym(now) - back) ?? null;
  const cur = find(0);
  const sofar = cur?.distance ?? 0;
  const last = find(1);
  const lastYear = find(12);
  const heading = sofar / Math.max(monthShare(now), 1 / 31);
  // Against last month at the same point in it, so a month half gone is not "down 50 %".
  const vsLast = last && last.distance > 0 ? heading / last.distance - 1 : null;
  return { sofar, heading, last, lastYear, vsLast, vsLastYear: lastYear && lastYear.distance > 0 ? heading / lastYear.distance - 1 : null };
}

/** The year so far against last year to the same day, and each year's running total by month. */
export function yearCompare(h: VehicleHistory, now: number) {
  const y = new Date(now).getFullYear();
  const year = (yr: number) => h.months.filter((m) => new Date(m.start).getFullYear() === yr);
  const running = (list: VehicleMonth[]) => list.reduce<number[]>((acc, m) => [...acc, (acc.at(-1) ?? 0) + m.distance], []);
  const thisYear = running(year(y));
  const lastYearList = year(y - 1);
  const lastYear = running(lastYearList);
  const m = new Date(now).getMonth();
  const lastToDate = lastYearList.length ? (lastYear[m - 1] ?? 0) + (lastYearList[m]?.distance ?? 0) * monthShare(now) : null;
  const ytd = thisYear.at(-1) ?? 0;
  const days = (now - new Date(y, 0, 1).getTime()) / DAY;
  return { ytd, lastToDate, vs: lastToDate ? ytd / lastToDate - 1 : null, perDay: ytd / Math.max(1, days), thisYear, lastYear, best: [...h.months].sort((a, b) => b.distance - a.distance)[0] ?? null };
}

/** Where a lease's mileage stands: used, allowed by today, the projection at the end, what is left per day. */
export function allowancePace(h: VehicleHistory, odometer: number | null, now: number) {
  const a = h.allowance;
  if (!a || odometer === null) return null;
  const end = new Date(a.since);
  end.setFullYear(end.getFullYear() + a.years);
  const total = a.perYear * a.years;
  const elapsed = Math.min(1, Math.max(0, (now - a.since) / (end.getTime() - a.since)));
  const used = Math.max(0, odometer - a.odometerAtStart);
  const allowedNow = total * elapsed;
  const projected = elapsed > 0.02 ? used / elapsed : null;
  const daysLeft = Math.max(0, Math.round((end.getTime() - now) / DAY));
  return { total, used, allowedNow, ahead: used - allowedNow, projected, over: projected !== null ? projected - total : null, elapsed, end: end.getTime(), daysLeft, perDayLeft: daysLeft > 0 ? Math.max(0, total - used) / daysLeft : 0 };
}

/** A month's energy cost at the home tariff, and per 100 of distance. */
export function monthCost(m: VehicleMonth, price: VehicleHistory['price']) {
  if (!price || m.per100 === null) return null;
  const kwh = (m.distance * m.per100) / 100;
  return { total: kwh * price.perKwh, per100: m.per100 * price.perKwh };
}

/** One month of Home Assistant's long-term statistics for an odometer (`recorder/statistics_during_period`, period month). */
export interface OdometerStat {
  start: number | string;
  change?: number | null;
  state?: number | null;
  max?: number | null;
}

/** An odometer's monthly statistics as months of distance, oldest first: `change` for a total_increasing sensor, else the step between readings. */
export function monthsFromOdometer(records: OdometerStat[]): VehicleMonth[] {
  const out: VehicleMonth[] = [];
  let prev: number | null = null;
  for (const r of records) {
    const reading = r.state ?? r.max ?? null;
    const distance = r.change ?? (reading !== null && prev !== null ? reading - prev : null);
    if (reading !== null) prev = reading;
    // The first month of a measurement sensor has nothing to step from; a reset reads as negative.
    if (distance === null || distance < 0) continue;
    out.push({ start: typeof r.start === 'number' ? r.start : Date.parse(r.start), distance, per100: null, outside: null, charges: null });
  }
  return out;
}

export const signed = (r: number | null) => (r === null ? '' : `${r >= 0 ? '+' : '−'}${Math.abs(Math.round(r * 100))}%`);
