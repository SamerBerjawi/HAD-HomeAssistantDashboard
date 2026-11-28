import { describe, expect, it } from 'vitest';
import { DEFAULT_USER_CONFIG, type UserDashboardConfig } from '@/types/userConfig';
import { migrateLegacyOverview } from '@/pro/lib/overviewLayout';
import { fansWidget } from '@/pro/widgets/fans';
import { FANS_FIXTURE } from '@/pro/widgets/fans/fixture';
import { presenceWidget } from '@/pro/widgets/presence';
import { PRESENCE_FIXTURE } from '@/pro/widgets/presence/fixture';
import { LEGACY_WIDGET_IDS, WIDGET_LAYOUT_INFO } from '@/pro/widgets/registry';
import { switchesWidget } from '@/pro/widgets/switches';
import { SWITCHES_FIXTURE } from '@/pro/widgets/switches/fixture';
import { weatherWidget } from '@/pro/widgets/weather';
import { WEATHER_FIXTURE } from '@/pro/widgets/weather/fixture';

describe('Phase 3a/3b widgets', () => {
  it('switches: counts and subtitle', () => {
    expect(SWITCHES_FIXTURE.onCount).toBe(2);
    expect(SWITCHES_FIXTURE.totalPowerWatts).toBe(1285);
    expect(switchesWidget.subtitle?.(SWITCHES_FIXTURE)).toBe('2 of 4 on');
    expect(switchesWidget.section).toBe('switches');
  });

  it('fans: counts and subtitle; lives in Climate', () => {
    expect(FANS_FIXTURE.totalCount).toBe(4);
    expect(FANS_FIXTURE.onCount).toBe(2);
    expect(fansWidget.subtitle?.(FANS_FIXTURE)).toBe('2 of 4 running');
    expect(fansWidget.section).toBe('climate');
  });

  it('weather: one widget with current, daily and hourly data', () => {
    expect(WEATHER_FIXTURE.hasEntity).toBe(true);
    expect(WEATHER_FIXTURE.daily.length).toBeGreaterThanOrEqual(3);
    expect(WEATHER_FIXTURE.hourly.length).toBeGreaterThanOrEqual(6);
    expect(weatherWidget.sizes).toEqual(['s', 'w', 't', 'l']);
  });

  it('presence keeps the old id and lives in the People section', () => {
    expect(presenceWidget.id).toBe('users');
    expect(presenceWidget.section).toBe('people');
    expect(PRESENCE_FIXTURE.homeCount).toBe(3);
    expect(presenceWidget.subtitle?.(PRESENCE_FIXTURE)).toBe('3 of 4 home');
  });

  it('migrates the old hourly forecast tile into the merged Weather widget', () => {
    const config: UserDashboardConfig = {
      ...DEFAULT_USER_CONFIG,
      overview: { tileOrder: ['weather_hourly', 'fans', 'weather'], tileSizes: { weather_hourly: '2x' }, hiddenTiles: [] }
    };
    const layout = migrateLegacyOverview(config, WIDGET_LAYOUT_INFO, 'desktop', LEGACY_WIDGET_IDS);
    expect(layout.items.climate?.map((p) => p.i)).toEqual(['weather', 'fans', 'thermostat']); // new widgets join at the end of their section
    expect(layout.items.rooms?.map((p) => p.i)).toEqual(['areas']);
    expect(layout.items.climate?.[0].size).toBe('w');
  });
});
