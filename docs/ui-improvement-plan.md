# HAD UI, UX and Code Improvement Plan

Based on [ui-inventory.md](ui-inventory.md). Branch `perf/notification-center`, 2026-11-17.

## Goal and the reading I took

You asked to "use more native UI components". I read that as: **replace hand-rolled controls with accessible, platform-native-feeling components**, meaning real HTML elements (`<dialog>`, `<input type="range">`, popover) where they are enough, and `react-aria-components` where they are not. Keep the frosted-glass look. If you meant something else (for example OS-native chrome in a wrapper app), tell me and Phase 1 changes.

## What the inventory says is wrong

| Finding | Number | Why it matters |
|---|---|---|
| Raw `<button>` with hand-written classes | 595 | No shared look, focus or touch target |
| Raw `<input>` | 47 | Same |
| `focus-visible` styles | 24 occurrences | Most buttons have no visible keyboard focus |
| Controls at 32px (`w-8 h-8`) | 97 | Below the 44px touch minimum the app's own `TileShell` enforces |
| `<div role="button">` | 38 | Hand-rolled button semantics |
| `darkMode ?` ternaries | 679 across 191 files | Theming done twice: a prop and Tailwind `dark:` (192 files) |
| Tab systems / dropdown systems / card families | 4 / 3 / 5 | Same job built several ways |
| Files over 800 lines | 9 (largest 1037) | Hard to change safely |
| DOM tests | 3 | Almost nothing protects UI refactors |

Strengths to keep: the `glass.*` surface roles, `PAGE_THEMES`, `--chart-*` tokens, `TileShell`, `AdaptiveSectionTabs`, the `base/` primitives (already on react-aria), and the CI guards (`anyGuard`, `fileSizeGuard`).

## Decisions I am making (redirect any of them)

1. **Foundation = `react-aria-components`**, already used by 11 files and the whole `base/` folder. Remove the unused `@base-ui/react` dependency instead of adopting two libraries.
2. **One icon set: Phosphor.** Replace the 5 `@untitledui/icons` files.
3. **Theme via the Tailwind `dark:` variant plus one theme context.** Delete the `darkMode` prop.
4. **Migrate by surface, not by file**, behind guards that stop new raw buttons.
5. **Look stays.** This is a structure and behavior refactor, not a visual redesign, until Phase 5.

---

## Phase 0: Safety net (do first, about 2 days)

- Add Playwright screenshot baselines for 8 key screens (Overview, Rooms, Energy, Security, Settings hub, entity modal, notification drawer, mobile nav) in light and dark, using demo mode (`test_` token). This is the regression check for everything after.
- Add a DOM test helper and write tests as each primitive lands (jsdom and Testing Library are installed).
- Add a guard test, like `anyGuard`, that counts raw `<button>`, `<input>` and `role="button"`. Baseline = today's number, may only go down.
- **Done when:** `npm run test:e2e` (new) passes, and the guard fails if the counts rise.

## Phase 1: Primitives (about 1.5 weeks)

Build in `src/components/base/`, all on react-aria, all using `glass.*`, all with a visible `focus-visible` ring and 44px minimum hit area.

| Primitive | Replaces | Notes |
|---|---|---|
| `Button` (variants: primary, secondary, ghost, danger; sizes) | Pill CTAs, text buttons | `isPending`, loading state built in |
| `IconButton` (requires `aria-label` at the type level) | Close, zoom, pan, stepper buttons | Visual 32px allowed, hit area 44px |
| `TextField` / `SearchField` | 54 raw inputs, dropdown search | Label, error, hint |
| `Select` (one component) | `CustomDropdown`, raw `<select>`, base `Dropdown` for choices | Keep `Dropdown` for action menus only |
| `SegmentedControl` / `Tabs` | `AdaptiveSectionTabs`, notification tablist, `LightTabBar`, Car/Bike toggle, `Toolbar` | One component, scrollable and adaptive, count badges |
| `Slider` | `TouchCapsuleSlider`, brightness, temperature, 9 raw range inputs | Capsule style as a variant |
| `Dialog` / `Drawer` / `Sheet` | `DialogShell`, `ConfirmDialog`, bespoke overview modals, 6 drawers | Native `<dialog>` or react-aria Modal; one focus trap, one animation |
| `Toggle`, `Checkbox`, `RadioGroup`, `Badge`, `Avatar`, `Tooltip`, `Table` | Already exist | Add focus ring and touch-target audit |

- **Done when:** each primitive has a DOM test (keyboard, aria, disabled), a usage snippet in `docs/`, and the guard baseline is not yet touched.

## Phase 2: Theming cleanup (about 1 week, parallel with Phase 1)

- Add a `ThemeProvider` (mode `auto | light | dark`, background `ambient | flat`) that sets the `dark` class once.
- Codemod `darkMode ? a : b` to `a dark:b` where both are class strings (679 sites). Leave non-class logic by hand.
- Remove the `darkMode` prop from every view and component signature (191 files).
- Move colours into tokens: page accent colours from `PAGE_THEMES`, status colours from one `status` palette (success, warning, error, info) shared by `Badge`, notifications and tiles.
- **Done when:** `grep darkMode src` returns only the provider, and Playwright baselines are unchanged.

## Phase 3: Migrate surfaces (about 3 weeks, in this order)

Order is by user visibility and by how many raw controls go away.

1. **App shell** (`Sidebar`, header, mobile bar, More sheet): `IconButton`, `Tabs`, `Dialog`. Fix the mobile nav: 9 of 13 pages sit behind "More"; make the four primary slots configurable.
2. **Overlays:** move all drawers and modals to `Dialog` / `Drawer`. Delete `DialogShell` and the bespoke overview modal markup.
3. **Tabs everywhere** (14 `AdaptiveSectionTabs` sites plus the 4 inline ones) to `Tabs`.
4. **Form-heavy pages:** Settings (all six sections), then `VisibilityPanel` (26 buttons), `IconFinderModal`, `ThemeCustomizationSection`.
5. **Entity controls:** `MediaPlayerControlView` (21), `FanControlView` (12), `CameraControlView`, `LightControlView`, sliders to `Slider`.
6. **Page content:** Overview header (19), `AreaTile` (15), Security alarm panel, Vacuums, Mobility, Energy period selector.

After each step lower the guard baselines. **Done when:** raw `<button>` is under 50 (leave only truly special cases), `role="button"` is 0, and `DialogShell`, `CustomDropdown`, `AdaptiveSectionTabs`, `LightTabBar` are deleted.

## Phase 4: One card system (about 2 weeks)

- Extend `TileShell` into the single card base: `Card` with `tile`, `panel` and `well` levels (from `glass.*`), plus the 4-row metric anatomy as a `MetricCard`.
- Rebuild `tiles/*`, `overview/tiles/*`, `AreaTile` and the Health, Energy and Network cards on top of it. Keep per-domain content, drop per-domain frame code.
- **Done when:** no card writes its own `backdrop-blur` / border / radius string; all go through `Card`.

## Phase 5: UX improvements (about 2 weeks, can start after Phase 1)

| Area | Change |
|---|---|
| Accessibility | Visible focus everywhere; 44px targets; `aria-live` for toasts and sync state; reduced-motion support for `motion` and ambient backdrops; contrast pass on glass text in light mode |
| Navigation | Configurable mobile primary slots; page search or command palette; keep last tab per page |
| Edit mode | Clear entry and exit, unsaved-changes prompt, one place for add-tile and layout |
| States | One loading skeleton, empty and error pattern (`ViewLoadingState` / `ViewEmptyState` / `ViewErrorState` become the only three) with retry actions |
| Notifications | One entry point (bell) with a consistent drawer; dismiss and undo |
| Settings | Search across settings; group by task; show current values on the hub (already there) |
| Feedback | Optimistic controls show pending then failure rollback with a toast |
| Performance | Keep the `perf/notification-center` direction: virtualised lists, lazy views, no layout shift on tile load |

Each item needs a one-line acceptance test (Playwright or DOM).

## Phase 6: Code health (continuous, about 1 week of focused work)

- Split the 9 files over 800 lines (`NasOverviewSection` 1037, `SettingsView` 942, `BikeTab` 931, `useDeviceVisibilityState` 906, `SensorHistoryView` 850, `EnergySparklineCharts` 840, `EnergyDistributionCard` 809, `PowerSourcesChart`, `FanControlView`); remove each from the `fileSizeGuard` baseline as it goes.
- Drive `any` from 46 to 0 in UI files; lower `BASELINE_ANY` each time.
- Drop `@base-ui/react`, `@untitledui/icons`; check `class-variance-authority` is used for `Button`, `Badge`, `Card` variants.
- Prune chart primitives that nothing imports after Phase 3, and add a reachability check to CI so dead files cannot accumulate again (the script from the inventory pass).
- Add a short `docs/ui-conventions.md`: which primitive to use, how to add a tile, how to theme.

---

## Order and sizing

| Phase | Effort | Depends on |
|---|---|---|
| 0 Safety net | S (2 d) | none |
| 1 Primitives | M (1.5 wk) | 0 |
| 2 Theming | M (1 wk) | 0, parallel with 1 |
| 3 Surfaces | L (3 wk) | 1, 2 |
| 4 Cards | M (2 wk) | 1, 2 |
| 5 UX | M (2 wk) | 1 |
| 6 Code health | M (ongoing) | 0 |

Total about 8 to 10 weeks for one person, less with parallel work. Phases 1+2 can ship as separate small PRs; each Phase 3 step is its own PR with before/after screenshots.

## Risks

- **Large codemod churn** (Phase 2): mitigate with the screenshot baselines and doing it directory by directory.
- **Visual drift** from swapping controls: baselines catch it; accept deliberate changes in review.
- **Auth and camera code is security-sensitive** per `CLAUDE.md`: UI migrations there touch `AuthModal`, camera stream and PIN keypad, so run `npm run build && npm run test:integration` on those PRs.
- **Unmeasured:** this plan is from static analysis. No performance or real-device touch testing yet.

## Open questions for you

1. Is "native" what I assumed (accessible primitives, real HTML elements), or do you want a different component library?
2. Is a visual refresh in scope, or keep today's glass look?
3. Is mobile or wall-tablet the priority device? It changes how much of Phase 5 comes first.
