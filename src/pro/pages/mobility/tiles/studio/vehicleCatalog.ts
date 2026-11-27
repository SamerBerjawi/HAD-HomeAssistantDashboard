/**
 * What the Vehicle Tiles Studio shows (docs/pro-ui/VEHICLE_TILES.md): the Mobility page's parts as
 * Room-page tiles, grouped into review batches, and for each designed part its concepts. Built
 * like the Area Tiles Studio (`areas/studio/areaCatalog.ts`).
 */
import type { ComponentType } from 'react';
import type { TileSize } from '../../../../areas/tileTypes';
import type { VehicleTileProps } from '../vehicleTileKit';
import { BatteryFill, BatteryHalo, BatteryStatus } from '../energy/BatteryTiles';
import { ChargingOrb, ChargingPlug, ChargingTimeline } from '../energy/ChargingTiles';
import { LimitLadder, LimitPresets, LimitScale } from '../energy/LimitTiles';
import { ClimateCountdown, ClimateOrb, ClimateWarmup } from '../cabin/ClimateTiles';
import { TempDial, TempPresets, TempStepper } from '../cabin/TemperatureTiles';
import { ExtrasChips, ExtrasPlan, ExtrasRows } from '../cabin/ExtrasTiles';
import { DoorsCar, DoorsShield, DoorsStatus } from '../security/DoorsTiles';
import { OpeningsChecklist, OpeningsList, OpeningsPlan } from '../security/OpeningsTiles';
import { AlarmFind, AlarmQuiet, AlarmStatus } from '../security/AlarmTiles';

export type VehicleConceptId = 'A' | 'B' | 'C';

export interface VehicleConcept {
  id: VehicleConceptId;
  name: string;
  idea: string;
  interaction: string;
  strengths: string[];
  tradeoffs: string[];
  Component: ComponentType<VehicleTileProps>;
}

export interface VehicleTileType {
  id: 'battery' | 'charging' | 'limit' | 'climate' | 'temp' | 'extras' | 'doors' | 'openings' | 'alarm';
  title: string;
  batch: number;
  /** What it shows from the vehicle. */
  reads: string;
  job: string;
  sizes: readonly TileSize[];
  concepts: VehicleConcept[];
  recommended: VehicleConceptId;
  /** The owner's choice, once made. */
  chosen?: VehicleConceptId;
  why: string;
}

const SIZES: readonly TileSize[] = ['xs', 's', 'w', 'l'];

export const VEHICLE_TYPES: readonly VehicleTileType[] = [
  {
    id: 'battery',
    title: 'Battery & range',
    batch: 1,
    reads: 'level, range, charge limit, last session',
    chosen: 'B',
    job: 'How much charge, and how far it gets you: the first thing anyone checks.',
    sizes: SIZES,
    recommended: 'A',
    why: 'Halo makes the charge an object you recognise from across the room, in the same family as the Light tile, and keeps the limit visible. Fill reads fastest; Status says what it means for today.',
    concepts: [
      {
        id: 'A',
        name: 'Halo',
        Component: BatteryHalo,
        idea: 'The charge as a glowing ring around the battery (the Light tile’s halo); the charge limit is a tick on the ring. Wide puts the % big beside it; Large adds range, limit and last session.',
        interaction: 'Read-only (the controls live on Charging and Charge limit).',
        strengths: ['Same family as the Room page’s Light tile', 'Charge and limit in one shape', 'Pulses while charging'],
        tradeoffs: ['The ring takes room on Small', 'Range is second']
      },
      {
        id: 'B',
        name: 'Fill',
        Component: BatteryFill,
        idea: 'The tile is the battery: it fills with charge from the left, the limit a dashed hairline, a soft sheen sweeping while it charges. % and range in big type.',
        interaction: 'Read-only.',
        strengths: ['Reads from across the room', 'Range as big as the %', 'No extra graphic'],
        tradeoffs: ['Less like a Room tile', 'The fill fights text at high charge']
      },
      {
        id: 'C',
        name: 'Status',
        Component: BatteryStatus,
        idea: 'The verdict first, as the Reading tile does: “Plenty”, “Enough”, “Low, charge tonight”, in green or amber; % and range second; a band meter with the low zone and the limit from Wide up.',
        interaction: 'Read-only.',
        strengths: ['Says what it means', 'Same as the rail’s readings', 'Warnings stand out'],
        tradeoffs: ['The number is smaller', 'Words are a judgement']
      }
    ]
  },
  {
    id: 'charging',
    title: 'Charging',
    batch: 1,
    reads: 'plugged in, charging state, power, ready by, limit, start / pause',
    chosen: 'C',
    job: 'Is it plugged in and charging, when will it be ready; start or pause in one tap.',
    sizes: SIZES,
    recommended: 'A',
    why: 'Orb is the Room page’s Ambient switch and fan: one glowing button that does the one thing, the state as a word. Plug is the most delightful; Timeline answers “when” best.',
    concepts: [
      {
        id: 'A',
        name: 'Orb',
        Component: ChargingOrb,
        idea: 'The Ambient family: the state word big (Charging, Charged, Paused, Unplugged), a glowing power orb to start or pause, kW and “ready by” under it, a slim bar to the limit.',
        interaction: 'Tap the orb to start or pause (only when plugged in and the car allows it).',
        strengths: ['Same as the Room page’s fan and switches', 'One obvious control', 'Glows while charging'],
        tradeoffs: ['“Ready by” is only words', 'Large has space to spare']
      },
      {
        id: 'B',
        name: 'Plug',
        Component: ChargingPlug,
        idea: 'The cable and the car’s socket drawn: apart when unplugged, joined when plugged in, energy flowing along the cable while it charges; a check when charged.',
        interaction: 'Tap the plug to start or pause.',
        strengths: ['Plugged in or not at a glance', 'Charging is visibly happening', 'Memorable'],
        tradeoffs: ['Illustrative, less like the other tiles', 'The control is less obvious']
      },
      {
        id: 'C',
        name: 'Timeline',
        Component: ChargingTimeline,
        idea: 'Tonight as a line from now to “ready by”, the charge at each end (61% now · 90% by 07:10); dashed when unplugged; Start or Pause as a button.',
        interaction: 'Start / Pause button.',
        strengths: ['Answers “when will it be ready?”', 'Plain and calm', 'Clear button'],
        tradeoffs: ['Needs a ready time to shine', 'Least glanceable state']
      }
    ]
  },
  {
    id: 'limit',
    title: 'Charge limit',
    batch: 1,
    reads: 'charge limit and the steps the car accepts',
    chosen: 'C',
    job: 'Where charging stops, set in one tap; only the steps the car accepts (FordPass: 50–100).',
    sizes: SIZES,
    recommended: 'A',
    why: 'Ladder is the Blind tile’s Positions: every choice visible, one tap, no dragging. Scale is the Thermostat’s ruler (the charge now as a dot); Presets explain the why.',
    concepts: [
      {
        id: 'A',
        name: 'Ladder',
        Component: LimitLadder,
        idea: 'The steps as rungs (every ten, plus the chosen one), filled up to the limit; the chosen rung solid. Stands up on Small, lies down on Wide.',
        interaction: 'Tap a rung.',
        strengths: ['Every choice visible', 'Same as the Blind tile', 'One tap'],
        tradeoffs: ['85% and 95% only show when chosen', 'Busy on X-small']
      },
      {
        id: 'B',
        name: 'Scale',
        Component: LimitScale,
        idea: 'A ruler from the lowest step to 100: the charge now a dot, the limit a glowing pin, the stretch between them filled; − / + step through the car’s choices.',
        interaction: '− / +, or tap the ruler.',
        strengths: ['Shows how far it still has to charge', 'Same as the Thermostat tile', 'Fine steps'],
        tradeoffs: ['Small targets on the ruler', 'Two taps to go far']
      },
      {
        id: 'C',
        name: 'Presets',
        Component: LimitPresets,
        idea: 'What the limit is for: Daily (90%, or 80% when the car has no 90) or Long trip 100%, the chosen one in its colour with why; anything else is Custom (− / + on Large).',
        interaction: 'Tap a preset.',
        strengths: ['Explains the choice', 'Two taps cover most days', 'Tinted when set for a trip'],
        tradeoffs: ['Custom values need Large', 'Words are opinions']
      }
    ]
  },
  {
    id: 'climate',
    chosen: 'C',
    title: 'Remote start & climate',
    batch: 2,
    reads: 'running, minutes left, cabin, outside, set temperature',
    job: 'Is the cabin being warmed, how long is left; start or stop in one tap (FordPass: by starting the car).',
    sizes: SIZES,
    recommended: 'C',
    why: 'Warm-up is your Charging pick (Timeline) for the cabin: the same line, the same Start / Stop button, so the two tiles read as a pair. Orb is the Room page’s fan; Countdown shows best that a remote start stops by itself.',
    concepts: [
      {
        id: 'A',
        name: 'Orb',
        Component: ClimateOrb,
        idea: 'The Ambient family, as Charging A: the state word big (Warming up, Comfortable, Off), a glowing orb with the engine to start or stop, minutes left and the cabin under it; warm glow while heating, cool while cooling.',
        interaction: 'Tap the orb.',
        strengths: ['Same as the Room page’s fan and switches', 'One obvious control', 'Glows while it runs'],
        tradeoffs: ['Different from your Charging pick', 'Minutes left are only words']
      },
      {
        id: 'B',
        name: 'Countdown',
        Component: ClimateCountdown,
        idea: 'The 15 minutes of a remote start as a ring running down, the minutes in the middle (the cabin temperature when off); Start / Stop beside it.',
        interaction: 'Start / Stop button.',
        strengths: ['Shows it stops by itself', 'Readable from across the room', 'Same ring as the Thermostat'],
        tradeoffs: ['The ring is empty most of the day', 'The cabin temperature is second']
      },
      {
        id: 'C',
        name: 'Warm-up',
        Component: ClimateWarmup,
        idea: 'The cabin now to the set temperature as a line (6° → 21°), outside a faint tick, the stretch glowing from cool to warm while it runs; Start / Stop as a button.',
        interaction: 'Start / Stop button.',
        strengths: ['Pairs with your Charging Timeline', 'Says how far it still has to go', 'Calm when off'],
        tradeoffs: ['Needs the cabin temperature', 'Least glanceable state']
      }
    ]
  },
  {
    id: 'temp',
    chosen: 'C',
    title: 'Set temperature',
    batch: 2,
    reads: 'set temperature, cabin',
    job: 'What the climate aims for, through the values the car accepts (16–28° in halves).',
    sizes: SIZES,
    recommended: 'C',
    why: 'Presets is your Charge limit pick (Presets) for the cabin: Comfort for most days, Warm or Cool when the weather says so, in two taps. Stepper is the plainest; Dial is the Room page’s Thermostat.',
    concepts: [
      {
        id: 'A',
        name: 'Stepper',
        Component: TempStepper,
        idea: 'The number big, − / + beside it in round glass buttons; the cabin temperature under it.',
        interaction: '− / + in halves.',
        strengths: ['Plainest', 'The number reads from across the room', 'Fits X-small'],
        tradeoffs: ['Many taps to go far', 'No sense of the range']
      },
      {
        id: 'B',
        name: 'Dial',
        Component: TempDial,
        idea: 'The Thermostat’s ring from 16 to 28°, the set point a glowing arc (cool blue to warm orange), the cabin now a dot on it; − / + under it.',
        interaction: '− / + in halves.',
        strengths: ['Same as the Room page’s Thermostat', 'Cabin and set point on one shape'],
        tradeoffs: ['Takes the most room', 'The ring cannot be dragged yet']
      },
      {
        id: 'C',
        name: 'Presets',
        Component: TempPresets,
        idea: 'Cool 19°, Comfort 21°, Warm 23°, the chosen one in its colour with why; anything else is Custom (− / + on Large).',
        interaction: 'Tap a preset.',
        strengths: ['Pairs with your Charge limit Presets', 'One tap covers most days', 'Says what it is for'],
        tradeoffs: ['Custom values need Large', 'The three values are a guess']
      }
    ]
  },
  {
    id: 'extras',
    chosen: 'B',
    title: 'Extras',
    batch: 2,
    reads: 'windscreen, rear window, steering wheel, seats (what the car offers)',
    job: 'What comes on with the climate, each one tap.',
    sizes: SIZES,
    recommended: 'B',
    why: 'Car plan puts each part where it is in the car, so nothing needs reading: the windscreen glows at the front, the seat where you sit. Chips are the most compact; Rows the calmest.',
    concepts: [
      {
        id: 'A',
        name: 'Chips',
        Component: ExtrasChips,
        idea: 'One chip per extra with its icon, lit warm when on; X-small is the icons alone.',
        interaction: 'Tap a chip.',
        strengths: ['Compact', 'Fits any number of extras', 'Same chips as the Room tiles'],
        tradeoffs: ['Reads as a list of words', 'Icons alone on X-small']
      },
      {
        id: 'B',
        name: 'Car plan',
        Component: ExtrasPlan,
        idea: 'The car from above: the windscreen and rear window as glass that glows when heated, the wheel and seats as round buttons where they sit; parts it cannot place get a button below.',
        interaction: 'Tap the part.',
        strengths: ['No reading needed', 'Delightful, and still one tap', 'Shows what is heating at a glance'],
        tradeoffs: ['Illustrative, the least like a Room tile', 'Small targets on Small']
      },
      {
        id: 'C',
        name: 'Rows',
        Component: ExtrasRows,
        idea: 'A quiet list: icon, name and On / Off per row; X-small is the count and All on / All off.',
        interaction: 'Tap a row; All on / off on X-small.',
        strengths: ['Calmest', 'Full names', 'All on / off in one tap'],
        tradeoffs: ['Small shows three rows', 'Least visual']
      }
    ]
  },
  {
    id: 'doors',
    chosen: 'A',
    title: 'Doors',
    batch: 3,
    reads: 'locked, and the openings and alarm for the verdict',
    job: 'Is it locked; lock in one press, unlock in two (press, then hold while it fills: the Room page’s rule).',
    sizes: SIZES,
    recommended: 'A',
    why: 'Status is the Room page’s chosen Lock tile for the car, with the same two-step unlock, so locking reads the same everywhere. Shield answers “is it secure?” in one word; Car is the most visual.',
    concepts: [
      {
        id: 'A',
        name: 'Status',
        Component: DoorsStatus,
        idea: 'The Room page’s Lock · Status: Locked in green or Unlocked in amber, by word, the padlock chip, one button (Lock; Unlock then hold).',
        interaction: 'Lock in a press; Unlock: press, then hold.',
        strengths: ['Same as the Room page’s lock', 'The word reads from across the room', 'Unlock never by a stray tap'],
        tradeoffs: ['Only the lock', 'Plain']
      },
      {
        id: 'B',
        name: 'Shield',
        Component: DoorsShield,
        idea: 'The whole verdict as a shield: Secure, Unlocked, Rear left window open; its three checks (locked, all closed, alarm set) beside it; the same button.',
        interaction: 'Lock in a press; Unlock: press, then hold.',
        strengths: ['Answers “is it secure?”', 'Says what is wrong', 'One tile for the section on phone'],
        tradeoffs: ['Repeats the Openings and Alarm tiles', 'X-small has no button']
      },
      {
        id: 'C',
        name: 'Car',
        Component: DoorsCar,
        idea: 'The car’s side in fine line, a padlock badge on the front door, green when locked and amber when not, glowing softly; the button under it.',
        interaction: 'Lock in a press; Unlock: press, then hold.',
        strengths: ['Most visual', 'Uses the page’s car drawing', 'Your car at a glance'],
        tradeoffs: ['The drawing takes the room', 'Less like a Room tile']
      }
    ]
  },
  {
    id: 'openings',
    chosen: 'A',
    title: 'Openings',
    batch: 3,
    reads: 'doors, windows, boot, bonnet, charge port (FordPass: doorstatus, windowposition)',
    job: 'Is anything open, and where. Read only.',
    sizes: SIZES,
    recommended: 'B',
    why: 'Car plan matches your Extras pick: the same car from above, the open door or window drawn amber where it is, so you see it before you read it. List is the plainest; Checklist shows every kind was checked.',
    concepts: [
      {
        id: 'A',
        name: 'List',
        Component: OpeningsList,
        idea: '“All closed” with a green check, or the open ones named in amber (Rear left window), the tile washed amber.',
        interaction: 'Read only.',
        strengths: ['Plainest', 'Names what is open', 'Calm when closed'],
        tradeoffs: ['No sense of where', 'A long list on Small']
      },
      {
        id: 'B',
        name: 'Car plan',
        Component: OpeningsPlan,
        idea: 'The car from above (as Extras · Car plan), facing right: an open door swings out amber, an open window is an amber bar, the boot or bonnet glows; the summary beside it.',
        interaction: 'Read only.',
        strengths: ['Pairs with your Extras pick', 'Where, at a glance', 'Calm when all is closed'],
        tradeoffs: ['Needs “front / rear, left / right” from the car', 'Illustrative']
      },
      {
        id: 'C',
        name: 'Checklist',
        Component: OpeningsChecklist,
        idea: 'Doors, Windows, Boot, Bonnet, each with a check or what is open; Small and X-small as four checks.',
        interaction: 'Read only.',
        strengths: ['Shows every kind was checked', 'Same as the condition list'],
        tradeoffs: ['Busy when all is fine', 'Words over picture']
      }
    ]
  },
  {
    id: 'alarm',
    chosen: 'B',
    title: 'Alarm & find',
    batch: 3,
    reads: 'alarm (set, off, going off), stolen and crashed (bike), honk & flash',
    job: 'Is the alarm set or going off; find the car by honking and flashing.',
    sizes: SIZES,
    recommended: 'C',
    why: 'Quiet stays out of the way while all is well (the alarm is set nearly always) and takes over in red when it matters, with Honk & flash ready. Status is the plainest; Find makes finding the car the point.',
    concepts: [
      {
        id: 'A',
        name: 'Status',
        Component: AlarmStatus,
        idea: 'The alarm as a word with its shield (Alarm set, Alarm off, Going off in red); Honk & flash as a button.',
        interaction: 'Honk & flash button.',
        strengths: ['Plain', 'Same as the Doors tile', 'Bikes: stolen, crashed'],
        tradeoffs: ['Says “Alarm set” all day', 'The button is second']
      },
      {
        id: 'B',
        name: 'Find',
        Component: AlarmFind,
        idea: 'One big round Honk & flash button in warm light; rings ripple out after each press; the alarm small under it.',
        interaction: 'Tap the button.',
        strengths: ['Made for the car park', 'Delightful feedback', 'Big target'],
        tradeoffs: ['The alarm is small', 'Big for a rare action']
      },
      {
        id: 'C',
        name: 'Quiet',
        Component: AlarmQuiet,
        idea: 'A small “Alarm set” and Honk & flash while all is well; the whole tile turns red with what happened when the alarm goes off or the bike is stolen or crashed.',
        interaction: 'Honk & flash button.',
        strengths: ['Out of the way until it matters', 'Impossible to miss when it does', 'Bikes too'],
        tradeoffs: ['Little to see most days', 'Red is loud on a calm page']
      }
    ]
  }
];

/** The proposed batches: each part of the Mobility page as a tile (owner reviews batch by batch). */
export const VEHICLE_BATCHES: { id: number; title: string; status: 'chosen' | 'review' | 'next' | 'later'; parts: { name: string; note: string; standIn: string }[] }[] = [
  {
    id: 1,
    title: 'Energy',
    status: 'chosen',
    parts: [
      { name: 'Battery & range', note: 'Level, range, limit', standIn: '—' },
      { name: 'Charging', note: 'Plugged in, charging, kW, ready by, start / pause', standIn: '—' },
      { name: 'Charge limit', note: 'The car’s steps, one tap', standIn: '—' }
    ]
  },
  {
    id: 2,
    title: 'Cabin',
    status: 'chosen',
    parts: [
      { name: 'Remote start & climate', note: 'Start / stop, minutes left, cabin and outside', standIn: '—' },
      { name: 'Set temperature', note: '16–28° in halves', standIn: '—' },
      { name: 'Extras', note: 'Windscreen, rear window, wheel, seats', standIn: '—' }
    ]
  },
  {
    id: 3,
    title: 'Security',
    status: 'chosen',
    parts: [
      { name: 'Doors', note: 'Lock, press then hold to unlock', standIn: '—' },
      { name: 'Openings', note: 'Doors, windows, boot, bonnet', standIn: '—' },
      { name: 'Alarm & find', note: 'Set, going off; honk & flash', standIn: '—' }
    ]
  },
  {
    id: 4,
    title: 'Where & trips',
    status: 'review',
    parts: [
      { name: 'Location', note: 'Map, zone, address, last seen', standIn: 'Car · Silhouette (location)' },
      { name: 'Today', note: 'Drives today on a 24 h bar', standIn: '—' },
      { name: 'Last trip', note: 'Distance, time, energy', standIn: '—' }
    ]
  },
  {
    id: 5,
    title: 'Condition',
    status: 'later',
    parts: [
      { name: 'Tyres', note: 'Four pressures, the low one amber', standIn: 'Reading · Status ×4' },
      { name: '12 V battery & oil', note: 'Readings with a verdict', standIn: 'Reading · Status' },
      { name: 'Software', note: 'Stage, version, next window', standIn: '—' },
      { name: 'Warnings', note: 'The make’s messages', standIn: '—' }
    ]
  },
  {
    id: 6,
    title: 'The page',
    status: 'later',
    parts: [
      { name: 'Rail', note: 'Vehicle picture, name ⌄ (switch vehicle), facts, readiness, on this page', standIn: 'Room page rail' },
      { name: 'Sections and views', note: 'Energy, Cabin, Security, Where, Condition; All | Now', standIn: 'Room page sections' },
      { name: 'Phone', note: 'Picture header, section chips, 2 columns', standIn: 'Room page phone' }
    ]
  }
];
