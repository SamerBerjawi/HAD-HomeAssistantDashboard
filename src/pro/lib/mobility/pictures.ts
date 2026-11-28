/**
 * Which picture a vehicle shows (owner, 2026-11-27): their own choice first, saved per HA device in
 * `preferences.proCarPictures` (the same choice the Room page's car tile uses), then classic
 * Mobility's vehicle image, then the picture its integration gives it in Home Assistant, else the
 * page's silhouette. The choice 'none' always shows the silhouette.
 */
import { NO_PICTURE, type CarPictureChoice } from '../../areas/ha/carPictures';
import type { Vehicle } from '../mobilityHome';

export type PictureSource = 'entity' | 'upload' | 'none';

export function applyVehiclePicture(v: Vehicle, choices: Record<string, CarPictureChoice>): Vehicle {
  const choice = v.deviceId ? choices[v.deviceId] : undefined;
  if (choice === NO_PICTURE) return { ...v, image: null, picture: null };
  if (choice) return { ...v, image: choice };
  return v;
}

/** What the owner has chosen for a vehicle, as the picture control shows it. */
export function pictureSource(v: Vehicle, choices: Record<string, CarPictureChoice>): PictureSource {
  const choice = v.deviceId ? choices[v.deviceId] : undefined;
  return choice === NO_PICTURE ? 'none' : choice ? 'upload' : 'entity';
}

/** The raw picture to load: the owner's, else the integration's. */
export const vehiclePictureRaw = (v: Vehicle): string | null => v.image ?? v.picture ?? null;

/** Every picture worth trying, in order (the next is tried when one fails to load). */
export const vehiclePictures = (v: Vehicle): string[] => [...new Set([v.image, v.picture].filter((x): x is string => !!x))];

/**
 * A Home Assistant link that carries its own short-lived access token (an image or camera
 * entity's entity_picture, e.g. FordPass's vehicle image: `/api/image_proxy/image.…?token=…`).
 * HA's own frontend shows these with a plain <img>, which needs no CORS, so they need no fetch.
 */
export const isSignedHaPicture = (raw: string): boolean => /\/api\/(image|camera)_proxy\/[^?]+\?(?:.*&)?token=/.test(raw);
