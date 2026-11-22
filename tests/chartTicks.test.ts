import { describe, expect, it } from 'vitest';
import { niceTicks, tickLabel } from '@/pro/ui/bklit/chartTicks';

describe('chart ticks', () => {
  it('uses round steps that cover both ends (HA-like 0.5 kW grid)', () => {
    expect(niceTicks(-1.34, 1.56)).toEqual([-1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2]);
    expect(niceTicks(0, 0.55)).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
  });
  it('labels with the decimals the step needs', () => {
    expect(tickLabel(0, 0.5)).toBe('0');
    expect(tickLabel(-1.5, 0.5)).toBe('-1.5');
    expect(tickLabel(2, 1)).toBe('2');
  });
});
