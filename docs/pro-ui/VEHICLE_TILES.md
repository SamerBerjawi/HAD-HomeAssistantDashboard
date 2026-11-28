# Vehicle tiles: the Mobility page in the Room page's layout

Status: **batch 1 chosen (2026-11-27): Battery & range B · Fill, Charging C · Timeline, Charge limit C · Presets. Batch 2 chosen: Remote start & climate C · Warm-up, Set temperature C · Presets, Extras B · Car plan. Batch 3 chosen: Doors A · Status, Openings A · List, Alarm & find B · Find. Batch 4 chosen: Location A · Map, Today A · Day bar, Last trip C · Timeline. Batch 5 chosen: Tyres C · Status (with the earlier car-from-above drawing), 12 V battery & oil C · Meters, Software B · Steps, Warnings C · Quiet. Batch 6 chosen: Rail B · Garage, Sections C · Moment order, Phone C · Bottom dock. Batch 7 chosen: Distance A · Bars, Efficiency B · Weather, Charging history A · Sessions, Allowance B · Projection. Every batch is chosen, and the live page is built (2026-11-27): `ProMobility.tsx` now renders `pages/mobility/page/VehiclePage.tsx`.** The old cockpit ([MOBILITY.md](MOBILITY.md), `home/MobilityPage.tsx`) stays for the old studio's Design B.

Owner, 2026-11-27: build the Mobility page in the same layout, colours and UI as the Room page, which looks far
more professional, designing every element the way the Area tiles were ([AREA_TILES.md](AREA_TILES.md)): creative
concepts per element, the owner chooses.

Studio: dev builds only, `/?studio=vehicles` (Vehicle Tiles Studio, in the studio bar next to Mobility).
Code: `src/pro/pages/mobility/tiles/` (tiles and `vehicleTileKit.tsx`) and `tiles/studio/` (studio, catalog,
states, page preview).

## 1. How it works (as the Area Tiles Studio)

- The page is the Room page's frame: a **rail** (the vehicle's picture where the room photo is, its name with a
  chevron to switch vehicle, facts, a readiness status tile, On this page) and **sections** of tiles, each heading
  with its summary ("Energy · Charging", "Security · All closed"), All | Now at the top.
- Each part of a vehicle becomes a tile, drawn with the Area tiles' kit (`TileFrame`, `TileName`, `TileState`,
  26 px radius, round icon chips, the Room page's hues). One part per tile.
- Three concepts per part, every size (X-small, Small, Wide, Large on the Room grid: 68 px half rows, 12 px gap),
  light and dark, live on the Mobility samples (the controls change the sample). The owner's pick and notes are
  kept in the browser and copied for the chat (`useVehiclePicks`), and drive the page preview.
- Parts that match a Room tile (doors, openings, cabin, extras, readings, location) are drawn with the Room page's
  chosen tiles until their batch (`roomStandIns.ts` maps the vehicle to Room tile models and their actions back),
  so the page preview is whole from the start.
- Tiles take the brand-neutral `Vehicle` and emit `MobilityAction`s, so they work with every adapter.

## 2. Batches

| Batch | Parts | Stand-in until then |
|---|---|---|
| 1 · Energy (chosen) | Battery & range; Charging; Charge limit | — |
| 2 · Cabin (chosen) | Remote start & climate; Set temperature; Extras | — |
| 3 · Security (chosen) | Doors; Openings; Alarm & find | — |
| 4 · Where & trips (chosen) | Location; Today; Last trip | — (odometer: Reading) |
| 5 · Condition (chosen) | Tyres; 12 V battery & oil; Software; Warnings | — |
| 6 · The page (chosen) | Rail, sections and views, phone | — |

## 3. Batch 1 concepts (2026-11-27)

| Part | A | B | C | Recommended |
|---|---|---|---|---|
| Battery & range | **Halo**: the charge as a glowing ring around the battery (the Light tile's halo), the limit a tick on the ring; % big on Wide, range, limit and last session on Large | **Fill**: the tile is the battery, filled with charge from the left, the limit a dashed hairline, a sheen while charging; % and range in big type | **Status**: the verdict first (Plenty, Enough, Low · charge tonight), the Reading tile's way; a band meter with the low zone and the limit | A |
| Charging | **Orb**: the Ambient family (the Room page's fan and switches): the state word big, a glowing orb to start / pause, kW and ready by, a bar to the limit | **Plug**: the cable and the car's socket drawn, apart when unplugged, joined when plugged in, energy flowing while charging; tap the plug | **Timeline**: now to "ready by" as a line, the charge at each end; Start / Pause button | A |
| Charge limit | **Ladder**: the car's steps as rungs filled up to the limit (the Blind tile's Positions) | **Scale**: a ruler, the charge now a dot, the limit a glowing pin, − / + (the Thermostat's Scale) | **Presets**: Daily (90%, else 80%) or Long trip 100%, with why; else Custom | A |

States: charging overnight, charged and plugged in, paused, driving (unplugged), low charge, the second car (no
charge limit, so the limit tile says it is set in the car) and the bike (battery only).

### Batch 1 choices (owner, 2026-11-27)

**Battery & range B · Fill**, **Charging C · Timeline**, **Charge limit C · Presets** (over the recommendations, A for each). No changes
requested. The catalog marks them `chosen`; the page preview's Energy section draws them.

## 4. Batch 2 concepts (2026-11-27)

| Part | A | B | C | Recommended |
|---|---|---|---|---|
| Remote start & climate | **Orb**: the Ambient family, as Charging A: the state word big (Warming up, Comfortable, Off), a glowing orb with the engine to start / stop, warm or cool glow | **Countdown**: the 15 minutes of a remote start as a ring running down, the minutes in the middle (the cabin when off); Start / Stop | **Warm-up**: the cabin now to the set temperature as a line, outside a faint tick, glowing cool to warm while it runs; Start / Stop (Charging's Timeline for the cabin) | C |
| Set temperature | **Stepper**: the number big, − / + in glass buttons | **Dial**: the Thermostat's ring 16–28°, the set point a glowing arc, the cabin a dot; − / + | **Presets**: Cool 19°, Comfort 21°, Warm 23° with why; else Custom (− / + on Large) (the Charge limit's Presets for the cabin) | C |
| Extras | **Chips**: a chip per extra, lit warm when on (icons alone on X-small and Small) | **Car plan**: the car from above, the windscreen and rear glass glowing when heated, the wheel and seats as buttons where they sit | **Rows**: icon, name, On / Off per row; X-small is the count and All on / off | B |

C and C follow the batch 1 picks (Timeline, Presets) so Energy and Cabin read as pairs. Temperatures step in halves,
16–28° (FordPass's range). FordPass reports the cabin (`sensor.*_cabintemperature`, read since 2026-11-27); cars without one show the set point only.
The page preview's Cabin section draws the picks (else the recommendations); the cabin stand-ins are gone.

### Batch 2 choices (owner, 2026-11-27)

**Remote start & climate C · Warm-up**, **Set temperature C · Presets**, **Extras B · Car plan** (the recommendations).
No changes requested. The catalog marks them `chosen`; the page preview's Cabin section draws them.

## 5. Batch 3 concepts (2026-11-27)

| Part | A | B | C | Recommended |
|---|---|---|---|---|
| Doors | **Status**: the Room page's Lock · Status for the car: Locked green / Unlocked amber, one button (Lock; Unlock press then hold) | **Shield**: the whole verdict (Secure, Unlocked, Rear left window open) with its three checks; the same button | **Car**: the car's side in fine line, a padlock badge on the door in green or amber; the button under it | A |
| Openings | **List**: All closed with a check, or the open ones named in amber | **Car plan**: the car from above (as Extras), an open door swung out amber, an open window an amber bar, boot / bonnet glowing | **Checklist**: Doors, Windows, Boot, Bonnet, each a check or what is open | B |
| Alarm & find | **Status**: Alarm set / off / Going off with a shield; Honk & flash | **Find**: one big round Honk & flash button, rings ripple out after a press; the alarm small | **Quiet**: a small "Alarm set" and Honk & flash; the whole tile red when the alarm goes off or the bike is stolen / crashed | C |

Unlock always takes two steps (press, then hold), the Room page's rule (owner, 2026-11-21), via its
`GuardedLockButton`. New studio states: Alarm going off, Bike stolen. The security stand-ins are gone; Where and
Condition still use Room tiles.

FordPass (owner's entity list, 2026-11-27): the adapter now reads the cabin temperature (`cabintemperature`) and the
rear seat heaters (`rccseatrearleft`, `rccseatrearright`). Not used yet: Extend remote start
(`button.*_extendremotestart`), the 5 s honk (`haflong`), seat belts, parking brake, indicators.

### Batch 3 choices (owner, 2026-11-27)

**Doors A · Status**, **Openings A · List** (over the recommended Car plan), **Alarm & find B · Find** (over the
recommended Quiet). No changes requested. The catalog marks them `chosen`; the page preview's Security section draws them.

## 6. Batch 4 concepts (2026-11-27)

| Part | A | B | C | Recommended |
|---|---|---|---|---|
| Location | **Map**: the map fills the tile, a frosted label along the bottom (Home, or Driving · 54 km/h) | **Place**: words only, the zone or street big; driving, the speed big in blue with the gear | **Split**: a square map beside the words | A |
| Today | **Day bar**: midnight to midnight, each drive a block where it happened; distance big (≈ summed from drives when the car gives none) | **Numbers**: distance, drives, time driving | **Trace**: today's speed as a soft area | A |
| Last trip | **Numbers**: distance big, time and energy beside it | **Efficiency**: kWh / 100 km as Frugal / Typical / Thirsty on a band | **Timeline**: start to end as a line, the distance on it (your Charging and Warm-up line) | C |

Today reads the drives from the speed history, so FordPass gets it (its distance today is summed, marked ≈).

### Batch 4 choices (owner, 2026-11-27)

**Location A · Map**, **Today A · Day bar**, **Last trip C · Timeline** (the recommendations). No changes requested.
The catalog marks them `chosen`; the page preview's Where section draws them.

## 6b. Batch 5 concepts (2026-11-27)

| Part | A | B | C | Recommended |
|---|---|---|---|---|
| Tyres | **Car plan**: the car from above, each pressure at its wheel, the low one amber | **Grid**: four numbers in the car's order | **Status**: the verdict first (All good, Front left low), the lowest pressure big | C |
| 12 V battery & oil | **Readings**: a row per reading with a verdict dot | **Verdict**: one word (All good, 12 V battery low) and what to do | **Meters**: a slim bar per reading | B |
| Software | **Status**: the stage as a word (Up to date, Installs Fri 02:00, Waiting: 12 V battery low) | **Steps**: Ready → Download → Waiting → Install | **Timeline**: last update to the next install window as a line | C |
| Warnings | **List**: each warning an amber row | **Count**: the number big, the first named | **Quiet**: a small "No warnings"; the tile amber when there are any | C |

FordPass's dashboard warning lights (`sensor.*_indicators`) are now read into Warnings with its messages
(`fordIndicators`, tested). shortcut: matched loosely on the attribute names and true / "on" values, not yet seen on the
owner's car. New studio state: Warning lights on. Every section of the page preview now uses designed tiles; only the
odometer is still a Room tile (a Reading).

### Batch 5 choices (owner, 2026-11-27)

**Tyres C · Status**, redrawn as asked: the verdict first, then the earlier Condition card's car from above
(`CarTop`) with each pressure and its wheel's name beside it, a low wheel amber (Small: numbers only; Wide: the
verdict in the heading). **12 V battery & oil C · Meters** (over the recommended Verdict), **Software B · Steps** (over
the recommended Timeline), **Warnings C · Quiet**. The catalog marks them `chosen`; the page preview's Condition
section draws them.

## 6c. Batch 6 · the page (2026-11-27)

Reviewed live in the studio's **Mobility page** tab: a picker per part above the preview, kept in the browser
(`had.pro.vehicleStudio.pagePicks`), **Copy selection** for the chat. Code: `studio/pageParts.ts` (the concepts) and
`studio/VehiclePageSim.tsx` (the variants).

| Part | A | B | C | Recommended |
|---|---|---|---|---|
| Rail | **Room rail**: the Room page's (picture, name ⌄, facts, Ready to go?, On this page with summaries) | **Garage**: every vehicle as a row (picture, name, how it is); the open one shows its picture, facts and Ready to go? | **Showroom**: the car big with its name over it, three big figures (charge, range, locked), Ready to go? in a line, section chips | A |
| Sections and views | **All**: five sections in a fixed order, headings with summaries | **All \| Now**: the Room page's two views; Now = one sentence, only the tiles that are on or need a look, everything else folded to a line per section | **Moment order**: one view; sections that need a look first, then what the car is doing (driving → Where, charging → Energy, remote start → Cabin), each moved heading says why | B |
| Phone | **Picture header**: the Room page's phone header, sticky section chips | **Compact**: a small picture, name ⌄ and Ready to go? in one row; tiles sooner | **Bottom dock**: Compact plus a bar fixed to the bottom with how it is and lock (press, then hold to unlock), remote start, charge | A |

Now shows: charging or paused, climate running, unlocked, anything open, the alarm, driving, a low tyre, a 12 V / oil /
battery health reading off, an update under way, warnings, and the battery under 20%. The phone preview scrolls inside a
375 × 760 screen so the sticky chips and the dock behave as on a phone.

### Batch 6 choices (owner, 2026-11-27)

**Rail B · Garage**, **Sections and views C · Moment order**, **Phone C · Bottom dock** (over the recommended Room rail,
All | Now and Picture header). No changes requested. `pageParts.ts` marks them `chosen`; the page preview opens on them
(the pickers still switch, to compare).

So the Mobility page differs from the Room page in its frame: every vehicle listed in the rail, one view ordered by the
moment (no All | Now switch), and on phones the compact header with lock, remote start and charge docked at the bottom.

## 6d. Batch 7 · Statistics (2026-11-27)

Owner: a Statistics section, "odometer per month and evolution over time, and other stuff". A vehicle's months
(`Vehicle.history`, `VehicleHistory` in `lib/mobilityHome.ts`; maths in `lib/mobility/vehicleStats.ts`, tested in
`tests/vehicleStats.test.ts`). In the studio it is sample data: two seasonal years for the Ford and the bike, none
for the second car (so its tiles show greyed). Where the real data will come from (not built):
- **Distance**: the odometer's Home Assistant long-term statistics (needs `state_class: total_increasing`;
  check it on `sensor.fordpass_…_odometer`), so the past fills in at once.
- **Efficiency, Charging history**: a daily server snapshot into the SQLite the energy sync already uses (energy
  per trip, charging sessions): starts on the day it is turned on.
- **Allowance**: set by the owner (per year, years, start, odometer then) in the page's Customize.
- **Cost**: the Energy page's tariff.

Parts (code `tiles/stats/`, catalog `tiles/studio/statsCatalog.ts`):
- **Distance** (every vehicle): A · Bars (recommended: twelve months, this month lit, a faint cap for where it is
  heading), B · Compare ("About the same" / "+12% more" against last month and last year), C · Year (running
  total over last year's, dashed).
- **Efficiency** (plug-in cars): A · Trend (kWh/100 line, average dashed), B · Weather (recommended: bars in the
  colour of the month's outside temperature; "Winter uses 35% more"), C · Cost (at the home tariff; greyed until a
  tariff is set).
- **Charging history** (plug-in cars): A · Sessions (recommended: kWh by month, home and away stacked), B · Habit
  ("29 → 90%" as a band), C · Care (a battery-care verdict from the last three months).
- **Allowance** (cars): A · Pace (recommended: the contract as a bar with today's mark), B · Projection (where it
  ends at this pace), C · Budget (km a day left).

The page preview adds a Statistics section after Condition. Not designed yet: the section's Month | Year | All
switch, a weekday × hour heat map, the 12 V and battery-health trends, records, the bike's CO₂.

### Batch 7 choices (owner, 2026-11-27)

Distance A · Bars, Efficiency B · Weather, Charging history A · Sessions, Allowance B · Projection.

## 7. Parts a car does not report: greyed, never hidden (owner, 2026-11-27)

Every part a vehicle's kind has is on its page; a part its model reports nothing for draws itself greyed with "Not
available on this car" (`partApplies` in `vehicleTileKit.tsx`: climate, extras, doors, openings are car parts;
charging and the limit are plug-in car parts; the rest every vehicle). Within a tile, an extra whose entity exists but
is unavailable (a rear seat heater this trim lacks) stays, greyed and not tappable (`extras[].available: false`, set by
the FordPass adapter, tested).

## 8. FordPass entities: what else we could add (owner's list of 82, 2026-11-27)

Read now: everything the tiles show, plus (new today) `cabintemperature`, `rccseatrearleft`, `rccseatrearright`, `indicators`.
Not read yet, by worth:

| Entity | What it would give | Where |
|---|---|---|
| `button.*_extendremotestart` | "+ Extend" while remote start runs | Cabin · Remote start (new action) |
| `switch.*_departuretimes`, `sensor.*_departureschedules` | Scheduled departure: charge and warm by a time | Energy · Charging ("ready by"), Cabin |
| `select.*_elvehtargetchargealt1/2` | Charge limits at other charge locations | Charge limit (Large) |
| `sensor.*_deviceconnectivity`, `sensor.*_lastrefresh` | Online / last update, for the "seen" line | Rail |
| `sensor.*_seatbelt`, `sensor.*_parkingbrakestatus` | Belts fastened, parking brake on | Security / Condition |
| `sensor.*_coolanttemp` | Coolant temperature (petrol and hybrid) | Condition |
| `sensor.*_elvehrecuppower` | Regenerating power while driving | Location while driving |
| `sensor.*_firmwareupdatehistory` | Past updates | Condition · Software |
| `button.*_haflong` | 5 s honk & flash | Alarm & find (hold for longer) |
| `sensor.*_gps`, `_events`, `_metrics`, `_states`, `_vehicles` | Raw JSON the others are read from | — |
| yaw rate, acceleration, pedals, torques, brake, engine speed | Live driving telemetry | — (not for a dashboard) |
| `button.*_msgdeletelast`, `_msgdeleteall`, `_update_data`, `doorunlock`, `evcancel` | Housekeeping or alternatives to what is used | — |

## 9. Next

The live page is built: `page/VehiclePage.tsx` draws each part's chosen concept on the Room grid
(`GRID`/`SPAN` from `areas/page/RoomGrid`), with the Garage rail from 860 px wide, Moment order with a
"First: …" badge, and on narrower screens a compact header (tap the name to switch vehicle), sticky section chips
and the bottom dock (readiness, lock, remote start, charge) above the tab bar. Shared pieces live in
`page/vehiclePageKit.tsx`, also used by the studio's page preview. Statistics read HA's monthly long-term statistics
of each vehicle's odometer (`useMobilityHome`, hourly, 24 months; the sensor needs a `state_class`).

Still to do: the Room page's Customize (it sets the lease allowance, so Allowance shows greyed until then); the
server's daily snapshot for efficiency and charging sessions (those tiles say "Not recorded yet" on live data); the
Statistics section's Month | Year | All switch; the old cockpit's picture chooser.
