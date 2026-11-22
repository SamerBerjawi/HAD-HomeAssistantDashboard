import { lazy } from 'react';
import { SunCloud02Icon } from '@hugeicons/core-free-icons';
import type { ProOverviewWeatherModel } from '../../lib/overviewWeather';
import { defineWidget } from '../types';
import WeatherConceptA from './concepts/WeatherConceptA';
import WeatherConceptB from './concepts/WeatherConceptB';
import WeatherConceptC from './concepts/WeatherConceptC';
import { WEATHER_FIXTURE } from './fixture';
import { useWeatherModel } from './useWeatherModel';

/**
 * Weather (WIDGET_DESIGN.md pilot). Three styles the user picks per device layout (owner decision
 * 2026-11-19): Minimal (A), Sky (B, default) and Trend (C). Each owns its whole card.
 */
export const weatherWidget = defineWidget<ProOverviewWeatherModel>({
  id: 'weather',
  section: 'climate',
  title: 'Weather',
  icon: SunCloud02Icon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: useWeatherModel,
  designs: [
    { id: 'sky', name: 'Sky', description: 'The card is the sky outside', Body: WeatherConceptB },
    { id: 'minimal', name: 'Minimal', description: 'Large temperature, quiet rows', Body: WeatherConceptA },
    { id: 'trend', name: 'Trend', description: 'Temperature as a line and colour', Body: WeatherConceptC }
  ],
  defaultDesign: 'sky',
  Sheet: lazy(() => import('./WeatherSheet')),
  subtitle: (m) => (m.hasEntity ? m.stationName : undefined),
  fixture: WEATHER_FIXTURE
});
