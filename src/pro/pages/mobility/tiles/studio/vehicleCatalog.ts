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
import { LocationMap, LocationPlace, LocationSplit } from '../where/LocationTiles';
import { TodayBar, TodayNumbers, TodayTrace } from '../where/TodayTiles';
import { TripEfficiency, TripNumbers, TripTimeline } from '../where/TripTiles';
import { TyresGrid, TyresPlan, TyresStatus } from '../condition/TyresTiles';
import { HealthMeters, HealthReadings, HealthVerdict } from '../condition/HealthTiles';
import { SoftwareStatus, SoftwareSteps, SoftwareTimeline } from '../condition/SoftwareTiles';
import { WarningsCount, WarningsList, WarningsQuiet } from '../condition/WarningsTiles';
import { STATS_TYPES } from './statsCatalog';

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
  id: 'battery' | 'charging' | 'limit' | 'climate' | 'temp' | 'extras' | 'doors' | 'openings' | 'alarm' | 'location' | 'today' | 'trip' | 'tyres' | 'health' | 'software' | 'warnings' | 'distance' | 'efficiency' | 'sessions' | 'allowance';
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
  },
  {
    id: 'location',
    chosen: 'A',
    title: 'Location',
    batch: 4,
    reads: 'position, zone, address, last seen; speed and gear while driving',
    job: 'Where it is, or that it is on the move and how fast.',
    sizes: SIZES,
    recommended: 'A',
    why: 'Map makes the tile the place, as the Room page’s camera tiles are the picture, and still says the zone in words along the bottom. Place is the calmest and best while driving; Split keeps map and words apart.',
    concepts: [
      {
        id: 'A',
        name: 'Map',
        Component: LocationMap,
        idea: 'The map fills the tile, the car’s pin on it; a frosted label along the bottom: “Home”, or “Driving · 54 km/h”, the address and when it was seen.',
        interaction: 'Read only.',
        strengths: ['Where, at a glance', 'Same as the camera tiles', 'Driving reads too'],
        tradeoffs: ['X-small has no map', 'The map is busy behind words']
      },
      {
        id: 'B',
        name: 'Place',
        Component: LocationPlace,
        idea: 'Words only: the zone or street big, the address and “seen 4 min ago” under it; while driving, the speed big in blue with the gear.',
        interaction: 'Read only.',
        strengths: ['Calmest', 'Speed reads from across the room', 'No map to load'],
        tradeoffs: ['No sense of where away from home', 'Plain when parked']
      },
      {
        id: 'C',
        name: 'Split',
        Component: LocationSplit,
        idea: 'A square map beside the words (Small and Large: the map on top), the place and when it was seen under it.',
        interaction: 'Read only.',
        strengths: ['Map and words both clear', 'Works on every size'],
        tradeoffs: ['Smaller map', 'Two things in one tile']
      }
    ]
  },
  {
    id: 'today',
    chosen: 'A',
    title: 'Today',
    batch: 4,
    reads: 'drives today (from the speed history), distance today when reported',
    job: 'How much it has been used today, and when.',
    sizes: SIZES,
    recommended: 'A',
    why: 'Day bar shows when as well as how much, on the same line language as your Charging and Warm-up picks. Numbers are plainest; Trace is the richest but needs the speed history.',
    concepts: [
      {
        id: 'A',
        name: 'Day bar',
        Component: TodayBar,
        idea: 'Midnight to midnight as a bar, each drive a blue block where it happened, now a tick; the distance big (≈ when summed from the drives, as FordPass gives no distance today).',
        interaction: 'Read only.',
        strengths: ['When and how much', 'Same line as your other picks', 'Calm on a quiet day'],
        tradeoffs: ['Short drives are thin', 'Distance is rough for FordPass']
      },
      {
        id: 'B',
        name: 'Numbers',
        Component: TodayNumbers,
        idea: 'Distance, drives and time driving in a row, the Reading tile’s way; Large adds when it was last out.',
        interaction: 'Read only.',
        strengths: ['Plainest', 'Three facts at once'],
        tradeoffs: ['No sense of when', 'Numbers only']
      },
      {
        id: 'C',
        name: 'Trace',
        Component: TodayTrace,
        idea: 'Today’s speed as a soft blue area from midnight, the drives as its hills, now a dashed line; distance and top speed beside it.',
        interaction: 'Read only.',
        strengths: ['Richest', 'Shows how it was driven'],
        tradeoffs: ['Needs the speed history', 'A chart on a dashboard tile']
      }
    ]
  },
  {
    id: 'trip',
    chosen: 'C',
    title: 'Last trip',
    batch: 4,
    reads: 'distance, time, energy (FordPass: lastenergyconsumed), when it ended',
    job: 'The last drive or ride: how far, how long, how much energy.',
    sizes: SIZES,
    recommended: 'C',
    why: 'Timeline is your Charging and Warm-up line again (start to end, the distance on it), so the page reads as one. Numbers are plainest; Efficiency says whether it was a thirsty drive.',
    concepts: [
      {
        id: 'A',
        name: 'Numbers',
        Component: TripNumbers,
        idea: 'The distance big, time and energy beside it, when it ended; Large adds kWh per 100 km.',
        interaction: 'Read only.',
        strengths: ['Plainest', 'Distance reads from across the room'],
        tradeoffs: ['No judgement', 'Like the Today tile']
      },
      {
        id: 'B',
        name: 'Efficiency',
        Component: TripEfficiency,
        idea: 'kWh per 100 km as a word (Frugal, Typical, Thirsty) and a mark on a green-to-amber band; distance and time under it. Bikes get the numbers.',
        interaction: 'Read only.',
        strengths: ['Says how it was driven', 'Useful in winter'],
        tradeoffs: ['One scale for every EV', 'Needs the trip’s energy']
      },
      {
        id: 'C',
        name: 'Timeline',
        Component: TripTimeline,
        idea: 'Start to end as a line (17:17 → 17:48), the distance in the middle of it, time and energy under it.',
        interaction: 'Read only.',
        strengths: ['Pairs with your Timeline and Warm-up picks', 'When and how far'],
        tradeoffs: ['Energy is small', 'Start time is estimated from the duration']
      }
    ]
  },
  {
    id: 'tyres',
    chosen: 'C',
    title: 'Tyres',
    batch: 5,
    reads: 'four pressures and the low mark (FordPass: under 80% of the placard)',
    job: 'Are the tyres fine, and which one is low.',
    sizes: SIZES,
    recommended: 'C',
    why: 'Status says it first (All good, Front left low) and only then the numbers, the way the Battery and Doors picks lead with a word. Car plan is the most visual; Grid the plainest.',
    concepts: [
      {
        id: 'A',
        name: 'Car plan',
        Component: TyresPlan,
        idea: 'The car from above (as your Extras pick), each pressure printed at its wheel, a low wheel and its number amber.',
        interaction: 'Read only.',
        strengths: ['Which wheel, at a glance', 'Pairs with Extras · Car plan'],
        tradeoffs: ['Small numbers on Small', 'Illustrative']
      },
      {
        id: 'B',
        name: 'Grid',
        Component: TyresGrid,
        idea: 'Four numbers in the car’s order (front row above rear), a low one on an amber patch; Wide puts them in one row.',
        interaction: 'Read only.',
        strengths: ['Plainest', 'Every number readable'],
        tradeoffs: ['No verdict word', 'Front / rear by position only']
      },
      {
        id: 'C',
        name: 'Status',
        Component: TyresStatus,
        idea: 'The verdict first (All good, Front left low), then the car from above with each pressure and its wheel’s name beside it (the earlier Condition card’s drawing); a low wheel and its number amber.',
        interaction: 'Read only.',
        strengths: ['Says what it means', 'Calm when fine', 'Same as your other word-first picks'],
        tradeoffs: ['Three numbers are small', 'Which wheel is in words']
      }
    ]
  },
  {
    id: 'health',
    chosen: 'C',
    title: '12 V battery & oil',
    batch: 5,
    reads: '12 V battery, oil life, battery health and temperature (what the car reports)',
    job: 'Will it start, does it need oil, how is the battery.',
    sizes: SIZES,
    recommended: 'B',
    why: 'Verdict leads with one word (All good, 12 V low) and what to do, so a healthy car is one calm line. Readings lists them all; Meters shows how far each is from trouble.',
    concepts: [
      {
        id: 'A',
        name: 'Readings',
        Component: HealthReadings,
        idea: 'A row per reading: a dot in its verdict’s colour, the name, the value.',
        interaction: 'Read only.',
        strengths: ['Every reading at once', 'Same as the rail’s facts'],
        tradeoffs: ['No advice', 'A list']
      },
      {
        id: 'B',
        name: 'Verdict',
        Component: HealthVerdict,
        idea: 'One word first (All good, 12 V low, Oil low), what to do in a line, the readings small under it; washed amber when something is off.',
        interaction: 'Read only.',
        strengths: ['Says what to do', 'Calm when fine'],
        tradeoffs: ['The numbers are small', 'One problem at a time']
      },
      {
        id: 'C',
        name: 'Meters',
        Component: HealthMeters,
        idea: 'A slim bar per reading with its value, green or amber.',
        interaction: 'Read only.',
        strengths: ['How far from trouble', 'Every reading at once'],
        tradeoffs: ['Bars for 12 V volts are a judgement', 'Small shows two']
      }
    ]
  },
  {
    id: 'software',
    chosen: 'B',
    title: 'Software',
    batch: 5,
    reads: 'update stage, version, last update, next install window, what blocks it',
    job: 'Is it up to date; when will the waiting update install, and what stops it.',
    sizes: SIZES,
    recommended: 'C',
    why: 'Timeline is your Timeline line again: the last update on the left, the next install window on the right, what blocks it in the words above. Status is the plainest; Steps shows how far an update has come.',
    concepts: [
      {
        id: 'A',
        name: 'Status',
        Component: SoftwareStatus,
        idea: 'The stage as a word (Up to date, Downloading update, Installs Tue 02:00, Waiting: 12 V battery low) with the version and when it last updated.',
        interaction: 'Read only.',
        strengths: ['Plainest', 'The blocking reason in words'],
        tradeoffs: ['No sense of progress']
      },
      {
        id: 'B',
        name: 'Steps',
        Component: SoftwareSteps,
        idea: 'Ready → Download → Waiting → Install as four short bars, the current one lit; when up to date it reads as Status.',
        interaction: 'Read only.',
        strengths: ['How far an update has come', 'Familiar from phones'],
        tradeoffs: ['Ford skips steps', 'Busy for a rare event']
      },
      {
        id: 'C',
        name: 'Timeline',
        Component: SoftwareTimeline,
        idea: 'The last update to the next install window as a line, the stage (with what blocks it) above it.',
        interaction: 'Read only.',
        strengths: ['Pairs with your Timeline picks', 'When it will install'],
        tradeoffs: ['Needs the schedule (FordPass has it)', 'Empty when nothing waits']
      }
    ]
  },
  {
    id: 'warnings',
    chosen: 'C',
    title: 'Warnings',
    batch: 5,
    reads: 'the car’s warning lights (FordPass: indicators) and messages',
    job: 'What the car itself says is wrong.',
    sizes: SIZES,
    recommended: 'C',
    why: 'Quiet stays out of the way while there are none (almost always) and turns amber with what the car says when there are, like Alarm C. List is the plainest; Count reads from across the room.',
    concepts: [
      {
        id: 'A',
        name: 'List',
        Component: WarningsList,
        idea: 'No warnings with a check, or each warning as an amber row.',
        interaction: 'Read only.',
        strengths: ['Plainest', 'Every warning named'],
        tradeoffs: ['Long names truncate', 'A tile for “nothing”']
      },
      {
        id: 'B',
        name: 'Count',
        Component: WarningsCount,
        idea: 'The number big in amber, the first warning under it.',
        interaction: 'Read only.',
        strengths: ['Reads from across the room'],
        tradeoffs: ['Only the first is named']
      },
      {
        id: 'C',
        name: 'Quiet',
        Component: WarningsQuiet,
        idea: 'A small “No warnings” while all is well; the whole tile amber with the warning (or how many) when the car reports any.',
        interaction: 'Read only.',
        strengths: ['Out of the way until it matters', 'Impossible to miss when it does'],
        tradeoffs: ['Little to see most days', 'Amber is loud']
      }
    ]
  },
  ...STATS_TYPES
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
    status: 'chosen',
    parts: [
      { name: 'Location', note: 'Map, zone, address, last seen', standIn: '—' },
      { name: 'Today', note: 'Drives today on a 24 h bar', standIn: '—' },
      { name: 'Last trip', note: 'Distance, time, energy', standIn: '—' }
    ]
  },
  {
    id: 5,
    title: 'Condition',
    status: 'chosen',
    parts: [
      { name: 'Tyres', note: 'Four pressures, the low one amber', standIn: '—' },
      { name: '12 V battery & oil', note: 'Readings with a verdict', standIn: '—' },
      { name: 'Software', note: 'Stage, version, next window', standIn: '—' },
      { name: 'Warnings', note: 'Warning lights and the make’s messages', standIn: '—' }
    ]
  },
  {
    id: 6,
    title: 'The page',
    status: 'chosen',
    parts: [
      { name: 'Rail', note: 'Garage (chosen)', standIn: '—' },
      { name: 'Sections and views', note: 'Moment order (chosen)', standIn: '—' },
      { name: 'Phone', note: 'Bottom dock (chosen)', standIn: '—' }
    ]
  },
  {
    id: 7,
    title: 'Statistics',
    status: 'chosen',
    parts: [
      { name: 'Distance', note: 'Bars (chosen)', standIn: '—' },
      { name: 'Efficiency', note: 'Weather (chosen)', standIn: '—' },
      { name: 'Charging history', note: 'Sessions (chosen)', standIn: '—' },
      { name: 'Allowance', note: 'Projection (chosen)', standIn: '—' }
    ]
  }
];
