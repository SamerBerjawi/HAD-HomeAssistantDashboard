import { describe, expect, it } from 'vitest';
import { batteryHoursLeft, bestHours, energyVerdict, homeMix, liveFlows, rankedDevices, type PowerNow } from '@/pro/lib/energyHome';
import { studioEnergyHome } from '@/pro/pages/energy/studio/studioEnergyHome';

const NOW = Date.parse('2026-11-26T12:00:00');
const live = (p: Partial<PowerNow>): PowerNow => ({ solar: null, home: 1, grid: 0, battery: null, soc: null, ...p });

describe('liveFlows and homeMix', () => {
  it('feeds the home from solar first, then the battery, then the grid', () => {
    const p = live({ solar: 1, home: 3, battery: -1.5, grid: 0.5, soc: 60 });
    expect(liveFlows(p)).toMatchObject({ solarToHome: 1, batteryToHome: 1.5, gridToHome: 0.5 });
    expect(homeMix(p)).toEqual({ solar: 33, battery: 50, grid: 17 });
  });

  it('sends the surplus to the battery and then the grid', () => {
    const f = liveFlows(live({ solar: 5, home: 1, battery: 2, grid: -2 }));
    expect(f).toMatchObject({ solarToHome: 1, solarToBattery: 2, solarToGrid: 2, gridToHome: 0, gridToBattery: 0 });
  });
});

describe('energyVerdict', () => {
  const home = (p: Partial<PowerNow>) => ({ ...studioEnergyHome('sunny', NOW), live: live(p) });
  it('says what the power is doing now', () => {
    expect(energyVerdict(home({ solar: 5, home: 1, grid: -4 })).title).toBe('Sending 4.0 kW to the grid');
    expect(energyVerdict(home({ solar: 2, home: 2, grid: 0 })).title).toBe('Running on sunshine');
    expect(energyVerdict(home({ solar: 0, home: 2, battery: -2, soc: 40, grid: 0 }))).toMatchObject({ source: 'battery', title: 'Running on the battery', detail: 'Home uses 2.0 kW · battery 40%' });
    expect(energyVerdict(home({ solar: 0, home: 0.8, grid: 0.8 })).title).toBe('Drawing 800 W from the grid');
    expect(energyVerdict(home({ solar: 1, home: 2, grid: 1 })).title).toBe('Sun 50%, grid 50%');
  });
});

describe('studio sample homes', () => {
  it('add up: every hour balances, and the self-sufficiency matches the totals', () => {
    for (const id of ['sunny', 'evening', 'cloudy', 'grid'] as const) {
      const h = studioEnergyHome(id, NOW);
      for (const s of h.today) expect(s.solar + s.gridIn + s.batteryOut).toBeCloseTo(s.home + s.batteryIn + s.gridOut, 1);
      const t = h.totals.day;
      expect(t.selfSufficiency).toBe(t.used ? Math.round(Math.max(0, 1 - t.gridIn / t.used) * 100) : 0);
    }
  });

  it('leave out what a home does not have', () => {
    const flat = studioEnergyHome('grid', NOW);
    expect(flat.live).toMatchObject({ solar: null, battery: null, soc: null });
    expect(flat.forecast).toBeNull();
    expect(flat.impact).toBeNull();
    expect(batteryHoursLeft(flat)).toBeNull();
  });

  it('find the cheapest and cleanest hours ahead, the battery time left and untracked use', () => {
    const h = studioEnergyHome('evening', NOW);
    const { cheapest, cleanest } = bestHours(h);
    expect(cheapest && cheapest.at + 3600_000 > h.now).toBe(true);
    expect(cleanest?.co2).not.toBeNull();
    expect(batteryHoursLeft(h)).toBeGreaterThan(0);
    const { list, untracked } = rankedDevices(h);
    expect(list[0].name).toBe('EV charger');
    expect(untracked).toBeGreaterThanOrEqual(0);
  });
});

describe('cheapestWindow and dayAxisFraction', () => {
  it('finds the cheapest two hours ahead and places times on the day axis', async () => {
    const { cheapestWindow, dayAxisFraction } = await import('@/pro/lib/energyHome');
    const h = studioEnergyHome('sunny', NOW);
    const w = cheapestWindow(h, 2);
    expect(w && w.to - w.from).toBe(2 * 3600_000);
    expect(w && w.from + 3600_000 > h.now).toBe(true);
    const day = new Date(h.now);
    day.setHours(0, 0, 0, 0);
    expect(dayAxisFraction(h, day.getTime() + 23 * 3600_000)).toBe(1);
    expect(dayAxisFraction(h, day.getTime())).toBe(0);
  });
});
