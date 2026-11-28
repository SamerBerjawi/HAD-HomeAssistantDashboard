import { describe, expect, it } from 'vitest';
import { DEFAULT_USER_CONFIG, type UserDashboardConfig } from '@/types/userConfig';
import { migrateLegacyOverview } from '@/pro/lib/overviewLayout';
import { energyFlowWidget, energyNowWidget, energyTodayWidget } from '@/pro/widgets/energy';
import { batteryState } from '@/pro/widgets/energy/EnergyBattery';
import { needsEnergyData } from '@/pro/widgets/energy/energyStore';
import { ENERGY_FIXTURE } from '@/pro/widgets/energy/fixture';
import { LEGACY_WIDGET_IDS, WIDGET_LAYOUT_INFO } from '@/pro/widgets/registry';

const config = (overview: Partial<UserDashboardConfig['overview']>): UserDashboardConfig =>
  ({ ...DEFAULT_USER_CONFIG, overview: { ...DEFAULT_USER_CONFIG.overview, ...overview } }) as UserDashboardConfig;

describe('Phase 3e energy widgets', () => {
  it('three widgets in the Energy section share one model', () => {
    for (const w of [energyNowWidget, energyTodayWidget, energyFlowWidget]) expect(w.section).toBe('energy');
    expect(energyNowWidget.useModel).toBe(energyTodayWidget.useModel);
    expect(energyFlowWidget.sizes).toEqual(['l']);
  });

  it('fixture: live and period numbers', () => {
    expect(ENERGY_FIXTURE.hasSolar && ENERGY_FIXTURE.hasBattery).toBe(true);
    expect(ENERGY_FIXTURE.isExporting).toBe(true);
    expect(ENERGY_FIXTURE.batterySoC).toBe(76);
    expect(energyNowWidget.subtitle?.(ENERGY_FIXTURE)).toMatch(/^Solar /);
    expect(energyTodayWidget.subtitle?.(ENERGY_FIXTURE)).toBe('Today');
  });

  it('Energy now gains Small; battery state is derived for the cards', () => {
    expect(energyNowWidget.sizes).toEqual(['s', 'w', 'l']);
    expect(energyTodayWidget.sizes).toEqual(['s', 'w', 't', 'l']);
    expect(batteryState(ENERGY_FIXTURE)?.pct).toBe(76);
    expect(batteryState({ ...ENERGY_FIXTURE, hasBattery: false })).toBeNull();
    expect(batteryState({ ...ENERGY_FIXTURE, batteryChargeKW: 0, batteryDischargeKW: 0.8 })?.mode).toBe('giving');
    expect(batteryState({ ...ENERGY_FIXTURE, batteryChargeKW: 0, batteryDischargeKW: 0, batterySoC: 12 })).toMatchObject({ mode: 'idle', low: true, note: 'Resting' });
  });

  it('fetches energy only when a widget or sheet needs it', () => {
    expect(needsEnergyData({ lights: [{ i: 'lights' }] }, null)).toBe(false);
    expect(needsEnergyData({ lights: [{ i: 'lights' }], energy: [{ i: 'energy_today' }] }, null)).toBe(true);
    expect(needsEnergyData({}, 'energy_flow')).toBe(true);
    expect(needsEnergyData({}, 'lights')).toBe(false);
  });

  it('migrates the old eight energy widgets to three', () => {
    const layout = migrateLegacyOverview(
      config({
        tileOrder: ['energy_usage_chart', 'power_flow', 'energy_flow', 'solar_production'],
        tileSizes: { power_flow: '2x', energy_flow: '2x2' } as unknown as Record<string, '1x' | '2x'>,
        hiddenTiles: ['power_flow_chart', 'energy_gauges', 'solar_production_chart']
      }),
      WIDGET_LAYOUT_INFO,
      'desktop',
      LEGACY_WIDGET_IDS
    );
    expect(layout.items.energy?.map((p) => [p.i, p.size])).toEqual([
      ['energy_today', 'w'],
      ['energy_now', 'w'],
      ['energy_flow', 'l']
    ]);
    // Power flow was visible, so Energy now stays even though its chart was hidden.
    expect(layout.hidden).toEqual([]);
  });
});
