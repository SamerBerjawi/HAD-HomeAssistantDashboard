# Energy page (roadmap 6c)

## 0. Restart (2026-11-26)

The owner restarted Energy from zero in the Design Studio, the same way as Security
([SECURITY.md](SECURITY.md)). Everything below §0 describes the current production page, which
stays live until a new direction is approved and built.

**Frame (owner, 2026-11-26)**
- **Approach:** whole-page directions first, then refine section by section.
- **Lead:** live power first (where power comes from and goes right now), on phone and desktop.
- **Scope:** everything: live power and usage over time; solar and battery; devices and costs;
  gas, water and lifetime impact; plus related Home Assistant integrations (Electricity Maps grid
  carbon, `sun.sun`, solar forecast, electricity prices).
- **Dislikes about the current page:** not that it is busy, but the layout needs optimising; it
  looks generic; it is inconsistent with the rest of HAD Pro.

**Studio:** `/?studio=energy` (`src/pro/pages/energy/studio/EnergyStudio.tsx`). Sample homes in
`studioEnergyHome.ts` (Sunny afternoon, Evening with the car charging, Cloudy winter, Grid only),
simulated hour by hour so every number adds up. The page model is `src/pro/lib/energyHome.ts`
(live flows, the one clear answer `energyVerdict`, cheapest / cleanest hours, battery time left,
ranked devices); tests in `tests/energyHome.test.ts`. Shared blocks in `designs/parts.tsx` reuse
the repo's bklit charts, HeroUI controls and Magic UI `AnimatedBeam`, in Home Assistant's energy
colours. The old studio's concept files under `studio/concepts/` stay only because
`ProEnergy.tsx` imports them.

**Round 1: page direction (decided)**

| | A · Flow | B · Ambient | C · Day timeline |
|---|---|---|---|
| Right now | A live diagram (solar, grid, battery, home) with moving beams; answer and today's totals beside it | A hero lit by the main source, the answer, a "power river" bar, a line of facts (sun, price, carbon, sun still expected) | Four plain live numbers in one row |
| Then | Usage chart with Today · Week · Month · Year | Usage chart with the period and totals | One large chart of today with sun, price and carbon strips on the same time axis |
| The rest | Every section as a card in a grid | Every section in tabs (same on phone and desktop) | Bento grid, plus a History card for week, month, year |
| + | Where power goes is visible at a glance; nothing hidden | One family with Security; shortest page | Best for deciding when to run things |
| − | Longest on phones; a familiar pattern | Sections one tap away | Strips are new to learn |

Owner pick (2026-11-26): **C · Day timeline**. Phones: Live and Today stay on top, the cards go
into tabs after Today (Solar, Battery, Devices, Costs, Gas & water, Impact, History). The Today
card's header now shows the date; the answer moves into Right now.

**Round 2: right now (decided)** (`designs/nowConcepts.tsx`, shown inside C or alone). Each adds the
one clear answer (`energyVerdict`) that round 1's numbers lacked.

| | 1 · Answer + numbers | 2 · Mix ring | 3 · Live tiles |
|---|---|---|---|
| Idea | The answer, then the four numbers split by hairlines, each with what it is doing (making, buying, charging…) | The answer beside a ring around the home's draw split by source, with "Powering the home" and "Going out" lists | The answer, then one small tile per source with a sparkline of today so far |
| + | Closest to round 1; calm, no card | Split and flows in one look, no diagram | Each number has its context; tiles match Rooms |
| − | Totals, not how they connect | A card again; no battery level | Tallest on phones; repeats some of the chart |

Owner pick (2026-11-26): **1 · Answer + numbers**, with a small sparkline of today so far beside
each value (a bare line in the number's colour, smooth `curveMonotoneX`, no fill or dot). It is now
the C page's default Right now (`NowNumbers`); round 1's plain numbers stay as `LiveNumbers` for the
round-1 view.

**Round 3: the Today timeline (decided)** (`designs/todayConcepts.tsx`, inside C or alone). Owner,
2026-11-26: refine Today next. Strips, shading and the Now line sit exactly on the chart's time
axis (28 px / 14 px gutters, hour i at i / 23; `dayAxisFraction`). Price and carbon run green →
amber → red / brown. New helper `cheapestWindow` (the cheapest two hours ahead).

| | A · Chart + lanes | B · Shaded day | C · What's next |
|---|---|---|---|
| Idea | Round 1's sun, price and carbon strips on the chart's hours, a Now line through everything, next facts as icon text | Night shaded on the chart with sunrise / sunset marks; one strip with a Price · Carbon switch | Chart of today so far; beside it "Rest of today" in words (sun, cheapest two hours, cleanest hour, battery) and the remaining hours' prices as cells |
| + | Everything on one time axis | One strip; day and night without a legend | Says what to do next; fastest to read |
| − | Three strips; tallest | Price and carbon not together | Past and future apart |

Owner pick (2026-11-26): **A · Chart + lanes, with B's night shading** (night shaded on the chart,
sunrise and sunset marked on it; the sun, price and carbon strips stay). The next facts under it
(more sun, cheapest, cleanest) use the main text colour, not muted. It is now the C page's default
Today (`TodayLanes`).

**Round 4: the cards (decided)** (`designs/cardsConcepts.tsx`, inside C or alone). Owner, 2026-11-26:
refine the cards under Today next. Tablets and desktop only; phones keep the tabs. The History card
moved into `parts.tsx`; round 1's even grid is `CardsGrid`.

| | A · Bento | B · Two columns | C · Tiles + detail |
|---|---|---|---|
| Idea | 12-column grid with fixed places: Solar, Battery, tall Devices; Costs, Gas & water; History wide with Impact | "Made and stored" (Solar, Battery, Impact) beside "Used and paid" (Devices, Costs, Gas & water), each with a summary line; History across the bottom | One row of headline tiles (solar made, battery, biggest device, cost, gas, impact, this month); a tile opens its full card under the row |
| + | Everything at once, edges line up | Easy to find things; any mix of sections | Shortest page; same idea as the phone tabs |
| − | Gaps when a home lacks sections | Columns end at different heights | One card's detail at a time |

Owner pick (2026-11-26): **A · Bento on tablets and desktop, C · Tiles + detail on phones**. On
phones the tiles replace the tabs from round 1 and scroll sideways (136 px each); the chosen tile's
card opens under the row. Blocks use a container query, so their numbers drop to 17 px when a card
is narrower than 340 px (tablet bento).

**The settled page so far:** Right now (Answer + numbers with sparklines) → Today (Chart + lanes,
night shaded) → cards (Bento; Tiles + detail on phones). Next: edge states (loading, not configured, HA
unreachable), then the live build.

**Round 5: card contents (decided)** (`designs/cardContents.tsx`). Each card's content is described
once (`cardSpec`: a headline number, a plain sentence, two or three numbers, a chart) and three
styles draw it, swapped in through the `BlockSkin` context so the Bento and the phone tiles stay as
decided. History keeps its own form. Grid price and carbon live in the Today timeline, so there is no
Grid card.

| | 1 · Headline | 2 · Chart first | 3 · Sentence |
|---|---|---|---|
| Idea | One big number and label, two or three small numbers, a short chart at the bottom | A tall chart first, the numbers as one quiet row under a hairline | A plain sentence first, a small chart, then the numbers as hairline rows |
| + | Readable across the room; matches the Overview widgets | Most information per card | Most human; matches the answer at the top |
| − | Small charts | Busier; tall on phones | More to read |

Owner pick (2026-11-26): **1 · Headline on tablets and desktop, 2 · Chart first on phones** (inside
the tiles' detail). `DesignC` picks the style by width (`skin` prop: undefined = settled, null =
round 1's plain blocks). In Headline, the Devices list follows the numbers rather than sitting at
the foot of its tall card.

**Round 6: the full page and edge states (approved 2026-11-26, built).** The settled C page with its states
(`src/pro/pages/energy/EnergyStates.tsx`, the same family as Security's): **Loading** (skeletons in
the page's shapes: answer and four numbers, the Today card, Bento cells or phone tiles), **Not set
up** (Energy not configured in HA: what appears once it is, the optional integrations, and a link to
`/config/energy`), and **HA unreachable** (the last known page, dimmed and read-only, under one alert
with Retry). Partly set-up homes are not an edge state: the page leaves out what is missing ("Grid
only"). Approving round 6 means building the live page on Home Assistant data.

**Built on live data (2026-11-26).** `src/pro/pages/ProEnergy.tsx` now renders the approved page
(`src/pro/pages/energy/home/EnergyPage.tsx`; parts in `home/`: `now.tsx`, `today.tsx`, `cards.tsx`,
`cardContents.tsx`, `parts.tsx`) inside the round 6 states. The studio imports the same files back
through one-line shims in `studio/designs/`.
- Data: `src/pro/hooks/useEnergyHome.ts` runs `useEnergyData` for today (refresh every 5 min),
  fetches the last 7 days, this month and this year beside it (every 10 min), and today's grid
  carbon history; `src/pro/lib/energyHomeLive.ts` maps it all into `EnergyHome` (pure, tested in
  `tests/energyHomeLive.test.ts`). It still publishes the Overview energy model to `useEnergyStore`.
- Integrations, each left out when missing: prices from the grid's price entity in the Energy
  dashboard, else a Nordpool / Tibber-style sensor (`raw_today`, `today`, cents scaled); grid carbon
  and fossil share from Electricity Maps / CO2 Signal (past hours only, it keeps no forecast);
  `sun.sun` for sunrise and sunset; Forecast.Solar's hourly forecast through the Energy statistics
  and `*_energy_production_tomorrow` for tomorrow; Huawei's lifetime sensors for Impact.
- Estimates: battery charge per hour is walked back from the charge now with a capacity sensor or
  today's throughput (min 10 kWh); a device's power now comes from a power sensor on the same HA
  device; history bars cost their import at the period's average price.
- Dropped from the old page: the section customise sheet (`preferences.proEnergy` is no longer
  read), date stepping, custom ranges and the year comparison. Its code was deleted on 2026-11-26
  (owner): `studio/concepts/`, `EnergyCustomizeSheet.tsx`, `energyParts.ts`, `studioEnergy.ts`,
  `src/pro/lib/energyPage.ts` and their tests. Huawei's impact parsing moved to
  `energyHomeLive.ts` (`lifetimeImpact`). Sections 2–4 below describe that removed page.


Status: **All 11 redesigned section designs approved by the owner with Desktop & Mobile variants wired into production (2026-11-23)** (`src/pro/pages/ProEnergy.tsx`, `src/pro/lib/energyPage.ts`). Studio kept at `/?studio=energy` (linked from `/overview?studio`).
Working agreement: [DESIGN.md §1](DESIGN.md#1-working-agreement). Page accent: orange (hue 52, dark foreground, `data-page="energy"` in `src/pro/pro.css`).

**Today's power chart in 5-minute steps (owner, 2026-11-27).** Native HA draws today's "Power
sources" graph from the power sensors' 5-minute mean statistics (frontend `getSuggestedPeriod(…,
fine = true)` gives "5minute" for ranges of up to 8 days), while kWh bars stay hourly. Ours now does
the same: `useEnergyData` already fetched today's 5-minute buckets (`powerBuckets`, from the power
sensors where Energy has them); `fiveMinutePower` in `energyHomeLive.ts` turns them into kW
(`EnergyHome.power`, 288 slots, a slot counts as future until its five minutes are over) and
`dayData` feeds them to the chart, hourly until they load. The Now line, night shade and sun use
`dayAxisFraction` over the axis's real span (00:00–23:55); price and carbon stay hourly cells, each
spanning its hour. Solar vs forecast, battery charge and cost charts stay hourly (energy, as in HA).
Not checked against live data here (the demo has no 5-minute statistics).

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
