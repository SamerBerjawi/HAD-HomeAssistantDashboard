import { describe, expect, it } from 'vitest';
import {
  buildStudioEnergySnapshot,
  ENERGY_SECTIONS,
  STUDIO_STATES,
  type EnergySectionId,
  type PhoneTabId,
  type StudioPeriod
} from '../src/pro/pages/energy/studio/studioEnergy';
import { buildPhoneTabs, deltaBadge, visibleSections } from '../src/pro/pages/energy/studio/energyParts';

const PERIODS: StudioPeriod[] = ['day', 'week', 'month', 'year', 'custom'];

describe('studioEnergy', () => {
  it('builds finite models for every state and period without NaN/Infinity', () => {
    for (const s of STUDIO_STATES) {
      for (const period of PERIODS) {
        const snap = buildStudioEnergySnapshot({
          stateId: s.id,
          period,
          dateOffset: 0,
          compareEnabled: true,
          compareYear: 2025
        });
        expect(Number.isFinite(snap.model.homeKwh)).toBe(true);
        expect(Number.isFinite(snap.model.homeKW)).toBe(true);
        expect(Number.isFinite(snap.model.netCost)).toBe(true);
        expect(snap.model.electricitySeries.length).toBeGreaterThan(0);
        expect(snap.comparison).not.toBeNull();
        for (const pt of snap.batterySeries) {
          expect(pt.socPct).toBeGreaterThanOrEqual(0);
          expect(pt.socPct).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('hides solar, battery and impact on grid-only setups', () => {
    const grid = buildStudioEnergySnapshot({
      stateId: 'grid',
      period: 'day',
      dateOffset: 0,
      compareEnabled: false,
      compareYear: 2025
    });
    expect(grid.model.hasSolar).toBe(false);
    expect(grid.model.hasBattery).toBe(false);
    expect(grid.hasImpact).toBe(false);
    expect(grid.batterySummary).toBeNull();

    const order = ENERGY_SECTIONS.map((s) => s.id);
    const vis = visibleSections(order, new Set(), grid);
    expect(vis).not.toContain('solar');
    expect(vis).not.toContain('battery');
    expect(vis).not.toContain('impact');
    expect(vis).toContain('live');
    expect(vis).toContain('costs');
  });

  it('generates 144 10-min power slots on Day and exposes solar/battery on sunny', () => {
    const sunny = buildStudioEnergySnapshot({
      stateId: 'sunny',
      period: 'day',
      dateOffset: 0,
      compareEnabled: false,
      compareYear: 2025
    });
    expect(sunny.model.hasSolar).toBe(true);
    expect(sunny.model.hasBattery).toBe(true);
    expect(sunny.impact).not.toBeNull();
    expect(sunny.model.powerSourcesSeries.length).toBe(144);
    expect(sunny.model.powerSourcesSeries.some((p) => p.future)).toBe(true);
  });

  it('filters phone tabs when sections are hidden or unavailable', () => {
    const grid = buildStudioEnergySnapshot({
      stateId: 'grid',
      period: 'week',
      dateOffset: -1,
      compareEnabled: false,
      compareYear: 2025
    });
    const order = ENERGY_SECTIONS.map((s) => s.id);
    const hidden = new Set<EnergySectionId>(['costs']);
    const vis = visibleSections(order, hidden, grid).filter((id) => id !== 'live' && id !== 'period');
    const tabMap = Object.fromEntries(ENERGY_SECTIONS.map((s) => [s.id, s.phoneTab])) as Record<EnergySectionId, PhoneTabId | null>;
    const tabs = buildPhoneTabs(vis, tabMap);
    const ids = tabs.map((t) => t.id);
    expect(ids).not.toContain('solar');
    expect(ids).not.toContain('battery');
    expect(ids).not.toContain('costs');
    expect(ids).toContain('summary');
    expect(ids).toContain('usage');
  });

  it('maps deltaBadge strictly to green/orange/red semantic tones', () => {
    expect(deltaBadge(-12, true).tone).toBe('success');
    expect(deltaBadge(14, true).tone).toBe('warning');
    expect(deltaBadge(32, true).tone).toBe('danger');
    expect(deltaBadge(18, false).tone).toBe('success');
    expect(deltaBadge(-15, false).tone).toBe('warning');
  });
});
