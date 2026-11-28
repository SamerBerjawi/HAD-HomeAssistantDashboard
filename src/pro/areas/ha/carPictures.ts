/**
 * The owner's choice of picture per car (Area page build, phase 5), in
 * `preferences.proCarPictures[deviceId]`: an uploaded asset's URL (`/api/assets/...`), or 'none'
 * for the plain outline. No entry: the picture Home Assistant has for the car.
 */
import type { CarTileModel } from '../tileTypes';

export type CarPictureChoice = string;
export const NO_PICTURE = 'none';

export function readCarPictures(preferences: unknown): Record<string, CarPictureChoice> {
  const all = (preferences as { proCarPictures?: unknown } | undefined)?.proCarPictures;
  if (!all || typeof all !== 'object') return {};
  return Object.fromEntries(Object.entries(all).filter((kv): kv is [string, string] => typeof kv[1] === 'string' && kv[1] !== ''));
}

/** The preferences with one car's choice set; null goes back to the car's own picture. */
export function withCarPicture(preferences: Record<string, unknown> | undefined, deviceId: string, choice: CarPictureChoice | null): Record<string, unknown> {
  const prefs = preferences ?? {};
  const all = (prefs.proCarPictures && typeof prefs.proCarPictures === 'object' ? prefs.proCarPictures : {}) as Record<string, unknown>;
  // A null value is how the config's merge removes a key.
  return { ...prefs, proCarPictures: { ...all, [deviceId]: choice } };
}

/** A car tile's model with the owner's choice applied (`resolve` turns a stored asset URL into one to load). */
export function applyCarPicture(m: CarTileModel, choice: CarPictureChoice | undefined, resolve: (url: string) => string | null): CarTileModel {
  if (!choice) return m;
  if (choice === NO_PICTURE) return { ...m, picture: null, uploadedPicture: null };
  return { ...m, uploadedPicture: resolve(choice) };
}

/** `device.<id>` (the car tile's entity id) → the device id. */
export const carDeviceId = (entityId: string) => (entityId.startsWith('device.') ? entityId.slice('device.'.length) : entityId);
