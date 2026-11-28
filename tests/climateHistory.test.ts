import { describe, expect, it } from 'vitest';
import { climateRange, demoClimateHistory, parseClimateHistory } from '@/pro/lib/climateHistory';

describe('climateHistory', () => {
  it('reads compressed rows and carries attributes forward', () => {
    const res = {
      'climate.lr': [
        { s: 'heat', a: { current_temperature: 20.5, temperature: 21 }, lu: 1_700_000_000 },
        { s: 'heat', lu: 1_700_000_600 },
        { s: 'heat', a: { current_temperature: '21.2', temperature: 21 }, lu: 1_700_001_200 }
      ]
    };
    expect(parseClimateHistory(res, 'climate.lr')).toEqual([
      { t: 1_700_000_000_000, room: 20.5, target: 21 },
      { t: 1_700_000_600_000, room: 20.5, target: 21 },
      { t: 1_700_001_200_000, room: 21.2, target: 21 }
    ]);
  });

  it('skips rows without temperatures and returns nothing for other entities', () => {
    expect(parseClimateHistory({ 'climate.lr': [{ s: 'off', a: {}, lu: 1 }] }, 'climate.lr')).toEqual([]);
    expect(parseClimateHistory({ 'climate.x': [{ a: { temperature: 20 }, lu: 1 }] }, 'climate.lr')).toEqual([]);
    expect(parseClimateHistory(null, 'climate.lr')).toEqual([]);
  });

  it('makes a demo day that ends at the current reading', () => {
    const pts = demoClimateHistory(21.8, 21, Date.UTC(2026, 10, 20, 14));
    expect(pts).toHaveLength(49);
    expect(pts.at(-1)?.room).toBe(21.8);
    expect(pts.every((p, i) => i === 0 || p.t > pts[i - 1].t)).toBe(true);
  });

  it('pads the range around both lines', () => {
    const r = climateRange([
      { t: 0, room: 20, target: 21 },
      { t: 1, room: 22, target: null }
    ]);
    expect(r.lo).toBeLessThan(20);
    expect(r.hi).toBeGreaterThan(22);
    expect(climateRange([])).toEqual({ lo: 15, hi: 25 });
  });
});
