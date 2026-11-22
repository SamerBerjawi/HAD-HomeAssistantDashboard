# Room page (roadmap 6c)

> **Superseded 2026-11-21.** The owner restarted the Areas pages from scratch: see [AREA_TILES.md](AREA_TILES.md). Kept for the record; the mockups below are not the direction. Since 2026-11-22 the room page is the B + C Area page; the mockup files named below are out of the build, in `scratch/room-page-mockups/*.txt`.

Status: **four mockups (A, B, C, D), 2026-11-21. Owner's direction: D (B's hero, rows of B with one widget per entity). Details still to discuss.** Nothing here is decided yet.
Working agreement: [DESIGN.md §1](DESIGN.md#1-working-agreement). Page accent: teal (hue 192), as Rooms.
Follows the Rooms page ([ROOMS.md](ROOMS.md)): opening a room card lands here.

## 1. Brief (draft)

**Job of the page.** Everything in one room, controllable from one place: how the room is right
now, the one or two things people do most (lights, a scene, the temperature), then every device in
the room, and what happened in it today. The Rooms page answers "which room?"; this page answers
"what's going on in this room, and change it".

**On the page (draft)**
- Hero: the room's picture or colour with the lights' glow (same look as its Rooms card), name,
  floor, status words ("Cozy", "Open while cooling"), temperature, facts (lights, humidity, power).
- Main actions: Lights on/off, the room's scenes, the thermostat target.
- Devices by kind: Lights, Climate, Media, Blinds, Fans, Switches, Doors & windows, Motion, Locks,
  Vacuums, Cameras, Readings. Empty kinds are left out.
- Today: the latest changes (from `last_changed`, no history query).
- All rooms, previous / next room.

**Data.** One HA area (`ResolvedArea`), sorted by `buildRoomPage` in `src/pro/lib/roomPage.ts`
(pure, tested in `tests/roomPage.test.ts`). The room's own card data comes from `buildRoomItem`,
so the hero and the Rooms card always agree. Device names lose the room's name in front
("Living Room Lamp" → "Lamp"). Hidden, disabled and diagnostic entities are left out.

**States to design for**: a full room (Living Room in the demo: lights, thermostat, 3 media
players, fan, switch, open window), a small room (Hallway), a room with no lights, a room with
only sensors, a room that was removed from HA, phones and desktop, light and dark.

**Native HA goal.** The model takes one area, so a later Lovelace "room card" can build the same
page from an area id in its config (DESIGN.md roadmap).

## 2. The mockups

Switch between them with the **A · Dashboard / B · Remote / C · Mix / D · Widgets** buttons above
the room (remembered per browser in `had.pro.room.concept`). All use real data and work (toggles,
sliders, scenes, −/+).

| | A · Room dashboard | B · Room remote |
|---|---|---|
| Idea | A small Overview for one room: a big picture hero, then the room's widgets as tiles (Lights, Climate, Media, readings, Devices, Doors & windows, Today) | The room as a remote: a slim header, scenes, readings in a row, then every device as a row with its control, like a details sheet opened into a page |
| Built from | Overview widget look (tiles, 4-row metric tiles, pills that flip) | Details-sheet kit (`SheetSection`, `SheetRow`, `SheetSlider`, `SheetTile`) |
| Strengths | Beautiful, feels like the Rooms card grew up; glanceable; tiles map 1:1 to future Lovelace cards | Fastest to control; every device reachable; brightness sliders inline; scales to rooms with 30 devices |
| Trade-offs | Long rooms need "show all"; no brightness inline (tap-hold or sheet); tile packing varies room to room | Less visual, looks like settings; one long column on desktop |
| Files | `pages/room/RoomConceptTiles.tsx` | `pages/room/RoomConceptList.tsx` |

**C · Mix** (owner asked, 2026-11-21): A's picture hero and main tiles (Lights, Climate, the
playing Media, readings), then **All devices** with B's rows for everything else (more players,
fans, switches, blinds, doors and windows, motion, locks) and Today. `RoomConceptTiles` with
`mix`, rows from `RoomDeviceSections` in `RoomConceptList.tsx`.

**D · Rows of widgets and tiles** (owner's direction, 2026-11-21, revised the same day):
- **Hero**: B's slim card (picture or colour with the lights' glow, floor and status words, name,
  facts, temperature, lights button). `RoomHeaderCard` in `RoomConceptList.tsx`.
- **One row per kind, as B's sections**, in this order: Cameras, Lights, Climate, Media, Scenes,
  Blinds, Fans, Switches, Doors & windows, Locks, Motion, Safety, Vacuums, Car, Readings.
- **One widget per entity, no tiles** (owner, 2026-11-21): three lights are three Lighting
  widgets, each fed only its own light; the same for thermostats, players, fans, switches, doors
  and windows, locks, motion and safety sensors, cameras and vacuums. Scenes stay one Palette
  widget (a scene is a button, not a device). Kinds with no widget (blinds, readings) keep a tile
  per entity. All on the Overview grid (Small 1×1, Wide 2×1, Tall 1×2, Large 2×2; 148 px rows;
  2 / 4 / 6 columns). Defaults: lights, fans, switches, doors and windows, locks, safety Small;
  players, cameras, motion, vacuums Wide; thermostats Tall.
- **One-device looks**, so a widget holding one entity names it instead of counting:
  - Lighting B (`widgets/lights/concepts/OneLight.tsx`): name and level, an On/Off button, a
    brightness slider from Wide up.
  - Switches C (`OneSwitch`): plug tile, name, "On · 12 W" or "Off", its switch.
  - Doors & windows A (`OneOpening`): "Open" (amber), "Closed" or "Offline" as the headline, the
    name and how long ("for 12m", "3h ago").
- **Widget styles** (owner): Lighting **B** (glow); Door locks, Doors & windows and Car **A**;
  everything else **C · Innovative** (Thermostat dial, Record media, Palette scenes, Speed steps
  fans, Power share switches, Wall of screens cameras, Last hour motion, Sentinels safety). Each
  is fed only this room's entities (`pages/room/useRoomWidgets.ts`), so a Lovelace card with an
  `area` option could do the same.
- **Cameras** belong to the room when their HA camera entity is in the area (and has a stream set
  up in Settings). The **Car** shows in the room that holds its lock or climate entity.
- **Thermostat mode**: the dial has a mode menu (Heat, Cool, Heat/Cool, Auto, Dry, Fan, Off, from
  `hvac_modes`; `climate.set_hvac_mode`) at Wide, Tall and Large
  (`widgets/thermostat/concepts/ModeMenu.tsx`).
- **Fans (C), revised**: a power button (filled while running) and three labelled steps (Low,
  Medium, High; L/M/H when stacked) that fill up to the speed with the current one ringed; the
  state is in words ("Off", "Medium"); a mode menu when the fan has preset modes
  (`fan.set_preset_mode`).
- **Resizing**: **Edit** shows a size bar (S, W, T, L) on each widget; sizes are saved per room in
  `preferences.proRoomWidgets[areaId][widgetId]` (widget id = kind and entity, e.g.
  `lights:light.main`), shared by every screen; **Reset sizes** clears the room's.
- **No room name inside the room**: entity names drop it like Apple Home ("Living Room Ceiling
  Lamp" → "Ceiling Lamp", "Shelf Light (Living Room)" → "Shelf Light", a thermostat named
  "Living Room" → "Thermostat"; `shortName` in `lib/roomPage.ts`). Where a widget labels things by
  room (Lighting's room pills, fan and motion rows, the dial's title, a player's line, the open
  doors line), it shows the device instead.
- **Tiles** (blinds and readings only): icon, name, state; tap to open or close blinds.
- Today's changes close the page.

Still open: tapping a widget doesn't open its details sheet yet; widgets can't be reordered within
a row.

Shared: `pages/room/shared.tsx` (data hook, actions, hero backdrop, lights button, scene pills),
`pages/room/RoomPage.tsx` (All rooms, mockup switch, previous / next).

## 3. Decisions to go through (one at a time)

1. **Overall structure**: A (tiles), B (list), C (mix), D (the dashboard's widgets), or D's
   widgets with B's rows below for "All devices".
2. **Hero**: big picture (A, ~240–290 px) or slim header (B, ~110 px)? Sticky slim header when
   scrolling?
3. **Main actions in the hero**: Lights on/off + scenes (both mockups); add the thermostat target?
   Media play/pause?
4. **Lights**: pills that flip (A) or rows with a brightness slider (B)? Long-press a pill for
   brightness and colour? Colour/temperature controls at all?
5. **Climate**: −/+ (both now), a dial, or the Thermostat widget's design? Modes (heat/cool/off)?
6. **Media**: only the playing one (A) or every player (B)? Volume? Cover art size?
7. **Readings**: which ones (temperature, humidity, CO₂, light level, power) and how: metric tiles,
   or inside the hero? Show a 24-hour chart per reading (needs history queries; the Rooms page
   trend was removed on purpose)?
8. **Doors, windows, motion, locks**: own section, or folded into the hero status ("Window open
   12 min")?
9. **Today / activity**: keep (from `last_changed`, cheap) or a real timeline from HA history
   (logbook, richer, costs a query)? Where: bottom, or a tab?
10. **Cameras in the room**: live tile at the top, a snapshot tile, or link to Security?
11. **Vacuums**: "Clean this room" button (`vacuum.clean_area`, already used in the Vacuums sheet)?
12. **Navigation**: All rooms + previous / next (now), swipe between rooms on phones, breadcrumbs
    (DESIGN.md: planned for sub-views), the room in the URL (`/rooms/<area>`) so it can be
    bookmarked and opened from the Overview.
13. **Customize per room**: hide devices, reorder sections, pin devices to the top, pick the hero
    picture. Saved where (`rooms.areaOverrides[id]`)?
14. **Desktop layout**: one centred column (B), a wide grid (A), or two columns (controls left,
    readings and today right)?
15. **Empty and edge states** wording (no devices, room removed, only sensors).
16. **D only**: hide the room name inside widgets when they're scoped to one room; let people
   resize and reorder the room's widgets (the Overview's edit mode), saved per room; open the
   widgets' details sheets scoped to the room.

## 4. Not decided, not built

Everything in §3. The mockup switch is temporary and goes when a direction is picked.
