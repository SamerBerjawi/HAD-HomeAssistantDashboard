/**
 * Widget design registry (docs/pro-ui/WIDGET_DESIGN.md §7): which concept was chosen for each
 * widget, and where it stands. The Widget Design Studio shows it; it is updated when the owner
 * decides, together with the Decision log in DESIGN.md.
 */
export type ConceptId = 'A' | 'B' | 'C';

export interface DesignRecord {
  /** Chosen concept, a mix of several, all of them as user-picked styles, or none yet. */
  concept: ConceptId | 'mix' | 'all' | null;
  status: 'exploring' | 'chosen' | 'built';
  date: string;
  notes?: string;
}

export const DESIGN_REGISTRY: Readonly<Record<string, DesignRecord>> = {
  weather: {
    concept: 'all',
    status: 'built',
    date: '2026-11-19',
    notes: 'All three ship as styles the user picks per widget: Sky (B, default), Minimal (A), Trend (C, conditions made more visible).'
  },
  lights: { concept: 'B', status: 'built', date: '2026-11-19', notes: 'Glow; Wide reworked to use the space (count on one line, All beside a 2 × 2 grid of rooms).' },
  media: {
    concept: 'mix',
    status: 'built',
    date: '2026-11-19',
    notes: "Small: A's layout on C's tinted surface. Wide/Tall/Large: B (static cover on the blurred cover, progress bar) with C's equaliser and Up next."
  },
  vacuums: { concept: 'B', status: 'built', date: '2026-11-19', notes: 'Floor, with a battery icon next to the percentage.' },
  users: { concept: 'B', status: 'built', date: '2026-11-19', notes: 'Portraits.' },
  switches: { concept: 'B', status: 'built', date: '2026-11-19', notes: 'Plug board.' },
  fans: { concept: 'B', status: 'built', date: '2026-11-19', notes: 'Airflow.' },
  thermostat: { concept: 'B', status: 'built', date: '2026-11-19', notes: 'Climate (new widget). Room name chooses the thermostat (2026-11-20).' },
  scenes: { concept: 'C', status: 'built', date: '2026-11-19', notes: 'Palette (new widget).' },
  areas: { concept: 'mix', status: 'built', date: '2026-11-19', notes: 'A layout with B pill buttons and lights button (all sizes); new widget. Rooms section, open area, choose favourites (2026-11-20).' },
  alarm: { concept: 'mix', status: 'built', date: '2026-11-20', notes: 'B layout, C mode track and header (title never cut off), soft lock colours (revised 2026-11-20).' },
  cameras: { concept: 'A', status: 'built', date: '2026-11-19', notes: 'Framed.' },
  openings: { concept: 'B', status: 'built', date: '2026-11-19', notes: 'Draught.' },
  safety: { concept: 'B', status: 'built', date: '2026-11-19', notes: 'Calm / alarm.' },
  motion: { concept: 'C', status: 'built', date: '2026-11-19', notes: 'Last hour; room names at Small.' },
  energy_now: {
    concept: 'mix',
    status: 'built',
    date: '2026-11-20',
    notes: 'Phase 4: A layout on B colours (card coloured by what powers the home); new Small size; battery pill (Small/Wide), big charge beside the headline (Large).'
  },
  energy_today: {
    concept: 'mix',
    status: 'built',
    date: '2026-11-20',
    notes: 'Phase 4: Small = A labels + C self-powered gauge as a half circle; Wide/Large = A consumption + C came-from/went-to bars; Tall (added 2026-11-20) = gauge, labels, bars.'
  },
  energy_flow: { concept: 'A', status: 'built', date: '2026-11-20', notes: 'Phase 4: concept A, the Sankey.' },
  locks: {
    concept: 'C',
    status: 'built',
    date: '2026-11-20',
    notes: 'Bolts, plus an icon per lock and in the header, text that wraps instead of being cut off, and a bolt at Small when there is one lock.'
  },
  car: { concept: 'mix', status: 'built', date: '2026-11-20', notes: "A's layout on B's colours; climate start/stop at every size (icon only at Small), press and hold." }
};
