/** Named Doors & windows states for the Widget Design Studio, built with the real model builder. */
import type { WidgetState } from '../../../studio/types';
import { buildGroup, mockSensor as s } from '../../sensors/conceptKit';
import type { SensorGroupModel } from '../../sensors/sensorGroup';

const HOME = (open: Record<string, number>) => [
  s('front_door', 'Front Door', 'Hallway', 'door', 'front_door' in open, open.front_door ?? 300),
  s('back_door', 'Back Door', 'Kitchen', 'door', 'back_door' in open, open.back_door ?? 95),
  s('garage_door', 'Garage Door', 'Garage', 'garage_door', 'garage_door' in open, open.garage_door ?? 600),
  s('kitchen_window', 'Kitchen Window', 'Kitchen', 'window', 'kitchen_window' in open, open.kitchen_window ?? 200),
  s('office_window', 'Office Window', 'Office', 'window', 'office_window' in open, open.office_window ?? 900),
  s('bedroom_window', 'Bedroom Window', 'Bedroom', 'window', 'bedroom_window' in open, open.bedroom_window ?? 1500),
  s('bath_window', 'Bathroom Window', 'Bathroom', 'window', 'bath_window' in open, open.bath_window ?? 2000)
];

export const OPENINGS_STATES: WidgetState<SensorGroupModel>[] = [
  { id: 'closed', label: 'All closed', model: buildGroup('openings', HOME({})) },
  { id: 'two', label: 'Door and window open', model: buildGroup('openings', HOME({ back_door: 4, office_window: 30 })) },
  { id: 'many', label: 'Airing out', model: buildGroup('openings', HOME({ kitchen_window: 12, office_window: 25, bedroom_window: 40, bath_window: 8, garage_door: 2 })) },
  {
    id: 'offline',
    label: 'Sensor offline',
    model: buildGroup('openings', [...HOME({ front_door: 1 }).slice(0, 6), s('bath_window', 'Bathroom Window', 'Bathroom', 'window', false, 2000, 'unavailable')])
  },
  { id: 'none', label: 'No sensors', model: buildGroup('openings', []) }
];
