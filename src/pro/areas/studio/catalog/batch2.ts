/** Batch 2 · Climate & air: the types, their states and concepts (docs/pro-ui/AREA_TILES.md). */
import { TILE_SIZES } from '../../tileTypes';
import { AmbientCover, AmbientReading, AmbientThermostat } from '../../tiles/ambient/AmbientClimate';
import ThermoScale from '../../tiles/climate/ThermoScale';
import ThermoModes from '../../tiles/climate/ThermoModes';
import ThermoStep from '../../tiles/climate/ThermoStep';
import CoverLadder from '../../tiles/cover/CoverLadder';
import CoverShade from '../../tiles/cover/CoverShade';
import CoverArrows from '../../tiles/cover/CoverArrows';
import ReadingGauge from '../../tiles/reading/ReadingGauge';
import ReadingTrend from '../../tiles/reading/ReadingTrend';
import ReadingStatus from '../../tiles/reading/ReadingStatus';
import { CLIMATE_STATES, COVER_STATES, READING_STATES } from '../areaStates';
import { entry, type TileTypeEntry } from './catalogTypes';
import type { TileModel } from '../../tileTypes';

export const BATCH_2: TileTypeEntry<TileModel>[] = [
  entry({
    id: 'climate',
    title: 'Thermostat',
    batch: 2,
    domains: 'climate.*',
    job: "Current temperature, target and mode at a glance; nudge the target.",
    sizes: TILE_SIZES,
    states: CLIMATE_STATES,
    recommended: 'A',
    chosen: { concept: 'A', notes: 'Scale.' },
    why: 'Scale shows the one thing a thermostat is about, the gap between now and the target, and makes it a single drag. Modes suits homes that switch Heat / Cool / Off more than they tune degrees; Big step is the simplest to use from across the room.',
    concepts: [
      {
        id: 'A',
        name: 'Scale',
        Component: ThermoScale,
        idea: 'A ruler of degrees: the room is a dot, the target a pin, and the stretch between them fills orange (heating up to it) or blue (cooling down to it). The gap is the work left.',
        interaction: 'Drag the pin (or tap the scale), − / + for exact steps; mode in a menu from Wide up. Tall stands the scale up like a thermometer.',
        strengths: ['Now, target and the gap in one picture', 'Precise without a dial', 'Sideways drag never fights scrolling'],
        tradeoffs: ['A wide range (7–28°) makes the steps small on Small', 'Mode is a menu, not on the tile']
      },
      {
        id: 'B',
        name: 'Modes',
        Component: ThermoModes,
        idea: 'Mode first: the modes the device has are big buttons, the chosen one solid in its colour, the tile tinted with it. Target second, with − / +.',
        interaction: 'Tap a mode; − / + for the target (Wide up). X-small: the mode as a menu.',
        strengths: ['Off / Heat / Cool is one tap', 'Shows exactly what the device can do', 'Mood of the room at a glance (tint)'],
        tradeoffs: ['Small has no target control', 'Six-mode devices crowd Small and Tall (the current mode always stays)']
      },
      {
        id: 'C',
        name: 'Big step',
        Component: ThermoStep,
        idea: 'One huge number, the target. The top half of it is “warmer”, the bottom half “cooler”; faint chevrons say so. Room temperature and action sit small.',
        interaction: 'Tap the top or bottom of the number. Off: a big Turn on. Mode in a menu from Wide up.',
        strengths: ['Nothing to aim at but the number', 'Readable from across the room', 'Calmest tile of the three'],
        tradeoffs: ['One step per tap (no big jumps)', 'The halves are invisible until you know them']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientThermostat,
        idea: "A glowing ring in the mode’s colour (blue cooling, orange heating): current temperature in the middle, target under it.",
        interaction: "Turn the ring or use − / +; mode in a menu. Small is the ring alone.",
        strengths: ['Iconic and instantly readable', 'Mode colour is the whole mood'],
        tradeoffs: ['Small has no room for the name', 'Ring drag needs care near the page edge']
      }
    ]
  }),
  entry({
    id: 'cover',
    title: 'Blind & cover',
    batch: 2,
    domains: 'cover.*',
    job: "Open, close or set a position, and see how open it is.",
    sizes: TILE_SIZES,
    states: COVER_STATES,
    recommended: 'A',
    chosen: { concept: 'A', notes: 'Positions.' },
    why: 'Positions matches how blinds are really used (a few fixed heights) with one tap each, and works for garage doors too. Shade is the most beautiful and literal; Arrows is the most foolproof.',
    concepts: [
      {
        id: 'A',
        name: 'Positions',
        Component: CoverLadder,
        idea: 'A ladder of the positions people use: Closed, 25, 50, 75, Open. The rungs up to where it is are filled, the nearest is solid.',
        interaction: 'Tap a rung to go there; Stop appears while it moves. Open/close-only covers get two rungs. Tall stands the ladder up.',
        strengths: ['One tap to a useful height', 'Position readable without a number', 'Same tile for blinds and garage doors'],
        tradeoffs: ['Only five heights (exact % in the detail view)', 'Busier than plain up / down']
      },
      {
        id: 'B',
        name: 'Shade',
        Component: CoverShade,
        idea: 'The tile is the window: fabric hangs from a roller as far as it is closed, the sky (day, or night in dark mode) below. Garage doors show panels.',
        interaction: 'Pull the bar on the fabric’s edge to any position; round up / down (and stop) buttons in the corner.',
        strengths: ['Position is literal: you see the blind', 'Any position by dragging', 'A lovely, calm tile'],
        tradeoffs: ['Text sits on fabric or sky, so contrast varies', 'No pull bar on X-small (buttons only)']
      },
      {
        id: 'C',
        name: 'Arrows',
        Component: CoverArrows,
        idea: 'Two big buttons fill the tile: up on top, down below (side by side on X-small and Wide). How open it is runs as a bar between them.',
        interaction: 'Tap up or down; while it moves its arrow keeps nudging that way and the bar becomes Stop.',
        strengths: ['Huge targets: wall tablets, gloves, guests', 'Moving state is obvious', 'Nothing to learn'],
        tradeoffs: ['No set position on the tile', 'Small shows the name and bar only']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientCover,
        idea: "The window itself: slats come down from the top as far as the cover is closed; round up and down buttons beside it.",
        interaction: "Up / down (stop on Tall and Large); tap the window to set a position.",
        strengths: ['Position is literal, no number needed', 'Big, simple buttons'],
        tradeoffs: ['Small shows buttons, not the window']
      }
    ]
  }),
  entry({
    id: 'reading',
    title: 'Reading',
    batch: 2,
    domains: 'sensor.* (humidity, temperature, CO₂…)',
    job: "The value now and how it has been moving.",
    sizes: TILE_SIZES,
    states: READING_STATES,
    recommended: 'C',
    chosen: { concept: 'C', notes: 'Status.' },
    why: 'Status turns numbers into answers (“Dry: a humidifier would help”), so problems stand out on a room page. Trend is best for people who watch numbers; Gauge is the classic in-between.',
    concepts: [
      {
        id: 'A',
        name: 'Gauge',
        Component: ReadingGauge,
        idea: 'A half-dial with the comfortable range in green and a needle at the value, coloured by how good it is.',
        interaction: 'Read-only. Wide up add the comfort word and ideal range; Tall and Large the 6-hour low and high.',
        strengths: ['In or out of the band, at a glance', 'Familiar instrument look'],
        tradeoffs: ['A fixed scale per kind (CO₂ 400–2000)', 'Uses room for the dial on Small']
      },
      {
        id: 'B',
        name: 'Trend',
        Component: ReadingTrend,
        idea: 'Big value, the change in the last hour (“↑ 0.4° in 1 h”), and a line of the last six hours with low / high marked and a dot at now.',
        interaction: 'Read-only. The comfortable band shades the chart from Wide up.',
        strengths: ['Answers “is it rising?”', 'Exact numbers for people who like them'],
        tradeoffs: ['Most like a chart; busier than the others', 'Says nothing about comfort on Small']
      },
      {
        id: 'C',
        name: 'Status',
        Component: ReadingStatus,
        idea: 'The verdict first, “Comfortable”, “Dry”, “Stuffy”, in green, amber or red, with what to do. The number second; the tile washed in the verdict’s colour.',
        interaction: 'Read-only. From Wide up a band meter shows the value against the ideal range.',
        strengths: ['Meaning, not numbers', 'Problems stand out across the page', 'Works for anyone in the house'],
        tradeoffs: ['Bands are opinions (owner may want to tune them)', 'Unknown sensor kinds fall back to the value']
      },
      {
        id: 'D',
        name: 'Ambient',
        sizes: TILE_SIZES,
        Component: AmbientReading,
        idea: "The value over a soft curve of the last hours, in the reading’s colour (blue humidity, warm temperature, green or orange CO₂).",
        interaction: "Read-only; the range shows on Tall and Large.",
        strengths: ['Trend without a chart’s clutter', 'Very calm'],
        tradeoffs: ['No exact scale on the curve']
      }
    ]
  })
];
