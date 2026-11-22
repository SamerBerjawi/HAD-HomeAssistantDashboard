/**
 * Widget contract for the Overview rebuild (docs/pro-ui/OVERVIEW_REBUILD.md, Phase 0 draft).
 * Each widget is one folder under `src/pro/widgets/<id>/` exporting a `WidgetDefinition`.
 * Phase 1 adds the registry and the first real widgets; the spike page uses dummy ones.
 */
import type { ComponentType, LazyExoticComponent } from 'react';
import type { IconSvgElement } from '@hugeicons/react';
import type { LayoutWidgetInfo, WidgetSize } from '../lib/overviewLayout';
import type { OverviewSectionId } from '../lib/overviewSections';
import type { DesignedWidgetProps } from './shared/WidgetSurface';

export interface WidgetAttention {
  /** Short pill text, e.g. "Back door open". */
  label: string;
  tone: 'warning' | 'danger';
}

export interface WidgetBodyProps<Model> {
  model: Model;
  size: WidgetSize;
}

export interface WidgetSheetProps<Model> {
  model: Model;
  /** Extra id from the URL, e.g. the camera for `?sheet=cameras&id=camera.porch`. */
  itemId?: string;
  onClose: () => void;
}

/**
 * One look a widget can wear (WIDGET_DESIGN.md: styles the user picks per widget). A designed
 * widget owns its whole card: background, composition and the corner "open details" button.
 */
export interface WidgetDesign<Model> {
  id: string;
  name: string;
  /** One line for the style picker. */
  description: string;
  Body: ComponentType<DesignedWidgetProps<Model>>;
}

export interface WidgetDefinition<Model> extends Omit<LayoutWidgetInfo, 'designIds'> {
  title: string;
  icon: IconSvgElement;
  section: OverviewSectionId;
  sizes: readonly WidgetSize[];
  defaultSize: WidgetSize;
  /** Subscribes only to the entities this widget needs. */
  useModel: () => Model;
  /** Card content for one size, under the shared header. Not used when `designs` is set. */
  Body?: ComponentType<WidgetBodyProps<Model>>;
  /** Details sheet, lazy loaded. */
  Sheet?: LazyExoticComponent<ComponentType<WidgetSheetProps<Model>>>;
  /** Header subtitle, e.g. "3 of 10 on". */
  subtitle?: (model: Model) => string | undefined;
  /**
   * The number on the section's tab ("Lights 8"): lights on, people home, doors open… The page
   * adds up the widgets in a section (Phase 4). Omitted or 0 = no number.
   */
  count?: (model: Model) => number;
  /** A status pill when something needs attention, else null. */
  attention?: (model: Model) => WidgetAttention | null;
  /** Styles the user can pick from; the card then draws no header of its own. */
  designs?: readonly WidgetDesign<Model>[];
  /** Style used until the user picks one (defaults to the first). */
  defaultDesign?: string;
  /** Demo/test model. */
  fixture: Model;
}

/** The design to draw: the stored choice if the widget still offers it, else its default. */
export function resolveDesign<Model>(widget: WidgetDefinition<Model>, stored?: string): WidgetDesign<Model> | undefined {
  const designs = widget.designs;
  if (!designs || designs.length === 0) return undefined;
  return designs.find((d) => d.id === stored) ?? designs.find((d) => d.id === widget.defaultDesign) ?? designs[0];
}

/** What the layout needs to know about a widget. */
export function layoutInfoOf<Model>(widget: WidgetDefinition<Model>): LayoutWidgetInfo {
  const { id, section, sizes, defaultSize, designs } = widget;
  return designs && designs.length > 0 ? { id, section, sizes, defaultSize, designIds: designs.map((d) => d.id) } : { id, section, sizes, defaultSize };
}

export function defineWidget<Model>(definition: WidgetDefinition<Model>): WidgetDefinition<Model> {
  return definition;
}
