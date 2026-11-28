/**
 * The Vacuums page's brand-neutral model (docs/pro-ui/VACUUM_TILES.md). An adapter
 * (`./adapters.ts`) turns one Home Assistant device into a `Cleaner`: a robot (Dreame, Roborock,
 * any `vacuum.*`) or a stick in its station (Samsung Bespoke Jet). Anything a model lacks stays
 * null or empty and its tile says so, so the page works for every make.
 */

export type CleanerKind = 'robot' | 'stick';

/** What it is doing now, folded from the many words integrations use. */
export type Activity = 'cleaning' | 'returning' | 'paused' | 'washing' | 'drying' | 'emptying' | 'charging' | 'docked' | 'idle' | 'in-use' | 'error' | 'offline';

/** One station supply (tank, bag, detergent) in the few states a tile needs. */
export type SupplyState = 'ok' | 'low' | 'full' | 'missing' | 'off';
export interface Supply {
  id: 'clean' | 'dirty' | 'dust' | 'detergent' | 'hot' | 'drain' | 'mop';
  name: string;
  state: SupplyState;
  /** The integration's word, humanised ("Low water"). */
  raw: string;
}

/** A wearing part: % of life left and hours to go, when reported. */
export interface WearPart {
  id: 'main' | 'side' | 'filter' | 'sensor' | 'wheel' | 'mop' | string;
  name: string;
  percent: number | null;
  hoursLeft: number | null;
  /** Reset after replacing it, when the integration offers a button. */
  canReset: boolean;
}

/** A room the robot knows (a map segment), with the id its integration cleans it by. */
export interface Room {
  /** Unique on this robot (maps can reuse segment numbers). */
  id: string;
  /** What the integration cleans it by (Dreame's segment number). */
  segment: string;
  name: string;
  /** The map it is on, for robots with a map per floor; null with one map. */
  floor: string | null;
}

export interface Cleaner {
  id: string;
  kind: CleanerKind;
  name: string;
  make: string | null;
  model: string | null;
  integration: string;
  activity: Activity;
  /** The integration's own status, humanised ("Sweeping and mopping"). */
  status: string;
  battery: number | null;
  charging: boolean | null;
  /** What is wrong, in its words; null when nothing is. */
  error: string | null;
  /** The run under way, or the last one. */
  run: { areaM2: number | null; minutes: number | null; mode: string | null; room: string | null; at: number | null } | null;
  rooms: Room[];
  /** The floor (map) the robot is on now, when it has several. */
  floor: string | null;
  /** The robot's station (self-wash base): what it is doing and its supplies. */
  station: { doing: string | null; supplies: Supply[] } | null;
  parts: WearPart[];
  lifetime: { areaM2: number | null; minutes: number | null; count: number | null; since: number | null } | null;
  /** The device's own switches ("Carpet boost"). */
  settings: { id: string; name: string; on: boolean }[];
  /** The stick's clean station: is the stick home, the dust bag, the last empty. */
  dock: { inStation: boolean | null; bagFull: boolean | null; cycles: number | null; lastEmptied: number | null; emptying: boolean } | null;
  energy: { powerW: number | null; kWh: number | null; savedKwh: number | null; lastKwh: number | null } | null;
  /** Recent runs, newest first, when the integration keeps a history. */
  history: { at: number; areaM2: number | null; minutes: number | null; done: boolean }[];
  actions: CleanerActionType[];
  seen: number | null;
}

export type CleanerActionType = 'start' | 'pause' | 'dock' | 'locate' | 'empty' | 'wash' | 'dry' | 'setting' | 'reset' | 'rooms';
export type CleanerAction =
  | { type: 'start' | 'pause' | 'dock' | 'locate' | 'empty' | 'wash' | 'dry' }
  | { type: 'setting'; id: string; on: boolean }
  | { type: 'reset'; part: string }
  /** Clean these rooms (ids from `rooms`), in this order. */
  | { type: 'rooms'; ids: string[] };

export interface CleanersHome {
  now: number;
  cleaners: Cleaner[];
}

// ---------------------------------------------------------------------------------------------
// Words the tiles share
// ---------------------------------------------------------------------------------------------

/** "sweeping_and_mopping" → "Sweeping and mopping". */
export const humanise = (s: string) => {
  const t = s.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return t ? t[0].toUpperCase() + t.slice(1) : '';
};

export const busy = (c: Cleaner) => c.activity === 'cleaning' || c.activity === 'returning';

/** The supplies that need the owner (low, full, missing), worst first. */
export function chores(c: Cleaner): { supply: Supply; todo: string }[] {
  const out: { supply: Supply; todo: string; rank: number }[] = [];
  for (const s of c.station?.supplies ?? []) {
    if (s.state === 'ok' || s.state === 'off') continue;
    const todo =
      s.state === 'missing'
        ? `Put the ${s.name.toLowerCase()} back`
        : s.id === 'clean'
          ? 'Refill clean water'
          : s.id === 'dirty'
            ? 'Empty dirty water'
            : s.id === 'dust'
              ? 'Replace the dust bag'
              : s.id === 'detergent'
                ? 'Top up detergent'
                : s.raw || s.name;
    out.push({ supply: s, todo, rank: s.state === 'missing' ? 0 : s.state === 'full' ? 1 : 2 });
  }
  if (c.dock?.bagFull) out.push({ supply: { id: 'dust', name: 'Dust bag', state: 'full', raw: 'Full' }, todo: 'Replace the dust bag', rank: 1 });
  return out.sort((a, b) => a.rank - b.rank).map(({ supply, todo }) => ({ supply, todo }));
}

/** Parts at or under 10% are due, under 25% soon (the apps' own thresholds are close to this). */
export const wearTone = (p: WearPart): 'due' | 'soon' | 'ok' | 'unknown' => (p.percent === null ? 'unknown' : p.percent <= 10 ? 'due' : p.percent <= 25 ? 'soon' : 'ok');
export const partsBySoonest = (c: Cleaner) => [...c.parts].sort((a, b) => (a.percent ?? 101) - (b.percent ?? 101));

/** "12 h", "3 days", "5 weeks". */
export function hoursText(h: number | null): string {
  if (h === null) return '—';
  if (h < 48) return `${Math.round(h)} h`;
  const d = h / 24;
  return d < 21 ? `${Math.round(d)} days` : `${Math.round(d / 7)} weeks`;
}

export function minutesText(m: number | null): string {
  if (m === null) return '—';
  if (m < 60) return `${Math.round(m)} min`;
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return r ? `${h} h ${r} min` : `${h} h`;
}

/** The verdict the status tiles lead with, and its tone (green fine, orange a look, red a problem). */
export function statusWords(c: Cleaner): { word: string; detail: string; tone: 'on' | 'ok' | 'watch' | 'bad' | 'idle' } {
  const run = c.run;
  const done = [run?.areaM2 != null ? `${run.areaM2} m²` : null, run?.minutes != null ? minutesText(run.minutes) : null].filter(Boolean).join(' · ');
  const todo = chores(c)[0]?.todo;
  switch (c.activity) {
    case 'offline':
      return { word: 'Offline', detail: 'Not reporting', tone: 'idle' };
    case 'error':
      return { word: 'Needs help', detail: c.error ?? 'Check the robot', tone: 'bad' };
    case 'cleaning':
      return { word: c.kind === 'stick' ? 'In use' : 'Cleaning', detail: [run?.room, done].filter(Boolean).join(' · ') || c.status, tone: 'on' };
    case 'in-use':
      return { word: 'Off the station', detail: c.battery !== null ? `${c.battery}% battery` : 'In use', tone: 'on' };
    case 'returning':
      return { word: 'Going home', detail: done ? `Done: ${done}` : 'Back to the station', tone: 'on' };
    case 'paused':
      return { word: 'Paused', detail: [run?.room, done].filter(Boolean).join(' · '), tone: 'watch' };
    case 'washing':
      return { word: 'Washing mop', detail: c.station?.doing ?? 'At the station', tone: 'on' };
    case 'drying':
      return { word: 'Drying mop', detail: c.station?.doing ?? 'At the station', tone: 'on' };
    case 'emptying':
      return { word: 'Emptying', detail: 'Into the dust bag', tone: 'on' };
    default: {
      if (todo) return { word: c.activity === 'charging' ? 'Charging' : 'Docked', detail: todo, tone: 'watch' };
      const ready = c.kind === 'stick' ? 'Ready' : 'Ready to clean';
      return { word: c.activity === 'charging' ? 'Charging' : ready, detail: c.activity === 'charging' && c.battery !== null ? `${c.battery}%` : run?.at ? 'Last clean done' : '', tone: 'ok' };
    }
  }
}

/** The one main action for the moment: Pause while cleaning, Resume when paused, otherwise Start. */
export function mainAction(c: Cleaner): { label: string; type: 'start' | 'pause' } | null {
  if (c.kind === 'stick' || !c.actions.includes('start')) return null;
  if (c.activity === 'cleaning') return c.actions.includes('pause') ? { label: 'Pause', type: 'pause' } : null;
  if (c.activity === 'paused') return { label: 'Resume', type: 'start' };
  if (c.activity === 'error') return { label: 'Retry', type: 'start' };
  return { label: 'Start', type: 'start' };
}

// ---------------------------------------------------------------------------------------------
// The studio's stand-in for Home Assistant: what each action would do to the sample.
// ---------------------------------------------------------------------------------------------

export function applySampleAction(c: Cleaner, a: CleanerAction): Cleaner {
  switch (a.type) {
    case 'start':
      return { ...c, activity: 'cleaning', status: 'Sweeping', error: null, run: { areaM2: c.activity === 'paused' ? c.run?.areaM2 ?? 0 : 0, minutes: c.activity === 'paused' ? c.run?.minutes ?? 0 : 0, mode: c.run?.mode ?? null, room: c.rooms[0]?.name ?? null, at: null } };
    case 'pause':
      return { ...c, activity: 'paused', status: 'Paused' };
    case 'dock':
      return { ...c, activity: 'returning', status: 'Returning' };
    case 'empty':
      return c.kind === 'stick' ? { ...c, activity: 'emptying', dock: c.dock && { ...c.dock, emptying: true, cycles: (c.dock.cycles ?? 0) + 1, lastEmptied: Date.now() } } : { ...c, activity: 'emptying' };
    case 'wash':
      return { ...c, activity: 'washing', station: c.station && { ...c.station, doing: 'Washing the mop pads' } };
    case 'dry':
      return { ...c, activity: 'drying', station: c.station && { ...c.station, doing: 'Drying · 2 h left' } };
    case 'setting':
      return { ...c, settings: c.settings.map((s) => (s.id === a.id ? { ...s, on: a.on } : s)) };
    case 'rooms': {
      const names = a.ids.map((id) => c.rooms.find((r) => r.id === id)?.name).filter(Boolean);
      return { ...c, activity: 'cleaning', status: 'Room cleaning', error: null, run: { areaM2: 0, minutes: 0, mode: c.run?.mode ?? null, room: names[0] ?? null, at: null } };
    }
    case 'reset':
      return { ...c, parts: c.parts.map((p) => (p.id === a.part ? { ...p, percent: 100, hoursLeft: p.hoursLeft !== null ? Math.max(p.hoursLeft, 150) : null } : p)) };
    default:
      return c;
  }
}
