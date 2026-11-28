/**
 * Rooms page tiles (docs/pro-ui/ROOMS.md §3, "Ambient explorer", owner 2026-11-22): which size a
 * room's tile takes, which quick actions it can offer, its ambient tone, and how mixed sizes pack
 * into gap-free rows ("bands"). Pure: no React, no store.
 */
import type { RoomItem } from './roomsPage';

export type TileSize = 'compact' | 'standard' | 'expanded';
/** What the user picked for a room (`preferences.proRooms.sizes`); "auto" follows `autoTileSize`. */
export type TileSizeChoice = TileSize | 'auto';

/** Room quick actions, in the order they are offered. */
export type QuickAction = 'lights' | 'climate' | 'media' | 'fan' | 'cover' | 'scenes';
export const QUICK_ACTIONS: readonly QuickAction[] = ['lights', 'climate', 'media', 'fan', 'cover', 'scenes'];

/** Quick actions per tile size: compact tiles carry none, so they stay calm. */
export const ACTIONS_PER_SIZE: Record<TileSize, number> = { compact: 0, standard: 2, expanded: 3 };

type ActionRoom = Pick<RoomItem, 'totalLights' | 'thermostat' | 'media' | 'fanIds' | 'coverIds' | 'scenes' | 'customQuickActions'>;

/** The quick actions a room really has (an entity behind each), most wanted first (or overridden per room). */
export function roomActions(r: ActionRoom, enabled: ReadonlySet<QuickAction> = new Set(QUICK_ACTIONS)): QuickAction[] {
  const has: Record<QuickAction, boolean> = {
    lights: r.totalLights > 0,
    climate: r.thermostat !== null,
    media: r.media !== null,
    fan: r.fanIds.length > 0,
    cover: r.coverIds.length > 0,
    scenes: r.scenes.length > 0
  };
  if (Array.isArray(r.customQuickActions)) {
    return r.customQuickActions.filter((a) => QUICK_ACTIONS.includes(a) && has[a]);
  }
  return QUICK_ACTIONS.filter((a) => has[a] && enabled.has(a));
}

type SizeRoom = ActionRoom & Pick<RoomItem, 'deviceCount' | 'isFavorite' | 'temperature' | 'humidity' | 'totalLights'>;

/**
 * Size from what the room has, never from its name. Heating alone doesn't make a room big (most
 * rooms have a radiator valve): the controls that count are lights, media, fans and covers.
 * - compact: none of those, or a single light and nothing else;
 * - expanded: media with lights, three or more kinds, or a favourite with two;
 * - standard: the rest.
 */
export function autoTileSize(r: SizeRoom): TileSize {
  const kinds = roomActions(r).filter((a) => a !== 'scenes' && a !== 'climate');
  const n = kinds.length;
  if (n === 0 || (n === 1 && kinds[0] === 'lights' && r.totalLights <= 1)) return 'compact';
  if (n >= 3 || (kinds.includes('media') && kinds.includes('lights')) || (r.isFavorite && n >= 2)) return 'expanded';
  return 'standard';
}

/** The user's choice, else the automatic size; "All compact" / "All standard" make every tile that size. */
export function tileSizeFor(r: SizeRoom & { areaId: string }, choices: Readonly<Record<string, TileSizeChoice>>, all: boolean | 'compact' | 'standard' = false): TileSize {
  if (all === true || all === 'compact') return 'compact';
  if (all === 'standard') return 'standard';
  const c = choices[r.areaId];
  return c && c !== 'auto' ? c : autoTileSize(r);
}

/**
 * Ambient palette (RGB triplets for `rgba(var(--x), a)`): a few restrained tones, not one colour
 * per room. Rooms keep their identity through icons and names and, when idle, a faint hint of the
 * nearest tone to their colour.
 */
export const AMBIENT = {
  amber: '245, 168, 78',
  teal: '40, 185, 171',
  violet: '154, 113, 245',
  blue: '76, 158, 231',
  rose: '218, 105, 145',
  neutral: '115, 131, 155'
} as const;
export type AmbientName = keyof typeof AMBIENT;

/** What a tile's light says: the main glow, a second softer one, and how lit the tile is. */
export interface RoomAmbient {
  /** Main glow (RGB triplet). */
  primary: string;
  /** Softer glow from the opposite corner (RGB triplet), e.g. media under warm lights, or climate. */
  secondary: string | null;
  /** active: something on (lights, media, fans); calm: only climate working; idle: all off. */
  level: 'active' | 'calm' | 'idle';
  /** Name of the main glow, for tests and data attributes. */
  name: AmbientName | 'light';
}

const HUES: [AmbientName, number][] = [
  ['amber', 35],
  ['teal', 174],
  ['violet', 262],
  ['blue', 208],
  ['rose', 335]
];

/** Hue of a CSS colour we write ourselves: #hex, hsl(h …) or rgb(r g b). */
export function cssHue(color: string): number | null {
  const c = color.trim();
  const hsl = /^hsla?\(\s*(-?[\d.]+)/i.exec(c);
  if (hsl) return ((Number(hsl[1]) % 360) + 360) % 360;
  const rgb = rgbTriplet(c);
  const hex = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  let r: number, g: number, b: number;
  if (rgb) [r, g, b] = rgb.split(',').map((v) => Number(v) / 255);
  else if (hex) {
    const v = hex[1].length === 3 ? [...hex[1]].map((x) => x + x).join('') : hex[1];
    [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  } else return null;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  if (d === 0) return null;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round((h * 60 + 360) % 360);
}

/** "rgb(255 200 100)" or "rgb(255, 200, 100)" → "255, 200, 100", else null. */
export function rgbTriplet(color: string): string | null {
  const m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(color.trim());
  return m ? `${m[1]}, ${m[2]}, ${m[3]}` : null;
}

/** The palette tone nearest a colour's hue (identity hint for idle rooms). */
export function nearestAmbient(color: string): AmbientName {
  const h = cssHue(color);
  if (h === null) return 'neutral';
  const dist = (a: number) => Math.min(Math.abs(a - h), 360 - Math.abs(a - h));
  return HUES.reduce((best, cur) => (dist(cur[1]) < dist(best[1]) ? cur : best))[0];
}

type AmbientRoom = Pick<RoomItem, 'mediaPlaying' | 'thermostat' | 'lightsOn' | 'fansOn' | 'lightColor' | 'color'>;

/**
 * The tile's light. Lights give the main glow (warm amber, or the lights' own colour when asked),
 * media a violet one (under the lights' glow when both), fans teal. Heating and cooling never take
 * over a tile: they add a soft rose or blue glow from below, on a calm neutral tile. Idle rooms stay
 * neutral with a faint hint of their own colour.
 */
export function roomAmbient(r: AmbientRoom, useLightColor = true): RoomAmbient {
  const a = r.thermostat?.action;
  const climate = a === 'heating' ? AMBIENT.rose : a === 'cooling' ? AMBIENT.blue : null;
  const media = r.mediaPlaying > 0;
  if (r.lightsOn > 0) {
    const own = useLightColor && r.lightColor ? rgbTriplet(r.lightColor) : null;
    return { primary: own ?? AMBIENT.amber, secondary: media ? AMBIENT.violet : climate, level: 'active', name: own ? 'light' : 'amber' };
  }
  if (media) return { primary: AMBIENT.violet, secondary: climate, level: 'active', name: 'violet' };
  if (r.fansOn > 0 || a === 'fan' || a === 'drying') return { primary: AMBIENT.teal, secondary: climate, level: 'active', name: 'teal' };
  const hint = nearestAmbient(r.color);
  if (climate) return { primary: AMBIENT[hint], secondary: climate, level: 'calm', name: hint };
  return { primary: AMBIENT[hint], secondary: null, level: 'idle', name: hint };
}

/** A block is one column of a band: one standard or expanded tile, or up to two compact tiles stacked. */
export interface TileBlock<T> {
  /** Columns it takes (expanded 2, others 1; never more than the grid has; a compact row all of them). */
  width: number;
  items: { item: T; size: TileSize }[];
}
export type TileBand<T> = TileBlock<T>[];

/**
 * Packs tiles into bands of `cols` columns, keeping the room order where it can: compact tiles
 * pair up into one column, and a wide tile that no longer fits a band lets the next tile that does
 * fit go first, and when nothing fits the space left the next wide tile narrows into it. Each
 * band is drawn as a grid row, so any space left in a band is shared out and there are no holes.
 * With `compactRows` (phones) each compact tile is a short row of its own instead.
 */
export function packTileBands<T>(tiles: readonly { item: T; size: TileSize }[], cols: number, compactRows = false): TileBand<T>[] {
  const n = Math.max(1, Math.floor(cols));
  const blocks: TileBlock<T>[] = [];
  let openCompact: TileBlock<T> | null = null;
  for (const t of tiles) {
    if (t.size === 'compact' && compactRows) {
      // Phones: each compact tile is a short full-width row, like a list.
      blocks.push({ width: n, items: [t] });
    } else if (t.size === 'compact') {
      if (openCompact) {
        openCompact.items.push(t);
        openCompact = null;
      } else {
        openCompact = { width: 1, items: [t] };
        blocks.push(openCompact);
      }
    } else {
      blocks.push({ width: t.size === 'expanded' ? Math.min(2, n) : 1, items: [t] });
    }
  }
  const bands: TileBand<T>[] = [];
  const queue = [...blocks];
  while (queue.length) {
    const band: TileBand<T> = [];
    let room = n;
    for (let i = 0; i < queue.length && room > 0; ) {
      if (queue[i].width <= room) {
        room -= queue[i].width;
        band.push(queue.splice(i, 1)[0]);
      } else i++;
    }
    // Nothing else fits the space left: the next wide tile takes it rather than leaving a hole
    // (two large rooms then share a row on a 3-column grid).
    if (room > 0 && band.length && queue.length) {
      const next = queue.shift() as TileBlock<T>;
      band.push({ ...next, width: room });
    }
    bands.push(band);
  }
  return bands;
}

/** Minimum tile width of the even "All standard" grid: tiles come out about 300 px wide. */
export const EVEN_TILE_MIN = 288;

/** Columns for a grid of this width: at least 195 px each, 2 to 6 (3 on a tablet, 5 on a laptop). */
export function tileColumns(width: number, gap = 12, min = 195): number {
  if (width <= 0) return 4;
  return Math.max(2, Math.min(6, Math.floor((width + gap) / (min + gap))));
}

/** Row heights for a grid of this width (px): a standard row, a row holding a large tile, a compact row. */
export interface BandMetrics {
  band: number;
  large: number;
  compact: number;
}
export function bandMetrics(width: number): BandMetrics {
  if (width < 520) return { band: 176, large: 192, compact: 68 };
  if (width < 900) return { band: 180, large: 196, compact: 84 };
  return { band: 184, large: 200, compact: 86 };
}

/** Row heights for the production tile (Design D · Soft blend): a little more air than A's. */
export function blendMetrics(width: number): BandMetrics {
  const m = bandMetrics(width);
  return { band: m.band + 16, large: m.large + 20, compact: m.compact - 4 };
}

/** Phones: compact tiles become full-width rows. */
export const compactRowsAt = (cols: number) => cols <= 2;

/**
 * How a band is drawn: grid column weights (one per block, plus a trailing empty weight when a
 * lone tile ends a floor) and its height. A last band with two or more tiles fills the row; a lone
 * last tile takes half the row at most twice its own width, so it never stretches across the page.
 */
export function bandLayout(band: TileBand<unknown>, cols: number, isLast: boolean, m: BandMetrics, gap = 12, even = false): { weights: number[]; spacer: number; height: number } {
  const used = band.reduce((n, b) => n + b.width, 0);
  const allLarge = band.length > 1 && band.every((b) => b.items[0].size === 'expanded');
  const weights = band.map((b) => (allLarge ? 1 : b.width));
  let spacer = 0;
  // An even grid ("All standard") keeps every tile the same width: a short last row leaves the rest empty.
  if (even && isLast && used < cols) return { weights, spacer: cols - used, height: m.band };
  if (isLast && band.length === 1 && used < cols) {
    const target = Math.min(cols, Math.max(used, Math.min(cols / 2, used * 2)));
    spacer = cols - target;
    weights[0] = target;
  }
  const singleCompacts = band.every((b) => b.items.length === 1 && b.items[0].size === 'compact');
  const height = singleCompacts ? m.compact : band.some((b) => b.items[0].size === 'expanded') ? m.large : m.band;
  void gap;
  return { weights, spacer, height };
}
