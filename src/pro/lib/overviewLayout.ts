/**
 * Overview layout model for the rebuild (docs/pro-ui/OVERVIEW_REBUILD.md, Phase 0). Pure, no React.
 *
 * - Widgets come in four sizes (grid cells, width × height) and each widget allows a subset.
 * - Each device type (phone, tablet, desktop) keeps its own layout: section order, collapsed
 *   sections, hidden widgets and one grid per section.
 * - Stored in `preferences.proOverviewLayout`; the classic UI's `overview.*` keys are only read,
 *   once, to migrate an existing arrangement.
 */
import type { UserDashboardConfig } from '@/types/userConfig';
import { DEFAULT_OVERVIEW_SECTION_ORDER, type OverviewSectionId } from './overviewSections';

export type WidgetSize = 's' | 'w' | 't' | 'l';
export type DeviceType = 'phone' | 'tablet' | 'desktop';

export const WIDGET_SIZES: readonly WidgetSize[] = ['s', 'w', 't', 'l'];

export const SIZE_CELLS: Record<WidgetSize, { w: number; h: number }> = {
  s: { w: 1, h: 1 },
  w: { w: 2, h: 1 },
  t: { w: 1, h: 2 },
  l: { w: 2, h: 2 }
};

export const SIZE_LABELS: Record<WidgetSize, string> = { s: 'Small', w: 'Wide', t: 'Tall', l: 'Large' };

export const DEVICE_COLUMNS: Record<DeviceType, number> = { phone: 2, tablet: 4, desktop: 6 };

export const DEVICE_TYPES: readonly DeviceType[] = ['phone', 'tablet', 'desktop'];

/** Phone below 768 px, tablet below 1280 px, desktop/wall otherwise. */
export function deviceTypeForWidth(width: number): DeviceType {
  if (width < 768) return 'phone';
  if (width < 1280) return 'tablet';
  return 'desktop';
}

export interface LayoutPlacement {
  i: string;
  x: number;
  y: number;
  size: WidgetSize;
}

export interface DeviceLayout {
  sectionOrder: OverviewSectionId[];
  collapsed: OverviewSectionId[];
  hidden: string[];
  items: Partial<Record<OverviewSectionId, LayoutPlacement[]>>;
}

export interface ProOverviewLayoutConfig {
  version: 1;
  phone?: DeviceLayout;
  tablet?: DeviceLayout;
  desktop?: DeviceLayout;
}

/** What the layout needs to know about a widget (a slice of the widget definition). */
export interface LayoutWidgetInfo {
  id: string;
  section: OverviewSectionId;
  sizes: readonly WidgetSize[];
  defaultSize: WidgetSize;
}

/** Grid cells of a size, clamped to the column count (a Wide card is full width on a 1-col grid). */
export function cellsFor(size: WidgetSize, cols: number): { w: number; h: number } {
  const c = SIZE_CELLS[size];
  return { w: Math.min(c.w, cols), h: c.h };
}

/** The allowed size closest to a proposed w × h (used while a corner is dragged). */
export function snapToAllowedSize(w: number, h: number, allowed: readonly WidgetSize[], cols: number): WidgetSize {
  const pool = allowed.length > 0 ? allowed : WIDGET_SIZES;
  let best = pool[0];
  let bestDist = Infinity;
  for (const size of pool) {
    const c = cellsFor(size, cols);
    const dist = Math.abs(c.w - w) + Math.abs(c.h - h);
    if (dist < bestDist) {
      best = size;
      bestDist = dist;
    }
  }
  return best;
}

/** The size whose cells match exactly, if any. */
export function sizeForCells(w: number, h: number, allowed: readonly WidgetSize[], cols: number): WidgetSize | null {
  return allowed.find((size) => {
    const c = cellsFor(size, cols);
    return c.w === w && c.h === h;
  }) ?? null;
}

/**
 * Places widgets in order, each in the first free spot scanning row by row (dense packing).
 * Used for defaults, migration and when a widget is added.
 */
export function packPlacements(items: readonly { i: string; size: WidgetSize }[], cols: number): LayoutPlacement[] {
  const taken: boolean[][] = [];
  const isFree = (x: number, y: number, w: number, h: number) => {
    if (x + w > cols) return false;
    for (let r = y; r < y + h; r++) for (let c = x; c < x + w; c++) if (taken[r]?.[c]) return false;
    return true;
  };
  const out: LayoutPlacement[] = [];
  for (const item of items) {
    const { w, h } = cellsFor(item.size, cols);
    let placed = false;
    for (let y = 0; !placed; y++) {
      for (let x = 0; x <= cols - w; x++) {
        if (!isFree(x, y, w, h)) continue;
        for (let r = y; r < y + h; r++) {
          taken[r] = taken[r] ?? [];
          for (let c = x; c < x + w; c++) taken[r][c] = true;
        }
        out.push({ i: item.i, x, y, size: item.size });
        placed = true;
        break;
      }
    }
  }
  return out;
}

/** Registry defaults for one device type: default sizes, widgets in registry order per section. */
export function buildDefaultDeviceLayout(widgets: readonly LayoutWidgetInfo[], device: DeviceType): DeviceLayout {
  const cols = DEVICE_COLUMNS[device];
  const items: DeviceLayout['items'] = {};
  for (const section of DEFAULT_OVERVIEW_SECTION_ORDER) {
    const list = widgets.filter((w) => w.section === section).map((w) => ({ i: w.id, size: w.defaultSize }));
    if (list.length > 0) items[section] = packPlacements(list, cols);
  }
  return { sectionOrder: [...DEFAULT_OVERVIEW_SECTION_ORDER], collapsed: [], hidden: [], items };
}

/**
 * Makes a stored layout safe to use with the current registry: drops unknown widgets and sizes a
 * widget no longer allows, adds new widgets at the end of their section, and fills the section
 * order. Stored config is user data, so nothing in it is trusted.
 */
export function normalizeDeviceLayout(stored: unknown, widgets: readonly LayoutWidgetInfo[], device: DeviceType): DeviceLayout {
  const fallback = buildDefaultDeviceLayout(widgets, device);
  if (!stored || typeof stored !== 'object') return fallback;
  const raw = stored as Partial<Record<keyof DeviceLayout, unknown>>;
  const cols = DEVICE_COLUMNS[device];
  const byId = new Map(widgets.map((w) => [w.id, w]));
  const sectionIds = new Set<string>(DEFAULT_OVERVIEW_SECTION_ORDER);
  const asSections = (v: unknown): OverviewSectionId[] =>
    Array.isArray(v) ? (v.filter((s, idx) => typeof s === 'string' && sectionIds.has(s) && v.indexOf(s) === idx) as OverviewSectionId[]) : [];

  const sectionOrder = asSections(raw.sectionOrder);
  for (const s of DEFAULT_OVERVIEW_SECTION_ORDER) if (!sectionOrder.includes(s)) sectionOrder.push(s);
  const collapsed = asSections(raw.collapsed);
  const hidden = Array.isArray(raw.hidden) ? raw.hidden.filter((id): id is string => typeof id === 'string' && byId.has(id)) : [];

  const storedItems = raw.items && typeof raw.items === 'object' ? (raw.items as Record<string, unknown>) : {};
  const seen = new Set<string>();
  const items: DeviceLayout['items'] = {};
  for (const section of DEFAULT_OVERVIEW_SECTION_ORDER) {
    const list = Array.isArray(storedItems[section]) ? (storedItems[section] as unknown[]) : [];
    const kept: LayoutPlacement[] = [];
    for (const entry of list) {
      if (!entry || typeof entry !== 'object') continue;
      const p = entry as Partial<LayoutPlacement>;
      const def = typeof p.i === 'string' ? byId.get(p.i) : undefined;
      if (!def || def.section !== section || seen.has(def.id)) continue;
      const size = p.size && def.sizes.includes(p.size) ? p.size : def.defaultSize;
      const w = cellsFor(size, cols).w;
      const x = Number.isInteger(p.x) && (p.x as number) >= 0 ? Math.min(p.x as number, cols - w) : 0;
      const y = Number.isInteger(p.y) && (p.y as number) >= 0 ? (p.y as number) : 0;
      kept.push({ i: def.id, x, y, size });
      seen.add(def.id);
    }
    const missing = widgets.filter((w) => w.section === section && !seen.has(w.id));
    if (missing.length > 0) {
      const bottom = kept.reduce((max, p) => Math.max(max, p.y + cellsFor(p.size, cols).h), 0);
      for (const p of packPlacements(missing.map((w) => ({ i: w.id, size: w.defaultSize })), cols)) {
        kept.push({ ...p, y: p.y + bottom });
        seen.add(p.i);
      }
    }
    if (kept.length > 0) items[section] = kept;
  }
  return { sectionOrder, collapsed, hidden, items };
}

/** Old pro tile sizes → new sizes. */
const LEGACY_SIZE: Record<string, WidgetSize> = { '1x': 's', '2x': 'w', '2x2': 'l' };

/**
 * One-time migration from the current Overview keys (`overview.tileOrder`, `tileSizes`,
 * `hiddenTiles`, `preferences.proOverviewSectionOrder`). `legacyIdMap` maps old widget ids to new
 * ones (merged widgets map several old ids to one; the first one in the old order wins).
 */
export function migrateLegacyOverview(
  config: UserDashboardConfig,
  widgets: readonly LayoutWidgetInfo[],
  device: DeviceType,
  legacyIdMap: Readonly<Record<string, string>> = {}
): DeviceLayout {
  const overview = config.overview ?? {};
  const toNew = (id: string) => legacyIdMap[id] ?? id;
  const byId = new Map(widgets.map((w) => [w.id, w]));
  const cols = DEVICE_COLUMNS[device];
  const sizes = (overview.tileSizes ?? {}) as Record<string, string>;

  const order: string[] = [];
  const sizeOf = new Map<string, WidgetSize>();
  for (const oldId of overview.tileOrder ?? []) {
    const id = toNew(oldId);
    const def = byId.get(id);
    if (!def || order.includes(id)) continue;
    order.push(id);
    const legacy = LEGACY_SIZE[sizes[oldId] ?? ''];
    sizeOf.set(id, legacy && def.sizes.includes(legacy) ? legacy : def.defaultSize);
  }
  for (const def of widgets) if (!order.includes(def.id)) order.push(def.id);

  const items: DeviceLayout['items'] = {};
  for (const section of DEFAULT_OVERVIEW_SECTION_ORDER) {
    const list = order
      .map((id) => byId.get(id))
      .filter((def): def is LayoutWidgetInfo => Boolean(def && def.section === section))
      .map((def) => ({ i: def.id, size: sizeOf.get(def.id) ?? def.defaultSize }));
    if (list.length > 0) items[section] = packPlacements(list, cols);
  }

  const hidden = [...new Set((overview.hiddenTiles ?? []).map(toNew))].filter((id) => byId.has(id));
  const prefs = (config.preferences ?? {}) as { proOverviewSectionOrder?: unknown };
  return normalizeDeviceLayout({ sectionOrder: prefs.proOverviewSectionOrder, collapsed: [], hidden, items }, widgets, device);
}

function readStored(config: UserDashboardConfig): Partial<ProOverviewLayoutConfig> | undefined {
  const raw = (config.preferences as { proOverviewLayout?: unknown } | undefined)?.proOverviewLayout;
  return raw && typeof raw === 'object' ? (raw as Partial<ProOverviewLayoutConfig>) : undefined;
}

/** The layout for a device type: stored one if present, else migrated from the old keys. */
export function getDeviceLayout(
  config: UserDashboardConfig,
  widgets: readonly LayoutWidgetInfo[],
  device: DeviceType,
  legacyIdMap?: Readonly<Record<string, string>>
): DeviceLayout {
  const stored = readStored(config)?.[device];
  if (stored) return normalizeDeviceLayout(stored, widgets, device);
  return migrateLegacyOverview(config, widgets, device, legacyIdMap);
}

/** Writes one device type's layout; the other device types are left as they are. */
export function withDeviceLayout(prev: UserDashboardConfig, device: DeviceType, layout: DeviceLayout): UserDashboardConfig {
  const current = readStored(prev) ?? {};
  const next: ProOverviewLayoutConfig = { ...current, version: 1, [device]: layout };
  return {
    ...prev,
    preferences: { ...(prev.preferences || {}), proOverviewLayout: next } as UserDashboardConfig['preferences']
  };
}

/** Drops one device type's layout so it falls back to the defaults. */
export function withoutDeviceLayout(prev: UserDashboardConfig, device: DeviceType): UserDashboardConfig {
  const current = readStored(prev);
  if (!current?.[device]) return prev;
  const next: ProOverviewLayoutConfig = { ...current, version: 1 };
  delete next[device];
  return {
    ...prev,
    preferences: { ...(prev.preferences || {}), proOverviewLayout: next } as UserDashboardConfig['preferences']
  };
}
