/** Named Scenes states for the Widget Design Studio, built with the real model builder. */
import type { ResolvedEntity } from '@/types';
import { buildScenesModel, type ProScenesModel } from '../../../lib/overviewScenes';
import type { WidgetState } from '../../../studio/types';

const ago = (min: number | null) => (min === null ? 'unknown' : new Date(Date.now() - min * 60_000).toISOString());
const scene = (id: string, name: string, room: string, minutesAgo: number | null) =>
  ({ entity_id: `scene.${id}`, domain: 'scene', name, state: ago(minutesAgo), area: { name: room }, attributes: { friendly_name: name } }) as unknown as ResolvedEntity;

const HOME = [
  scene('movie', 'Cozy Movie Night', 'Living Room', 25),
  scene('focus', 'Bright Work Focus', 'Office', 600),
  scene('dinner', 'Relaxing Dinner', 'Kitchen', 1500),
  scene('off', 'All Lights Off', 'Hallway', 900),
  scene('party', 'Party & Celebration', 'Living Room', 9000),
  scene('morning', 'Good Morning', 'Bedroom', 780)
];

export const SCENES_STATES: WidgetState<ProScenesModel>[] = [
  { id: 'movie', label: 'Movie on', model: buildScenesModel(HOME) },
  { id: 'none', label: 'None active', model: buildScenesModel(HOME.map((s, i) => ({ ...s, state: ago(600 + i * 60) }) as ResolvedEntity)) },
  { id: 'dinner', label: 'Dinner on', model: buildScenesModel(HOME.map((s) => (s.entity_id === 'scene.dinner' ? ({ ...s, state: ago(5) } as ResolvedEntity) : s))) },
  {
    id: 'many',
    label: 'Many scenes',
    model: buildScenesModel([
      ...HOME,
      scene('read', 'Reading Nook', 'Living Room', null),
      scene('romantic', 'Romantic Evening', 'Dining Room', null),
      scene('kids', 'Kids Bedtime', 'Kids Room', 2000),
      scene('away', 'Away Mode', 'Hallway', 5000)
    ])
  },
  { id: 'two', label: 'Two scenes', model: buildScenesModel(HOME.slice(0, 2)) },
  { id: 'empty', label: 'No scenes', model: buildScenesModel([]) }
];
