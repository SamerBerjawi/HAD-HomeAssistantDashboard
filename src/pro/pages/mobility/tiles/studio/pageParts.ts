/**
 * Batch 6 of the Vehicle Tiles Studio (docs/pro-ui/VEHICLE_TILES.md): the page's frame, reviewed
 * live in the studio's Mobility page tab rather than as tiles.
 */
import type { VehicleConceptId } from './vehicleCatalog';

/** Batch 6 · the page: how the tiles are framed (owner reviews these live in the page preview). */
export interface PagePart {
  id: 'rail' | 'sections' | 'phone';
  title: string;
  job: string;
  recommended: VehicleConceptId;
  chosen?: VehicleConceptId;
  why: string;
  concepts: { id: VehicleConceptId; name: string; idea: string; strengths: string[]; tradeoffs: string[] }[];
}

export const PAGE_PARTS: readonly PagePart[] = [
  {
    id: 'rail',
    chosen: 'B',
    title: 'Rail',
    job: 'The left column on tablet and desktop: which vehicle, how it is, and the way round the page.',
    recommended: 'A',
    why: 'Room rail is the Room page’s own (the picture where the room photo is), so the two pages read as one. Garage suits a household with several vehicles; Showroom makes the car the hero, as the makers’ apps do.',
    concepts: [
      { id: 'A', name: 'Room rail', idea: 'The Room page’s rail: the picture, the name with ⌄ to switch vehicle, facts, Ready to go? and On this page with each section’s summary.', strengths: ['Same as the Room page', 'The page index with summaries'], tradeoffs: ['Other vehicles are behind the ⌄'] },
      { id: 'B', name: 'Garage', idea: 'Every vehicle as a row (picture, name, how it is); tap one to open it: the open one shows its picture, facts and Ready to go?.', strengths: ['Every vehicle at a glance', 'One tap to switch'], tradeoffs: ['No page index', 'Less room for the open one'] },
      { id: 'C', name: 'Showroom', idea: 'The car big, its name over the picture, three big figures under it (charge, range, locked), Ready to go? as one line, the sections as chips.', strengths: ['The car is the hero, as in the makers’ apps', 'Figures read from across the room'], tradeoffs: ['Less like the Room page', 'Facts limited to three'] }
    ]
  },
  {
    id: 'sections',
    chosen: 'C',
    title: 'Sections and views',
    job: 'How the tiles are grouped and ordered: Energy, Cabin, Security, Where, Condition.',
    recommended: 'B',
    why: 'All | Now is what you chose for the Room page: All keeps everything in its place, Now shows only what is on or needs a look (charging, unlocked, a low tyre). Moment order is clever but the page changes shape as the car does.',
    concepts: [
      { id: 'A', name: 'All', idea: 'The five sections in a fixed order, each heading with its summary (Energy · Charging, Security · Unlocked).', strengths: ['Most predictable', 'Nothing moves'], tradeoffs: ['What matters now can be far down'] },
      { id: 'B', name: 'All | Now', idea: 'The Room page’s two views. All: the sections. Now: one sentence, then only the tiles that are on or need a look, then everything else folded to one line per section.', strengths: ['Same as the Room page', 'Now answers “anything I should know?”'], tradeoffs: ['Two views to learn'] },
      { id: 'C', name: 'Moment order', idea: 'One view whose order follows the moment: what needs a look first, then what the car is doing (driving puts Where first, charging Energy, remote start Cabin); each moved heading says why.', strengths: ['The right thing first, no switch'], tradeoffs: ['Things move between visits', 'Harder to build muscle memory'] }
    ]
  },
  {
    id: 'phone',
    chosen: 'C',
    title: 'Phone',
    job: 'The page at 375 px: the header, the way round, two columns of tiles.',
    recommended: 'A',
    why: 'Picture header is the Room page’s phone layout, so both pages feel the same in the hand. Compact gets to the tiles sooner; Bottom dock keeps lock, climate and charge under the thumb, as the makers’ apps do.',
    concepts: [
      { id: 'A', name: 'Picture header', idea: 'The Room page on a phone: the picture across the top, the name ⌄, facts, Ready to go?, then section chips that stick to the top.', strengths: ['Same as the Room page', 'The car you recognise first'], tradeoffs: ['Tiles start lower'] },
      { id: 'B', name: 'Compact', idea: 'One row: a small picture, the name ⌄ and Ready to go? beside it; sticky chips under it; tiles from the first screen.', strengths: ['Tiles sooner', 'Calm'], tradeoffs: ['The car is small'] },
      { id: 'C', name: 'Bottom dock', idea: 'The compact header, and a bar fixed to the bottom with how it is and three round buttons: lock, remote start, charge.', strengths: ['The usual actions under the thumb', 'Like the makers’ apps'], tradeoffs: ['The dock repeats tiles', 'Covers the last row'] }
    ]
  }
];
