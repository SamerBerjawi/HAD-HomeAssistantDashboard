/** Motion in the Widget Design Studio (Phase 3). */
import { defineStudioEntry } from '../../../studio/types';
import MotionConceptA from './MotionConceptA';
import MotionConceptB from './MotionConceptB';
import MotionConceptC from './MotionConceptC';
import { MOTION_STATES } from './states';

export const motionStudio = defineStudioEntry({
  widgetId: 'motion',
  title: 'Motion',
  personality: 'Alive, quiet, observant',
  direction: 'Where is someone moving right now, and how long has the house been still? Amber for movement only (D1).',
  sizes: ['s', 'w', 't', 'l'],
  states: MOTION_STATES,
  recommended: 'C',
  why: 'C adds what the others cannot: the order and timing of movement across rooms in the last hour, on a calm card. B is the most alive; its ripple could mark the active lanes in C.',
  concepts: [
    {
      id: 'A',
      Component: MotionConceptA,
      name: 'Refined & minimal',
      idea: 'The room with movement now (or "Still" and for how long) as a light headline, zones as quiet rows.',
      strengths: ['Easy to read', 'Times for every room', 'Calm'],
      tradeoffs: ['No sense of activity', 'Looks like other minimal widgets']
    },
    {
      id: 'B',
      Component: MotionConceptB,
      name: 'Expressive & immersive',
      idea: 'A dusk card where rooms with movement send out amber ripples; calm and still otherwise.',
      strengths: ['Movement felt at a glance', 'Lovely at night', 'Quiet when still'],
      tradeoffs: ['Motion (off with reduced motion)', 'Few rooms fit']
    },
    {
      id: 'C',
      Component: MotionConceptC,
      name: 'Innovative: the last hour',
      idea: 'One lane per room on a 60-minute timeline: a mark at the last motion, an amber bar to "now" while active.',
      strengths: ['Shows order and timing', 'Every room comparable', 'Neutral card'],
      tradeoffs: ['Only the last change per room is known', 'Needs a moment to read']
    }
  ]
});
