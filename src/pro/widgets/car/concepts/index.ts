/** Car in the Widget Design Studio (new widget, 2026-11-20). */
import { defineStudioEntry } from '../../../studio/types';
import CarConceptA from './CarConceptA';
import CarConceptB from './CarConceptB';
import CarConceptC from './CarConceptC';
import { CAR_STATES } from './states';

export const carStudio = defineStudioEntry({
  widgetId: 'car',
  title: 'Car (new)',
  personality: 'Alive, confident, a little playful',
  direction:
    'Your car at a glance, in whatever state it is: asleep or parked (and where, on a map), on, driving (speed and gear), charging (to what, how fast, when full), warming up or cooling down, a software update ready or installing, and anything that needs you: unlocked away from home, a window open, low battery, tyres. Uses the car data the Mobility page already reads. Unlocking needs a press and hold.',
  sizes: ['s', 'w', 't', 'l'],
  states: CAR_STATES,
  recommended: 'B',
  why: 'B makes the car feel alive: you see it charge, drive or warm up, and the colour tells you its state before you read a word; your own photo can replace the drawing. C is the most fun for car lovers and packs the most status; A is the calmest and most compact.',
  concepts: [
    {
      id: 'A',
      Component: CarConceptA,
      name: 'Refined & minimal',
      idea: 'The state in words and the one line that matters, battery as a light number with a thin bar, quiet rows for doors, cabin, update and alerts. Large: parked map and Lock / Climate.',
      strengths: ['Calm, matches the other minimal cards', 'Most information per pixel', 'Actions at Large'],
      tradeoffs: ['No sense of the car itself', 'States look alike at a glance']
    },
    {
      id: 'B',
      Component: CarConceptB,
      name: 'Expressive & immersive',
      idea: 'The car on stage, on a card coloured by what it is doing: charge flows down the cable, wheels turn while driving, warmth rises while the climate runs. Large: glass tiles and the parked spot on a map.',
      strengths: ['State readable from across the room', 'Feels alive', 'Your own photo when set'],
      tradeoffs: ['Big colour changes', 'Less detail at Small']
    },
    {
      id: 'C',
      Component: CarConceptC,
      name: 'Innovative: instrument cluster',
      idea: "The car's own dashboard: a dial (battery arc, charge target, speed and gear while driving), telltales that light up like warning lights, a trip computer, and the parked spot on a map at Large.",
      strengths: ['Every status at once', 'Speed and gear while driving', 'Warnings impossible to miss'],
      tradeoffs: ['Always dark', 'Icons need learning']
    }
  ]
});
