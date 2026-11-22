# Rooms page (roadmap 6b)

Status: **B · Gallery picked by the owner (2026-11-20) and built as the page** (`src/pro/pages/ProRooms.tsx`,
`pages/rooms/RoomsGallery.tsx`). Concepts A and C and the dev bar are removed. Room pages next.
Working agreement: [DESIGN.md §1](DESIGN.md#1-working-agreement). Page accent: teal (hue 192).
Order (owner): the general Rooms page first, then the individual room pages.

## 1. Brief

**Job of the page.** Every room at a glance, grouped by floor: which rooms are lit, warm or cold,
occupied, playing something or left open, with the one action people want most (lights) right
there, and a way into each room. The Overview's Rooms widget shows a few favourites; this page
shows them all.

**On the page**
- The header sentence (already built: rooms lit, motion) stays as it is.
- A short home summary: rooms with something going on, lights on, temperature range, power.
- Every room, by floor (highest first; rooms without a floor last as "Other areas").
- Per room: name and icon, temperature (and humidity when there is room), what is going on
  (lights, media, motion, open doors or windows, heating or cooling, cleaning, low batteries),
  the lights on/off action, and a way in.
- Favourites (`rooms.favoriteAreas`, shared with the Overview widget) stay visible.

**Not on this page (goes to the room page, next)**
- Every device in the room and its controls, scenes, history, the room's cameras.

**Data.** HA areas and floors as the app already resolves them (`resolvedAreas`, `floors`, each
area's summary). Pure model: `src/pro/lib/roomsPage.ts`. Hidden rooms (`rooms.hiddenAreas`) are
left out, as on the Overview.

**States designed for**: the demo home (7 rooms, 3 floors), a few rooms
with no floors, a large home (4 floors, 20 rooms), everything quiet (nobody home, all off).

**Navigation.** A room opens its room page (`openArea` from the Overview lands here too). Until
the room pages are built, opening a room shows a placeholder with Back.

## 2. Concepts (history; B was picked)

| | A · Refined & minimal | B · Expressive & immersive | C · Innovative |
|---|---|---|---|
| Idea | **Directory**: a calm summary row, floor filter, rooms as quiet rows by floor with the state in words and a lights switch | **Gallery**: each room a picture card (its HA picture, or a colour by room type) that glows warm when lit; "Happening now" strip on top | **House section**: the home drawn as a building cut open, floors stacked top to bottom, each room a cell coloured by what is going on; tap a room for its panel |
| Strengths | Fastest to scan, dense, works at 20+ rooms | Most personal and beautiful, room pictures | Spatial: see the whole house at once, where things happen |
| Trade-offs | Least visual | Fewer rooms per screen | New idea, needs a legend; cells get small with many rooms |

## 3. The page (Ambient explorer, owner 2026-11-22)

**Tiles in production: Design D · Soft blend** (owner approved 2026-11-22; `RoomTileBlend.tsx`,
row heights `blendMetrics`): B's soft surface, title label and glowing toggles, A's information,
C's tinted room icon, a lights toggle on every size; devices use the flow-connection icon.
Options (Customize, 2026-11-22): **Area pictures** (`showPictures`, off by default) puts the
area's HA picture behind the tile under a dark scrim (light text, the room's light still glows
over it); **Sizes: All standard** (`cardSize: 'standard'`) is an even grid of standard tiles,
columns ≥ 288 px (`EVEN_TILE_MIN`, ~300×200 on desktop), the same width on every row. The
tile notes below describe Design A, whose layout rules (sizes, packing, ambient light, actions)
D shares; A, B and C stay in the studio (§5).

Replaces the Gallery (kept below as history). Direction: the owner's reference screenshot, a mix
of concept 1 "Adaptive ambient" (soft gradients, curved accents, purpose-built tiles) and concept 3
"Compact explorer" (floor groups, dense mixed-size layout). No room pictures. Room pages unchanged.
Code: `pages/rooms/RoomsExplorer.tsx` (page body), `RoomTile.tsx`, `RoomQuickActions.tsx`,
`lib/roomTiles.ts` (pure: sizes, tone, packing), tile CSS `.pro-rt*` in `pro.css`.

- **Status bar**: "7 rooms · 22 devices", then chips: lights on / all lights (tap: only lit rooms),
  temperature range, power **in rooms** (the sum of the rooms' power sensors, labelled as such: not a
  whole-home figure), people home (HA `person` entities; hidden when there are none), open doors and
  windows (warning colour; tap: only those rooms). Switch: "Home status".
- **Filter**: All, Favourites (when any), one per HA floor (when more than one), plus the status
  filter while on. Remembered per browser (`had.pro.rooms.filter`). Swipe sideways on touch.
- **Floors**: HA floors in the user's order, else highest first; rooms without a floor last as
  "Other areas". Heading: chevron + name (collapses smoothly, remembered per browser in
  `had.pro.rooms.collapsed`; collapsed content is `inert`), room and device counts, average
  temperature, and "Lights off" for the floor when any are on.
- **Tile sizes** (never from the room's name; refined 2026-11-22): `autoTileSize` counts the
  controls that matter (lights, media, fans, covers; a thermostat alone does not grow a room).
  **Compact** when there are none or a single light only; **expanded** for media with lights, three
  or more kinds, or a favourite with two; else **standard**. Per room override in Customize (tap
  the room's icon: Auto, Compact, Standard, Large; `preferences.proRooms.sizes`). "All compact"
  keeps the old Compact card size.
  - Compact: a short horizontal card: icon, name, reading or state word with device count, status
    dot (green: someone there; orange: open). No controls.
  - Standard / expanded: identity row (icon tile + name), big reading, a facts line (status word,
    climate action, what is playing, humidity, power, open covers, air: more on large tiles), then
    lights and devices; actions in a column on the right (2 / 3). Narrow tiles (< 15rem, container
    query) put two actions in the top row, the name under it, and drop the facts line.
- **Layout**: columns from the real width (`tileColumns`: ≥195 px each, 2–6; phones 2, tablets 3,
  laptops 5). Tiles pack into bands (`packTileBands`): compact tiles pair up in one column, an
  expanded tile spans 2, a tile that fits goes before a wide one that doesn't, and a wide tile
  narrows into space left when nothing else fits. Each band is one CSS grid row with explicit
  column weights (`bandLayout`): a last row of two or more tiles fills the width; a lone last tile
  takes at most half the row. Heights (`bandMetrics`): 184/200 px rows (180/196 tablet, 176/192
  phone), compact 86 px. A compact tile with no partner in a row of bigger tiles takes the standard
  composition. Phones: compact tiles are 68 px full-width rows.
- **Ambient light** (`roomAmbient`, palette `AMBIENT`: amber, teal, violet, blue, rose, neutral):
  lights give the main glow (amber, or the lights' own colour), media violet (under the lights'
  glow when both), fans teal. Heating and cooling never take over a tile: a calm tile with a soft
  rose or blue glow from the bottom left. Idle rooms are neutral with a faint hint of the nearest
  palette tone to their colour. CSS (`.pro-rt::before`): a main radial glow top right, a second
  one bottom left, a faint luminous highlight and a 135° base gradient; one thin masked curve (no
  fill, none on compact tiles). Light theme: pale surfaces with the same light, darker ink.
- **Quick actions** (only when the room has the entities; order lights, climate, media, fan, cover,
  scenes; each can be switched off in Customize): lights on/off for all the room's lights, climate
  −/+ popover, media play/pause, fans on/off, covers open/close all, scenes menu. 40 px quiet
  round buttons; while on they are tinted (20 % fill, coloured icon and edge) in the action's
  colour, never filled or glowing. Labels say the
  scope ("turn off both lights"); spinner while HA answers; optimistic state; errors toast. The rest
  of the tile opens the room page.
- **Customize** adds: big number (temperature or humidity), quick-action switches, per-room size.
  Saving keeps option keys this version no longer uses (Happening now, Night look), so nothing saved
  is dropped.

## 5. Rooms Studio (2026-11-22)

Dev only: `/?studio=rooms` (`pages/rooms/studio/RoomsStudio.tsx`). Three designs on the same
sample home (`studioRooms.ts`: 12 rooms on 3 floors, states Evening busy, All quiet, Heating
morning, Coloured lights), light, dark or both, at page widths for 375, 768, 1024, 1440 and 1920 px
screens. Each design shows its tile sizes and the floor-grouped page. Quick actions are live on the
sample only (`RoomServiceContext` swaps HA's service for `applyStudioService`); nothing reaches
Home Assistant. "Approve" records the pick in this browser (`had.pro.roomsStudio.pick`) with
notes and "Copy for the chat"; production keeps Design A until the change is applied.

| | A · Refined adaptive ambient (production) | B · Soft atmospheric (studio only) | C · Precision ambient (studio only) |
|---|---|---|---|
| Light | Layered radial glows, highlight, one thin curve | Two large diffused glows and a haze; no border, no curve | Fine light line along the top edge, faint corner wash |
| Composition | Icon tile + name, big reading, facts, summary; actions column | Quiet name label top, large light-weight reading bottom, one sentence; actions row top right | Header with state code, medium reading, labelled data row; square actions bottom right |
| Compact | Short card: icon tile, name, reading · devices, dot | Rounded strip with a glowing light dot and the reading on the right | One dense line: icon, name, reading, state code |
| Floors | Chevron, name, counts, Lights off | Light large name, "3 lights on", "Dim the floor" | Uppercase label on a hairline rule, counts, square Lights off |
| Density | Rows 184/200 px | Rows +16/+20 px | Rows −16/−12 px |

**D · Soft blend** (owner, 2026-11-22: "B's style, toggles and title, A's information, C's coloured
room icon, a light toggle on all sizes"): `.pro-rs` surface and haze, B's title label and borderless
glowing toggles, A's big reading, facts line (status word, climate, media, humidity…) and
lights · devices summary, the room icon tinted in the room's light (`.pro-rb-ico`). Compact tiles
keep a lights toggle (lights only); standard 2 and expanded 3 actions, lights first. B's row
heights (+16/+20 px, `blendMetrics`). `RoomTileBlend.tsx`, `.pro-rb*`. **In production** since
2026-11-22 (devices use `FlowConnectionIcon`); the studio opens on D.

Tiles share `tileParts.ts` (what a room says) and `RoomQuickActions` (with a look per design), so
the designs differ only in composition. Styles: `.pro-rt*` (A), `.pro-rs*` (B), `.pro-rp*` (C) in
`pro.css`.

## 4. Gallery (history, 2026-11-20 to 2026-11-22)

- **Happening now** on top: the busy rooms as pills, busiest first (open, motion, media, lights,
  climate, cleaning); "All quiet" when nothing is going on.
- **Filter**: All, **Favourites** (when any; `rooms.favoriteAreas`) and one per floor (when there
  is more than one). The choice is remembered per browser (`had.pro.rooms.filter`, falls back to
  All when it no longer exists).
- **Floors** highest level first ("Other areas" last), unless the user set an order.
- **Room cards** by floor (2 columns on phones, 3 on tablets, 4 on wide screens): the HA area
  picture, or the room's colour with its icon. The colour is the user's choice, else a hue per
  kind of room moved round the colour wheel until it stands apart from the others (two bedrooms
  never share one; `assignRoomColors` in `lib/roomsPage.ts`); warm light from the top when lit, stronger
  with more lights on; temperature, an occupied dot, name with a star for favourites, lights
  line, up to three glass chips (open, motion, playing, climate, cleaning, low battery). The
  bulb button toggles the room's lights; the rest of the card opens the room.
- **Quick controls and room facts** (owner's "quick wins", 2026-11-20):
  - The glow and the lit bulb take the colour of the lights that are on (`rgb_color`, cool
    colour temperature; plain or warm white keeps the warm glow; `roomLightColor`).
  - A wand button opens the room's scenes (up to 4) when it has any (large cards).
  - Climate chip "Heating · 21°" / "Cooling · 21°" / "Idle · 21°" in the action's colour when the
    room has a thermostat that is on; tap for −/+ on the target (HeroUI Popover).
  - The line under the name adds humidity and power: "2 of 3 lights on · 48% · 320 W".
  - Floor headings show lights on and the average temperature, with **Lights off** for the floor.
  - Phones: smaller temperature and buttons, at most two chips on one line.
- **Richer page** (owner, 2026-11-20; every part has a switch in Customize, all on by default):
  - **Home summary** tiles: rooms lit, someone there, open, temperature range, power now. The
    first three filter the rooms (shown as an extra filter option; tap again for All).
  - **Room status** words, most important first: Open while heating/cooling, Stuffy or
    Poor air, Too warm (≥ 26°), Chilly (< 17°), Humid (≥ 65 %), Dry air (< 30 %), Cozy (someone
    there, lit, 19–24°), Empty for N h (no motion for 2 h+). `roomMood` in `lib/roomsInsights.ts`.
  - **Air quality** after the facts: CO₂, AQI or PM2.5 with a good/fair/poor dot (CO₂ 1000/1400,
    AQI 50/100, PM2.5 12/35), from `carbon_dioxide`/`aqi`/`pm25` sensors or an air monitor's
    attributes.
  - **Heating and cooling**: a ring in the action's colour around the temperature, plus the chip.
  - **Swipe between floors**: on touch screens a sideways swipe over the rooms moves to the next
    or previous filter, with a short slide.
  - **Night look**: after sunset (HA `sun.sun`, else 19:00–7:00) pictures dim, lit rooms glow
    stronger.
  - Phones: status, chips and the climate chip stay on one line (the climate chip shows the
    icon and target only); the ringed temperature is a size smaller.
  - The 24-hour temperature trend was tried and removed (owner, 2026-11-20).
  - **Animations**: presence dot pulses with a slow shimmer on the card, music bars for
    "Playing", lights and night changes fade. Off with the switch or the system's reduced motion.
- **Customize** (button beside the filter, and the header ⋮ menu), saved for every screen:
  - Page and cards (`preferences.proRooms`, `ROOMS_TOGGLES` in `pages/rooms/shared.tsx`): every
    extra above, Happening now, group by floor, scenes button, glow in the lights' colour, humidity
    and power, and card size Large or Compact (3 to 6 columns, icons instead of chips).
  - Floors: order and show/hide (`rooms.floorOrder`, `rooms.hiddenFloors`).
  - Rooms: colour (10 colours or Automatic, `rooms.areaOverrides[id].customColor`), favourite,
    order within the floor (`rooms.areaOrder`), show/hide (`rooms.hiddenAreas`).
  - Floors and rooms use the shared Rooms settings, so the classic Rooms page follows them.
  - "Reset order and page options" clears the orders and turns every page option back on (not
    colours, favourites or hidden rooms).
- Empty: "No rooms yet…". Opening a room shows a placeholder until the room pages are built.
