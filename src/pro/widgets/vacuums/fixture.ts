/** Demo/test model for the Vacuums widget. */
import type { ResolvedEntity } from '@/types';
import { buildVacuumsOverviewModel } from '../../lib/overviewAppliances';

const vac = (id: string, name: string, area: string, state: string, attrs: Record<string, unknown> = {}) =>
  ({ entity_id: `vacuum.${id}`, domain: 'vacuum', name, state, area_name: area, attributes: { friendly_name: name, fan_speed_list: ['Quiet', 'Balanced', 'Turbo', 'Max'], ...attrs } }) as unknown as ResolvedEntity;

export const VACUUMS_FIXTURE_ENTITIES: ResolvedEntity[] = [
  vac('downstairs', 'Downstairs Robot', 'Living Room', 'cleaning', { battery_level: 64, fan_speed: 'Turbo', current_room: 'Kitchen' }),
  vac('upstairs', 'Upstairs Robot', 'Bedroom', 'docked', { battery_level: 100, fan_speed: 'Balanced' })
];

export const VACUUMS_FIXTURE = buildVacuumsOverviewModel([], VACUUMS_FIXTURE_ENTITIES);
