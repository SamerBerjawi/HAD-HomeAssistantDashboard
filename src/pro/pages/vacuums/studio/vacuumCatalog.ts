/**
 * What the Vacuum Tiles Studio shows (docs/pro-ui/VACUUM_TILES.md): the Vacuums page's parts as
 * Room-page tiles, in review batches, three concepts each. Built like the Vehicle Tiles Studio.
 */
import type { ComponentType } from 'react';
import type { TileSize } from '../../../areas/tileTypes';
import type { CleanerKind } from '../../../lib/vacuums/cleaner';
import type { CleanerTileProps } from '../tiles/cleanerTileKit';
import { StatusMission, StatusRadar, StatusTrail } from '../tiles/robot/StatusTiles';
import { StationCutaway, StationTanks, StationTodo } from '../tiles/robot/StationTiles';
import { CareNext, CareRings, CareWear } from '../tiles/robot/CareTiles';
import { StickGauge, StickStatus, StickUpright } from '../tiles/stick/StickStatusTiles';
import { DockBag, DockLedger, DockSwirl, EnergyLive, EnergyNumbers, EnergySplit } from '../tiles/stick/StickDockTiles';
import { RoomsList, RoomsPlan, RoomsRoute } from '../tiles/robot/RoomsTiles';
import { HistoryBars, HistoryCalendar, HistoryLog, LifetimeHomes, LifetimeNumbers, LifetimeOdometer } from '../tiles/robot/RecordTiles';
import { SettingsPills, SettingsSummary, SettingsToggles } from '../tiles/robot/SettingsTiles';

export type VacuumConceptId = 'A' | 'B' | 'C';

export interface VacuumConcept {
  id: VacuumConceptId;
  name: string;
  idea: string;
  interaction: string;
  strengths: string[];
  tradeoffs: string[];
  Component: ComponentType<CleanerTileProps>;
}

export interface VacuumTileType {
  id: 'status' | 'station' | 'care' | 'stick' | 'dock' | 'energy' | 'rooms' | 'history' | 'lifetime' | 'settings';
  title: string;
  batch: number;
  kind: CleanerKind;
  reads: string;
  job: string;
  sizes: readonly TileSize[];
  concepts: VacuumConcept[];
  recommended: VacuumConceptId;
  chosen?: VacuumConceptId;
  why: string;
}

const SIZES: readonly TileSize[] = ['xs', 's', 'w', 'l'];

export const VACUUM_TYPES: readonly VacuumTileType[] = [
  {
    id: 'status',
    title: 'Robot status',
    batch: 1,
    kind: 'robot',
    reads: 'state, status, room, area and time of the run, battery, start / pause / dock',
    job: 'What the robot is doing right now, and the one obvious next step.',
    sizes: SIZES,
    recommended: 'A',
    chosen: 'A',
    why: 'Radar gives the robot a presence you recognise across the room, and is the Room page’s vacuum tile grown up. Trail shows progress best; Mission explains what a Dreame station does after a run.',
    concepts: [
      {
        id: 'A',
        name: 'Radar',
        Component: StatusRadar,
        idea: 'The robot from above, its laser turret spinning and sonar rings rippling out while it works; the battery is a ring around it. The state in words, the room and run beside it.',
        interaction: 'Start / Pause / Resume and Dock (X-small: the main button only).',
        strengths: ['Alive while cleaning, still when docked', 'Battery and state in one object', 'Family of the Room page’s vacuum tile'],
        tradeoffs: ['Says nothing about how far along the run is', 'The drawing is generic, not your model']
      },
      {
        id: 'B',
        name: 'Trail',
        Component: StatusTrail,
        idea: 'The run as a back-and-forth cleaning path that draws in as the area grows (this run’s m² against your usual whole-home run), the robot at its tip; docked, the path rests faded with a home badge.',
        interaction: 'Start / Pause / Resume; Dock from Large.',
        strengths: ['Progress at a glance, like the apps’ live map', 'Calm when docked', 'Area and time big on Large'],
        tradeoffs: ['The path is a symbol, not your floor plan', 'Progress is an estimate from past runs']
      },
      {
        id: 'C',
        name: 'Mission',
        Component: StatusMission,
        idea: 'The job as steps: Clean → Return → Wash → Dry (robots without a station: Clean → Return); the step under way glows, done steps get a check.',
        interaction: 'The main button; Dock from Large.',
        strengths: ['Explains the long wash and dry after a run', 'Clear “where are we”', 'Works for any make'],
        tradeoffs: ['Busier on Small', 'Steps are the same for every run']
      }
    ]
  },
  {
    id: 'station',
    title: 'Station',
    batch: 1,
    kind: 'robot',
    reads: 'clean / dirty water, detergent, dust bag, hot water, drainage, mop pads, self-wash status; wash, dry, empty',
    job: 'Is the station ready for the next run, what is it doing, and what do I need to do (refill, empty, replace).',
    sizes: SIZES,
    recommended: 'B',
    chosen: 'B',
    why: 'Cutaway is the most memorable and points at the actual tank you need to go to. Tanks reads every supply at once; To-do is the quietest and says exactly what to do.',
    concepts: [
      {
        id: 'A',
        name: 'Tanks',
        Component: StationTanks,
        idea: 'The station’s supplies as glass columns side by side: clean water blue, dirty water brown, detergent violet, dust bag grey, each filled to its state, a missing one dashed, a problem amber. Hot water and mop pads as chips on Large.',
        interaction: 'Wash, Dry and Empty buttons from Wide when the integration offers them.',
        strengths: ['Every supply at a glance', 'Problems pop in amber', 'Familiar from the Dreame app'],
        tradeoffs: ['Fills are symbolic: the integration reports “low” or “full”, not litres', 'Four columns are tight on X-small']
      },
      {
        id: 'B',
        name: 'Cutaway',
        Component: StationCutaway,
        idea: 'The station drawn from the front: clean and dirty tanks on top, the bag door, the robot parked in its bay. A part that needs you glows amber and is named beside it; bubbles while washing, warm air while drying.',
        interaction: 'Wash, Dry, Empty from Wide.',
        strengths: ['Points at the tank you need to go to', 'Shows the station working', 'Distinctive'],
        tradeoffs: ['Drawn station, not your model’s exact shape', 'Detergent and hot water only in words']
      },
      {
        id: 'C',
        name: 'To-do',
        Component: StationTodo,
        idea: 'The verdict first: “Station ready” in green, or the chores worst first (“Empty dirty water”, “Refill clean water”), each with its icon; what the station is doing when it is busy.',
        interaction: 'Wash, Dry, Empty from Wide.',
        strengths: ['Says exactly what to do', 'Quiet when all is well', 'Smallest to read'],
        tradeoffs: ['No picture of the station', 'Less to look at']
      }
    ]
  },
  {
    id: 'care',
    title: 'Care',
    batch: 1,
    kind: 'robot',
    reads: 'main brush, side brush, filter, sensors, wheel, mop pad: % and hours left; reset',
    job: 'Which part needs replacing or cleaning next, and when.',
    sizes: SIZES,
    recommended: 'C',
    chosen: 'B',
    why: 'Next up answers the only question that matters (what, and when) and stays out of the way until then. Wear shows every part honestly; Rings is the most graphic.',
    concepts: [
      {
        id: 'A',
        name: 'Rings',
        Component: CareRings,
        idea: 'The parts as nested rings, soonest outside, each coloured green / amber / red by wear (an activity-ring stack); the lowest part’s % in the middle on Large.',
        interaction: 'Replaced, reset on Large for the part that is due.',
        strengths: ['Graphic and compact', 'Several parts in one shape', 'Colour says it all'],
        tradeoffs: ['Inner rings are hard to tell apart', 'Needs the legend for names']
      },
      {
        id: 'B',
        name: 'Wear',
        Component: CareWear,
        idea: 'A bar per part, soonest first, with the hours left beside it (“Filter · 12 h left”), as the apps’ maintenance lists.',
        interaction: 'Replaced, reset on Large.',
        strengths: ['Every part with its time', 'Easy to compare', 'Plain'],
        tradeoffs: ['A list, less of a tile', 'Busy on Small']
      },
      {
        id: 'C',
        name: 'Next up',
        Component: CareNext,
        idea: 'Only the next part due, big: “Side brush · in 12 h”, the countdown large on Large, the others as a quiet line after it; amber or red when due.',
        interaction: 'Replaced, reset when it is due.',
        strengths: ['One answer, big', 'Quiet until it matters', 'Reset where you need it'],
        tradeoffs: ['The other parts are small', 'Hours left vary by make']
      }
    ]
  },
  {
    id: 'stick',
    title: 'Stick',
    batch: 2,
    kind: 'stick',
    reads: 'in station, charging, battery',
    job: 'Is the stick home and charged, ready to grab.',
    sizes: SIZES,
    recommended: 'A',
    chosen: 'A',
    why: 'Upright makes “is it home?” visible: the stick stands in its station or the station waits empty. Gauge reads the battery best; Status is the calmest.',
    concepts: [
      {
        id: 'A',
        name: 'Upright',
        Component: StickUpright,
        idea: 'The stick drawn standing in its clean station, its battery pack lit cell by cell (pulsing while charging); lifted out, the station waits with a dashed outline.',
        interaction: 'Read-only (the stick has no remote controls).',
        strengths: ['Home or not at a glance', 'Battery inside the drawing', 'Pairs with the robot’s station'],
        tradeoffs: ['Five cells are coarse; the % says the rest', 'A generic stick shape']
      },
      {
        id: 'B',
        name: 'Gauge',
        Component: StickGauge,
        idea: 'The battery as a big arc (the run-time gauge of Dyson’s screen), the % in the middle, a chip for In station / In use.',
        interaction: 'Read-only.',
        strengths: ['Battery reads from across the room', 'Same arc as the Thermostat', 'Simple'],
        tradeoffs: ['“Home or not” is only a chip', 'Like many other gauges']
      },
      {
        id: 'C',
        name: 'Status',
        Component: StickStatus,
        idea: 'The verdict first (Ready, Charging, Off the station) with its colour wash, a slim battery bar under it.',
        interaction: 'Read-only.',
        strengths: ['Calmest', 'Matches the Room page’s Reading · Status', 'Room for the last empty'],
        tradeoffs: ['No picture', 'Battery is small']
      }
    ]
  },
  {
    id: 'dock',
    title: 'Clean station',
    batch: 2,
    kind: 'stick',
    reads: 'dust bag full, dust bag cycles, last emptied, emptying; empty now',
    job: 'Does the dust bag need replacing, and when did the station last empty the bin.',
    sizes: SIZES,
    recommended: 'B',
    chosen: 'A',
    why: 'Swirl makes the auto-empty, the station’s signature, something you see happen, and leads with “Emptied 2 h ago”. Bag counts the empties since the last bag; Ledger is the plainest.',
    concepts: [
      {
        id: 'A',
        name: 'Bag',
        Component: DockBag,
        idea: 'The dust bag drawn, a dot inside for every empty since the bag was changed; the bag turns amber when the station says it is full.',
        interaction: 'Empty now (when the stick is in and the bag isn’t full).',
        strengths: ['The cycles become something to see', 'Full is unmistakable', 'Playful'],
        tradeoffs: ['The dots count empties; Samsung doesn’t report the bag’s size, so they don’t measure fill']
      },
      {
        id: 'B',
        name: 'Swirl',
        Component: DockSwirl,
        idea: 'A cyclone that spins while the bin empties; at rest the last empty big (“2h ago”), the count and a full bag under it.',
        interaction: 'Empty now.',
        strengths: ['Shows the station working', 'Answers “when did it last empty?”', 'Calm at rest'],
        tradeoffs: ['The bag’s state is second']
      },
      {
        id: 'C',
        name: 'Ledger',
        Component: DockLedger,
        idea: 'Plain rows: Dust bag OK / Full, Empties, Last emptied, Stick in station.',
        interaction: 'Empty now.',
        strengths: ['Everything, plainly', 'Fits any station', 'Least to learn'],
        tradeoffs: ['No visual', 'Reads like settings']
      }
    ]
  },
  {
    id: 'energy',
    title: 'Energy',
    batch: 2,
    kind: 'stick',
    reads: 'power, energy, energy saved, energy difference (last session)',
    job: 'What the stick and its station use, and what the AI mode saved.',
    sizes: SIZES,
    recommended: 'A',
    chosen: 'A',
    why: 'Split puts Samsung’s one interesting number, the energy saved, next to what was used. Live is best while it charges; Numbers is the plainest.',
    concepts: [
      {
        id: 'A',
        name: 'Split',
        Component: EnergySplit,
        idea: 'Energy used big, a bar split between used (teal) and saved by AI mode (green).',
        interaction: 'Read-only.',
        strengths: ['Saved energy has a place', 'One bar, one idea', 'Calm'],
        tradeoffs: ['Totals since setup, not this month']
      },
      {
        id: 'B',
        name: 'Live',
        Component: EnergyLive,
        idea: 'Power now big, a pulse running along a line while it charges; totals small.',
        interaction: 'Read-only.',
        strengths: ['Shows charging happening', 'Good on a wall screen'],
        tradeoffs: ['Mostly a few watts at rest']
      },
      {
        id: 'C',
        name: 'Numbers',
        Component: EnergyNumbers,
        idea: 'Used, saved and last session as three figures.',
        interaction: 'Read-only.',
        strengths: ['Every number', 'Plain'],
        tradeoffs: ['Nothing to look at']
      }
    ]
  },
  {
    id: 'rooms',
    title: 'Rooms',
    batch: 3,
    kind: 'robot',
    reads: 'the map’s rooms (segments), the room being cleaned; clean the picked rooms in order',
    job: 'Clean just these rooms, in this order, in two taps.',
    sizes: SIZES,
    recommended: 'A',
    chosen: 'A',
    why: 'Plan feels like the apps’ map without needing one: rooms as blocks, tap to pick, the order numbered. Route makes the order the point (Roborock’s room sequence); List is the plainest and scales to many rooms.',
    concepts: [
      {
        id: 'A',
        name: 'Plan',
        Component: RoomsPlan,
        idea: 'The rooms as a floor plan of soft blocks (the first big, some wide); tap to pick, each picked room tinted and numbered in cleaning order; the room the robot is in glows. Owner: with a floor selector (a robot with a map per floor), the rooms filtered to that floor.',
        interaction: 'Tap rooms, then Clean 2 rooms (or Start for everywhere); × clears.',
        strengths: ['Feels like the apps’ map', 'Order visible on the rooms', 'Big targets'],
        tradeoffs: ['The blocks are not your real floor plan', 'Up to 10 rooms on Large, 4 on Small']
      },
      {
        id: 'B',
        name: 'Route',
        Component: RoomsRoute,
        idea: 'The robot and the picked rooms as numbered stops on a dotted line, the rooms as chips under it; nothing picked reads “Everywhere”.',
        interaction: 'Tap chips in order, then Clean.',
        strengths: ['The order is the point', 'Compact chips fit many rooms', 'Says “Everywhere” when nothing is picked'],
        tradeoffs: ['Long routes are cut to three stops with +n', 'Less of a picture']
      },
      {
        id: 'C',
        name: 'List',
        Component: RoomsList,
        idea: 'A checklist: Everywhere first, then each room with a tick circle; the room being cleaned has a pulsing dot.',
        interaction: 'Tick rooms, then Clean.',
        strengths: ['Plainest', 'Scales to many rooms on Large', 'Familiar'],
        tradeoffs: ['Two rooms on Small and Wide', 'Reads like settings']
      }
    ]
  },
  {
    id: 'history',
    title: 'History',
    batch: 3,
    kind: 'robot',
    reads: 'recent runs from the cleaning history (when, area, time, finished or stopped)',
    job: 'Has it been cleaning, and how did the last run go.',
    sizes: SIZES,
    recommended: 'A',
    chosen: 'A',
    why: 'Calendar answers “has it been cleaning?” in one look and makes a missed day or a stopped run stand out. Bars compares runs; Log is the plainest.',
    concepts: [
      {
        id: 'A',
        name: 'Calendar',
        Component: HistoryCalendar,
        idea: 'The last weeks as day squares (a contribution grid), a day with a run filled teal by its area, a run that stopped early amber, today outlined.',
        interaction: 'Read-only.',
        strengths: ['Routine at a glance', 'Gaps and stopped runs stand out', 'Distinctive'],
        tradeoffs: ['Area per day only, no times', 'Needs a few weeks of history to shine']
      },
      {
        id: 'B',
        name: 'Bars',
        Component: HistoryBars,
        idea: 'A bar per run, newest on the right and full colour, height by area; the last run’s area big with its day and time.',
        interaction: 'Read-only.',
        strengths: ['Compare runs', 'The last run big', 'Stopped runs amber'],
        tradeoffs: ['No sense of which days', 'Like many charts']
      },
      {
        id: 'C',
        name: 'Log',
        Component: HistoryLog,
        idea: 'The runs as rows: day and time, area and minutes, a tick or a warning.',
        interaction: 'Read-only.',
        strengths: ['Every detail', 'Plain'],
        tradeoffs: ['Two rows on Small', 'Nothing to look at']
      }
    ]
  },
  {
    id: 'lifetime',
    title: 'Lifetime',
    batch: 3,
    kind: 'robot',
    reads: 'total cleaned area, total time, cleaning count, first cleaning date',
    job: 'A bit of pride: how much it has done since it arrived.',
    sizes: SIZES,
    recommended: 'B',
    chosen: 'A',
    why: 'Homes turns a number nobody pictures (4,812 m²) into one everyone does (your home, 75 times). Odometer is the most playful; Numbers the plainest.',
    concepts: [
      {
        id: 'A',
        name: 'Odometer',
        Component: LifetimeOdometer,
        idea: 'The total area in digit wheels like a car’s odometer (the last one ticking while it cleans), runs, hours and since under it.',
        interaction: 'Read-only.',
        strengths: ['Playful, a car’s odometer', 'One number, big'],
        tradeoffs: ['m² is hard to picture']
      },
      {
        id: 'B',
        name: 'Homes',
        Component: LifetimeHomes,
        idea: '“Your home, 75×”: the total over your usual whole-home run, drawn as a little house per clean.',
        interaction: 'Read-only.',
        strengths: ['A number you can picture', 'Warm', 'Uses your own runs'],
        tradeoffs: ['“A home” is estimated from past runs', 'Needs history or a run count']
      },
      {
        id: 'C',
        name: 'Numbers',
        Component: LifetimeNumbers,
        idea: 'Area, time, runs and since as four figures.',
        interaction: 'Read-only.',
        strengths: ['Every total', 'Plain'],
        tradeoffs: ['Nothing to look at']
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    batch: 3,
    kind: 'robot',
    reads: 'the robot’s switches: carpet boost, obstacle avoidance, resume cleaning, customised cleaning…',
    job: 'Flip the few settings you change from time to time.',
    sizes: SIZES,
    recommended: 'B',
    chosen: 'C',
    why: 'Pills fit every setting on one tile and light up when on, tap to flip. Toggles are the most familiar; Summary is the calmest when you rarely change them.',
    concepts: [
      {
        id: 'A',
        name: 'Toggles',
        Component: SettingsToggles,
        idea: 'A row per setting with its icon and a switch.',
        interaction: 'Tap a row to flip it.',
        strengths: ['Most familiar', 'Clear on / off'],
        tradeoffs: ['Three on Small, four on Wide, no icons there', 'Reads like a settings screen']
      },
      {
        id: 'B',
        name: 'Pills',
        Component: SettingsPills,
        idea: 'Each setting a pill with its icon, glowing teal when on, grey when off.',
        interaction: 'Tap a pill to flip it.',
        strengths: ['All settings on one tile', 'Glanceable', 'Compact'],
        tradeoffs: ['On / off by colour alone (aria-pressed for screen readers)']
      },
      {
        id: 'C',
        name: 'Summary',
        Component: SettingsSummary,
        idea: '“3 of 4 on” big, a segment per setting, what is off named; switches on Large, scrolling when there are more (owner).',
        interaction: 'Switches on Large.',
        strengths: ['Calm', 'Says what is off'],
        tradeoffs: ['Flip only on Large']
      }
    ]
  }
];

export interface VacuumBatch {
  id: number;
  title: string;
  status: 'review' | 'next' | 'later' | 'chosen';
  parts: { name: string; note: string }[];
}

export const VACUUM_BATCHES: readonly VacuumBatch[] = [
  {
    id: 1,
    title: 'Robot',
    status: 'chosen',
    parts: [
      { name: 'Robot status', note: 'What it is doing, start / pause / dock' },
      { name: 'Station', note: 'Water, detergent, dust bag, wash / dry / empty' },
      { name: 'Care', note: 'Brushes, filter, sensors, wheel: what is due' }
    ]
  },
  {
    id: 2,
    title: 'Stick',
    status: 'chosen',
    parts: [
      { name: 'Stick', note: 'Home in the station, battery' },
      { name: 'Clean station', note: 'Dust bag, empties, empty now' },
      { name: 'Energy', note: 'Power, used, saved' }
    ]
  },
  {
    id: 3,
    title: 'Runs & rooms',
    status: 'chosen',
    parts: [
      { name: 'Rooms', note: 'Pick rooms and clean them (vacuum.clean_area), suction and mop level' },
      { name: 'History', note: 'Recent runs from the cleaning history sensor' },
      { name: 'Lifetime', note: 'Total area, time, count, since' },
      { name: 'Settings', note: 'Carpet boost, obstacle avoidance, resume…' }
    ]
  },
  {
    id: 4,
    title: 'The page',
    status: 'chosen',
    parts: [
      { name: 'Rail', note: 'Room rail, Fleet or Home base (the “4 · Vacuums page” tab)' },
      { name: 'Sections and views', note: 'Kind tabs as today, All | Now, or Moment order' },
      { name: 'Phone', note: 'Picture header, Compact, or Bottom dock' }
    ]
  }
];
