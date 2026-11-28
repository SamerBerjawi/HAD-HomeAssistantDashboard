/** Demo/test model for the Cameras widget. */
import type { ResolvedEntity } from '@/types';
import { buildOverviewCamerasModel } from '../../lib/overviewSecurity';
import { SENSOR_FIXTURE_ENTITIES } from '../sensors/fixture';

const cam = (id: string, name: string, area: string, state = 'idle') =>
  ({ entity_id: `camera.${id}`, domain: 'camera', name, state, area_name: area, attributes: { friendly_name: name } }) as unknown as ResolvedEntity;

export const CAMERAS_FIXTURE = buildOverviewCamerasModel({
  cameras: [cam('porch', 'Porch', 'Outside'), cam('garden', 'Garden', 'Outside'), cam('garage', 'Garage', 'Garage', 'unavailable')],
  binarySensors: SENSOR_FIXTURE_ENTITIES
});
