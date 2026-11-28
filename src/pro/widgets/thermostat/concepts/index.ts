/** Thermostat (new widget) in the Widget Design Studio (Phase 2). */
import { defineStudioEntry } from '../../../studio/types';
import { THERMOSTAT_STATES } from './states';
import ThermostatConceptA from './ThermostatConceptA';
import ThermostatConceptB from './ThermostatConceptB';
import ThermostatConceptC from './ThermostatConceptC';

export const thermostatStudio = defineStudioEntry({
  widgetId: 'thermostat',
  title: 'Thermostat',
  personality: 'Comfortable, precise, calm',
  direction: 'How warm it is, what the system is doing about it, and a quick nudge to the target. Warm while heating, cool while cooling, neutral otherwise (D1).',
  sizes: ['s', 'w', 't', 'l'],
  states: THERMOSTAT_STATES,
  recommended: 'C',
  why: 'C is the one shape everyone reads as a thermostat, and the dial shows target and room temperature together. B is the most atmospheric and pairs with Weather "Sky"; its colours could tint C\'s dial card.',
  concepts: [
    {
      id: 'A',
      Component: ThermostatConceptA,
      name: 'Refined & minimal',
      idea: 'The room temperature as a light headline, one line for what the system is doing, −/+ for the target. Large lists every room.',
      strengths: ['Room temperature first', 'Every room at Large', 'Calm'],
      tradeoffs: ['Target is secondary', 'Little character']
    },
    {
      id: 'B',
      Component: ThermostatConceptB,
      name: 'Expressive & immersive',
      idea: 'The card is the air: ember gradient while heating, icy blue while cooling, slate when idle. The target is the big number; large glass −/+.',
      strengths: ['Heating or cooling seen from across the room', 'Big targets to press', 'Matches Weather "Sky"'],
      tradeoffs: ['Strong colour when active', 'Room temperature is smaller']
    },
    {
      id: 'C',
      Component: ThermostatConceptC,
      name: 'Innovative: dial',
      idea: 'A 270° dial from the lowest to the highest setting: filled to the target in the action colour, a dot for the room temperature, the target in the middle.',
      strengths: ['Instantly reads as a thermostat', 'Target and room temperature together', 'Rooms compared at Large'],
      tradeoffs: ['Dial is small at Small size', 'Closest to existing smart-home apps']
    }
  ]
});
