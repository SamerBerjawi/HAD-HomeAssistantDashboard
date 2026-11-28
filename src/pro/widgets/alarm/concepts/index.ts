/** Alarm in the Widget Design Studio (Phase 3). */
import { defineStudioEntry } from '../../../studio/types';
import AlarmConceptA from './AlarmConceptA';
import AlarmConceptB from './AlarmConceptB';
import AlarmConceptC from './AlarmConceptC';
import { ALARM_STATES } from './states';

export const alarmStudio = defineStudioEntry({
  widgetId: 'alarm',
  title: 'Alarm',
  personality: 'Calm, protective, unmistakable',
  direction: 'Armed or not, by whom, and one tap to change it. Quiet when all is well; impossible to miss when triggered (D1: status colours only for state).',
  sizes: ['s', 'w', 't', 'l'],
  states: ALARM_STATES,
  recommended: 'B',
  why: "B reads from across the room: the colour is the state, and triggered fills the card red. C's readiness checklist is the most useful idea before arming; it could sit in B at Tall and Large.",
  concepts: [
    {
      id: 'A',
      Component: AlarmConceptA,
      name: 'Refined & minimal',
      idea: 'The state as a quiet headline, one button or the mode switch, open doors and locks as text.',
      strengths: ['Calm', 'Familiar controls', 'Colour only in the icon'],
      tradeoffs: ['Armed and disarmed look alike from afar', 'Little character']
    },
    {
      id: 'B',
      Component: AlarmConceptB,
      name: 'Expressive & immersive',
      idea: 'The card is the state: slate, green, indigo, amber or pulsing red, with a large shield behind; glass mode buttons.',
      strengths: ['State readable from afar', 'Triggered is unmistakable', 'Every mode one tap away at Wide'],
      tradeoffs: ['Strong colour while armed', 'Lock rows only at Large']
    },
    {
      id: 'C',
      Component: AlarmConceptC,
      name: 'Innovative: key switch',
      idea: 'Modes as positions on a track like a key switch, beside a "ready to arm" checklist (doors closed, locks locked).',
      strengths: ['Shows what to fix before arming', 'Mode track is clear', 'Neutral until triggered'],
      tradeoffs: ['Tall needed for the full checklist', 'New pattern to learn']
    }
  ]
});
