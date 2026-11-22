/**
 * Named Cameras states for the Widget Design Studio, built with the real model builder. The
 * "snapshots" are simple SVG scenes made here (no real camera images); live streams do not run in
 * the studio, so Large shows the snapshot.
 */
import type { ResolvedEntity } from '@/types';
import { buildOverviewCamerasModel, type ProOverviewCamerasModel } from '../../../lib/overviewSecurity';
import type { WidgetState } from '../../../studio/types';

const scene = (sky: string, ground: string, thing: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky}"/><stop offset="1" stop-color="${ground}"/></linearGradient></defs><rect width="320" height="180" fill="url(#s)"/><rect x="0" y="120" width="320" height="60" fill="${ground}"/>${thing}<rect width="320" height="180" fill="#000" opacity="0.08"/></svg>`
  )}`;

const PORCH = scene(
  '#3a4a5e',
  '#2a2f36',
  '<rect x="40" y="40" width="90" height="85" fill="#55606e"/><rect x="70" y="70" width="30" height="55" fill="#8a6a4a"/><circle cx="160" cy="60" r="8" fill="#ffd27a"/><rect x="200" y="100" width="70" height="8" fill="#6b5a48"/>'
);
const GARDEN = scene(
  '#8fc1e3',
  '#4f7a3a',
  '<circle cx="250" cy="45" r="18" fill="#fff2b3"/><ellipse cx="80" cy="115" rx="40" ry="30" fill="#3d6b2c"/><rect x="76" y="115" width="8" height="25" fill="#5a3d22"/><rect x="160" y="128" width="110" height="6" fill="#c9b18a"/>'
);
const DRIVE = scene(
  '#202838',
  '#30343b',
  '<rect x="60" y="95" width="120" height="40" rx="10" fill="#7d8a99"/><circle cx="85" cy="137" r="10" fill="#111"/><circle cx="155" cy="137" r="10" fill="#111"/><rect x="230" y="30" width="6" height="90" fill="#555"/><circle cx="233" cy="30" r="9" fill="#ffe6a8" opacity="0.9"/>'
);

const cam = (id: string, name: string, area: string, picture: string, state = 'idle') =>
  ({ entity_id: `camera.${id}`, domain: 'camera', name, state, area_name: area, attributes: { friendly_name: name, entity_picture: picture } }) as unknown as ResolvedEntity;

const motion = (id: string, name: string, area: string, on: boolean, mins: number) =>
  ({
    entity_id: `binary_sensor.${id}`,
    domain: 'binary_sensor',
    name,
    state: on ? 'on' : 'off',
    area_name: area,
    last_changed: new Date(Date.now() - mins * 60000).toISOString(),
    attributes: { friendly_name: name, device_class: 'motion' }
  }) as unknown as ResolvedEntity;

const CAMS = [cam('porch', 'Porch', 'Outside', PORCH), cam('garden', 'Garden', 'Outside', GARDEN), cam('driveway', 'Driveway', 'Outside', DRIVE)];
const QUIET = [motion('porch_motion', 'Porch Motion', 'Outside', false, 45), motion('garden_motion', 'Garden Motion', 'Outside', false, 120)];
const build = (cameras: ResolvedEntity[], binarySensors: ResolvedEntity[] = QUIET) => buildOverviewCamerasModel({ cameras, binarySensors });

export const CAMERAS_STATES: WidgetState<ProOverviewCamerasModel>[] = [
  { id: 'quiet', label: 'Quiet', model: build(CAMS) },
  { id: 'motion', label: 'Motion at the porch', model: build(CAMS, [motion('porch_motion', 'Porch Motion', 'Outside', true, 0), QUIET[1]]) },
  { id: 'offline', label: 'One offline', model: build([...CAMS.slice(0, 2), cam('garage', 'Garage', 'Garage', DRIVE, 'unavailable')]) },
  { id: 'many', label: 'Five cameras', model: build([...CAMS, cam('side', 'Side Gate', 'Outside', GARDEN), cam('backyard', 'Backyard', 'Outside', PORCH)]) },
  { id: 'one', label: 'One camera', model: build(CAMS.slice(0, 1)) },
  { id: 'none', label: 'No cameras', model: build([]) }
];
