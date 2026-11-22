/**
 * Scenes view model for the Overview (WIDGET_DESIGN.md Phase 2, new widget). Pure. A scene's
 * state in Home Assistant is the time it was last activated, so "current" is the most recent one
 * (within a few hours; older than that, nothing is shown as current).
 */
import type { ResolvedEntity } from '@/types';
import { deriveShortName, resolveControlRoomName } from './overviewControls';

/** A colour family from the scene's name, so each scene has its own look (D1: from content). */
export type SceneMood = 'cinema' | 'focus' | 'dining' | 'night' | 'party' | 'morning' | 'relax' | 'other';

export interface ProSceneItem {
  entityId: string;
  name: string;
  shortName: string;
  roomName: string;
  mood: SceneMood;
  /** Last activation (ms), null when never. */
  lastActivated: number | null;
}

export interface ProScenesModel {
  items: ProSceneItem[];
  /** The most recently activated scene, if it was activated within `CURRENT_WINDOW_MS`. */
  current: ProSceneItem | null;
  totalCount: number;
}

export const CURRENT_WINDOW_MS = 4 * 60 * 60 * 1000;

const MOODS: [SceneMood, RegExp][] = [
  ['cinema', /movie|cinema|film|tv|watch/i],
  ['focus', /focus|work|bright|read|study|concentrat/i],
  ['dining', /dinner|dining|lunch|breakfast|meal|cook/i],
  ['night', /night|off|sleep|bed|good ?night|away/i],
  ['party', /party|celebrat|disco|fun/i],
  ['morning', /morning|wake|sunrise|day/i],
  ['relax', /relax|cozy|cosy|calm|chill|evening|romantic/i]
];

export function sceneMood(name: string): SceneMood {
  return MOODS.find(([, re]) => re.test(name))?.[0] ?? 'other';
}

export function buildScenesModel(entities: ResolvedEntity[], now: number = Date.now()): ProScenesModel {
  const items = entities.map((e): ProSceneItem => {
    const name = e.name || (typeof e.attributes?.friendly_name === 'string' ? e.attributes.friendly_name : '') || e.entity_id;
    const roomName = resolveControlRoomName(e);
    const t = Date.parse(e.state ?? '');
    return { entityId: e.entity_id, name, shortName: deriveShortName(name, roomName), roomName, mood: sceneMood(name), lastActivated: Number.isFinite(t) ? t : null };
  });
  const recent = [...items].filter((i) => i.lastActivated !== null).sort((a, b) => (b.lastActivated ?? 0) - (a.lastActivated ?? 0))[0];
  const current = recent && now - (recent.lastActivated ?? 0) <= CURRENT_WINDOW_MS ? recent : null;
  return { items, current, totalCount: items.length };
}
