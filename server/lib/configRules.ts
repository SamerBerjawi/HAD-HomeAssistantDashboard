// Pure config merge/validation rules used by POST /api/config.
import { isJsonObject } from './configTypes';
import type { JsonObject, ServerConfig } from './configTypes';

const OVERVIEW_DEVICE_KEYS = new Set(['phone', 'tablet', 'desktop']);
const AREA_DEVICE_KEYS = new Set(['phone', 'tablet', 'desktop', 'wide']);

function isAtomicBucket(path: readonly string[], key: string): boolean {
  if (key === 'sources') return true;
  if (key === 'styles') return true;
  const parent = path[path.length - 1];
  const grandparent = path[path.length - 2];
  if (parent === 'proOverviewLayout' && OVERVIEW_DEVICE_KEYS.has(key)) return true;
  if (grandparent === 'proAreaLayouts' && AREA_DEVICE_KEYS.has(key)) return true;
  if (parent === 'proRooms' && OVERVIEW_DEVICE_KEYS.has(key)) return true;
  if (key === 'sizes' && path.includes('proRooms')) return true;
  return false;
}

// Server-side recursive deep merge utility for plain objects (arrays and atomic layout buckets are wholesale replaced, undefined skipped)
export function deepMergeConfig(base: JsonObject = {}, partial: JsonObject = {}, path: readonly string[] = []): JsonObject {
  const result: JsonObject = { ...(base || {}) };
  for (const [key, value] of Object.entries(partial || {})) {
    if (value === undefined) continue;
    if (value === null) {
      delete result[key];
      continue;
    }
    if (isAtomicBucket(path, key) && typeof value === 'object' && !Array.isArray(value)) {
      // Wholesale replace atomic maps/device buckets so deleted or reset keys are not resurrected
      result[key] = deepMergeConfig({}, value as JsonObject, [...path, key]);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const existing = result[key];
      const baseVal: JsonObject =
        existing !== null && typeof existing === 'object' && !Array.isArray(existing)
          ? (existing as JsonObject)
          : {};
      result[key] = deepMergeConfig(baseVal, value as JsonObject, [...path, key]);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Config validation helper
export function isValidDashboardConfig(body: unknown): body is ServerConfig {
  if (!isJsonObject(body)) {
    return false;
  }
  const keys = Object.keys(body);
  if (keys.length === 0) {
    return false;
  }
  if (body.version !== undefined && typeof body.version !== 'number') {
    return false;
  }
  if (body.updatedAt !== undefined && typeof body.updatedAt !== 'string') {
    return false;
  }
  if (body.theme !== undefined && (typeof body.theme !== 'object' || Array.isArray(body.theme) || body.theme === null)) {
    return false;
  }
  if (body.mobility !== undefined && (typeof body.mobility !== 'object' || Array.isArray(body.mobility) || body.mobility === null)) {
    return false;
  }
  return true;
}

/** Fields read by hasMaterialDashboardConfig; every one is checked at runtime before use. */
interface MaterialConfigProbe {
  rooms?: { floorOrder?: unknown; areaOrder?: unknown; favoriteAreas?: unknown; areaOverrides?: unknown };
  entities?: { hiddenEntityIds?: unknown; nameOverrides?: unknown; iconOverrides?: unknown; customizations?: unknown };
  areas?: unknown;
  floors?: unknown;
  labels?: unknown;
  mobility?: {
    car?: { selectedCarEntityId?: unknown; customVehiclePngUrl?: unknown };
    bike?: { selectedBikeEntityId?: unknown; customVehiclePngUrl?: unknown };
  };
  theme?: { customThemes?: unknown; preset?: unknown };
  cameras?: { favoriteCameras?: unknown; sources?: unknown };
  preferences?: unknown;
  profile?: unknown;
  layoutSharing?: unknown;
  userLayouts?: unknown;
}

// Material Data Checker: inspects if configuration has meaningful user customizations
// Mirroring Crystal's data loss prevention safeguards
export function hasMaterialDashboardConfig(input: unknown): boolean {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return false;
  const data = input as MaterialConfigProbe;

  // Check rooms configuration
  if (data.rooms && typeof data.rooms === 'object') {
    if (Array.isArray(data.rooms.floorOrder) && data.rooms.floorOrder.length > 0) return true;
    if (Array.isArray(data.rooms.areaOrder) && data.rooms.areaOrder.length > 0) return true;
    if (Array.isArray(data.rooms.favoriteAreas) && data.rooms.favoriteAreas.length > 0) return true;
    if (data.rooms.areaOverrides && typeof data.rooms.areaOverrides === 'object' && Object.keys(data.rooms.areaOverrides).length > 0) return true;
  }

  // Check entity customizations
  if (data.entities && typeof data.entities === 'object') {
    if (Array.isArray(data.entities.hiddenEntityIds) && data.entities.hiddenEntityIds.length > 0) return true;
    if (data.entities.nameOverrides && typeof data.entities.nameOverrides === 'object' && Object.keys(data.entities.nameOverrides).length > 0) return true;
    if (data.entities.iconOverrides && typeof data.entities.iconOverrides === 'object' && Object.keys(data.entities.iconOverrides).length > 0) return true;
    if (data.entities.customizations && typeof data.entities.customizations === 'object' && Object.keys(data.entities.customizations).length > 0) return true;
  }

  // Check areas / floors / labels
  if (data.areas && typeof data.areas === 'object' && Object.keys(data.areas).length > 0) return true;
  if (data.floors && typeof data.floors === 'object' && Object.keys(data.floors).length > 0) return true;
  if (data.labels && typeof data.labels === 'object' && Object.keys(data.labels).length > 0) return true;

  // Check mobility configuration
  if (data.mobility && typeof data.mobility === 'object') {
    if (data.mobility.car && (data.mobility.car.selectedCarEntityId || data.mobility.car.customVehiclePngUrl)) return true;
    if (data.mobility.bike && (data.mobility.bike.selectedBikeEntityId || data.mobility.bike.customVehiclePngUrl)) return true;
  }

  // Check custom theme
  if (data.theme && typeof data.theme === 'object') {
    if (data.theme.customThemes && typeof data.theme.customThemes === 'object' && Object.keys(data.theme.customThemes).length > 0) return true;
    if (data.theme.preset && data.theme.preset !== 'obsidian') return true;
  }

  // Check custom cameras
  if (data.cameras && typeof data.cameras === 'object') {
    if (Array.isArray(data.cameras.favoriteCameras) && data.cameras.favoriteCameras.length > 0) return true;
    if (data.cameras.sources && typeof data.cameras.sources === 'object' && Object.keys(data.cameras.sources).length > 0) return true;
  }

  // Check preferences / profile / layoutSharing / userLayouts
  if (data.preferences && typeof data.preferences === 'object' && Object.keys(data.preferences).length > 0) return true;
  if (data.profile && typeof data.profile === 'object' && Object.keys(data.profile).length > 0) return true;
  if (data.layoutSharing && typeof data.layoutSharing === 'object' && Object.keys(data.layoutSharing).length > 0) return true;
  if (data.userLayouts && typeof data.userLayouts === 'object' && Object.keys(data.userLayouts).length > 0) return true;

  return false;
}

export type ConfigWriteGuard =
  | { kind: 'ok' }
  | { kind: 'material_guard' }
  | { kind: 'version_conflict'; clientExpectedVersion: number };

export interface ConfigWriteInput {
  currentConfig: ServerConfig | null;
  currentServerVersion: number;
  targetConfig: JsonObject;
  allowEmpty: boolean;
  isPartialMerge: boolean;
  clientExpectedVersion: number | undefined;
}

/**
 * Decides whether POST /api/config may proceed (data-loss and concurrency guards).
 * 1. Material-data guard: an empty/default payload must not overwrite a customised config
 *    (unless allowEmpty, a partial merge, or an explicit camera-sources update).
 * 2. Version guard: a client that last saw an older server version is rejected (409).
 */
export function checkConfigWriteGuards(input: ConfigWriteInput): ConfigWriteGuard {
  const { currentConfig, currentServerVersion, targetConfig, allowEmpty, isPartialMerge, clientExpectedVersion } = input;
  const isExplicitCameraSourcesUpdate = (targetConfig as ServerConfig).cameras?.sources !== undefined;
  if (
    !isPartialMerge &&
    !allowEmpty &&
    !isExplicitCameraSourcesUpdate &&
    currentConfig &&
    hasMaterialDashboardConfig(currentConfig) &&
    !hasMaterialDashboardConfig(targetConfig)
  ) {
    return { kind: 'material_guard' };
  }
  if (
    !isPartialMerge &&
    currentConfig &&
    clientExpectedVersion !== undefined &&
    !isNaN(clientExpectedVersion) &&
    clientExpectedVersion < currentServerVersion
  ) {
    return { kind: 'version_conflict', clientExpectedVersion };
  }
  return { kind: 'ok' };
}

/** Changing camera sources needs admin rights; ordinary saves echo the sources back unchanged. */
export function cameraSourcesChanged(currentConfig: ServerConfig | null, targetConfig: JsonObject): boolean {
  const target = (targetConfig as ServerConfig).cameras?.sources;
  if (target === undefined) return false;
  const before = JSON.stringify(currentConfig?.cameras?.sources ?? {});
  const after = JSON.stringify(target ?? {});
  return before !== after;
}

/** Changing layoutSharing settings (such as shareLayoutsWithUsers) requires a Home Assistant administrator. */
export function layoutSharingChanged(currentConfig: ServerConfig | null, targetConfig: JsonObject): boolean {
  const target = (targetConfig as ServerConfig).layoutSharing;
  if (target === undefined) return false;
  const currentShare = currentConfig?.layoutSharing?.shareLayoutsWithUsers ?? true;
  const nextShare = target === null ? true : (target.shareLayoutsWithUsers ?? currentShare);
  if (nextShare !== currentShare) return true;
  if (target !== null && JSON.stringify(currentConfig?.layoutSharing ?? {}) !== JSON.stringify(target)) {
    // Only flag if fields beyond echoing default shareLayoutsWithUsers changed
    const beforeNorm = { shareLayoutsWithUsers: currentShare, ...(currentConfig?.layoutSharing ?? {}) };
    const afterNorm = { shareLayoutsWithUsers: currentShare, ...target };
    return JSON.stringify(beforeNorm) !== JSON.stringify(afterNorm);
  }
  return false;
}

/**
 * Returns true if targetConfig modifies a userLayouts entry that does not belong to `userId`.
 * Non-admins may only write to their own `userLayouts[userId]` entry (echoing unchanged sibling entries is allowed).
 */
export function unauthorizedUserLayoutsModified(
  currentConfig: ServerConfig | null,
  targetConfig: JsonObject,
  userId: string | null | undefined
): boolean {
  const target = (targetConfig as ServerConfig).userLayouts;
  if (target === undefined || target === null) return target === null && Boolean(currentConfig?.userLayouts && Object.keys(currentConfig.userLayouts).length > 0);
  if (!isJsonObject(target)) return false;
  const current = currentConfig?.userLayouts ?? {};
  for (const [uid, entry] of Object.entries(target)) {
    if (uid === userId) continue;
    const before = current[uid];
    if (entry === null) {
      if (before !== undefined) return true;
      continue;
    }
    if (JSON.stringify(before ?? null) !== JSON.stringify(entry)) {
      return true;
    }
  }
  return false;
}
