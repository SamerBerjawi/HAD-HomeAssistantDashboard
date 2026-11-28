/** Batch 1 · Light & power: the types, their states and concepts (docs/pro-ui/AREA_TILES.md). */
import { TILE_SIZES } from '../../tileTypes';
import LightPour from '../../tiles/light/LightPour';
import LightHalo from '../../tiles/light/LightHalo';
import LightSteps from '../../tiles/light/LightSteps';
import SwitchRocker from '../../tiles/switch/SwitchRocker';
import SwitchMeter from '../../tiles/switch/SwitchMeter';
import SwitchTrack from '../../tiles/switch/SwitchTrack';
import FanRotor from '../../tiles/fan/FanRotor';
import FanThrottle from '../../tiles/fan/FanThrottle';
import FanBreeze from '../../tiles/fan/FanBreeze';
import { AmbientFan, AmbientLight, AmbientSwitch } from '../../tiles/ambient/AmbientPower';
import { FAN_STATES, LIGHT_STATES, SWITCH_STATES } from '../areaStates';
import { entry, type TileTypeEntry } from './catalogTypes';
import type { TileModel } from '../../tileTypes';

export const BATCH_1: TileTypeEntry<TileModel>[] = [
  entry({
    id: 'light',
    batch: 1,
    title: 'Light',
    domains: 'light.*',
    job: 'Switch it and set the mood (brightness, tone, colour) without opening anything.',
    sizes: TILE_SIZES,
    states: LIGHT_STATES,
    recommended: 'A',
    chosen: { concept: 'B', notes: 'Halo. Small shows the level with its % sign; on/off-only lights (no dimming, no colour) get a plain lit ring and say how long they have been on or off.' },
    why: 'Pour makes the most-used control (brightness) the whole tile, so it is the fastest to use, and the poured colour shows the room at a glance. Halo is the most beautiful but needs more room; Steps is the most precise.',
    concepts: [
      {
        id: 'A',
        name: 'Pour',
        Component: LightPour,
        idea: 'The tile is the dimmer. Light pours across it in the bulb’s own colour, as far as its brightness; the text turns dark where the light covers it.',
        interaction: 'Slide anywhere to dim (sideways, so the page still scrolls), tap to switch. Large: tone or colour chips.',
        strengths: ['Biggest possible target: the whole tile', 'State is readable from across the room', 'One gesture model for every size'],
        tradeoffs: ['Sliding is less exact than taps', 'Sideways slide on a Tall tile feels less natural than up/down']
      },
      {
        id: 'B',
        name: 'Halo',
        Component: LightHalo,
        idea: 'The light as an object: a glowing bulb inside a dimmer ring, and the tile lit from the bulb outwards.',
        interaction: 'Tap the bulb to switch, turn the ring to dim; Wide and up add tone or colour swatches.',
        strengths: ['Most distinctive and premium look', 'Clear split: bulb = on/off, ring = level', 'Glow strength shows brightness'],
        tradeoffs: ['Ring is small on Small tiles', 'Uses space for the drawing rather than words']
      },
      {
        id: 'C',
        name: 'Steps',
        Component: LightSteps,
        idea: 'An instrument panel: five brightness steps drawn as a rising stair, a power key and, on Large, a palette.',
        interaction: 'Taps only: a step sets 20/40/60/80/100%, the key switches, swatches set tone or colour.',
        strengths: ['Exact and predictable, works with wet hands', 'Very easy for guests and kids', 'Nothing to drag, nothing to miss'],
        tradeoffs: ['Only five levels from the tile', 'Calmer, less atmospheric']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientLight,
        idea: "From your reference: frosted glass, the bulb glowing in the light’s colour, and a soft wave of light rising from the corner as it gets brighter.",
        interaction: "Round glowing power button; slide anywhere on the tile to dim. Large adds tone pills.",
        strengths: ['Calm, premium, very “smart home”', 'Wave and glow show brightness at a glance', 'Same language works for every type'],
        tradeoffs: ['Lower contrast than A–C (glass on dark)', 'Wave is atmosphere, less exact than a fill']
      }
    ]
  }),
  entry({
    id: 'switch',
    batch: 1,
    title: 'Switch & plug',
    domains: 'switch.*, input_boolean.*',
    job: 'Flip it, and for plugs see what the appliance is drawing.',
    sizes: TILE_SIZES,
    states: SWITCH_STATES,
    recommended: 'C',
    chosen: { concept: 'D', notes: 'Ambient, but metered plugs show the power trace from Meter (B) instead of the wave.' },
    why: 'Track is unmistakable (the whole tile is the switch) and reads its state from a distance; plugs with power meters could add the trace from Meter on Large.',
    concepts: [
      {
        id: 'A',
        name: 'Rocker',
        Component: SwitchRocker,
        idea: 'A real wall rocker: a plate split in two, the pressed half sunk in and lit when on. What it powers and draws beside it.',
        interaction: 'Press the plate. Large shows now, today and how long in its own column.',
        strengths: ['Instantly familiar, physical', 'On/off can’t be misread (I / O)'],
        tradeoffs: ['Skeuomorphic, a different flavour from the rest', 'Plate takes width on Small']
      },
      {
        id: 'B',
        name: 'Meter',
        Component: SwitchMeter,
        idea: 'Data first for plugs: live watts lead, a frameless trace of the last hours under it, the toggle in the corner.',
        interaction: 'Toggle in the corner. A switch with no meter leads with On / Off and how long.',
        strengths: ['Shows what the appliance is doing (is the washer done?)', 'Great on Wide and Large'],
        tradeoffs: ['Small target for the toggle', 'Plain wall switches have little to show']
      },
      {
        id: 'C',
        name: 'Track',
        Component: SwitchTrack,
        idea: 'The tile is the switch: a big knob carrying the device icon rides across it and the track floods with the accent when on.',
        interaction: 'Tap anywhere. The knob runs along the long side (up the Tall tile).',
        strengths: ['Whole tile is the target', 'State visible from across the room', 'Playful spring motion'],
        tradeoffs: ['Little room for numbers on Small', 'Accent fill is loud if many switches are on']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientSwitch,
        idea: "Glass card, the plug glowing mint, a wave that grows with what it draws.",
        interaction: "Round glowing power button; the wave and the big number show the load.",
        strengths: ['Matches the lights and fans exactly', 'Load is felt (wave) and read (watts)'],
        tradeoffs: ['Power button is the only target', 'A plain switch has little to show']
      }
    ]
  }),
  entry({
    id: 'fan',
    batch: 1,
    title: 'Fan',
    domains: 'fan.*',
    job: 'Is it on, how fast, in which mode: answered and changed from the tile.',
    sizes: TILE_SIZES,
    states: FAN_STATES,
    recommended: 'B',
    chosen: { concept: 'C', notes: 'Breeze.' },
    why: 'Throttle fixes the old confusion: Off is simply the first notch on the same lever as the speeds, so one control answers both questions. Rotor is the most delightful; Breeze is best for fans that live in their presets.',
    concepts: [
      {
        id: 'A',
        name: 'Rotor',
        Component: FanRotor,
        idea: 'The fan you can see: its rotor turns at the fan’s real speed (still when off). Level dots make the speed exact.',
        interaction: 'Tap the rotor to switch; − / + or a dot set the speed. Large adds modes, swing and direction.',
        strengths: ['Speed is felt, not read', 'Very recognisable', 'Clear on / off (still vs turning)'],
        tradeoffs: ['Motion on many tiles can be busy (honours reduced motion)', 'Two places to look: rotor and dots']
      },
      {
        id: 'B',
        name: 'Throttle',
        Component: FanThrottle,
        idea: 'A notched lever like a desk fan’s slider: Off, 1, 2, 3… Push the grip or tap a notch; it snaps.',
        interaction: 'Drag the grip or tap a notch; mode in a menu. The lever stands up in the Tall tile.',
        strengths: ['One control for power and speed', 'Every level is labelled', 'Works for 1–10 speeds'],
        tradeoffs: ['Grip is a small drag target on Small (notches still tap)', 'Modes hidden in a menu']
      },
      {
        id: 'C',
        name: 'Breeze',
        Component: FanBreeze,
        idea: 'Mode first: the preset is the headline, streaks of air drift across the tile at the fan’s speed, speed is a pill row.',
        interaction: 'Power key; tap a mode or a speed pill. Large adds swing and direction.',
        strengths: ['Best for smart fans with presets', 'Calm, atmospheric, very “premium home”'],
        tradeoffs: ['Plain fans have no mode to lead with', 'Small shows mode only (speed on Wide+)']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientFan,
        idea: "Glass card, the fan icon spinning at the fan’s speed, a teal wave rising with it, a glowing speed bar.",
        interaction: "Round power button; tap the speed bar from Wide up.",
        strengths: ['Same family as lights and switches', 'Speed visible three ways (spin, wave, bar)'],
        tradeoffs: ['Speed only from Wide up', 'Modes not on the tile yet']
      }
    ]
  })
];
