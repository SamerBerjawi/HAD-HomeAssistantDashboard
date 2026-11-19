/**
 * Pure camera AI detection matching & alarm-trigger diagnostics helpers for Pro Security.
 * No React, no store.
 */
import type { ResolvedEntity } from '@/types';
import type { ActivityEvent } from './securityLogic';

export type CameraAiDetectionKind = 'person' | 'vehicle' | 'package' | 'animal';

export interface CameraAiDetection {
  kind: CameraAiDetectionKind;
  label: string;
  entityId: string;
}

const DETECTION_PATTERNS: ReadonlyArray<{
  kind: CameraAiDetectionKind;
  label: string;
  regex: RegExp;
}> = [
  { kind: 'person', label: 'Person', regex: /\b(person|human|face)\b|_person\b/i },
  { kind: 'vehicle', label: 'Vehicle', regex: /\b(vehicle|car|truck)\b|_vehicle\b|_car\b/i },
  { kind: 'package', label: 'Package', regex: /\b(package|parcel|delivery)\b|_package\b/i },
  { kind: 'animal', label: 'Animal', regex: /\b(animal|pet|dog|cat)\b|_animal\b|_pet\b/i }
];

function cameraSlug(camera: ResolvedEntity): string {
  return camera.entity_id.replace(/^camera\./, '').toLowerCase();
}

/**
 * Finds active AI detection binary sensors (`person`, `vehicle`, `package`, `animal`) associated
 * with `camera` via shared `device_id` or matching entity slug prefix (Frigate / Reolink / UniFi).
 */
export function detectCameraAiAlerts(
  camera: ResolvedEntity,
  binarySensors: readonly ResolvedEntity[]
): CameraAiDetection[] {
  const slug = cameraSlug(camera);
  const found = new Map<CameraAiDetectionKind, CameraAiDetection>();

  for (const sensor of binarySensors) {
    if (sensor.state !== 'on' || sensor.disabled_by) continue;
    const sameDevice = Boolean(camera.device_id && sensor.device_id === camera.device_id);
    const sensorSlug = sensor.entity_id.replace(/^binary_sensor\./, '').toLowerCase();
    const samePrefix = slug.length >= 3 && sensorSlug.startsWith(slug);
    if (!sameDevice && !samePrefix) continue;

    const hay = `${sensor.entity_id} ${sensor.name ?? ''} ${String(sensor.attributes?.friendly_name ?? '')}`;
    for (const rule of DETECTION_PATTERNS) {
      if (!found.has(rule.kind) && rule.regex.test(hay)) {
        found.set(rule.kind, {
          kind: rule.kind,
          label: rule.label,
          entityId: sensor.entity_id
        });
      }
    }
  }

  return [...found.values()];
}

export interface AlarmTriggerDiagnostic {
  summary: string;
  areaId: string | null;
  cameraId: string | null;
}

/**
 * Resolves the most likely trigger source when an alarm is `triggered` or `pending`,
 * along with the nearest camera (preferring the same `area_id`, falling back to first camera).
 */
export function resolveAlarmTriggerDiagnostic(params: {
  alarm: ResolvedEntity;
  hazards: readonly ResolvedEntity[];
  openings: readonly ResolvedEntity[];
  events: readonly ActivityEvent[];
  cameras: readonly ResolvedEntity[];
  entityById?: Map<string, ResolvedEntity>;
}): AlarmTriggerDiagnostic | null {
  const { alarm, hazards, openings, events, cameras, entityById } = params;
  const state = alarm.state;
  if (state !== 'triggered' && state !== 'pending') return null;

  const attrs = alarm.attributes as Record<string, unknown> | undefined;
  let sourceName: string | null = null;
  let areaId: string | null = null;

  const openSensorsAttr = attrs?.open_sensors;
  if (Array.isArray(openSensorsAttr) && openSensorsAttr.length > 0) {
    const first = String(openSensorsAttr[0]);
    const ent = entityById?.get(first);
    sourceName = ent?.name || (ent?.attributes?.friendly_name as string | undefined) || first;
    areaId = ent?.area_id ?? null;
  } else if (hazards.length > 0) {
    const h = hazards[0];
    sourceName = h.name || (h.attributes?.friendly_name as string | undefined) || h.entity_id;
    areaId = h.area_id ?? null;
  } else if (openings.length > 0) {
    const o = openings[0];
    sourceName = o.name || (o.attributes?.friendly_name as string | undefined) || o.entity_id;
    areaId = o.area_id ?? null;
  } else {
    const recent = events.find((e) => e.kind !== 'alarm' && (e.tone === 'danger' || e.tone === 'warning'));
    if (recent) {
      const ent = entityById?.get(recent.entityId);
      sourceName = recent.text;
      areaId = ent?.area_id ?? null;
    } else if (typeof attrs?.changed_by === 'string' && attrs.changed_by) {
      sourceName = attrs.changed_by;
    }
  }

  const matchedCamera =
    (areaId ? cameras.find((c) => c.area_id === areaId) : undefined) ?? cameras[0] ?? null;

  if (!sourceName && !matchedCamera) return null;

  return {
    summary: sourceName
      ? state === 'triggered'
        ? `Triggered by ${sourceName}`
        : `Entry sensor: ${sourceName}`
      : state === 'triggered'
        ? 'Alarm triggered'
        : 'Entry delay active',
    areaId,
    cameraId: matchedCamera?.entity_id ?? null
  };
}
