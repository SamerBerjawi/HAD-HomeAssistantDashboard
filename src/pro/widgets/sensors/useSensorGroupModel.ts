import { useMemo } from 'react';
import { useDomainEntities } from '../shared/entities';
import { buildSensorDomainModels, buildSensorGroupModel, SENSOR_GROUP_DOMAINS, type SensorGroupKind, type SensorGroupModel } from './sensorGroup';

/** One sensor group from the visible binary sensors. */
export function useSensorGroupModel(kind: SensorGroupKind): SensorGroupModel {
  const sensors = useDomainEntities('binary_sensor');
  return useMemo(() => buildSensorGroupModel(kind, buildSensorDomainModels(SENSOR_GROUP_DOMAINS[kind], sensors)), [kind, sensors]);
}

export const useOpeningsModel = () => useSensorGroupModel('openings');
export const useSafetyModel = () => useSensorGroupModel('safety');
export const useMotionModel = () => useSensorGroupModel('motion');
