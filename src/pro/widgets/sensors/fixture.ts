/** Demo/test sensors for Openings, Safety and Motion. */
import type { ResolvedEntity } from '@/types';
import { buildSensorDomainModels, buildSensorGroupModel, SENSOR_GROUP_DOMAINS, type SensorGroupKind, type SensorGroupModel } from './sensorGroup';

const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();
const bs = (id: string, name: string, area: string, deviceClass: string, on: boolean, mins: number) =>
  ({
    entity_id: `binary_sensor.${id}`,
    domain: 'binary_sensor',
    name,
    state: on ? 'on' : 'off',
    area_name: area,
    last_changed: minutesAgo(mins),
    attributes: { friendly_name: name, device_class: deviceClass }
  }) as unknown as ResolvedEntity;

export const SENSOR_FIXTURE_ENTITIES: ResolvedEntity[] = [
  bs('back_door', 'Back Door', 'Kitchen', 'door', true, 4),
  bs('front_door', 'Front Door', 'Hallway', 'door', false, 95),
  bs('garage_door', 'Garage Door', 'Garage', 'garage_door', false, 300),
  bs('office_window', 'Office Window', 'Office', 'window', true, 30),
  bs('bedroom_window', 'Bedroom Window', 'Bedroom', 'window', false, 600),
  bs('kitchen_leak', 'Under Sink Leak', 'Kitchen', 'moisture', false, 2000),
  bs('laundry_leak', 'Washer Leak', 'Laundry', 'moisture', false, 4000),
  bs('hall_smoke', 'Hallway Smoke', 'Hallway', 'smoke', false, 9000),
  bs('living_motion', 'Living Room Motion', 'Living Room', 'motion', true, 1),
  bs('hall_motion', 'Hallway Motion', 'Hallway', 'motion', false, 12),
  bs('porch_motion', 'Porch Motion', 'Outside', 'motion', false, 45)
];

export const sensorFixture = (kind: SensorGroupKind): SensorGroupModel =>
  buildSensorGroupModel(kind, buildSensorDomainModels(SENSOR_GROUP_DOMAINS[kind], SENSOR_FIXTURE_ENTITIES));
