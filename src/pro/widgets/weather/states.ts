/**
 * Named weather states for the Widget Design Studio. Each one goes through the real model builder
 * (demo mode generates a matching hourly and daily forecast), so concepts see realistic models.
 */
import type { ResolvedEntity } from '@/types';
import { buildOverviewWeatherModel, type ProOverviewWeatherModel } from '../../lib/overviewWeather';
import type { WidgetState } from '../../studio/types';

const station = (state: string, temperature: number, humidity: number, extra: Record<string, unknown> = {}) =>
  ({
    entity_id: 'weather.home',
    domain: 'weather',
    name: 'Home',
    state,
    attributes: { friendly_name: 'Home', temperature, temperature_unit: '°C', humidity, wind_speed: 14, ...extra }
  }) as unknown as ResolvedEntity;

const build = (entity: ResolvedEntity, night = false): ProOverviewWeatherModel =>
  buildOverviewWeatherModel({ weatherEntities: [entity], selectedWeatherEntityId: null, sunState: night ? 'below_horizon' : 'above_horizon', isDemo: true });

export const WEATHER_STATES: WidgetState<ProOverviewWeatherModel>[] = [
  { id: 'sunny', label: 'Sunny', model: build(station('sunny', 26, 41, { uv_index: 7.2 })) },
  { id: 'partly', label: 'Partly cloudy', model: build(station('partlycloudy', 18, 58)) },
  { id: 'rain', label: 'Rain', model: build(station('rainy', 11, 88, { wind_speed: 22 })) },
  { id: 'night', label: 'Clear night', model: build(station('clear-night', 9, 70), true) },
  { id: 'snow', label: 'Snow', model: build(station('snowy', -3, 92, { wind_speed: 9 })) },
  { id: 'storm', label: 'Storm', model: build(station('lightning-rainy', 21, 84, { wind_speed: 38 })) }
];
