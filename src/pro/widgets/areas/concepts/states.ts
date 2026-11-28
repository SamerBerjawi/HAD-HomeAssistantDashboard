/**
 * Named Areas states for the Widget Design Studio, built with the real model builder. The room
 * "photos" are simple SVGs made here (no real pictures).
 */
import type { HAFloor, ResolvedArea, ResolvedAreaSummary } from '@/types';
import { buildAreasModel, type ProAreasModel } from '../../../lib/overviewAreas';
import type { WidgetState } from '../../../studio/types';

const room = (wall: string, floor: string, accent: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200"><defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wall}"/><stop offset="1" stop-color="${floor}"/></linearGradient></defs><rect width="300" height="200" fill="url(#w)"/><rect x="190" y="30" width="70" height="80" rx="4" fill="#fff" opacity="0.28"/><rect x="0" y="150" width="300" height="50" fill="${floor}" opacity="0.8"/><rect x="40" y="112" width="120" height="44" rx="10" fill="${accent}"/><rect x="34" y="100" width="20" height="56" rx="8" fill="${accent}" opacity="0.85"/><rect x="146" y="100" width="20" height="56" rx="8" fill="${accent}" opacity="0.85"/><circle cx="230" cy="70" r="16" fill="#ffe8a3" opacity="0.6"/></svg>`
  )}`;

const PICS = {
  living: room('#d9c7b0', '#7a5c43', '#3e5c76'),
  bedroom: room('#c9d3e6', '#5b6478', '#b5838d'),
  kitchen: room('#e8e1d3', '#8a7f6e', '#6b9080'),
  office: room('#d4dccd', '#5f6b57', '#4a4e69'),
  garden: room('#a7d3a6', '#3f6b3a', '#6a994e')
};

const FLOORS: HAFloor[] = [
  { floor_id: 'ground', name: 'Ground Floor', level: 0, icon: '' },
  { floor_id: 'first', name: 'First Floor', level: 1, icon: '' },
  { floor_id: 'outside', name: 'Outside', level: -1, icon: '' }
] as unknown as HAFloor[];

const summary = (s: Partial<ResolvedAreaSummary>): ResolvedAreaSummary => ({
  totalEntities: 8,
  lightsOn: 0,
  totalLights: 0,
  climatesActive: 0,
  totalClimates: 0,
  activeMediaPlayers: 0,
  totalMediaPlayers: 0,
  totalPowerWatts: 0,
  openContacts: 0,
  motionDetected: false,
  lowBatteryCount: 0,
  activeCleaners: 0,
  activeSwitches: 0,
  ...s
});

const area = (id: string, name: string, floor: string | null, icon: string, s: Partial<ResolvedAreaSummary>, picture: string | null = null): ResolvedArea =>
  ({
    area_id: id,
    name,
    icon,
    picture,
    floor_id: floor,
    devices: [],
    entities: [],
    entitiesByDomain: { light: Array.from({ length: s.totalLights ?? 0 }, (_, i) => ({ entity_id: `light.${id}_${i}` })) },
    summary: summary(s),
    bannerImage: null
  }) as unknown as ResolvedArea;

const HOME = (pics: boolean): ResolvedArea[] => [
  area(
    'living',
    'Living Room',
    'ground',
    'mdi:sofa',
    { lightsOn: 3, totalLights: 4, currentTempAvg: 21.6, currentHumidityAvg: 44, activeMediaPlayers: 1, totalPowerWatts: 182 },
    pics ? PICS.living : null
  ),
  area('kitchen', 'Kitchen', 'ground', 'mdi:silverware-fork-knife', { lightsOn: 2, totalLights: 3, currentTempAvg: 22.4, motionDetected: true, totalPowerWatts: 640 }, pics ? PICS.kitchen : null),
  area('hall', 'Hallway', 'ground', 'mdi:door', { totalLights: 2, currentTempAvg: 20.1, openContacts: 1 }),
  area('bedroom', 'Bedroom', 'first', 'mdi:bed', { totalLights: 2, currentTempAvg: 19.8, currentHumidityAvg: 51 }, pics ? PICS.bedroom : null),
  area('kids', 'Kids Room', 'first', 'mdi:teddy-bear', { lightsOn: 1, totalLights: 2, currentTempAvg: 20.6 }),
  area('office', 'Office', 'first', 'mdi:desk', { totalLights: 2, currentTempAvg: 22.1, totalPowerWatts: 95 }, pics ? PICS.office : null),
  area('bath', 'Bathroom', 'first', 'mdi:shower', { totalLights: 1, currentTempAvg: 23 }),
  area('garden', 'Garden', 'outside', 'mdi:flower', { totalLights: 3, currentTempAvg: 14.2 }, pics ? PICS.garden : null),
  area('garage', 'Garage', 'outside', 'mdi:garage', { totalLights: 1, openContacts: 0 })
];

const FAVS = ['living', 'bedroom', 'kitchen', 'office'];
const quiet = HOME(true).map((a) => ({ ...a, summary: { ...a.summary, lightsOn: 0, activeMediaPlayers: 0, motionDetected: false, openContacts: 0 } }));
const many = [
  ...HOME(true),
  area('laundry', 'Laundry & Utility Room', null, 'mdi:washing-machine', { totalLights: 1 }),
  area('gym', 'Home Gym and Sauna Area', null, 'mdi:dumbbell', { totalLights: 2, currentTempAvg: 18.9 }),
  area('guest', 'Guest Bedroom With Ensuite', 'first', 'mdi:bed', { totalLights: 2, currentTempAvg: 19.1 })
];

export const AREAS_STATES: WidgetState<ProAreasModel>[] = [
  { id: 'evening', label: 'Evening', model: buildAreasModel(HOME(true), FLOORS, FAVS) },
  { id: 'quiet', label: 'All quiet', model: buildAreasModel(quiet, FLOORS, FAVS) },
  { id: 'nopics', label: 'No pictures', model: buildAreasModel(HOME(false), FLOORS, FAVS) },
  { id: 'nofav', label: 'No favourites set', model: buildAreasModel(HOME(true), FLOORS, []) },
  { id: 'many', label: 'Many areas', model: buildAreasModel(many, FLOORS, ['guest', 'living', 'gym', 'kitchen', 'office', 'kids']) },
  { id: 'none', label: 'No areas', model: buildAreasModel([], FLOORS, []) }
];
