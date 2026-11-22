/** Door locks in the Widget Design Studio (new widget, 2026-11-20). */
import { defineStudioEntry } from '../../../studio/types';
import LocksConceptA from './LocksConceptA';
import LocksConceptB from './LocksConceptB';
import LocksConceptC from './LocksConceptC';
import { LOCKS_STATES } from './states';

export const locksStudio = defineStudioEntry({
  widgetId: 'locks',
  title: 'Door locks (new)',
  personality: 'Reassuring, physical, safe',
  direction:
    'Every door lock at a glance: is the house locked, which door is not, who opened it and when, and a low lock battery before it dies. Locking is one tap; unlocking always needs a press and hold. A lock on an open door cannot be locked. Colours stay soft: only what needs attention stands out.',
  sizes: ['s', 'w', 't', 'l'],
  states: LOCKS_STATES,
  recommended: 'C',
  why: 'C feels like the real thing: a bolt you shoot across and hold to draw back, so state and action are one control and an accidental unlock is unlikely. A is the most compact for many locks; B is the boldest at a glance from across the room.',
  concepts: [
    {
      id: 'A',
      Component: LocksConceptA,
      name: 'Refined & minimal',
      idea: 'A plain headline and a quiet row per lock: soft tint, who changed it and when, Lock or hold to Unlock; battery at Large.',
      strengths: ['Most locks fit', 'Who and when on every row', 'Calm'],
      tradeoffs: ['Looks like a list', 'Wide has no actions per lock']
    },
    {
      id: 'B',
      Component: LocksConceptB,
      name: 'Expressive & immersive',
      idea: 'One big padlock is the house: shut on a night-blue card, springing open on amber when a door is unlocked, red when jammed. Glass tiles per lock.',
      strengths: ['Readable from across the room', 'Clear mood per state', 'Matches the Alarm card'],
      tradeoffs: ['Big colour change for one door', 'Fewer locks fit']
    },
    {
      id: 'C',
      Component: LocksConceptC,
      name: 'Innovative: bolts',
      idea: 'Each lock is a deadbolt on a rail: tap to shoot it into the frame, press and hold to slide it back. Jammed sticks halfway.',
      strengths: ['State and action are one control', 'Hold-to-unlock is visible', 'Feels physical'],
      tradeoffs: ['New gesture to learn', 'Two locks at Wide']
    }
  ]
});
