/** Fans in the Widget Design Studio (Phase 2). */
import { defineStudioEntry } from '../../../studio/types';
import FansConceptA from './FansConceptA';
import FansConceptB from './FansConceptB';
import FansConceptC from './FansConceptC';
import { FANS_STATES } from './states';

export const fansStudio = defineStudioEntry({
  widgetId: 'fans',
  title: 'Fans',
  personality: 'Breezy, light, kinetic',
  direction: 'Which fans are moving air and how hard, with speed one tap away. Cool mint only while air moves (D1).',
  sizes: ['s', 'w', 't', 'l'],
  states: FANS_STATES,
  recommended: 'B',
  why: "B shows air moving: the faster the fans, the faster the stream and blades, still when off. C has the best speed control; its steps could replace B's rows at Tall and Large.",
  concepts: [
    {
      id: 'A',
      Component: FansConceptA,
      name: 'Refined & minimal',
      idea: 'How many are running and their average speed; quiet rows with switches.',
      strengths: ['Easy to scan', 'Per-fan switch at Tall/Large', 'Calm'],
      tradeoffs: ['Same as Switches/Lighting minimal', 'Speed is only a number']
    },
    {
      id: 'B',
      Component: FansConceptB,
      name: 'Expressive & immersive',
      idea: 'A cool mint card with air streaming across it; streams and blades move faster with the speed and stop when all are off.',
      strengths: ['Running fans felt at a glance', 'Speed shown as motion', 'Matches Weather "Sky"'],
      tradeoffs: ['Motion (off with reduced motion)', 'Speed set in the sheet only']
    },
    {
      id: 'C',
      Component: FansConceptC,
      name: 'Innovative: speed steps',
      idea: 'Each fan is a row of four steps (off, low, medium, high) like a pull-chain; tap a step to set that speed.',
      strengths: ['Speed set on the card', 'Every fan comparable', 'Tactile'],
      tradeoffs: ['Only four speeds', 'Two fans at Wide']
    }
  ]
});
