/**
 * Overview widget registry (rebuild, Phase 1). The page, Add widgets sheet, sheets host and tests
 * read widgets from here. Phase 3 adds the rest; Lights is the pilot.
 */
import type { LayoutWidgetInfo } from '../lib/overviewLayout';
import { lightsWidget } from './lights';
import type { WidgetDefinition } from './types';

// Each entry keeps its own model type; the registry only needs the shared shape.
// Safe: a definition is only ever used through its own useModel → Body/Sheet pair.
type AnyWidget = WidgetDefinition<never>;
const asAny = <M,>(w: WidgetDefinition<M>) => w as unknown as AnyWidget;

export const WIDGETS: readonly AnyWidget[] = [asAny(lightsWidget)];

export const WIDGET_BY_ID: ReadonlyMap<string, AnyWidget> = new Map(WIDGETS.map((w) => [w.id, w]));

/** What the layout needs (id, section, sizes, default size). */
export const WIDGET_LAYOUT_INFO: readonly LayoutWidgetInfo[] = WIDGETS.map(({ id, section, sizes, defaultSize }) => ({ id, section, sizes, defaultSize }));

/**
 * Old widget ids → new ones, for the one-time layout migration. Filled as widgets merge in
 * Phase 3 (energy 8 → 3, weather 2 → 1, openings, safety).
 */
export const LEGACY_WIDGET_IDS: Readonly<Record<string, string>> = {};
