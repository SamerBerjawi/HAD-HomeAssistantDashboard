/** Family presence in the Widget Design Studio (Phase 1). */
import { defineStudioEntry } from '../../../studio/types';
import PresenceConceptA from './PresenceConceptA';
import PresenceConceptB from './PresenceConceptB';
import PresenceConceptC from './PresenceConceptC';
import { PRESENCE_STATES } from './states';

export const presenceStudio = defineStudioEntry({
  widgetId: 'users',
  title: 'Family presence',
  personality: 'Warm, human, reassuring',
  direction: 'Who is home, and where everyone else is. Faces before names; warmth grows as the house fills (D1).',
  sizes: ['s', 'w', 't', 'l'],
  states: PRESENCE_STATES,
  recommended: 'B',
  why: 'B leads with faces, which is how people check "who\'s home" and the most human widget on the page. C is the most original and shows near vs far; its orbit could be the Large size of B.',
  concepts: [
    {
      id: 'A',
      Component: PresenceConceptA,
      name: 'Refined & minimal',
      idea: 'How many are home as the headline; everyone on a quiet line with where they are. Avatars appear at Tall and Large.',
      strengths: ['Fast to read', 'Scales to big families', 'Last seen at Large'],
      tradeoffs: ['Impersonal at Small and Wide', 'Similar to other "minimal" widgets']
    },
    {
      id: 'B',
      Component: PresenceConceptB,
      name: 'Expressive & immersive',
      idea: 'Portraits of who is home, overlapping, on a surface that warms as the house fills; people who are out are smaller and faded, with where they are.',
      strengths: ['Faces first: recognised instantly', 'Warmth shows how full the house is', 'Tap a face for that person'],
      tradeoffs: ['Needs photos to shine (initials otherwise)', 'Fewer people fit at Small']
    },
    {
      id: 'C',
      Component: PresenceConceptC,
      name: 'Innovative: house and orbit',
      idea: 'A small house holds everyone at home; people who are out circle it, closer at known places (work, school), further when simply away.',
      strengths: ['Near vs far at a glance', 'Unlike any other widget', 'Count readable at Small'],
      tradeoffs: ['Small avatars on a phone', 'Orbit position is symbolic, not a map']
    }
  ]
});
