/**
 * Batch 4 of the Vacuum Tiles Studio (docs/pro-ui/VACUUM_TILES.md): the page's frame, reviewed
 * live in the studio's Vacuums page tab rather than as tiles. Built as the Vehicle page's batch 6.
 */
import type { VacuumConceptId } from './vacuumCatalog';

export interface PagePart {
  id: 'rail' | 'sections' | 'phone';
  title: string;
  job: string;
  recommended: VacuumConceptId;
  chosen?: VacuumConceptId;
  why: string;
  concepts: { id: VacuumConceptId; name: string; idea: string; strengths: string[]; tradeoffs: string[] }[];
}

export const PAGE_PARTS: readonly PagePart[] = [
  {
    id: 'rail',
    chosen: 'B',
    title: 'Rail',
    job: 'The left column on tablet and desktop: which cleaner, how it is, and the way round the page.',
    recommended: 'B',
    why: 'Fleet is the Mobility page’s Garage (your pick there), so a robot and a stick sit in one list and the two pages read as one. Room rail is the Room page’s own; Home base is the most yours, but takes the most room.',
    concepts: [
      { id: 'A', name: 'Room rail', idea: 'The Room page’s rail: the cleaner drawn, its name with ⌄ to switch, facts (battery, last clean, station or bag), how it is, and On this page with each section’s summary.', strengths: ['Same as the Room page', 'The page index with summaries'], tradeoffs: ['Other cleaners are behind the ⌄'] },
      { id: 'B', name: 'Fleet', idea: 'Every cleaner as a row, robots then sticks (drawing, name, how it is in its colour); tap one to open it: the open one shows its drawing, facts and Start / Dock or Empty.', strengths: ['Every cleaner at a glance', 'One tap to switch', 'Same as Mobility’s Garage'], tradeoffs: ['No page index', 'Less room for the open one'] },
      { id: 'C', name: 'Home base', idea: 'Your cleaners drawn side by side where they live (the robot in its station, the stick upright), each lit in its state colour; tap one to open it. Under the scene: how it is, battery, buttons; the sections as chips.', strengths: ['Recognisable from across the room', 'Shows home vs out at once'], tradeoffs: ['Gets crowded past three cleaners', 'Less like the Room page'] }
    ]
  },
  {
    id: 'sections',
    chosen: 'B',
    title: 'Sections and views',
    job: 'How the tiles are grouped and ordered: Cleaning, Station and parts, Record, Settings for a robot; Stick, Energy for a stick.',
    recommended: 'C',
    why: 'Moment order is your Mobility pick and suits cleaners well: a stuck robot, a full tank or a full bag should be the first thing you see. Kind tabs keep today’s Robot vacuums | Stick vacuums; All | Now is the Room page’s two views.',
    concepts: [
      { id: 'A', name: 'Kind tabs', idea: 'As today: Robot vacuums | Stick vacuums at the top; a tab opens its first cleaner, the sections in a fixed order with their summaries.', strengths: ['What you have today', 'Nothing moves'], tradeoffs: ['A tab per kind even with one cleaner each', 'What matters now can be far down'] },
      { id: 'B', name: 'All | Now', idea: 'The Room page’s two views. All: the sections. Now: one sentence, then only the tiles that are on or need you (cleaning, a chore, a worn part, the bag), then everything else as one line per section.', strengths: ['Same as the Room page', 'Now answers “anything to do?”'], tradeoffs: ['Two views to learn'] },
      { id: 'C', name: 'Moment order', idea: 'One view whose order follows the moment: what needs you first (stuck, a chore, a worn part, the bag full), then what it is doing (cleaning puts Cleaning first); each moved heading says why.', strengths: ['The right thing first, no switch', 'Same as Mobility'], tradeoffs: ['Things move between visits'] }
    ]
  },
  {
    id: 'phone',
    chosen: 'C',
    title: 'Phone',
    job: 'The page at 375 px: the header, the way round, two columns of tiles.',
    recommended: 'C',
    why: 'Bottom dock is your Mobility pick: Start, Dock and the station’s chore stay under the thumb, as in the Dreame, Roborock and Samsung apps. Picture header is the Room page’s phone layout; Compact gets to the tiles soonest.',
    concepts: [
      { id: 'A', name: 'Picture header', idea: 'The Room page on a phone: the cleaner drawn across the top, the name ⌄, facts, how it is, then section chips that stick to the top.', strengths: ['Same as the Room page', 'The cleaner you recognise first'], tradeoffs: ['Tiles start lower'] },
      { id: 'B', name: 'Compact', idea: 'One row: a small drawing, the name ⌄ and how it is beside it; sticky chips under it; tiles from the first screen.', strengths: ['Tiles sooner', 'Calm'], tradeoffs: ['The cleaner is small'] },
      { id: 'C', name: 'Bottom dock', idea: 'The compact header, and a bar fixed to the bottom with how it is and round buttons: Start or Pause, Dock, and Wash or Empty when the station can.', strengths: ['The usual actions under the thumb', 'Like the makers’ apps'], tradeoffs: ['The dock repeats the status tile', 'Covers the last row'] }
    ]
  }
];
