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
import { DEFAULT_OVERVIEW_SECTION_ORDER, OVERVIEW_SECTION_LABELS, type OverviewSectionId } from './overviewSections';

export type WidgetSize = 's' | 'w' | 't' | 'l';
export type DeviceType = 'phone' | 'tablet' | 'desktop';
export type AnyOverviewSectionId = OverviewSectionId | (string & {});
export type SectionTabVisibility = 'all_and_tab' | 'tab_only' | 'hidden';

export interface CustomOverviewSection {
  id: string;
  title: string;
  icon?: string;
}

export interface OverviewHeaderPrefs {
  showAttentionPills?: boolean;
  showTabs?: boolean;
  defaultTab?: string;
}

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
  sectionOrder: AnyOverviewSectionId[];
  collapsed: AnyOverviewSectionId[];
  hidden: string[];
  items: Partial<Record<AnyOverviewSectionId, LayoutPlacement[]>>;
  /** Chosen style per widget id, for widgets that offer several (absent = the widget's default). */
  styles?: Record<string, string>;
  /** User-created custom sections (`custom:*`). */
  customSections?: CustomOverviewSection[];
  /** Built-in widgets reassigned to a different section (`widgetId -> sectionId`). */
  sectionOverrides?: Record<string, AnyOverviewSectionId>;
  /** Per-section Overview / Tab visibility (`all_and_tab` default, `tab_only`, or `hidden`). */
  sectionVisibility?: Record<string, SectionTabVisibility>;
  /** Overview header & tab configuration. */
  header?: OverviewHeaderPrefs;
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
  /** Style ids the widget offers (WIDGET_DESIGN.md); none = one fixed look. */
  designIds?: readonly string[];
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
  return (
    allowed.find((size) => {
      const c = cellsFor(size, cols);
      return c.w === w && c.h === h;
    }) ?? null
  );
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

/**
 * Flow placement (owner decision 2026-11-19): widgets keep their reading order. Each one goes in
 * the first free spot at or after the previous widget's spot, like CSS grid without `dense`.
 * Never overlaps, whatever the sizes (react-grid-layout's wrapCompactor overlaps mixed sizes).
 */
export function flowCells(items: readonly { i: string; w: number; h: number }[], cols: number): { i: string; x: number; y: number }[] {
  const taken: boolean[][] = [];
  const free = (x: number, y: number, w: number, h: number) => {
    if (x + w > cols) return false;
    for (let r = y; r < y + h; r++) for (let c = x; c < x + w; c++) if (taken[r]?.[c]) return false;
    return true;
  };
  let cursorY = 0;
  let cursorX = 0;
  const out: { i: string; x: number; y: number }[] = [];
  for (const item of items) {
    const w = Math.min(item.w, cols);
    let x = cursorX;
    let y = cursorY;
    while (!free(x, y, w, item.h)) {
      x += 1;
      if (x + w > cols) {
        x = 0;
        y += 1;
      }
    }
    for (let r = y; r < y + item.h; r++) {
      taken[r] = taken[r] ?? [];
      for (let c = x; c < x + w; c++) taken[r][c] = true;
    }
    out.push({ i: item.i, x, y });
    cursorX = x + w;
    cursorY = y;
  }
  return out;
}

/** Flow placement for sized widgets, in the given order. */
export function flowPlacements(items: readonly { i: string; size: WidgetSize }[], cols: number): LayoutPlacement[] {
  const cells = flowCells(
    items.map((it) => ({ i: it.i, ...cellsFor(it.size, cols) })),
    cols
  );
  return items.map((it, idx) => ({ i: it.i, x: cells[idx].x, y: cells[idx].y, size: it.size }));
}

/** Reading order of placed widgets (top to bottom, left to right). */
export function readingOrder<T extends { x: number; y: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.y - b.y || a.x - b.x);
}

/**
 * Free placement (owner, 2026-11-20, replaces strict Flow for edits): a widget stays in the cell it
 * was put in, so a row can be left part empty and a widget can start a new row. Widgets keep their
 * x and y; one that would overlap moves straight down to the first free spot (`firstId`, the one
 * being dragged, resized or added, is placed first, so the others make room for it). Rows with
 * nothing in them close up, so the page never shows a blank row.
 */
export function settleCells<T extends { i: string; x: number; y: number; w: number; h: number }>(items: readonly T[], cols: number, firstId?: string): T[] {
  const taken: boolean[][] = [];
  const free = (x: number, y: number, w: number, h: number) => {
    for (let r = y; r < y + h; r++) for (let c = x; c < x + w; c++) if (taken[r]?.[c]) return false;
    return true;
  };
  const order = readingOrder(items);
  const first = order.findIndex((it) => it.i === firstId);
  if (first > 0) order.unshift(...order.splice(first, 1));
  const placed = new Map<string, { x: number; y: number }>();
  for (const it of order) {
    const w = Math.max(1, Math.min(it.w, cols));
    const x = Math.max(0, Math.min(Number.isFinite(it.x) ? Math.round(it.x) : 0, cols - w));
    let y = Math.max(0, Number.isFinite(it.y) ? Math.round(it.y) : 0);
    while (!free(x, y, w, it.h)) y += 1;
    for (let r = y; r < y + it.h; r++) {
      taken[r] = taken[r] ?? [];
      for (let c = x; c < x + w; c++) taken[r][c] = true;
    }
    placed.set(it.i, { x, y });
  }
  // Close up empty rows: each widget moves up by the empty rows above it.
  const emptyAbove: number[] = [];
  let empty = 0;
  for (let r = 0; r < taken.length; r++) {
    emptyAbove[r] = empty;
    if (!taken[r]?.some(Boolean)) empty += 1;
  }
  return items.map((it) => {
    const p = placed.get(it.i) ?? { x: 0, y: 0 };
    return { ...it, x: p.x, y: p.y - (emptyAbove[p.y] ?? 0) };
  });
}

/** Free placement for sized widgets (see `settleCells`). */
export function settlePlacements(items: readonly LayoutPlacement[], cols: number, firstId?: string): LayoutPlacement[] {
  const cells = settleCells(
    items.map((p) => ({ ...p, ...cellsFor(p.size, cols) })),
    cols,
    firstId
  );
  return cells.map(({ i, x, y, size }) => ({ i, x, y, size }));
}

/** The first row below every widget. */
const bottomRow = (placements: readonly LayoutPlacement[], cols: number) => placements.reduce((max, p) => Math.max(max, p.y + cellsFor(p.size, cols).h), 0);

/**
 * Moves one widget a step earlier (-1) or later (+1) in reading order (the card menu, for touch
 * and keyboard): it trades places with its neighbour, and the rest make room.
 */
export function moveInFlow(placements: readonly LayoutPlacement[], id: string, dir: -1 | 1, cols: number): LayoutPlacement[] {
  const order = readingOrder(placements);
  const from = order.findIndex((p) => p.i === id);
  const to = from + dir;
  if (from < 0 || to < 0 || to >= order.length) return [...placements];
  const a = order[from];
  const b = order[to];
  const swapped = placements.map((p) => (p.i === a.i ? { ...p, x: b.x, y: b.y } : p.i === b.i ? { ...p, x: a.x, y: a.y } : p));
  return settlePlacements(swapped, cols, id);
}

/** Changes one widget's size where it is; widgets it now covers move down. */
export function resizeInFlow(placements: readonly LayoutPlacement[], id: string, size: WidgetSize, cols: number): LayoutPlacement[] {
  return settlePlacements(
    placements.map((p) => (p.i === id ? { ...p, size } : p)),
    cols,
    id
  );
}

/** Adds a widget on a new row at the bottom of a section. */
export function appendToFlow(placements: readonly LayoutPlacement[], id: string, size: WidgetSize, cols: number): LayoutPlacement[] {
  const rest = placements.filter((p) => p.i !== id);
  return settlePlacements([...rest, { i: id, x: 0, y: bottomRow(rest, cols), size }], cols);
}

/** Registry defaults for one device type: default sizes, widgets in registry order per section. */
export function buildDefaultDeviceLayout(widgets: readonly LayoutWidgetInfo[], device: DeviceType): DeviceLayout {
  const cols = DEVICE_COLUMNS[device];
  const items: DeviceLayout['items'] = {};
  for (const section of DEFAULT_OVERVIEW_SECTION_ORDER) {
    const list = widgets.filter((w) => w.section === section).map((w) => ({ i: w.id, size: w.defaultSize }));
    if (list.length > 0) items[section] = flowPlacements(list, cols);
  }
  return { sectionOrder: [...DEFAULT_OVERVIEW_SECTION_ORDER], collapsed: [], hidden: [], items };
}

/**
 * Makes a stored layout safe to use with the current registry: drops unknown widgets and sizes a
 * widget no longer allows, adds new widgets on a new row at the end of their section, and fills
 * the section order. Stored config is user data, so nothing in it is trusted.
 */
const PINNED_CARD_RE = /^(entity|scene|script|room|camera):.+$/;

export function isPinnedCardId(id: string): boolean {
  return PINNED_CARD_RE.test(id);
}

export function pinnedCardAllowedSizes(id: string): readonly WidgetSize[] {
  if (id.startsWith('camera:')) return ['w', 'l'];
  if (id.startsWith('room:')) return ['s', 'w', 'l'];
  if (id.startsWith('scene:') || id.startsWith('script:')) return ['s', 'w'];
  return WIDGET_SIZES;
}

export function pinnedCardDefaultSize(id: string): WidgetSize {
  if (id.startsWith('camera:') || id.startsWith('room:')) return 'w';
  return 's';
}

export function normalizeDeviceLayout(stored: unknown, widgets: readonly LayoutWidgetInfo[], device: DeviceType): DeviceLayout {
  const fallback = buildDefaultDeviceLayout(widgets, device);
  if (!stored || typeof stored !== 'object') return fallback;
  const raw = stored as Partial<Record<keyof DeviceLayout, unknown>>;
  const cols = DEVICE_COLUMNS[device];
  const byId = new Map(widgets.map((w) => [w.id, w]));

  const customSections: CustomOverviewSection[] = [];
  const customIds = new Set<string>();
  if (Array.isArray(raw.customSections)) {
    for (const entry of raw.customSections) {
      if (!entry || typeof entry !== 'object') continue;
      const c = entry as Partial<CustomOverviewSection>;
      if (typeof c.id !== 'string' || !c.id.startsWith('custom:') || customIds.has(c.id)) continue;
      const title = typeof c.title === 'string' ? c.title.trim() : '';
      if (!title) continue;
      customIds.add(c.id);
      customSections.push(typeof c.icon === 'string' && c.icon ? { id: c.id, title, icon: c.icon } : { id: c.id, title });
    }
  }

  const sectionIds = new Set<string>([...DEFAULT_OVERVIEW_SECTION_ORDER, ...customIds]);
  const asSections = (v: unknown): AnyOverviewSectionId[] =>
    Array.isArray(v)
      ? (v.filter((s, idx) => typeof s === 'string' && sectionIds.has(s) && v.indexOf(s) === idx) as AnyOverviewSectionId[])
      : [];

  const sectionOrder = asSections(raw.sectionOrder);
  // Sections a saved order lacks go at the end, except Rooms (added 2026-11-20), which goes first
  // like on a new layout.
  const hadRooms = sectionOrder.includes('rooms');
  for (const s of DEFAULT_OVERVIEW_SECTION_ORDER) if (!sectionOrder.includes(s)) sectionOrder.push(s);
  if (!hadRooms) sectionOrder.unshift(...sectionOrder.splice(sectionOrder.indexOf('rooms'), 1));
  for (const c of customSections) if (!sectionOrder.includes(c.id)) sectionOrder.push(c.id);

  const collapsed = asSections(raw.collapsed);
  const hidden = Array.isArray(raw.hidden) ? raw.hidden.filter((id): id is string => typeof id === 'string' && byId.has(id)) : [];

  const sectionOverrides: Record<string, AnyOverviewSectionId> = {};
  if (raw.sectionOverrides && typeof raw.sectionOverrides === 'object' && !Array.isArray(raw.sectionOverrides)) {
    for (const [wid, target] of Object.entries(raw.sectionOverrides as Record<string, unknown>)) {
      if (typeof target === 'string' && byId.has(wid) && sectionIds.has(target)) {
        sectionOverrides[wid] = target;
      }
    }
  }
  const sectionForWidget = (w: LayoutWidgetInfo): AnyOverviewSectionId => sectionOverrides[w.id] ?? w.section;

  const storedItems = raw.items && typeof raw.items === 'object' ? (raw.items as Record<string, unknown>) : {};
  // Hidden widgets have no place; Add puts them back at the end of their section.
  const seen = new Set<string>(hidden);
  const items: DeviceLayout['items'] = {};
  for (const section of sectionIds) {
    const list = Array.isArray(storedItems[section]) ? (storedItems[section] as unknown[]) : [];
    const kept: LayoutPlacement[] = [];
    for (const entry of list) {
      if (!entry || typeof entry !== 'object') continue;
      const p = entry as Partial<LayoutPlacement>;
      if (typeof p.i !== 'string' || seen.has(p.i)) continue;
      if (isPinnedCardId(p.i)) {
        const allowed = pinnedCardAllowedSizes(p.i);
        const size = p.size && allowed.includes(p.size) ? p.size : pinnedCardDefaultSize(p.i);
        const w = cellsFor(size, cols).w;
        const x = Number.isInteger(p.x) && (p.x as number) >= 0 ? Math.min(p.x as number, cols - w) : 0;
        const y = Number.isInteger(p.y) && (p.y as number) >= 0 ? (p.y as number) : 0;
        kept.push({ i: p.i, x, y, size });
        seen.add(p.i);
        continue;
      }
      const def = byId.get(p.i);
      if (!def || sectionForWidget(def) !== section) continue;
      const size = p.size && def.sizes.includes(p.size) ? p.size : def.defaultSize;
      const w = cellsFor(size, cols).w;
      const x = Number.isInteger(p.x) && (p.x as number) >= 0 ? Math.min(p.x as number, cols - w) : 0;
      const y = Number.isInteger(p.y) && (p.y as number) >= 0 ? (p.y as number) : 0;
      kept.push({ i: def.id, x, y, size });
      seen.add(def.id);
    }
    const missing = widgets.filter((w) => sectionForWidget(w) === section && !seen.has(w.id));
    for (const w of missing) seen.add(w.id);
    // Widgets keep their cells (free placement); a tampered or stale layout is settled so it can
    // never overlap. New widgets go on a new row at the end.
    const settled = settlePlacements(kept, cols);
    const added = flowPlacements(
      missing.map((w) => ({ i: w.id, size: w.defaultSize })),
      cols
    ).map((p) => ({ ...p, y: p.y + bottomRow(settled, cols) }));
    if (settled.length + added.length > 0) items[section] = [...settled, ...added];
  }

  const styles = normalizeStyles(raw.styles, byId);
  const sectionVisibility: Record<string, SectionTabVisibility> = {};
  if (raw.sectionVisibility && typeof raw.sectionVisibility === 'object' && !Array.isArray(raw.sectionVisibility)) {
    for (const [sid, vis] of Object.entries(raw.sectionVisibility as Record<string, unknown>)) {
      if (sectionIds.has(sid) && (vis === 'all_and_tab' || vis === 'tab_only' || vis === 'hidden')) {
        sectionVisibility[sid] = vis;
      }
    }
  }
  const rawHeader = raw.header && typeof raw.header === 'object' && !Array.isArray(raw.header) ? (raw.header as Partial<OverviewHeaderPrefs>) : undefined;
  const header: OverviewHeaderPrefs | undefined = rawHeader
    ? {
        ...(typeof rawHeader.showAttentionPills === 'boolean' ? { showAttentionPills: rawHeader.showAttentionPills } : {}),
        ...(typeof rawHeader.showTabs === 'boolean' ? { showTabs: rawHeader.showTabs } : {}),
        ...(typeof rawHeader.defaultTab === 'string' && rawHeader.defaultTab ? { defaultTab: rawHeader.defaultTab } : {})
      }
    : undefined;

  return {
    sectionOrder,
    collapsed,
    hidden,
    items,
    ...(styles ? { styles } : {}),
    ...(customSections.length > 0 ? { customSections } : {}),
    ...(Object.keys(sectionOverrides).length > 0 ? { sectionOverrides } : {}),
    ...(Object.keys(sectionVisibility).length > 0 ? { sectionVisibility } : {}),
    ...(header && Object.keys(header).length > 0 ? { header } : {})
  };
}

/** Keeps only styles a known widget still offers. */
function normalizeStyles(stored: unknown, byId: ReadonlyMap<string, LayoutWidgetInfo>): Record<string, string> | undefined {
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return undefined;
  const out: Record<string, string> = {};
  for (const [id, style] of Object.entries(stored as Record<string, unknown>)) {
    if (typeof style === 'string' && byId.get(id)?.designIds?.includes(style)) out[id] = style;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Old pro tile sizes → new sizes. */
const LEGACY_SIZE: Record<string, WidgetSize> = { '1x': 's', '2x': 'w', '2x2': 'l' };

/**
 * One-time migration from the current Overview keys (`overview.tileOrder`, `tileSizes`,
 * `hiddenTiles`, `preferences.proOverviewSectionOrder`). `legacyIdMap` maps old widget ids to new
 * ones (merged widgets map several old ids to one; the first one in the old order wins).
 */
export function migrateLegacyOverview(config: UserDashboardConfig, widgets: readonly LayoutWidgetInfo[], device: DeviceType, legacyIdMap: Readonly<Record<string, string>> = {}): DeviceLayout {
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
    if (list.length > 0) items[section] = flowPlacements(list, cols);
  }

  // A merged widget stays visible while any of the widgets it replaces was visible.
  const oldHidden = new Set(overview.hiddenTiles ?? []);
  const known = new Set([...(overview.tileOrder ?? []), ...oldHidden]);
  const sourcesOf = (id: string) => [...Object.keys(legacyIdMap).filter((k) => legacyIdMap[k] === id), ...(known.has(id) ? [id] : [])];
  const hidden = [...new Set([...oldHidden].map(toNew))].filter((id) => byId.has(id) && sourcesOf(id).every((src) => oldHidden.has(src)));
  const prefs = (config.preferences ?? {}) as { proOverviewSectionOrder?: unknown };
  return normalizeDeviceLayout({ sectionOrder: prefs.proOverviewSectionOrder, collapsed: [], hidden, items }, widgets, device);
}

function readStored(config: UserDashboardConfig): Partial<ProOverviewLayoutConfig> | undefined {
  const raw = (config.preferences as { proOverviewLayout?: unknown } | undefined)?.proOverviewLayout;
  return raw && typeof raw === 'object' ? (raw as Partial<ProOverviewLayoutConfig>) : undefined;
}

/** The layout for a device type: stored one if present, else migrated from the old keys. */
export function getDeviceLayout(config: UserDashboardConfig, widgets: readonly LayoutWidgetInfo[], device: DeviceType, legacyIdMap?: Readonly<Record<string, string>>): DeviceLayout {
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
    preferences: { ...(prev.preferences || {}), proOverviewLayout: next } as unknown as UserDashboardConfig['preferences']
  };
}

/** Granular patch setting one device type's Overview layout without spreading unrelated config keys. */
export function deviceLayoutPatch(device: DeviceType, layout: DeviceLayout): Partial<UserDashboardConfig> {
  return {
    preferences: {
      proOverviewLayout: {
        version: 1,
        [device]: layout
      }
    }
  };
}

/** Granular patch deleting one device type's Overview layout (null marker for server deep-merge). */
export function deviceLayoutResetPatch(device: DeviceType): Partial<UserDashboardConfig> {
  return {
    preferences: {
      proOverviewLayout: {
        [device]: null
      }
    }
  };
}

/** Adapts an existing device layout to another device class (clamping widths & settling placements). */
export function copyDeviceLayout(source: DeviceLayout, widgets: readonly LayoutWidgetInfo[], targetDevice: DeviceType): DeviceLayout {
  return normalizeDeviceLayout(structuredClone(source), widgets, targetDevice);
}

/** Sets one widget's style on this device type's layout (the page saves it with the rest). */
export function withWidgetStyle(layout: DeviceLayout, widgetId: string, style: string): DeviceLayout {
  return { ...layout, styles: { ...(layout.styles ?? {}), [widgetId]: style } };
}

/** Drops one device type's layout so it falls back to the defaults. */
export function withoutDeviceLayout(prev: UserDashboardConfig, device: DeviceType): UserDashboardConfig {
  const current = readStored(prev);
  if (!current?.[device]) return prev;
  const next: ProOverviewLayoutConfig = { ...current, version: 1 };
  delete next[device];
  return {
    ...prev,
    preferences: { ...(prev.preferences || {}), proOverviewLayout: next } as unknown as UserDashboardConfig['preferences']
  };
}

/* ---------- Edit operations (pure; the page applies them to the draft) ---------- */

export interface VisibleSection {
  section: AnyOverviewSectionId;
  items: LayoutPlacement[];
}

export function isCustomOverviewSection(layout: DeviceLayout, sectionId: string): boolean {
  return Boolean(layout.customSections?.some((c) => c.id === sectionId));
}

export function sectionTitleOf(layout: DeviceLayout, sectionId: AnyOverviewSectionId): string {
  const custom = layout.customSections?.find((c) => c.id === sectionId);
  if (custom) return custom.title;
  return OVERVIEW_SECTION_LABELS[sectionId as OverviewSectionId] ?? String(sectionId);
}

export function sectionVisibilityOf(layout: DeviceLayout, sectionId: AnyOverviewSectionId): SectionTabVisibility {
  return layout.sectionVisibility?.[sectionId] ?? 'all_and_tab';
}

/** Sections in the user's order that have at least one widget on the page. */
export function visibleSections(layout: DeviceLayout): VisibleSection[] {
  return layout.sectionOrder
    .map((section) => ({ section, items: (layout.items[section] ?? []).filter((p) => !layout.hidden.includes(p.i)) }))
    .filter((s) => s.items.length > 0);
}

/** In Edit Mode: non-empty sections PLUS user-created custom sections even when empty. */
export function editableSections(layout: DeviceLayout): VisibleSection[] {
  return layout.sectionOrder
    .map((section) => ({ section, items: (layout.items[section] ?? []).filter((p) => !layout.hidden.includes(p.i)) }))
    .filter((s) => s.items.length > 0 || isCustomOverviewSection(layout, s.section));
}

export function withSectionItems(layout: DeviceLayout, section: AnyOverviewSectionId, items: LayoutPlacement[]): DeviceLayout {
  return { ...layout, items: { ...layout.items, [section]: items } };
}

/** Takes a widget off the page (the others stay put; a row left empty closes up). */
export function hideWidget(layout: DeviceLayout, widget: LayoutWidgetInfo, cols: number): DeviceLayout {
  const sec = layout.sectionOverrides?.[widget.id] ?? widget.section;
  const rest = (layout.items[sec] ?? []).filter((p) => p.i !== widget.id);
  return {
    ...withSectionItems(layout, sec, settlePlacements(rest, cols)),
    hidden: layout.hidden.includes(widget.id) ? layout.hidden : [...layout.hidden, widget.id]
  };
}

/** Puts a hidden widget back on a new row at the end of its section, at its default size. */
export function showWidget(layout: DeviceLayout, widget: LayoutWidgetInfo, cols: number): DeviceLayout {
  const sec = layout.sectionOverrides?.[widget.id] ?? widget.section;
  const items = appendToFlow(layout.items[sec] ?? [], widget.id, widget.defaultSize, cols);
  return { ...withSectionItems(layout, sec, items), hidden: layout.hidden.filter((id) => id !== widget.id) };
}

/** Moves a section up or down past the next editable/visible section. */
export function moveSection(layout: DeviceLayout, section: AnyOverviewSectionId, dir: -1 | 1): DeviceLayout {
  const shown = editableSections(layout).map((v) => v.section);
  const target = shown[shown.indexOf(section) + dir];
  if (!target) return layout;
  const order = [...layout.sectionOrder];
  const a = order.indexOf(section);
  const b = order.indexOf(target);
  [order[a], order[b]] = [order[b], order[a]];
  return { ...layout, sectionOrder: order };
}

export function toggleSectionCollapsed(layout: DeviceLayout, section: AnyOverviewSectionId): DeviceLayout {
  const collapsed = layout.collapsed.includes(section) ? layout.collapsed.filter((s) => s !== section) : [...layout.collapsed, section];
  return { ...layout, collapsed };
}

export function createOverviewSection(layout: DeviceLayout, title: string, icon?: string): { layout: DeviceLayout; id: string } {
  const clean = title.trim() || 'Custom';
  const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'section';
  const existing = new Set((layout.customSections ?? []).map((c) => c.id));
  let id = `custom:${slug}`;
  let suffix = 2;
  while (existing.has(id)) {
    id = `custom:${slug}_${suffix++}`;
  }
  const nextCustom: CustomOverviewSection = icon ? { id, title: clean, icon } : { id, title: clean };
  return {
    id,
    layout: {
      ...layout,
      customSections: [...(layout.customSections ?? []), nextCustom],
      sectionOrder: [id, ...layout.sectionOrder],
      items: { ...layout.items, [id]: [] }
    }
  };
}

export function renameOverviewSection(layout: DeviceLayout, sectionId: AnyOverviewSectionId, title: string, icon?: string): DeviceLayout {
  const clean = title.trim();
  if (!clean || !layout.customSections?.some((c) => c.id === sectionId)) return layout;
  return {
    ...layout,
    customSections: layout.customSections.map((c) => (c.id === sectionId ? { ...c, title: clean, ...(icon !== undefined ? { icon } : {}) } : c))
  };
}

export function deleteOverviewSection(layout: DeviceLayout, sectionId: AnyOverviewSectionId, widgets: readonly LayoutWidgetInfo[], cols: number): DeviceLayout {
  if (!isCustomOverviewSection(layout, sectionId)) return layout;
  const byId = new Map(widgets.map((w) => [w.id, w]));
  const itemsToReturn = (layout.items[sectionId] ?? []).filter((p) => !isPinnedCardId(p.i) && byId.has(p.i));
  const nextItems = { ...layout.items };
  delete nextItems[sectionId];
  const nextOverrides = { ...(layout.sectionOverrides ?? {}) };
  for (const p of itemsToReturn) {
    const def = byId.get(p.i)!;
    delete nextOverrides[p.i];
    nextItems[def.section] = appendToFlow(nextItems[def.section] ?? [], p.i, p.size, cols);
  }
  const nextVis = { ...(layout.sectionVisibility ?? {}) };
  delete nextVis[sectionId];
  const nextCustom = (layout.customSections ?? []).filter((c) => c.id !== sectionId);
  const { customSections: _c, sectionOverrides: _o, sectionVisibility: _v, ...base } = layout;
  return {
    ...base,
    ...(nextCustom.length > 0 ? { customSections: nextCustom } : {}),
    sectionOrder: layout.sectionOrder.filter((s) => s !== sectionId),
    collapsed: layout.collapsed.filter((s) => s !== sectionId),
    items: nextItems,
    ...(Object.keys(nextOverrides).length > 0 ? { sectionOverrides: nextOverrides } : {}),
    ...(Object.keys(nextVis).length > 0 ? { sectionVisibility: nextVis } : {})
  };
}

export function moveWidgetToSection(
  layout: DeviceLayout,
  id: string,
  fromSection: AnyOverviewSectionId,
  toSection: AnyOverviewSectionId,
  cols: number,
  widgets?: readonly LayoutWidgetInfo[]
): DeviceLayout {
  if (fromSection === toSection) return layout;
  const fromList = layout.items[fromSection] ?? [];
  const moving = fromList.find((p) => p.i === id);
  if (!moving) return layout;
  const nextFrom = settlePlacements(fromList.filter((p) => p.i !== id), cols);
  const nextTo = appendToFlow(layout.items[toSection] ?? [], id, moving.size, cols);
  const nextOverrides = { ...(layout.sectionOverrides ?? {}) };
  if (!isPinnedCardId(id)) {
    const def = widgets?.find((w) => w.id === id);
    if (def && def.section === toSection) delete nextOverrides[id];
    else nextOverrides[id] = toSection;
  }
  return {
    ...layout,
    items: { ...layout.items, [fromSection]: nextFrom, [toSection]: nextTo },
    sectionOverrides: Object.keys(nextOverrides).length > 0 ? nextOverrides : undefined
  };
}

export function allPinnedCardIds(layout: DeviceLayout): string[] {
  const out: string[] = [];
  for (const list of Object.values(layout.items)) {
    for (const p of list ?? []) {
      if (isPinnedCardId(p.i) && !out.includes(p.i)) out.push(p.i);
    }
  }
  return out;
}

export function pinCardToSection(
  layout: DeviceLayout,
  cardId: string,
  sectionId: AnyOverviewSectionId,
  cols: number,
  size?: WidgetSize
): DeviceLayout {
  if (!isPinnedCardId(cardId) || !layout.sectionOrder.includes(sectionId)) return layout;
  if (allPinnedCardIds(layout).includes(cardId)) return layout;
  const chosenSize = size ?? pinnedCardDefaultSize(cardId);
  const nextItems = appendToFlow(layout.items[sectionId] ?? [], cardId, chosenSize, cols);
  return withSectionItems(layout, sectionId, nextItems);
}

export function removePinnedCard(layout: DeviceLayout, cardId: string, sectionId: AnyOverviewSectionId, cols: number): DeviceLayout {
  const rest = (layout.items[sectionId] ?? []).filter((p) => p.i !== cardId);
  return withSectionItems(layout, sectionId, settlePlacements(rest, cols));
}

export function setSectionVisibility(layout: DeviceLayout, sectionId: AnyOverviewSectionId, visibility: SectionTabVisibility): DeviceLayout {
  const nextVis = { ...(layout.sectionVisibility ?? {}) };
  if (visibility === 'all_and_tab') delete nextVis[sectionId];
  else nextVis[sectionId] = visibility;
  return { ...layout, sectionVisibility: Object.keys(nextVis).length > 0 ? nextVis : undefined };
}

export function updateOverviewHeader(layout: DeviceLayout, patch: Partial<OverviewHeaderPrefs>): DeviceLayout {
  const next = { ...(layout.header ?? {}), ...patch };
  return { ...layout, header: next };
}

/** Columns a section needs in view mode (side by side on wide screens); at least 2. */
export function sectionSpan(items: readonly LayoutPlacement[], cols: number): number {
  return Math.min(cols, Math.max(2, ...items.map((p) => p.x + cellsFor(p.size, cols).w)));
}
