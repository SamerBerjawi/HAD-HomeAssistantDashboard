import { describe, expect, it } from 'vitest';
import type { VehicleHistory } from '@/pro/lib/mobilityHome';
import { allowancePace, monthCompare, monthCost, monthsFromOdometer, yearCompare } from '@/pro/lib/mobility/vehicleStats';

const m = (y: number, mo: number, distance: number, per100: number | null = null) => ({ start: new Date(y, mo, 1).getTime(), distance, per100, outside: null, charges: null });
const now = new Date(2026, 10, 15, 12).getTime(); // half way through November

describe('vehicleStats', () => {
  const h: VehicleHistory = { months: [m(2025, 10, 1000), m(2026, 0, 500), m(2026, 9, 800), m(2026, 10, 400)], allowance: null, price: null };

  it('compares this month by where it is heading, not by what is driven so far', () => {
    const c = monthCompare(h, now);
    expect(c.sofar).toBe(400);
    expect(c.heading).toBe(800); // 400 in 15 of 30 days
    expect(c.vsLast).toBeCloseTo(0);
    expect(c.vsLastYear).toBeCloseTo(-0.2);
  });

  it('sums the year so far', () => {
    expect(yearCompare(h, now).ytd).toBe(1700);
  });

  it('says how far over the allowance pace a car is, and what is left a day', () => {
    const since = new Date(2025, 10, 15, 12).getTime();
    const p = allowancePace({ ...h, allowance: { perYear: 10_000, years: 2, since, odometerAtStart: 1000 } }, 13_000, now)!;
    expect(p.total).toBe(20_000);
    expect(p.used).toBe(12_000);
    expect(p.allowedNow).toBeCloseTo(10_000, -2); // one year of two
    expect(p.ahead).toBeGreaterThan(1900);
    expect(p.projected).toBeCloseTo(24_000, -2);
    expect(p.perDayLeft).toBeCloseTo(8000 / 365, 0);
    expect(allowancePace(h, 13_000, now)).toBeNull();
  });

  it('prices a month at the home tariff', () => {
    expect(monthCost(m(2026, 10, 1000, 20), { perKwh: 0.3, currency: 'EUR' })).toEqual({ total: 60, per100: 6 });
    expect(monthCost(m(2026, 10, 1000), { perKwh: 0.3, currency: 'EUR' })).toBeNull();
  });

  it('turns odometer statistics into months: change first, else the step, skipping the first and resets', () => {
    const out = monthsFromOdometer([
      { start: '2026-08-01T00:00:00Z', state: 1000 },
      { start: '2026-09-01T00:00:00Z', state: 1600 },
      { start: '2026-10-01T00:00:00Z', state: 20 },
      { start: Date.UTC(2026, 10, 1), change: 300, state: 320 }
    ]);
    expect(out.map((x) => x.distance)).toEqual([600, 300]);
    expect(out[0].start).toBe(Date.UTC(2026, 8, 1));
  });
});
