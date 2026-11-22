/**
 * Shared parts of the Rooms page (docs/pro-ui/ROOMS.md): room colours, page options
 * (`preferences.proRooms`) and the temperature format.
 */
import { QUICK_ACTIONS, type QuickAction, type TileSizeChoice } from '../../lib/roomTiles';

export { areaIcon as roomIcon } from '../../widgets/areas/concepts/shared';

/** Colours offered for a room (hex, saved in `rooms.areaOverrides[id].customColor`, shared with the classic page). */
export const ROOM_COLORS = [
  { hex: '#e5484d', name: 'Red' },
  { hex: '#f76b15', name: 'Orange' },
  { hex: '#e2a336', name: 'Amber' },
  { hex: '#46a758', name: 'Green' },
  { hex: '#12a594', name: 'Teal' },
  { hex: '#0797b9', name: 'Cyan' },
  { hex: '#3e63dd', name: 'Blue' },
  { hex: '#6e56cf', name: 'Violet' },
  { hex: '#d6409f', name: 'Pink' },
  { hex: '#8d7b68', name: 'Clay' }
] as const;

/** Page options (`preferences.proRooms`, all screens). Every extra can be switched off in Customize. */
export interface RoomsPagePrefs {
  /**
   * "large" = mixed sizes (automatic or the user's per-room choice); "compact" = every tile
   * compact; "standard" = every tile standard, in an even grid of about 300×200 px tiles.
   */
  cardSize: 'large' | 'compact' | 'standard';
  /** Tile size per room, by area id ("auto" or missing = automatic). */
  sizes: Record<string, TileSizeChoice>;
  /** The big number on standard and large tiles. */
  metric: 'temperature' | 'humidity';
  showSummary: boolean;
  groupByFloor: boolean;
  swipeFloors: boolean;
  showFacts: boolean;
  showAir: boolean;
  showMood: boolean;
  showClimate: boolean;
  showScenes: boolean;
  actLights: boolean;
  actMedia: boolean;
  actFan: boolean;
  actCover: boolean;
  lightColorGlow: boolean;
  /** The room's Home Assistant area picture behind the tile (off by default). */
  showPictures: boolean;
  animations: boolean;
}
export type RoomsToggle = Exclude<keyof RoomsPagePrefs, 'cardSize' | 'sizes' | 'metric'>;

/** The switches in Customize, in order, with what each one does. */
export const ROOMS_TOGGLES: { key: RoomsToggle; group: 'page' | 'cards' | 'actions'; label: string; hint?: string }[] = [
  { key: 'showSummary', group: 'page', label: 'Home status', hint: 'Lights, temperatures, power, people home; lights filter the rooms' },
  { key: 'groupByFloor', group: 'page', label: 'Group by floor', hint: 'Collapsible floors with lights off per floor' },
  { key: 'swipeFloors', group: 'page', label: 'Swipe between floors', hint: 'Phones and tablets' },
  { key: 'showMood', group: 'cards', label: 'Room status', hint: 'Cozy, Too warm, Empty for 3 h… on large tiles' },
  { key: 'showFacts', group: 'cards', label: 'Humidity and power' },
  { key: 'showAir', group: 'cards', label: 'Air quality', hint: 'CO₂, AQI or PM2.5 on large tiles' },
  { key: 'showPictures', group: 'cards', label: 'Area pictures', hint: 'The picture set for the area in Home Assistant, behind the tile' },
  { key: 'lightColorGlow', group: 'cards', label: 'Glow in the lights’ colour' },
  { key: 'animations', group: 'cards', label: 'Animations', hint: 'Music bars and soft fades' },
  { key: 'actLights', group: 'actions', label: 'Lights', hint: 'Every light in the room on or off' },
  { key: 'showClimate', group: 'actions', label: 'Climate', hint: 'Heating or cooling, −/+ on the target' },
  { key: 'actMedia', group: 'actions', label: 'Media', hint: 'Play or pause the room’s player' },
  { key: 'actFan', group: 'actions', label: 'Fans' },
  { key: 'actCover', group: 'actions', label: 'Blinds and covers', hint: 'Open or close them all' },
  { key: 'showScenes', group: 'actions', label: 'Scenes' }
];

/** Which quick action each switch controls. */
export const ACTION_PREF: Record<QuickAction, RoomsToggle> = {
  lights: 'actLights',
  climate: 'showClimate',
  media: 'actMedia',
  fan: 'actFan',
  cover: 'actCover',
  scenes: 'showScenes'
};
export const enabledActions = (p: RoomsPagePrefs) => new Set(QUICK_ACTIONS.filter((a) => p[ACTION_PREF[a]]));

export const DEFAULT_ROOMS_PREFS: RoomsPagePrefs = {
  cardSize: 'large',
  sizes: {},
  metric: 'temperature',
  ...(Object.fromEntries(ROOMS_TOGGLES.map((t) => [t.key, true])) as Record<RoomsToggle, boolean>),
  showPictures: false
};
export const ROOMS_PREF_KEY = 'proRooms';
const SIZE_CHOICES = new Set<TileSizeChoice>(['auto', 'compact', 'standard', 'expanded']);

/** The stored options as saved (older keys included), so a save keeps what this version doesn't use. */
export function rawRoomsPrefs(preferences: unknown): Record<string, unknown> {
  const v = (preferences as Record<string, unknown> | undefined)?.[ROOMS_PREF_KEY];
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
}

export function readRoomsPrefs(preferences: unknown): RoomsPagePrefs {
  const v = rawRoomsPrefs(preferences) as Partial<RoomsPagePrefs>;
  const sizes: Record<string, TileSizeChoice> = {};
  for (const [id, c] of Object.entries(v.sizes ?? {})) if (SIZE_CHOICES.has(c)) sizes[id] = c;
  const out: RoomsPagePrefs = { ...DEFAULT_ROOMS_PREFS, cardSize: v.cardSize === 'compact' || v.cardSize === 'standard' ? v.cardSize : 'large', sizes, metric: v.metric === 'humidity' ? 'humidity' : 'temperature' };
  for (const t of ROOMS_TOGGLES) if (typeof v[t.key] === 'boolean') out[t.key] = v[t.key] as boolean;
  return out;
}

/** Temperature for a card: "21.5°". */
export const temp = (t: number | null) => (t === null ? '–' : `${Number(t.toFixed(1))}°`);
