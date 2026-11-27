# Vehicle tiles: the Mobility page in the Room page's layout

Status: **batch 1 chosen (2026-11-27): Battery & range B · Fill, Charging C · Timeline, Charge limit C · Presets. Batch 2 chosen: Remote start & climate C · Warm-up, Set temperature C · Presets, Extras B · Car plan. Batch 3 chosen: Doors A · Status, Openings A · List, Alarm & find B · Find. Batch 4 (Where & trips) next.** The live Mobility page (`ProMobility.tsx`, the cockpit in
[MOBILITY.md](MOBILITY.md)) is untouched until the owner approves building this one.

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
| 4 · Where & trips (next) | Location; Today; Last trip | Car · Silhouette (location); Reading |
| 5 · Condition | Tyres; 12 V battery & oil; Software; Warnings | Reading · Status |
| 6 · The page | Rail, sections and views, phone | The Room page's B + C |

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

## 6. Next

Batch 4 (Where & trips) is designed the same way, and so on. Building the real
page (rail, sections, Customize and the Now view from the Room page) waits for the owner's go-ahead.
