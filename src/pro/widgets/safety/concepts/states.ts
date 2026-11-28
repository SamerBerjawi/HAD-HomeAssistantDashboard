/** Named Safety states for the Widget Design Studio, built with the real model builder. */
import type { WidgetState } from '../../../studio/types';
import { buildGroup, mockSensor as s } from '../../sensors/conceptKit';
import type { SensorGroupModel } from '../../sensors/sensorGroup';

const HOME = (alarm: string[] = [], offline: string[] = []) =>
  [
    ['kitchen_leak', 'Under Sink Leak', 'Kitchen', 'moisture'],
    ['laundry_leak', 'Washer Leak', 'Laundry', 'moisture'],
    ['bath_leak', 'Bathroom Leak', 'Bathroom', 'moisture'],
    ['hall_smoke', 'Hallway Smoke', 'Hallway', 'smoke'],
    ['kitchen_smoke', 'Kitchen Smoke', 'Kitchen', 'smoke']
  ].map(([id, name, area, dc]) => s(id, name, area, dc, alarm.includes(id), alarm.includes(id) ? 2 : 3000, offline.includes(id) ? 'unavailable' : undefined));

export const SAFETY_STATES: WidgetState<SensorGroupModel>[] = [
  { id: 'clear', label: 'All clear', model: buildGroup('safety', HOME()) },
  { id: 'leak', label: 'Leak', model: buildGroup('safety', HOME(['laundry_leak'])) },
  { id: 'smoke', label: 'Smoke', model: buildGroup('safety', HOME(['kitchen_smoke'])) },
  { id: 'both', label: 'Leak and smoke', model: buildGroup('safety', HOME(['bath_leak', 'hall_smoke'])) },
  { id: 'offline', label: 'Sensor offline', model: buildGroup('safety', HOME([], ['bath_leak'])) },
  { id: 'none', label: 'No sensors', model: buildGroup('safety', []) }
];
