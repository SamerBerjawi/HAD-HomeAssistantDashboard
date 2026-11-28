/** Demo/test model for the Alarm widget. */
import type { ResolvedEntity } from '@/types';
import { buildOverviewAlarmModel } from '../../lib/overviewSecurity';
import { SENSOR_FIXTURE_ENTITIES } from '../sensors/fixture';

const entity = (entity_id: string, state: string, name: string, area: string, attributes: Record<string, unknown> = {}) =>
  ({
    entity_id,
    domain: entity_id.split('.')[0],
    name,
    state,
    area_name: area,
    last_changed: new Date(Date.now() - 50 * 60000).toISOString(),
    attributes: { friendly_name: name, ...attributes }
  }) as unknown as ResolvedEntity;

export const ALARM_FIXTURE_PANEL = entity('alarm_control_panel.home', 'armed_home', 'Home Alarm', 'Hallway', { code_format: 'number', changed_by: 'Sarah' });

export const ALARM_FIXTURE = buildOverviewAlarmModel({
  alarms: [ALARM_FIXTURE_PANEL],
  openDoors: SENSOR_FIXTURE_ENTITIES.filter((e) => e.entity_id === 'binary_sensor.back_door'),
  openWindows: SENSOR_FIXTURE_ENTITIES.filter((e) => e.entity_id === 'binary_sensor.office_window'),
  locks: [entity('lock.front_door', 'locked', 'Front Door Lock', 'Hallway'), entity('lock.back_door', 'unlocked', 'Back Door Lock', 'Kitchen')]
});
