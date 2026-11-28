/** Scenes (new widget) in the Widget Design Studio (Phase 2). */
import { defineStudioEntry } from '../../../studio/types';
import ScenesConceptA from './ScenesConceptA';
import ScenesConceptB from './ScenesConceptB';
import ScenesConceptC from './ScenesConceptC';
import { SCENES_STATES } from './states';

export const scenesStudio = defineStudioEntry({
  widgetId: 'scenes',
  title: 'Scenes',
  personality: 'Moody, playful, one-tap',
  direction: 'Set the mood in one tap and see which mood is on. Each scene carries its own colour, from its name (D1).',
  sizes: ['s', 'w', 't', 'l'],
  states: SCENES_STATES,
  recommended: 'B',
  why: 'B makes scenes feel like moods, not settings: a wall of colour you tap. The active one glows. C is the calmest colourful option and fits small spaces; A is the most compact list.',
  concepts: [
    {
      id: 'A',
      Component: ScenesConceptA,
      name: 'Refined & minimal',
      idea: 'The active scene as a quiet headline; scenes as text buttons, the active one ticked. Large shows when each was last used.',
      strengths: ['Names easy to read', 'Compact', 'Works with any number of scenes'],
      tradeoffs: ['Scenes look like settings', 'No sense of mood']
    },
    {
      id: 'B',
      Component: ScenesConceptB,
      name: 'Expressive & immersive',
      idea: "A wall of tiles painted in each scene's mood (cinema violet, dinner amber, night navy); the active one glows. At Small, the active mood fills the card.",
      strengths: ['Tap targets are big', 'Active mood visible from afar', 'Playful'],
      tradeoffs: ['Dark wall in light mode', 'Long names wrap to two lines']
    },
    {
      id: 'C',
      Component: ScenesConceptC,
      name: 'Innovative: palette',
      idea: "The card is tinted by the active mood and names it; every scene is a round colour swatch, like a painter's palette.",
      strengths: ['Elegant and compact', 'Many scenes fit', 'Active mood tints the card'],
      tradeoffs: ['No names at Small (colour only)', 'Names cut to one line']
    }
  ]
});
