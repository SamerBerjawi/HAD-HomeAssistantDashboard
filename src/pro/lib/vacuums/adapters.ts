/**
 * Vacuum adapters (docs/pro-ui/VACUUM_TILES.md): one Home Assistant device → a `Cleaner`, and the
 * page's actions → service calls. Entities are found by key (translation_key, else the unique_id
 * or entity_id suffix) with the Mobility adapters' kit, so renamed or second devices still work.
 *
 * - Dreame (Tasshack dreame-vacuum, platform `dreame_vacuum`): the robot, its self-wash station,
 *   wearing parts, lifetime totals and switches.
 * - Samsung stick (SmartThings, platform `smartthings`): every device with "in station" or
 *   "dust bag full" sensors: the stick, its clean station and its energy.
 * - Generic: every other `vacuum.*` (Roborock, Ecovacs, Xiaomi…) from the vacuum entity alone,
 *   plus `_left` / `_time_left` sensors when its device has them.
 */
import type { HAState } from '@/types';
import { devicesOf, entry, num, state, time, type Device, type HaCall, type HaContext } from '../mobility/kit';
import { humanise, type Activity, type Cleaner, type CleanerAction, type CleanerActionType, type Room, type Supply, type SupplyState, type WearPart } from './cleaner';

export type { HaContext };

export interface CleanerSource {
  cleaner: Cleaner;
  calls: (a: CleanerAction) => HaCall[];
}

const call = (domain: string, service: string, entityId: string | null | undefined, data: Record<string, unknown> = {}, optimistic?: HaCall['optimistic']): HaCall[] =>
  entityId ? [{ domain, service, data, entityId, ...(optimistic ? { optimistic } : {}) }] : [];

const isOn = (s: HAState | null) => (s ? ['on', 'true'].includes(String(s.state).toLowerCase()) : null);
const lower = (s: HAState | null) => String(s?.state ?? '').toLowerCase();
/** Values that mean "nothing to report" in integrations' enums. */
const NONE = /^(no[_ ]?error|no[_ ]?warning|none|ok|normal|idle)$/;

/** Fold a vacuum / status word into an Activity. Order matters: errors first, then station work. */
export function activityOf(...words: string[]): Activity {
  const w = words.map((x) => x.toLowerCase()).join(' ');
  if (/\b(error|fault|stuck|problem)\b/.test(w)) return 'error';
  if (/return/.test(w)) return 'returning';
  if (/paus/.test(w)) return 'paused';
  if (/wash/.test(w)) return 'washing';
  if (/dry/.test(w)) return 'drying';
  if (/empty/.test(w)) return 'emptying';
  if (/clean|sweep|mop|vacuum|spot|zone|segment/.test(w)) return 'cleaning';
  if (/charging_completed|charged|full/.test(w)) return 'docked';
  if (/charg/.test(w)) return 'charging';
  if (/dock/.test(w)) return 'docked';
  if (/idle|standby|sleep/.test(w)) return 'idle';
  return 'idle';
}

/** A station supply's enum in the few states the tiles need. */
export function supplyState(raw: string): SupplyState {
  const w = raw.toLowerCase();
  if (/not[_ ]?installed[_ ]?or[_ ]?full|full|check/.test(w)) return 'full';
  if (/not[_ ]?installed|missing|no[_ ]?(water|bag|tank)|remove/.test(w)) return 'missing';
  if (/low|lack|insufficient|empty/.test(w)) return 'low';
  if (/disabled|off|unknown/.test(w)) return 'off';
  return 'ok';
}

/** Rooms from what integrations put on the vacuum: a list, an id → name map, or Dreame's map name →
 *  `[{ id, name }]` (one map per floor). A room without an id is known by its name. */
export function roomsOf(v: unknown): Room[] {
  const out = new Map<string, Room>();
  const add = (segment: string, name: string, floor: string | null) => {
    const id = `${floor ?? ''}:${segment}`;
    out.set(id, { id, segment, name, floor });
  };
  const walk = (x: unknown, depth: number, key: string | undefined, floor: string | null) => {
    if (depth > 3 || x == null) return;
    const numeric = key !== undefined && /^\d+$/.test(key);
    if (typeof x === 'string') add(numeric ? key! : x, x, floor);
    else if (Array.isArray(x)) x.forEach((y) => walk(y, depth + 1, undefined, floor ?? (key !== undefined && !numeric ? key : null)));
    else if (typeof x === 'object') {
      const r = x as Record<string, unknown>;
      if (typeof r.name === 'string') {
        const id = r.id ?? r.segment_id ?? r.room_id;
        add(typeof id === 'string' || typeof id === 'number' ? String(id) : r.name, r.name, floor);
      } else Object.entries(r).forEach(([k, y]) => walk(y, depth + 1, k, floor));
    }
  };
  walk(v, 0, undefined, null);
  const rooms = [...out.values()];
  // One map: no floors to choose between.
  return new Set(rooms.map((r) => r.floor)).size > 1 ? rooms : rooms.map((r) => ({ ...r, floor: null }));
}

export const roomNames = (v: unknown): string[] => [...new Set(roomsOf(v).map((r) => r.name))];

const PARTS: { id: WearPart['id']; name: string; keys: string[] }[] = [
  { id: 'main', name: 'Main brush', keys: ['main_brush'] },
  { id: 'side', name: 'Side brush', keys: ['side_brush'] },
  { id: 'filter', name: 'Filter', keys: ['filter'] },
  { id: 'mop', name: 'Mop pad', keys: ['mop_pad', 'mop'] },
  { id: 'sensor', name: 'Sensors', keys: ['sensor_dirty', 'sensor'] },
  { id: 'wheel', name: 'Wheel', keys: ['wheel_dirty', 'wheel'] },
  { id: 'strainer', name: 'Strainer', keys: ['strainer'] },
  { id: 'brush_dock', name: 'Station brush', keys: ['cleaning_brush', 'dock_brush'] }
];

const firstState = (ctx: HaContext, d: Device, domain: string, keys: string[]) => {
  for (const k of keys) {
    const s = state(ctx, d, domain, k);
    if (s) return s;
  }
  return null;
};

/** Wearing parts from `<part>_left` (%) and `<part>_time_left` (h), with a reset button when there is one. */
function wearParts(ctx: HaContext, d: Device): WearPart[] {
  const out: WearPart[] = [];
  for (const p of PARTS) {
    const pct = firstState(ctx, d, 'sensor', p.keys.map((k) => `${k}_left`));
    const hrs = firstState(ctx, d, 'sensor', p.keys.map((k) => `${k}_time_left`));
    if (!pct && !hrs) continue;
    const percent = num(pct?.state);
    const unit = String(hrs?.attributes?.unit_of_measurement ?? 'h').toLowerCase();
    const raw = num(hrs?.state);
    const hoursLeft = raw === null ? null : unit.startsWith('d') ? raw * 24 : unit.startsWith('min') ? raw / 60 : raw;
    const reset = p.keys.some((k) => entry(d, 'button', `reset_${k}`));
    out.push({ id: p.id, name: p.name, percent: percent === null ? null : Math.round(percent), hoursLeft, canReset: reset });
  }
  return out;
}

/** The device's switches, as settings ("Carpet boost"). */
function switchesOf(ctx: HaContext, d: Device) {
  return d.entries
    .filter((e) => e.entity_id.startsWith('switch.') && e.entity_category !== 'diagnostic')
    .map((e) => ({ e, s: ctx.states[e.entity_id] }))
    .filter((x) => x.s && !['unavailable', 'unknown'].includes(x.s.state))
    .map(({ e, s }) => ({ id: e.entity_id, name: e.name || e.original_name || humanise(String(s.attributes?.friendly_name ?? e.entity_id).replace(/^.*?\./, '')), on: s.state === 'on' }));
}

const deviceLabel = (d: Device, fallback: string) => d.info?.name_by_user || d.info?.name || fallback;

/** History from Dreame's "Cleaning history" sensor: its attributes are runs keyed by date. */
export function historyOf(s: HAState | null): Cleaner['history'] {
  const a = s?.attributes ?? {};
  const out: Cleaner['history'] = [];
  for (const [k, v] of Object.entries(a)) {
    const at = time(k);
    if (at === null || !v || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>;
    out.push({ at, areaM2: num(r.cleaned_area ?? r.area), minutes: num(r.cleaning_time ?? r.duration), done: r.completed !== false && !/interrupt|incomplete/i.test(String(r.status ?? '')) });
  }
  return out.sort((x, y) => y.at - x.at).slice(0, 20);
}

// ---------------------------------------------------------------------------------------------
// Robots (Dreame and generic)
// ---------------------------------------------------------------------------------------------

function robot(d: Device, ctx: HaContext, dreame: boolean): CleanerSource | null {
  const vacEntry = d.entries.find((e) => e.entity_id.startsWith('vacuum.'));
  const vac = vacEntry ? ctx.states[vacEntry.entity_id] ?? null : null;
  if (!vacEntry || !vac) return null;
  const a = vac.attributes ?? {};
  const offline = ['unavailable', 'unknown'].includes(vac.state);
  const status = state(ctx, d, 'sensor', 'status') ?? state(ctx, d, 'sensor', 'state');
  const errS = state(ctx, d, 'sensor', 'error');
  const errWord = errS && !NONE.test(lower(errS)) ? humanise(errS.state) : vac.state === 'error' ? humanise(String(a.error ?? a.status ?? 'Error')) : null;
  const statusWord = String(status?.state ?? a.status ?? vac.state);
  const stationS = state(ctx, d, 'sensor', 'self_wash_base_status');
  const stationWord = stationS && !NONE.test(lower(stationS)) ? lower(stationS) : '';
  let activity: Activity = offline ? 'offline' : errWord ? 'error' : activityOf(vac.state, statusWord);
  // Docked robots report the station's work (washing, drying, emptying) on its own sensor.
  if (!offline && !errWord && ['docked', 'charging', 'idle'].includes(activity) && stationWord) {
    const st = activityOf(stationWord);
    if (st === 'washing' || st === 'drying' || st === 'emptying') activity = st;
  }
  const autoEmpty = state(ctx, d, 'sensor', 'auto_empty_status');
  if (!offline && !errWord && ['docked', 'charging', 'idle'].includes(activity) && autoEmpty && /empty/.test(lower(autoEmpty)) && !/idle|not/.test(lower(autoEmpty))) activity = 'emptying';

  const battery = num(state(ctx, d, 'sensor', 'battery_level')?.state ?? a.battery_level);
  const chargingBin = state(ctx, d, 'binary_sensor', 'charging_state');
  const charging = chargingBin ? isOn(chargingBin) : activity === 'charging';
  if (activity === 'docked' && charging && battery !== null && battery < 100) activity = 'charging';

  const area = num(state(ctx, d, 'sensor', 'cleaned_area')?.state ?? a.cleaned_area);
  const minutes = num(state(ctx, d, 'sensor', 'cleaning_time')?.state ?? a.cleaning_time);
  const mode = [a.cleaning_mode, a.suction_level ?? a.fan_speed].filter((x) => typeof x === 'string' && x).map((x) => humanise(String(x))).join(' · ') || null;
  const room = typeof a.current_segment === 'object' && a.current_segment ? roomNames(a.current_segment)[0] ?? null : typeof a.current_room === 'string' ? a.current_room : null;

  const SUPPLIES: { id: Supply['id']; name: string; key: string }[] = [
    { id: 'clean', name: 'Clean water', key: 'clean_water_tank_status' },
    { id: 'dirty', name: 'Dirty water', key: 'dirty_water_tank_status' },
    { id: 'dust', name: 'Dust bag', key: 'dust_bag_status' },
    { id: 'detergent', name: 'Detergent', key: 'detergent_status' },
    { id: 'hot', name: 'Hot water', key: 'hot_water_status' },
    { id: 'drain', name: 'Drainage', key: 'station_drainage_status' },
    { id: 'mop', name: 'Mop pads', key: 'mop_pad' }
  ];
  const supplies: Supply[] = [];
  for (const s of SUPPLIES) {
    const st = state(ctx, d, 'sensor', s.key);
    if (!st) continue;
    let ss = supplyState(st.state);
    if (s.id === 'drain') ss = /fail/.test(lower(st)) ? 'full' : 'ok';
    if (s.id === 'mop') ss = /not[_ ]?installed|missing/.test(lower(st)) ? 'missing' : 'ok';
    if (s.id === 'hot') ss = /disabled|off/.test(lower(st)) ? 'off' : 'ok';
    supplies.push({ id: s.id, name: s.name, state: ss, raw: humanise(st.state) });
  }
  const lowWater = state(ctx, d, 'sensor', 'low_water_warning');
  const clean = supplies.find((s) => s.id === 'clean');
  if (lowWater && !NONE.test(lower(lowWater)) && clean && clean.state === 'ok') clean.state = 'low';
  const station = supplies.length || stationS ? { doing: stationWord ? humanise(stationWord) : null, supplies } : null;

  const lifetime = {
    areaM2: num(state(ctx, d, 'sensor', 'total_cleaned_area')?.state),
    minutes: num(state(ctx, d, 'sensor', 'total_cleaning_time')?.state),
    count: num(state(ctx, d, 'sensor', 'cleaning_count')?.state),
    since: time(state(ctx, d, 'sensor', 'first_cleaning_date')?.state)
  };
  const hasLifetime = Object.values(lifetime).some((x) => x !== null);

  const sf = num(a.supported_features) ?? 0;
  const btn = (keys: string[]) => keys.map((k) => entry(d, 'button', k)?.entity_id).find(Boolean) ?? null;
  const washBtn = btn(['self_clean', 'start_washing', 'wash']);
  const dryBtn = btn(['manual_drying', 'start_drying', 'drying']);
  const emptyBtn = btn(['start_auto_empty', 'auto_empty', 'empty_dust']);
  const actions: CleanerActionType[] = [];
  // HA's START (8192) or TURN_ON (1); robots without the bitmask get the basics.
  if (!sf || sf & 8192 || sf & 1) actions.push('start');
  if (!sf || sf & 4) actions.push('pause');
  if (!sf || sf & 16) actions.push('dock');
  if (sf & 512) actions.push('locate');
  if (washBtn) actions.push('wash');
  if (dryBtn) actions.push('dry');
  if (emptyBtn) actions.push('empty');
  const settings = switchesOf(ctx, d);
  if (settings.length) actions.push('setting');
  const parts = wearParts(ctx, d);
  if (parts.some((p) => p.canReset)) actions.push('reset');
  const rooms = roomsOf(a.rooms ?? a.segments);
  // shortcut: only Dreame cleans by room; others need HA's vacuum.clean_area with areas mapped to segments (2026.3+), add when a non-Dreame owner asks.
  if (dreame && rooms.length) actions.push('rooms');

  const id = vacEntry.entity_id;
  const cleaner: Cleaner = {
    id: `${dreame ? 'dreame' : 'vacuum'}:${d.id}`,
    kind: 'robot',
    name: deviceLabel(d, String(a.friendly_name ?? 'Robot vacuum')),
    make: d.info?.manufacturer ?? (dreame ? 'Dreame' : null),
    model: d.info?.model ?? null,
    integration: vacEntry.platform ?? 'vacuum',
    activity,
    status: humanise(statusWord),
    battery: battery === null ? null : Math.round(battery),
    charging,
    error: errWord,
    run: area !== null || minutes !== null || mode || room ? { areaM2: area, minutes, mode, room, at: null } : null,
    rooms,
    floor: rooms.some((r) => r.floor) ? (typeof a.selected_map === 'string' ? a.selected_map : null) : null,
    station,
    parts,
    lifetime: hasLifetime ? lifetime : null,
    settings,
    dock: null,
    energy: null,
    history: historyOf(state(ctx, d, 'sensor', 'cleaning_history')),
    actions,
    seen: time(vac.last_updated)
  };
  return {
    cleaner,
    calls: (x) => {
      switch (x.type) {
        case 'start':
          return call('vacuum', 'start', id, {}, { state: 'cleaning' });
        case 'pause':
          return call('vacuum', 'pause', id, {}, { state: 'paused' });
        case 'dock':
          return call('vacuum', 'return_to_base', id, {}, { state: 'returning' });
        case 'locate':
          return call('vacuum', 'locate', id);
        case 'wash':
          return call('button', 'press', washBtn);
        case 'dry':
          return call('button', 'press', dryBtn);
        case 'empty':
          return call('button', 'press', emptyBtn);
        case 'setting':
          return call('switch', x.on ? 'turn_on' : 'turn_off', settings.find((s) => s.id === x.id)?.id, {}, { state: x.on ? 'on' : 'off' });
        case 'rooms': {
          // Dreame cleans segments of the map it is on, as numbers, in this order.
          const segs = x.ids.map((i) => rooms.find((r) => r.id === i)?.segment).filter((s): s is string => !!s);
          return segs.length ? call('dreame_vacuum', 'vacuum_clean_segment', id, { segments: segs.map((s) => (/^\d+$/.test(s) ? Number(s) : s)) }, { state: 'cleaning' }) : [];
        }
        case 'reset': {
          const keys = PARTS.find((p) => p.id === x.part)?.keys ?? [];
          return call('button', 'press', keys.map((k) => entry(d, 'button', `reset_${k}`)?.entity_id).find(Boolean));
        }
        default:
          return [];
      }
    }
  };
}

// ---------------------------------------------------------------------------------------------
// Sticks in a clean station (Samsung Bespoke Jet via SmartThings)
// ---------------------------------------------------------------------------------------------

function stick(d: Device, ctx: HaContext): CleanerSource | null {
  const inStation = state(ctx, d, 'binary_sensor', 'stick_cleaner_in_station');
  const bag = state(ctx, d, 'binary_sensor', 'dust_bag_full');
  if (!inStation && !bag && !entry(d, 'binary_sensor', 'stick_cleaner_in_station')) return null;
  const chargingS = state(ctx, d, 'binary_sensor', 'charging');
  const emptySw = entry(d, 'switch', 'empty_dustbin');
  const emptyS = emptySw ? ctx.states[emptySw.entity_id] ?? null : null;
  const main = d.entries.find((e) => e.entity_id.startsWith('sensor.') && !/_(battery|energy|power|energy_difference|power_energy|energy_saved|dust_bag_cycles|last_emptied)$/.test(e.entity_id));
  const mainS = main ? ctx.states[main.entity_id] ?? null : null;
  const home = isOn(inStation);
  const emptying = isOn(emptyS) === true;
  const offline = !inStation && !bag && !chargingS;
  const charging = isOn(chargingS);
  const activity: Activity = offline ? 'offline' : emptying ? 'emptying' : home === false ? 'in-use' : charging ? 'charging' : 'docked';
  const kwh = (s: HAState | null) => {
    const v = num(s?.state);
    if (v === null) return null;
    return String(s?.attributes?.unit_of_measurement ?? 'kWh').toLowerCase() === 'wh' ? v / 1000 : v;
  };
  const cleaner: Cleaner = {
    id: `stick:${d.id}`,
    kind: 'stick',
    name: deviceLabel(d, 'Stick vacuum'),
    make: d.info?.manufacturer ?? 'Samsung',
    model: d.info?.model ?? null,
    integration: d.entries[0]?.platform ?? 'smartthings',
    activity,
    status: mainS && !['unknown', 'unavailable'].includes(mainS.state) ? humanise(mainS.state) : '',
    battery: num(state(ctx, d, 'sensor', 'battery')?.state),
    charging,
    error: null,
    run: null,
    rooms: [],
    floor: null,
    station: null,
    parts: [],
    lifetime: null,
    settings: [],
    dock: {
      inStation: home,
      bagFull: isOn(bag),
      cycles: num(state(ctx, d, 'sensor', 'dust_bag_cycles')?.state),
      lastEmptied: time(state(ctx, d, 'sensor', 'last_emptied')?.state),
      emptying
    },
    energy: {
      powerW: num(state(ctx, d, 'sensor', 'power')?.state),
      kWh: kwh(state(ctx, d, 'sensor', 'energy')),
      savedKwh: kwh(state(ctx, d, 'sensor', 'energy_saved')),
      lastKwh: kwh(state(ctx, d, 'sensor', 'energy_difference'))
    },
    history: [],
    actions: emptySw ? ['empty'] : [],
    seen: time(inStation?.last_updated ?? bag?.last_updated)
  };
  return { cleaner, calls: (x) => (x.type === 'empty' ? call('switch', 'turn_on', emptySw?.entity_id, {}, { state: 'on' }) : []) };
}

// ---------------------------------------------------------------------------------------------

/** Every cleaner Home Assistant knows: Dreame robots, Samsung sticks, then any other vacuum. */
export function cleanerSources(ctx: HaContext): CleanerSource[] {
  const out: CleanerSource[] = [];
  const taken = new Set<string>();
  for (const d of devicesOf(ctx, 'dreame_vacuum')) {
    const s = robot(d, ctx, true);
    if (s) out.push(s);
    taken.add(d.id);
  }
  for (const d of devicesOf(ctx, null, taken)) {
    const s = d.entries.some((e) => e.entity_id.startsWith('vacuum.')) ? robot(d, ctx, false) : stick(d, ctx);
    if (s) out.push(s);
  }
  // Robots before sticks, then by name, so the order is stable.
  return out.sort((a, b) => (a.cleaner.kind === b.cleaner.kind ? a.cleaner.name.localeCompare(b.cleaner.name) : a.cleaner.kind === 'robot' ? -1 : 1));
}
