# Overview rebuild plan

Status: **Phase 1 foundations built** (2026-11-19). Phase 0 approved by the owner: Flow reorder, one "⋯" edit menu, sections side by side on desktop.
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
