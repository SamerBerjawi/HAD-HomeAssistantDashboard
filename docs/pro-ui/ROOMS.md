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

## 3. The page (Gallery)

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
