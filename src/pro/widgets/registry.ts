/**
 * Overview widget registry (rebuild, Phase 1). The page, Add widgets sheet, sheets host and tests
 * read widgets from here. Phase 3 adds the rest; Lights is the pilot.
 */
import type { LayoutWidgetInfo } from '../lib/overviewLayout';
import { alarmWidget } from './alarm';
import { areasWidget } from './areas';
import { camerasWidget } from './cameras';
import { carWidget } from './car';
import { energyFlowWidget, energyNowWidget, energyTodayWidget } from './energy';
import { fansWidget } from './fans';
import { lightsWidget } from './lights';
import { locksWidget } from './locks';
import { mediaWidget } from './media';
import { motionWidget } from './motion';
import { openingsWidget } from './openings';
import { presenceWidget } from './presence';
import { safetyWidget } from './safety';
import { scenesWidget } from './scenes';
import { switchesWidget } from './switches';
import { thermostatWidget } from './thermostat';
import { vacuumsWidget } from './vacuums';
import { weatherWidget } from './weather';
import { layoutInfoOf, type WidgetDefinition } from './types';

// Each entry keeps its own model type; the registry only needs the shared shape.
// Safe: a definition is only ever used through its own useModel → Body/Sheet pair.
type AnyWidget = WidgetDefinition<never>;
const asAny = <M>(w: WidgetDefinition<M>) => w as unknown as AnyWidget;

export const WIDGETS: readonly AnyWidget[] = [
  asAny(weatherWidget),
  asAny(areasWidget),
  asAny(thermostatWidget),
  asAny(fansWidget),
  asAny(presenceWidget),
  asAny(carWidget),
  asAny(lightsWidget),
  asAny(scenesWidget),
  asAny(switchesWidget),
  asAny(energyNowWidget),
  asAny(energyTodayWidget),
  asAny(energyFlowWidget),
  asAny(alarmWidget),
  asAny(locksWidget),
  asAny(motionWidget),
  asAny(safetyWidget),
  asAny(camerasWidget),
  asAny(openingsWidget),
  asAny(mediaWidget),
  asAny(vacuumsWidget)
];

export const WIDGET_BY_ID: ReadonlyMap<string, AnyWidget> = new Map(WIDGETS.map((w) => [w.id, w]));

/** What the layout needs (id, section, sizes, default size, style ids). */
export const WIDGET_LAYOUT_INFO: readonly LayoutWidgetInfo[] = WIDGETS.map(layoutInfoOf);

/**
 * Old widget ids → new ones, for the one-time layout migration. Filled as widgets merge in
 * Phase 3 (energy 8 → 3, weather 2 → 1, openings, safety).
 */
export const LEGACY_WIDGET_IDS: Readonly<Record<string, string>> = {
  weather_hourly: 'weather',
  doors: 'openings',
  windows: 'openings',
  leak: 'safety',
  smoke: 'safety',
  power_flow: 'energy_now',
  power_flow_chart: 'energy_now',
  energy_usage: 'energy_today',
  energy_usage_chart: 'energy_today',
  solar_production: 'energy_today',
  solar_production_chart: 'energy_today',
  energy_gauges: 'energy_today'
};
