/** Energy now, Energy today and Energy flow in the Widget Design Studio (Phase 4). */
import { defineStudioEntry } from '../../../studio/types';
import EnergyFlowConceptA from './EnergyFlowConceptA';
import EnergyFlowConceptB from './EnergyFlowConceptB';
import EnergyFlowConceptC from './EnergyFlowConceptC';
import EnergyNowConceptA from './EnergyNowConceptA';
import EnergyNowConceptB from './EnergyNowConceptB';
import EnergyNowConceptC from './EnergyNowConceptC';
import EnergyTodayConceptA from './EnergyTodayConceptA';
import EnergyTodayConceptB from './EnergyTodayConceptB';
import EnergyTodayConceptC from './EnergyTodayConceptC';
import { ENERGY_STATES } from './states';

export const energyNowStudio = defineStudioEntry({
  widgetId: 'energy_now',
  title: 'Energy now',
  personality: 'Live, clear, a little proud',
  direction: 'What the home draws right now and where it comes from: sun, battery or grid. Source colours only (D1). Small is new: it was Wide and Large only.',
  sizes: ['s', 'w', 'l'],
  states: ENERGY_STATES,
  recommended: 'C',
  why: "C answers both questions in one shape: the ring is the home's draw, its colours are the sources, and the thin outer ring shows solar being sold or stored. B is the most fun on a sunny day; its glow could tint C's card.",
  concepts: [
    {
      id: 'A',
      Component: EnergyNowConceptA,
      name: 'Refined & minimal',
      idea: 'Home draw as a light headline, a quiet row per source; Large adds the last hours as an area chart.',
      strengths: ['Easy to read', 'Every source with a value', 'History at Large'],
      tradeoffs: ['The mix is not visible at a glance', 'Looks like other minimal widgets']
    },
    {
      id: 'B',
      Component: EnergyNowConceptB,
      name: 'Expressive & immersive',
      idea: 'The card takes the colour of what feeds the home (sun, battery, grid, night) with a glass bar of the mix.',
      strengths: ['Source felt from across the room', 'Lovely on sunny days', 'Big number'],
      tradeoffs: ['Strong colour all day', 'Fewer details at Wide']
    },
    {
      id: 'C',
      Component: EnergyNowConceptC,
      name: 'Innovative: power ring',
      idea: 'A ring split by source with the home draw inside; a thin outer ring for solar sold or stored.',
      strengths: ['Mix and outflow in one shape', 'Works at Small', 'Neutral card'],
      tradeoffs: ['Ring needs a moment to learn', 'Exact values in the legend only']
    }
  ]
});

export const energyTodayStudio = defineStudioEntry({
  widgetId: 'energy_today',
  title: 'Energy today',
  personality: 'Thrifty, honest, satisfying',
  direction: 'How much the home used today, how much it made itself, and what it cost.',
  sizes: ['s', 'w', 't', 'l'],
  states: ENERGY_STATES,
  recommended: 'B',
  why: "B makes the day's result a feeling: the sunnier the card, the more the home ran on its own power, with the day's sun and use drawn across it. C explains the balance best; its two bars could be B's Large.",
  concepts: [
    {
      id: 'A',
      Component: EnergyTodayConceptA,
      name: 'Refined & minimal',
      idea: 'Used today as a light headline with the cost; figures for solar, bought, sold; hourly bars at Large.',
      strengths: ['All numbers at hand', 'Familiar chart', 'Calm'],
      tradeoffs: ['No sense of a good or bad day', 'Busy at Large']
    },
    {
      id: 'B',
      Component: EnergyTodayConceptB,
      name: 'Expressive & immersive',
      idea: "The card is the day's sky (sunnier the more self-powered), with the sun's production and the home's use drawn over it.",
      strengths: ['Good day or bad day at a glance', 'Day shape visible', 'Matches Weather "Sky"'],
      tradeoffs: ['Fewer exact numbers', 'Grey on cloudy days']
    },
    {
      id: 'C',
      Component: EnergyTodayConceptC,
      name: 'Innovative: in and out',
      idea: 'Two bars balance the day: where energy came from and where it went; money and top users at Large.',
      strengths: ['Explains the whole day', 'Money visible', 'Self-powered ring at Small'],
      tradeoffs: ['More to read', 'No hourly view']
    }
  ]
});

export const energyFlowStudio = defineStudioEntry({
  widgetId: 'energy_flow',
  title: 'Energy flow',
  personality: 'Curious, revealing',
  direction: 'Where the energy went: which devices and rooms used the most.',
  sizes: ['l'],
  states: ENERGY_STATES,
  recommended: 'C',
  why: 'C shows what the house spends its energy on in one look, with no lines to follow; big users are big blocks. A keeps the full path from source to device for those who want it; it could live in the details sheet.',
  concepts: [
    {
      id: 'A',
      Component: EnergyFlowConceptA,
      name: 'Refined & minimal',
      idea: 'The Sankey from sources to home to rooms to devices, on a calm card with a one-line header.',
      strengths: ['Most complete', 'Shows the path', 'Familiar from Home Assistant'],
      tradeoffs: ['Hard to read on a phone', 'Thin lines for small users']
    },
    {
      id: 'B',
      Component: EnergyFlowConceptB,
      name: 'Expressive & immersive',
      idea: 'A dark leaderboard: the biggest users glow as bars, with a strip of where the energy came from.',
      strengths: ['Ranking at a glance', 'Readable names', 'Striking at night'],
      tradeoffs: ['No rooms', 'Dark card in light mode']
    },
    {
      id: 'C',
      Component: EnergyFlowConceptC,
      name: 'Innovative: energy map',
      idea: 'Blocks sized by what each device used; untracked use is a hatched block.',
      strengths: ['Shares obvious at once', 'Uses the whole card', 'Untracked is honest'],
      tradeoffs: ['Small users get tiny blocks', 'No sources']
    }
  ]
});
