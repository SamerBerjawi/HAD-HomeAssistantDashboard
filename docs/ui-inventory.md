# HAD UI Inventory

Snapshot of every user-facing UI element in the app, taken before the redesign.
Branch: `perf/notification-center`. Date: 2026-11-17.

> **Update:** the 83 unreachable files were removed (`git rm`, staged, not committed). Items marked "Unreachable" below are gone. Section 16 lists what was removed. Live-file counts drop from 581 to 498 source files.

## Method and caveats

- Static read of `src/`. Nothing was run in a browser, so visual details come from class names and props, not screenshots.
- **Live vs. unreachable:** I walked the static import graph from `src/main.tsx`. Of 581 non-test source files, 499 are reachable. 83 component or view files are not reachable from the entry point. Section 16 lists them. Dynamic or template-string imports would not be detected, so confirm before deleting anything.
- **Counts** are grep counts of import or JSX occurrences. They are approximate, and a count can include unreachable callers.

---

## 0. At a glance

| Area | Count / fact |
|---|---|
| Top-level pages | 13 (Overview, Rooms, Energy, Security, Media, System, Network, Mobility, Health, Vacuums, Automations, Integrations, Settings) |
| Settings sub-pages | 6 hub cards, each opening a sub-section |
| Overview tile types | 21 widget IDs, 22 tile components |
| Shared base primitives (`components/base/`) | Avatar, Badge (7 variants), Checkbox, Dropdown (menu), RadioGroup, Toggle, Tooltip, Table (`application/table`) |
| Custom `ui/` primitives | 26 files (dialogs, dropdowns, sliders, icon pickers, states, badges, lists, progress) |
| Chart library (`components/charts/`) | ~100 files: area, line, bar, pie, ring, gauge, sankey, live-line, tooltips, axes |
| Icon sets | Phosphor (main, 147 distinct icons), `@untitledui/icons` (5 files) |
| Raw `<button>` elements | 695 (no shared Button component) |
| Raw `<input>` elements | 54 (no shared Input component; no textarea anywhere) |
| Unreachable component/view files | 83 (about 30 are the dormant canvas feature) |

---

## 1. App shell

### 1.1 Desktop sidebar (`src/components/Sidebar.tsx`, shown at `md` and up)

| Element | Notes |
|---|---|
| Brand block | `app-icon.png` + "HAD" label; click goes to Overview |
| Collapse / expand toggle | `SidebarSimple` icon; collapses to an 80px icon rail, expands to 256px |
| Telemetry status pill | Dot + label + version. States: HA Demo Mode, HA Core Live, Connecting..., Auth Error, HA Offline |
| Notifications entry | Bell row with unread count; tooltip shows count when collapsed |
| Navigation list | 12 items, see table below |
| Theme toggle | `AnimatedThemeToggler`, light/dark |
| Active state | Per-page gradient from `PAGE_THEMES.activeSidebarDark/Light` |
| Hidden pages | Honours `config.navigation.hiddenPages`. Overview and Settings can't be hidden |

| Order | Item | Icon (Phosphor) |
|---|---|---|
| 1 | Overview | SquaresFour |
| 2 | Rooms | Armchair |
| 3 | Energy | Lightning |
| 4 | Security | ShieldCheck |
| 5 | Media | MusicNotes |
| 6 | System | HardDrives |
| 7 | Network | ShareNetwork |
| 8 | Mobility | Car |
| 9 | Health | Heartbeat |
| 10 | Vacuums | Broom |
| 11 | Automations | GitFork |
| 12 | Integrations | PuzzlePiece |
| 13 | Settings | GearSix (mandatory) |

### 1.2 Mobile bottom bar (below `md`)

- Four primary icon buttons (44px, rounded): Overview, Rooms, Energy, Security.
- A "More views and options" button opens the **Navigation Hub** sheet: a 2-column grid of the other nine pages, a close (X) button, and a scrollable area capped at 16rem.

### 1.3 Top header (`src/App.tsx`, around lines 290–470)

| Element | Notes |
|---|---|
| Demo banner | `auth/DemoBanner` |
| Back button | ArrowLeft, used in a room detail or settings sub-section ("Back to Rooms" / "Back to Settings") |
| Page heading | Page icon (30px, duotone, page colour) + title + subtitle from `PAGE_THEMES` |
| Greeting | Animated wave emoji with "Welcome!" title (conditional) |
| Stale-data hint | Shown while reconnecting; tooltip says data is from the last session |
| `SyncStatusBadge` | Spinning ArrowsClockwise while syncing |
| Edit mode toggle | PencilSimpleLine; tooltip "Enable / Exit Edit Mode" |
| Refresh dashboard | Icon button |
| `NotificationBell` | Bell with count |
| Session-expired banner | Full-width rose card with Key icon, shown on `auth_failed` |
| Sign-in button | SignIn icon, shown when not connected |
| Edit-mode save bar | "Save & Exit Dashboard Edit Mode" (CheckCircle) |

### 1.4 Global overlays mounted in `App.tsx`

- `NotificationDrawer` (right side)
- `WeatherOverviewDrawer`
- `ToastContainer` / `NotificationToast`
- `CriticalAlertModal`
- `InstallPrompt` (PWA)
- `UpdateToast` (PWA)
- `AuthModal` (shown when sign-in is needed)
- `EntityDetailModal` (global entity popup, driven by `EntityPopupContext`)

### 1.5 Page wrapper states

- Each page is wrapped in `ErrorBoundary variant="view"`, so a failing page shows a local error card.
- Lazy-loaded pages use `ViewLoadingState` as the Suspense fallback ("Loading...").
- An `ErrorBoundary variant="silent"` wraps the header and the drawers.

---

## 2. Navigation and tab systems

### 2.1 Every tab, chip and segmented control

| Where | Items | Component |
|---|---|---|
| Overview header | All; Lights (sub: Switches); Energy; Security (sub: Cameras); Climate; Windows & Doors; Media; Vacuums | `AdaptiveSectionTabs` (`overviewTabs.ts`) |
| Rooms | Floor tabs, built from the floors | `AdaptiveSectionTabs` |
| Media | All Floors + one tab per floor | `AdaptiveSectionTabs` |
| Security | All Security; Alarm (only when alarm entities exist); Locks; Openings; Motion; Hazards; Cameras | `AdaptiveSectionTabs` |
| System | Home Assistant Host; UGreen NAS | `AdaptiveSectionTabs` |
| Network | TP-Link Router; AdGuard Home; Speed Test | `AdaptiveSectionTabs` |
| Vacuums | Robot Vacuum; Stick Vacuum | `AdaptiveSectionTabs` |
| Automations | All Routines; Automations; Scenes; Active; Paused. Plus an "All Rooms" select | `AdaptiveSectionTabs` |
| Integrations | All Components; Official Core; HACS Community; Add-ons & Apps; Updates; Attention. Plus a sort select | `AdaptiveSectionTabs` |
| Mobility | Car / Bike two-button toggle (icons Car and Bicycle) | Inline in `components/views/MobilityView.tsx` |
| Light control modal | Warmth / Color / Scenes | `modals/entity-controls/light/LightTabBar` |
| Notification centre | All / Alerts / System (`role="tablist"`) | Inline in `NotificationCenter.tsx` |
| Energy period | Today; Yesterday; Last 7D; Last 30D; This Month; Last Month; This Year (spans two columns) | `energy/EnergyPeriodSelector` |
| Settings → Navigation | Visibility; Pages; Labels; Zones; Styling | `settings/deviceVisibility/*` |
| Health | None (single scrolling page) | n/a |

### 2.2 Tab implementations (inconsistent)

- `AdaptiveSectionTabs` (`common/`): 14 call sites. This is the main segmented-tab control.
- Notification centre: its own inline tablist.
- Light modal: `LightTabBar`.
- Mobility: an inline Car/Bike toggle.
- `kokonui/toolbar.tsx`: a `role="tablist"` toolbar, used inside the Overview alarm tile.
- `components/mobility/MobilityTabBar.tsx` (Vehicle Status / Energy & Charge / Location & Telemetry): **unreachable**.

---

## 3. Overview page (`components/views/OverviewView.tsx`)

- **Header:** `OverviewHeader` with a summary sentence (`services/overview/headerSummary.ts`), the tab chips from §2.1, an add-tile control that opens `WidgetsDrawer`, and layout controls in edit mode.
- **Grid:** `OverviewSortableTile` (dnd-kit sortable) wrapping `OverviewTileContent`, which switches on tile type.

| Widget ID | Tile component |
|---|---|
| `weather` | WeatherTile |
| `weather_hourly` | WeatherHourlyTile |
| `users` | UsersTile |
| `lights` | LightsTile |
| `switches` | SwitchesTile |
| `fans` | FansTile |
| `alarm` | AlarmTile |
| `cameras` | CamerasTile (and CameraFeedTile) |
| `doors` | DoorsTile |
| `windows` | WindowsTile |
| `motion` | MotionTile |
| `leak` | LeakTile |
| `smoke` | SmokeTile |
| `power_flow` | PowerFlowTile |
| `power_flow_chart` | PowerFlowChartTile |
| `energy_usage` | EnergyUsageTile |
| `energy_usage_chart` | EnergyUsageChartTile |
| `solar_production` | SolarProductionTile |
| `solar_production_chart` | SolarProductionChartTile |
| `media` | MediaTile |
| `vacuums` | VacuumsTile |

- **Overview modals and drawers:** `AlarmKeypadModal` (PIN keypad with "Enter PIN" and "Delete last digit"), `ArmAwayConfirmModal`, `FansOverviewModal`, `LightsOverviewModal`, `SwitchesOverviewModal`, `OpeningsOverviewModal`, `MediaOverviewDrawer`, `SensorsOverviewDrawer`, `VacuumsOverviewDrawer`, `UsersPresenceModal` (with a map), `WidgetsDrawer` (catalogue), `DetailsRightDrawer`.
- **Sparklines:** `EnergySparklineCharts` (minimalist energy and power-flow charts), `MiniSensorSparkline`.

---

## 4. Tiles and cards (all families)

There are at least five card families with overlapping jobs. This is the main thing to rationalise.

### 4.1 Base tiles (`components/tiles/`)

| Component | Purpose | Status |
|---|---|---|
| `TileShell` | Glass shell: 44px+ touch target, accent tint, active and alert states | Live |
| `StandardTile` | Generic entity tile | Live |
| `CompactTile` | Small entity tile | Live |
| `WideTile` | Wide entity tile | **Unreachable** |
| `SensorTile` | Sensor value tile | Live |
| `LightTile` | Light entity tile | Live |
| `SwitchTile` | Switch entity tile | Live |
| `ClimateTile` | Thermostat tile | Live |
| `MediaPlayerTile` | Media player tile | Live |

### 4.2 Overview tiles (`components/overview/tiles/`)

22 components, one per widget (see §3). Each uses `glass.tile` or `glass.iconWell`, plus `glass.chip` for telemetry chips.

### 4.3 Room cards

- `rooms/AreaTile`: area tile with `AreaTileComponent`. The grid is inside `RoomsView`.
- `rooms/RoomsHeaderSentence`: summary sentence.

### 4.4 Canvas cards (dormant)

`components/canvas/cards/` has 11 card types (Camera, Climate, EV Charging, Light, Media Player, Nordpool, Security Lock, Sensor Metric, Switch Plug, Vacuum, Weather) plus `CardShell`. None is reachable from the app. See §16.

### 4.5 Domain cards

| Domain | Components | Status |
|---|---|---|
| Energy | EnergyHeroCards, EnergyUsageGraphCard, SolarProductionGraphCard, GasUsageGraphCard, WaterUsageGraphCard, DevicesEnergyGraphCard, EnergyDistributionCard, EnergyGaugesCard, EnergySourcesTableCard, PowerSourcesChart, PowerSourcesLineChartCard, HuaweiSolarImpactTiles, EnergyUnconfiguredState | Live |
| Media | NowPlayingHighlightCard, AppleRemoteControl, AudioWaveformScrubber, MediaHeaderSentence, MediaHierarchyPlayerCard | Last one unreachable |
| Mobility | VehicleHeroCard, ChargingControlCard, VehicleTelemetryMap, VehicleCustomizerModal | Live |
| Mobility (leftover) | BikeCompanionCard, VehicleClimateCard, BatteryChargingVisual, MobilityTabBar, `views/mobility/CarEvTab`, `MobilityAssetBadge` | Mostly unreachable |
| Security | AlarmPanelSection, CameraFeedSection, FloorAreaSensorsSection, PerimeterAttentionCard, SecurityBadgesBar | Live |
| Vacuums | RobotVacuumTab, StickVacuumTab, VacuumCard, VacuumMapView, VacuumsHeaderSentence | Card and map unreachable |
| Weather | AnimatedWeatherBackdrop, WeatherHeaderSentence, WeatherOverviewDrawer, weatherIcons | Live |
| Camera | CameraFeed, CameraNoSignalPlaceholder | Live |
| Sensors | MiniSensorSparkline | Live |

### 4.6 Health metric cards

- `HealthMetricCard` (the 4-row micro-card, see §13.3), used in the Health page.
- `HealthSleepDurationCard` and `HealthSleepStagesCard` (sleep).
- `HealthActivityRingsCompact` (ring summary) and `HealthStatisticChart`.
- Unreachable: `HealthActivitySection`, `HealthBodySection`, `HealthVitalsSection`, `HealthTimeseriesChart`, `HealthActivityRings`.

### 4.7 Kokonui and ui cards

- `kokonui/hold-button`: `HoldButton`, a press-and-hold confirm (2 uses). Live.
- `kokonui/toolbar`: `Toolbar`, a tablist toolbar (used in the Overview alarm tile). Live.
- `kokonui/apple-activity-card`: `AppleActivityCard` and `CircleProgress`. **Unreachable.**
- `ui/BentoCard`: card. Live. `ui/BentoGrid`: grid. **Unreachable.**
- `ui/BorderBeam`: animated border glow (2 uses). Live.

---

## 5. Modals, drawers, dialogs, sheets, popups and toasts

| Name | Type | Used for | Status |
|---|---|---|---|
| `DialogShell` | Modal shell | Generic dialog base (6 call sites: backup/restore, Edit Area/Floor/Label modals, TP-Link and NAS overview) | Live |
| `ConfirmDialog` | Confirm modal | Tone-coded confirms (cyan, emerald, amber, rose, indigo, slate) | Live |
| `IconFinderModal` | Modal | Icon search and pick (2 uses) | Live |
| `EntityDetailModal` | Modal | Global entity controls, opened from `EntityPopupContext` | Live |
| Entity control views | Per-domain panels | Camera, Climate, Cover, Fan, Light, Lock, Media Player, Sensor history, Switch, Vacuum (`modals/entity-controls/`) | Live |
| Light control sub-parts | Panels | BrightnessSection, ColorPanel, LampHero, LightHeader, LightTabBar, ScenesPanel, WarmthPanel | Live |
| `EntityCustomizerModal` | Modal | Edit an entity's name, icon and settings | Live |
| `ClimateConfirmModal`, `UnlockConfirmModal`, `ActionConfirmModal`, `ArmAwayConfirmModal` | Confirm modals | Safety confirms for climate, lock, mobility and alarm actions | Live |
| `AlarmKeypadModal` | Keypad modal | PIN entry for the alarm | Live |
| `CriticalAlertModal` | Modal | Critical alert takeover | Live |
| `NotificationDrawer` | Right drawer | Notifications | Live |
| `NotificationCenter` | Panel | Notification list with tabs, search and cards | Live |
| `NotificationChangelog` | Panel | Changelog entries | Live |
| `AlertDrawer`, `AlertItem` | Drawer | Older alert list | **Unreachable** |
| `ToastContainer`, `NotificationToast` | Toasts | Transient messages | Live |
| `UpdateToast` | Toast | "New version" PWA prompt | Live |
| `InstallPrompt` | Prompt | PWA install prompt | Live |
| `NotificationBell` | Button | Opens the drawer | Live |
| `WeatherOverviewDrawer` | Right drawer | Weather detail | Live |
| `DetailsRightDrawer` | Right drawer | Generic detail | Live |
| `IntegrationDetailDrawer` | Right drawer | Integration details | Live |
| `CameraStreamModal` | Modal | Full camera stream (security view) | Live |
| `VehicleCustomizerModal` | Modal | Vehicle specs and photos | Live |
| `EditAreaModal`, `EditFloorModal`, `EditLabelModal` | Modals | Edit rooms, floors and labels | Live |
| `AuthModal` | Modal | Home Assistant sign-in | Live |
| `DemoBanner` | Banner | Demo-mode notice | Live |
| `PinLockModal` | Modal | Kiosk PIN lock (canvas) | **Unreachable** |
| `CardCatalogDrawer`, canvas detail modals | Drawer and modals | Canvas-only | **Unreachable** |

Note: the overview modals are bespoke fixed-position markup. They don't use `DialogShell`.

---

## 6. Form controls and inputs

| Control | Implementation | Where / count |
|---|---|---|
| Switch / toggle | `base/toggle` `Toggle` (react-aria switch). Sizes `sm`, `md`, plus `slim` | 46 import sites. Primary control |
| Checkbox | `base/checkbox` `Checkbox` | 4 |
| Radio group | `base/radio-buttons` `RadioGroup`, `RadioButton` | 1 |
| Dropdown (custom) | `ui/CustomDropdown`, with options, popover and optional search | 9 |
| Dropdown (menu) | `base/dropdown` `Dropdown` (react-aria menu) | 8 |
| Native select | Raw `<select>` | 4 |
| Row action menu | `TableRowActionsDropdown` | 1 |
| Icon picker | `ui/IconPickerField` (opens `IconFinderModal`) | 4 |
| Text input | Raw `<input>` (search fields, names, URLs, PIN) | 54 |
| Textarea | None | 0 |
| Capsule slider | `ui/TouchCapsuleSlider` | 2 |
| Brightness slider | `ui/EntityBrightnessSlider` | 1 |
| Temperature slider | `ui/EntityTemperatureSlider` | 1 |
| Range input | Raw `<input type="range">` in 9 files (media players, EV charging, lights overview, vehicle customiser, brightness slider) | 9 |
| Hold to confirm | `kokonui/HoldButton` | 2 |
| Colour picker | Colour panel in light controls (`ColorPanel`) | 1 |
| Search fields | Notification search, icon finder, dropdown search, "Clear search" | several |
| PIN keypad | `AlarmKeypadModal` with "Delete last digit" | 1 |
| Zoom controls | Zoom In / Zoom Out (map and camera) | 4 each |
| Pan controls | Pan up / down / left / right (camera PTZ) | 1 each |
| Stepper controls | Fan speed, cabin temperature, brightness ±5% (labelled icon buttons) | several |

---

## 7. Buttons and icon buttons

- **There is no shared Button component.** 695 raw `<button>` elements use hand-written Tailwind classes. This is the single biggest consistency issue.
- **Common button types:** icon-only close buttons (`w-8 h-8 rounded-xl`), pill CTAs, text links, and glass-field buttons (`glass.field`).
- **Specialised buttons:** `HoldButton` (press and hold), `AnimatedThemeToggler`, `BadgeWithButton`, Avatar add button.

Aria-labelled icon buttons, grouped (counts in brackets):

- **Dismiss and close:** Close [11], Close modal, Close drawer, Close Modal, Close integration drawer, Dismiss notification, Back, Clear search, Drag handle.
- **Zoom and pan:** Zoom Out [4], Zoom In [4], Pan up / down / left / right.
- **Camera:** Previous Camera, Next Camera, Camera stream, Card details.
- **Keypad:** Enter PIN, Delete last digit [2].
- **Toggles:** Toggle AdGuard protection [2], Toggle light, Toggle Wi-Fi setting, Toggle switch, Toggle live polling, Toggle theme mode.
- **Controls:** Increase / Decrease fan speed, Increase / Decrease cabin temperature, Increase / Decrease brightness 5%.
- **Navigation and actions:** Open menu, Alerts, System Notifications, Sign in to Home Assistant, Refresh states and notifications, Details, Customize entity, Customize vehicle, Customize vehicle specs and photos, Confirm arm away, Choose an icon, Card catalog, Integration details.

---

## 8. Badges, chips and status

| Element | Implementation | Notes |
|---|---|---|
| Badge | `base/badges` `Badge` with `BadgeWithDot`, `BadgeWithIcon`, `BadgeWithFlag`, `BadgeWithImage`, `BadgeWithButton`, `BadgeIcon` | 75 import sites. 12 colours (gray, brand, error, warning, success, slate, sky, blue, indigo, purple, pink, orange). 3 sizes (sm, md, lg) |
| Animated badge | `ui/AnimatedBadge` | 2 |
| Sync status | `ui/SyncStatusBadge` | Header |
| Entity status bar | `ui/EntityStatusBar` | 1 |
| Telemetry | `common/TelemetryBadge` (`TelemetryLine`, battery icon logic) | Telemetry lines |
| Glass chip | `glass.chip` | Telemetry chips on overview tiles |
| Count badges | Numeric counts on tabs (Automations, Integrations) | `AdaptiveSectionTabs` |
| Notification status | `STATUS_STYLES` and `ACTION_STYLES` in `NotificationCenterCard` | Notification cards |
| Mobility asset badge | `MobilityAssetBadge` | **Unreachable** |

---

## 9. Avatars and people

- `base/avatar` `Avatar`: sizes xs (24px) to 2xl. Parts: `AvatarAddButton`, `AvatarCompanyIcon`, `AvatarCount`, `AvatarOnlineIndicator`, `VerifiedTick`. 4 import sites.
- `ui/PersonAvatar`: gradient-palette avatar for people (6 sites), with sizes from `SIZE_CONFIGS`.
- Users: `UsersTile`, `UsersPresenceModal` (presence map, `PersonMapController`), `IntegrationIcon`.

---

## 10. Data display, tables and layout

### 10.1 Tables and lists

- `application/table/table.tsx` (react-aria): `Table`, `TableCard`, `TableCardHeader`, `TableRoot`, `TableHeader`, `TableHead`, `TableRow`, `TableCell`, `TableRowActionsDropdown`. 8 `Table` sites, including Automations.
- `ui/AnimatedList`, `AnimatedListItem`: animated list (4 sites).
- `layout/VirtualGrid`: virtualised grid of tiles (4 sites).

### 10.2 Grids and layout

- `layout/GridTile`: responsive column-span tile (7 sites).
- `layout/SortableGrid`: drag-and-drop grid, dnd-kit (6 sites).
- `ui/BentoGrid`: **unreachable.** `BentoCard`: live.

### 10.3 Charts (`components/charts/`)

Dead chart files (unreachable): `area-chart`, `area-chart-loading`, `bar`, `bar-chart`, `bar-chart-loading`, `bar-squares`, `bar-x-axis`, `bar-y-axis`, `composed-chart`, `line-chart-loading`, `line-series-terminal-marker`, `live-line`, `live-line-chart`, `live-x-axis`, `live-y-axis`, `pattern-area`, `pattern-preset`, `projection-line`, `projection-line-end-marker`, `ring`, `ring-center`, `ring-chart`, `ring-context`, `sankey/*` (6 files), `series-bar`, `visx-pattern`.

Live chart primitives (everything else in `charts/` is reachable):

- **Gauge:** `gauge.tsx` (most-used chart primitive, 39 import sites).
- **Line:** `line-chart.tsx`, `line.tsx`, `line-loading-pulse`, `live-line` is dead.
- **Area:** `area.tsx`.
- **Pie:** `pie-chart.tsx`, `pie-slice`, `pie-center`, `pie-context`.
- **Series overlays:** markers, hover dim, highlight layer, dash tail, point marker.
- **Tooltips:** `tooltip/*` (`ChartTooltip`, `TooltipBox`, `DateTicker`, `TooltipDot`, `TooltipIndicator`).
- **Shell:** `time-series-chart-shell`, `grid`, `x-axis`, `y-axis`, reference areas, stat flow, highlight segment.
- **Loading:** `loading-sweep`, grid shimmer, `chart-loading-label`.

Tailwind-style chart colours come from the `--chart-*` CSS variables (§13.5).

### 10.4 Charts and micro-visuals used by pages

`LineChart` (17 sites), `Gauge` (39), `PieChart` (8), `BarChart` (7), `AreaChart` (6), `RingChart` (3, unreachable), `SankeyChart` (1, unreachable), `LiveLineChart` (1, unreachable). Counts include unreachable callers.

### 10.5 Animated and decorative elements

- `ui/NumberTicker` (5): animated numbers.
- `shimmering-text` `ShimmeringText` (2).
- `ui/AnimatedCircularProgressBar` (2).
- `ui/BorderBeam` (2): animated border.
- `common/AmbientBackground` (1): radial glow backdrop.
- `weather/AnimatedWeatherBackdrop`: animated weather backdrop.
- `media/AudioWaveformScrubber`: waveform scrubber.
- `ui/animated-theme-toggler`: animated theme toggle (2).

---

## 11. Feedback, empty and loading states

| Element | Use | Count |
|---|---|---|
| `ViewLoadingState` | Page and section loading | 9 |
| `ViewEmptyState` | No data | 8 |
| `ViewErrorState` | Failed load | 2 |
| `FullScreenLoadingPage` | App boot | 1 |
| `HealthOnboardingEmptyState` | Health not configured | 1 |
| `EnergyUnconfiguredState` | Energy not configured | n/a |
| `CameraNoSignalPlaceholder` | Camera offline | n/a |
| Chart skeletons | `loading-sweep`, grid shimmer, chart loading label | n/a |
| Error boundaries | `RootErrorBoundary`, `ErrorBoundary` with `silent` and `view` variants | n/a |
| Toasts and prompts | `ToastContainer`, `NotificationToast`, `UpdateToast`, `InstallPrompt` | n/a |

---

## 12. Iconography

- **Phosphor** (`@phosphor-icons/react`) is the main icon set: 240 import statements, 147 distinct icons. Weights used: `duotone` (most common), `bold`, `fill`, `regular`.
- **`@untitledui/icons`** is used in 5 files, mostly the `base/` primitives. This is a second icon set.
- **`DynamicPhosphorIcon`** renders icons chosen by name, through `lib/phosphorIconLoaders.ts` and `lib/phosphorIconData.ts`. Used by the icon picker.
- **Custom:** `weather/weatherIcons.tsx`, `kokonui` components, `public/app-icon.png` and PWA icons.
- **Sizes:** inline icons are about 12–18px. Page heading icon 30px. Back arrow 24px. Header and banner icons 20–22px.

Distinct Phosphor icons in use include: Airplay, AppWindow, Armchair, ArrowsClockwise, Backspace, Battery (Charging, High, Medium, Warning), Bed, Bell, BellSlash, Bicycle, Broadcast, Broom, Camera, Car, CaretDown/Left/Right/Up, ChartBar, Check, CheckCircle, Clock, CloudCheck, CloudSun, Cpu, CurrencyDollar, Database, DoorOpen, DownloadSimple, Drop, Eye, EyeSlash, Faders, Fan, Fire, FrameCorners, Gauge, GearSix, Globe, HardDrive(s), Heartbeat, House, Key, Lightbulb, Lightning, ListBullets, Lock(Open), MagnifyingGlass, MapPin, Memory, Moon, MusicNotes, NavigationArrow, PaintBrush, Palette, Pause, Play, Plug, Plus, Power, Radio, Robot, Shield(Check, Warning), SidebarSimple, SignIn, Sliders, Snowflake, Sparkle, SpeakerHigh, Speedometer, SquaresFour, Stairs, Sun, Television, Thermometer, Timer, ToggleRight, Trash, TrendUp/Down, UploadSimple, Users, VideoCamera, Warning(Circle, Octagon), WifiHigh, WifiSlash, Wind, X. Full list: grep `@phosphor-icons/react` imports.

---

## 13. Visual system and theming

### 13.1 Typography

- Sans: **Plus Jakarta Sans Variable** (self-hosted via `@fontsource-variable`, imported in `main.tsx`).
- Mono: **JetBrains Mono Variable**, used for big metric values.

### 13.2 Colour mode and backgrounds

- Theme modes: `auto`, `dark`, `light`. Set by the theme toggle and Settings → Theme.
- Background style: `ambient` (glow blobs, weather backdrop) or `flat` ("Solid"). Set in Settings → Theme.
- Every view takes a `darkMode` prop, so the dark/light split is threaded by hand through the tree rather than via a context.

### 13.3 Surfaces: the glass roles (`src/lib/glass.ts`)

| Role | Purpose |
|---|---|
| `glass.panel` | Primary section container |
| `glass.tile` | Tile or stat row inside a panel |
| `glass.field` | Inputs, segmented controls, settings sub-cards |
| `glass.chip` | Small telemetry chips on overview tiles |
| `glass.iconWell` | Icon well on overview tiles |

Layout and spacing stay at the call site. Surface material lives in these roles.

### 13.4 Per-page themes (`src/config/pageThemes.ts`)

Each of the 13 pages has a title, subtitle, icon, text colour class and sidebar active gradients (dark and light). Examples: Overview "Overview", Rooms "Rooms & Areas", Energy "Energy & Power", Security "Security & Safety", Media "Media & Audio", System "System & Diagnostics", Network "Network & Connectivity", Mobility "Mobility & Vehicles", Health "Health & Vitals", Vacuums "Vacuums & Cleaning", Automations "Automations & Scenes", Integrations "Integrations & Add-ons", Settings "Settings & Setup".

### 13.5 Design tokens (`src/index.css`)

- Chart: `--chart-1` to `--chart-5`, `--chart-scale-01` to `--chart-scale-05`, `--chart-grid`, `--chart-crosshair`, `--chart-tooltip-*`, `--chart-marker-*`, `--chart-line-primary/secondary`, `--chart-foreground*`, `--chart-background`, `--chart-label`.
- Colour: `--color-brand-purple`, `--color-brand-purple-hover`, `--color-brand-light-purple`, `--color-brand-bg`, `--color-glass-white`, `--color-1` to `--color-5`, `--color-border`, `--color-foreground`, `--color-muted-foreground`.
- Motion: `--animate-border-beam`, `--animate-rainbow`, `--animate-shine`.
- Layout: safe-area insets `--sat`, `--sar`, `--sab`, `--sal`; `--titlebar-h`.

### 13.6 Motion

- `motion/react` is used in 57 files. `MotionConfig` is set at the root.
- Sheets and drawers use spring transitions (damping 26, stiffness 300).

### 13.7 Design rules (`.agents/rules/design_system.md`)

- Frosted glass surfaces only. No opaque card backgrounds.
- Four-row metric micro-card: status and icon, title, hero value and delta, footer and sparkline.
- Frameless charts with soft grid lines.
- Bento grid on `lg` (12 columns).
- Light and dark variant for every surface.

### 13.8 Responsive breakpoints

- Below `md`: bottom nav and More sheet. From `md`: sidebar.
- `lg`: 12-column bento layouts.
- `sm`: larger type and spacing.

---

## 14. Settings (`src/components/SettingsView.tsx` and `settings/`)

Hub (`SettingsHub`), six cards. Each shows three stat rows.

| Card | Section component | What it contains |
|---|---|---|
| Navigation & Entity Visibility | `DeviceVisibilitySection` | Visibility, Pages (toggles), Labels, Zones, Styling. Edit Area, Floor and Label modals |
| Theme & Customization | `ThemeCustomizationSection` | Theme mode, background style, weather simulation |
| User Profile & Security PIN | `UserProfileSection` | Display name, role, kiosk PIN |
| Connection & Home Assistant | `ConnectionWebSocketSection`, `InternalUrlCard` | Connection status, auth type, entity count, internal URL |
| Backup & Restore | `BackupRestoreSection` | Export JSON, snapshots, restore, factory reset |
| Cameras & RTSP Feeds | `CameraSettingsSection` | go2rtc status, RTSP stream list |

---

## 15. Page-by-page content (live views)

- **Overview:** see §3.
- **Rooms:** `RoomsView` → `AreaDetailView` for a selected room. Sections: `ClimateFansSection`, `LightsSection`, `MediaSection`, `SensorsSection`, `SwitchesSection`. Floor tabs, `AreaTile` grid.
- **Energy:** `EnergyView` → `EnergyDashboardView`. Hero cards, period selector, usage, solar, gas, water and device graphs, distribution, gauges, sources table, power-sources charts, Huawei solar impact tiles. Unconfigured state when there is no energy setup.
- **Security:** `SecurityView`. Alarm panel, camera feed, floor and area sensors, perimeter attention card, badges bar, camera stream modal. Filter tabs from §2.1.
- **Media:** `MediaView`. Header sentence, now-playing cards, Apple remote control, waveform scrubber, player grid. Floor tabs.
- **System:** `SystemView`. Home Assistant Host (`HostMonitorTab`): overview, CPU, memory, disk, network. UGreen NAS (`UgreenNasTab`): overview, disks, storage pool, volume.
- **Network:** `NetworkView`. TP-Link Router: overview, clients breakdown, connected clients, disconnected clients, throughput, Wi-Fi controls. AdGuard Home: performance, protection (switch), query activity, sparkline grid, threat, traffic history (**unreachable**). Speed Test: overview, bufferbloat, compliance, history.
- **Mobility:** `MobilityView`. Car/Bike toggle. Car: `VehicleHeroCard`, `ChargingControlCard`, `VehicleTelemetryMap`, `VehicleCustomizerModal`. Bike: `BikeTab`, with a map (`BikeMapController`).
- **Health:** `HealthView`. Onboarding empty state, activity rings, statistic chart, metric cards per section (about six), sleep duration and stages.
- **Vacuums:** `VacuumsView`. Robot Vacuum (`RobotVacuumTab`) and Stick Vacuum (`StickVacuumTab`) tabs.
- **Automations:** `AutomationsView`. Filter tabs, room select, react-aria table of automations and scenes.
- **Integrations:** `IntegrationsView`. Filter tabs, sort select, integration table and cards, `IntegrationDetailDrawer`.
- **Settings:** see §14.

---

## 16. Removed unreachable files (83)

These had no path from the app entry point and were deleted. Restore any of them from git history if needed.

- **Dormant canvas feature (24 files):** `canvas/TunetCanvasView`, `CanvasHeader`, `CardCatalogDrawer`, `CardShell`, `PinLockModal`, 11 `canvas/cards/*`, 8 `canvas/modals/*`.
- **Charts (about 37 files, including helper `.ts` modules):** see §10.3.
- **Health leftovers (5):** `HealthActivityRings`, `HealthActivitySection`, `HealthBodySection`, `HealthTimeseriesChart`, `HealthVitalsSection`. Also `views/HealthView.tsx`, a re-export that nothing imports.
- **Mobility leftovers (7):** `MobilityTabBar`, `VehicleClimateCard`, `BikeCompanionCard`, `BatteryChargingVisual`, `views/mobility/CarEvTab`, `views/mobility/MobilityAssetBadge`, `views/mobility/MobilityMap`. Also `views/MobilityView.tsx`, a re-export.
- **Vacuums (2):** `VacuumCard`, `VacuumMapView`.
- **Media (1):** `MediaHierarchyPlayerCard`.
- **Network (1):** `AdGuardTrafficHistorySection`.
- **Overlays and misc (5):** `alerts/AlertDrawer`, `alerts/AlertItem`, `tiles/WideTile`, `ui/BentoGrid`, `kokonui/apple-activity-card`.

Note: `views/mobility/MobilityMap` is unreachable, so the Mobility page's map is `VehicleTelemetryMap` and the Bike map is inside `BikeTab`.

---

## 17. Redesign observations

These are facts from the inventory, not recommendations on their own.

1. **No shared Button or Input.** There are 695 raw `<button>` and 54 raw `<input>` elements. A native-style `Button`, `IconButton` and `Input` would cover most of the control surface.
2. **Four tab systems.** `AdaptiveSectionTabs`, the notification tablist, `LightTabBar` and the inline Car/Bike toggle each do the same job.
3. **Three dropdown systems.** `CustomDropdown`, the react-aria `Dropdown` menu, and raw `<select>`.
4. **Two icon sets.** Phosphor for most UI, `@untitledui/icons` for the `base/` primitives.
5. **Five card families.** `tiles/`, `overview/tiles/`, `canvas/cards/`, `rooms/AreaTile` and the domain cards, each with its own surface and layout code.
6. **Two overlay patterns.** `DialogShell` and `ConfirmDialog` on one side, bespoke fixed-position markup in the overview modals on the other.
7. **Unused dependency.** `@base-ui/react` is in `package.json` but nothing imports it. `react-aria-components` is used by 11 files, mainly the `base/` primitives. These are the two existing candidates for a component foundation.
8. **Dead code.** 83 unreachable files, including the whole canvas feature and most of the old charts.
9. **Good existing foundations to keep.** The `glass.*` surface roles, `PAGE_THEMES`, the `--chart-*` tokens, `TileShell`, and `AdaptiveSectionTabs`.
10. **Prop-threaded dark mode.** `darkMode` is passed as a prop through most components, instead of coming from a theme context.
