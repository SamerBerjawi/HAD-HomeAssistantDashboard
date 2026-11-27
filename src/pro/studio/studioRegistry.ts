/**
 * Declarative registry of all HAD Pro UI Design Studios (dev-only).
 * Adding a studio for any future Pro page is a one-entry addition here;
 * StudioHub and StudioNavBar render directly from this list.
 */
import type { IconSvgElement } from '@hugeicons/react';
import { FlashIcon, GridViewIcon, Home01Icon, PaintBoardIcon, Shield01Icon, Car01Icon } from '@hugeicons/core-free-icons';

export type StudioId = 'widgets' | 'areas' | 'rooms' | 'security' | 'energy' | 'mobility';

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
    id: 'security',
    title: 'Security Studio',
    shortTitle: 'Security',
    subtitle: 'Security page, restarted from zero: the brief, then concepts per section on mock home states.',
    query: 'security',
    icon: Shield01Icon,
    pageAccent: 'security',
    status: 'Redesigning',
    statusTone: 'warning',
    highlights: ['Restarted 2026-11-26', 'Brief first']
  },
  {
    id: 'energy',
    title: 'Energy Studio',
    shortTitle: 'Energy',
    subtitle: 'Energy page, restarted from zero: live power first, then three whole-page directions on sample homes.',
    query: 'energy',
    icon: FlashIcon,
    pageAccent: 'energy',
    status: 'Redesigning',
    statusTone: 'warning',
    highlights: ['Approved and built 2026-11-26', 'Live on HA data']
  },
  {
    id: 'mobility',
    title: 'Mobility Studio',
    shortTitle: 'Mobility',
    subtitle: 'Mobility page, restarted from zero: “Ready to go?” first, any make through one vehicle model, three whole-page directions.',
    query: 'mobility',
    icon: Car01Icon,
    pageAccent: 'mobility',
    status: 'Redesigning',
    statusTone: 'warning',
    highlights: ['Restarted 2026-11-26', 'Round 1: page direction']
  }
];

export const studioUrl = (id?: StudioId): string => (id ? `?studio=${id}` : '?studio');
