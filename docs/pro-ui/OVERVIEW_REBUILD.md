# Overview rebuild plan

Status: **Phase 5 (cutover) done (2026-11-20): `/overview` is the rebuilt page. Next: Phase 6, verification [review].** Phase 3 done; Energy (3e) approved by the owner (2026-11-19). Phase 0 approved by the owner: Flow reorder, one "⋯" edit menu, sections side by side on desktop.
Scope: `src/pro/` only. The classic UI (`src/components/*`) and its config keys stay untouched.

## Owner decisions (2026-11-19)

| Topic | Decision |
|---|---|
| Placement and reorder | **react-grid-layout v2** (already a dependency, 2.2.4), used by the pro UI on its own. A real snapping grid: drag a card and the others move and close gaps. |
| Resize | **Size menu + snapping corner drag.** Every card has a size menu (touch, mouse, keyboard); on desktop the corner can also be dragged and snaps to the allowed sizes. |
| Sections | **Sections are the tabs.** Automatic domain sections. "All" stacks every section; a tab shows only its section. No grouping toggle. Sections can be reordered and collapsed. |
| Layouts | **One layout per device type** (phone, tablet, desktop/wall), each with a good default. Edits are a draft: **Save** writes, **Cancel** discards. |
| Rebuild scope | All eight points from the review: widget modules, one layout system, fewer widgets, clear tap rule, linkable sheets, draft edit mode, summaries said once, one chart library. |

## What is wrong today (why this is a rebuild)

- `ProOverview.tsx` (about 600 lines) builds every widget model from one subscription to all HA
  states, picks bodies through an if-chain and feeds `ProOverviewSheets` about 40 props.
- Three layout systems on top of each other: tab filters, an optional grouped view and a
  measured masonry grid (`useMasonryRowSpan`) with a hand-made corner resize and nested dnd-kit.
- Resize and reorder feel loose: masonry measuring moves cards after render, drop targets are
  hard to predict, and sizes are only 1x / 2x / 2x2.
- Every edit is saved to the shared config at once, so other screens change mid-edit.
- Energy alone has 8 widgets; the same counts show in pills, tab badges and section headers.

## Target design

### 1. Widget modules and registry

Each widget is one folder, `src/pro/widgets/<id>/`, exporting a definition:

```ts
defineWidget({
  id: 'lights',
  section: 'lights',                       // which tab/section it lives in
  title: 'Lighting', icon: LightBulbIcon,
  sizes: ['s', 'w', 'l'],                  // allowed sizes, see the size table
  defaultSize: 'w',
  useModel,                                // subscribes only to its own entities
  Body,                                    // ({ model, size, actions }) => card content
  Sheet,                                   // detail sheet, lazy loaded
  attention,                               // optional: (model) => pill | null
  fixture,                                 // demo model for tests and demo mode
});
```

- `src/pro/widgets/registry.ts` lists them. The page, Add widgets sheet, sheets host and tests
  all read the registry; adding a widget means adding one folder.
- Per-widget data: `useModel` selects only the entity ids the widget needs. The HA store merges
  updates as `{ ...prev.states, ...map }`, so unchanged entities keep their object identity and a
  shallow selector skips re-renders. A light change re-renders the Lighting card only.
- Model builders stay pure and tested (most of `src/pro/lib/overview*.ts` moves over as is).
- Actions come from a small per-widget hook (today's `useProOverviewActions`, split by domain).

### 2. Layout engine

- **Grid:** one `ResponsiveGridLayout` per section, vertical compacting, fixed row height.
  Columns per device type: phone 2, tablet 4, desktop/wall 6 (to confirm in the spike).
- **Sizes** (grid cells, width × height):

  | Size | Cells | Use |
  |---|---|---|
  | Small `s` | 1 × 1 | one value, one action |
  | Wide `w` | 2 × 1 | value + short list or row of controls |
  | Tall `t` | 1 × 2 | list |
  | Large `l` | 2 × 2 | chart, camera, full controls |

  Each widget declares which sizes it supports and its Body is designed for each one (the
  4-row tile rule). No measuring, no content-driven heights.
- **Reorder:** drag a card by its handle in edit mode; the grid moves the others and closes
  gaps. Keyboard: pick up with Space, arrows to move, Space to drop, Escape to cancel.
- **Resize:** size menu on every card in edit mode (the only way on touch). On desktop the
  corner drag snaps to the allowed sizes only.
- **Sections:** fixed by domain, in this default order: Climate, People, Lights, Switches,
  Energy, Security, Cameras, Doors & windows, Media, Vacuums. "All" stacks the sections; a
  tab shows its section full width. Sections can be reordered (sortable list in edit mode) and
  collapsed. A widget never moves between sections.
- **Open question for the spike:** on "All", sections with one or two small widgets would
  leave empty space at 6 columns. Proposed: sections take the width they need and sit side by
  side on wide screens (the outer flow is a plain CSS grid, not a second drag grid).

### 3. Per-device layouts and draft edit mode

- New config key `proOverviewLayout` (classic `overview.*` keys are left alone):

  ```ts
  {
    version: 1,
    phone:   DeviceLayout,
    tablet:  DeviceLayout,
    desktop: DeviceLayout,
  }
  DeviceLayout = {
    sectionOrder: SectionId[],
    collapsed: SectionId[],
    hidden: WidgetId[],                    // not on the page at all
    items: Record<SectionId, { i: WidgetId; x: number; y: number; size: Size }[]>,
  }
  ```

- Device type comes from width (phone < 768, tablet < 1280, desktop otherwise); a screen can
  pin its type in settings (for a wall tablet).
- A missing layout is built from the registry defaults. A one-time migration reads today's
  `tileOrder` / `tileSizes` / hidden lists so nobody loses their arrangement.
- **Edit mode is a draft** in a zustand store: nothing is written until Save. Cancel or Escape
  discards. Leaving the page with unsaved changes asks first. "Reset to default" per device type.
- Saving writes once through `updateConfig`; other screens get it by the existing SSE fan-out.

### 4. Fewer, richer widgets

| Today | New |
|---|---|
| Power flow, Power flow (12h), Energy usage, Energy usage (hourly), Solar production, Solar forecast, Grid balance & gauges, Energy flow (8) | **Energy now** (flow + gauges), **Energy today** (usage / solar / grid view switch), **Energy flow** (Sankey) (3) |
| Weather & 3-day forecast, Hourly forecast (2) | **Weather** (sizes reveal hourly and daily) (1) |
| Entry doors, Windows | **Openings** (view switch) |
| Water leaks, Smoke & fire | **Safety** |
| Lights, Switches, Fans, Vacuums, Media, Alarm, Cameras + pinned cameras, Motion, Family presence | kept, rebuilt on the new contract |

About 15 widgets instead of 22. Merges are a recommendation; confirm at the Phase 0 review.

### 5. Tap rule

- The **card header** (icon, title, chevron) is the one target that opens the details sheet.
- The **body** holds controls only and never opens the sheet.
- No click guards and no stopPropagation; `CARD_CLICK_IGNORE` and the 23
  `data-card-click="ignore"` markers go away.

### 6. Linkable sheets

- The open sheet lives in the URL: `/overview?sheet=lights`, `?sheet=camera&id=camera.porch`.
- Opening pushes history, so the phone back button closes it; notifications and toasts can link
  straight to a sheet. One sheet at a time follows from the URL.
- Sheets are lazy loaded from the registry.

### 7. Summaries said once

- **Tab badges** carry the counts ("Lights 8").
- **Pills** show only things that need attention (open door, leak, smoke, alarm triggered or
  arming, low vacuum battery), from each widget's `attention()`.
- **Section headers** show the title and the open-tab button, no counts.

### 8. One chart library

- The pro UI already draws every chart with bklit (`src/pro/ui/bklit`); nothing in `src/pro`
  imports recharts or visx directly. Rule: pro widgets use bklit only, and a lint-style test
  (like `rawControlGuard`) blocks recharts/visx imports under `src/pro`.

## Phase 0 results (2026-11-19)

Try it: dev server, `/overview?spike` (dev builds only; not in the production bundle). Seven dummy
widgets in Climate, Lights and Energy. Layouts are kept in memory; Save never writes the config.

Built:
- `src/pro/lib/overviewLayout.ts`: sizes, device types and columns, dense packing, defaults,
  `normalizeDeviceLayout` (stored config is untrusted), the one-time migration from
  `overview.tileOrder` / `tileSizes` / `hiddenTiles` / `proOverviewSectionOrder`, and read/write
  helpers for `preferences.proOverviewLayout`. Tests: `tests/overviewLayout.test.ts`.
- `src/pro/widgets/types.ts`: the widget contract draft (`defineWidget`).
- `src/pro/pages/ProOverviewSpike.tsx` + `src/pro/components/overviewSpike/`: the spike.

Checked in the browser (demo mode):
- Drag by handle reorders; the corner snaps live to allowed sizes and a size a widget doesn't
  allow is refused (Thermostat stays Small); the size menu sets any allowed size.
- Arrow keys on the handle move a card; focus stays on it.
- Save / Cancel / Reset, hide and Add back, collapse, section up/down, `?sheet=` + back button.
- Your current Overview arrangement migrates (Lighting came across as Small, as you have it).
- Phone 2 columns, tablet 4, desktop 6; sections side by side on desktop; no sideways scroll.

Findings and proposals:
1. **Reorder feel.** react-grid-layout ships two: *Free* (vertical compaction: cards stay where
   dropped, others fall up, holes can stay) and *Flow* (`wrapCompactor`: reading order, like
   iOS). The spike has a switch. Proposal: **Flow**; arrow keys then step a card earlier/later.
2. **Drag handle.** A HeroUI Button can't be the handle: react-aria stops pointer propagation,
   so the grid never sees the drag. The spike uses a focusable span with arrow keys. Phase 2
   needs a proper accessible handle (react-aria `useMove`/`useFocusable` on a span, plus an
   announced "Move" mode), since raw `<button>` and `role="button"` are blocked by the guard.
3. **Edit controls on small cards.** On a phone a Small card is about 165 px wide; handle, size
   and hide at 44 px leave no room for the title. Proposal: handle + one "⋯" menu (sizes, hide).
4. **Touch.** `src/index.css` sets `touch-action: manipulation` on controls; the handle needs
   `touch-action: none` inline, now done. A real touch drag is **not verified** (the in-app
   browser sends mouse events); the Phase 0 risk stands until tried on a phone or tablet.
5. **Measuring.** `useContainerWidth` measures once on mount, so the edit grid is its own
   component mounted with edit mode. View mode is a plain CSS grid with the same cells:
   nothing measures or moves when not editing.
6. **Columns.** 6 columns are too narrow below 1280 px (titles truncate); the device thresholds
   hold (phone < 768 → 2, tablet < 1280 → 4, desktop → 6). Row height 148 px, gap 12 px.
7. **Dev only:** the first load after adding react-grid-layout needs one reload (Vite
   re-optimizes dependencies).

Open for the owner: Flow or Free (1), the "⋯" edit menu (3), sections side by side on desktop
(on in the spike).
Owner decisions on the review (2026-11-19): Flow, the "⋯" menu, sections side by side on desktop.

## Phase 1 results (2026-11-19)

- **Registry** `src/pro/widgets/registry.ts` (`WIDGETS`, `WIDGET_BY_ID`, `WIDGET_LAYOUT_INFO`,
  `LEGACY_WIDGET_IDS` for the migration) and the contract `src/pro/widgets/types.ts`.
- **Per-widget data** `widgets/shared/entities.ts` (`useDomainEntities`): the store keeps a
  domain array's identity while none of its entities change, so a widget re-renders only for its
  own domain (tested in `tests/widgetRegistry.test.ts`). `widgets/shared/useServiceCall.ts` gives
  action hooks a stable `call` and an optimistic `setOptimistic`.
- **Pilot widget: Lights** `widgets/lights/` (model hook, `controls/useControlActions`, fixture,
  body for Small / Wide / Tall / Large; the sheet is the current control sheet until Phase 3a).
- **Draft store** `store/useOverviewLayoutDraft.ts` and `hooks/useOverviewLayout.ts`.
- **Device type** `hooks/useDeviceType.ts`: from width, or pinned per screen (localStorage).
- **Sheets in the URL** `hooks/useSheetParam.ts` (one shared store, `sheetHref` for links) and
  `components/overviewNext/WidgetSheetHost.tsx` (lazy sheet from the registry).

## Phase 2 results (2026-11-19)

Try it: dev server, `/overview?next` (dev builds only). Real widgets from the registry (Lights)
plus dev placeholders (`widgets/devPlaceholders.tsx`) for the ones not ported yet. Unlike the
spike, **Save writes this device type's layout** to `preferences.proOverviewLayout`; the dev-only
"Forget saved layouts" button removes them again.

Built (`src/pro/components/overviewNext/`):
- `OverviewEngine`: sections in the user's order, side by side in view mode, one section for a
  tab (`onlySection`, used in Phase 4). Every edit goes to the draft.
- `SectionGrid`: view mode is a plain CSS grid; edit mode is react-grid-layout with a cell
  background and a spare drop row, the drag handle, and the snapping corner (fine pointers).
- `flowCompactor`: **our own Flow**. react-grid-layout's `wrapCompactor` overlaps mixed sizes
  (a 2×1 landed on a 2×2 in a test), so Flow is `flowCells` in `lib/overviewLayout.ts`: reading
  order, each card in the first free spot after the previous one (CSS grid without `dense`).
  The dragged card wins a tie, so dropping on a card's spot takes it.
  **Revised 2026-11-20 (owner): free placement for edits.** `makeSettleCompactor` uses
  `settleCells`: the card in hand stays where it is dropped (a row may be left part empty), the
  others start from their pre-drag cells and only step down to make room, empty rows close up.
  Move earlier/later trades places with the neighbour; resize keeps the cell; Add and new
  widgets go on a new row. Defaults and migration still use Flow.
- `WidgetCard` + `WidgetCardMenu`: the header opens the sheet; in edit mode a drag handle
  (pointer only), the "⋯" menu (Size with a check, Move earlier / later, Hide) and the title on
  its own line; the body is `inert` while arranging. The menu is the keyboard and screen-reader
  path for everything a drag does, which settles Phase 0 finding 2 without a hand-made control.
- `OverviewSection` (collapse; up/down in edit mode), `EditToolbar` (Customize → Add widgets,
  Reset, Cancel, Save; Save is off until something changed), `AddWidgetsSheetNext` (registry by
  section, hidden ones have Add).
- Pure edit operations in `lib/overviewLayout.ts` (`flowPlacements`, `moveInFlow`,
  `resizeInFlow`, `appendToFlow`, `hideWidget`, `showWidget`, `moveSection`,
  `toggleSectionCollapsed`, `sectionSpan`); hidden widgets never get a place. Tests:
  `tests/overviewLayout.test.ts`, `tests/overviewLayoutOps.test.ts`.
- Collapse is a view preference: it saves at once in view mode, joins the draft in edit mode.
- The spike page and its components are removed.

Checked in the browser (demo, tablet width, then phone in light mode):
- Drag Thermostat onto Weather's spot → it takes first place; others re-flow.
- "⋯" → Large re-flows the section; Hide → Add widgets (1) → Add puts it back at the end.
- Move a section up, Save, reload: order, sizes and sections persist. Cancel discards a draft.
- Collapse in view mode persists across reload. Phone pin shows the separate phone layout.
- Phone: no sideways scroll, every title readable in edit mode. The current `/overview` is
  unaffected. Test layouts were removed afterwards with "Forget saved layouts".

Not verified: a real touch drag (still the open Phase 0 risk), the leave-page prompt for
unsaved edits, and a full keyboard-only pass through the menu.

## Phase 3a/3b results (2026-11-19)

Real widgets in `src/pro/widgets/<id>/` (registry order: weather, fans, users, lights, switches):
- **Lights**, **Switches** (s/w/t/l; Switches shows live power "1.4 kW now") and **Fans** (s/w/t/l;
  speed, oscillate, direction, preset) share `controls/ControlParts.tsx` (toggle, rows, footer).
- **Weather** merges `weather` and `weather_hourly` (legacy id mapped). s = now, w = now + 3 days,
  t = now + hourly rows, l = 6-hour grid + 3 days + now.
- **Family presence** (id `users`, People section): avatars open `?sheet=users&id=<person>`.
- Sheets are the existing detail sheets wrapped (`ControlDetailSheet`, `FansDetailSheet`,
  `WeatherDetailSheet`, presence sheet), lazy loaded.
- Tests: `tests/overviewWidgetsPhase3.test.ts`.

Checked in the browser (demo, tablet): all five render at default and larger sizes (Weather
Large, Fans Tall, Presence Large) without overflow; a person deep link opens the sheet and Back
closes it. Test layouts removed afterwards with "Forget saved layouts".

For cutover (Phase 5): move `weatherConditionIcon` and `PersonAvatarBadge` out of the old
`components/overview/*` widgets into `src/pro/widgets/`.

## Phase 3c results (2026-11-19)

- **Doors & windows** (`openings`), **Safety** (`safety`, leak + smoke) and **Motion** (`motion`)
  share one model and body in `src/pro/widgets/sensors/`. Small: headline. Wide: + badge.
  Tall/Large: three rows, active first; Openings and Safety get an All / Doors / Windows (or
  Leak / Smoke) view switch. Tall rows show the state as an icon only. Safety gets a moving
  border on an alert. Binary sensors are classified once per array (shared by all of them).
- **Alarm** (Security section): Small = state + Arm home / Disarm; Wide = mode switch;
  Tall = quick button + "N open" + "Lock N"; Large = lock rows + mode switch. Code and "arm
  anyway" dialogs are the shared ones. "N open" opens the Doors & windows sheet.
- **Cameras** (sizes s / w / l): the picture fills the card; Wide adds previous/next, Large
  streams live with camera chips, snapshot and full screen. `?sheet=cameras&id=<camera>` opens
  the sheet on that camera.
- Legacy ids: `doors`, `windows` → `openings`; `leak`, `smoke` → `safety`. A merged widget
  migrates as hidden only when every widget it replaces was hidden.
- `attention` is filled for Openings (open), Safety (alert) and Alarm (triggered), for the Phase 4
  attention pills.
- Tests: `tests/overviewWidgetsPhase3c.test.ts`.

Checked in the browser (demo, tablet): all five render; Alarm Large, Motion Tall and Doors &
windows Large fit after capping rows at three; the view switch filters; Alarm "2 open" opens
`?sheet=openings` and Back closes it. Cameras showed its empty state only: the demo has no
camera stream sources, so the snapshot/live bodies are not checked in the browser yet. Test
layouts removed afterwards with "Forget saved layouts".

## Phase 3d results (2026-11-19)

- **Media**: Small = cover, title, play/pause; Wide = + artist, player, previous/next; Tall = big
  cover; Large = + waveform scrubber and volume. Album-art colours, cover, transport and volume
  are the shared pieces. The chosen player lives in a small store shared by card and sheet;
  `?sheet=media&id=<player>` picks it.
- **Vacuums** (busiest first): Small = status, battery, Clean/Pause; Wide = name, room, battery,
  Clean/Pause and Dock on one row; Tall = stacked; Large = + suction, session and other vacuums.
- Both need the whole store (device classification, battery and room sensors). New
  `useDerivedModel` rebuilds the model on each store change but renders only when its
  fingerprint changes, so sensor ticks elsewhere don't re-render these cards.
- Widget cards are now positioned (`relative`): the media album-art wash and the alert border
  stay inside their card instead of covering the page.
- Error boundaries: each card (and its body) has its own, and the sheet host closes a sheet that
  fails to load (e.g. a chunk gone after a deploy) instead of showing the root error screen.
- Tests: `tests/overviewWidgetsPhase3d.test.ts`.

Checked in the browser (demo, tablet): all four sizes of both fit after three fixes (Wide
vacuum controls on one row; Tall vacuum status under the name; Small vacuum without the status
line; Tall media cover capped at 96px). Both sheets open from the header, Back closes them, and
choosing a player in the media sheet updates the card. In demo mode a saved layout lives in the
browser for that origin, not in the server config.

## Phase 3e results (2026-11-19) — approved

Eight energy widgets become three (`src/pro/widgets/energy/`):

| Old | New |
|---|---|
| Power flow, Power flow (12h) | **Energy now** (w, l; default l) |
| Energy usage (+ hourly), Solar production (+ forecast), Grid balance & gauges | **Energy today** (s, w, l; default w) |
| Energy flow | **Energy flow** (l only) |

- **Energy now**: live home load and a "clean / exporting" badge. Wide: one row of solar /
  grid / battery now. Large: the animated distribution diagram in its live (kW) mode.
- **Energy today**: Usage / Solar / Grid switch (views a home lacks are left out). Small: kWh
  used. Wide: the view's numbers (Grid adds the import/return bar). Large: the view's chart
  (usage bars, solar vs forecast, or self-sufficiency and solar self-use gauges).
- **Energy flow**: the full Sankey (sources → home → areas → devices), filling the card.
- One fetch: `EnergyDataBridge` runs `useEnergyData` once and publishes the model to a small
  store, only when it changes. The page mounts it (`EnergyDataMount`) only while the layout
  places an energy widget or an energy sheet is open. Loading / not set up / error show a
  one-line state instead of zeros.
- Sheet: the existing energy sheet, opened on the widget's view (`&id=solar_production` etc.).
- Legacy ids: `power_flow`, `power_flow_chart` → `energy_now`; `energy_usage(_chart)`,
  `solar_production(_chart)`, `energy_gauges` → `energy_today`.
- Tests: `tests/overviewWidgetsPhase3e.test.ts`.

Checked in the browser (demo, tablet): all sizes fit after two changes (Wide Energy now uses
one row of chips; Energy flow dropped Wide, where a Sankey is unreadable). The sheet opens on
the right view, changing its period updates the cards, Back closes it.

**Owner decisions (2026-11-19):**
1. ~~The period chosen in the sheet is shared, so "Energy today" could show a week.~~
   **Decided (owner, 2026-11-19): reset to Day when the sheet closes** (X, Back or Escape). Done
   and checked in the browser: Week while open, back to today after Back.
2. Energy flow stays Large only. **Kept as built.**
3. The card keeps two gauges (self-sufficiency, solar self-use); net grid and clean share stay
   in the sheet's Gauges view. **Kept as built.**
4. The 12-hour power chart lives only in the sheet (Power view). **Kept as built.**

Seen while checking, not from this work: React logs "Expected static flag was missing" twice on
every page (also on `/rooms`, which has no energy code).

## Phase 4 results (2026-11-20)

- **Shell** (`components/overviewNext/OverviewShell.tsx`) around the engine. The dev panel on top
  of `/overview?next` stays until cutover.
- **Counts and pills come from the widgets.** `WidgetDefinition.count(model)` (new) and
  `attention(model)`. `WidgetProbes` mounts one invisible probe per widget on the page that runs
  its model hook and reports to `hooks/useWidgetStatus` (zustand), so tabs and pills are right
  for sections on other tabs or collapsed. Pure logic in `lib/overviewShell.ts`.
- **Tabs**: "All", then one per section on the page, in the user's order (Rooms and People are
  tabs of their own now). A tab's number is the sum of its widgets' counts (lights on, switches
  on, fans running, thermostats active, people home, doors/windows open, leaks/smoke, motion,
  locks unlocked or jammed, media playing, vacuums cleaning); it turns warning/danger when
  something in the section needs attention. "All" carries nothing (the pills say it). Kokonut
  `SmoothTab` with a new `badges="always"` option. The tab is in the URL (`?tab=security`,
  replaced, not pushed); an emptied tab falls back to All; editing is always on All. A tab shows
  its section full width and expanded. Section headers lose counts and get a "show only" arrow.
- **Attention pills**: only problems, worst first: alarm triggered (danger) or arming/pending,
  doors/windows open, leak/smoke, jammed lock (danger) or low lock battery, car danger alerts,
  vacuum error or low battery away from the dock. A pill opens the widget's sheet (or its tab
  when it has none). No problems: one quiet "Nothing needs attention" line.
- **Empty state**: no widgets on the page says so, with Add widgets and Restore default layout
  (both go through the draft: Save to keep).
- **Demo mode**: HA service calls are no-ops in demo, so `useServiceCall` now applies the state
  a real HA would report (`lib/demoServices.ts`: on/off/toggle, lock, alarm modes, covers, media
  play/pause, vacuum, climate mode/target, scenes). A quiet "Demo home: changes stay on this
  screen" note sits beside the pills.
- Tests: `tests/overviewShell.test.ts`.

Checked in the browser (demo, desktop and phone): tabs with counts, Security tab alone with
`?tab=security`, the "2 open" pill opens the Doors & windows sheet, locking a demo lock turns the
card to "All locked" and the Security count from 2 to 1. Not checked in the browser: the empty
state (needs every widget hidden) and light mode (the theme toggle writes the shared config).

## Phase 5 results (2026-11-20)

- `/overview` renders the rebuilt page (`pages/ProOverview.tsx`); `ProOverviewNext` and the
  `?next` dev route are gone. The dev panel went with it: Customize sits beside the tabs, and
  the per-screen device-type pin moved into the Customize bar (switching it cancels the draft,
  since a draft belongs to one device type). Escape cancels editing when no sheet is open.
- Removed (nothing reached them any more; checked with an esbuild metafile from `src/pro/main.tsx`
  plus an import grep over `src`, `tests` and `scripts`): `components/overview/`
  `OverviewWidgetGrid`, `OverviewGroupedGrid`, `SortableWidgetCard`, `StatusPillsBar`,
  `ProOverviewSheets`, `memoWidgetBodies`, `AddWidgetsSheet`, `widgetIcons`, `EnergyWidgets`,
  `MediaWidget`, `SecurityAlarmCameraWidgets`; `hooks/useProOverviewModels`, `useProOverviewActions`,
  `useProOverviewLayout`; `lib/overviewSheets`, `lib/overviewWidgetSummaries`;
  `widgets/devPlaceholders`; the grouped-grid helpers in `lib/overviewSections` (and their tests).
- Kept on purpose: `useMasonryRowSpan` (BentoGrid on the Security page), `lib/overviewTabs` (the
  classic `useOverviewHeaderState` imports it), `lib/overviewWidgets` and the old widget bodies
  that the new widgets and sheets still reuse (`ControlWidgets`, `WeatherWidgets`, … and the
  detail sheets; they go when the sheets are redesigned), `pageHeaderContext` (shell menu slot).
- DESIGN.md 7.6 rewritten for the rebuilt page; decision-log row added; HANDOFF.md updated.


## Phases

Each phase ends with `npm run lint && npm test && npm run build:pro` and a browser check on
phone and desktop, light and dark. Owner review gates are marked **[review]**.

0. **Spike and contracts** **[review]**
   - Separate page behind a dev flag with three dummy widgets on react-grid-layout v2: drag,
     snap resize, size menu, keyboard moves, touch on phone width, 2 / 4 / 6 columns.
   - Settle the widget contract, sizes, columns, row height and the "All" section flow.
   - Write the `proOverviewLayout` types and the migration, with tests.
1. **Foundations**
   - Registry, `defineWidget`, per-widget model and action hooks, fixtures.
   - Layout draft store (edit, save, cancel, reset), device-type detection.
   - URL sheet state and the lazy sheets host.
2. **Layout engine**
   - Section grids, section reorder and collapse, size menu, snapping corner, drag handle,
     keyboard reorder, edit toolbar (Add widgets, Reset, Cancel, Save).
   - New Add widgets sheet from the registry (grouped by section).
3. **Widgets, in batches** (each: model hook, sizes, header-opens rule, sheet, fixture, tests)
   - a. Lights, Switches, Fans
   - b. Weather (merged), Family presence
   - c. Alarm, Cameras, Openings (merged), Safety (merged), Motion
   - d. Media, Vacuums
   - e. Energy now, Energy today, Energy flow **[review]**
4. **Page shell**: tabs with counts, attention pills, empty states, demo mode.
5. **Cutover and cleanup**
   - Switch `/overview` to the new page; remove the old grid, `SortableWidgetCard`,
     `OverviewGroupedGrid`, `memoWidgetBodies`, `useProOverviewModels`, `useMasonryRowSpan`
     (if nothing else uses it) and the old sheets host.
   - Rewrite DESIGN.md 7.6, add decision-log rows, update HANDOFF.md.
6. **Verification** **[review]**
   - Drag and resize on a real touch device, live HA, three device types, config migration from
     a real `dashboard-config.json` copy, another screen receiving a saved layout.

## Risks

- react-grid-layout v2 touch dragging inside a scrolling page: the spike must prove it on phone
  width; fallback is reorder by size menu "Move" actions on phones.
- Migration: old tile sizes (1x / 2x / 2x2) map to s / w / l; old masonry order becomes a
  row-by-row placement. Tested against a real config copy before cutover.
- The classic UI reads `overview.*`; the new key keeps it untouched.

## Relation to the Rooms page

Rooms (accent hue 192) should reuse the widget modules and the section grid. Proposed order:
Phases 0–2 first, then the Rooms proposal, so both pages are built on the same parts.
