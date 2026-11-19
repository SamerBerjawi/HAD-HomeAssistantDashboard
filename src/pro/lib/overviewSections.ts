/**
 * Pure section-grouping, nested-bento span calculation, subset reordering, and corner-drag
 * resize snapping for the pro Overview page (docs/pro-ui/DESIGN.md 7.6). No React, no store.
 */
import type { UserDashboardConfig } from '@/types/userConfig';
import type { OverviewTabId } from './overviewTabs';
import {
  getProWidgetSize,
  type ProWidgetCatalogItem,
  type ProWidgetSize
} from './overviewWidgets';

export type OverviewSectionId = Exclude<OverviewTabId, 'all'>;

export const DEFAULT_OVERVIEW_SECTION_ORDER: readonly OverviewSectionId[] = [
  'climate',
  'lights',
  'switches',
  'energy',
  'security',
  'cameras',
  'openings',
  'media',
  'vacuums'
];

export const OVERVIEW_SECTION_LABELS: Record<OverviewSectionId, string> = {
  lights: 'Lights',
  switches: 'Switches',
  energy: 'Energy',
  security: 'Security',
  cameras: 'Cameras',
  climate: 'Climate',
  openings: 'Doors & windows',
  media: 'Media',
  vacuums: 'Vacuums'
};

export interface OverviewSectionGroup {
  id: OverviewSectionId;
  label: string;
  widgetIds: string[];
  outerColSpan: 1 | 2 | 4;
  outerColSpanClass: string;
  innerGridClass: string;
}

interface ProOverviewPreferences {
  proOverviewGroupBySections?: boolean;
  proOverviewSectionOrder?: OverviewSectionId[];
}

function readPreferences(config: UserDashboardConfig): ProOverviewPreferences {
  return (config.preferences as (UserDashboardConfig['preferences'] & ProOverviewPreferences) | undefined) ?? {};
}

export function getProGroupBySections(config: UserDashboardConfig): boolean {
  return Boolean(readPreferences(config).proOverviewGroupBySections);
}

export function getProSectionOrder(
  config: UserDashboardConfig
): OverviewSectionId[] | undefined {
  const raw = readPreferences(config).proOverviewSectionOrder;
  return Array.isArray(raw) ? raw : undefined;
}

export function withProGroupBySections(
  prev: UserDashboardConfig,
  enabled: boolean
): UserDashboardConfig {
  return {
    ...prev,
    preferences: {
      ...(prev.preferences || {}),
      proOverviewGroupBySections: enabled
    } as UserDashboardConfig['preferences']
  };
}

export function withProSectionOrder(
  prev: UserDashboardConfig,
  order: OverviewSectionId[]
): UserDashboardConfig {
  return {
    ...prev,
    preferences: {
      ...(prev.preferences || {}),
      proOverviewSectionOrder: order
    } as UserDashboardConfig['preferences']
  };
}

/**
 * Assigns each widget to exactly one section matching the Overview category tabs so widgets
 * never duplicate across two sections on the grouped `All` tab.
 */
export function primarySectionForWidget(widget: ProWidgetCatalogItem): OverviewSectionId {
  if (widget.tabs.includes('cameras')) return 'cameras';
  if (widget.tabs.includes('openings')) return 'openings';
  const first = widget.tabs.find((tab): tab is OverviewSectionId => tab !== 'all');
  return first ?? 'climate';
}

export function buildOverviewSections(params: {
  widgetIds: string[];
  catalog: ProWidgetCatalogItem[];
  tileSizes: Record<string, string> | undefined;
  savedSectionOrder?: OverviewSectionId[];
}): OverviewSectionGroup[] {
  const { widgetIds, catalog, tileSizes, savedSectionOrder } = params;
  const catalogMap = new Map<string, ProWidgetCatalogItem>();
  for (const item of catalog) catalogMap.set(item.id, item);

  const buckets = new Map<OverviewSectionId, string[]>();
  for (const id of widgetIds) {
    const widget = catalogMap.get(id);
    if (!widget) continue;
    const secId = primarySectionForWidget(widget);
    const list = buckets.get(secId);
    if (list) list.push(id);
    else buckets.set(secId, [id]);
  }

  const orderedIds: OverviewSectionId[] = [];
  const seen = new Set<OverviewSectionId>();
  for (const id of savedSectionOrder || []) {
    if (DEFAULT_OVERVIEW_SECTION_ORDER.includes(id) && !seen.has(id)) {
      seen.add(id);
      orderedIds.push(id);
    }
  }
  for (const id of DEFAULT_OVERVIEW_SECTION_ORDER) {
    if (!seen.has(id)) {
      seen.add(id);
      orderedIds.push(id);
    }
  }

  const groups: OverviewSectionGroup[] = [];
  for (const id of orderedIds) {
    const ids = buckets.get(id);
    if (!ids || ids.length === 0) continue;

    let totalUnits = 0;
    let maxSpan = 1;
    for (const wid of ids) {
      const size = getProWidgetSize(tileSizes, wid, catalog);
      const span = size === '1x' ? 1 : 2;
      totalUnits += span;
      if (span > maxSpan) maxSpan = span;
    }

    let outerColSpan: 1 | 2 | 4 = 4;
    let outerColSpanClass = 'col-span-1 md:col-span-2 xl:col-span-4';
    let innerGridClass = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4';

    if (ids.length === 1 && maxSpan === 1) {
      outerColSpan = 1;
      outerColSpanClass = 'col-span-1';
      innerGridClass = 'grid-cols-1 md:grid-cols-1 xl:grid-cols-1';
    } else if (totalUnits <= 2) {
      outerColSpan = 2;
      outerColSpanClass = 'col-span-1 md:col-span-2';
      innerGridClass = 'grid-cols-1 md:grid-cols-2 xl:grid-cols-2';
    }

    groups.push({
      id,
      label: OVERVIEW_SECTION_LABELS[id],
      widgetIds: ids,
      outerColSpan,
      outerColSpanClass,
      innerGridClass
    });
  }

  return groups;
}

/**
 * Replaces the relative order of `subsetIds` inside `allOrder` with `nextSubsetOrder`
 * while preserving the exact slot indices of all other widgets.
 */
export function reorderWidgetsWithinSubset(
  allOrder: string[],
  subsetIds: string[],
  nextSubsetOrder: string[]
): string[] {
  const subsetSet = new Set(subsetIds);
  let cursor = 0;
  return allOrder.map((id) => {
    if (!subsetSet.has(id)) return id;
    const replacement = nextSubsetOrder[cursor];
    cursor += 1;
    return replacement ?? id;
  });
}

const RESIZE_THRESHOLD_PX = 52;

/**
 * Snaps a bottom-right corner drag delta `(dx, dy)` from `startSize` to one of the
 * predefined widget sizes (`1x`, `2x`, `2x2`).
 */
export function resolveResizeSnapSize(
  startSize: ProWidgetSize,
  dx: number,
  dy: number
): ProWidgetSize {
  if (startSize === '1x') {
    if ((dx >= RESIZE_THRESHOLD_PX && dy >= RESIZE_THRESHOLD_PX) || dy >= RESIZE_THRESHOLD_PX * 1.45) {
      return '2x2';
    }
    if (dx >= RESIZE_THRESHOLD_PX) {
      return '2x';
    }
    return '1x';
  }

  if (startSize === '2x') {
    if (dy >= RESIZE_THRESHOLD_PX && dx > -RESIZE_THRESHOLD_PX) {
      return '2x2';
    }
    if (dx <= -RESIZE_THRESHOLD_PX && dy < RESIZE_THRESHOLD_PX) {
      return '1x';
    }
    return '2x';
  }

  // startSize === '2x2'
  if (
    (dx <= -RESIZE_THRESHOLD_PX && dy <= -RESIZE_THRESHOLD_PX) ||
    dx <= -RESIZE_THRESHOLD_PX * 1.45
  ) {
    return '1x';
  }
  if (dy <= -RESIZE_THRESHOLD_PX) {
    return '2x';
  }
  return '2x2';
}

export const PREDEFINED_WIDGET_SIZES: readonly ProWidgetSize[] = ['1x', '2x', '2x2'];
