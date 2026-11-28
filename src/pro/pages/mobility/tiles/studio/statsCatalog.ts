/**
 * Batch 7 · Statistics for the Vehicle Tiles Studio (docs/pro-ui/VEHICLE_TILES.md): a vehicle's
 * months, from Home Assistant's long-term statistics (the odometer) and the server's daily
 * snapshot (energy per trip, charging sessions). Split from `vehicleCatalog.ts` to keep it short.
 */
import type { VehicleTileType } from './vehicleCatalog';
import { DistanceBars, DistanceCompare, DistanceYear } from '../stats/DistanceTiles';
import { EfficiencyCost, EfficiencyTrend, EfficiencyWeather } from '../stats/EfficiencyTiles';
import { ChargeCare, ChargeHabit, ChargeSessions } from '../stats/ChargeHistoryTiles';
import { AllowanceBudget, AllowancePace, AllowanceProjection } from '../stats/AllowanceTiles';

const SIZES = ['xs', 's', 'w', 'l'] as const;

export const STATS_TYPES: VehicleTileType[] = [
  {
    id: 'distance',
    chosen: 'A',
    title: 'Distance',
    batch: 7,
    reads: 'the odometer by month (HA long-term statistics)',
    job: 'How far it goes, month by month, and whether this month is a big one.',
    sizes: SIZES,
    recommended: 'A',
    why: 'Bars is the odometer per month you asked for, read at a glance, with this month lit and where it is heading. Compare answers “more or less than usual?” in words; Year is for the long view.',
    concepts: [
      {
        id: 'A',
        name: 'Bars',
        Component: DistanceBars,
        idea: 'The last twelve months as bars (six on Small), this month lit: solid for what is driven so far, a faint cap for where it is heading. Large adds the year so far, the daily average and the best month.',
        interaction: 'Read only (the section’s Month | Year | All switch comes with the page).',
        strengths: ['The odometer per month, as asked', 'This month in context', 'Same bars as the Energy page'],
        tradeoffs: ['Months only, no days', 'A partial month needs the cap to read right']
      },
      {
        id: 'B',
        name: 'Compare',
        Component: DistanceCompare,
        idea: '“12% more” in big type: this month (where it is heading) against last month, and the same month last year as bars under it.',
        interaction: 'Read only.',
        strengths: ['Answers “a lot this month?” in words', 'Fair to a month half gone'],
        tradeoffs: ['No long trend', 'Needs a full year for the last row']
      },
      {
        id: 'C',
        name: 'Year',
        Component: DistanceYear,
        idea: 'This year’s running total as a line over last year’s (dashed), year to date big and the change in words.',
        interaction: 'Read only.',
        strengths: ['The evolution over time at a glance', 'Year to date in one number'],
        tradeoffs: ['Flat early in the year', 'Months hidden in the line']
      }
    ]
  },
  {
    id: 'efficiency',
    chosen: 'B',
    title: 'Efficiency',
    batch: 7,
    reads: 'kWh per 100 by month, outside temperature, the home tariff',
    job: 'How much energy it uses, why it changes, and what it costs.',
    sizes: SIZES,
    recommended: 'B',
    why: 'Weather explains the number everyone notices (winter range) by colouring each month with its temperature. Trend is the plain number; Cost turns it into money with the Energy page’s tariff.',
    concepts: [
      {
        id: 'A',
        name: 'Trend',
        Component: EfficiencyTrend,
        idea: 'kWh/100 over twelve months as a line, this month big, the average dashed, a word on whether it is better or worse.',
        interaction: 'Read only.',
        strengths: ['Plain and exact', 'Shows a change in driving'],
        tradeoffs: ['Does not say why', 'kWh/100 is jargon for some']
      },
      {
        id: 'B',
        name: 'Weather',
        Component: EfficiencyWeather,
        idea: 'A bar per month in the colour of its outside temperature (blue cold, amber warm); the headline is how much more winter uses.',
        interaction: 'Read only.',
        strengths: ['Explains winter range', 'One sentence anyone gets'],
        tradeoffs: ['Needs the outside temperature (FordPass has it)', 'Colour carries meaning (the headline says it too)']
      },
      {
        id: 'C',
        name: 'Cost',
        Component: EfficiencyCost,
        idea: 'This month’s energy cost at the home tariff, per 100 under it, the months as bars.',
        interaction: 'Read only (the tariff is the Energy page’s).',
        strengths: ['Money, not kWh', 'Ties the car to the house’s energy'],
        tradeoffs: ['Public charging is not priced', 'Greyed until a tariff is set']
      }
    ]
  },
  {
    id: 'sessions',
    chosen: 'A',
    title: 'Charging history',
    batch: 7,
    reads: 'charging sessions by month: kWh, home or away, start and end %',
    job: 'How often and where it charges, and whether that is kind to the battery.',
    sizes: SIZES,
    recommended: 'A',
    why: 'Sessions shows where the energy comes from (home or away) month by month. Habit is the one number a careful owner watches; Care says it in a verdict, like the Condition tiles.',
    concepts: [
      {
        id: 'A',
        name: 'Sessions',
        Component: ChargeSessions,
        idea: 'kWh added by month as bars, home solid and away faint on top; this month’s charges big.',
        interaction: 'Read only.',
        strengths: ['Home against public at a glance', 'Pairs with Cost'],
        tradeoffs: ['Needs the server’s session log', 'Starts on the day it is turned on']
      },
      {
        id: 'B',
        name: 'Habit',
        Component: ChargeHabit,
        idea: '“30 → 90%”: where charging usually starts and stops, as a band on a 0–100 track; Large adds a band per month.',
        interaction: 'Read only.',
        strengths: ['The number battery-minded owners watch', 'Calm'],
        tradeoffs: ['Averages hide the odd 100%']
      },
      {
        id: 'C',
        name: 'Care',
        Component: ChargeCare,
        idea: 'A verdict (“Kind to the battery”, “Often to 100%”) from the last three months, the facts under it.',
        interaction: 'Read only.',
        strengths: ['Advice, not numbers', 'Same voice as the Condition tiles'],
        tradeoffs: ['The thresholds are a rule of thumb', 'Amber can nag']
      }
    ]
  },
  {
    id: 'allowance',
    chosen: 'B',
    title: 'Allowance',
    batch: 7,
    reads: 'the owner’s lease allowance (per year, years, start) and the odometer',
    job: 'For a leased car: am I on pace, and how much can I still drive?',
    sizes: SIZES,
    recommended: 'A',
    why: 'Pace answers the question in one bar with today’s mark on it. Projection shows where it ends; Budget turns it into what is left per day.',
    concepts: [
      {
        id: 'A',
        name: 'Pace',
        Component: AllowancePace,
        idea: 'The contract as a bar: driven so far, with a tick where you should be today; “1,600 km over pace” in amber or “On pace”.',
        interaction: 'Read only (the allowance is set in the page’s Customize).',
        strengths: ['One look: ahead or behind', 'Works on every size'],
        tradeoffs: ['Does not say the end result']
      },
      {
        id: 'B',
        name: 'Projection',
        Component: AllowanceProjection,
        idea: 'The allowance as a straight line from start to end, the odometer over it, and a dashed line to where it ends at this pace.',
        interaction: 'Read only.',
        strengths: ['Shows the end before it comes', 'The evolution over time'],
        tradeoffs: ['A chart to read', 'Early months project wildly']
      },
      {
        id: 'C',
        name: 'Budget',
        Component: AllowanceBudget,
        idea: '“25 km a day” left to stay within the allowance, against what you usually drive.',
        interaction: 'Read only.',
        strengths: ['Something you can act on', 'Big and simple'],
        tradeoffs: ['Hides how far over you are']
      }
    ]
  }
];
