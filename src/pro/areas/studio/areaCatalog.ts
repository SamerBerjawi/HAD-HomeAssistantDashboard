/**
 * What the Area Tiles Studio shows: the proposed grouping of entity types into review batches,
 * and for each designed type its concepts (docs/pro-ui/AREA_TILES.md). One file per batch under
 * `catalog/`.
 */
import type { TileModel } from '../tileTypes';
import type { TileTypeEntry } from './catalog/catalogTypes';
import { BATCH_1 } from './catalog/batch1';
import { BATCH_2 } from './catalog/batch2';
import { BATCH_3 } from './catalog/batch3';
import { BATCH_4 } from './catalog/batch4';
import { BATCH_5 } from './catalog/batch5';

export type { TileConcept, TileConceptId, TileTypeEntry } from './catalog/catalogTypes';

export const TILE_TYPES: readonly TileTypeEntry<TileModel>[] = [...BATCH_1, ...BATCH_2, ...BATCH_3, ...BATCH_4, ...BATCH_5];

/** Proposed grouping of every entity type the room page supports into review batches. */
export const BATCHES: { id: number; title: string; status: 'chosen' | 'review' | 'next' | 'later'; types: { name: string; domains: string; note: string }[] }[] = [
  {
    id: 1,
    title: 'Light & power',
    status: 'chosen',
    types: [
      { name: 'Light', domains: 'light', note: 'On/off, brightness, white tone, colour' },
      { name: 'Switch & plug', domains: 'switch, input_boolean', note: 'On/off, live power, energy today' },
      { name: 'Fan', domains: 'fan', note: 'On/off, speed steps, presets, swing, direction' }
    ]
  },
  {
    id: 2,
    title: 'Climate & air',
    status: 'chosen',
    types: [
      { name: 'Thermostat', domains: 'climate', note: 'Target, current, HVAC mode and action, fan mode' },
      { name: 'Blind & cover', domains: 'cover', note: 'Open/close/stop, position, tilt' },
      { name: 'Reading', domains: 'sensor (temperature, humidity, CO₂, PM2.5, VOC, AQI, light, power, energy)', note: 'Value, trend, comfort band' }
    ]
  },
  {
    id: 3,
    title: 'Media & scenes',
    status: 'chosen',
    types: [
      { name: 'Speaker & TV', domains: 'media_player', note: 'Now playing, play/pause, volume, source' },
      { name: 'Scene', domains: 'scene', note: 'One tile per scene: activate, last used' }
    ]
  },
  {
    id: 4,
    title: 'Security & sensing',
    status: 'chosen',
    types: [
      { name: 'Camera', domains: 'camera', note: 'Live view or still, last motion' },
      { name: 'Lock', domains: 'lock', note: 'Lock/unlock (confirm), jammed, battery' },
      { name: 'Door & window', domains: 'binary_sensor (door, window, garage_door, opening)', note: 'Open/closed, how long' },
      { name: 'Motion & presence', domains: 'binary_sensor (motion, occupancy, presence)', note: 'Detected, last seen' },
      { name: 'Leak & smoke', domains: 'binary_sensor (moisture, smoke, gas)', note: 'Alarm state, test, battery' }
    ]
  },
  {
    id: 5,
    title: 'Machines',
    status: 'chosen',
    types: [
      { name: 'Vacuum', domains: 'vacuum', note: 'Clean/pause/dock, status, battery' },
      { name: 'Car', domains: 'device: lock + climate + battery', note: 'X-small and Small: one entity each (battery, range, charging, doors, climate, location). Wide, Tall, Large: one tile for the whole car' }
    ]
  }
];
