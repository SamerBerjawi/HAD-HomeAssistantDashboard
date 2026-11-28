/** Doors & windows in the Widget Design Studio (Phase 3). */
import { defineStudioEntry } from '../../../studio/types';
import OpeningsConceptA from './OpeningsConceptA';
import OpeningsConceptB from './OpeningsConceptB';
import OpeningsConceptC from './OpeningsConceptC';
import { OPENINGS_STATES } from './states';

export const openingsStudio = defineStudioEntry({
  widgetId: 'openings',
  title: 'Doors & windows',
  personality: 'Calm, watchful, matter-of-fact',
  direction: 'Is everything shut, and if not, what and for how long? Quiet when closed, amber when open (D1).',
  sizes: ['s', 'w', 't', 'l'],
  states: OPENINGS_STATES,
  recommended: 'C',
  why: 'C answers "is the house shut?" for every door and window at once, and shows where the open ones are without reading a list. B is the most noticeable when something is left open; its amber could tint C\'s card when anything is open.',
  concepts: [
    {
      id: 'A',
      Component: OpeningsConceptA,
      name: 'Refined & minimal',
      idea: '"All closed" or "2 open" as a light headline, then what is open as quiet rows with how long.',
      strengths: ['Easy to read', 'Times are clear', 'Calm'],
      tradeoffs: ['Closed ones are invisible', 'Looks like other minimal widgets']
    },
    {
      id: 'B',
      Component: OpeningsConceptB,
      name: 'Expressive & immersive',
      idea: 'Calm green when shut; warm amber as soon as anything opens, with the open ones as glass chips.',
      strengths: ['Impossible to miss an open door', 'Big count', 'Matches Alarm "shield"'],
      tradeoffs: ['Strong colour while airing out', 'Shows only open ones']
    },
    {
      id: 'C',
      Component: OpeningsConceptC,
      name: 'Innovative: the board',
      idea: 'Every door (tall) and window (square) as a panel by room; open ones swing amber with how long.',
      strengths: ['Whole house at a glance', 'Where things are open', 'Offline sensors visible'],
      tradeoffs: ['Names only per room', 'Busy with many sensors']
    }
  ]
});
