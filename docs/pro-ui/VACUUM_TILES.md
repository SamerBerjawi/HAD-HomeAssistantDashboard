# Vacuum tiles: the Vacuums page in the Room page's layout

Status: **batch 1 chosen (2026-11-28): Robot status A · Radar, Station B · Cutaway, Care B · Wear. Batch 2 chosen:
Stick A · Upright, Clean station A · Bag, Energy A · Split. Batch 3 chosen: Rooms A · Plan with a floor selector,
History A · Calendar, Lifetime A · Odometer, Settings C · Summary (scrolling). Batch 4 chosen: Rail B · Fleet,
Sections B · All | Now, Phone C · Bottom dock. Built (2026-11-28): the Vacuums tab is the page, on live data.**

Owner, 2026-11-28: build the Vacuums page (Robot vacuums and Stick vacuums) with creative, not generic, designs,
the way the Vehicle tiles were made ([VEHICLE_TILES.md](VEHICLE_TILES.md)). Devices today are a Dreame X60 Pro
Ultra Complete (`dreame_vacuum`) and a Samsung Bespoke AI Jet Ultra stick (SmartThings), but other homes have
other brands, so tiles never name a model.

Studio: dev builds only, `/?studio=vacuums` (Vacuum Tiles Studio, in the studio bar).
Page: `src/pro/pages/ProVacuums.tsx` (loading, no cleaners, HA unreachable) → `pages/vacuums/page/VacuumPage.tsx`,
data from `src/pro/hooks/useVacuumsHome.ts` (adapters; actions go to Home Assistant; demo mode without cleaners
shows the samples).
Code: `src/pro/lib/vacuums/` (`cleaner.ts` model and words, `adapters.ts`, `samples.ts`) and
`src/pro/pages/vacuums/` (`tiles/cleanerTileKit.tsx`, `tiles/robot/`, `tiles/stick/`, `studio/`).
Tests: `tests/vacuumAdapters.test.ts`, `tests/vacuumPageKit.test.ts`.

## 1. How it works

- Same studio as the Vehicle tiles: three concepts per part, every size (X-small, Small, Wide, Large), light and
  dark, phone (165 px) and desktop (208 px) cells. The state picker resets the preview; buttons change the sample
  only, nothing goes to Home Assistant. Picks and notes stay in the browser (`had.pro.vacuumStudio.picks`) and
  "Copy selection" copies them for the chat.
- "Yours · …" states are your live devices, read through the adapters.
- Tiles take the brand-neutral `Cleaner` and emit `CleanerAction`s (start, pause, dock, locate, empty, wash, dry,
  setting, reset).

## 2. Adapters

| Source | Found by | Reads |
|---|---|---|
| Dreame (`dreame_vacuum`) | platform | status, error, battery, charging, station supplies (`*_status` sensors, `low_water_warning`), wear parts (`<part>_left`, `<part>_time_left`, `reset_<part>` buttons), run area and time, lifetime totals, switches as settings, rooms from the vacuum's attributes |
| Any other robot | a device with a `vacuum.*` entity | the vacuum's state, battery and supported features; parts and station when they follow the same keys |
| Stick (Samsung SmartThings) | `stick_cleaner_in_station`, `dust_bag_full` | in station, charging, battery, bag full, empties, last emptied, energy (Wh → kWh), energy saved, `empty_dustbin` switch |

Known limits: Dreame's tank sensors report states, not levels, so tank fills are drawn from the state. Samsung
does not report bag size, so the Bag concept counts empties, not fill.

## 3. Batch 1 · Robot (2026-11-28)

| Part | A | B | C | Recommended |
|---|---|---|---|---|
| Robot status | **Radar**: the robot from above, its laser turret spinning and rings rippling while it works; the battery a ring around it | **Trail**: a serpentine path drawn as far as this run has gone against a typical whole-home run | **Mission**: the run as steps, Clean → Return → Wash → Dry | A |
| Station | **Tanks**: glass columns, one per supply | **Cutaway**: the station drawn from the front; a part that needs you glows amber with what to do beside it; bubbles while washing, warm air while drying | **To-do**: the verdict ("Station ready") or the chores worst first | B |
| Care | **Rings**: a ring per part | **Wear**: bars, soonest first | **Next up**: the next part due, big, with its countdown and "Replaced, reset" | C |

### Batch 1 choices (owner, 2026-11-28)

Robot status **A · Radar** (as recommended), Station **B · Cutaway** (as recommended), Care **B · Wear** (not the
recommended C · Next up: every part with its time).

## 4. Batch 2 · Stick (2026-11-28)

| Part | A | B | C | Recommended |
|---|---|---|---|---|
| Stick | **Upright**: the stick standing in its station, the battery cells lit; lifted out, the station waits with a dashed outline | **Gauge**: the battery as a 270° arc | **Status**: the verdict and plain facts | A |
| Clean station | **Bag**: a dot per empty | **Swirl**: a cyclone that spins while the bin empties; at rest the last empty big | **Ledger**: plain rows | B |
| Energy | **Split**: used vs saved | **Live**: power flowing now | **Numbers**: plain totals | A |

### Batch 2 choices (owner, 2026-11-28)

Stick **A · Upright** (as recommended), Clean station **A · Bag** (not the recommended B · Swirl: the empties as
dots in the bag), Energy **A · Split** (as recommended).

## 5. Batch 3 · Runs & rooms (2026-11-28)

| Part | A | B | C | Recommended |
|---|---|---|---|---|
| Rooms | **Plan**: the rooms as a floor plan of soft blocks; tap to pick, numbered in cleaning order; the room being cleaned glows | **Route**: the robot and the picked rooms as numbered stops on a dotted line, the rooms as chips | **List**: a checklist, Everywhere first | A |
| History | **Calendar**: the last weeks as day squares, teal by area, amber when a run stopped early | **Bars**: a bar per run, the last run's area big | **Log**: rows of day, time, area, minutes | A |
| Lifetime | **Odometer**: the total area in digit wheels | **Homes**: "your home, 76×", a little house per whole-home clean | **Numbers**: area, time, runs, since | B |
| Settings | **Toggles**: a row per setting with a switch | **Pills**: a pill per setting, glowing when on | **Summary**: "3 of 4 on", segments, switches on Large | B |

Clean by room: Dreame through `dreame_vacuum.vacuum_clean_segment` with the map's segment ids, in the order picked.
Rooms come from the vacuum's `rooms` attribute (`{ map: [{ id, name }] }`). Other robots show their rooms read-only
and say so; Home Assistant's `vacuum.clean_area` (2026.3+, areas mapped to segments in the entity settings) is
the way to add them later. "A home" in Homes is the 75th percentile of finished runs, else the lifetime average.

### Batch 3 choices (owner, 2026-11-28)

- Rooms **A · Plan**, with a **floor selector** (owner): a robot with a map per floor (Dreame's `rooms` attribute is
  keyed by map name) shows the rooms of one floor at a time, starting on the robot's own floor
  (`selected_map`). Small and Wide: a floor chip next to Clean, a tap goes to the next floor (Small shows the
  first word, "Ground"). Large: a tab per floor, a teal dot on the robot's. Changing floor clears the picks. The
  integration cleans only the map the robot is on, so another floor's rooms can be looked at but not picked, and
  the tile says "The robot is on the ground floor". One map: no selector.
- History **A · Calendar** (as recommended). Lifetime **A · Odometer** (not the recommended B · Homes).
- Settings **C · Summary**, its switches **scrolling** on Large so every setting is there (owner; Dreame offers many).

## 6. Batch 4 · The page (2026-11-28)

Reviewed live in the studio's **4 · Vacuums page** tab: the chosen tiles in sections, a moment picker (all quiet,
cleaning, station needs you, stuck, parts worn, bag full, two robots and a stick, and "Yours" when Home Assistant
is connected), desktop and phone 375 px, light and dark. Picks stay in `had.pro.vacuumStudio.pagePicks`.

Sections: a robot has Cleaning (status, rooms), Station and parts (station, care), Record (history, lifetime) and
Settings; a stick has Stick (stick, clean station) and Energy. A section with nothing to show is left out.

| Part | A | B | C | Recommended |
|---|---|---|---|---|
| Rail | **Room rail**: the cleaner drawn, name ⌄, facts, how it is, Start / Dock, On this page | **Fleet**: every cleaner as a row, robots then sticks; the open one shows facts and buttons | **Home base**: the cleaners drawn where they live (robot in its station, stick upright), lit in their state colour; tap to open | B |
| Sections and views | **Kind tabs**: Robot vacuums \| Stick vacuums as today, fixed order | **All \| Now**: the Room page's two views | **Moment order**: stuck, a chore, a worn part or a full bag first, then what it is doing; the moved heading says why | C |
| Phone | **Picture header** | **Compact** | **Bottom dock**: how it is and round Start / Pause, Dock, Wash or Empty | C |

Recommended B, C, C: the Mobility picks (Garage, Moment order, Bottom dock), so the two pages read as one.
Code: `studio/pageParts.ts`, `studio/VacuumPageSim.tsx`, `page/vacuumPageKit.tsx` (art, facts, sections,
Now and Moment order rules, meant for the page itself).

### Batch 4 choices (owner, 2026-11-28)

Rail **B · Fleet** (as recommended), Sections and views **B · All | Now** (not the recommended C · Moment order:
the Room page's two views, sections in a fixed order, Now holding only what is on or needs you), Phone
**C · Bottom dock** (as recommended).

## 7. Next

- Built: Fleet rail from 860 px, All | Now (Now lists the tiles running or needing you, then a line per section
  that jumps to it in All), and below 860 px a compact header, sticky section chips and the bottom dock.
- Not checked yet on the owner's Dreame and Samsung live (the dev browser was in demo mode, one Roborock).
- Not used yet: the stick's lamp select, the Dreame map camera.
- Accent hue 200 (`.pro[data-page='vacuums']` in `pro.css`) is the agent's call; the owner may change it.
- `cleanerTileKit.tsx` imports shared pieces from the mobility tile kit; move them to `src/pro/components` when
  the page is built.
