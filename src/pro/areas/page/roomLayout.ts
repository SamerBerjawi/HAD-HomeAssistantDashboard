/**
 * The Area page's layout (batch 6): which section a tile sits in, the order inside each section,
 * each tile's size, what is hidden, collapsed or pinned. One layout per device class (phone, wide),
 * like the Overview's per-device layouts. Pure: the page keeps a draft of it while editing and
 * writes it once on Save. A tile never moves between sections (Overview rule).
 */
import type { TileModel, TileSize } from '../tileTypes';

export type SectionId = 'scenes' | 'lights' | 'air' | 'climate' | 'media' | 'security' | 'machines' | 'power';
export type Device = 'phone' | 'wide';
export type AreaDevice = 'phone' | 'tablet' | 'desktop';
export type AnyDevice = AreaDevice | Device;

export const SECTION_ORDER: readonly SectionId[] = ['scenes', 'lights', 'climate', 'air', 'media', 'security', 'machines', 'power'];
export const SECTION_TITLE: Record<SectionId, string> = {
  scenes: 'Scenes',
  lights: 'Lights',
  climate: 'Climate',
  air: 'Air',
  media: 'Media',
  security: 'Security',
  machines: 'Machines',
  power: 'Power'
};

/** Where a kind of tile belongs. */
export function sectionOf(kind: TileModel['kind']): SectionId {
  switch (kind) {
    case 'scene':
      return 'scenes';
    case 'light':
      return 'lights';
    case 'fan':
      return 'air';
    case 'climate':
    case 'cover':
    case 'reading':
      return 'climate';
    case 'media':
      return 'media';
    case 'camera':
    case 'lock':
    case 'opening':
    case 'motion':
    case 'safety':
      return 'security';
    case 'vacuum':
    case 'car':
      return 'machines';
    default:
      return 'power';
  }
}

/** A tile on the page: its key (entity id, plus the car's entity for car tiles) and default sizes. */
export interface RoomItem {
  key: string;
  section: SectionId;
  size: Record<Device, TileSize>;
  /** Starts in the Hidden tray (one of a car's less used entities): there to add, not shown. */
  hidden?: boolean;
}

export interface RoomLayout {
  sectionOrder: SectionId[];
  order: Partial<Record<SectionId, string[]>>;
  sizes: Record<string, TileSize>;
  hidden: string[];
  collapsed: SectionId[];
  /** Concept C: tiles kept at the top whatever their state. */
  pinned: string[];
}

export function itemDefaultSize(item: RoomItem, device: AnyDevice): TileSize {
  return device === 'phone' ? item.size.phone : item.size.wide;
}

export function defaultLayout(items: readonly RoomItem[], device: AnyDevice): RoomLayout {
  const order: RoomLayout['order'] = {};
  for (const it of items) (order[it.section] ??= []).push(it.key);
  return {
    sectionOrder: SECTION_ORDER.filter((s) => order[s]?.length),
    order,
    sizes: Object.fromEntries(items.map((it) => [it.key, itemDefaultSize(it, device)])),
    hidden: items.filter((it) => it.hidden).map((it) => it.key),
    collapsed: [],
    pinned: []
  };
}

const sectionKeyOf = (l: RoomLayout, key: string) => (Object.keys(l.order) as SectionId[]).find((s) => l.order[s]?.includes(key));

/** Drag: put `key` where `over` is. Only inside one section; anything else is ignored. */
export function moveOnto(l: RoomLayout, key: string, over: string): RoomLayout {
  const s = sectionKeyOf(l, key);
  if (!s || key === over || sectionKeyOf(l, over) !== s) return l;
  const list = [...l.order[s]!];
  const from = list.indexOf(key);
  const to = list.indexOf(over);
  list.splice(from, 1);
  list.splice(to, 0, key);
  return { ...l, order: { ...l.order, [s]: list } };
}

/** Menu and keyboard: one step earlier or later among the visible tiles of its section. */
export function moveBy(l: RoomLayout, key: string, dir: -1 | 1): RoomLayout {
  const s = sectionKeyOf(l, key);
  if (!s) return l;
  const visible = l.order[s]!.filter((k) => !l.hidden.includes(k));
  const target = visible[visible.indexOf(key) + dir];
  return target ? moveOnto(l, key, target) : l;
}

export const setSize = (l: RoomLayout, key: string, size: TileSize): RoomLayout => ({ ...l, sizes: { ...l.sizes, [key]: size } });
export const hide = (l: RoomLayout, key: string): RoomLayout => (l.hidden.includes(key) ? l : { ...l, hidden: [...l.hidden, key], pinned: l.pinned.filter((k) => k !== key) });
export const show = (l: RoomLayout, key: string): RoomLayout => ({ ...l, hidden: l.hidden.filter((k) => k !== key) });
export const togglePin = (l: RoomLayout, key: string): RoomLayout => ({ ...l, pinned: l.pinned.includes(key) ? l.pinned.filter((k) => k !== key) : [...l.pinned, key] });
export const toggleCollapsed = (l: RoomLayout, s: SectionId): RoomLayout => ({ ...l, collapsed: l.collapsed.includes(s) ? l.collapsed.filter((x) => x !== s) : [...l.collapsed, s] });

export function moveSection(l: RoomLayout, s: SectionId, dir: -1 | 1): RoomLayout {
  const list = [...l.sectionOrder];
  const i = list.indexOf(s);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return l;
  [list[i], list[j]] = [list[j], list[i]];
  return { ...l, sectionOrder: list };
}

/** The sections to draw, in order, each with its visible tiles; empty sections drop out. */
export function visibleSections(l: RoomLayout): { id: SectionId; keys: string[] }[] {
  return l.sectionOrder.map((id) => ({ id, keys: (l.order[id] ?? []).filter((k) => !l.hidden.includes(k)) })).filter((s) => s.keys.length > 0);
}

/** Every visible tile in page order (one grid, no headings: concept B's narrow screens, D). */
export const flatOrder = (l: RoomLayout) => visibleSections(l).flatMap((s) => s.keys);

export const isDirty = (a: RoomLayout, b: RoomLayout) => JSON.stringify(a) !== JSON.stringify(b);

/**
 * A saved layout fitted to the room as it is now: tiles that left the room drop out, new tiles go
 * to the end of their section with their default size, a new section takes its default place.
 * Anything the owner set (order, sizes, hidden, pins, folds) is kept for the tiles still here.
 */
export function reconcile(saved: RoomLayout | null | undefined, items: readonly RoomItem[], device: AnyDevice): RoomLayout {
  const fresh = defaultLayout(items, device);
  if (!saved || typeof saved !== 'object') return fresh;
  const here = new Map(items.map((it) => [it.key, it]));
  const order: RoomLayout['order'] = {};
  for (const s of Object.keys(fresh.order) as SectionId[]) {
    const kept = (Array.isArray(saved.order?.[s]) ? saved.order[s]! : []).filter((k) => here.get(k)?.section === s);
    const added = fresh.order[s]!.filter((k) => !kept.includes(k));
    order[s] = [...kept, ...added];
  }
  const present = new Set(Object.keys(order) as SectionId[]);
  const savedOrder = (Array.isArray(saved.sectionOrder) ? saved.sectionOrder : []).filter((s) => present.has(s));
  const sectionOrder = [...savedOrder];
  for (const s of fresh.sectionOrder) {
    if (sectionOrder.includes(s)) continue;
    // A new section goes before the first section that follows it by default.
    const after = SECTION_ORDER.slice(SECTION_ORDER.indexOf(s) + 1).find((x) => sectionOrder.includes(x));
    sectionOrder.splice(after ? sectionOrder.indexOf(after) : sectionOrder.length, 0, s);
  }
  const sizes: Record<string, TileSize> = {};
  for (const it of items) sizes[it.key] = isSize(saved.sizes?.[it.key]) ? saved.sizes[it.key] : fresh.sizes[it.key];
  const keep = (list: unknown) => (Array.isArray(list) ? list.filter((k): k is string => typeof k === 'string' && here.has(k)) : []);
  // New tiles that start hidden do so here too; the owner's choice wins for tiles already placed.
  const placed = new Set(Object.values(saved.order ?? {}).flatMap((l) => (Array.isArray(l) ? l : [])));
  return {
    sectionOrder,
    order,
    sizes,
    hidden: [...keep(saved.hidden), ...items.filter((it) => it.hidden && !placed.has(it.key)).map((it) => it.key)],
    pinned: keep(saved.pinned),
    collapsed: Array.isArray(saved.collapsed) ? saved.collapsed.filter((s): s is SectionId => SECTION_ORDER.includes(s as SectionId)) : fresh.collapsed
  };
}

const SIZES = new Set(['xs', 's', 'w', 't', 'l']);
const isSize = (v: unknown): v is TileSize => typeof v === 'string' && SIZES.has(v);

/** `preferences.proAreaLayouts`: per area, one layout per device class (like `proOverviewLayout`). */
export type AreaLayoutsConfig = { version: 1 } & Record<string, Partial<Record<AnyDevice, RoomLayout>> | number>;

export function readAreaLayout(preferences: unknown, areaId: string, device: AnyDevice): RoomLayout | null {
  const all = (preferences as { proAreaLayouts?: AreaLayoutsConfig } | undefined)?.proAreaLayouts;
  const area = all && typeof all === 'object' ? all[areaId] : null;
  if (!area || typeof area !== 'object') return null;
  const areaObj = area as Partial<Record<AnyDevice, RoomLayout>>;
  if (areaObj[device]) return areaObj[device] ?? null;
  // Backward-compatible fallback: legacy 'wide' layout seeds tablet/desktop if not separately saved yet
  if (device === 'tablet' || device === 'desktop') {
    return areaObj.wide ?? null;
  }
  return null;
}

/**
 * The preferences with one area's layout for one device replaced. The config's deep merge keeps
 * stale `sizes` keys of tiles that left (arrays are replaced); `reconcile` drops them on read.
 */
export function withAreaLayout<P extends Record<string, unknown> | undefined>(preferences: P, areaId: string, device: AnyDevice, layout: RoomLayout): Record<string, unknown> {
  const prefs = (preferences ?? {}) as Record<string, unknown>;
  const all = (prefs.proAreaLayouts as AreaLayoutsConfig | undefined) ?? { version: 1 };
  const area = typeof all[areaId] === 'object' ? (all[areaId] as Partial<Record<AnyDevice, RoomLayout>>) : {};
  return { ...prefs, proAreaLayouts: { ...all, version: 1, [areaId]: { ...area, [device]: layout } } };
}

/** Granular patch setting one area + device layout without spreading unrelated config keys. */
export function areaLayoutPatch(areaId: string, device: AnyDevice, layout: RoomLayout): Record<string, unknown> {
  return {
    preferences: {
      proAreaLayouts: {
        version: 1,
        [areaId]: {
          [device]: layout
        }
      }
    }
  };
}

/** Granular patch deleting one area + device layout (null marker for server deep-merge). */
export function areaLayoutResetPatch(areaId: string, device: AnyDevice): Record<string, unknown> {
  return {
    preferences: {
      proAreaLayouts: {
        [areaId]: {
          [device]: null
        }
      }
    }
  };
}

/** Adapts an existing room layout to another device class, validating tile keys and sizes. */
export function copyRoomLayout(source: RoomLayout, items: readonly RoomItem[], targetDevice: AnyDevice): RoomLayout {
  return reconcile(structuredClone(source), items, targetDevice);
}
