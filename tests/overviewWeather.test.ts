import { describe, expect, it } from 'vitest';
import type { ResolvedEntity } from '@/types';
import {
  buildOverviewWeatherModel,
  formatWeatherConditionLabel,
  formatWindCardinal,
  getUvBadgeInfo,
  getWeatherConditionTone
} from '../src/pro/lib/overviewWeather';

function makeWeatherEntity(
  entityId: string,
  state: string,
  attrs: Record<string, unknown> = {},
  name = 'Home Weather'
): ResolvedEntity {
  return {
    entity_id: entityId,
    state,
    attributes: attrs,
    domain: 'weather',
    name,
    area_id: null,
    floor_id: null,
    device_id: null,
    resolutionSource: 'direct_entity_area',
    hidden: false,
    isDiagnostic: false,
    disabled_by: null
  };
}

describe('overviewWeather helpers', () => {
  it('formats Home Assistant weather conditions into readable labels', () => {
    expect(formatWeatherConditionLabel('partlycloudy')).toBe('Partly cloudy');
    expect(formatWeatherConditionLabel('clear-night')).toBe('Clear night');
    expect(formatWeatherConditionLabel('lightning-rainy')).toBe('Thunderstorm');
    expect(formatWeatherConditionLabel('pouring')).toBe('Heavy rain');
  });

  it('maps conditions to semantic pill tones', () => {
    expect(getWeatherConditionTone('lightning-rainy')).toBe('danger');
    expect(getWeatherConditionTone('rainy')).toBe('warning');
    expect(getWeatherConditionTone('sunny')).toBe('success');
    expect(getWeatherConditionTone('partlycloudy')).toBe('accent');
  });

  it('maps UV index to green/orange/red tones only', () => {
    expect(getUvBadgeInfo(1.5)).toEqual({ label: 'Low', tone: 'success' });
    expect(getUvBadgeInfo(5.0)).toEqual({ label: 'Moderate', tone: 'warning' });
    expect(getUvBadgeInfo(7.0)).toEqual({ label: 'High', tone: 'warning' });
    expect(getUvBadgeInfo(9.5)).toEqual({ label: 'Very High', tone: 'danger' });
    expect(getUvBadgeInfo(undefined)).toBeNull();
  });

  it('converts wind bearing degrees to 8-point cardinal labels', () => {
    expect(formatWindCardinal(0)).toBe('N');
    expect(formatWindCardinal(90)).toBe('E');
    expect(formatWindCardinal(225)).toBe('SW');
    expect(formatWindCardinal(350)).toBe('N');
    expect(formatWindCardinal(undefined)).toBe('—');
  });

  it('builds daily range bars and station options from multiple weather entities', () => {
    const home = makeWeatherEntity(
      'weather.home',
      'partlycloudy',
      {
        temperature: 22.4,
        temperature_unit: '°C',
        humidity: 58,
        uv_index: 5.4,
        wind_bearing: 235,
        wind_speed: 14.2,
        forecast: [
          { datetime: '2026-08-27T12:00:00Z', condition: 'partlycloudy', temperature: 24, templow: 14, precipitation_probability: 10 },
          { datetime: '2026-08-28T12:00:00Z', condition: 'sunny', temperature: 28, templow: 16, precipitation_probability: 0 },
          { datetime: '2026-08-29T12:00:00Z', condition: 'rainy', temperature: 20, templow: 12, precipitation_probability: 75 }
        ]
      },
      'Home Weather'
    );
    const patio = makeWeatherEntity(
      'weather.patio',
      'sunny',
      { temperature: 24.0, temperature_unit: '°C' },
      'Patio Station'
    );

    const model = buildOverviewWeatherModel({
      weatherEntities: [home, patio],
      selectedWeatherEntityId: 'weather.home',
      sunState: 'above_horizon',
      isDemo: true
    });

    expect(model.stations).toHaveLength(2);
    expect(model.stationName).toBe('Home Weather');
    expect(model.windCardinal).toBe('SW');
    expect(model.uvBadge).toEqual({ label: 'High', tone: 'warning' });
    expect(model.daily).toHaveLength(3);
    // Global range: 12..28 (span 16). Day 2 (rainy, 12..20) starts at 0%.
    expect(model.daily[2].rangeStartPct).toBe(0);
    expect(model.daily[2].rangeWidthPct).toBe(50);
    // Day 1 (sunny, 16..28) reaches top of global range.
    expect(model.daily[1].rangeStartPct + model.daily[1].rangeWidthPct).toBeLessThanOrEqual(100);
    expect(model.hourly.length).toBeGreaterThan(0);
  });
});
