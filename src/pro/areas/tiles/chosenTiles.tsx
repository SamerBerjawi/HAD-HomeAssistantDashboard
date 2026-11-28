/**
 * The owner's tile per kind (batches 1–5, docs/pro-ui/AREA_TILES.md): what the real Area page
 * draws. The studio keeps every concept; this is only the chosen one, so the page does not load
 * the studio's catalog and mock states.
 */
import type { ComponentType } from 'react';
import type { TileModel, TileProps } from '../tileTypes';
import LightHalo from './light/LightHalo';
import FanBreeze from './fan/FanBreeze';
import ThermoScale from './climate/ThermoScale';
import CoverLadder from './cover/CoverLadder';
import ReadingStatus from './reading/ReadingStatus';
import { AmbientSwitch } from './ambient/AmbientPower';
import { AmbientMedia } from './ambient/AmbientMedia';
import { AmbientScene } from './ambient/AmbientScene';
import { CameraWindow } from './security/CameraTiles';
import { LockStatus } from './security/LockTiles';
import { OpeningDay } from './security/OpeningTiles';
import { MotionTicks } from './security/MotionTiles';
import { SafetyDevice } from './security/SafetyTiles';
import { VacuumDock } from './machines/VacuumTiles';
import { CarSilhouette } from './machines/CarTiles';

type ByKind = { [K in TileModel['kind']]: ComponentType<TileProps<Extract<TileModel, { kind: K }>>> };

export const CHOSEN_TILES: ByKind = {
  light: LightHalo,
  switch: AmbientSwitch,
  fan: FanBreeze,
  climate: ThermoScale,
  cover: CoverLadder,
  reading: ReadingStatus,
  media: AmbientMedia,
  scene: AmbientScene,
  camera: CameraWindow,
  lock: LockStatus,
  opening: OpeningDay,
  motion: MotionTicks,
  safety: SafetyDevice,
  vacuum: VacuumDock,
  car: CarSilhouette
};

/** One tile, drawn with the chosen concept for its kind. */
export function ChosenTile({ e, size, act }: TileProps<TileModel>) {
  const C = CHOSEN_TILES[e.kind] as ComponentType<TileProps<TileModel>>;
  return <C e={e} size={size} act={act} />;
}
