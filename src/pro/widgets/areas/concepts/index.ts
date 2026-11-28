/** Areas in the Widget Design Studio (Phase 3, new widget). */
import { defineStudioEntry } from '../../../studio/types';
import AreasConceptA from './AreasConceptA';
import AreasConceptB from './AreasConceptB';
import AreasConceptC from './AreasConceptC';
import { AREAS_STATES } from './states';

export const areasStudio = defineStudioEntry({
  widgetId: 'areas',
  title: 'Areas (new)',
  personality: 'Homely, spatial, quick',
  direction:
    'Your favourite rooms one tap away, every room by floor in a menu. The card shows the room you picked: temperature, lights, what is going on, and its lights switch. Favourites are your own list (shared with the Rooms settings); with none set, the first rooms stand in.',
  sizes: ['s', 'w', 't', 'l'],
  states: AREAS_STATES,
  recommended: 'B',
  why: "B makes each room recognisable at a glance by its own photo, with favourites as big pills; it falls back to a calm colour when a room has no picture. C is the most spatial and best for seeing the whole house's lights; it could be B's Large.",
  concepts: [
    {
      id: 'A',
      Component: AreasConceptA,
      name: 'Refined & minimal',
      idea: 'The room on show as a quiet headline; favourites as plain quick buttons; figures at Large.',
      strengths: ['Easy to read', 'Most favourites fit', 'Works without pictures'],
      tradeoffs: ['Rooms look alike', 'Little character']
    },
    {
      id: 'B',
      Component: AreasConceptB,
      name: 'Expressive & immersive',
      idea: "The room's own picture fills the card; favourites are glass pills; lights button and status chips at Tall/Large.",
      strengths: ['Rooms recognised by photo', 'Big tap targets', 'Matches Media and Weather'],
      tradeoffs: ['Needs area pictures in Home Assistant', 'Busy photos can lower contrast']
    },
    {
      id: 'C',
      Component: AreasConceptC,
      name: 'Innovative: the house',
      idea: 'A cross-section of the home: floors stacked, rooms as blocks that glow while lit; tap a room to look at it.',
      strengths: ['Whole house at a glance', 'Lights visible per room', 'Floors are obvious'],
      tradeoffs: ['Names get short', 'Small toggles lights instead of showing a room']
    }
  ]
});
