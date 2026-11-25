/**
 * What every room tile design reads from a room (docs/pro-ui/ROOMS.md §3): the big number, a state
 * word when there is no reading, the facts line, lights and devices, the status dot and the
 * ambient light. Shared by the production tile (Design A) and the studio's B and C, so the designs
 * differ in composition only, never in what they say.
 */
import type { ComponentType, CSSProperties } from 'react';
import { ACTION_LABEL } from '../../lib/overviewThermostat';
import { roomAmbient, type QuickAction, type RoomAmbient, type TileSize } from '../../lib/roomTiles';
import type { RoomItem } from '../../lib/roomsPage';
import { roomMood, type MoodTone } from '../../lib/roomsInsights';
import { temp, type RoomsPagePrefs } from './shared';

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export interface RoomTileProps {
  r: RoomItem;
  size: TileSize;
  prefs: RoomsPagePrefs;
  /** The quick actions to show (already filtered by the room's entities and the user's choice). */
  actions: readonly QuickAction[];
  onOpen: (areaId: string) => void;
}
export type RoomTileComponent = ComponentType<RoomTileProps>;

/** Re-render a tile only when its room (or how it is shown) changes, not when another room does. */
export const sameTile = (a: RoomTileProps, b: RoomTileProps) =>
  a.size === b.size && a.prefs === b.prefs && a.onOpen === b.onOpen && a.actions.join() === b.actions.join() && JSON.stringify(a.r) === JSON.stringify(b.r);

const WARN = 'hsl(26 95% 55%)';
const PRESENT = 'hsl(150 65% 48%)';

export interface TileFacts {
  ambient: RoomAmbient;
  /** CSS custom properties carrying the ambient light (`--rt-a`, `--rt-b`). */
  ambientStyle: CSSProperties;
  /** The big number ("21.5°" or "48%"), or null. */
  big: string | null;
  /** A short word when there is no reading ("Lit", "All off"). */
  word: string;
  /** Extra facts for large tiles, most telling first. */
  extras: string[];
  mood: { label: string; tone: MoodTone } | null;
  lights: string | null;
  lit: boolean;
  devices: string | null;
  /** Status dot: orange when something is open, green when someone is there. */
  dot: { color: string; label: string } | null;
  /** Accessible summary for the open button. */
  summary: string;
}

function airText(r: RoomItem): string | null {
  if (r.air.co2 !== null) return `CO₂ ${Math.round(r.air.co2)} ppm`;
  if (r.air.aqi !== null) return `AQI ${Math.round(r.air.aqi)}`;
  if (r.air.pm25 !== null) return `PM2.5 ${Math.round(r.air.pm25)}`;
  return null;
}

function powerText(watts: number): string | null {
  if (!(watts > 0)) return null;
  return watts >= 1000 ? `${(watts / 1000).toFixed(1)} kW` : `${watts} W`;
}

export function tileFacts(r: RoomItem, prefs: RoomsPagePrefs, size: TileSize): TileFacts {
  const ambient = roomAmbient(r, prefs.lightColorGlow);
  const t = r.temperature !== null ? temp(r.temperature) : null;
  const h = r.humidity !== null ? `${Math.round(r.humidity)}%` : null;
  const metric = r.primaryMetric && r.primaryMetric !== 'auto' ? r.primaryMetric : prefs.metric;
  const big =
    metric === 'none'
      ? null
      : metric === 'humidity'
      ? (h ?? t)
      : metric === 'power'
      ? powerText(r.powerWatts)
      : metric === 'air_quality'
      ? airText(r)
      : (t ?? h);
  const word =
    r.openContacts > 0 ? `${r.openContacts} open` : r.mediaPlaying > 0 ? 'Playing' : r.lightsOn > 0 ? 'Lit' : r.motion ? 'Motion' : r.totalLights > 0 ? 'All off' : 'Quiet';
  const th = r.thermostat;
  const large = size === 'expanded';
  const extras = (
    size === 'compact'
      ? []
      : [
          r.openContacts > 0 ? `${plural(r.openContacts, 'door or window', 'doors or windows')} open` : null,
          prefs.showClimate && th && th.action !== 'off' && th.action !== 'idle' ? `${ACTION_LABEL[th.action]} to ${temp(th.target)}` : null,
          r.media?.playing ? (large && r.media.title ? `Playing ${r.media.title}` : 'Playing') : null,
          large && prefs.showFacts && h && prefs.metric !== 'humidity' ? `${h} humidity` : null,
          large && prefs.showFacts && t && prefs.metric === 'humidity' ? t : null,
          large && prefs.showFacts && r.powerWatts > 0 ? `${r.powerWatts} W` : null,
          large && r.coversOpen > 0 ? `${plural(r.coversOpen, 'cover')} open` : null,
          large && prefs.showAir ? airText(r) : null
        ]
  ).filter((x): x is string => Boolean(x));
  const mood = large && prefs.showMood ? roomMood({ ...r, thermostatAction: th?.action ?? null }) : null;
  const dot = r.openContacts > 0 ? { color: WARN, label: `${plural(r.openContacts, 'door or window', 'doors or windows')} open` } : r.occupied ? { color: PRESENT, label: 'Someone is there' } : null;
  const lights = r.totalLights > 0 ? (r.lightsOn > 0 ? `${plural(r.lightsOn, 'light')} on` : 'Lights off') : null;
  const devices = r.deviceCount > 0 ? plural(r.deviceCount, 'device') : null;
  const summary = [big, lights, ...extras.slice(0, 2), dot?.label].filter(Boolean).join(', ');
  return {
    ambient,
    ambientStyle: { ['--rt-a' as string]: ambient.primary, ['--rt-b' as string]: ambient.secondary ?? ambient.primary },
    big,
    word,
    extras,
    mood,
    lights,
    lit: r.lightsOn > 0,
    devices,
    dot,
    summary
  };
}
