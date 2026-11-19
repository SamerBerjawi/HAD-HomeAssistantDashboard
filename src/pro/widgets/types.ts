/**
 * Widget contract for the Overview rebuild (docs/pro-ui/OVERVIEW_REBUILD.md, Phase 0 draft).
 * Each widget is one folder under `src/pro/widgets/<id>/` exporting a `WidgetDefinition`.
 * Phase 1 adds the registry and the first real widgets; the spike page uses dummy ones.
 */
import type { ComponentType, LazyExoticComponent } from 'react';
import type { IconSvgElement } from '@hugeicons/react';
import type { LayoutWidgetInfo, WidgetSize } from '../lib/overviewLayout';
import type { OverviewSectionId } from '../lib/overviewSections';

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

export interface WidgetDefinition<Model> extends LayoutWidgetInfo {
  title: string;
  icon: IconSvgElement;
  section: OverviewSectionId;
  sizes: readonly WidgetSize[];
  defaultSize: WidgetSize;
  /** Subscribes only to the entities this widget needs. */
  useModel: () => Model;
  /** Card content for one size. Holds controls only; the card header opens the sheet. */
  Body: ComponentType<WidgetBodyProps<Model>>;
  /** Details sheet, lazy loaded. */
  Sheet?: LazyExoticComponent<ComponentType<WidgetSheetProps<Model>>>;
  /** Header subtitle, e.g. "3 of 10 on". */
  subtitle?: (model: Model) => string | undefined;
  /** A status pill when something needs attention, else null. */
  attention?: (model: Model) => WidgetAttention | null;
  /** Demo/test model. */
  fixture: Model;
}

export function defineWidget<Model>(definition: WidgetDefinition<Model>): WidgetDefinition<Model> {
  return definition;
}
