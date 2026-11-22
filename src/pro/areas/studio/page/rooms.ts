/**
 * The rooms the simulated Area page can show (batch 6): a full Living Room, a Hallway with only
 * sensors, and an empty Guest Room, so the edge cases are designed too. Each tile has a size for
 * phones and one for wider screens; car tiles point at one car (shared state) with a focus.
 */
import type { CarTileModel, TileModel, TileSize } from '../../tileTypes';
import { sectionOf } from '../../page/roomLayout';
import type { PageItem, PageRoom } from '../../page/pageKit';
import { CAMERA_STATES, CAR_STATES, CLIMATE_STATES, COVER_STATES, FAN_STATES, LIGHT_STATES, LOCK_STATES, MEDIA_STATES, MOTION_STATES, OPENING_STATES, READING_STATES, SAFETY_STATES, SCENE_STATES, SWITCH_STATES, VACUUM_STATES } from '../areaStates';
import { ROOM_PHOTO } from '../mockArt';

export interface SimItem extends PageItem {
  entityId: string;
}

export interface SimRoom extends PageRoom {
  items: SimItem[];
}

const pick = <M extends TileModel>(list: { id: string; model: M }[], id: string) => list.find((s) => s.id === id)!.model;

/** Every model the rooms use, by entity id (the page's mock HA). */
export const SEED: Record<string, TileModel> = {};

function tile(model: TileModel, phone: TileSize, wide: TileSize, focus?: CarTileModel['focus']): SimItem {
  SEED[model.entityId] ??= model;
  return { key: focus ? `${model.entityId}#${focus}` : model.entityId, entityId: model.entityId, focus, section: sectionOf(model.kind), size: { phone, wide } };
}

const car = pick(CAR_STATES, 'charging');

export const ROOMS: SimRoom[] = [
  {
    id: 'living_room',
    name: 'Living Room',
    photo: ROOM_PHOTO,
    items: [
      tile(pick(SCENE_STATES, 'movie'), 'xs', 'xs'),
      tile(pick(SCENE_STATES, 'relax'), 'xs', 'xs'),
      tile(pick(SCENE_STATES, 'bright'), 'xs', 'xs'),
      tile(pick(SCENE_STATES, 'night'), 'xs', 'xs'),
      tile(pick(LIGHT_STATES, 'warm'), 'w', 'l'),
      tile(pick(LIGHT_STATES, 'color'), 'w', 'w'),
      tile(pick(LIGHT_STATES, 'off'), 's', 's'),
      tile(pick(LIGHT_STATES, 'onoff'), 'xs', 's'),
      tile(pick(LIGHT_STATES, 'dim'), 'xs', 's'),
      tile(pick(LIGHT_STATES, 'na'), 'xs', 's'),
      tile(pick(CLIMATE_STATES, 'cool'), 'w', 'w'),
      tile(pick(READING_STATES, 'temp'), 'xs', 's'),
      tile(pick(READING_STATES, 'humidity'), 'xs', 's'),
      tile({ ...pick(READING_STATES, 'co2'), entityId: 'sensor.living_room_co2' }, 'xs', 's'),
      tile(pick(COVER_STATES, 'open'), 's', 't'),
      tile({ ...pick(COVER_STATES, 'part'), entityId: 'cover.living_room_side_blind', name: 'Side Blind' }, 's', 's'),
      tile(pick(FAN_STATES, 'tower'), 's', 't'),
      tile({ ...pick(FAN_STATES, 'ceiling'), name: 'Ceiling Fan' }, 'w', 'w'),
      tile(pick(MEDIA_STATES, 'playing'), 'l', 'l'),
      tile(pick(MEDIA_STATES, 'tv'), 'w', 'w'),
      tile(pick(CAMERA_STATES, 'live'), 'w', 'w'),
      tile(pick(LOCK_STATES, 'locked'), 's', 's'),
      tile({ ...pick(OPENING_STATES, 'open'), name: 'Window', entityId: 'binary_sensor.living_room_window', lastChanged: Date.now() - 12 * 60000 }, 'xs', 's'),
      tile({ ...pick(MOTION_STATES, 'detected'), name: 'Motion' }, 'xs', 's'),
      tile({ ...pick(SAFETY_STATES, 'smokeok'), entityId: 'binary_sensor.living_room_smoke' }, 'xs', 's'),
      tile(pick(VACUUM_STATES, 'cleaning'), 'w', 'w'),
      tile(car, 'w', 'w'),
      tile(car, 'xs', 'xs', 'battery'),
      tile(car, 'xs', 'xs', 'lock'),
      tile(pick(SWITCH_STATES, 'plug'), 'w', 'w'),
      tile(pick(SWITCH_STATES, 'off'), 'xs', 's')
    ]
  },
  {
    id: 'hallway',
    name: 'Hallway',
    photo: null,
    items: [
      tile({ ...pick(MOTION_STATES, 'clear'), name: 'Motion' }, 's', 's'),
      tile({ ...pick(OPENING_STATES, 'closed'), entityId: 'binary_sensor.hallway_front_door' }, 's', 's'),
      tile({ ...pick(READING_STATES, 'temp'), entityId: 'sensor.hallway_temperature', name: 'Temperature', value: 19.6 }, 's', 's'),
      tile({ ...pick(READING_STATES, 'humidity'), entityId: 'sensor.hallway_humidity', name: 'Humidity', value: 52 }, 's', 's'),
      tile({ ...pick(SAFETY_STATES, 'smokeok'), entityId: 'binary_sensor.hallway_smoke', name: 'Smoke Alarm' }, 'w', 'w')
    ]
  },
  { id: 'guest_room', name: 'Guest Room', photo: null, items: [] }
];
