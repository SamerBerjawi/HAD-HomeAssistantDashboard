/**
 * The binary sensors that report what a camera sees (motion, occupancy, person / vehicle / animal /
 * package detections), for the camera's recent events (owner review 2026-11-20, §8 #21): the same
 * device, or the camera's name in the sensor's id.
 */
import type { ResolvedEntity } from '@/types';

// Whole words only ("cat" must not match "communication").
const DETECTS = /(^|[._])(motion|occupancy|presence|person|people|human|vehicle|car|animal|pet|dog|cat|package|parcel|face|visitor|doorbell|ding|detected|detection)(?=$|[._])/;
const CLASSES = new Set(['motion', 'occupancy', 'presence', 'moving']);

export function cameraDetectionSensorIds(camera: { entity_id: string; device_id?: string | null }, binarySensors: readonly ResolvedEntity[]): string[] {
  const slug = camera.entity_id.replace(/^camera\./, '').toLowerCase();
  // "front_door_high" / "front_door_sub" streams share their sensors with "front_door".
  const base = slug.replace(/_(high|low|main|sub|hd|sd|fluent|clear|snapshot|stream|live|profile\d*)$/, '');
  return binarySensors
    .filter((s) => {
      if (!s.entity_id.startsWith('binary_sensor.')) return false;
      const id = s.entity_id.toLowerCase();
      const kind = CLASSES.has(String(s.attributes?.device_class ?? '')) || DETECTS.test(id);
      if (!kind) return false;
      if (camera.device_id && s.device_id === camera.device_id) return true;
      return base.length >= 3 && id.includes(base);
    })
    .map((s) => s.entity_id);
}
