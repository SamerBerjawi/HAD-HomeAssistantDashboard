/** Named Motion states for the Widget Design Studio, built with the real model builder. */
import type { WidgetState } from '../../../studio/types';
import { buildGroup, mockSensor as s } from '../../sensors/conceptKit';
import type { SensorGroupModel } from '../../sensors/sensorGroup';

/** Zones with minutes since their last change; negative = motion now (changed that long ago). */
const zones = (z: Record<string, number>) =>
  Object.entries(z).map(([room, mins]) => s(`${room.toLowerCase().replace(/\W+/g, '_')}_motion`, `${room} Motion`, room, 'motion', mins < 0, Math.abs(mins)));

export const MOTION_STATES: WidgetState<SensorGroupModel>[] = [
  { id: 'evening', label: 'Busy evening', model: buildGroup('motion', zones({ 'Living Room': -1, Kitchen: -4, Hallway: 12, Bedroom: 38, Porch: 52 })) },
  { id: 'one', label: 'One room', model: buildGroup('motion', zones({ Office: -2, Hallway: 25, Kitchen: 47, 'Living Room': 90 })) },
  { id: 'still', label: 'All still', model: buildGroup('motion', zones({ Hallway: 18, Kitchen: 44, 'Living Room': 75, Bedroom: 300 })) },
  { id: 'away', label: 'Away all day', model: buildGroup('motion', zones({ Hallway: 420, Kitchen: 480, 'Living Room': 500 })) },
  { id: 'none', label: 'No sensors', model: buildGroup('motion', []) }
];
