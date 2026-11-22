/** Vacuums in the Widget Design Studio (Phase 1). */
import { defineStudioEntry } from '../../../studio/types';
import { VACUUMS_STATES } from './states';
import VacuumsConceptA from './VacuumsConceptA';
import VacuumsConceptB from './VacuumsConceptB';
import VacuumsConceptC from './VacuumsConceptC';

export const vacuumsStudio = defineStudioEntry({
  widgetId: 'vacuums',
  title: 'Vacuums',
  personality: 'Busy, friendly, mechanical',
  direction: 'Is the robot working, where, and does it have the battery to finish? State colours only when it is doing something or needs help (D1).',
  sizes: ['s', 'w', 't', 'l'],
  states: VACUUMS_STATES,
  recommended: 'B',
  why: "B tells the story without reading: the robot on its dock means done, the robot out on the floor means busy, a red floor means it needs you. C reads battery best and could lend its ring to B's Tall size.",
  concepts: [
    {
      id: 'A',
      Component: VacuumsConceptA,
      name: 'Refined & minimal',
      idea: 'One word for what the robot is doing, coloured by state, with room and suction below and the battery as a number. Large lists every robot.',
      strengths: ['Clearest words', 'Every robot at Large', 'Calm when docked'],
      tradeoffs: ['Little character', 'Battery is easy to miss']
    },
    {
      id: 'B',
      Component: VacuumsConceptB,
      name: 'Expressive & immersive',
      idea: 'The card is the floor and the robot is on it: sweeping with a clean trail while cleaning, charging on its dock, a red floor when stuck.',
      strengths: ['State understood without reading', 'Friendly and unmistakable', 'Calm when docked'],
      tradeoffs: ['Robot can cover text on Small while sweeping', 'Motion (off with reduced motion)']
    },
    {
      id: 'C',
      Component: VacuumsConceptC,
      name: 'Innovative: energy ring',
      idea: 'Each robot is a ring: fill is battery, colour is state, a dashed orbit turns while cleaning. Large puts two robots side by side.',
      strengths: ['Battery at a glance', 'Two robots compared at Large', 'Compact'],
      tradeoffs: ['Abstract: a ring could be anything', 'Room is secondary']
    }
  ]
});
