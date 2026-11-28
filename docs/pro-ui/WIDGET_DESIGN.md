# Widget design plan (Overview widgets)

Status: **Pilot (Weather) built: three user-picked styles. Phase 1 (Lighting, Media, Vacuums, Family presence) built from the owner's choices (2026-11-19). Phase 2 (Switches, Fans, Thermostat, Scenes) built from the owner's choices (2026-11-19). Phase 3 (Alarm, Cameras, Doors & windows, Safety, Motion, and a new Areas widget) built from the owner's choices (2026-11-19). Phase 4 (Energy now, Energy today, Energy flow) built from the owner's choices (2026-11-20). Two new widgets, Door locks and Car, built from the owner's choices (2026-11-20). Details sheets redesigned for every widget (2026-11-20), reviewed by the owner the same day (§8).**
Scope: the pro Overview widgets in `src/pro/widgets/` (the registry from
[OVERVIEW_REBUILD.md](OVERVIEW_REBUILD.md)). Classic UI and the other pro pages are out of scope.
Working agreement: [DESIGN.md §1](DESIGN.md#1-working-agreement) still applies (ask, record,
build only what was decided).

Goal: every widget recognisable by its look alone, with the title removed. Consistency comes
from a shared design language, not from a shared card layout.

## 1. Inventory (from the code)

Sizes: s 1×1, w 2×1, t 1×2, l 2×2 (row 148 px, gap 12 px; columns: phone 2, tablet 4,
desktop 6). Every widget has a details sheet (opened from the card header today) and a fixture
(realistic demo model) that the studio can reuse.

| Widget (id) | Purpose | Key information | Interactions | Sizes | Phase |
|---|---|---|---|---|---|
| Weather (`weather`) | Conditions and forecast | Temperature, condition, high/low, feels-like, hourly (temp, rain %), 3–7 day, UV, wind, humidity, day/night | Sheet: station picker, details | s w t l | **1** |
| Lighting (`lights`) | Control the lights | On count of total, average brightness, per light on/off and brightness, room | Toggle a light, all on/off; sheet: brightness per light | s w t l | **1** |
| Media (`media`) | Now playing | Album art (and its palette), title, artist, player, position/duration, volume, up next | Play/pause, previous/next, seek, volume; sheet: player, source, sound mode, shuffle, repeat, power, queue | s w t l | **1** |
| Vacuums (`vacuums`) | Robot cleaning | State (cleaning, docked, returning, paused, error), battery and charging, current room, suction, area and time cleaned, other vacuums; map image when the integration has one | Clean/pause, dock, suction; sheet: locate | s w t l | **1** |
| Family presence (`users`) | Who is home | Avatar or initials, home/away/zone, location, phone battery, last update, map position | Tap a person to open their sheet (map) | s w t l | **1** |
| Switches (`switches`) | Plugs and switches | On count, live power (W), per switch power, room | Toggle one, all on/off | s w t l | 2 |
| Fans (`fans`) | Fans | On count, average speed, per fan speed, oscillation, direction, preset, paired temperature/humidity | Toggle one, all; sheet: speed, oscillate, direction, preset | s w t l | 2 |
| Thermostat (new) | Climate control | `climate.*` entities exist (demo: Bedroom AC, Living Room Ecobee): current/target temperature, HVAC mode and action. **No pro widget yet** (only a Phase 2 placeholder) | Set temperature, mode | to decide | 2 |
| Scenes (new) | One-tap moods | `scene.*` entities exist (demo: 5). **No pro widget yet** (placeholder only) | Activate | to decide | 2 |
| Alarm (`alarm`) | Arm state | State and tone, who/when changed it, open doors/windows, locks | Arm modes (PIN and "arm anyway" dialogs), lock/unlock, lock all | s w t l | 3 |
| Cameras (`cameras`) | See the cameras | Snapshot or live stream, motion, offline, name, room | Previous/next, choose camera, snapshot, full screen | s w l | 3 |
| Doors & windows (`openings`) | What is open | Open count, which ones, since when | Doors/Windows view switch | s w t l | 3 |
| Safety (`safety`) | Leak and smoke | Alerts, which sensor, all clear | Leak/Smoke view switch | s w t l | 3 |
| Motion (`motion`) | Activity | Active zones, last motion | Read only | s w t l | 3 |
| Areas (new) | Rooms at a glance | Favourite areas (the user's list, `rooms.favoriteAreas`, shared with the Rooms settings; the first areas when none are set); every area by floor; per area: temperature, humidity, lights on, media, motion, open contacts, power, picture | Pick a favourite, pick any area from a menu grouped by floor, lights on/off for the area | s w t l | 3 |
| Energy now (`energy_now`) | Live power | Home kW, solar, grid import/export, battery %, clean share | Read only; sheet | s w l | 4 |
| Energy today (`energy_today`) | Period totals | kWh used, cost, solar yield and forecast, grid import/return, self-sufficiency | Usage/Solar/Grid switch; sheet period | s w t l | 4 |
| Energy flow (`energy_flow`) | Where energy went | Sankey sources → home → areas → devices | Read only | l | 4 |

Data available in Home Assistant but not yet in our models (only added if a chosen concept needs
it): light colour and colour temperature (`rgb_color`, `color_temp_kelvin`), media app/source
artwork, vacuum map image (in the discovery data, unused on the card), weather alerts.

## 2. Audit: why the widgets look alike

- **One frame for all.** Every widget sits in the same `WidgetCard`: same surface, same padding,
  same header (icon tile, title, subtitle, chevron). That is exactly the "title at the top, same
  background" problem, and it was our Phase 2 design.
- **One body pattern.** Lighting, Switches, Fans, Presence (s), Energy today, Motion, Safety and
  Doors & windows all end in "big number + muted line + small pill". Lights/Switches/Fans share
  `ControlParts`; Motion/Safety/Doors share one `SensorGroupBody`.
- **Colour carries almost no meaning.** Only Media (album art wash) and Alarm (tone tile) have
  their own colour. Everything else is the same neutral surface with the page's blue accent.
- **No imagery or metaphors.** No sky for weather, no glow for lights, no product for the vacuum,
  no faces at a glance for presence (small avatars only).
- **Most similar pairs today:** Lighting ≈ Switches ≈ Fans; Motion ≈ Safety ≈ Doors & windows;
  Energy today (s) ≈ Switches (s).

## 3. Design language (shared vs free)

**Shared by every widget** (the "family"):

- Type: Plus Jakarta Sans for words, JetBrains Mono tabular figures for live numbers. One display
  size per widget (the hero number or word), one label size, one caption size.
- Shape: one outer radius for every widget (proposal 24 px) and one inner radius (14 px);
  4-pt spacing, 12–16 px inner padding.
- Icons: Hugeicons only. Controls: HeroUI (Button, Switch, Slider, ToggleButtonGroup).
- Touch: 44 px targets, press feedback (scale 0.98, 120 ms), visible focus ring.
- Motion: purposeful only (state changes, live values); `prefers-reduced-motion` respected.
- Light and dark for every widget; WCAG AA contrast for text on any widget background.
- Edit mode: the same overlay on every widget (drag handle, "⋯" menu), whatever its look.
- One quiet way to open details (see decision D2), the same position on every widget.

**Free per widget:** surface (colour, gradient, image), composition, hero element, where the
title goes (or none), visual metaphor, control layout, data visualisation, and a different
composition per size (a small widget is designed, not shrunk).

**Colour rule (proposal):** neutral by default, colour when it means something. A widget's
colour comes from its content or state: the sky for weather, the lamp's glow for lights, the
album for media, the room temperature for climate. Inactive widgets (lights off, media paused,
vacuum docked) recede to a calm surface; active ones come forward. Alerts use only the status
colours (warning, danger). The page accent stays for page chrome (tabs, buttons outside widgets).

**Personalities (starting points):**

| Widget | Personality | Hero |
|---|---|---|
| Weather | Atmospheric | Temperature over a sky that follows condition and time of day |
| Lighting | Warm, tactile | Glow that scales with how many lights are on and how bright |
| Media | Immersive | Album art |
| Vacuum | Product, operational | The robot and its progress (room, battery, time) |
| Presence | Personal | Faces, home vs away at a glance |
| Climate | Precise, comfortable | Temperature arc or dial |
| Security | Calm, trustworthy | One clear state; colour only when something is wrong |
| Energy | Analytical, dynamic | Flow and balance |

## 4. Widget Design Studio (dev only)

A permanent design playground, kept after implementation so concepts can be revisited.

- Route `/studio` in dev builds only, lazy loaded and left out of the
  production bundle (checked with `npm run build:pro`).
- One section per widget: concepts A, B and C side by side, each rendered at the widget's real
  cell sizes, with a size switch (s/w/t/l), a light/dark switch per panel (local, it never touches
  the shared theme setting) and a state switch (for example lights on/off, playing/paused,
  cleaning/docked/error, importing/exporting).
- Mock data: the widgets' existing fixtures plus named state variants (`fixtureStates`), so the
  concepts use the same models as the real widgets. Controls work on local state.
- Concepts live next to their widget: `src/pro/widgets/<id>/concepts/{A,B,C}.tsx`, each a
  `Body` for the same model, so the chosen one can become the real body with little rework.
- Selection: pick A, B or C (or "mix" with a note) per widget; the studio remembers it in the
  browser and offers "Copy selection" for the chat.
- **Design registry** `src/pro/widgets/designRegistry.ts`: for each widget, the chosen concept,
  date, status (exploring, chosen, built) and notes. The studio shows it; I update it when you
  decide; the decision is also logged in DESIGN.md §9.

Architecture change needed for Phase 1 (small): let a widget own its surface. `WidgetCard` keeps
the edit overlay, the size menu and the "open details" control, but a widget can declare its own
surface and title treatment instead of the standard header (see D2). No other refactor during the
mockup phase.

## 5. Phases

| Phase | Widgets | Why this group |
|---|---|---|
| Pilot | Weather | A test run of the whole loop (studio, three concepts, choose, implement) on one widget before scaling up. |
| 1 | Lighting, Media, Vacuums, Family presence | Four very different personalities used every day; with Weather they set the language the others inherit. |
| 2 | Switches, Fans, Thermostat (new), Scenes (new) | Device control. Separates Switches and Fans from Lighting; adds the two missing climate/mood widgets. |
| 3 | Alarm, Cameras, Doors & windows, Safety, Motion, Areas (new) | Security family: calm by default, unmistakable when something is wrong. Areas added by the owner (2026-11-19): favourite rooms one tap away, every room by floor in a menu. |
| 4 | Energy now, Energy today, Energy flow | Data-rich; benefits from the visual language settled by then. |

Each phase: three concepts per widget in the studio → you choose (or mix) → refine → record →
implement in the real widget → verify (sizes, states, light/dark, phone).

## 6. Decisions (approved 2026-11-19)

All four as proposed (logged in [DESIGN.md §9](DESIGN.md#9-decision-log)), with one change from
the owner: a Weather-only pilot runs first, and Phase 1 is Lighting, Media, Vacuums, Family
presence.

- **D1 Colour rule.** Neutral by default, colour from content/state; status colours for alerts;
  the page accent stays for chrome.
- **D2 Widget frame and title.** No shared header; each widget places its title (or none); one
  corner button in the same spot on every widget opens details.
- **D3 Phases.** Pilot: Weather. 1: Lighting, Media, Vacuums, Family presence. 2: Switches,
  Fans, Thermostat (new), Scenes (new). 3: security family. 4: energy.
- **D4 Mockup process.** HeroUI and installed libraries without per-element asks; new library,
  copy-in or dependency asked first; the chosen concept is recorded before it replaces a widget.

## 7. Design registry (record)

| Widget | Concept | Status | Date | Notes |
|---|---|---|---|---|
| Weather | A + B + C (all, as styles) | Built | 2026-11-19 | Owner liked all three: each ships as a style the user picks in the card's edit menu. Sky (B) is the default; Minimal (A); Trend (C), with the conditions made more visible (icon badge, icons along the hour line and bars). |
| Lighting | B (glow) | Built | 2026-11-19 | Wide reworked to use the space: count on one line, "All" beside a 2 × 2 grid of rooms. |
| Media | Mix of A, B, C | Built | 2026-11-19 | Small: A's layout on C's cover-tinted surface. Wide/Tall/Large: B's static cover on the blurred cover, with B's progress bar (always shown; players without a track length use the model's fallback while playing, else an empty bar with "--:--"), C's equaliser and, at Large, C's "Up next". Revised the same day: the turning record was replaced by the static cover; progress and controls aligned on one column. |
| Vacuums | B (floor) | Built | 2026-11-19 | Battery icon (level/charging, coloured) next to the percentage. |
| Family presence | B (portraits) | Built | 2026-11-19 | As in the studio. |
| Switches | B (plug board) | Built | 2026-11-19 | Tile dot pinned to the corner; long names break. |
| Fans | B (airflow) | Built | 2026-11-19 | Subtitle wraps at Tall. |
| Thermostat (new) | B (climate) | Built | 2026-11-19 | New widget in Climate; no details sheet yet. Revised 2026-11-20: the room name is a menu to choose the thermostat (saved in `preferences.proThermostatEntityId`). |
| Scenes (new) | C (palette) | Built | 2026-11-19 | New widget in Lights; names wrap to two lines; no details sheet yet. |
| Areas (new) | Mix: A + B's buttons | Built | 2026-11-19 | A's layout; B's pill buttons (favourites, "All areas") and B's lights button at every size. Favourites are `rooms.favoriteAreas`. Revised 2026-11-20: own **Rooms** section (not Climate); the room name opens the area page; menu adds "Open {area}" and "Choose favourites…" (sheet by floor). |
| Alarm | Mix: B + C's buttons and header | Built | 2026-11-19, revised 2026-11-20 | B's state-coloured card and layout; C's mode track. Revised: C's header (title 16/20 px, wraps instead of being cut off; B's subtitle kept) and soft lock colours (locked: white tile in the card's colour; unlocked: soft amber; jammed: soft red; white Lock button, glass Unlock; hold to unlock). |
| Cameras | A (framed) | Built | 2026-11-19 | As in the studio. |
| Doors & windows | B (draught) | Built | 2026-11-19 | As in the studio. |
| Safety | B (calm / alarm) | Built | 2026-11-19 | As in the studio. |
| Motion | C (the last hour) | Built | 2026-11-19 | Room names added at Small. |
| Energy now | Mix: A + B's colours | Built | 2026-11-20 | A's layout (headline, solar/grid rows, area chart at Large) on B's card coloured by what powers the home; the chart gets light tokens. Battery prominent, on this card only: a pill at Small/Wide, a big charge with a fill bar beside the headline at Large. New Small size. |
| Energy today | Mix: A + C | Built | 2026-11-20 | Small: A's labels (period, used, cost) under C's self-powered gauge as a half circle. Wide/Large: A's consumption (figures at Large; cost shown as "Credit €x" so four fit) with C's came-from/went-to bars. No battery (owner). Tall added 2026-11-20: the gauge, A's labels, then C's two bars with legends. |
| Energy flow | A (Sankey) | Built | 2026-11-20 | As in the studio. No battery (owner). |
| Door locks (new) | C (bolts) | Built | 2026-11-20 | Icons per lock and in the header; text never cut off; one lock: its bolt at Small. Section Security. |
| Car (new) | Mix: A + B's colours | Built | 2026-11-20 | A's layout on B's state colours; hold-to-start climate at every size (icon only at Small). Section People. |

### Pilot result: widget styles

- **Styles are per widget, per device layout.** A widget may offer `designs` (id, name, one-line
  description, a body that owns the whole card). The choice is stored in the device layout
  (`styles: { weather: 'trend' }`), saved with Save like size and order, and dropped on load if
  the widget no longer offers it. A phone and a wall display can wear different styles.
- **Designed cards** draw their own surface and corner details button (D2); the shared header
  is not used. In edit mode a frosted bar with the drag handle, title and "⋯" menu sits on top;
  the menu has a Style section for widgets with more than one style.
- **Real data:** each style has an empty state (no station) and falls back to days when a
  station has no hourly forecast.
- **Rule for later phases:** keep exploring three concepts in the studio, but ship more than
  one style only when the concepts are truly different; one style is the norm.
- Studio: `/overview?studio` (dev only). The Overview itself (`/overview`) uses the chosen designs.

### Phase 1 (2026-11-19): concepts in the studio

Three concepts each, with named states (mock data through the real model builders), in light and
dark, at the four phone sizes. The studio has a widget switcher and now scrolls on its own
(`#root` is fixed with overflow hidden).

| Widget | A (minimal) | B (immersive, recommended) | C (innovative) |
|---|---|---|---|
| Lighting | Light count, warm dot, rows with switches | Card glows warmer as more lights are on; room pills switch a room | Light map: a glowing dot per light, by room |
| Media | Neutral card, cover-coloured artist and play | The cover is the card (blurred behind, sharp on top) | Record in a progress ring, turning while playing; up next at Large |
| Vacuums | One state word, battery number | The card is the floor; robot sweeps, docks, floor turns red when stuck | Energy ring: battery fill, state colour, orbit while cleaning |
| Family presence | Home count, a line per person | Portraits of who is home, warmth grows with the house | House and orbit: home inside, others circling near or far |

Motion (sweeping robot, turning record, equaliser, breathing glow) runs only without
reduced motion.

Built (owner's choices in §7): each widget has one design, so it owns its card and shows no
style picker; the old bodies (`LightsBody`, `MediaBody`, `VacuumsBody`, `PresenceBody`) are
removed. Media's mix lives in `widgets/media/MediaCard.tsx`; the others ship their studio
concept B. Designed cards do not show the old header attention pill; Vacuums B shows trouble as
a red floor instead.

### Phase 2 (2026-11-19): concepts in the studio

Three concepts each, same rules as Phase 1. Thermostat and Scenes are new widgets: their models
are `lib/overviewThermostat.ts` (climate entities: mode, action, current, target or range,
humidity) and `lib/overviewScenes.ts` (scene entities; the scene activated in the last 4 hours
is "current"; a mood from the name picks its colour). They replace the dev placeholders only
after the choice.

| Widget | A (minimal) | B (immersive) | C (innovative) |
|---|---|---|---|
| Switches | Count and power headline, rows with switches | Plug board: dark panel of rocker tiles that light up and show watts (recommended) | Power share: one bar split by what each switch draws |
| Fans | Count and average speed, rows with switches | Airflow: mint card with moving air; blades and stream speed up with the fans (recommended) | Speed steps: off/low/medium/high per fan, tap to set |
| Thermostat | Room temperature headline, action line, −/+ | Climate: the card is ember while heating, icy while cooling, slate when idle | 270° dial with target, room dot and −/+ (recommended) |
| Scenes | Active scene headline, text buttons | Mood tiles: a wall of colour, active one glows (recommended) | Palette: round colour swatches, card tinted by the active mood |

Motion (fan blades, airflow) runs only without reduced motion.

Built (owner's choice, 2026-11-19): B for Switches ("plug board"), Fans ("airflow") and
Thermostat ("climate"); C for Scenes ("palette"). `SwitchesBody` and `FansBody` are removed.
Thermostat (Climate section) and Scenes (Lights section) are new registry widgets, so their dev
placeholders drop out; they have no details sheet yet, so their cards show no corner button.
Saved layouts gain them at the end of their section. Polish while wiring: plug-board tiles keep
their glow dot in the corner and break long words; palette names wrap to two lines.

### Phase 3 (2026-11-19): concepts in the studio

Same rules as before. Areas is a new widget asked for by the owner: quick buttons for favourite
areas and a menu of every area grouped by floor. There is no area page in the Pro UI yet, so
picking an area shows that area's status on the card (with its lights switch); its model is
`lib/overviewAreas.ts`. Sensor items now carry `lastChangedAt` (used by Motion C's timeline).
Details sheets are left as they are: they get redesigned at the end for every widget.

| Widget | A (minimal) | B (immersive) | C (innovative) |
|---|---|---|---|
| Areas (new) | The room as a quiet headline, favourites as plain buttons, figures at Large | Room photo: the area's own picture fills the card, favourites as glass pills, lights button (recommended) | The house: floors stacked, rooms as blocks that glow while lit |
| Alarm | Quiet headline, one button or the mode switch, locks as rows | Shield: the card is the state colour, pulsing red when triggered, glass mode buttons (recommended) | Key switch: modes as track positions beside a "ready to arm" checklist |
| Cameras | Framed: picture inset with a caption | Cinema: picture edge to edge, filmstrip and full screen at Large (recommended) | Wall of screens: several cameras, motion first in amber frames |
| Doors & windows | Count headline, open ones as rows with how long | Draught: calm green when shut, amber with glass chips when open | The board: every door and window as a panel by room (recommended) |
| Safety | "All clear" in quiet type, red headline when detected | Calm / alarm: cool card, red and pulsing when detected (recommended) | Sentinels: a ring per sensor, red when detected, dashed when offline |
| Motion | The room with movement as a headline, rooms as rows | Ripples: amber ripples from rooms with movement on a dusk card | The last hour: a lane per room on a 60-minute timeline (recommended) |

Motion (ripples, pulsing alarm) runs only without reduced motion.

Built (owner's choices in §7): the old `AlarmBody`, `CamerasBody` and `SensorGroupBody` are
removed. Alarm ships as `widgets/alarm/AlarmCard.tsx`, Areas as `widgets/areas/AreasCard.tsx`
(its menu and actions in `areas/concepts/shared.tsx`); the others ship their studio concept.
Areas sits in the Climate section after Weather; saved layouts gain it at the end of Climate.

### Phase 4 (2026-11-19): concepts in the studio, built 2026-11-20

The three energy widgets share one model, so they share the studio states: a made-up day built
with the real model builder (hourly buckets: a sun curve, a home that peaks morning and evening, a
battery that fills at noon and empties in the evening, tracked devices). States: sunny afternoon,
evening on battery, cloudy day, night importing, grid only. The studio marks the shared energy
store as loaded while open, so concepts show data instead of "Loading energy…". Energy now is
offered at Small too (it was Wide and Large only).

| Widget | A (minimal) | B (immersive) | C (innovative) |
|---|---|---|---|
| Energy now | Home draw headline, a row per source, area chart at Large | Power glow: the card takes the colour of what feeds the home, glass mix bar | Power ring: a ring split by source, home draw inside, outer ring for solar sold or stored (recommended) |
| Energy today | Used headline with cost, figures, hourly bars at Large | The day: a sky that is sunnier the more self-powered, the day drawn at Large (recommended) | In and out: two bars, where energy came from and where it went; money and top users at Large |
| Energy flow | The Sankey on a calm card | Leaderboard: glowing bars of the biggest users on a dark card | Energy map: blocks sized by what each device used (recommended) |

**Built (2026-11-20), owner's choices:** Energy now: A's layout on B's colours, with the battery
made prominent (pill at Small/Wide, big charge beside the headline at Large). Energy today: Small
is A's labels under C's self-powered gauge as a half circle; Wide/Large are A's consumption with
C's two bars. Energy flow: A. The battery appears on Energy now only. Shared battery parts are in
`widgets/energy/EnergyBattery.tsx`; the old `EnergyNowBody`, `EnergyTodayBody` and
`EnergyFlowBody` (and the Usage/Solar/Grid switch) are gone.

### New widgets (2026-11-20): Door locks and Car, built

**Door locks** (`locks`, model `lib/overviewLocks.ts`): every lock with its state, battery, who
changed it and when (`changed_by` / `method` attributes) and whether its door is open. Locking is
one tap; unlocking always needs a press and hold; a lock on an open door cannot be locked ("Lock
all" skips it). Soft tints as in the Alarm revision. States: all locked, back door unlocked, door
open with low batteries, jammed (and one offline), one lock, many locks, none.

| A (minimal) | B (immersive) | C (innovative) |
|---|---|---|
| Headline and a quiet row per lock with who/when and Lock or hold-to-Unlock; battery at Large | The padlock: one big padlock, shut on night blue, springing open on amber, red when jammed; glass tiles | Bolts: each lock is a deadbolt on a rail; tap to shoot it, hold to slide it back; jammed sticks halfway (recommended) |

**Car** (`car`, model `lib/overviewCar.ts`, built from the Mobility page's `deriveCarMetrics`): one
state out of driving, charging, warming up / cooling down, updating, on, plugged in / charged,
parked, asleep; plus battery and range with the charge target, charge power and time to full,
speed and gear, doors and windows, where it is (zone, map), cabin and outside temperature, a
software update (available or installing) and alerts (alarm, low battery, tyres, window open,
unlocked away from home, service). Unlocking the car needs a press and hold. States: parked at
home (asleep), charging, driving, parked away, warming up, update ready, updating, needs
attention, no car.

| A (minimal) | B (immersive) | C (innovative) |
|---|---|---|
| Status line: the state in words and one line, battery number and bar, quiet rows; Large adds the parked map and Lock / Climate | On stage: our own car drawing (or the owner's photo) on a card coloured by the state; charge flows down the cable, wheels turn, warmth rises; glass tiles and map at Large (recommended) | Instrument cluster: a dial (battery arc, target, speed and gear), telltales that light up like warning lights, a trip computer, the parked map at Large |

**Built (2026-11-20), owner's choices.** Door locks: C (bolts), with an icon per lock (front door,
garage, gate, shed, patio from the name or room) and in the header; text wraps and is never cut
off (lock names drop a trailing "Lock"; Wide hides the state line, the bolt says it); with one
lock, Small shows its bolt so it can be locked and unlocked there. Section Security
(`widgets/locks/`). Car: A's layout on B's colours; the climate start/stop button is on every
size (icon only at Small) and needs a press and hold, like unlocking; Large adds the parked map and
Lock. Section People, next to Family presence (there is no Mobility section on the Overview).
The hold logic is shared: `widgets/shared/useHold.ts` and `HoldButton.tsx`.

## 8. Details sheets (built 2026-11-20, owner-reviewed 2026-11-20)

The owner asked for every widget's details sheet to be redesigned and left the decisions to the
agent while away. Everything below is the agent's call, numbered so it can be reviewed one by one;
each can be changed without touching the others. The shared parts are in
`src/pro/widgets/shared/sheet/SheetKit.tsx`; the pure list helpers (`groupBy`, `matches`,
`SEARCH_FROM`) are in `src/pro/lib/sheetLists.ts` (tests: `tests/sheetLists.test.ts`). The old
sheets in `components/overview/*DetailSheet*.tsx`, `ControlWidgets` and `FansVacuumWidgets` were
removed; `ProSheet` stays (Security page, Add widgets, Favourite rooms).

**Shared frame**

1. **One frame for every sheet** (`DetailSheet`): a HeroUI Modal 40 rem wide on desktop (up to
   85% of the screen height, the body scrolls) and a bottom Drawer on phones (up to 92%). Same
   open/close as before: `?sheet=<widget>&id=<item>` in the URL, Back closes.
2. **A coloured hero on top** (`SheetHero`) instead of a title bar: small eyebrow (widget name),
   the **state in words as the headline** ("8 of 10 on", "Armed home", "Cooling to 21°"), one
   summary line, Close in the corner. The hero's colour follows the widget card (lamp amber,
   thermostat air, alarm colours, album colour, sky, car state…), so the sheet reads as the card
   opened up.
3. **The one or two main actions sit in the hero** as glass buttons (All on / All off, Lock all,
   Start / Dock, Play / Pause, Lights on / Open room). Everything else goes below.
4. **Below the hero: inset grouped lists** (`SheetSection` + `SheetRow`): icon, name, one quiet
   line, the control on the right. Tiles (`SheetTiles`) only for a handful of readings.
5. **Filter chips only when they help** (`SheetFilter`): a scrolling row (All / On / Off, a
   person, a station, a panel, a view). **Search only for long lists** (9 rows or more).
6. **Lists are grouped by room** (by floor for Rooms), "Other" last, each group with its own
   count ("1 of 2 on").
7. **Sliders send on release** (`SheetSlider`): one service call per drag, value shown beside it.
8. **Risky actions need a press and hold**: unlocking a lock (Locks, Alarm), car climate and car
   lock/unlock. Locking is one tap; a lock on an open door cannot be locked.
9. **Every widget has a sheet**: Thermostat, Scenes, Door locks, Car and Rooms (Areas) got one for
   the first time.

**Per widget**

10. **Lights and Switches share one sheet** (`widgets/controls/ControlSheet.tsx`): amber hero
    (blue for switches) while anything is on, slate when all off; All / On / Off; rooms as
    sections; a switch per row and, for lights that are on, a warm brightness slider.
11. **Fans**: teal hero; All / Running / Off; running fans get a speed slider and chips for
    oscillate, direction and preset.
12. **Vacuums**: hero colour by state; with one vacuum Start/Pause and Dock are in the hero; per
    vacuum: status, battery, room, area, time, suction choice, Start/Pause, Dock, Locate.
13. **Thermostat**: hero is the card's "air"; −/+ stacked in the hero; "Show on the card" picks
    the widget's thermostat; a filter switches thermostat; a mode filter sets the HVAC mode;
    readings, then all thermostats.
14. **Scenes**: mood-gradient hero; scenes by room as colour swatches with Activate (or "Run
    again" for the last one).
15. **Weather**: sky hero with the condition icon; station filter; next hours as a strip; next
    days with a low–high bar; a "Now" grid of readings.
16. **Family presence**: hero green when everyone is home, blue when some are, night when nobody
    is; a person filter; the map; that person's status, last update, battery and an
    OpenStreetMap link; then everyone.
17. **Door locks**: hero green / amber / red by the worst lock; Lock all; locks by room with Lock
    or hold-to-Unlock; a low-battery note.
18. **Car**: hero in the car's state colour with charge and range on the right and a charge bar;
    hold-to-confirm climate and lock in the hero (off while driving, with a note); sections:
    Needs attention, Battery, the parked map (not while driving), Car.
19. **Alarm**: the alarm-coloured hero holds the full mode track (Off / Home / Away / Night…, PIN
    sheet when HA needs a code); panel filter; Doors & windows (with "All" to that sheet); Locks
    with Lock all and hold-to-Unlock.
20. **Motion, Safety, Doors & windows**: each sheet shows **only its own group** (the old shared
    inspector switched between all kinds); a filter of All / active / each kind; read-only rows
    by room.
21. **Cameras**: the hero **is the live picture** (status badge, Snapshot, Full screen, Close on
    the video); every camera below as a still to switch to. No cameras: a slate hero with a note.
22. **Media**: album-coloured hero with the cover and previous / play-pause / next; player filter;
    playback (scrubber, volume, shuffle, repeat); up next; source and sound mode; speakers by
    room with Show and a power switch.
23. **Energy: one sheet with views** (Now / Usage / Solar / Flow / Balance) instead of three
    sheets; Energy now, Energy today and Energy flow each open it on their view; a Today / Week /
    Month choice that **resets to Today when the sheet closes**; tiles, the view's chart, the
    biggest users with share bars, and "Open the Energy page".
24. **Rooms (Areas)**: opened from a new "{room} details" item in the card's room menu (a corner
    button would cover the menu); hero is the room's picture (or teal / amber) with the
    temperature; Lights on/off and Open room; a filter of favourite rooms; readings, what is
    going on, the room's lights with switches; every floor's rooms with Show and a favourite star
    (writes `rooms.favoriteAreas`, the same setting as "Choose favourites…").

Checked in the browser (demo data, dark theme): all 20 sheets on desktop; Lights, Energy, Alarm,
Media, Car and Thermostat on a phone. Not checked: light theme, a live Home Assistant, a real
camera stream.

### Owner review (2026-11-20)

The owner went through the 24 calls one by one. Kept as built: 2–11, 14, 22, 23. Changed and
built the same day:

| # | Owner's answer | Built |
|---|---|---|
| 1 | Side panel on desktop | `DetailSheet` is a right-side Drawer (36 rem, full height) from 768 px, like Notifications; bottom Drawer on phones unchanged |
| 12 | Add room cleaning and the recent map | "Clean rooms": pick HA areas (the vacuum's floor first), one run via `vacuum.clean_area` (`cleaning_area_id`, HA 2026.3+; the vacuum's segments must be mapped to areas in HA, which reports it in a toast otherwise). "Map": the vacuum's latest map image (camera / image entity), a choice when it has several. `widgets/vacuums/VacuumExtras.tsx` |
| 13 | Add a history chart | "Last 24 hours": room temperature (area line, ember, icy while cooling) and target (dashed steps), from HA history with attributes; a generated day in demo mode. `lib/climateHistory.ts`, `widgets/thermostat/ThermostatHistory.tsx` |
| 15 | Rain chart, also in the widget; smoother rain | Sheet: "Chance of rain" bars for the next 12 hours (next days for daily-only stations). Sky widget (Wide, Large): a thin rain meter under each hour when rain is likely. Rain animation redone: two layers of drawn drops moved by exactly one tile per loop (no jump), still with reduced motion. `widgets/weather/RainChance.tsx`, `pro.css` |
| 16 | Everyone on the map | The map frames every person with a location; the chosen person is highlighted (`PresenceMap` `fitAll`) |
| 17 | Recent activity; redesign the widget's unlock | Sheet: "Recent activity" from the HA logbook (shared `RecentEvents`). Widget: **swipe to unlock**: drag the bolt back along its rail to the end; let go early and it springs back; a tap on the rail nudges it as a hint; arrow keys step it a quarter (Escape resets). Locking stays a tap. `widgets/shared/useSlideToConfirm.ts` |
| 18 | Map always | The car's map shows while driving too ("Where it is now") |
| 19 | Recent events | Arming, disarming and triggers of the last 24 hours |
| 20 | Last-triggered times | Every row says when it last did something ("Last motion 5 min ago", "Opened 2 h ago", "Clear since…"); rooms and rows most recent first, active first. `lib/sensorTimes.ts` |
| 21 | Motion events | "Seen by {camera}": the last 24 hours of the camera's motion and AI detection sensors (same device, or the camera's name in the sensor id). `lib/cameraSensors.ts` |
| 24 | Corner button too | The Rooms card has the corner details button at every size; the room menu moved left of it; "{room} details" stays in the menu |

Demo data has no change times or logbook, so Recent activity and the sensor times show their
empty wording there; a real Home Assistant fills them.

### Follow-up fixes (owner, 2026-11-20)

- **Weather (Sky):** snow is now two layers of flakes of different sizes falling with a slight
  sway, on a darker snow sky so white type stays readable; partly cloudy is a clearer blue with
  the sun behind a drawn cloud; storms get a dark cloud bank, heavier rain and an occasional
  lightning flicker (two quick flickers about every 9 s, none with reduced motion). Clouds are
  soft blurred haze that drifts slowly, not drawn shapes (the owner found drawn clouds ugly);
  storms darken the top of the sky instead (`WeatherConceptB.tsx`, `pro-sky-*` in `pro.css`).
- **Switches (plug board):** lit tiles ran into each other; the glow now stays inside each tile
  and the gap between tiles is wider.
- **Weather (Trend, design C):** rain, snow and storm now move behind the line and bars too
  (`widgets/weather/WeatherFx.tsx`): the Sky design's drops and flakes as a mask tinted for the
  plain card (blue on light, pale on dark), faint so the chart stays readable; storms flash softly.
