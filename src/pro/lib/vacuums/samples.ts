/**
 * Sample cleaners for the Vacuum Tiles Studio (docs/pro-ui/VACUUM_TILES.md). Pure and
 * deterministic, never Home Assistant. The robot carries what the Dreame integration offers for
 * the owner's X60 Pro Ultra Complete; the stick what SmartThings offers for the Bespoke AI Jet
 * Ultra; "Another robot" is a plain vacuum (a Roborock without station sensors) to show the tiles
 * leaving out what a model lacks.
 */
import type { Cleaner, Supply } from './cleaner';

const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m).getTime();
export const SAMPLE_NOW = at(28, 10, 40);

const rooms = (floor: string | null, ...names: string[]) => names.map((name, i) => ({ id: `${floor ?? ''}:${i + 1}`, segment: String(i + 1), name, floor }));
/** Seven weeks of earlier runs, every other day or so, one stopped early. */
const older = Array.from({ length: 22 }, (_, i) => ({ at: at(19 - i * 2 - (i % 3 === 0 ? 1 : 0), 9, 0), areaM2: i % 4 === 1 ? 24 : 60 + (i % 5), minutes: i % 4 === 1 ? 21 : 54 + (i % 6), done: i !== 7 }));
const ok = (id: Supply['id'], name: string, raw = 'Installed'): Supply => ({ id, name, state: 'ok', raw });

function dreame(p: Partial<Cleaner> = {}): Cleaner {
  return {
    id: 'dreame:x60',
    kind: 'robot',
    name: 'X60 Pro Ultra Complete',
    make: 'Dreame',
    model: 'X60 Pro Ultra Complete',
    integration: 'dreame_vacuum',
    activity: 'charging',
    status: 'Charging',
    battery: 86,
    charging: true,
    error: null,
    run: { areaM2: 64, minutes: 58, mode: 'Sweeping and mopping · Standard', room: null, at: at(28, 9, 5) },
    rooms: [...rooms('Ground floor', 'Living room', 'Kitchen', 'Hall', 'Dining', 'Office'), ...rooms('First floor', 'Bedroom', 'Kids room', 'Bathroom', 'Landing')],
    floor: 'Ground floor',
    station: {
      doing: null,
      supplies: [ok('clean', 'Clean water'), ok('dirty', 'Dirty water'), ok('dust', 'Dust bag'), ok('detergent', 'Detergent'), ok('hot', 'Hot water', 'Enabled'), ok('mop', 'Mop pads')]
    },
    parts: [
      { id: 'main', name: 'Main brush', percent: 72, hoursLeft: 216, canReset: true },
      { id: 'side', name: 'Side brush', percent: 54, hoursLeft: 108, canReset: true },
      { id: 'filter', name: 'Filter', percent: 41, hoursLeft: 61, canReset: true },
      { id: 'sensor', name: 'Sensors', percent: 33, hoursLeft: 10, canReset: true },
      { id: 'wheel', name: 'Wheel', percent: 80, hoursLeft: 24, canReset: true }
    ],
    lifetime: { areaM2: 4812, minutes: 6290, count: 96, since: at(2, 14) - 86400_000 * 120 },
    settings: [
      { id: 'switch.x60_resume_cleaning', name: 'Resume cleaning', on: true },
      { id: 'switch.x60_carpet_boost', name: 'Carpet boost', on: true },
      { id: 'switch.x60_obstacle_avoidance', name: 'Obstacle avoidance', on: true },
      { id: 'switch.x60_customized_cleaning', name: 'Customized cleaning', on: false },
      { id: 'switch.x60_auto_drying', name: 'Auto drying', on: true },
      { id: 'switch.x60_auto_add_detergent', name: 'Auto-add detergent', on: true },
      { id: 'switch.x60_carpet_recognition', name: 'Carpet recognition', on: true },
      { id: 'switch.x60_child_lock', name: 'Child lock', on: false },
      { id: 'switch.x60_dnd', name: 'Do not disturb', on: true }
    ],
    dock: null,
    energy: null,
    history: [
      { at: at(28, 9, 5), areaM2: 64, minutes: 58, done: true },
      { at: at(27, 13, 30), areaM2: 22, minutes: 19, done: true },
      { at: at(26, 9, 0), areaM2: 61, minutes: 55, done: true },
      { at: at(25, 18, 10), areaM2: 12, minutes: 14, done: false },
      { at: at(24, 9, 0), areaM2: 63, minutes: 57, done: true },
      { at: at(22, 10, 15), areaM2: 64, minutes: 60, done: true },
      { at: at(21, 9, 0), areaM2: 30, minutes: 26, done: true },
      ...older
    ],
    actions: ['start', 'pause', 'dock', 'locate', 'wash', 'dry', 'empty', 'setting', 'reset', 'rooms'],
    seen: SAMPLE_NOW - 60_000,
    ...p
  };
}

const supplies = (over: Partial<Record<Supply['id'], Partial<Supply>>>) => dreame().station!.supplies.map((s) => ({ ...s, ...over[s.id] }));

function samsung(p: Partial<Cleaner> = {}, dock: Partial<NonNullable<Cleaner['dock']>> = {}): Cleaner {
  return {
    id: 'stick:basement',
    kind: 'stick',
    name: 'Basement stick vacuum',
    make: 'Samsung',
    model: 'Bespoke AI Jet Ultra',
    integration: 'smartthings',
    activity: 'charging',
    status: 'Charging',
    battery: 64,
    charging: true,
    error: null,
    run: null,
    rooms: [],
    floor: null,
    station: null,
    parts: [],
    lifetime: null,
    settings: [],
    dock: { inStation: true, bagFull: false, cycles: 23, lastEmptied: at(28, 8, 50), emptying: false, ...dock },
    energy: { powerW: 41, kWh: 18.6, savedKwh: 2.4, lastKwh: 0.07 },
    history: [],
    actions: ['empty'],
    seen: SAMPLE_NOW - 120_000,
    ...p
  };
}

function roborock(p: Partial<Cleaner> = {}): Cleaner {
  return {
    ...dreame(),
    id: 'vacuum:roborock',
    name: 'Upstairs robot',
    make: 'Roborock',
    model: 'S8',
    integration: 'roborock',
    activity: 'cleaning',
    status: 'Segment cleaning',
    battery: 71,
    charging: false,
    run: { areaM2: 18, minutes: 16, mode: 'Balanced', room: 'Bedroom', at: null },
    rooms: rooms(null, 'Bedroom', 'Kids room', 'Bathroom'),
    floor: null,
    station: null,
    parts: [
      { id: 'main', name: 'Main brush', percent: 64, hoursLeft: null, canReset: false },
      { id: 'side', name: 'Side brush', percent: 22, hoursLeft: null, canReset: false },
      { id: 'filter', name: 'Filter', percent: 47, hoursLeft: null, canReset: false }
    ],
    lifetime: null,
    settings: [],
    history: [],
    actions: ['start', 'pause', 'dock', 'locate'],
    ...p
  };
}

export interface CleanerSample {
  id: string;
  label: string;
  c: Cleaner;
  now: number;
}

export function cleanerSamples(): CleanerSample[] {
  const n = SAMPLE_NOW;
  return [
    { id: 'cleaning', label: 'Cleaning the kitchen', now: n, c: dreame({ activity: 'cleaning', status: 'Sweeping and mopping', battery: 62, charging: false, run: { areaM2: 34, minutes: 41, mode: 'Sweeping and mopping · Standard', room: 'Kitchen', at: null } }) },
    { id: 'ready', label: 'Charged, ready', now: n, c: dreame({ activity: 'docked', status: 'Charging completed', battery: 100, charging: false }) },
    { id: 'washing', label: 'Washing the mop', now: n, c: dreame({ activity: 'washing', status: 'Washing', battery: 48, station: { doing: 'Washing the mop pads', supplies: supplies({}) } }) },
    { id: 'drying', label: 'Drying after a run', now: n, c: dreame({ activity: 'drying', status: 'Drying', station: { doing: 'Drying · 1 h 40 min left', supplies: supplies({}) } }) },
    {
      id: 'chores',
      label: 'Station needs you',
      now: n,
      c: dreame({ activity: 'docked', status: 'Charging completed', battery: 100, charging: false, station: { doing: null, supplies: supplies({ clean: { state: 'low', raw: 'Low water' }, dirty: { state: 'full', raw: 'Not installed or full' }, detergent: { state: 'low', raw: 'Low detergent' } }) } })
    },
    { id: 'stuck', label: 'Stuck in the hall', now: n, c: dreame({ activity: 'error', status: 'Error', error: 'Main brush tangled', battery: 37, charging: false, run: { areaM2: 21, minutes: 24, mode: 'Sweeping', room: 'Hall', at: null } }) },
    {
      id: 'worn',
      label: 'Parts worn',
      now: n,
      c: dreame({
        parts: [
          { id: 'main', name: 'Main brush', percent: 18, hoursLeft: 54, canReset: true },
          { id: 'side', name: 'Side brush', percent: 6, hoursLeft: 12, canReset: true },
          { id: 'filter', name: 'Filter', percent: 0, hoursLeft: 0, canReset: true },
          { id: 'sensor', name: 'Sensors', percent: 62, hoursLeft: 19, canReset: true },
          { id: 'wheel', name: 'Wheel', percent: 91, hoursLeft: 27, canReset: true }
        ]
      })
    },
    { id: 'other', label: 'Another robot (fewer parts)', now: n, c: roborock() },
    { id: 'stick-home', label: 'Stick charging', now: n, c: samsung() },
    { id: 'stick-ready', label: 'Stick ready', now: n, c: samsung({ activity: 'docked', battery: 100, charging: false, energy: { powerW: 2, kWh: 18.6, savedKwh: 2.4, lastKwh: 0.07 } }) },
    { id: 'stick-use', label: 'Stick in use', now: n, c: samsung({ activity: 'in-use', battery: 48, charging: false, energy: { powerW: 0, kWh: 18.6, savedKwh: 2.4, lastKwh: 0.07 } }, { inStation: false }) },
    { id: 'stick-full', label: 'Dust bag full', now: n, c: samsung({ activity: 'docked', battery: 100, charging: false }, { bagFull: true, cycles: 41 }) },
    { id: 'stick-emptying', label: 'Emptying the bin', now: n, c: samsung({ activity: 'emptying', battery: 92 }, { emptying: true, lastEmptied: n }) }
  ];
}
