/** Safety in the Widget Design Studio (Phase 3). */
import { defineStudioEntry } from '../../../studio/types';
import SafetyConceptA from './SafetyConceptA';
import SafetyConceptB from './SafetyConceptB';
import SafetyConceptC from './SafetyConceptC';
import { SAFETY_STATES } from './states';

export const safetyStudio = defineStudioEntry({
  widgetId: 'safety',
  title: 'Safety',
  personality: 'Reassuring, then urgent',
  direction: 'Silent reassurance that leak and smoke sensors are watching; an unmistakable alarm the moment one goes off (D1: red only for danger).',
  sizes: ['s', 'w', 't', 'l'],
  states: SAFETY_STATES,
  recommended: 'B',
  why: 'B is the most reassuring when calm and the loudest in an emergency: the whole card turns red and pulses, with the sensor and room in big type. C shows that every sensor is alive (offline ones stand out); its rings could fill B at Tall/Large.',
  concepts: [
    {
      id: 'A',
      Component: SafetyConceptA,
      name: 'Refined & minimal',
      idea: '"All clear" in quiet type with what is watching; red headline with sensor, room and time when detected.',
      strengths: ['Calm', 'Clear wording', 'Light on colour'],
      tradeoffs: ['An alarm may be missed from afar', 'Little character']
    },
    {
      id: 'B',
      Component: SafetyConceptB,
      name: 'Expressive & immersive',
      idea: 'A cool calm card with a drop and flame resting behind; red and pulsing with big text when anything is detected.',
      strengths: ['Unmistakable alarm', 'Reassuring when calm', 'Matches Alarm and Doors "B"'],
      tradeoffs: ['Strong motion while alarming', 'Sensor list only at Tall/Large']
    },
    {
      id: 'C',
      Component: SafetyConceptC,
      name: 'Innovative: sentinels',
      idea: 'Every sensor as a ring: green is watching, red pulsing has detected something, dashed is offline.',
      strengths: ['Offline sensors are obvious', 'Every sensor visible', 'Neutral card when calm'],
      tradeoffs: ['Many rings get small', 'Detail text is short']
    }
  ]
});
