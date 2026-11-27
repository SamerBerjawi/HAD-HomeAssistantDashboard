# Area tiles (roadmap 6c, restarted)

Status: **batch 1 chosen (2026-11-21): Light B · Halo, Switch & plug D · Ambient (metered plugs with Meter's trace), Fan C · Breeze. Batch 2 chosen (2026-11-21): Thermostat A · Scale, Blind & cover A · Positions, Reading C · Status. Batch 3 chosen (2026-11-21): Speaker & TV D · Ambient, Scene D · Ambient. Batch 4 chosen (2026-11-21): Camera A · Window and B · Timeline, Lock C · Status (unlock = press, then hold), Door & window B · Day, Motion & presence B · Ticks, Leak & smoke B · Device. Batch 5 chosen: Vacuum A · Dock, Car C · Silhouette. Batch 6 chosen: the page as B + C, two views (All, Now).** The production room page is untouched until implementation is approved.
The production room page is the B + C Area page (built 2026-11-22, §4).
Supersedes the room-page mockups in [ROOM_PAGE.md](ROOM_PAGE.md) (owner, 2026-11-21: "start from
zero"). Working agreement: [DESIGN.md §1](DESIGN.md#1-working-agreement). Page accent: teal (Rooms).

Studio: dev builds only, `/?studio=areas` (link from the Widget Design Studio header).
Code: `src/pro/areas/` (tiles, gestures, kit) and `src/pro/areas/studio/` (studio, mock HA, page).

## 1. Rules for every tile

- **One entity per tile**, never a group. A tile may show several attributes and controls of its
  entity.
- **Each type has its own look and interaction model**: no shared card template. The family
  resemblance comes from a small kit only (`tileKit.tsx`): 26 px radius, name and state type
  styles, small in-tile controls.
- **Every size is laid out on purpose**: X-small 1×½ (68 px, added 2026-11-21, every concept),
  Small 1×1, Wide 2×1, Tall 1×2, Large 2×2; the area grid runs on half rows (68 px + 12 px gap, so
  Small stays 148 px); 2 / 4 / 6 columns. Checked at a phone cell (165 px) and a desktop cell (208 px).
- The state reads from across the room; the main action is one tap or one slide on the tile.
- **Gestures never block scrolling**: whole-tile slides are sideways (`touch-action: pan-y`);
  only small handles (ring, lever grip) capture the pointer. One service call per gesture, on
  release.
- Motion honours reduced motion. Light and dark for everything.
- Tiles take a pure view model and emit `TileAction`s (`tileTypes.ts`), so the room page can feed
  them from HA and map actions to services; the studio feeds them from a mock HA (`areaStates.ts`).

## 2. Grouping into batches

| Batch | Types | Domains |
|---|---|---|
| 1 · Light & power (chosen) | Light; Switch & plug; Fan | `light`; `switch`, `input_boolean`; `fan` |
| 2 · Climate & air (chosen) | Thermostat; Blind & cover; Reading | `climate`; `cover`; `sensor` (temperature, humidity, CO₂, PM2.5, VOC, AQI, illuminance, power, energy) |
| 3 · Media & scenes (chosen) | Speaker & TV; Scene (one tile each) | `media_player`; `scene` |
| 4 · Security & sensing (chosen) | Camera; Lock; Door & window; Motion & presence; Leak & smoke | `camera`; `lock`; `binary_sensor` by device class |
| 5 · Machines (chosen) | Vacuum; Car | `vacuum`; car device (battery, range, charging, lock, climate, location) |
| 6 · The page (chosen: B + C as two views) | Header, order and grouping, editing and resizing, empty rooms | — |

Settled: the car (owner, 2026-11-21) gets one X-small or Small tile per entity, and one Wide, Tall or
Large tile for the whole car. Open question: whether to add types the page skips today (humidifier, valve, siren, button / script,
select, number).

## 3. Batch 1 concepts

| Type | A | B | C | Recommended |
|---|---|---|---|---|
| Light | **Pour**: the tile is the dimmer; light pours across it in the bulb's colour; text turns dark where the light covers it. Slide to dim, tap to switch; Large adds tone or colour chips | **Halo**: a glowing bulb (tap) inside a dimmer ring (turn); the tile glows from the bulb; swatches from Wide | **Steps**: five brightness steps as a rising stair, a power key, a palette on Large; taps only | A |
| Switch & plug | **Rocker**: a real I / O wall rocker plate; now, today and how long on Large | **Meter**: live watts lead, a frameless trace of the last hours, toggle in the corner | **Track**: the tile is the switch; a big knob with the device icon rides across, the track floods with the accent | C |
| Fan | **Rotor**: the rotor turns at the real speed; − / + and level dots; modes, swing and direction on Large | **Throttle**: a notched lever, Off, 1, 2, 3…; drag the grip or tap a notch; mode menu; stands up in Tall | **Breeze**: mode first; air streaks drift at the fan's speed; speed pills; swing and direction on Large | B |

States shown per type (realistic HA data): lights warm white, colour, off, dim 8 %, on/off only,
long name, unavailable; switches metered plug, heavy load, off, wall switch, helper toggle,
unavailable; fans tower with presets, 3-speed ceiling fan with direction, top speed, off, on/off
only, unavailable.

The **Area page** tab lays the batch 1 tiles out as a Living Room at phone, tablet and desktop
widths, with the owner's picks (or the recommendations, or all A / B / C). Its header is a stand-in
until batch 6.

## 3b. Concept D · Ambient (owner's reference, 2026-11-21)

Built from two reference shots ("Minimal & Ambient"): frosted glass cards with a hairline edge, a
soft wave of the entity's colour rising from a corner as it's more on (brightness, load, speed), a
round glowing power button, generous type; one colour per kind (golden light, mint power, teal air,
blue cooling / orange heating, violet media, blue water). Code: `src/pro/areas/tiles/ambient/`.

- Batch 1: D for Light (slide anywhere to dim, tone pills on Large), Switch & plug (wave = load),
  Fan (spinning icon, glowing speed bar from Wide).
- Style previews for later batches, each with D only (their A–C come with their batch):
  Thermostat (glowing mode-coloured ring: current in the middle, target under it; turn it or − / +;
  mode menu), Blind & cover (the window with slats coming down; up / stop / down; tap the window to
  set a position), Reading (value over a soft curve of the last hours), Speaker & TV (artwork, live
  level bars, round transport), Camera (framed live view, pulsing Live badge).
- Area page: "All D · Ambient" adds these previews and the reference's dark navy page with a
  violet glow (light theme: lavender).

### Refinement 2 (owner's second reference, 2026-11-21)

- Light: Small = icon, name, state on top and a big power orb at the bottom; Wide = icon and orb
  on top, "75% · Warm white", a level slider along the bottom; X-small = one row with the orb
  wearing the bulb icon. Switches and fans follow the same shapes.
- Thermostat: ring on a cold-to-warm gradient with a white knob at the target; the target big in
  the middle with "Heating" / "Cooling"; − / + under it. Wide: words left, smaller ring right.
- Blind: lit slats over a night window, "Open · 60%"; X-small stacks up / down.
- Readings: line chart with a soft fill (temperature blue, humidity violet).
- Speaker: Large is the full player (cast, progress with times, shuffle / previous / play / next /
  repeat); X-small makes the artwork the play button.
- Camera: name and a Live pill in a header, the view below with a full-screen corner.
- Area page "All D": the reference layout: the room photo fading in behind a breadcrumb, title
  and facts ("11 devices · 22.0°C · 48%"), one grid without headings; phone uses X-small for the
  quick tiles.

### Batch 1 choices (owner, 2026-11-21)

| Type | Chosen | Changes |
|---|---|---|
| Light | **B · Halo** | Small shows the level with its % sign. On/off-only lights (no dimming, no colour): a plain lit ring around the bulb (no knob), and the state says how long ("On for 52m", "Off · just now"); Tall and Large show On / Off big. |
| Switch & plug | **D · Ambient** | Metered plugs show Meter's (B) trace of the last hours instead of the wave, at every size; plain switches (a wall switch) show the corner glow alone at every size, no wave (owner, 2026-11-26). |
| Fan | **C · Breeze** | Fans without presets say "On" (not "Running") so Small never clips. |

The studio marks these "Chosen" and the Area page's "Chosen" view uses them.

## 3c. Batch 2 concepts (2026-11-21)

Each type keeps its Ambient D preview as a fourth option. Code: `src/pro/areas/tiles/climate/`,
`cover/`, `reading/` (shared words, colours and comfort bands in `climate/climateParts.tsx`,
`cover/coverParts.tsx`).

| Type | A | B | C | Recommended |
|---|---|---|---|---|
| Thermostat | **Scale**: a ruler of degrees; the room is a dot, the target a pin; the stretch between them fills orange (heating) or blue (cooling). Drag the pin or tap the scale, − / +; Tall stands it up like a thermometer | **Modes**: the device's modes are big buttons, the chosen one solid in its colour, the tile tinted; target second with − / + | **Big step**: one huge target; tap its top half to raise, bottom half to lower; Off shows a big Turn on | A |
| Blind & cover | **Positions**: a ladder Closed / 25 / 50 / 75 / Open, filled up to the position; Stop while moving; garage doors get two rungs | **Shade**: the tile is the window, fabric hanging from a roller over a day (or night) sky; pull the bar to any position; up / down in the corner; garage doors show panels | **Arrows**: the tile is two big buttons, up and down; a bar shows how open; the moving arrow nudges and the bar becomes Stop | A |
| Reading | **Gauge**: a half-dial with the comfortable range in green and a needle coloured by how good it is | **Trend**: big value, change in the last hour, a six-hour line with low / high and a dot at now; the comfort band shades it | **Status**: the verdict first ("Comfortable", "Dry", "Stuffy") with what to do, the number second, the tile washed in the verdict's colour; a band meter from Wide up | C |

States added: thermostat Heat/Cool idle and unavailable; cover opening, open/close-only (garage
door) and unavailable; readings dry humidity, PM2.5 and unavailable. Comfort bands (a first take,
the owner may tune them): temperature 19–24°, humidity 40–60 %, CO₂ under 800 ppm (Stuffy above
1200), PM2.5 under 12 µg/m³. Readings show % and ppm as whole numbers, temperatures with one
decimal, and the unit smaller than the number.

The Area page adds a Climate section (thermostat, two readings, two blinds, CO₂).

### Batch 2 choices (owner, 2026-11-21)

The owner took the recommendations as they are: **Thermostat A · Scale**, **Blind & cover A ·
Positions**, **Reading C · Status**. No changes requested; the comfort bands stay as proposed.

## 3d. Batch 3 concepts (2026-11-21)

Code: `src/pro/areas/tiles/media/`, `scene/` (shared parts in `mediaParts.tsx`, `sceneParts.ts`);
Ambient D for scenes in `tiles/ambient/AmbientScene.tsx`. Speaker & TV keeps its Ambient D preview.

| Type | A | B | C | D | Recommended |
|---|---|---|---|---|---|
| Speaker & TV | **Cover**: the artwork is the tile, title in white over it; tap the picture to play / pause; skip from Wide; Tall and Large show the art as a square over a blurred wash of itself, with progress and mute. A TV without artwork shows its app | **Remote**: a big play / pause inside a volume ring you turn; skip and mute from Wide; text instead of art | **Level**: the tile is the volume, a violet wash as loud as it is; slide sideways for volume, tap to play / pause; Large adds inputs and services as chips | Ambient (preview from before) | A |
| Scene | **Button**: one big button, icon in the scene's colour, name, when it last ran; the active scene stays filled | **Palette**: painted with the colours its lights go to, name on a frosted label; a "Now" pill while it holds | **Slide to run**: slide the knob along its track to run; a tap only nudges it (for scenes that turn a lot off) | **Ambient**: glass, a glowing orb with the scene's icon, its colour glowing while it holds | A |

Model additions: media `deviceClass` (speaker / TV), `muted`, `sources`; actions `mute`, `source`;
a new `scene` model (look, palette of light colours, member count, last run) and an `activate`
action. HA scenes have no on state: a tile shows "Active" for the last scene run in the room
(running another ends it) and "Done" for a moment after a run.

States: speaker playing, paused, muted; TV on Netflix (no artwork); idle; unavailable. Scenes:
active, used earlier, Bright, Good Night (sets 14 devices), long name never run, unavailable.
The Area page adds a row of X-small scenes at the top and a Media section.

### Batch 3 choices (owner, 2026-11-21)

**Speaker & TV D · Ambient** and **Scene D · Ambient**, over the recommendations (Cover, Button):
the owner keeps these in the same glass family as the chosen switches. No changes requested.

## 3e. Batch 4 concepts (2026-11-21)

Code: `src/pro/areas/tiles/security/` (one file per type; shared colours, words, battery note and
the five-size `Shell` in `securityParts.tsx`); Ambient D for the new types in
`tiles/ambient/AmbientSecurity.tsx`. Colours: green safe, amber open / unlocked, blue motion, red
alarm, grey quiet. Batteries show only when low (≤ 20 %).

| Type | A | B | C | D | Recommended |
|---|---|---|---|---|---|
| Camera | **Window**: the view edge to edge, Live / Snapshot pill, name and last motion on a scrim; tap switches live ↔ snapshot | **Timeline**: the view on top, six hours of motion as ticks below, with a count | **Private**: words first ("Quiet", "Motion"), the view blurred until Show (re-blurs after 15 s) | Ambient (preview from before) | B |
| Lock | **Hold**: one round key; tap to lock, press and hold 0.8 s to unlock while a ring fills | **Bolt**: the deadbolt as a two-way switch, Unlocked \| Locked; Large adds Open (unlatch) | **Status**: the word first, who and when; Lock is one tap, Unlock is press, then hold | **Ambient**: glowing orb, unlock asks "Tap again" | A |
| Door & window | **Plan**: drawn as on a floor plan, the door swings, sashes part, garage panels lift | **Day**: open spells over 24 h as bars, "Opened 4 times in 24 h" | **Badge**: colour bar and the word with how long; open too long (door 5 min, window 2 h) turns the tile red | **Ambient**: status orb, amber glow and wave while open | C |
| Motion & presence | **Pulse**: rings while it sees someone, a fading dot when quiet; presence glows steadily | **Ticks**: detections in the last 6 h as ticks, with the count | **Since**: one big number, how long since anyone moved, or "Now" | **Ambient**: status orb, blue glow while detected | C |
| Leak & smoke | **Alarm**: calm green check; on an alarm the tile floods red and breathes | **Device**: the sensor puck with its status light and battery, "last heard" first | **Advice**: quiet grey while clear; on an alarm, what to do | **Ambient**: soft green glow, red glow and wave on an alarm | A |

Model additions: camera `events`; new `lock` (state incl. jammed and open, battery, changed by,
unlatch), `opening` (device class, battery, open spells in 24 h), `motion` (device class,
battery, detections in 6 h) and `safety` (device class, battery, last seen) models; a `lock` action
(lock / unlock / open). Unlocking never happens on a single stray tap except Bolt's explicit side.
The Area page adds a Security row.

### Batch 4 choices (owner, 2026-11-21)

| Type | Chosen | Changes |
|---|---|---|
| Camera | **A · Window** and **B · Timeline** | Both kept: either style per camera (the studio's Area page shows Window). |
| Lock | **C · Status** | The second press is a hold: press Unlock, the button turns amber and says "Hold to unlock"; hold it 0.8 s while it fills. A short tap keeps it armed for 4 s; releasing after the unlock never relocks. |
| Door & window | **B · Day** | None. |
| Motion & presence | **B · Ticks** | None. |
| Leak & smoke | **B · Device** | None. |

## 3f. Batch 5 concepts (2026-11-21)

Code: `src/pro/areas/tiles/machines/` (`vacuumParts.tsx` and `carParts.tsx` hold words, colours
and controls; `VacuumTiles.tsx`, `CarTiles.tsx`); Ambient D in `tiles/ambient/AmbientMachines.tsx`.
The studio catalog is now one file per batch under `studio/catalog/`.

Car rule (owner): X-small and Small show one entity of the car (battery, range, charging, doors,
climate or location; the studio's state picks which), each with its own control where it has one.
Wide, Tall and Large are one tile for the whole car. `carEntity()` describes every entity the same
way so all concepts share it. The doors always use the hold-to-unlock button from batch 4.

| Type | A | B | C | D | Recommended |
|---|---|---|---|---|---|
| Vacuum | **Dock**: the robot as a puck inside its battery ring, the state in words, one main button (Start / Pause / Resume / Retry) and Dock | **Rooms**: rooms as chips (locked while it runs), then "Clean Kitchen" / "Clean 2 rooms"; Large adds suction; vacuums without rooms fall back to Dock | **Path**: a small floor plan with the trail cleaned so far, the robot dot and the dock | **Ambient**: the orb is Start / Pause, a wave while it cleans | B |
| Car | **Gauge**: a charge arc with the range inside and a tick at the charge limit; climate and location chips; Doors and Precondition buttons | **Dashboard**: one row per entity with its control at the end (on Tall the doors button stands in for the word) | **Silhouette**: the car picture, a charge bar under it, state as badges; buttons on Tall and Large | **Ambient**: battery and range in big type, green glow while charging; the orb charges (or preconditions when unplugged), doors in the corner | A |

Model additions: `vacuum` (state incl. returning and error, battery, suction, rooms and the rooms
to clean, current room, area, minutes, progress, error text, last run) and `car` (focus entity,
battery, range, charging state, power, limit, minutes left, locked, climate and cabin
temperature, location, picture). Actions: `vacuum` (start / pause / dock / locate), `fanSpeed`,
`rooms`, `charge`, `carClimate`. The Area page adds a Machines row: the vacuum, the car as one
Wide tile and four X-small tiles of the same car (battery, doors, climate, location) sharing one
state.

### Batch 5 choices (owner, 2026-11-21)

| Type | Chosen | Changes |
|---|---|---|
| Vacuum | **A · Dock** | None. |
| Car | **C · Silhouette** | X-small and Small leave the picture out: the entity's icon, value and own control, plus Precondition as a round icon button (X-small has room for one: the entity's own control, else Precondition; the climate tile's control is the icon). The picture is the car's `entity_picture` from Home Assistant, or the owner uploads their own (it wins); with neither, a plain car outline. |

Picture: the model carries `picture` (the HA entity picture URL) and `uploadedPicture`. On the real
page the upload goes through the existing `uploadAsset()` → `POST /api/assets` (admin only; PNG,
JPEG, WebP up to 5 MB; no SVG) and the stored URL resolves with `resolveAssetUrl()`. HA entity
pictures are relative to the HA instance, so they load through the image proxy. Pictures are
contained, never cropped. In the studio, "Car picture" switches From the car / Upload your own /
None (the upload stays in the browser there).

## 3g. Batch 6 · the page (2026-11-21)

Code: `src/pro/areas/page/` holds the parts meant for the real page: `roomLayout.ts` (sections,
order, sizes per device, hidden, collapsed, pinned; pure, tested in `tests/areaRoomLayout.test.ts`),
`roomSummary.ts` (what is active or an alert, the header facts, one sentence, section summaries),
`useRoomEditor.ts` (draft editing), `RoomGrid.tsx` (the grid and its edit frame), `RoomEditParts.tsx`
(edit bar, hidden tray, empty room). The concepts and rooms for the studio are in
`src/pro/areas/studio/page/`.

Shared by every concept, the Overview's model so both pages edit the same way:

- **Customize** starts a draft; nothing is kept until **Save**; **Cancel** or Escape throws it away;
  **Reset** goes back to the defaults. One layout per device class (phone; tablet & desktop).
- In edit mode tiles go quiet under a frame. A **handle** and a **⋯ menu** sit on the corners, half
  outside the tile, so its name stays readable. Drag the handle to reorder (the grid reflows as you
  go, so tiles of different sizes never overlap), or use the keyboard (Space, arrows, Space). The
  menu has **Size** (X-small to Large), **Move earlier / later**, **Hide** (and **Pin** in C).
- Tiles stay in their section (Overview rule); sections move with ↑ / ↓ on their headings. Hidden
  tiles wait in a **Hidden (n)** tray at the top, one tap from coming back.
- **Empty room**: "Nothing in Guest Room yet", why (areas are set in Home Assistant) and a link to the
  area there. **Sensors-only rooms** work in every concept.
- Room navigation: Areas, and previous / next room.

| Concept | Header | Grouping | Phone |
|---|---|---|---|
| **A · Sections** | Slim: name, facts (temperature, humidity, lights on), Customize | Sections by kind in a fixed order you can change; each heading says where it stands ("4 of 6 on", "Window open") and offers one action for all of it (Lights: All off); sections fold | Same, one column of sections, Customize as an icon |
| **B · Rail** | A sticky rail on the left: picture, name, facts, Customize | Scenes and readings live in the rail (X-small); the grid on the right is only what you control and watch; an index of sections in the rail | The rail becomes the header: picture, readings as values, scenes in a row you swipe, section chips that stick to the top |
| **C · Now first** | The name and one plain sentence ("Cooling to 22°, music playing, window open for 14 min.") | **Now**: what is on, running or needs a look (alerts first); **Pinned**: your favourites on top; **Everything else** folds into one line per section, opened with a tap. A tile that turns off stays in Now until you leave, so nothing jumps under your finger | Same |
| **D · Ambient** | The earlier preview: the room photo fading in behind the title | One grid, no headings | Same; no editing or empty room designed yet |

Recommended: **A**. It is the most predictable (things are always in the same place), it matches
the Overview's sections, and its headings carry the useful summaries. B suits tablets on the wall
(the rail is the room at a glance); C is the cleverest but rooms change shape as things turn on and
off.

### Batch 6 chosen (owner, 2026-11-21)

**B and C as two views the user switches between** ("B + C · Two views" in the studio, the default
there). The frame is B's: the rail on tablet and desktop (picture, name, facts, Customize, scenes and
readings), the picture header on phones. A switch, **All | Now · n**, sits at the top of the
content (in the sticky bar on phones):

- **All** is B: the sections grid, with the section index in the rail (or as chips on phones).
- **Now** is C: the room in one sentence, then Pinned, Now and everything else folded per section.
  Scenes and readings stay in the rail in both views.
- One layout serves both: sizes, order, hidden tiles and pins set in Customize apply to both views.
  Customize shows every section (and Pinned) whichever view was on; the switch hides while editing.
- The view is a preference per screen (on the real page: remembered per device, not part of the
  layout). The studio starts on All.

Code: `PageRail.tsx` with `views`; `PageNow.tsx` exports `NowBody`, `PinnedSection`,
`RoomSentence` for it.

## 4. Next

Build the real Area page (B + C) once the owner approves touching production. Proposed phases:

1. **HA → tile models** (done, 2026-11-21): `src/pro/areas/ha/`, tested in `tests/areaHaTiles.test.ts`.
   `haTileModels.ts` maps each entity type (names without the room's, battery from the device,
   media position moved on while playing, scene "last run" from its state). `haCar.ts` builds a car
   from its device's entities (battery, range, charging, lock, climate, tracker), plus the entities
   its actions need; door locks, thermostats and phones are not cars. `haRoomTiles.ts` turns an
   area into tiles: skips hidden, disabled, diagnostic and config entities; one tile per car with
   its entities folded in; readings that belong to a thermostat, vacuum or player left out; the
   scene run last (within 2 h) holds; default sizes per kind; ordered by section, then kind, then
   name. History (trends, events, open spells) and pictures come in through the context and are
   filled in phase 4.
2. **Tile actions → HA services** (done, 2026-11-21): `src/pro/areas/ha/haTileActions.ts` (pure,
   tested in `tests/areaHaActions.test.ts`) and `useTileActions.ts` (sends them through the widgets'
   `useServiceCall`: error toasts, demo mode). Each action gives the calls, the state HA will report
   (shown at once; locks are not shown early outside demo, the store guards them), and changes HA
   does not keep (camera live, rooms picked, the scene that holds). Brightness, tone and colour use
   `light.turn_on`; a fan at 0 % is turned off; a thermostat turned on picks heat_cool, heat, cool
   or auto; picked vacuum rooms use `vacuum.clean_area` when their area ids are known, else
   `start`; car actions call the car's own lock, climate or charging switch, and do nothing when
   the car has none (phase 5 hides those buttons).
3. **Layout per room and device** (done, 2026-11-22): `preferences.proAreaLayouts[areaId][phone|wide]`
   (like the Overview's `proOverviewLayout`, not `rooms.areaLayouts` as first planned), written once
   on Save through `updateConfig` (other screens get it by SSE). `reconcile` fits a saved layout to
   the room as it is now: tiles that left drop out, new ones go to the end of their section with
   their default size, a new section takes its default place; order, sizes, hidden, pins and folds
   are kept. The config's deep merge leaves `sizes` keys of tiles that left; `reconcile` ignores
   them. `useAreaLayout.ts` is the studio editor's interface over the config. The All / Now view is
   remembered per screen and device class in localStorage (`had.pro.room.view.<device>`).
4. **Room page** (done, 2026-11-22): `src/pro/pages/room/RoomPage.tsx` is the B + C page. The Rail
   and Now views, the page kit and the car picture control moved from the studio to
   `src/pro/areas/page/` and are shared by both (the studio passes its in-memory editor, the page
   the saved one). Tiles come from `buildAreaTiles` over the store's area, drawn with the chosen
   concept per kind (`src/pro/areas/tiles/chosenTiles.tsx`), and act through `useTileActions`
   (changes HA does not keep stay on the page; running a scene ends the others). All rooms and
   previous / next follow the Rooms page's order (no wrap); the empty room links to the area in
   Home Assistant. The old A–D mockups were never committed; they are kept outside the build in
   `scratch/room-page-mockups/*.txt`.
5. **Car** (done, 2026-11-22): the whole car is one tile; each entity it has (battery, range,
   charging, doors, climate, location) also gets an X-small tile, battery and doors shown, the rest
   in the Hidden tray (`RoomItem.hidden`, only for tiles the saved layout has not placed yet),
   named "Model Y · Doors" there and in menus. `CarTileModel.can` says which of lock, climate and
   charging the car has; tiles leave out the others' buttons (Precondition included). Pictures:
   the entity picture from Home Assistant by default; while customizing, each car's picture can be
   uploaded (`uploadVehicleAsset` → `/api/assets`, admin only) or set to none, saved at once in
   `preferences.proCarPictures[deviceId]` (a car's setting, not part of the layout draft).
6. **Checks** (2026-11-22): demo data in the browser (desktop and phone: tiles live, All off, Now
   view remembered, Customize → move section → Save → reload kept it, Reset), lint, 651 tests and
   `npm run build` with `check:bundle` (main CSS 44.8 of 45 KB). Not checked: a real car (the demo
   has none in an area; the studio's car was), `test:integration` (no server change).

Still open: history for trends, events and open spells (the Door & window tile says "Not opened in
24 h" until it has it); the Rooms page header still shows above the room page.
