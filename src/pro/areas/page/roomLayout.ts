/**
 * The Area page's layout (batch 6 + Phase 0 + Phase 2.3/2.4):
 * Which section a tile sits in, order inside each section, custom sections, cross-section moves,
 * tile sizes, hidden/collapsed/pinned lists, and editable Scenes/Readings rail order.
 */
import type { TileModel, TileSize } from '../tileTypes';
import { normalizeRulesMap, type VisibilityRuleSet } from '../../lib/visibilityRules';

export type BuiltInSectionId = 'scenes' | 'lights' | 'air' | 'climate' | 'media' | 'security' | 'machines' | 'power';
export type SectionId = BuiltInSectionId | (string & {});
export type Device = 'phone' | 'wide';
export type AreaDevice = 'phone' | 'tablet' | 'desktop';
export type AnyDevice = AreaDevice | Device;

export interface CustomRoomSection {
  id: string;
  title: string;
}

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
} as Record<SectionId, string>;

/** Where a kind of tile belongs by default. */
export function sectionOf(kind: TileModel['kind']): BuiltInSectionId {
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
  /** User-created custom sections (`custom:*`). */
  customSections?: CustomRoomSection[];
  /** Built-in tiles moved to a different section (`key -> sectionId`). */
  sectionOverrides?: Record<string, SectionId>;
  /** User-defined order of Scenes in the Room Rail. */
  railScenesOrder?: string[];
  /** User-defined order of Readings in the Room Rail. */
  railReadingsOrder?: string[];
  /** Declarative conditional visibility rules per section and tile key. */
  sectionRules?: Record<string, VisibilityRuleSet>;
  cardRules?: Record<string, VisibilityRuleSet>;
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

export function isCustomRoomSection(l: RoomLayout, id: SectionId): boolean {
  return Boolean(l.customSections?.some((c) => c.id === id));
}

export function roomSectionTitle(l: RoomLayout, id: SectionId): string {
  const custom = l.customSections?.find((c) => c.id === id);
  if (custom) return custom.title;
  return SECTION_TITLE[id as BuiltInSectionId] ?? String(id);
}

const sectionKeyOf = (l: RoomLayout, key: string) => (Object.keys(l.order) as SectionId[]).find((s) => l.order[s]?.includes(key));

/** Drag: put `key` where `over` is inside one section. */
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

export function editableRoomSections(l: RoomLayout): { id: SectionId; keys: string[] }[] {
  return l.sectionOrder
    .map((id) => ({ id, keys: (l.order[id] ?? []).filter((k) => !l.hidden.includes(k)) }))
    .filter((s) => s.keys.length > 0 || isCustomRoomSection(l, s.id));
}

export function moveSection(l: RoomLayout, s: SectionId, dir: -1 | 1): RoomLayout {
  const shown = editableRoomSections(l).map((x) => x.id);
  const target = shown[shown.indexOf(s) + dir];
  if (!target) return l;
  const list = [...l.sectionOrder];
  const i = list.indexOf(s);
  const j = list.indexOf(target);
  [list[i], list[j]] = [list[j], list[i]];
  return { ...l, sectionOrder: list };
}

export function createRoomSection(l: RoomLayout, title: string): { layout: RoomLayout; id: string } {
  const clean = title.trim() || 'Custom';
  const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'section';
  const existing = new Set((l.customSections ?? []).map((c) => c.id));
  let id = `custom:${slug}`;
  let suffix = 2;
  while (existing.has(id)) id = `custom:${slug}_${suffix++}`;
  return {
    id,
    layout: {
      ...l,
      customSections: [...(l.customSections ?? []), { id, title: clean }],
      sectionOrder: [id, ...l.sectionOrder],
      order: { ...l.order, [id]: [] }
    }
  };
}

export function renameRoomSection(l: RoomLayout, id: SectionId, title: string): RoomLayout {
  const clean = title.trim();
  if (!clean || !l.customSections?.some((c) => c.id === id)) return l;
  return {
    ...l,
    customSections: l.customSections.map((c) => (c.id === id ? { ...c, title: clean } : c))
  };
}

export function deleteRoomSection(l: RoomLayout, id: SectionId, items: readonly RoomItem[]): RoomLayout {
  if (!isCustomRoomSection(l, id)) return l;
  const byKey = new Map(items.map((it) => [it.key, it]));
  const displaced = (l.order[id] ?? []).filter((k) => byKey.has(k));
  const nextOrder: RoomLayout['order'] = { ...l.order };
  delete nextOrder[id];
  const nextOverrides = { ...(l.sectionOverrides ?? {}) };
  let nextSectionOrder = l.sectionOrder.filter((s) => s !== id);
  for (const k of displaced) {
    delete nextOverrides[k];
    const home = byKey.get(k)!.section;
    nextOrder[home] = [...(nextOrder[home] ?? []).filter((x) => x !== k), k];
    if (!nextSectionOrder.includes(home)) nextSectionOrder = [...nextSectionOrder, home];
  }
  const nextSecRules = { ...(l.sectionRules ?? {}) };
  delete nextSecRules[id];
  const nextCustom = (l.customSections ?? []).filter((c) => c.id !== id);
  const { customSections: _c, sectionOverrides: _o, sectionRules: _r, ...base } = l;
  return {
    ...base,
    ...(nextCustom.length > 0 ? { customSections: nextCustom } : {}),
    sectionOrder: nextSectionOrder,
    order: nextOrder,
    collapsed: l.collapsed.filter((s) => s !== id),
    ...(Object.keys(nextOverrides).length > 0 ? { sectionOverrides: nextOverrides } : {}),
    ...(Object.keys(nextSecRules).length > 0 ? { sectionRules: nextSecRules } : {})
  };
}

export function moveTileToSection(l: RoomLayout, key: string, targetSection: SectionId, items?: readonly RoomItem[]): RoomLayout {
  const current = sectionKeyOf(l, key);
  if (!current || current === targetSection) return l;
  const nextOrder: RoomLayout['order'] = { ...l.order };
  nextOrder[current] = (nextOrder[current] ?? []).filter((k) => k !== key);
  nextOrder[targetSection] = [...(nextOrder[targetSection] ?? []).filter((k) => k !== key), key];
  const nextSectionOrder = l.sectionOrder.includes(targetSection) ? l.sectionOrder : [...l.sectionOrder, targetSection];
  const nextOverrides = { ...(l.sectionOverrides ?? {}) };
  const home = items?.find((it) => it.key === key)?.section;
  if (home && home === targetSection) delete nextOverrides[key];
  else nextOverrides[key] = targetSection;
  return {
    ...l,
    sectionOrder: nextSectionOrder,
    order: nextOrder,
    sectionOverrides: Object.keys(nextOverrides).length > 0 ? nextOverrides : undefined
  };
}

export function applyRailOrder(keys: readonly string[], savedOrder?: readonly string[]): string[] {
  if (!savedOrder || savedOrder.length === 0) return [...keys];
  const keySet = new Set(keys);
  const kept = savedOrder.filter((k, i) => keySet.has(k) && savedOrder.indexOf(k) === i);
  const rest = keys.filter((k) => !kept.includes(k));
  return [...kept, ...rest];
}

export function reorderRailList(keys: readonly string[], savedOrder: readonly string[] | undefined, key: string, dir: -1 | 1): string[] {
  const ordered = applyRailOrder(keys, savedOrder);
  const i = ordered.indexOf(key);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= ordered.length) return ordered;
  const next = [...ordered];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** The sections to draw, in order, each with its visible tiles; empty sections drop out. */
export function visibleSections(l: RoomLayout): { id: SectionId; keys: string[] }[] {
  return l.sectionOrder.map((id) => ({ id, keys: (l.order[id] ?? []).filter((k) => !l.hidden.includes(k)) })).filter((s) => s.keys.length > 0);
}

/** Every visible tile in page order (one grid, no headings: concept B's narrow screens, D). */
export const flatOrder = (l: RoomLayout) => visibleSections(l).flatMap((s) => s.keys);

export const isDirty = (a: RoomLayout, b: RoomLayout) => JSON.stringify(a) !== JSON.stringify(b);

/**
 * A saved layout fitted to the room as it is now: drops absent tiles, appends new tiles to their
 * section, preserves custom sections, cross-section overrides, and rail orders.
 */
export function reconcile(saved: RoomLayout | null | undefined, items: readonly RoomItem[], device: AnyDevice): RoomLayout {
  const fresh = defaultLayout(items, device);
  if (!saved || typeof saved !== 'object') return fresh;
  const here = new Map(items.map((it) => [it.key, it]));

  const customSections: CustomRoomSection[] = [];
  const customIds = new Set<string>();
  if (Array.isArray(saved.customSections)) {
    for (const c of saved.customSections) {
      if (!c || typeof c !== 'object' || typeof c.id !== 'string' || !c.id.startsWith('custom:') || customIds.has(c.id)) continue;
      const title = typeof c.title === 'string' ? c.title.trim() : '';
      if (!title) continue;
      customIds.add(c.id);
      customSections.push({ id: c.id, title });
    }
  }
  const validSectionIds = new Set<string>([...SECTION_ORDER, ...customIds]);

  const sectionOverrides: Record<string, SectionId> = {};
  if (saved.sectionOverrides && typeof saved.sectionOverrides === 'object' && !Array.isArray(saved.sectionOverrides)) {
    for (const [k, target] of Object.entries(saved.sectionOverrides)) {
      if (typeof target === 'string' && here.has(k) && validSectionIds.has(target)) {
        sectionOverrides[k] = target;
      }
    }
  }
  const effectiveSectionOf = (it: RoomItem): SectionId => sectionOverrides[it.key] ?? it.section;

  const order: RoomLayout['order'] = {};
  const allTargetSections = new Set<SectionId>([
    ...(Object.keys(fresh.order) as SectionId[]),
    ...items.map(effectiveSectionOf),
    ...customIds
  ]);

  for (const s of allTargetSections) {
    const expectedKeys = new Set(items.filter((it) => effectiveSectionOf(it) === s).map((it) => it.key));
    const kept = (Array.isArray(saved.order?.[s]) ? saved.order[s]! : []).filter((k) => expectedKeys.has(k));
    const added = items.filter((it) => effectiveSectionOf(it) === s && !kept.includes(it.key)).map((it) => it.key);
    if (kept.length + added.length > 0 || customIds.has(s)) {
      order[s] = [...kept, ...added];
    }
  }

  const present = new Set(Object.keys(order) as SectionId[]);
  const savedOrder = (Array.isArray(saved.sectionOrder) ? saved.sectionOrder : []).filter((s) => present.has(s));
  const sectionOrder = [...savedOrder];
  for (const s of SECTION_ORDER) {
    if (!present.has(s) || sectionOrder.includes(s)) continue;
    const after = SECTION_ORDER.slice(SECTION_ORDER.indexOf(s) + 1).find((x) => sectionOrder.includes(x));
    sectionOrder.splice(after ? sectionOrder.indexOf(after) : sectionOrder.length, 0, s);
  }
  for (const c of customSections) {
    if (!sectionOrder.includes(c.id)) sectionOrder.push(c.id);
  }

  const sizes: Record<string, TileSize> = {};
  for (const it of items) sizes[it.key] = isSize(saved.sizes?.[it.key]) ? saved.sizes[it.key] : fresh.sizes[it.key];
  const keep = (list: unknown) => (Array.isArray(list) ? list.filter((k): k is string => typeof k === 'string' && here.has(k)) : []);
  const placed = new Set(Object.values(saved.order ?? {}).flatMap((l) => (Array.isArray(l) ? l : [])));
  const railScenesOrder = Array.isArray(saved.railScenesOrder) ? keep(saved.railScenesOrder) : undefined;
  const railReadingsOrder = Array.isArray(saved.railReadingsOrder) ? keep(saved.railReadingsOrder) : undefined;
  const sectionRules = normalizeRulesMap(saved.sectionRules, (sid) => validSectionIds.has(sid));
  const cardRules = normalizeRulesMap(saved.cardRules, (k) => here.has(k));

  return {
    sectionOrder,
    order,
    sizes,
    hidden: [...keep(saved.hidden), ...items.filter((it) => it.hidden && !placed.has(it.key)).map((it) => it.key)],
    pinned: keep(saved.pinned),
    collapsed: Array.isArray(saved.collapsed) ? saved.collapsed.filter((s): s is SectionId => validSectionIds.has(s)) : fresh.collapsed,
    ...(customSections.length > 0 ? { customSections } : {}),
    ...(Object.keys(sectionOverrides).length > 0 ? { sectionOverrides } : {}),
    ...(railScenesOrder && railScenesOrder.length > 0 ? { railScenesOrder } : {}),
    ...(railReadingsOrder && railReadingsOrder.length > 0 ? { railReadingsOrder } : {}),
    ...(sectionRules ? { sectionRules } : {}),
    ...(cardRules ? { cardRules } : {})
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
  if (device === 'tablet' || device === 'desktop') {
    return areaObj.wide ?? null;
  }
  return null;
}

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

/** Applies one room's section order, custom sections, and collapsed state onto another room's items. */
export function copyLayoutPatternToRoom(source: RoomLayout, targetItems: readonly RoomItem[], targetDevice: AnyDevice): RoomLayout {
  const base = defaultLayout(targetItems, targetDevice);
  const template: RoomLayout = {
    ...base,
    sectionOrder: [...source.sectionOrder],
    collapsed: [...source.collapsed],
    ...(source.customSections ? { customSections: structuredClone(source.customSections) } : {})
  };
  return reconcile(template, targetItems, targetDevice);
}
