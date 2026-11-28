/**
 * Overview sections (docs/pro-ui/OVERVIEW_REBUILD.md): ids, default order and labels. Each
 * widget names its section; the page shows one tab per section. The old grouped grid's helpers
 * (bento spans, subset reorder, corner snapping) went with it at cutover (Phase 5, 2026-11-20).
 */
import type { OverviewTabId } from './overviewTabs';

/**
 * Sections follow the tabs, plus People (presence has no tab of its own; audit P3, 2026-11-19)
 * and Rooms (the Areas widget, owner 2026-11-20: rooms are the starting point, first by default).
 */
export type OverviewSectionId = Exclude<OverviewTabId, 'all'> | 'people' | 'rooms';

/** The old tab id a section borrows its icon from (People: Security, Rooms: Climate). */
export function sectionTab(id: OverviewSectionId): Exclude<OverviewTabId, 'all'> {
  return id === 'people' ? 'security' : id === 'rooms' ? 'climate' : id;
}

export const DEFAULT_OVERVIEW_SECTION_ORDER: readonly OverviewSectionId[] = [
  'rooms',
  'climate',
  'people',
  'lights',
  'switches',
  'energy',
  'security',
  'cameras',
  'openings',
  'media',
  'vacuums'
];

export const OVERVIEW_SECTION_LABELS: Record<OverviewSectionId, string> = {
  lights: 'Lights',
  switches: 'Switches',
  energy: 'Energy',
  security: 'Security',
  cameras: 'Cameras',
  climate: 'Climate',
  openings: 'Doors & windows',
  media: 'Media',
  vacuums: 'Vacuums',
  people: 'People',
  rooms: 'Rooms'
};
