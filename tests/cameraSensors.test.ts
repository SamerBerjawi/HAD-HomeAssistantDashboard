import { describe, expect, it } from 'vitest';
import type { ResolvedEntity } from '@/types';
import { cameraDetectionSensorIds } from '@/pro/lib/cameraSensors';

const bs = (entity_id: string, device_id?: string, device_class?: string) => ({ entity_id, device_id, domain: 'binary_sensor', attributes: { device_class } }) as unknown as ResolvedEntity;

describe('cameraDetectionSensorIds', () => {
  const sensors = [
    bs('binary_sensor.front_door_person_detected'),
    bs('binary_sensor.front_door_vehicle'),
    bs('binary_sensor.front_door_tamper'),
    bs('binary_sensor.front_door_communication'),
    bs('binary_sensor.garden_motion'),
    bs('binary_sensor.cam_7_occupancy', 'dev7', 'occupancy'),
    bs('binary_sensor.cam_7_online', 'dev7', 'connectivity')
  ];

  it('matches detection sensors by the camera name, ignoring stream suffixes and non-detections', () => {
    expect(cameraDetectionSensorIds({ entity_id: 'camera.front_door_high' }, sensors)).toEqual(['binary_sensor.front_door_person_detected', 'binary_sensor.front_door_vehicle']);
  });

  it('matches by device and skips other sensors on it', () => {
    expect(cameraDetectionSensorIds({ entity_id: 'camera.porch', device_id: 'dev7' }, sensors)).toEqual(['binary_sensor.cam_7_occupancy']);
  });

  it('finds nothing for an unrelated camera', () => {
    expect(cameraDetectionSensorIds({ entity_id: 'camera.attic' }, sensors)).toEqual([]);
  });
});
