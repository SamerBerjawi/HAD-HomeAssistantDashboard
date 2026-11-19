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

const PET_REGEX = /\b(pet|dog|cat)\b|_pet\b/i;
const STREAM_SUFFIX_REGEX = /_(hd_stream|sd_stream|main_stream|sub_stream|live_view|fluent|clear|high|low|main|sub)$/;

function cameraSlug(camera: ResolvedEntity): string {
  return camera.entity_id
    .replace(/^camera\./, '')
    .toLowerCase()
    .replace(STREAM_SUFFIX_REGEX, '');
}

function sensorBelongsToCamera(camera: ResolvedEntity, sensor: ResolvedEntity, slug: string): boolean {
  const sameDevice = Boolean(camera.device_id && sensor.device_id === camera.device_id);
  if (sameDevice) return true;
  const sensorSlug = sensor.entity_id.replace(/^binary_sensor\./, '').toLowerCase();
  return slug.length >= 3 && sensorSlug.startsWith(slug);
}

function matchSensorAiRules(
  sensor: ResolvedEntity
): Array<{ kind: CameraAiDetectionKind; label: string }> {
  const hay = `${sensor.entity_id} ${sensor.name ?? ''} ${String(sensor.attributes?.friendly_name ?? '')}`;
  const out: Array<{ kind: CameraAiDetectionKind; label: string }> = [];
  for (const rule of DETECTION_PATTERNS) {
    if (rule.regex.test(hay)) {
      const label = rule.kind === 'animal' && PET_REGEX.test(hay) ? 'Pet' : rule.label;
      out.push({ kind: rule.kind, label });
    }
  }
  return out;
}

/**
 * Returns the set of AI detection kinds natively supported by `camera` via HA binary sensors
 * (e.g. Tapo C260 person & pet detection, Frigate, Reolink, UniFi), regardless of current state.
 */
export function detectCameraNativeAiKinds(
  camera: ResolvedEntity,
  binarySensors: readonly ResolvedEntity[]
): Set<CameraAiDetectionKind> {
  const slug = cameraSlug(camera);
  const kinds = new Set<CameraAiDetectionKind>();

  for (const sensor of binarySensors) {
    if (sensor.disabled_by || sensor.state === 'unavailable' || sensor.state === 'unknown') continue;
    if (!sensorBelongsToCamera(camera, sensor, slug)) continue;
    for (const match of matchSensorAiRules(sensor)) {
      kinds.add(match.kind);
    }
  }

  return kinds;
}

/**
 * Finds active AI detection binary sensors (`person`, `vehicle`, `package`, `animal`) associated
 * with `camera` via shared `device_id` or matching entity slug prefix (Tapo / Frigate / Reolink / UniFi).
 */
export function detectCameraAiAlerts(
  camera: ResolvedEntity,
  binarySensors: readonly ResolvedEntity[]
): CameraAiDetection[] {
  const slug = cameraSlug(camera);
  const found = new Map<CameraAiDetectionKind, CameraAiDetection>();

  for (const sensor of binarySensors) {
    if (sensor.state !== 'on' || sensor.disabled_by) continue;
    if (!sensorBelongsToCamera(camera, sensor, slug)) continue;

    for (const match of matchSensorAiRules(sensor)) {
      if (!found.has(match.kind)) {
        found.set(match.kind, {
          kind: match.kind,
          label: match.label,
          entityId: sensor.entity_id
        });
      }
    }
  }

  return [...found.values()];
}

/**
 * Merges native HA camera AI detections with local in-browser AI detections.
 * Native camera sensors always take priority; local detections for kinds natively covered
 * by the camera are dropped even when the native sensor is currently off.
 */
export function mergeCameraDetections(
  nativeDetections: readonly CameraAiDetection[],
  localDetections: readonly CameraAiDetection[],
  nativeAiKinds: ReadonlySet<CameraAiDetectionKind>
): CameraAiDetection[] {
  const map = new Map<CameraAiDetectionKind, CameraAiDetection>();
  for (const d of nativeDetections) map.set(d.kind, d);
  for (const d of localDetections) {
    if (!map.has(d.kind) && !nativeAiKinds.has(d.kind)) {
      map.set(d.kind, d);
    }
  }
  return [...map.values()];
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
