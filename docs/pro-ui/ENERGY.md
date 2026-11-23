# Energy page (roadmap 6c)

Status: **All 11 redesigned section designs approved by the owner with Desktop & Mobile variants wired into production (2026-11-23)** (`src/pro/pages/ProEnergy.tsx`, `src/pro/lib/energyPage.ts`). Studio kept at `/?studio=energy` (linked from `/overview?studio`).
Working agreement: [DESIGN.md §1](DESIGN.md#1-working-agreement). Page accent: orange (hue 52, dark foreground, `data-page="energy"` in `src/pro/pro.css`).

## 1. Brief

**Job of the page.** Show what the home uses, produces, stores, exports, and pays for across any period — with live power always visible at the top, full year-over-year comparisons, per-device attribution, and clean handling when parts of Energy aren't configured in Home Assistant.

**Decided structure (owner, 2026-11-23)**
- **Desktop and tablet (≥ 768 px):** One scrolling page in a responsive grid (2 columns on tablet, 12 columns on desktop).
- **Phone (< 768 px):** **Live now** and **Period bar** stay at the top, followed by Kokonut `SmoothTab` tabs for the remaining visible sections so nothing requires endless scrolling.
- **Live now placement:** Always **above** the Period bar (always live, independent of the chosen period).
- **Customise:** Included from day one — users can hide or reorder sections via `ProSheet` (`preferences.proEnergy`).
- **Sections kept (all 11; each hides cleanly when Home Assistant has no data for it):**
  1. **Live now** — real-time home draw, solar, grid import/export, and battery charge/mode.
  2. **Period bar** — Day · Week · Month · Year · Custom, ‹ date › stepper, Compare with last year toggle + year picker, Customise, Refresh.
  3. **Summary** — Used, Solar, Grid in/out, Net cost, Self-sufficiency %, Solar self-use %, with YoY deltas when Compare is active.
  4. **Usage over time** — Power curve (`PowerSourcesAreaChart` default on Day) + Energy (`BidirectionalBarChart`) toggle across sources and export.
  5. **Solar** — produced vs solar forecast.
  6. **Battery** *(new; classic has no dedicated battery section)* — charge level (SoC %) over time, charged vs discharged kWh, min/max/cycles.
  7. **Where it went** — flow from sources → home → devices + untracked.
  8. **Devices** — ranked tracked consumers + untracked share.
  9. **Costs** — net cost, import spend, export credit, standing charge, hourly cost timeline, per-source tariff table.
  10. **Gas & water** — usage charts and costs when configured in HA.
  11. **Lifetime impact** — Huawei Fusion Solar lifetime trees planted, CO₂ avoided, and standard coal saved when the sensors exist.
- **Edge states:** Default not configured in HA, initial loading skeleton, statistics error with retry, and partial configurations (e.g. grid-only without solar, battery, or Huawei sensors).

**Data & charts.**
- Live & historical data: `useEnergyData`, `useEnergyComparison`, `src/services/energy/*`, `/api/statistics/*` (cached SQLite statistics), `buildOverviewEnergyModel` (`src/pro/lib/overviewEnergy.ts`), plus Huawei lifetime impact sensors (`sensor.energy_information_lifetime_*`) and battery SoC history.
- Charts & KPIs: `@bklit` UI components adapted into `src/pro/ui/bklit/` (`AreaChart`, `BarChart`, `BidirectionalBarChart`, `GaugeChart` / `ArcGauge` + `GridBalanceBar`, `PowerSourcesAreaChart`, `SankeyChart`, `SolarForecastBarChart`) — verified MIT open source; zero new dependencies needed.
- Diagrams: Magic UI `AnimatedBeam` (`src/pro/ui/magicui/AnimatedBeam.tsx`, MIT), Kokonut UI `SmoothTab`, HeroUI v3 core controls, Hugeicons icons.

## 2. Energy Studio (2026-11-23)

Dev only: `/?studio=energy` (`src/pro/pages/energy/studio/EnergyStudio.tsx`), reachable from the Design Studio Hub (`/overview?studio`) and the shared top `StudioNavBar`. Compares three structurally distinct concepts per section (`src/pro/pages/energy/studio/concepts/`, one file per section) on the same representative home (`studioEnergy.ts`), at 375, 768, 1024, 1440, and 1920 px widths, in Light, Dark, or Both themes local to the studio.

Sample home states:
- **Sunny afternoon** — solar surplus, battery charging, exporting to grid, devices, gas, water, Huawei impact.
- **Evening on battery** — sunset, battery discharging to cover home load, net import near zero.
- **Cloudy winter** — low solar yield vs forecast, battery depleted, grid importing.
- **Grid only** — no solar, no battery, no Huawei impact; tests graceful hiding of absent sections.
- **Edge states** — not configured in HA, loading skeleton, error state.

Controls are live on sample data only (period switching, date stepping, Compare with last year, Day power/energy toggle, phone section tabs, Customise hide/reorder sheet) and never call Home Assistant. Per-section picks and notes are stored in `localStorage` (`had.pro.energyStudio.pick`).

## 3. Section concepts & responsive picks (owner picks, 2026-11-23)

Each section switches automatically in `ProEnergy.tsx` (`CHOSEN_ENERGY_CONCEPTS` in `src/pro/lib/energyPage.ts`) between **Desktop / Tablet (`≥ 768 px`, `compact = false`)** and **Mobile (`< 768 px`, `compact = true`)**:

| # | Section | Concept A | Concept B | Concept C | Desktop | Mobile |
|---|---|---|---|---|---|---|
| 1 | **Live now** | Concentric Power Orbit: dual-arc SVG ring + source rows | Live Busbar Schematic: `AnimatedBeam` live nodes + `BatteryStat` | Living Horizon Strip: proportional power river bar + compact mix grid | **B** | **C** |
| 2 | **Period bar** | Capsule Dock: `SmoothTab` periods + floating date capsule | Editorial Timeline Header: bold date masthead, steppers & YoY `Switch` | Compact Instrument Rail: `1D/1W/1M/1Y` + monospace date stepper | **B** | **C** |
| 3 | **Summary** | Asymmetric Bento Hero: Self-Sufficiency Halo Ring + 2×2 grid | Dual Dial Dashboard: two `ArcGauge`s + `GridBalanceBar` + 4-metric footer | Story Sentence & Source Ribbon: plain-English takeaway + proportional mix ribbon | **B** | **C** |
| 4 | **Usage over time** | Power Wave & Mix: `PowerSourcesAreaChart` default + `SmoothTab` to bars | Daylight Skyscape: SVG solar horizon dome + dashed home line + peak pill | Intensity Heat-Band + Bars: Export/Solar/Grid balance strip above chart | **A** | **A** |
| 5 | **Solar** | Sun Arc Horizon: SVG semicircular daylight arc + forecast bars | Forecast Variance Deck: yield ring + `+/- kWh` variance pill beside bars | Clean Editorial Yield: 4-KPI header + bars + self-use/export split bar | **B** | **A** |
| 6 | **Battery** | Living Cell Cutaway: 10-cell battery level visual + SoC `AreaChart` | Charge Cycle Dial + Timeline: `ArcGauge` + Low/High chips + `AreaChart` | Charge vs Discharge Mirror: `BidirectionalBarChart` mirror + live SoC bar | **B** | **B** |
| 7 | **Where it went** | Calm Sankey: interactive `SankeyChart` sources → home → devices | Squarified Energy Treemap: area-proportional blocks + hatched Untracked | Three-Lane Flow Ladder: 3-column Supply → Home bus → Consumers bars | **A** | **C** |
| 8 | **Devices** | Ranked Bar Leaderboard: multi-hue bars + cost estimate + Expand toggle | Podium Spotlight + Tail: top-3 `#1/#2/#3` bento tiles + `#4+` compact list | Consumer Donut + Legend: segmented SVG donut + ranked consumer list | **A** | **B** |
| 9 | **Costs** | Tug-of-War Balance Scale: center-zero Earned vs Billed bar + savings chip | Editorial Utility Statement: itemized `Qty × Rate` invoice + Net footer | Cost-Over-Time Strip + Rate Cards: slot spend `BarChart` + rate tiles | **C** | **A** |
| 10 | **Gas & water** | Paired Meter Cards: dedicated Gas & Water cards with YoY `BarChart`s | Unified Dual-Track Canvas: synchronized Gas & Water smooth `AreaChart`s | Compact Utility Switcher: single card with `SmoothTab` + YoY pace bar | **A** | **C** |
| 11 | **Lifetime impact** | Visual Forest & Carbon Infographic: SVG pine grove + MWh milestone bar | Calm Eco Stat Trio: clean `.pro-surface` card with emerald trio rows | Slim Milestone Ribbon: compact MWh header + 3 monospace counters | **B** | **B** |

Edge states (Unconfigured, Initial loading skeleton, Statistics error): **Default**.

## 4. Production architecture (2026-11-23)

- **Page component:** `src/pro/pages/ProEnergy.tsx`, rendered for `activeTab === 'energy'` in `src/pro/ProApp.tsx`. Connects `useEnergyData()`, `useEnergyComparison()`, `useUserConfig()`, and `useAutoLayoutStore`, publishes updates to `useEnergyStore` so Overview energy widgets remain synced, and selects Desktop vs Mobile concepts via `CHOSEN_ENERGY_CONCEPTS`.
- **Pure live transformer & preferences:** `src/pro/lib/energyPage.ts`:
  - `buildLiveEnergySnapshot` adapts HA energy totals, buckets, 5-minute power buckets, financials, tracked devices, YoY comparison totals, battery SoC curve (anchored to live `batterySoC` and integrated across bucket charge/discharge), and Huawei lifetime impact sensors (`sensor.energy_information_lifetime_*`) into `StudioEnergySnapshot`.
  - `readEnergyPrefs` / `writeEnergyPrefs` read and persist `preferences.proEnergy` (`{ order, hidden }`) across screens; `computeCustomPresetDates` resolves quick custom date presets (`Last 7D`, `Last 14D`, `Last 30D`, `This month`, `Last month`).
- **Tests:** `tests/energyPage.test.ts` and `tests/studioEnergy.test.ts`.
