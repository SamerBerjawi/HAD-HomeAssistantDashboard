/**
 * Catalog of all 11 Energy sections with three structurally distinct design concepts per section
 * (A / B / C — varied visual metaphors, diagrams, bespoke SVGs, and compositions).
 */
import type { ComponentType } from 'react';
import { CHOSEN_ENERGY_CONCEPTS, type EnergySectionId, type ResponsiveConceptChoice } from '../../../lib/energyPage';
import { BatteryA, BatteryB, BatteryC } from './concepts/BatteryConcepts';
import { CostsA, CostsB, CostsC } from './concepts/CostsConcepts';
import { DevicesA, DevicesB, DevicesC } from './concepts/DevicesConcepts';
import { FlowA, FlowB, FlowC } from './concepts/FlowConcepts';
import { ImpactA, ImpactB, ImpactC } from './concepts/ImpactConcepts';
import { LiveNowA, LiveNowB, LiveNowC } from './concepts/LiveNowConcepts';
import { PeriodBarA, PeriodBarB, PeriodBarC } from './concepts/PeriodBarConcepts';
import { SolarA, SolarB, SolarC } from './concepts/SolarConcepts';
import { SummaryA, SummaryB, SummaryC } from './concepts/SummaryConcepts';
import { UtilitiesA, UtilitiesB, UtilitiesC } from './concepts/UtilitiesConcepts';
import { UsageA, UsageB, UsageC } from './concepts/UsageConcepts';
import type { SectionConceptProps } from './concepts/types';

export type ConceptId = 'A' | 'B' | 'C';

export interface SectionConceptEntry {
  id: ConceptId;
  name: string;
  idea: string;
  strengths: string[];
  tradeoffs: string[];
  Component: ComponentType<SectionConceptProps>;
}

export interface EnergySectionCatalogEntry {
  id: EnergySectionId;
  title: string;
  job: string;
  recommended: ConceptId;
  chosen: ResponsiveConceptChoice;
  why: string;
  concepts: readonly [SectionConceptEntry, SectionConceptEntry, SectionConceptEntry];
}

const RAW_CATALOG: readonly Omit<EnergySectionCatalogEntry, 'chosen'>[] = [
  {
    id: 'live',
    title: 'Live now',
    job: 'Always sits above the period bar. Shows current home draw, what feeds it right now, and battery charge.',
    recommended: 'A',
    why: 'The concentric dual-arc Power Orbit packs inflows, outflows, live draw, and battery badge into one unmistakable hero without wasting phone vertical space.',
    concepts: [
      {
        id: 'A',
        name: 'Concentric Power Orbit',
        idea: 'Bespoke dual-ring SVG diagram: inner segmented arc shows what feeds your home, outer thin orbital arc tracks surplus export/battery charge, paired with crisp source rows and a subtle dominant-source glow.',
        strengths: ['Inflows and outflows readable in one glance', 'Balanced proportions on both 375 px phone and desktop', 'Matches Overview Power Ring signature look'],
        tradeoffs: ['Does not animate beams between discrete nodes'],
        Component: LiveNowA
      },
      {
        id: 'B',
        name: 'Live Busbar Schematic',
        idea: 'Interactive node diagram using AnimatedBeam connecting Solar, Battery, and Grid directly into the central Home hub, alongside big live kW + BatteryStat.',
        strengths: ['Shows exact energy direction with animated pulses', 'Hero BatteryStat clearly visible across a room'],
        tradeoffs: ['Slightly taller topology canvas'],
        Component: LiveNowB
      },
      {
        id: 'C',
        name: 'Living Horizon Strip',
        idea: 'Compact command header with oversized live kW, full-width proportional power river bar, battery pill, and a 3-column source legend.',
        strengths: ['Lowest height footprint above the Period bar', 'Zero SVG diagram complexity'],
        tradeoffs: ['Linear bar is less expressive than ring or node views'],
        Component: LiveNowC
      }
    ]
  },
  {
    id: 'period',
    title: 'Period bar',
    job: 'Switches Day / Week / Month / Year / Custom, steps dates, toggles Compare with last year, and opens Customise.',
    recommended: 'A',
    why: 'Kokonut SmoothTab + tactile floating date capsule gives crystal-clear touch targets on phone while expanding cleanly on desktop.',
    concepts: [
      {
        id: 'A',
        name: 'Capsule Dock',
        idea: 'Floating capsule date navigator paired with sliding SmoothTab periods, inline Compare/Year pills, Customise, and Refresh.',
        strengths: ['Matches Overview SmoothTab spring physics', 'Dedicated date capsule stays uncluttered'],
        tradeoffs: ['Two rows on phone & tablet'],
        Component: PeriodBarA
      },
      {
        id: 'B',
        name: 'Editorial Timeline Header',
        idea: 'Bold date headline with circular steppers on the left, Segmented period controls on the right, and a YoY Switch strip underneath.',
        strengths: ['Current date stands out like an editorial masthead', 'Explicit year pills when Compare is enabled'],
        tradeoffs: ['More typographic height than compact dock'],
        Component: PeriodBarB
      },
      {
        id: 'C',
        name: 'Compact Instrument Rail',
        idea: 'Single-row monospace strip with 1D/1W/1M/1Y shortcuts, bracketed date stepper, and icon-only Customise & Refresh actions.',
        strengths: ['Shortest vertical height', 'Fast switching for power users'],
        tradeoffs: ['Compact abbreviations (1D/1W) feel more technical'],
        Component: PeriodBarC
      }
    ]
  },
  {
    id: 'summary',
    title: 'Summary KPIs',
    job: 'Summarises period totals (Used, Solar, Grid in/out, Net cost, Self-sufficiency) and YoY deltas when Compare is on.',
    recommended: 'A',
    why: 'Asymmetric Bento anchors the story around one bold Self-Sufficiency Halo Ring while keeping the 4 key metrics in a neat 2×2 grid.',
    concepts: [
      {
        id: 'A',
        name: 'Asymmetric Bento Hero',
        idea: 'Featured SVG Self-Sufficiency Halo Ring + plain-language verdict flanking a crisp 2×2 metric grid with YoY delta chips.',
        strengths: ['Strong visual anchor without cluttering the numbers', 'Adapts cleanly from 375 px to desktop'],
        tradeoffs: ['Grid-only setups show 0% clean ring'],
        Component: SummaryA
      },
      {
        id: 'B',
        name: 'Dual Dial Dashboard',
        idea: 'Side-by-side bklit ArcGauges (Self-powered % and Solar self-use %) flanking a central GridBalanceBar tug meter + 4-stat footer.',
        strengths: ['Visualizes import vs export balance and self-use together'],
        tradeoffs: ['Densest height among the three options'],
        Component: SummaryB
      },
      {
        id: 'C',
        name: 'Story Sentence & Source Ribbon',
        idea: 'Dynamic plain-English headline summarizing the period, full-width proportional Solar/Battery/Grid ribbon, and 4 bottom tiles.',
        strengths: ['Instant human-readable takeaway for non-technical household members', 'Shows exact supply composition linearly'],
        tradeoffs: ['No YoY delta chips on secondary stats'],
        Component: SummaryC
      }
    ]
  },
  {
    id: 'usage',
    title: 'Usage over time',
    job: 'Shows power flow curve (10-min on Day) by default with 1-tap Energy breakdown across sources and export.',
    recommended: 'A',
    why: 'Full interactive PowerSourcesAreaChart by default gives the true HA Power topology, while SmoothTab switches cleanly to BidirectionalBarChart.',
    concepts: [
      {
        id: 'A',
        name: 'Power Wave & Mix',
        idea: 'Interactive PowerSourcesAreaChart (Power default on Day) with SmoothTab toggle to BidirectionalBarChart, peak power stats, and interactive legend.',
        strengths: ['True HA multi-source stacked bands + dashed home curve', 'Scrubbable slot tooltips'],
        tradeoffs: ['Classical Power chart styling'],
        Component: UsageA
      },
      {
        id: 'B',
        name: 'Daylight Skyscape',
        idea: 'Custom SVG atmospheric solar horizon curve with peak-power marker and dashed home-demand line, plus 1-tap toggle to stacked Energy buckets.',
        strengths: ['Expressive visual comparison of sun curve vs home draw', 'Highlights exact peak solar hour directly on canvas'],
        tradeoffs: ['Simplifies battery & grid sub-layers into solar vs load'],
        Component: UsageB
      },
      {
        id: 'C',
        name: 'Intensity Heat-Band + Bars',
        idea: 'Period-wide Export / Solar / Grid heat-strip above the full chart so you immediately see which hours were clean vs grid-heavy.',
        strengths: ['Time-of-day balance pattern visible at a glance', 'Displays prior-year Solar/Used totals when Compare is on'],
        tradeoffs: ['Additional strip above chart'],
        Component: UsageC
      }
    ]
  },
  {
    id: 'solar',
    title: 'Solar',
    job: 'Tracks solar generation against forecast, self-consumption share, and exported surplus.',
    recommended: 'A',
    why: 'Combines an unmistakable SVG Sun Arc daylight progress visual above the full-width SolarForecastBarChart.',
    concepts: [
      {
        id: 'A',
        name: 'Sun Arc Horizon',
        idea: 'Bespoke SVG semicircular sun-path arc showing progress against forecast, glowing solar node, sunrise/sunset labels, and forecast bar chart below.',
        strengths: ['Distinct solar visual identity', 'Maintains full chart width even on 6-col desktop cards'],
        tradeoffs: ['Taller header above the bar chart'],
        Component: SolarA
      },
      {
        id: 'B',
        name: 'Forecast Variance Deck',
        idea: 'Circular forecast-match ring + explicit +/- kWh variance pill on the left beside full hourly bars on the right.',
        strengths: ['Immediately answers if solar beat or missed forecast in kWh'],
        tradeoffs: ['Side-by-side split slightly narrows chart on tablet'],
        Component: SolarB
      },
      {
        id: 'C',
        name: 'Clean Editorial Yield',
        idea: 'Ultra-calm 4-metric KPI strip over SolarForecastBarChart plus a slim Kept-at-home vs Exported bar at the bottom.',
        strengths: ['Maximum breathing room for forecast bars', 'Fast numeric scanning'],
        tradeoffs: ['No circular/arc visual anchor'],
        Component: SolarC
      }
    ]
  },
  {
    id: 'battery',
    title: 'Battery',
    job: 'Shows state of charge over the period plus charged/discharged kWh and cycle estimates.',
    recommended: 'A',
    why: 'The tactile 10-cell battery cutaway gives an instant physical charge reading right above the smooth SoC curve.',
    concepts: [
      {
        id: 'A',
        name: 'Living Cell Cutaway',
        idea: '10-segment tactile cell cutaway filling to current SoC %, paired with smooth AreaChart history and Charged / Discharged / Swing footer.',
        strengths: ['Unmistakable physical battery metaphor', 'Live active-cell pulse when charging or discharging'],
        tradeoffs: ['Throughput shown as KPIs rather than bars'],
        Component: BatteryA
      },
      {
        id: 'B',
        name: 'Charge Cycle Dial + Timeline',
        idea: 'bklit ArcGauge for live SoC + estimated cycles alongside an AreaChart displaying Low and High period charge chips.',
        strengths: ['High/Low charge excursion immediately called out in header'],
        tradeoffs: ['Side panel narrows timeline on medium cards'],
        Component: BatteryB
      },
      {
        id: 'C',
        name: 'Charge vs Discharge Mirror',
        idea: 'Bidirectional bar mirror plotting Discharged energy above zero and Charged energy below zero per time slot, with slim live SoC bar.',
        strengths: ['Reveals exact hours the battery charged vs powered the home'],
        tradeoffs: ['Replaces smooth SoC % curve with charge/discharge bars'],
        Component: BatteryC
      }
    ]
  },
  {
    id: 'flow',
    title: 'Where it went',
    job: 'Traces how energy flowed from sources through the home into monitored devices and untracked loads.',
    recommended: 'B',
    why: 'Both Sankey (A) and Squarified Energy Map (B) give dramatic visual weight to tracked vs untracked loads — B prevents tiny cramped labels on phone.',
    concepts: [
      {
        id: 'A',
        name: 'Calm Sankey',
        idea: 'Interactive bklit SankeyChart linking Solar, Battery, Grid → Home → individual tracked devices + Untracked.',
        strengths: ['Shows exact source-to-consumer paths', 'Interactive link hover highlights'],
        tradeoffs: ['Narrow label columns when stacked with many appliances on 375 px phone'],
        Component: FlowA
      },
      {
        id: 'B',
        name: 'Squarified Energy Treemap',
        idea: 'Proportional mosaic of colored blocks scaled directly to each consumer’s kWh, plus a subtle diagonal-hatched Untracked block.',
        strengths: ['Big energy hogs visibly dominate the map', 'Scales effortlessly down to 375 px phones'],
        tradeoffs: ['Focuses on consumer share rather than upstream supply paths'],
        Component: FlowB
      },
      {
        id: 'C',
        name: 'Three-Lane Flow Ladder',
        idea: 'Structured 3-stage pipeline (1. Sources → Home bus → 2. Consumers) with proportional progress bars in each lane.',
        strengths: ['Guaranteed zero label overlap at any viewport size', 'Clear left-to-right story'],
        tradeoffs: ['More structured list feel than organic Sankey ribbons'],
        Component: FlowC
      }
    ]
  },
  {
    id: 'devices',
    title: 'Devices',
    job: 'Ranks individual monitored appliances by consumption and reveals how much home usage remains untracked.',
    recommended: 'A',
    why: 'Clean color-coded horizontal bars with kWh, estimated cost, share %, and an explicit Untracked baseline remain fastest to scan accurately.',
    concepts: [
      {
        id: 'A',
        name: 'Ranked Bar Leaderboard',
        idea: 'Multi-hue horizontal progress bars per monitored appliance showing kWh, estimated spend, share %, Untracked footer, and Expand button.',
        strengths: ['Instant size comparison and inline cost estimate', 'Expandable list keeps default height concise'],
        tradeoffs: ['Uniform list pattern'],
        Component: DevicesA
      },
      {
        id: 'B',
        name: 'Podium Spotlight + Tail',
        idea: 'Elevates Top 3 appliances into bold podium bento tiles (#1, #2, #3) with remaining tracked & untracked devices cleanly below.',
        strengths: ['Immediately spotlights your top energy hogs', 'Visually breaks up long scrolling pages'],
        tradeoffs: ['3-column grid compresses to stacked tiles on phones'],
        Component: DevicesB
      },
      {
        id: 'C',
        name: 'Consumer Donut + Legend',
        idea: 'Segmented multi-hue SVG donut chart (including Untracked slice) with metered % centered inside paired with a ranked legend.',
        strengths: ['Shows whole-house proportion cleanly', 'Easy to spot whether Untracked dominates'],
        tradeoffs: ['Small appliances collapse into thinner ring slices'],
        Component: DevicesC
      }
    ]
  },
  {
    id: 'costs',
    title: 'Costs & tariffs',
    job: 'Breaks down net energy bill: grid import spend, export credit, standing charge, gas/water costs, and rates.',
    recommended: 'A',
    why: 'The center-zero Tug-of-War scale visualizes how export credits pull down gross bills, alongside Clean Source tiles and avoided savings.',
    concepts: [
      {
        id: 'A',
        name: 'Tug-of-War Balance Scale',
        idea: 'Big Net Balance figure paired with a center-zero visual bar pitting Earned Export Credit left against Billed Spend right + Saved estimate badge.',
        strengths: ['Celebrates export & self-consumption financial wins visually', 'Instant net spend comprehension'],
        tradeoffs: ['Omits per-unit rate math to avoid dense typography'],
        Component: CostsA
      },
      {
        id: 'B',
        name: 'Editorial Utility Statement',
        idea: 'Paperless invoice layout with itemized quantity × rate rows separated by hairlines and a bold monospace Net Balance footer.',
        strengths: ['Zero ambiguity when auditing exact tariff rates and standing charges', 'Classic financial precision'],
        tradeoffs: ['No graphical chart or scale bar'],
        Component: CostsB
      },
      {
        id: 'C',
        name: 'Cost-Over-Time Strip + Rate Cards',
        idea: 'bklit BarChart estimating slot-by-slot electricity spend vs feed-in credit across the period, above Import / Feed-in / Solar Saved tiles.',
        strengths: ['Shows which hours actually drove the bill'],
        tradeoffs: ['Uses blended average import/export tariff for slot estimates'],
        Component: CostsC
      }
    ]
  },
  {
    id: 'utilities',
    title: 'Gas & water',
    job: 'Shows gas and water usage charts when configured in Home Assistant, hiding cleanly otherwise.',
    recommended: 'A',
    why: 'Separate Gas and Water meter cards keep distinct units (m³ vs L) legible side-by-side and support YoY ghost bars cleanly.',
    concepts: [
      {
        id: 'A',
        name: 'Paired Meter Cards',
        idea: 'Dedicated Gas (flame, violet) and Water (droplet, aqua) meter cards with total volume, cost, YoY chip, and comparison BarCharts.',
        strengths: ['Both utilities readable side-by-side on desktop/tablet', 'Preserves discrete bar readings per hour/day'],
        tradeoffs: ['Two cards stack vertically on phone'],
        Component: UtilitiesA
      },
      {
        id: 'B',
        name: 'Unified Dual-Track Canvas',
        idea: 'Single cohesive canvas pairing smooth Gas and Water AreaCharts with combined utility bill in the header.',
        strengths: ['Unified visual rhythm across gas & water', 'Shows combined non-electric utility spend'],
        tradeoffs: ['Smooth area curves look less discrete for daily liter steps'],
        Component: UtilitiesB
      },
      {
        id: 'C',
        name: 'Compact Utility Switcher',
        idea: 'Space-saving SmoothTab toggle switching between Gas and Water with a YoY pace meter bar and comparison BarChart.',
        strengths: ['Halves vertical height on compact screens', 'Prior-year pace progress bar'],
        tradeoffs: ['Requires tap to switch between Gas and Water'],
        Component: UtilitiesC
      }
    ]
  },
  {
    id: 'impact',
    title: 'Lifetime impact',
    job: 'Displays Huawei Fusion Solar lifetime trees planted, CO₂ avoided, and standard coal saved when sensors exist.',
    recommended: 'A',
    why: 'The Visual Forest SVG + MWh milestone bar celebrates long-term clean energy progress with warmth while keeping numbers crisp.',
    concepts: [
      {
        id: 'A',
        name: 'Visual Forest & Carbon Infographic',
        idea: 'Emerald-tinted card with a bespoke SVG pine grove scaled to lifetime trees, Next-MWh milestone progress bar, and Trees / CO₂ / Coal tiles.',
        strengths: ['Unique bespoke infographic gives lifetime totals real meaning', 'Celebrates clean milestones without clutter'],
        tradeoffs: ['Taller than simple text-only tiles'],
        Component: ImpactA
      },
      {
        id: 'B',
        name: 'Calm Eco Stat Trio',
        idea: 'Clean flat surface with emerald leaf badge, lifetime MWh note, and three calm single-row stat pills.',
        strengths: ['Ultra-clean fit inside narrow 4-col desktop grid slot'],
        tradeoffs: ['Minimal visual storytelling'],
        Component: ImpactB
      },
      {
        id: 'C',
        name: 'Slim Milestone Ribbon',
        idea: 'Low-height single banner pairing lifetime MWh header with a tight 3-column monospace Trees · CO₂ · Coal row.',
        strengths: ['Lowest vertical footprint of all concepts'],
        tradeoffs: ['Purely tabular'],
        Component: ImpactC
      }
    ]
  }
];

export const ENERGY_CATALOG: readonly EnergySectionCatalogEntry[] = RAW_CATALOG.map((entry) => ({
  ...entry,
  chosen: CHOSEN_ENERGY_CONCEPTS[entry.id]
}));
