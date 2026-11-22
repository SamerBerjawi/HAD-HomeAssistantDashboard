/** Media in the Widget Design Studio (Phase 1). */
import { defineStudioEntry } from '../../../studio/types';
import MediaConceptA from './MediaConceptA';
import MediaConceptB from './MediaConceptB';
import MediaConceptC from './MediaConceptC';
import { MEDIA_STATES } from './states';

export const mediaStudio = defineStudioEntry({
  widgetId: 'media',
  title: 'Media',
  personality: 'Content-led, vivid, playful',
  direction: 'What is playing, recognised by its cover, with play/pause always one tap away. The cover supplies the colour (D1).',
  sizes: ['s', 'w', 't', 'l'],
  states: MEDIA_STATES,
  recommended: 'B',
  why: "B is how people recognise music: by its cover. It looks different every song, so it never blends into the page. C is the most characterful; its record could be B's Small size.",
  concepts: [
    {
      id: 'A',
      Component: MediaConceptA,
      name: 'Refined & minimal',
      idea: "A neutral card with the cover as the only image; the artist line and play button take the cover's colour.",
      strengths: ['Calm next to busy widgets', 'Clear transport', 'Works without a cover'],
      tradeoffs: ['Least distinctive', 'Small cover at Small size']
    },
    {
      id: 'B',
      Component: MediaConceptB,
      name: 'Expressive & immersive',
      idea: 'The cover is the card: blurred and enlarged behind, sharp on top, white type on a soft scrim. At Small the cover fills the whole card.',
      strengths: ['Recognised by its cover at a glance', 'Changes with every song', 'Matches Weather "Sky"'],
      tradeoffs: ['Busy with bright covers', 'Needs a fallback colour without art']
    },
    {
      id: 'C',
      Component: MediaConceptC,
      name: 'Innovative: record',
      idea: 'The cover becomes a record inside a progress ring in its colour; it turns while playing and an equaliser moves by the title. Large shows what plays next.',
      strengths: ['Progress readable from the ring', 'Playful, unlike any other widget', 'Up next at Large'],
      tradeoffs: ['Round crop hides part of the cover', 'Motion (off with reduced motion)']
    }
  ]
});
