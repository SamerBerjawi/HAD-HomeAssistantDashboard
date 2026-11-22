/** Named Alarm states for the Widget Design Studio, built with the real model builder. */
import type { ResolvedEntity } from '@/types';
import { buildOverviewAlarmModel, type ProOverviewAlarmModel } from '../../../lib/overviewSecurity';
import type { WidgetState } from '../../../studio/types';
import { SENSOR_FIXTURE_ENTITIES } from '../../sensors/fixture';

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

const panel = (state: string, by = 'Sarah') => entity('alarm_control_panel.home', state, 'Home Alarm', 'Hallway', { code_format: 'number', changed_by: by, supported_features: 39 });
const locked = entity('lock.front_door', 'locked', 'Front Door Lock', 'Hallway');
const unlocked = entity('lock.back_door', 'unlocked', 'Back Door Lock', 'Kitchen');
const backDoor = SENSOR_FIXTURE_ENTITIES.filter((e) => e.entity_id === 'binary_sensor.back_door');
const officeWindow = SENSOR_FIXTURE_ENTITIES.filter((e) => e.entity_id === 'binary_sensor.office_window');

const build = (state: string, opts: { open?: boolean; locks?: ResolvedEntity[]; by?: string } = {}) =>
  buildOverviewAlarmModel({
    alarms: state === 'none' ? [] : [panel(state, opts.by)],
    openDoors: opts.open ? backDoor : [],
    openWindows: opts.open ? officeWindow : [],
    locks: opts.locks ?? [locked, unlocked]
  });

export const ALARM_STATES: WidgetState<ProOverviewAlarmModel>[] = [
  { id: 'disarmed', label: 'Disarmed, door open', model: build('disarmed', { open: true }) },
  { id: 'home', label: 'Armed home', model: build('armed_home', { locks: [locked] }) },
  { id: 'away', label: 'Armed away', model: build('armed_away', { locks: [locked], by: 'Alex' }) },
  { id: 'arming', label: 'Arming', model: build('arming') },
  { id: 'triggered', label: 'Triggered', model: build('triggered', { open: true }) },
  { id: 'none', label: 'No panel', model: build('none', { locks: [] }) }
];
