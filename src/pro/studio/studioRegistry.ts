/**
 * Declarative registry of all HAD Pro UI Design Studios (dev-only).
 * Adding a studio for any future Pro page is a one-entry addition here;
 * StudioHub and StudioNavBar render directly from this list.
 */
import type { IconSvgElement } from '@hugeicons/react';
import { Car01Icon, MusicNote01Icon, FlashIcon, GridViewIcon, Home01Icon, PaintBoardIcon, Shield01Icon } from '@hugeicons/core-free-icons';

export type StudioId = 'widgets' | 'areas' | 'rooms' | 'energy' | 'security' | 'media' | 'mobility';

export interface StudioEntry {
  id: StudioId;
  title: string;
  shortTitle: string;
  subtitle: string;
  query: string;
  icon: IconSvgElement;
  pageAccent: 'overview' | 'rooms' | 'energy' | 'security' | 'media' | 'mobility';
  status: 'Shipped' | 'In review' | 'Redesigning';
  statusTone: 'success' | 'accent' | 'warning';
  highlights: string[];
}

export const STUDIOS: readonly StudioEntry[] = [
  {
    id: 'widgets',
    title: 'Widgets Studio',
    shortTitle: 'Widgets',
    subtitle: 'Overview dashboard cards: Weather, Climate, Lights, Locks, Cameras, Car, and compact Energy cards across phone & wide sizes.',
    query: 'widgets',
    icon: PaintBoardIcon,
    pageAccent: 'overview',
    status: 'Shipped',
    statusTone: 'success',
    highlights: ['20 widget families', 'Small / Tall / Wide / Large', 'Light + Dark states']
  },
  {
    id: 'areas',
    title: 'Areas Studio',
    shortTitle: 'Areas',
    subtitle: 'Single-entity tiles for room & floor pages: climate, lighting, covers, media, locks, fans, vacuums, and live interactions.',
    query: 'areas',
    icon: GridViewIcon,
    pageAccent: 'rooms',
    status: 'Shipped',
    statusTone: 'success',
    highlights: ['Batch 1–6 tile types', 'Live simulated HA controls', 'Full Area page simulator']
  },
  {
    id: 'rooms',
    title: 'Rooms Studio',
    shortTitle: 'Rooms',
    subtitle: 'Floor-grouped room cards and explorer headings: compare Calm Editorial, Atmospheric, Precision, and Soft Blend directions.',
    query: 'rooms',
    icon: Home01Icon,
    pageAccent: 'rooms',
    status: 'Shipped',
    statusTone: 'success',
    highlights: ['Designs A / B / C / D', '375–1920 px widths', 'Live room service mocks']
  },
  {
    id: 'energy',
    title: 'Energy Studio',
    shortTitle: 'Energy',
    subtitle: 'Full-page Energy experience: distinct concepts for all 11 sections from live power orbits and daylight skyscapes to treemaps and utility meters.',
    query: 'energy',
    icon: FlashIcon,
    pageAccent: 'energy',
    status: 'Shipped',
    statusTone: 'success',
    highlights: ['11 Energy sections', 'Bespoke charts & SVGs', 'Assembled responsive page']
  },
  {
    id: 'mobility', title: 'Mobility Studio', shortTitle: 'Mobility',
    subtitle: 'Compare garage bays for cars and bikes across different household fleets.',
    query: 'mobility', icon: Car01Icon, pageAccent: 'mobility',
    status: 'In review', statusTone: 'accent', highlights: ['Vehicle bays', 'Simulated vehicles']
  },
  {
    id: 'media', title: 'Media Studio', shortTitle: 'Media',
    subtitle: 'Compare Now playing layouts for speakers and TVs.',
    query: 'media', icon: MusicNote01Icon, pageAccent: 'media',
    status: 'In review', statusTone: 'accent',
    highlights: ['Now playing', 'Simulated playback']
  },
  {
    id: 'security',
    title: 'Security Studio',
    shortTitle: 'Security',
    subtitle: 'Full-page Security & Safety redesign: Alarm hero, Perimeter attention, WebRTC Cameras, 24 h Activity, and Device groups across 5 live states.',
    query: 'security',
    icon: Shield01Icon,
    pageAccent: 'security',
    status: 'Shipped',
    statusTone: 'success',
    highlights: ['5 Security sections', 'Press-and-hold safety', 'Desktop scroll + Phone tabs']
  }
];

export const studioUrl = (id?: StudioId): string => (id ? `?studio=${id}` : '?studio');
