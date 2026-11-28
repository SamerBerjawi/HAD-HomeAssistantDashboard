/** Batch 5 · Machines: the types, their states and concepts (docs/pro-ui/AREA_TILES.md). */
import { TILE_SIZES } from '../../tileTypes';
import { AmbientCar, AmbientVacuum } from '../../tiles/ambient/AmbientMachines';
import { VacuumDock, VacuumPath, VacuumRooms } from '../../tiles/machines/VacuumTiles';
import { CarDashboard, CarGauge, CarSilhouette } from '../../tiles/machines/CarTiles';
import { CAR_STATES, VACUUM_STATES } from '../areaStates';
import CarPictureTool from '../CarPictureTool';
import { entry, type TileTypeEntry } from './catalogTypes';
import type { TileModel } from '../../tileTypes';

export const BATCH_5: TileTypeEntry<TileModel>[] = [
  entry({
    id: 'vacuum',
    title: 'Vacuum',
    batch: 5,
    domains: 'vacuum.*',
    job: 'What it is doing and how far along; start, pause or send it home in one tap.',
    sizes: TILE_SIZES,
    states: VACUUM_STATES,
    recommended: 'B',
    chosen: { concept: 'A', notes: 'Dock.' },
    why: 'Rooms turns the tile into the thing people actually want (clean the kitchen now) without opening the app. Dock is the simplest and works with every vacuum; Path is the most delightful but needs a map.',
    concepts: [
      {
        id: 'A',
        name: 'Dock',
        Component: VacuumDock,
        idea: 'The robot as a puck inside its battery ring; the state in words, one main button (Start, Pause, Resume) and Dock.',
        interaction: 'Main button and Dock. Works with any vacuum integration.',
        strengths: ['Works with every vacuum', 'Battery and state in one picture', 'Calm when docked'],
        tradeoffs: ['No room choice on the tile', 'Progress only as words']
      },
      {
        id: 'B',
        name: 'Rooms',
        Component: VacuumRooms,
        idea: 'The rooms are chips: tap the ones to clean, then “Clean 2 rooms”. Large adds the suction level. Vacuums without rooms fall back to Dock.',
        interaction: 'Tap rooms to pick, then the main button; suction as a segmented control on Large.',
        strengths: ['Clean one room in two taps', 'Shows which room it is in', 'Progress as a bar'],
        tradeoffs: ['Needs segment support (Roborock, Dreame…)', 'Six rooms crowd Wide']
      },
      {
        id: 'C',
        name: 'Path',
        Component: VacuumPath,
        idea: 'A small floor plan with the trail it has cleaned so far, the robot dot and the dock.',
        interaction: 'Main button and Dock; the plan is read-only.',
        strengths: ['Progress you can see', 'Most delightful while it runs'],
        tradeoffs: ['Needs a map from the integration (this one is drawn)', 'Busy at Small']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientVacuum,
        idea: 'Glass card, the state colour glowing while it cleans; the orb is Start / Pause.',
        interaction: 'Tap the orb.',
        strengths: ['Matches the Ambient page', 'One control, big'],
        tradeoffs: ['No Dock or rooms on the tile']
      }
    ]
  }),
  entry({
    id: 'car',
    title: 'Car',
    batch: 5,
    domains: 'device: sensor (battery, range), binary_sensor (charging), lock, climate, device_tracker',
    job: 'X-small and Small: one entity of the car each. Wide, Tall and Large: the whole car in one tile.',
    sizes: TILE_SIZES,
    states: CAR_STATES,
    recommended: 'A',
    chosen: { concept: 'C', notes: 'Silhouette. X-small and Small leave the picture out and add Precondition as an icon button. The picture is the entity picture from Home Assistant, or the owner uploads their own.' },
    Tools: CarPictureTool,
    why: 'Gauge leads with what people check most (charge and range) and keeps the rest as chips. Dashboard shows every entity with its control; Silhouette looks most like a car app.',
    concepts: [
      {
        id: 'A',
        name: 'Gauge',
        Component: CarGauge,
        idea: 'A charge arc with the range inside and a tick at the charge limit; doors, climate and location as chips, the controls underneath.',
        interaction: 'Doors: Lock, or press then hold to unlock. Precondition. Small tiles: the entity’s own control (Charge, Heat).',
        strengths: ['Charge and range at a glance', 'Charge limit visible', 'Pulses while charging'],
        tradeoffs: ['Location only as a chip', 'Wide shows the doors control only']
      },
      {
        id: 'B',
        name: 'Dashboard',
        Component: CarDashboard,
        idea: 'The car as a list: one row per entity (icon, value, words) with its control at the end of the row.',
        interaction: 'Every control in its row; Small tiles tint while their entity is active.',
        strengths: ['Everything the car exposes', 'Easy to add or drop rows'],
        tradeoffs: ['Least visual', 'Wide is read-only (no room for controls)']
      },
      {
        id: 'C',
        name: 'Silhouette',
        Component: CarSilhouette,
        idea: 'The car itself (its entity picture, or your own upload), a charge bar under it, the state as badges. X-small and Small: no picture, the entity with its control and Precondition as an icon.',
        interaction: 'Doors and climate buttons on Tall and Large; Wide is read-only. Small tiles: the entity’s control plus Precondition (X-small: one of the two).',
        strengths: ['Instantly “the car”', 'Uses the picture HA already has'],
        tradeoffs: ['Picture takes space on Small', 'Needs a side-view picture to look right']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientCar,
        idea: 'Glass card, green glow while charging; battery and range in big type, the orb charges (or preconditions when unplugged).',
        interaction: 'Orb: charge or climate; doors in the corner with hold to unlock.',
        strengths: ['Matches the Ambient page', 'Charging obvious from across the room'],
        tradeoffs: ['Doors, climate and location share one line']
      }
    ]
  })
];
