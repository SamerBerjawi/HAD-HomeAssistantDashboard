/** Lighting in the Widget Design Studio (Phase 1). */
import { defineStudioEntry } from '../../../studio/types';
import LightsConceptA from './LightsConceptA';
import LightsConceptB from './LightsConceptB';
import LightsConceptC from './LightsConceptC';
import { LIGHTS_STATES } from './states';

export const lightsStudio = defineStudioEntry({
  widgetId: 'lights',
  title: 'Lighting',
  personality: 'Warm, glowing, tactile',
  direction: 'How lit the home is, at a glance, and one tap to change it. Warm light is the only colour, and only when lights are on (D1).',
  sizes: ['s', 'w', 't', 'l'],
  states: LIGHTS_STATES,
  recommended: 'B',
  why: 'B shows the state as light itself: a dark card means the house is dark. Room pills match how people think ("the kitchen"), not entity names. C is the most playful; its dots could become B\'s Large view.',
  concepts: [
    {
      id: 'A',
      Component: LightsConceptA,
      name: 'Refined & minimal',
      idea: 'A large light count, a single warm dot, and quiet rows with switches. Rooms at Wide, lights at Tall and Large.',
      strengths: ['Calm, precise, fast to scan', 'Per-light switches at Tall/Large', 'Matches Weather "Minimal"'],
      tradeoffs: ['Looks like a list', 'No sense of how bright it is']
    },
    {
      id: 'B',
      Component: LightsConceptB,
      name: 'Expressive & immersive',
      idea: 'The card glows: a dusk surface lit warmer as more lights are on and brighter; dark when all are off. Rooms are glowing pills that switch the room.',
      strengths: ['State readable from across the room', 'Room-level control in one tap', 'Matches Weather "Sky"'],
      tradeoffs: ['Always a dark card, even in light mode', 'Single lights only in the sheet']
    },
    {
      id: 'C',
      Component: LightsConceptC,
      name: 'Innovative: light map',
      idea: 'Every light is a dot glowing at its own brightness, grouped by room: a small map of where the light is. Tap a dot to switch that light.',
      strengths: ['Every light visible and tappable', 'Brightness shown, not written', 'Scales to many lights'],
      tradeoffs: ['Dots need names on hover/long-press', 'Small targets at Small size']
    }
  ]
});
