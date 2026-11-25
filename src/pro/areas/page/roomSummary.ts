/**
 * What the Area page says about the room (batch 6), from its tiles' state: the facts for the
 * header (temperature, humidity, lights on), what is "active now" (on, running or needing
 * attention), and one plain sentence. Pure, so it can be tested and reused by the real page.
 */
import {
  Alert02Icon,
  BulbIcon,
  CheckmarkCircle02Icon,
  Door01Icon,
  MusicNote01Icon,
  SquareUnlock02Icon,
  ThermometerIcon,
  WalkingIcon
} from '@hugeicons/core-free-icons';
import { plural, type SentencePart } from '../../lib/pageSentences';
import type { TileModel } from '../tileTypes';

/** On, running or needing a look: what concept C puts under "Now". */
export function isActive(m: TileModel): boolean {
  if (!m.available) return false;
  switch (m.kind) {
    case 'light':
    case 'fan':
    case 'opening':
    case 'motion':
    case 'safety':
      return m.isOn;
    case 'switch':
      return m.isOn && m.role !== 'helper';
    case 'media':
      return m.playing;
    case 'climate':
      return m.action === 'heating' || m.action === 'cooling';
    case 'lock':
      return m.state !== 'locked';
    case 'vacuum':
      return m.state === 'cleaning' || m.state === 'returning' || m.state === 'error';
    case 'car':
      return m.charging === 'charging' || m.climateOn === true || m.locked === false;
    case 'cover':
      return m.moving !== null;
    default:
      return false;
  }
}

/** Needs attention (shown first, in the alert colour). */
export function isAlert(m: TileModel): boolean {
  if (!m.available) return false;
  if (m.kind === 'safety') return m.isOn;
  if (m.kind === 'lock') return m.state === 'jammed';
  if (m.kind === 'vacuum') return m.state === 'error';
  return false;
}

const minutesAgo = (t: number | null, now: number) => (t ? Math.max(0, Math.round((now - t) / 60000)) : null);
const forText = (min: number | null) => (min === null ? '' : min < 60 ? ` for ${min} min` : ` for ${Math.floor(min / 60)} h`);

export interface RoomFacts {
  temperature: number | null;
  humidity: number | null;
  lightsOn: number;
  lights: number;
}

export function roomFacts(models: readonly TileModel[]): RoomFacts {
  const reading = (cls: string) => models.find((m) => m.kind === 'reading' && m.deviceClass === cls && m.available && m.value !== null);
  const climate = models.find((m) => m.kind === 'climate' && m.current !== null);
  const t = reading('temperature');
  const h = reading('humidity');
  const lights = models.filter((m) => m.kind === 'light' && m.available);
  return {
    temperature: t && t.kind === 'reading' ? t.value : climate && climate.kind === 'climate' ? climate.current : null,
    humidity: h && h.kind === 'reading' ? h.value : null,
    lightsOn: lights.filter((m) => m.isOn).length,
    lights: lights.length
  };
}

/** Builds concise chip-styled status parts for one room's compact hero header. */
export function roomSentenceParts(models: readonly TileModel[]): SentencePart[] {
  const live = models.filter((m) => m.available);
  const clauses: SentencePart[][] = [];

  for (const m of live.filter(isAlert)) {
    const label =
      m.kind === 'safety'
        ? `${m.name}: ${m.deviceClass === 'moisture' ? 'leak' : m.deviceClass.replace(/_/g, ' ')}`
        : m.kind === 'lock'
        ? `${m.name} jammed`
        : `${m.name} error`;
    clauses.push([{ icon: Alert02Icon, label, tone: 'danger' }]);
  }

  const lightsOn = live.filter((m) => m.kind === 'light' && m.isOn).length;
  if (lightsOn > 0) {
    clauses.push([{ icon: BulbIcon, label: plural(lightsOn, 'light'), tone: 'warning' }, ' on']);
  }

  const openings = live.filter((m) => m.kind === 'opening');
  const openList = openings.filter((m) => m.isOn);
  if (openList.length > 0) {
    clauses.push([{ icon: Door01Icon, label: plural(openList.length, 'opening'), tone: 'warning' }, ' open']);
  } else if (openings.length > 0) {
    clauses.push(['doors and windows are ', { icon: CheckmarkCircle02Icon, label: 'closed', tone: 'success' }]);
  }

  const motionOn = live.some((m) => m.kind === 'motion' && m.isOn);
  if (motionOn) {
    clauses.push([{ icon: WalkingIcon, label: 'motion', tone: 'default' }]);
  }

  const playingCount = live.filter((m) => m.kind === 'media' && m.playing).length;
  if (playingCount > 0) {
    clauses.push([{ icon: MusicNote01Icon, label: plural(playingCount, 'player'), tone: 'accent' }, ' playing']);
  }

  const climateActive = live.find(
    (m): m is Extract<TileModel, { kind: 'climate' }> =>
      m.kind === 'climate' && (m.action === 'heating' || m.action === 'cooling') && m.target !== null
  );
  if (climateActive) {
    clauses.push([
      {
        icon: ThermometerIcon,
        label: `${climateActive.action === 'heating' ? 'Heating' : 'Cooling'} ${climateActive.target}°`,
        tone: 'accent'
      }
    ]);
  }

  const unlockedCount = live.filter((m) => m.kind === 'lock' && m.state === 'unlocked').length;
  if (unlockedCount > 0) {
    clauses.push([{ icon: SquareUnlock02Icon, label: `${unlockedCount} unlocked`, tone: 'warning' }]);
  }

  if (clauses.length === 0) return ['All quiet.'];

  const out: SentencePart[] = ['Right now: '];
  clauses.forEach((clause, i) => {
    if (i > 0) out.push(i === clauses.length - 1 ? ' and ' : ', ');
    out.push(...clause);
  });
  return out;
}

/** One sentence: alerts first, then what is going on, else "All quiet". */
export function roomSentence(models: readonly TileModel[], now = Date.now()): string {
  const parts: string[] = [];
  for (const m of models.filter(isAlert)) parts.push(m.kind === 'safety' ? `${m.name}: ${m.deviceClass === 'moisture' ? 'leak' : m.deviceClass.replace(/_/g, ' ')} detected` : m.kind === 'lock' ? `${m.name} is jammed` : `${m.name} needs help`);
  const on = models.filter((m) => m.kind === 'light' && m.available && m.isOn).length;
  if (on) parts.push(`${on} light${on > 1 ? 's' : ''} on`);
  for (const m of models) {
    if (!m.available || isAlert(m)) continue;
    if (m.kind === 'media' && m.playing) parts.push(m.deviceClass === 'tv' ? `${m.name} on` : 'music playing');
    else if (m.kind === 'opening' && m.isOn) parts.push(`${m.name.toLowerCase()} open${forText(minutesAgo(m.lastChanged, now))}`);
    else if (m.kind === 'climate' && (m.action === 'heating' || m.action === 'cooling') && m.target !== null) parts.push(`${m.action} to ${m.target}°`);
    else if (m.kind === 'lock' && m.state !== 'locked') parts.push(`${m.name.toLowerCase()} unlocked`);
    else if (m.kind === 'vacuum' && m.state === 'cleaning') parts.push(`${m.name.toLowerCase()} cleaning`);
  }
  const seen = new Set<string>();
  const unique = parts.filter((p) => (seen.has(p) ? false : (seen.add(p), true)));
  if (!unique.length) return 'All quiet.';
  const text = unique.join(', ');
  return `${text[0].toUpperCase()}${text.slice(1)}.`;
}

/** A few words for a section heading ("3 of 6 on", "Window open", "Playing"). */
export function sectionSummary(section: string, models: readonly TileModel[]): string {
  const live = models.filter((m) => m.available);
  switch (section) {
    case 'lights': {
      const on = live.filter((m) => m.isOn).length;
      return on ? `${on} of ${models.length} on` : 'All off';
    }
    case 'security': {
      const alert = live.find(isAlert);
      if (alert) return `${alert.name}: needs a look`;
      const open = live.filter((m) => m.kind === 'opening' && m.isOn);
      const unlocked = live.filter((m) => m.kind === 'lock' && m.state !== 'locked');
      if (open.length || unlocked.length) return [...open.map((m) => `${m.name} open`), ...unlocked.map((m) => `${m.name} unlocked`)].join(' · ');
      return 'All closed';
    }
    case 'media': {
      const playing = live.filter((m) => m.kind === 'media' && m.playing).length;
      return playing ? 'Playing' : 'Quiet';
    }
    case 'climate': {
      const c = live.find((m) => m.kind === 'climate');
      return c && c.kind === 'climate' && c.action && c.action !== 'idle' && c.action !== 'off' ? `${c.action[0].toUpperCase()}${c.action.slice(1)} to ${c.target}°` : '';
    }
    case 'scenes':
      return '';
    default: {
      const on = live.filter(isActive).length;
      return on ? `${on} on` : '';
    }
  }
}
