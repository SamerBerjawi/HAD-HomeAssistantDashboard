/**
 * Shared parts of the Rooms page (docs/pro-ui/ROOMS.md): each signal's icon and label, room
 * colours, page options and the lights action.
 */
import { useMemo } from 'react';
import type { IconSvgElement } from '@hugeicons/react';
import { BatteryLowIcon, BulbIcon, Door01Icon, Motion01Icon, MusicNote03Icon, Robot01Icon, ThermometerIcon } from '@hugeicons/core-free-icons';
import type { RoomItem, RoomSignal } from '../../lib/roomsPage';
import { useAreaActions } from '../../widgets/areas/concepts/shared';

export { areaIcon as roomIcon } from '../../widgets/areas/concepts/shared';

/** Each signal's icon and short label. */
export const SIGNAL: Record<RoomSignal, { icon: IconSvgElement; label: (r: RoomItem) => string }> = {
  open: { icon: Door01Icon, label: (r) => `${r.openContacts} open` },
  motion: { icon: Motion01Icon, label: () => 'Motion' },
  media: { icon: MusicNote03Icon, label: () => 'Playing' },
  lights: { icon: BulbIcon, label: (r) => `${r.lightsOn} on` },
  climate: { icon: ThermometerIcon, label: (r) => (r.targetTemp !== null ? `Set ${Number(r.targetTemp.toFixed(1))}°` : 'Climate') },
  cleaning: { icon: Robot01Icon, label: () => 'Cleaning' },
  battery: { icon: BatteryLowIcon, label: (r) => `${r.lowBattery} low battery` }
};

/** Background for a room without a picture: its colour, darker towards the bottom. */
export const roomGradient = (color: string) => `linear-gradient(150deg, ${color}, color-mix(in oklab, ${color} 48%, black))`;

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
  cardSize: 'large' | 'compact';
  showActive: boolean;
  showSummary: boolean;
  groupByFloor: boolean;
  swipeFloors: boolean;
  showFacts: boolean;
  showAir: boolean;
  showMood: boolean;
  showClimate: boolean;
  showScenes: boolean;
  lightColorGlow: boolean;
  nightLook: boolean;
  animations: boolean;
}
export type RoomsToggle = Exclude<keyof RoomsPagePrefs, 'cardSize'>;

/** The switches in Customize, in order, with what each one does. */
export const ROOMS_TOGGLES: { key: RoomsToggle; group: 'page' | 'cards'; label: string; hint?: string }[] = [
  { key: 'showSummary', group: 'page', label: 'Home summary', hint: 'Rooms lit, temperatures, power, open; tap to filter' },
  { key: 'showActive', group: 'page', label: 'Happening now' },
  { key: 'groupByFloor', group: 'page', label: 'Group by floor', hint: 'With lights off per floor' },
  { key: 'swipeFloors', group: 'page', label: 'Swipe between floors', hint: 'Phones and tablets' },
  { key: 'showMood', group: 'cards', label: 'Room status', hint: 'Cozy, Too warm, Empty for 3 h…' },
  { key: 'showFacts', group: 'cards', label: 'Humidity and power' },
  { key: 'showAir', group: 'cards', label: 'Air quality', hint: 'CO₂, AQI or PM2.5 when the room has a sensor' },
  { key: 'showClimate', group: 'cards', label: 'Heating and cooling', hint: 'Ring on the temperature and the −/+ chip' },
  { key: 'showScenes', group: 'cards', label: 'Scenes button' },
  { key: 'lightColorGlow', group: 'cards', label: 'Glow in the lights’ colour' },
  { key: 'nightLook', group: 'cards', label: 'Night look', hint: 'Dimmer pictures after sunset, lit rooms stand out' },
  { key: 'animations', group: 'cards', label: 'Animations', hint: 'Presence shimmer, music bars, fades' }
];

export const DEFAULT_ROOMS_PREFS: RoomsPagePrefs = {
  cardSize: 'large',
  ...(Object.fromEntries(ROOMS_TOGGLES.map((t) => [t.key, true])) as Record<RoomsToggle, boolean>)
};
export const ROOMS_PREF_KEY = 'proRooms';
export function readRoomsPrefs(preferences: unknown): RoomsPagePrefs {
  const v = ((preferences as Record<string, unknown> | undefined)?.[ROOMS_PREF_KEY] ?? {}) as Partial<RoomsPagePrefs>;
  const out: RoomsPagePrefs = { ...DEFAULT_ROOMS_PREFS, cardSize: v.cardSize === 'compact' ? 'compact' : 'large' };
  for (const t of ROOMS_TOGGLES) if (typeof v[t.key] === 'boolean') out[t.key] = v[t.key] as boolean;
  return out;
}

/** Temperature for a card: "21.5°". */
export const temp = (t: number | null) => (t === null ? '–' : `${Number(t.toFixed(1))}°`);

/** Lights on/off for a room (the action every card carries). */
export function useRoomLights() {
  const { setLights } = useAreaActions();
  return useMemo(() => ({ toggle: (r: RoomItem) => setLights(r, r.lightsOn === 0) }), [setLights]);
}
