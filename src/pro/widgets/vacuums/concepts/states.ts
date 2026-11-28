/** Named Vacuums states for the Widget Design Studio, built with the real model builder. */
import type { ResolvedEntity } from '@/types';
import { buildVacuumsOverviewModel, type ProVacuumsModel } from '../../../lib/overviewAppliances';
import type { WidgetState } from '../../../studio/types';

const vac = (id: string, name: string, area: string, state: string, attrs: Record<string, unknown> = {}) =>
  ({
    entity_id: `vacuum.${id}`,
    domain: 'vacuum',
    name,
    state,
    area_name: area,
    attributes: { friendly_name: name, fan_speed_list: ['Quiet', 'Balanced', 'Turbo', 'Max'], ...attrs }
  }) as unknown as ResolvedEntity;

const build = (entities: ResolvedEntity[]) => buildVacuumsOverviewModel([], entities);
const upstairs = vac('upstairs', 'Upstairs Robot', 'Bedroom', 'docked', { battery_level: 100, fan_speed: 'Balanced' });

export const VACUUMS_STATES: WidgetState<ProVacuumsModel>[] = [
  { id: 'cleaning', label: 'Cleaning', model: build([vac('downstairs', 'Downstairs Robot', 'Living Room', 'cleaning', { battery_level: 64, fan_speed: 'Turbo', current_room: 'Kitchen' }), upstairs]) },
  { id: 'docked', label: 'Docked', model: build([vac('downstairs', 'Downstairs Robot', 'Living Room', 'docked', { battery_level: 88, fan_speed: 'Balanced' })]) },
  { id: 'returning', label: 'Going home', model: build([vac('downstairs', 'Downstairs Robot', 'Living Room', 'returning', { battery_level: 18, fan_speed: 'Turbo' })]) },
  { id: 'paused', label: 'Paused', model: build([vac('downstairs', 'Downstairs Robot', 'Living Room', 'paused', { battery_level: 47, fan_speed: 'Quiet', current_room: 'Hallway' })]) },
  { id: 'error', label: 'Stuck', model: build([vac('downstairs', 'Downstairs Robot', 'Living Room', 'error', { battery_level: 33, current_room: 'Office' }), upstairs]) },
  { id: 'none', label: 'No robots', model: build([]) }
];
