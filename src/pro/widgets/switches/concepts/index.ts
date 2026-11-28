/** Switches in the Widget Design Studio (Phase 2). */
import { defineStudioEntry } from '../../../studio/types';
import { SWITCHES_STATES } from './states';
import SwitchesConceptA from './SwitchesConceptA';
import SwitchesConceptB from './SwitchesConceptB';
import SwitchesConceptC from './SwitchesConceptC';

export const switchesStudio = defineStudioEntry({
  widgetId: 'switches',
  title: 'Switches',
  personality: 'Tactile, practical, power-aware',
  direction: 'What is on and what it is costing, with one tap to switch. Colour shows power, not decoration (D1).',
  sizes: ['s', 'w', 't', 'l'],
  states: SWITCHES_STATES,
  recommended: 'B',
  why: 'B feels like real switches: big rocker targets, on ones lit, so it is the fastest to use. C answers "what is using power?" best; its bar could sit on top of B\'s Large.',
  concepts: [
    {
      id: 'A',
      Component: SwitchesConceptA,
      name: 'Refined & minimal',
      idea: 'How many are on and the power now as the headline; quiet rows with switches. Wide lists the biggest consumers.',
      strengths: ['Easy to scan', 'Per-switch control at Tall/Large', 'Shows watts'],
      tradeoffs: ['Looks like Lighting "Minimal"', 'Little character']
    },
    {
      id: 'B',
      Component: SwitchesConceptB,
      name: 'Expressive & immersive',
      idea: 'A dark panel of physical rockers: on tiles light up in blue and show their watts; the total glows at the top.',
      strengths: ['Big tap targets', 'On/off readable at a glance', 'Feels physical'],
      tradeoffs: ['Dark panel in light mode', 'Few switches fit at Wide (6)']
    },
    {
      id: 'C',
      Component: SwitchesConceptC,
      name: 'Innovative: power share',
      idea: 'One bar shows where the power goes: each switch that is on takes a slice as wide as what it draws, in its own colour.',
      strengths: ['Answers "what uses power?"', 'Share in % at Tall/Large', 'Compact'],
      tradeoffs: ['Needs power sensors to shine', 'Off switches are only in the list']
    }
  ]
});
