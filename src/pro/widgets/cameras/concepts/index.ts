/** Cameras in the Widget Design Studio (Phase 3). */
import { defineStudioEntry } from '../../../studio/types';
import CamerasConceptA from './CamerasConceptA';
import CamerasConceptB from './CamerasConceptB';
import CamerasConceptC from './CamerasConceptC';
import { CAMERAS_STATES } from './states';

export const camerasStudio = defineStudioEntry({
  widgetId: 'cameras',
  title: 'Cameras',
  personality: 'Watchful, cinematic',
  direction: 'See what is happening now, and where there was motion. The picture leads; motion in amber, offline in red (D1).',
  sizes: ['s', 'w', 'l'],
  states: CAMERAS_STATES,
  recommended: 'B',
  why: 'B gives the picture the whole card, which is what a camera widget is for, and its filmstrip makes switching easy at Large. C is best for homes with many cameras; its "motion first" order could be used in B\'s filmstrip.',
  concepts: [
    {
      id: 'A',
      Component: CamerasConceptA,
      name: 'Refined & minimal',
      idea: 'The picture inset like a framed photo, with a caption below: name, last motion, state.',
      strengths: ['Calm', 'Caption always readable', 'Matches the other minimal widgets'],
      tradeoffs: ['Smaller picture', 'Little drama']
    },
    {
      id: 'B',
      Component: CamerasConceptB,
      name: 'Expressive & immersive',
      idea: 'The picture is the card, edge to edge; dots for each camera; filmstrip and full screen at Large.',
      strengths: ['Biggest picture', 'Motion frames the card amber', 'Quick switching'],
      tradeoffs: ['Text over the picture', 'One camera at a time at Wide']
    },
    {
      id: 'C',
      Component: CamerasConceptC,
      name: 'Innovative: wall of screens',
      idea: 'Several cameras at once like a security desk; cameras with motion come to the front with an amber frame.',
      strengths: ['See more cameras at once', 'Motion is ordered first', 'Good for many cameras'],
      tradeoffs: ['Smaller pictures', 'More images to load']
    }
  ]
});
