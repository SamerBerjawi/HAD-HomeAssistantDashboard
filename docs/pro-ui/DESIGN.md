# HAD Pro UI: design document

Status: living document. Last updated 2026-11-23.
Owner: Samer (product decisions). Builders: any AI agent (Claude Code, Gemini on Antigravity, ...) or human.

This file is the single source of truth for the **pro** front end. Read it fully before you touch
anything under `src/pro/`. If what you are about to build is not covered by a decision in the
[Decision log](#9-decision-log), stop and ask the owner (see [Working agreement](#1-working-agreement)).

---

## 1. Working agreement

The pro UI is built **bit by bit, one component at a time, with no uncontrolled decisions**.

For every component, every agent follows this loop:

1. **Research.** Look the component up in each library in [the roster](#3-library-roster) and list
   what each one offers for it (name, link, free or paid, how it is installed).
2. **Ask.** Present 2 to 4 options to the owner, recommendation first, with the trade-offs. Ask
   one component at a time. Sub-elements (the switcher inside the sign-in card, the avatar in the
   sidebar footer) are separate decisions.
3. **Record.** Write the answer in the [Decision log](#9-decision-log) and update the component's
   section in [Component specs](#7-component-specs) **before** writing code.
4. **Build only that.** Build the decided component, nothing else. No drive-by restyles, no
   "while I was here" extras, no new libraries or dependencies that were not decided.
5. **Verify.** `npm run lint && npm test`, `npm run build:pro`, then look at it in the browser at
   phone width (375 px) and desktop, light and dark. Record anything not verified.
6. **Stop and hand back.** Report what was built and what the next pending decision is.

Rules that come with it:

- Never pick a library, variant, colour, animation or copy on the owner's behalf. If unsure, ask.
- A decision recorded here is final until the owner changes it. Do not re-litigate it.
- If a decided option turns out to be impossible (licence, broken install, a11y failure), stop,
  explain, and ask again. Do not silently substitute.
- Commit only when the owner asks. Never push.

## 2. Scope and architecture

- The **classic** UI (`src/App.tsx`, `src/components/**`) stays as it is. Never restyle classic
  components for pro, and never import pro styles into classic.
- The **pro** UI lives in `src/pro/`:
  - `main.tsx` (entry, same providers as classic), `ProApp.tsx` (startup flow and routing),
    `pro.css` (tokens and per-page accents), `components/` (shell parts), `pages/`, `hooks/`.
  - Copied-in library code goes in `src/pro/ui/<library>/` (for example `src/pro/ui/bklit/`,
    `src/pro/ui/magicui/`). One folder per library so its origin and licence stay visible.
- Build: `vite.pro.config.ts` builds to `dist-pro/` (`npm run build:pro`). The Express server
  serves it when `UI=pro`. `docker-compose.yml` has a second service on port 3001.
- Data: pro reuses the classic hooks, stores, contexts and services (`useAutoLayoutStore`,
  `useAuth`, `useUserConfig`, `src/hooks/*`, `src/services/*`). Pro-only view logic goes in
  `src/pro/hooks/`. Business rules still belong in `src/services` with a unit test.
- Repo rules from `CLAUDE.md` and `docs/AI_RULES.md` still apply (file size max ~800 lines, no
  `any`, no `@ts-ignore`, auth code is security-sensitive). The glass rules in
  `.agents/rules/design_system.md` apply to **classic only**; pro follows this document.

## 3. Library roster

Precedence: **HeroUI first** for any primitive it has. The other libraries are used where HeroUI
has no equivalent, or where the owner picks them for a specific component. Copied-in components
must be re-skinned onto the HeroUI tokens (see [section 6](#6-integration-rules)); we never run two
token systems.

| Library | Role in pro | Install | Licence / cost notes |
|---|---|---|---|
| **HeroUI v3** (`@heroui/react`, `@heroui/styles`) | Primary UI library: buttons, inputs, forms, tabs, drawer/sheet, modal, avatar, chip, tooltip, breadcrumbs, dropdown, toast, card, surface, toolbar, skeleton, spinner. | npm (installed, ^3.2.7) | Free core only (MIT). **No HeroUI Pro licence**: Navbar, Sidebar, AppLayout, KPI, charts, EmptyState, Segment and other Pro parts are not available. Do not suggest them. |
| **Hugeicons** (`@hugeicons/react`, `@hugeicons/core-free-icons`) | The only icon set in pro. | npm (installed) | Free set. Do not use Phosphor, Lucide or Untitled icons in pro code. |
| **bklit UI** (`@bklit` registry) | Charts, KPI cards, sparklines, stat visuals. | shadcn registry in `components.json` (`https://ui.bklit.com/r/{name}.json`) | Copy-in source. |
| **BoardUI** | Gap filler. Free blocks of interest: Sidebar, Auth Card, Stat Cards, Notification Center, Settings Modal; free components incl. Segmented Control, Command Palette, Token Input. | Copy-in (boardui.com) | Free tier MIT; Pro is paid and not used. Built on react-aria, like HeroUI. |
| **Magic UI** (`@magicui` registry) | Accents and effects: Dock, patterns (dot, grid, flickering grid, retro grid), Border Beam, Shine Border, Blur Fade, Number Ticker, text animations, Animated Theme Toggler. | shadcn registry in `components.json` | MIT. |
| **React Bits** | Animated backgrounds (Aurora, Silk, Threads, Dot Grid, Light Rays, ...), animated nav (Dock, Pill Nav, Gooey Nav), text effects (Shiny, Blur, Split, Count Up). | Copy-in (reactbits.dev, TS + Tailwind variant) | MIT + Commons Clause. Some backgrounds need WebGL (`ogl`/`three`); check bundle size and phone performance. |
| **Untitled UI React** | Reference and source for app shell patterns: sidebar navigations (free), header navigations (free), page headers and log-in pages (likely PRO). | Copy-in | Free parts are MIT. **Page headers and log-in pages appear to be PRO: confirm before using.** `@untitledui/icons` is installed for classic but is not used in pro. |
| **Kokonut UI** (`@kokonutui` registry) | Already used for smooth-tab in classic. Available as an option, not on the owner's main list. | shadcn registry | MIT. |

**Origin UI is dropped** (owner, 2026-11-17): do not suggest it.

Unknown or unverified facts about a library must be checked on its site at decision time, not
assumed from this table.

## 4. Visual foundations

Decided (see the Decision log for dates):

- **Name: always "HAD" with "Home Assistant Dashboard" as its long form. Never use "HOMZ"** in
  pro UI text, titles, metadata or docs. (The placeholder `ProShell.tsx` still says HOMZ; it is
  replaced when the sidebar is built.)

- Look: HeroUI v3 handbook style. Calm neutral canvas, white surfaces (`--surface`), soft shadow,
  no borders, flat (no glass, no blur). One owner-approved exception: the mobile nav pill uses
  React Bits Glass Surface (7.3).
- **One accent per page**, set by `data-page` on the shell in `src/pro/pro.css`:
  Overview blue (hue 254), Rooms teal (192), Energy orange (52, dark foreground),
  Security violet (300), Media fuchsia (330), Mobility emerald (155). Other pages: pending.
- Font: Plus Jakarta Sans Variable (UI), JetBrains Mono Variable (numbers or code where needed).
  Tabular numbers on.
- Priority device: **phone first**. Every component must work at 375 px with a 16 px gutter and
  respect safe areas (`env(safe-area-inset-*)`).
- Light and dark for every surface (`.dark` class on the shell).
- Motion respects `prefers-reduced-motion` (`MotionConfig reducedMotion="user"` in `main.tsx`).

Pending: accent for pages without one, radius scale, spacing scale, elevation levels, the shell
background treatment, motion language.

## 5. Icon and label rule

Every button, pill, chip, label, tab, nav item, list row, empty state, alert and section header
carries a Hugeicons icon. Context decides between **icon + text** and **icon only**:

| Context | Form |
|---|---|
| Primary and secondary actions, form submit, nav items with room (sidebar, expanded) | Icon + text |
| Chips, pills, status labels, tabs, segmented controls | Icon + text |
| Section and card headers, page headers | Icon + text |
| Toolbar actions, card corner actions, dense rows, collapsed sidebar | Icon only |
| Phone bottom nav | Decided per component (icon only, or icon + short label) |

Icon-only controls must have an `aria-label` and a HeroUI `Tooltip` (on pointer devices). Icon
sizes: 16 (dense), 18 (default), 20 to 22 (nav, headers). Final sizes are a pending decision.

## 6. Integration rules

- Use HeroUI `Button` for every pressable; raw `<button>` is blocked by
  `tests/rawControlGuard.test.ts`.
- Copied-in components: replace their colours, radii and shadows with HeroUI tokens
  (`--accent`, `--accent-foreground`, `--surface`, `--background`, `--foreground`, `--muted`,
  `--focus`) and the pro helpers (`.pro-surface`, `.pro-soft`, `.pro-accent`). Swap their icons
  for Hugeicons. Keep a header comment with the source URL and licence.
- If a copied component needs a new dependency (for example `ogl`), it is a decision: ask first,
  then run `npm run check:bundle`.
- Accessibility: keyboard reachable, visible focus (`--focus`), touch targets at least 44 px,
  WCAG AA contrast in both themes.
- Async views use loading, empty and error states (pro versions are a pending decision; until
  then reuse `ViewLoadingState`, `ViewEmptyState`, `ViewErrorState`).

## 7. Component specs

Build order: **1 Sign-in page → 2 Sidebar → 3 Mobile nav bar → 4 Page headers**, then pages.

### 7.1 Sign-in page — status: BUILT (2026-11-17)

Replaces the classic `AuthModal` in pro only (pro will import a new `src/pro/components/ProSignIn.tsx`
instead of `@/components/auth/AuthModal`). Behaviour to keep, from `AuthModal.tsx` and
`AuthContext`:

- Home Assistant URL field, validated with the existing `validateHaUrl`; warnings for `http://`
  and raw IP targets; prefilled from server config when available.
- Two methods: **OAuth2** (`loginOAuth(haUrl)`, default in browser) and **Long-Lived Access Token**
  (`loginLLAT(haUrl, token)`, default in installed PWA), with show/hide for the token.
- **Demo mode** (`enterDemoMode()` then `reloadDemoData()`).
- Not dismissible until signed in or in demo mode; errors shown inline.
- Do not change auth logic or token handling (security-sensitive).

| Part | Decision |
|---|---|
| Layout / base | **BoardUI Auth Card** (free block), copied into `src/pro/ui/boardui/` and re-skinned onto HeroUI tokens; its inner controls become HeroUI (TextField, Button, Alert) and its icons Hugeicons |
| OAuth / token switcher | **HeroUI Tabs**, icon + text per tab |
| Background | **Plain canvas** (HeroUI `--background`), nothing animated |
| Accent | **Overview blue** (hue 254), the page the user lands on after sign-in (`data-page="overview"` on the sign-in root) |
| Brand mark | **Hugeicons home icon in a rounded accent tile + "HAD" (title) + "Home Assistant Dashboard" (subtitle)** |
| Copy | Title **"Welcome home"**, subtitle **"Sign in with your Home Assistant to continue."** |

Implementation notes:
- `src/pro/ui/boardui/AuthCard.tsx` is the BoardUI shell only (mark, heading, form slot, "or"
  divider, alternatives slot, footer, footnote). BoardUI's email/password/social/OTP internals were
  removed because HAD signs in against Home Assistant.
- `src/pro/components/ProSignIn.tsx` holds the HAD form. It replaces `AuthModal` in `ProApp.tsx`
  and covers the screen (`fixed inset-0`) while `isAuthModalOpen`. Close button and Escape only
  when already signed in or in demo mode.
- Fields use HeroUI `TextField` + `InputGroup variant="secondary"` (the variant for fields on a
  surface). Tab labels are `whitespace-nowrap` so "Access token" fits at 375 px; tab panels have
  no side padding so the buttons align with the fields.
- Demo button: HeroUI `secondary`, "Explore the demo" with SparklesIcon. Footnote: "Demo mode
  uses sample data stored only in this browser."
- Verified: lint, unit tests, `build:pro`; browser at 375 px dark and desktop light; token
  validation. Not verified: a real OAuth or token sign-in, the installed PWA notice.

Rejected: HeroUI composed card, Untitled UI log-in page, Origin UI dialog; BoardUI Segmented
Control and Kokonut smooth-tab for the switcher; Magic UI pattern, React Bits background, split
screen.

### 7.2 Sidebar (desktop and tablet) — status: BUILT (2026-11-17)

Current placeholder: `src/pro/components/ProShell.tsx` (HeroUI Buttons in an `aside`, 256 px).
Shown from `md` (768 px) up; phones use the mobile nav bar (7.3).

| Part | Decision |
|---|---|
| Base | **Untitled UI sidebar navigation, "Section dividers" variant** (switched from "Section subheadings" on 2026-11-17) (free, MIT; `npx untitledui@latest add sidebar-navigation-base`, files under `app-navigation/base-components`). Copied into `src/pro/ui/untitledui/` and re-skinned onto HeroUI tokens; inner controls become HeroUI (Button, Tooltip, Avatar, Dropdown, Chip) and icons Hugeicons. Its own hamburger header below `lg` is removed: phones get the bottom nav, tablets get the rail. |
| Collapse | **Auto + toggle**: starts as an icon rail on tablets (768-1023 px) and full from 1024 px; a toggle button switches it, and the user's choice is remembered on the device (localStorage, per-viewer convenience). Icon-only rows show a HeroUI Tooltip. Untitled UI's variant has no collapse, so the rail is added on top of it. |
| Nav groups | **Three groups split by space (expanded) or thin dividers (rail), no heading labels; expanded lines removed 2026-11-17, same 13 px gap** (labels kept only as accessible names): **Home**: Overview, Rooms, Energy, Security. **Life**: Media, Mobility, Health, Vacuums. **System**: System, Network, Automations, Integrations. **Settings** pinned in the footer. |
| Footer | **Account card** (HA user avatar + name, menu with Sign out; demo badge in demo mode), **HA connection status** chip with icon (Live, Connecting, Offline, Demo), **theme toggle**. |
| Notifications | **Not in the sidebar.** Bell in every page header (7.4). |
| Panel | **Edge-to-edge**: full-height column flush to the left edge, on the canvas colour (`--background`), no card, no border. Page content sits on white surfaces to the right. |
| Width | **256 px** expanded; rail width follows the 44 px touch target plus padding (about 72 px). |
| Active item | **Soft accent pill**: `.pro-soft` (pale tint of the page accent) behind the row, icon and text in the accent foreground. Inactive rows: muted text, hover tint. |

Implementation notes:
- `src/pro/ui/untitledui/SidebarSectionDividers.tsx`: the adapted Untitled UI layout (generic:
  groups, active id, collapsed, logo, header action, footer). Rows are HeroUI ghost Buttons, 36 px
  tall (44 px squares in the rail). The nav list scrolls (hidden scrollbar); header and footer stay
  pinned, so the account card is always visible (checked at 1280x800).
- `src/pro/components/ProSidebar.tsx`: HAD content. Brand tile (Home01Icon, 36 px) + "HAD" +
  "Home Assistant Dashboard" (11 px so it fits beside the toggle). Respects
  `config.navigation.hiddenPages` (Overview and Settings can't be hidden), like classic.
- Collapse: `src/pro/hooks/useSidebarCollapsed.ts`, key `had_pro_sidebar_collapsed`; no key means
  auto (rail below 1024 px).
- Status chip: `src/pro/lib/connectionBadge.ts` (tested in `tests/connectionBadge.test.ts`), same
  rules as the classic telemetry: Demo (accent), Live (success), Connecting (warning),
  Sign-in expired (danger), Offline (default). Tooltip gives the detail.
- Account menu: HeroUI Dropdown with one item, Sign out (danger, `logout()`).
- Provisional nav item icons (not a recorded decision; swap on request): Overview
  DashboardSquare01, Rooms Sofa01, Energy Flash, Security Shield01, Media MusicNote01, Mobility
  Car01, Health HeartCheck, Vacuums Robot01, System Cpu, Network Router01, Automations
  WorkflowSquare01, Integrations Puzzle, Settings Settings01. Toggle: SidebarLeft01.
- Dividers use HeroUI `Separator variant="tertiary"`: the default one was nearly invisible on the
  dark canvas.
- Notifications live in the page header bell (7.4).
- Verified: lint, unit tests, `build:pro`; browser at 1280x800 light, collapsed rail, account
  menu opens, auto rail at 900 px, dark mode. Not verified: real HA user name/owner, the
  offline/auth-failed chips live, a real sign-out.

Rejected: BoardUI Sidebar, Untitled UI Simple and Slim, Section subheadings (built, then dropped as confusing), HeroUI composed; never-collapse,
toggle-only and width-only collapse; flat list, dividers, only-rebuilt-pages.

### 7.3 Mobile nav bar (phone) — status: BUILT (2026-11-17)

Shown below `md` (768 px); replaces the placeholder bottom bar in `src/pro/components/ProShell.tsx`.

| Part | Decision |
|---|---|
| Base | **React Bits Glass Surface** (`src/ts-tailwind/Components/GlassSurface/GlassSurface.tsx` in github.com/DavidHDev/react-bits; MIT + Commons Clause: fine inside the app, never redistribute the component on its own). Copied into `src/pro/ui/reactbits/` with its source/licence header. **This is a deliberate exception to "flat, no glass"**, for the mobile nav only. |
| Glass on iPhone | **Use the component's own fallback.** Refraction (SVG backdrop filter) renders only in Chromium; on iOS (all browsers are WebKit), Safari and Firefox it falls back to a frosted blur. Accepted by the owner. |
| Tabs | **Overview, Rooms, Energy, Security, More** (the sidebar's first group + More). Same icons as the sidebar. |
| Labels | **Icon only**, each with an `aria-label` (the "every element has an icon" rule is met; text lives in the accessible name). |
| Bar style | **Floating pill**: rounded, inset from the bottom edge above the safe area, content scrolls behind it. |
| Glass preset | **React Bits "Frost" preset** (demo LOOK values + `displace: 3`, `backgroundOpacity: 0.28`), set as `FROST` in `ProMobileNav.tsx`. The default look let page text show through sharply and hurt readability. |
| Active tab | **Accent icon + dot**: the icon turns the page accent colour with a small accent dot under it, no background. `aria-current="page"`. **Revised 2026-11-18 (owner):** all icons are pure black (light) / pure white (dark) for contrast on the glass; the current tab is bolder (stroke 2.4 vs 1.5) and keeps the accent dot. Second revision: icons 26 px on phones and 30 px from 640 px (pill 76 px tall, `max-w-md`); in light mode the glass background is 72 % white instead of 28 % so black icons stay readable over photos. Dark mode unchanged. |
| More | HeroUI **Drawer** (bottom sheet) that **mirrors the sidebar**: the Life and System groups split by dividers, then Settings, connection status chip, theme toggle and the account card with Sign out. Reuses the sidebar's parts (`SidebarNavRow`, `connectionBadge`, account Dropdown) rather than duplicating them. The More button shows the active state when the current page lives in the sheet. |

Implementation notes:
- `src/pro/ui/reactbits/GlassSurface.tsx` is trimmed from 1,025 to about 255 lines to respect the
  800-line file guard: the WebGL renderer, `backdrop` prop and `shape` tracing were removed (unused).
  The SVG refraction and frosted fallback are unchanged. Added `colorScheme` so its `light-dark()`
  tints follow HAD's theme toggle, not the OS preference. `data-glass` on the element says which
  mode rendered (`refraction` or `frosted`).
- Pill: 64 px tall, radius 32, full width up to `max-w-sm`, 16 px side gutter, bottom
  `max(12px, safe-area)`. Tabs are 48 px HeroUI ghost icon buttons; active = `--accent` icon + 6 px dot.
- More: `Menu01Icon`. The Drawer dialog carries `class="pro"` + `data-page` because it is portaled
  outside the shell and would otherwise lose the pro tokens and page accent.
- Shared with the sidebar: `src/pro/components/proNav.ts` (nav groups, Settings item, hidden-page
  filter) and `src/pro/components/ProAccountControls.tsx` (status chip, theme toggle, account menu).
- Verified: lint, unit tests, `build:pro`; browser at phone width in dark (refraction) and light,
  More sheet opens, navigating from it closes it and marks More active. Not verified: the frosted
  fallback on a real iPhone/Safari, a real device's safe area.

Rejected: HeroUI bottom bar, Magic UI Dock, React Bits Pill/Gooey Nav, Untitled UI mobile
header; 3 pages + More, pick-in-Settings; icon + label, label-on-active; edge bar, translucent
pill without Glass Surface; same-look-everywhere glass; soft and solid accent circles; grid and
pages-only More sheets.

### 7.4 Page headers — status: BUILT (2026-11-17)

One shared header component used by every pro page. Untitled UI's page headers are PRO-only (not
in its free repo) and BoardUI has none, so it is composed from HeroUI parts.

| Part | Decision |
|---|---|
| Layout | **Icon tile + title**: the page's nav icon in a soft accent tile (`.pro-soft`), the title, and a one-line status under it; actions on the right. |
| Title | **Revised 2026-11-17: classic long title from 768 px up** ("Security & Safety", "Energy & Power"; `PRO_PAGE_LONG_TITLES` in `proNav.ts`), **short nav name on phones**. Same in the compact bar. **Overview shows the greeting** ("Good evening, Samer" + `WavingHand01Icon` in the accent), as in classic. |
| Subtitle | **Revised 2026-11-17: rich live sentence with inline HeroUI soft chips** (icon + value; tone by meaning: success, warning, danger, accent, default; no gradients or glow), like the classic `*HeaderSentence` components, **on all 13 pages**. Shown full width under the title row so the chips can wrap. Not in the compact bar. |
| Scroll | **Collapse to a compact bar**: the full header at the top; once it scrolls out, a slim sticky bar with the small icon, title and actions stays at the top. |
| Compact bar | **Canvas colour** (`--background`), with a hairline shadow while content passes under it. Flat, no glass. |
| Notifications | **Icon-only bell with an unread counter in every page header**, on phone and desktop; opens the existing notification drawer (`onOpenNotifications`). Tooltip "Notifications". |
| Overflow (⋮) | **Per page, hidden if empty**: pages pass their own menu items; no ⋮ until a page has some. |
| Entrance animation | **Magic UI Blur Fade** (`@magicui` registry, motion-based, already a dependency) on the full header when the page changes. Respects reduced motion. |
| Breadcrumbs | **Planned, not decided** (owner, 2026-11-17). Add when pages get sub-views (e.g. Rooms > a room, Settings > a section, a device detail). Decide the library (HeroUI `Breadcrumbs` is in the free core), placement (above the title, or replacing the title on phones) and the back affordance when the first page with sub-views is built. |

Implementation notes:
- `ProShell` renders the header for every page; the title and icon come from `proNav.ts`, so pages
  never render their own `<h1>`.
- Pages set their ⋮ items with `useProPageHeader({ menu })` from
  `src/pro/components/pageHeaderContext.ts` (pass a memoised `menu`). Security's old in-page
  header (title, status line, All clear/Attention chip) was removed.
- Subtitles: wording lives in pure builders in `src/pro/lib/pageSentences.ts` (tested in
  `tests/pageSentences.test.ts`); `src/pro/components/PageSentence.tsx` has one small component per
  page that reads live data and renders `RichSubtitle`. Data sources are live store state or
  existing pure helpers only, never history queries: Overview weather + `person` presence; Rooms
  and Media `useRoomsData`; Energy `computeInstantaneousPower` + cached energy prefs; Security
  `useSecurityData`; Mobility `deriveCarMetrics`/`deriveBikeMetrics`; Health
  `resolveHealthSensorsForDevice`; Vacuums `discoverVacuumDevices`; System the System Monitor ids
  from `useSystemMetrics` (without its demo defaults); Network Speedtest, AdGuard blocked ratio and
  TP-Link client counts; Automations/Integrations/Settings counts from `states`, `devices`,
  `haCoreVersion` and the visible nav. To change a page's sentence, edit its builder and test.
- Compact bar: `ProCompactHeader` is a `sticky top-0 h-0` wrapper inside `<main>` with the bar
  absolutely positioned; an IntersectionObserver on a sentinel under the full header switches it
  on. The hidden bar is `inert` + `aria-hidden`. `<main>` has no top padding (it moved to the inner
  container), because padding on the scroller offsets sticky elements.
- Bell: HeroUI `Badge` (danger, `99+` cap) on an icon button; unread count from
  `useHANotificationSummary`; aria-label includes the count.
- Blur Fade is keyed by page, so it replays on every page change.
- Verified: lint, unit tests, `build:pro`; browser at phone width (full header, compact bar on
  scroll, light and dark) and desktop (header, bell opens the notification drawer). Not verified: a
  page with ⋮ items (none yet), notch safe area on a real device.

Rejected: large title, title + status chip; scroll-away and always-sticky; bell on Overview only
and header-on-desktop/More-on-phone; no animation, React Bits Blur Text and Split Text; classic
long titles; static description and no subtitle; Frost glass and white compact bar; fixed and no
overflow menus.

### 7.5 Security page — status: BUILT, redesigned (2026-11-24)

Redesigned from the 5 owner-approved concepts in the Security Studio (`/?studio=security`, [SECURITY.md](SECURITY.md)). Accent: violet (`hue 300`, `data-page="security"`). Status pills remain strictly green / orange / red.

- **Layout (2026-11-24):** One scrolling page on desktop & tablet (`≥ 768 px`: Alarm + Attention 8/4 and Cameras + Recent Activity 8/4 on `≥ 1024 px`, Devices full width); on phone (`< 768 px`), **Alarm hero** stays pinned above Kokonut `SmoothTab` tabs (`Alerts`, `Cams`, `Log`, `Devices`).
- **Chosen concepts:** Alarm hero **A** (Shield Halo Console with 4-zone concentric perimeter SVG ring), Needs attention **B** (Perimeter Radar Matrix 2×2 zone grid with inline drilldown + `ProSheet`), Cameras **A** (Theater Stage + Filmstrip with captions strictly below video), Recent activity **C** (Compact Audit Ledger), Device groups **B** (Interactive Tile Deck with category filters + `SecurityDeviceSheet`).
- **Critical-action safety rule:** Always require **press-and-hold** (`HoldToConfirmButton`) for critical security actions: arming Away / Vacation (and code-free Disarm when armed), unlocking locks, opening garages/gates, and testing sirens.

Previous 2026-11-18 specification notes retained below for HA plumbing reference:

| Decision | Choice |
|---|---|
| Layout | **Revised 2026-11-18: alarm hero + attention, then cameras + recent activity, then device groups** (owner: cameras above the devices). Originally: alarm hero, then "Needs attention", then device lists, then cameras. Phone: one column in that order. Desktop: hero and attention side by side (about 2:1), lists and cameras full width below. |
| Status tiles | **Dropped** (owner: the subtitle sentence already gives the counts; agent's call). Counts move into each device card's header ("Doors & windows · 1 open"). |
| Alarm hero | **State hero + segmented modes.** Large shield tile tinted in the state colour (disarmed neutral, armed success, arming/pending warning, triggered danger), state as the title ("Armed away"), "by <changed_by> · <time ago>" and the panel name below. Modes Off · Home · Away · Night in one HeroUI `ToggleButtonGroup`, icon + label; only the modes the panel supports (`supported_features`). |
| PIN entry | **Sheet when needed.** Only when HA needs a code (`code_format`, `code_arm_required`): a mode tap opens a HeroUI `Drawer` (phone) / `Modal` (desktop) with HeroUI `InputOTP` and a number pad. No keypad on the page otherwise. |
| Openings open when arming | **Confirm dialog.** Arming Away or Night with doors/windows open opens a HeroUI `AlertDialog` listing them, Cancel / Arm anyway. HA decides the rest. |
| Panic button | **None** (owner). Avoids accidental false alarms; triggering stays in HA. |
| Alarm panel picker | **Added 2026-11-18** (owner: their live alarm didn't show). Cause: the panel (an Aqara hub) is marked hidden in HA, and the page only listed visible panels. Now every non-disabled panel is listed, visible first, and a HeroUI `Select` replaces the panel name in the hero when there are two or more; the choice is remembered per device (`setSelectedAlarmEntityId`). |
| Needs attention | Open doors/windows, unlocked locks and active hazards, hazards first. **"Lock all"** button when two or more locks are unlocked. When nothing needs attention it shows a calm "All secure" state, so the desktop slot is never empty. **Revised 2026-11-18 (owner):** below 1024 px that state is a slim one-line row (icon, "All secure", short line); the centred card only on desktop. |
| Devices grouping | **Toggle both**: by type by default (Locks, Doors & windows, Motion, Hazards), HeroUI `ToggleButtonGroup` switch to by room (floor, then area). Problems sort to the top. |
| Lock control | **Button with press-and-hold to unlock** (owner). Revised 2026-11-18: the button just says "Unlock" (the hold explains itself; the accessible name says "press and hold"), and lock rows have **no state pill**: the tile (green locked, orange unlocked) and the Lock/Unlock button tell the state. Lock is a plain tap; Unlock fills while held (~1.5 s), releasing early cancels. Built on the HeroUI `Button` with react-aria long-press (HeroUI has no hold button). |
| Recent activity | **Yes**: a card with the latest security events (alarm changes with who, doors/windows, locks, motion, hazards) from the HA logbook. New data fetching. |
| Status pills | **Revised 2026-11-18 (owner): every status pill is green, orange or red.** Green = fine (closed, clear, dry, locked, armed, live); orange = needs a look (open, motion, unlocked, disarmed, connecting, snapshot only); red = problem (detected, jammed, triggered, offline). Device tiles stay neutral when all is well, and take the orange/red tone otherwise. Applies to the header sentence too (motion and disarmed are orange there). |
| Device groups | **Magic UI Bento Grid** (MIT, copy-in to `src/pro/ui/magicui/BentoGrid.tsx`), re-skinned: `.pro-surface` cards, Hugeicons, no hover CTA (touch first), no fixed 22rem rows (`auto-rows-min`, `grid-flow-dense`). One bento card per group (by type: Locks, Doors & windows, Motion, Hazards; by room: one per area). **Size from content** (agent's call): 1 column on phone, 2 from 768 px, 4 from 1280 px; a group with 1–3 devices spans 1 column, 4+ spans 2. Empty groups are hidden. **Revised 2026-11-18 (owner: "optimise space"):** masonry packing. Grid rows are 4 px and each card measures itself (ResizeObserver) and spans the rows it needs, with `grid-flow-dense`; groups are placed largest first (`packOrder`), so small cards fill the space beside or under shorter big ones. The fixed 2-row span for 7+ is gone. In the room view this means rooms are ordered by size, not floor (the floor is still in each card's summary). |
| Rows inside a group card | Agent's call: list rows, icon tile tinted by state, name, area (by type) or device type (by room) as a second line, HeroUI soft `Chip` for the state, the lock button on the right for locks. Problems first. |
| Camera player | **Revised 2026-11-18: WebRTC into a native `<video>`** (owner; the classic `CameraFeed` was laggy and drew text over the picture). `ProCameraPlayer` + `useWebRtcCamera`: one RTCPeerConnection per player straight to `/api/cameras/:id/webrtc` (go2rtc), no shared pool, no HLS fallback, no overlays; the HA snapshot sits underneath until the first frame, and a camera icon replaces a snapshot HA can't serve. Only the featured camera streams; thumbnails are snapshots. Status pill: Live green, Motion / Connecting / Snapshot orange, Offline red. Rejected: HA's own HLS (5–10 s behind), MJPEG. |
| Cameras | **Redesigned now: featured camera + strip, captions below** (owner). One large camera (the one with motion, else the first) with a caption row under the video: icon, name, area, status chip (Live / Motion / Offline), snapshot and full-screen icon buttons. Below it a row of thumbnails, each with its name under the picture; tapping one makes it the featured camera. No text over video. Reuses `CameraFeed` (go2rtc plumbing) only; the classic section and modal are not used. |
| Camera live view | **Revised 2026-11-18 (second pass): full screen that always works.** Order: the browser's element full screen on the camera frame (prefixed for Safari), the system video player on iPhone when live, otherwise a fixed full-window view with an exit button and Escape. If the native request hasn't taken effect within 400 ms (embedded browsers silently ignore it; the owner's tap did nothing) the full-window view opens. The picture is shown whole (`object-contain`) in full screen. First pass: **native full screen** (owner; the modal was a pop-up, not full screen). The full-screen button and a tap on the picture call `requestFullscreen` on the `<video>` (iPhone: `webkitEnterFullscreen`, the system player), or on the snapshot frame when not live. No camera switching while full screen. `CameraLiveModal` removed. |
| Camera filter | **Area chips only with 5+ cameras in 2+ areas.** |
| Recent activity layout | **Timeline, last 8** events from the past 24 h; "Show more" expands to at most 50 (a busy sensor logged 2,500+ changes a day in the owner's home). Icon dot tinted by event type, a sentence ("Front door unlocked by Samer"), time ago. Beside the cameras on desktop. |

Implementation notes:
- Files: `src/pro/pages/ProSecurity.tsx` (layout), `src/pro/components/security/` (`AlarmHero`,
  `AlarmCodeSheet`, `AttentionCard`, `DeviceGroups`, `DeviceRow` with `StatusChip` and
  `LockAction`, `HoldToConfirmButton`, `SecurityCameras`, `RecentActivity`),
  `ProCameraPlayer`, `src/pro/components/ProSheet.tsx` (Drawer on phones, Modal from 768 px), `src/pro/ui/magicui/BentoGrid.tsx`,
  `src/pro/hooks/useSecurityActivity.ts`, `src/pro/hooks/useWebRtcCamera.ts`, `src/pro/hooks/useMediaQuery.ts`, pure logic in
  `src/pro/lib/securityLogic.ts` (tested in `tests/securityLogic.test.ts`).
- Desktop split (hero + attention, cameras + activity) starts at 1024 px (`lg`), 2:1.
- Bento cards are CSS containers: the chip beside a lock button shows only when the card is at least
  384 px wide (`@sm`), and the two-column list inside a card only from 576 px (`@xl`). Agent's call
  after testing: at 4 bento columns inside the 1024 px content width the rows were too cramped.
- Alarm modes stack icon over label on phones so all four fit; side by side from 640 px.
- "Arm anyway" ignores presses in the first 400 ms after the dialog opens, so the tap that opened it
  cannot confirm it by accident (seen in testing).
- Alarm changes: demo mode writes the new state locally (no HA to echo it); live mode waits for HA.
- Activity: HA `logbook/get_events` for the past 24 h over the tracked entities, refetched when one of
  them changes state; user ids are mapped to people via `person` `user_id`. Demo or a failed call
  falls back to each entity's `last_changed` (the demo has none, so it shows the empty state).
- Cameras: same source list as before (`getConfiguredRtspCameras`, so only cameras with a configured
  stream). The pro page no longer uses the classic `CameraFeed` (its `quietIdle` prop was reverted).
  In development go2rtc is off (HTTP 503), so the featured camera shows "Snapshot".
- Sensor-only bento cards split into two columns from a 448 px card (`@md`); cards with lock
  buttons from 576 px (`@xl`).
- Store fix (shared with classic): `useAutoLayoutStore` read `haWebSocketService.getVersion()` while
  being created; with live mode cached and the pro entry's import order (haWebSocket -> alertService
  -> store cycle) that threw and blanked the app. It is now read defensively.
- `pro.css` hides the global UI-006 focus ring on the invisible InputOTP input only; the active slot
  shows the focus ring instead.
- Verified in the browser with demo data at phone (375 px), 800 px and 1360 px, dark and light:
  arming with openings open (confirm, code sheet, state and subtitle update), hold to unlock (short
  press ignored), Lock all, by room grouping, camera featured/strip/filter/full screen/next (cameras
  injected temporarily, since the demo has no configured streams), activity timeline (change times
  injected temporarily). Not verified: a real HA instance (logbook rows, codes, `supported_features`,
  live go2rtc streams, snapshot download from a live frame).

### 7.6 Overview page — status: BUILT, rebuilt (cutover 2026-11-20)

Rebuilt on the plan in `docs/pro-ui/OVERVIEW_REBUILD.md` (phases 0–5, owner decisions there);
the first version (2026-11-18: BentoGrid masonry, dnd-kit, `1x`/`2x`/`2x2`, 22 widgets, status
pills for everything) is in git history and the decision log. Widget looks are chosen one by one
in the Widget Design Studio (`docs/pro-ui/WIDGET_DESIGN.md` §7, `widgets/designRegistry.ts`).

| Part | Decision |
|---|---|
| Structure | Attention pills → section tabs (+ Customize) → sections, each with its own grid. Header (greeting, weather and presence sentence) is the shared page header. `src/pro/pages/ProOverview.tsx`, shell in `components/overviewNext/OverviewShell.tsx`. |
| Widgets | One folder per widget under `src/pro/widgets/<id>/`, declared with `defineWidget` (section, sizes, model hook, designs, sheet, `count`, `attention`, fixture) and listed in `widgets/registry.ts` (20 widgets). Each widget subscribes only to what it needs. |
| Sizes and grid | Small 1×1, Wide 2×1, Tall 1×2, Large 2×2; 2 / 4 / 6 columns on phone / tablet / desktop; rows 148 px, gap 12 px. View mode is a plain CSS grid; edit mode is react-grid-layout v2. **Free placement** (owner, 2026-11-20): a card stays in the cell it is dropped in, others step down to make room, empty rows close up; defaults and migration still flow in reading order. |
| Layouts | One per device type, in `preferences.proOverviewLayout` (classic `overview.*` keys only read once to migrate). A screen can be pinned to a device type's layout while customizing (per screen, localStorage). |
| Sections | Rooms, Climate, People, Lights, Switches, Energy, Security, Cameras, Doors & windows, Media, Vacuums; reorder and collapse; small sections sit side by side in view mode. |
| Tabs | Kokonut `SmoothTab` (`badges="always"`): "All" plus one tab per section on the page, numbered with the sum of its widgets' `count()` (lights on, people home, doors open…), warning/danger coloured when something there needs attention. `?tab=` in the URL. A tab shows its section alone, full width. |
| Attention pills | HeroUI `TagGroup`: only problems, from each widget's `attention()`, worst first; a pill opens the widget's sheet. None: a quiet "Nothing needs attention" line. |
| Tap rule | The card's corner button (or header) opens the details sheet; the body holds controls only. |
| Sheets | In the URL (`?sheet=lights`, `?sheet=cameras&id=…`), lazy loaded, one at a time, Back closes. Redesigned 2026-11-20 on one shared kit (`widgets/shared/sheet/SheetKit.tsx`): a right-side panel on desktop (bottom drawer on phones), coloured hero with the state in words and the main actions, grouped lists below; every widget has one. Owner-reviewed: WIDGET_DESIGN.md §8. |
| Customize | Customize button beside the tabs opens a draft: Add widgets (registry, by section), size menu and snapping corner, drag handle, move earlier/later, hide, section up/down, Reset, Cancel (or Escape), Save. Nothing is written before Save; leaving with changes asks first. |
| Empty state | No widgets on the page: "Nothing on your Overview" with Add widgets and Restore default layout. |
| Demo mode | Service calls apply the state a real HA would report (`lib/demoServices.ts`), and a quiet "Demo home: changes stay on this screen" note sits beside the pills. |

### 7.7 Notification center — status: BUILT (2026-11-19)

Reimagined from the ground up; replaces the classic `NotificationDrawer` in the pro app only
(classic is untouched). Data, read state and HA actions are the shared ones
(`useHANotifications`, `useNotificationReadStore`, the item `actions`).

| Part | Decision |
|---|---|
| Placement | **HeroUI `Drawer` from the right on tablet/desktop (~420 px), full-height bottom sheet on phones** (owner). Opened by the page-header bell. |
| Organisation | **Triage + stacks** (owner). Top: **Needs action** (severity critical or error: hazards, triggered alarms, failing repairs). Then **stacks by kind**: Home alerts, Repairs (repairs + restarts), Batteries, Updates; then **Messages** (HA persistent notifications) as plain rows. Stack order is the agent's call (most urgent kind first). A stack of one renders as a normal row. While searching, a flat list of matches replaces the stacks. |
| Stacks | **Collapsed by default** with a one-line summary ("Core, Zigbee2MQTT and 5 more") and the stack's bulk action (**Update all** on Updates); tap to expand (owner). Built on HeroUI `Disclosure`. |
| Item | **Compact row**: icon tile (integration brand icon when known, else a Hugeicons category icon), title, one-line summary, time, unread dot. **Tap to expand** details (message, version chip, release notes, install progress, action buttons) with HeroUI `Disclosure` (owner). |
| Tones | Icon tiles follow the pill rule: **red** critical/error, **orange** warning, neutral otherwise (agent's call, from 7.5 pill colours). |
| Header | Bell tile + "Notifications" + "N unread", **Mark all read** button, **⋮ HeroUI `Dropdown`** with Refresh, Clean skipped updates, Clear all (HeroUI `AlertDialog` confirm), close button. **HeroUI `SearchField` only with 8+ items** (owner). |
| Dismiss | **Swipe left on touch** (motion `drag`, HeroUI has no swipe) **and a ✕ on hover/focus on desktop**, with **Undo** for 5 s (owner). Only items HA lets us dismiss. The HA call waits until the undo window closes, since HA dismissals can't be undone. The undo bar sits inside the panel (agent's call: toasts are the next decision). |
| Read state | **Expanding an item or using one of its actions marks it read**; Mark all read does the rest (owner). Per device, as before. |
| Empty state | HeroUI `EmptyState`-style composed block: check tile, "You're all caught up" (agent's call). |
| Toasts | Built next, see 7.8 (owner). |

Implementation notes:
- Pure logic in `src/pro/lib/notificationLogic.ts` (sections, stacks, summaries, tones), tested in
  `tests/notificationLogic.test.ts`. UI in `src/pro/components/notifications/`.
- Bulk actions (Update all, Clean skipped, Clear all, Refresh) live in
  `src/pro/hooks/useProNotificationActions.ts`, ported from the classic drawer's handlers.
- Message bodies use a small pro Markdown renderer (paragraphs, lists, bold, code, safe links via
  `sanitizeSafeUrl`); release notes load on expand with `haWebSocketService.getReleaseNotes`.
- The in-row "Dismiss" action goes through the same undo path as swipe and ✕.
- Verified (demo data): lint, unit tests, `build:pro`; desktop right panel, tablet, phone sheet;
  dark and light; stacks expand, release notes load, expand marks read, Mark all read, swipe
  dismiss + Undo. Not verified: live HA (real repairs, Update all, Clear all against HA), swipe on
  a real touch device.

### 7.8 Toasts and emergency alert — status: BUILT (2026-11-19)

The pro app had no toasts and no emergency alert until now (classic renders its own).

| Part | Decision |
|---|---|
| Component | **HeroUI `Toast`, stacked** (free core): newest on top, older ones peek behind, fan out on hover/keyboard focus (Alt+T jumps to them), close button. HeroUI's toast has no swipe-to-dismiss; not added (agent's note). (owner) |
| Placement | **Top centre on phones** (clear of the nav pill), **top-right from 768 px** (under the bell) (owner). |
| Events | **All four groups** (owner): security changes (lock unlocked/locked, garage/cover opened), doors and windows opened, appliance finished + new HA persistent notifications, errors (HA action failed) + confirmations (Dashboard refreshed). Sources: `useAlertStore.toasts` (alertService) and the shell's `addToast`. |
| Look | Tone by meaning (green/orange/red rule): **red** critical, **orange** warning, neutral info, green for confirmations; Hugeicons indicator per event (lock, door, window, garage, appliance, message, alert) (agent's call). Durations from the source (classic: 4.5–6 s; 0 = stays). At most 3 visible. |
| Emergency | **Red full-screen HeroUI `AlertDialog` + a red toast that stays until acknowledged** (owner). Shows sensor, room and time; **Acknowledge** and **Open Security** (the pro Rooms page isn't built yet; agent's call). Plays the existing chime. |
| Emergency triggers (reviewed, owner asked) | Only **binary sensors that are on** with device class **smoke, gas, carbon_monoxide, moisture or safety**; binary sensors **without** a device class only by a leak/flood/smoke word in the id or name, never rain/weather/soil sensors; plus **alarm panel `triggered`**. Lights, switches and other domains never trigger it. "flood" no longer matches "floodlight". Fixes the camera floodlight raising a water-leak emergency; shared code, so classic is fixed too. |

Implementation notes:
- Emergency rules: `src/services/notifications/emergency.ts` (`emergencyTypeOf`), tested in
  `tests/emergency.test.ts`, used by `alertService.evaluateStateChange`. `isLeakSensor` matches
  "flood" only as a word (not "floodlight").
- Toast mapping: `src/pro/lib/toastLogic.ts` (tested in `tests/toastLogic.test.ts`); UI in
  `src/pro/components/toasts/` (`ProToaster`, `ProEmergencyAlert`), mounted in `ProApp`.
- Desktop offset (top 72 px, under the bell) is an inline style on `Toast.Provider`.
- Verified (demo data, events injected through `useAlertStore`): lint, unit tests, `build:pro`;
  stacking and hover fan-out, colours, phone top-centre, desktop under the bell, light toast;
  emergency dialog, Acknowledge closes dialog and red toast. Not verified: real HA events, the
  chime, Open Security on a live alarm.

### 7.9 Energy page — status: BUILT (2026-11-23)

Built from the 11 owner-approved concepts in the Energy Studio (`/?studio=energy`, [ENERGY.md](ENERGY.md)). Accent: orange (hue 52, dark foreground, `data-page="energy"`).

| Part | Decision |
|---|---|
| Layout | **One scrolling page on tablet/desktop (≥ 768 px; 2 cols tablet, 12 cols desktop), Kokonut `SmoothTab` tabs on phones (< 768 px)**. Live now sits always **above** the Period bar. |
| Customise | **Hide and reorder sections** via `ProSheet` (Period bar button and page header `⋮` menu), persisted in `preferences.proEnergy`. |
| Chosen concepts | **Responsive Desktop (≥ 768 px) / Mobile (< 768 px) mix:** **Live now**: B (`LiveNowB` Live Busbar Schematic) desktop · C (`LiveNowC` Living Horizon Strip) mobile; **Period bar**: B (`PeriodBarB` Editorial Timeline Header) desktop · C (`PeriodBarC` Compact Instrument Rail) mobile; **Summary**: B (`SummaryB` Dual Dial Dashboard) desktop · C (`SummaryC` Story Sentence & Source Ribbon) mobile; **Usage over time**: A (`UsageA` Power Wave & Mix); **Solar**: B (`SolarB` Forecast Variance Deck) desktop · A (`SolarA` Sun Arc Horizon) mobile; **Battery**: B (`BatteryB` Charge Cycle Dial + Timeline); **Where it went**: A (`FlowA` Calm Sankey) desktop · C (`FlowC` Three-Lane Flow Ladder) mobile; **Devices**: A (`DevicesA` Ranked Bar Leaderboard) desktop · B (`DevicesB` Podium Spotlight + Tail) mobile; **Costs & tariffs**: C (`CostsC` Cost-Over-Time Strip + Rate Cards) desktop · A (`CostsA` Tug-of-War Balance Scale) mobile; **Gas & water**: A (`UtilitiesA` Paired Meter Cards) desktop · C (`UtilitiesC` Compact Utility Switcher) mobile; **Lifetime impact**: B (`ImpactB` Calm Eco Stat Trio). |
| States & visibility | Default unconfigured, initial loading skeleton, and error-with-retry cards. Sections without HA data (solar, battery, gas, water, Huawei lifetime impact sensors) hide cleanly and partner cards expand to full width. |

Implementation notes:
- Pure domain transformer & preferences persistence: `src/pro/lib/energyPage.ts` (`buildLiveEnergySnapshot`, `readEnergyPrefs`, `writeEnergyPrefs`, `computeCustomPresetDates`), tested in `tests/energyPage.test.ts`.
- Production page: `src/pro/pages/ProEnergy.tsx` (wired into `src/pro/ProApp.tsx`), reading `useEnergyData`, `useEnergyComparison`, and `useAutoLayoutStore`, and publishing to `useEnergyStore`.
- Energy Studio (`src/pro/pages/energy/studio/`) stays dev-only behind `import.meta.env.DEV` at `/?studio=energy` and is excluded from `dist-pro/`.

### 7.10 Media page — structure approved (2026-11-24)

Now playing precedes Players by room. A quiet home opens directly on the directory. The floor filter applies only to the directory. Player details open from either section. See MEDIA.md for responsive behaviour. The Media accent is fuchsia (hue 330). The first Now playing concepts were rejected as too similar. B is the front-runner. Compare it with a theme-aware, artwork-led monitor with seekable timed playback and a station-led radio view. The owner approved D · Playback monitor for Now playing and A · Room list for Players by room in the Media Studio workflow.

### 7.11 Mobility page — Garage structure approved (2026-11-24)

Cars and bikes have separate Garages. Open a lone vehicle directly, use Car and Bike tabs for one of each, and open grouped bays first when either category contains multiple vehicles. Selecting a bay opens that vehicle and provides a return to all bays. See MOBILITY.md. Accent: emerald (hue 155). Bay direction: combine A’s marked parking space with B’s charge and range dial; D · Garage dial approved for production. The individual car Garage uses C · Garage door, with vehicle name and location on the shutter and current state, range and battery below.

## 8. Page roadmap

| # | Item | Status |
|---|---|---|
| 1 | Sign-in page | Built: `src/pro/components/ProSignIn.tsx` + `src/pro/ui/boardui/AuthCard.tsx` |
| 2 | Sidebar | Built: `src/pro/components/ProSidebar.tsx` + `src/pro/ui/untitledui/SidebarSectionDividers.tsx` |
| 3 | Mobile nav bar | Built: `src/pro/components/ProMobileNav.tsx` + `src/pro/ui/reactbits/GlassSurface.tsx` |
| 4 | Page headers | Built: `src/pro/components/ProPageHeader.tsx` + `pageHeaderContext.ts` + `src/pro/ui/magicui/BlurFade.tsx` |
| 5 | Security page | Built: `src/pro/pages/ProSecurity.tsx` + `src/pro/components/security/` (7.5) |
| 6 | Overview, Rooms, Energy | Overview built (7.6); Rooms page built (Gallery, [ROOMS.md](ROOMS.md)); room pages: restarted from scratch as area tiles, batch 1 in review ([AREA_TILES.md](AREA_TILES.md); earlier mockups in [ROOM_PAGE.md](ROOM_PAGE.md)); Energy built: `src/pro/pages/ProEnergy.tsx` (7.9, [ENERGY.md](ENERGY.md); studio at `/?studio=energy`) |
| — | Breadcrumbs in the page header | Planned: decide with the first page that has sub-views (7.4) |
| — | Notification center | Built: `src/pro/components/notifications/` (7.7) |
| — | Toasts + emergency alert | Built: `src/pro/components/toasts/` (7.8) |
| 7 | Remaining pages | Not started |

## 9. Decision log

Append only. One row per decision. Newest at the bottom.

| Date | Component / topic | Decision | Notes |
|---|---|---|---|
| 2026-11-17 | Direction | Parallel pro UI under `src/pro`, classic untouched | Served with `UI=pro`, port 3001 |
| 2026-11-17 | Primary library | HeroUI v3 | Free core; Pro parts only if licensed |
| 2026-11-17 | Icons | Hugeicons free, only set in pro | |
| 2026-11-17 | Charts, KPIs, sparklines | bklit UI | |
| 2026-11-17 | Secondary libraries | BoardUI, Magic UI, React Bits, Origin UI, Untitled UI | Chosen per component by the owner (Origin UI later dropped) |
| 2026-11-17 | Page accents | Overview 254, Rooms 192, Energy 52, Security 300 | `src/pro/pro.css` |
| 2026-11-17 | Priority device | Phone | |
| 2026-11-17 | Icon rule | Every element has an icon; icon + text or icon only by context | Section 5 |
| 2026-11-17 | HeroUI Pro | Not licensed: free core only | Pro parts never suggested |
| 2026-11-17 | Library roster | Origin UI dropped | Not suggested any more |
| 2026-11-17 | Sign-in: base | BoardUI Auth Card | Re-skinned onto HeroUI tokens |
| 2026-11-17 | Sign-in: method switcher | HeroUI Tabs | Icon + text |
| 2026-11-17 | Sign-in: background | Plain canvas | |
| 2026-11-17 | Product name | Always "HAD" / "Home Assistant Dashboard", never "HOMZ" | Applies everywhere in pro |
| 2026-11-17 | Sign-in: brand mark | Home icon tile + "HAD" title + "Home Assistant Dashboard" subtitle | |
| 2026-11-17 | Sign-in: accent | Overview blue (254) | |
| 2026-11-17 | Sign-in: copy | "Welcome home" / "Sign in with your Home Assistant to continue." | |
| 2026-11-17 | Sidebar: base | Untitled UI "Section subheadings" sidebar | Re-skinned onto HeroUI; hamburger header removed |
| 2026-11-17 | Sidebar: collapse | Auto (rail on tablet, full on desktop) + toggle, remembered | Rail added on top of Untitled UI |
| 2026-11-17 | Sidebar: nav groups | Home / Life / System with headings, Settings in footer | |
| 2026-11-17 | Sidebar: footer | Account card, HA connection status, theme toggle | Notifications go elsewhere |
| 2026-11-17 | Sidebar: panel | Edge-to-edge on the canvas, no card | |
| 2026-11-17 | Sidebar: active item | Soft accent pill | `.pro-soft` |
| 2026-11-17 | Sidebar: width | 256 px | |
| 2026-11-17 | Sidebar: heading icons | Home, Leaf, Server | |
| 2026-11-17 | Sidebar: groups (revised) | Section dividers instead of subheadings; heading icons dropped | Headings read as confusing; supersedes the base, nav-group and heading-icon rows above |
| 2026-11-17 | Mobile nav: base | React Bits Glass Surface pill + HeroUI Drawer for More | Exception to "no glass", mobile nav only |
| 2026-11-17 | Mobile nav: iOS glass | Component's frosted-blur fallback accepted | Refraction only in Chromium |
| 2026-11-17 | Mobile nav: tabs | Overview, Rooms, Energy, Security, More | |
| 2026-11-17 | Mobile nav: labels | Icon only (aria-label) | |
| 2026-11-17 | Mobile nav: style | Floating pill | |
| 2026-11-17 | Mobile nav: active tab | Accent icon + dot | |
| 2026-11-17 | Mobile nav: More sheet | Mirrors the sidebar (groups, Settings, status, theme, account) | |
| 2026-11-17 | Mobile nav: glass preset | React Bits "Frost" (displace 3, backgroundOpacity 0.28) | Readability over page content |
| 2026-11-17 | Page header: layout | Icon tile + title + live status line, actions right | HeroUI composed |
| 2026-11-17 | Page header: title | Short nav name | |
| 2026-11-17 | Page header: status line | Live, per page; hidden until provided | |
| 2026-11-17 | Page header: scroll | Collapses to a compact sticky bar | |
| 2026-11-17 | Page header: compact bar | Canvas colour + hairline shadow | |
| 2026-11-17 | Notifications | Bell with counter in every page header, phone and desktop | Resolves the open item from 7.2 |
| 2026-11-17 | Page header: overflow | Per page, hidden if empty | |
| 2026-11-17 | Page header: animation | Magic UI Blur Fade | |
| 2026-11-17 | Sidebar: expanded separators | Removed, spacing kept; rail keeps its thin dividers | |
| 2026-11-17 | Page header: title (revised) | Classic long title on tablet/desktop, short nav name on phones | |
| 2026-11-17 | Page header: Overview title | Time-of-day greeting with the user's first name | As classic |
| 2026-11-17 | Page header: subtitle (revised) | Rich sentence with inline HeroUI soft chips, all 13 pages | Replaces the one-line status |
| 2026-11-18 | Security: layout | Alarm hero, attention, device lists, cameras; hero + attention side by side on desktop | |
| 2026-11-18 | Security: status tiles | Dropped; counts in card headers | Subtitle already has them |
| 2026-11-18 | Security: alarm hero | State-tinted shield tile + HeroUI ToggleButtonGroup modes | Replaces first-pass card |
| 2026-11-18 | Security: PIN | HeroUI Drawer/Modal with InputOTP + number pad, only when HA needs a code | |
| 2026-11-18 | Security: arming with openings open | HeroUI AlertDialog confirm | |
| 2026-11-18 | Security: panic button | None | Avoid false alarms |
| 2026-11-18 | Security: devices | By type, toggle to by room | |
| 2026-11-18 | Security: locks | Tap to lock, press and hold to unlock | |
| 2026-11-18 | Security: extras | Lock all, Recent activity | |
| 2026-11-18 | Security: bento grid | Magic UI Bento Grid for device groups, sized by content | Kokonut and React Bits Magic Bento rejected |
| 2026-11-18 | Security: cameras | Featured camera + thumbnail strip, captions below, full-screen HeroUI Modal, area chips at 5+ cameras | Redesigned, reuses CameraFeed |
| 2026-11-18 | Security: activity | Timeline, last 8 of 24 h, Show more | |
| 2026-11-18 | Security: built | Container-query rows, stacked modes on phones, ghost-click guard, CameraFeed `quietIdle` | Agent's calls during the build, listed in 7.5 |
| 2026-11-18 | Security: revisions | Cameras above devices; WebRTC native player; native full screen; green/orange/red pills; no lock pill; "Unlock" label; hidden alarm panels listed + picker | Owner feedback after first build |
| 2026-11-18 | Mobile nav: icons | Pure black (light) / white (dark) icons; current tab stroke 2.4 instead of accent colour | Owner; accent dot kept |
| 2026-11-18 | Security: second revisions | Slim "All secure" below 1024 px; masonry bento packing; full-screen fallbacks | Owner feedback with screenshots |
| 2026-11-18 | Mobile nav: size and light glass | Icons 26 px (30 px from 640 px), pill 76 px tall and wider from 640 px; light-mode glass 72 % white | Owner: bigger on tablets, better light contrast |
| 2026-11-18 | Overview: structure & scope | Customizable multi-size widget grid (add, remove, reorder, resize), Weather & People in body, keep Active status pills + Category tabs + Edit mode; Energy & Security open to pro redesign | |
| 2026-11-18 | Overview: active status pills bar | HeroUI TagGroup + Tag, Avatar, Badge (instead of Chip), Button + Magic UI BlurFade (agent's call); hazards first; green/orange/red + neutral/accent tones | |
| 2026-11-18 | Overview: category filter tabs | HeroUI Tabs (variant="primary" pill track: agent's call) with ScrollShadow, Hugeicons icon + label + soft HeroUI Badge counts | |
| 2026-11-18 | Overview: edit mode controls | Customize HeroUI Button beside tabs (icon-only + Tooltip on phone, icon + label on tablet/desktop) + Page Header ⋮ menu + .pro-surface Edit Mode action bar | |
| 2026-11-18 | Overview: status pills mobile marquee | Magic UI Marquee on phones (< 768 px) for active status pills; wrapping list from 768 px up | Owner revision |
| 2026-11-18 | Overview: widget grid & Add Widgets sheet | Magic UI BentoGrid masonry + @dnd-kit/sortable + 3 sizes (1x, 2x, 2x2) + ProSheet with HeroUI SearchField & ToggleButtonGroup | |
| 2026-11-18 | Overview: status pills mobile swipe | Mobile pills bar (< 768 px) is a horizontally swipeable single-row strip with auto-scroll disabled | Owner revision; supersedes auto-scroll marquee |
| 2026-11-18 | Overview: category tabs responsive labels & badges | No statistics badges on tablet/desktop (≥ 768 px); on mobile (< 768 px) inactive tabs are icon-only and the selected tab shows icon + text + statistics Badge | Owner revision |
| 2026-11-18 | Overview: Weather & Hourly Forecast widgets | Calm .pro-surface HeroUI cards (1x, 2x, 2x2) with Hugeicons condition icons + bklit UI AreaChart on 2x2 Hourly Forecast | Option 3 |
| 2026-11-18 | Overview: Weather detail sheet | ProSheet (Drawer on phone, Modal lg on desktop) with HeroUI Select station picker, current summary, 24h ScrollShadow strip, atmospheric grid, and 7-day range bars | Option A |
| 2026-11-18 | Overview: Family presence widget | Calm .pro-surface HeroUI Avatar + Badge card (1x, 2x, 2x2) with optimized minimal dark/light OpenStreetMap mini-map on 2x2 | Option 3 |
| 2026-11-18 | Overview: Presence detail sheet | ProSheet (Drawer on phone, Modal lg on desktop) with member switcher, device/battery cards, and interactive minimal OpenStreetMap | Option A |
| 2026-11-18 | Overview: category tabs library (revised) | Kokonut UI SmoothTab (@kokonutui/smooth-tab) instead of HeroUI Tabs | Owner revision; spring clip-path pill indicator + mobile icon-only inactive tabs |
| 2026-11-18 | Overview: Lighting & Switches widgets | HeroUI Switch + Slider + Badge cards (1x, 2x, 2x2) with soft warm-amber surface tint on Lighting when lights are on | Option 3 |
| 2026-11-18 | Overview: Lighting & Switches control sheet | Shared ProSheet (Drawer on phone, Modal lg on desktop) with search, All/On-only filter, batch actions, room grouping, and HeroUI Switch + brightness Slider | Option A |
| 2026-11-18 | Overview: Fans & Vacuums widgets | Calm .pro-surface HeroUI cards across 1x, 2x, 2x2 with inline Switch, speed Slider, vacuum actions, and semantic Badges | Option 3 |
| 2026-11-18 | Overview: Media player widget | HeroUI Card with square album cover, dual-layer adaptive album-art background (blur + useAlbumArtColor), custom song-adaptive waveform scrubber, and expandable Up Next track queue menu | Option 1 + custom waveform & queue |
| 2026-11-18 | Overview: Fans, Vacuums & Media detail sheets | ProSheet (Drawer on phone, Modal lg on desktop) for Fans, Vacuums, and Media players | Option A |
| 2026-11-18 | Overview: Security, Cameras & Sensor widgets | Calm .pro-surface HeroUI cards (1x, 2x, 2x2) + Magic UI BorderBeam on triggered hazards (smoke, leak, triggered alarm), ProCameraPlayer, and AlarmCodeSheet | Option 2 |
| 2026-11-18 | Overview: Security, Cameras & Sensor detail sheets | ProSheet (Drawer on phone, Modal lg on desktop) for Security alarm, Cameras, and shared Openings & Sensors inspector | Option A |
| 2026-11-18 | Overview: Energy widgets | Calm .pro-surface HeroUI cards across 1x, 2x, 2x2 for all 6 energy widgets (power_flow, power_flow_chart, energy_usage, energy_usage_chart, solar_production, solar_production_chart) + bklit UI AreaChart and bklit UI BarChart | Option 1 |
| 2026-11-18 | Overview: Energy detail sheet | ProSheet (Drawer on phone, Modal lg on desktop) with view switcher (Power flow, Usage & return, Solar & forecast), Day/Week/Month period toggle, 4-source KPIs, interactive bklit UI charts, top 5 consumers, and link to /energy | Option A |
| 2026-11-18 | Overview: Energy widgets & sheet (HA alignment revision) | Expanded to 8-widget HA Energy Suite (+energy_gauges, +energy_flow Sankey) using bklit UI bidirectional PowerSourcesAreaChart, BidirectionalBarChart, SolarForecastBarChart, SankeyChart, GaugeChart, and Magic UI AnimatedBeam Energy distribution diagram | Option 1 + Option A (owner) |
| 2026-11-18 | Overview: Energy refinements (flat charts, 10-min power flow, @bklit/gauge-chart) | Removed nested inner cards around all Energy charts, diagrams, balance bar, and gauges; switched Power flow chart from 30-min to 10-min aggregation (`step = 2`); replaced custom SVG gauges with official `@bklit/gauge-chart` (`src/pro/ui/bklit/gauge/`) skinned onto HeroUI tokens | Owner revision |
| 2026-11-19 | Overview: optional section grouping & corner drag-to-resize | Added optional `Group by sections` HeroUI Switch toggle in Customize view (outer `BentoGrid` of tab-matching sections, each containing its own sortable `BentoGrid`) and replaced widget size cycle button with bottom-right corner click-and-drag resize handle snapping to predefined `1×` / `2×` / `2×2` sizes | Owner revision |
| 2026-11-19 | Security: audit upgrades | WebRTC auto-reconnect + Retry + audio mute toggle + 2×2 camera grid view + full-screen prev/next + snapshot proxy fallback; BorderBeam on triggered alarm/hazards; arming/entry delay countdown bar + `armed_vacation`/`armed_custom_bypass` modes + `Lock all & arm` confirmation; jammed locks + offline & low-battery (`<20%`) health in AttentionCard; danger tint on hazard BentoCards; HoldToConfirm early-release hint + haptics; masked steady-width PIN sheet; DeviceGroups `All`/`Issues` filter + search + device detail `ProSheet`; RecentActivity category filters + live 30s `timeAgo` tick; toast action errors (HeroUI `Chip` kept) | Owner approved audit |
| 2026-11-19 | Security: perimeter, presence, AI cameras & sirens | Added garage/gate `cover` support (tap Close / hold Open) + unified `Secure home` / `Secure & arm` perimeter actions; Who's Home avatar strip + `Everyone away — Arm Away` prompt in `AlarmHero`; camera AI detection `Chip`s (`Person`, `Vehicle`, `Package`, `Animal`) + 1-tap `Motion on <camera>` header jump; `siren.*` Silence/Test controls; triggered/pending alarm diagnostics strip with 1-tap `View camera` jump | Owner approved |
| 2026-11-19 | Security: compact Needs attention + ProSheet, motion classification & battery rows | Turned `Needs attention` into a bounded summary card (count + category `Chip`s + `Review all` button opening a `ProSheet` with full device list & Device health); fixed `entityClassifiers.ts` so `device_class` beats name substrings (door/garage-named motion sensors now classify as motion with `Detected`/`Clear`); displayed battery level inline under every battery-powered device | Owner revision |
| 2026-11-19 | Notifications: placement | Right-side HeroUI Drawer on tablet/desktop, bottom sheet on phones | Replaces classic drawer in pro |
| 2026-11-19 | Notifications: organisation | Needs action, then collapsed stacks by kind, then Messages | Stack order: agent's call |
| 2026-11-19 | Notifications: stacks | Collapsed with summary + bulk action (Update all) | |
| 2026-11-19 | Notifications: item | Compact row, tap to expand details and actions (HeroUI Disclosure) | |
| 2026-11-19 | Notifications: header | Mark all read + ⋮ (Refresh, Clean skipped, Clear all); search at 8+ items | |
| 2026-11-19 | Notifications: dismiss | Swipe left on touch, ✕ on hover, Undo for 5 s | In-panel undo bar: agent's call |
| 2026-11-19 | Notifications: read state | Read when expanded or acted on | |
| 2026-11-19 | Toasts | Redesign as the next component | Classic toasts until then |
| 2026-11-19 | Toasts: component | HeroUI Toast, stacked | No swipe in HeroUI Toast |
| 2026-11-19 | Toasts: placement | Top centre on phones, top-right from 768 px | |
| 2026-11-19 | Toasts: events | Security changes, doors/windows, appliances + HA messages, errors + confirmations | All groups |
| 2026-11-19 | Emergency alert | Red full-screen AlertDialog + persistent red toast | Open Security instead of room: agent's call |
| 2026-11-19 | Emergency triggers | Binary sensors only (smoke, gas, CO, moisture, safety; name words only without a device class) + alarm triggered | Fixes floodlight → water leak; also fixes classic |
| 2026-11-19 | Overview audit: P1 + P2 fixes | Chart width measuring, demo kWh, energy colour tokens, gauge labels, 44 px touch targets, slider keys | Owner approved P1 + P2; P3/P4 done next |
| 2026-11-19 | Overview audit: P3 + P4 fixes | People section, tab categories in Add widgets, one Done, card-click guard, one sheet state, memoized widget bodies | Owner approved; People section placement is the agent's call |
| 2026-11-19 | Widget design: colour rule (D1) | Overview widgets: neutral by default, colour from content/state (sky, lamp glow, album art, temperature); status colours for alerts; page accent stays for chrome | Amends "one accent per page" for widget content. `docs/pro-ui/WIDGET_DESIGN.md` |
| 2026-11-19 | Widget design: frame and title (D2) | No shared header; each widget places its title (or none); one corner "open details" button in the same spot on every widget | Edit overlay stays shared |
| 2026-11-19 | Widget design: phases (D3) | Pilot: Weather only. Then 1: Lighting, Media, Vacuums, Family presence; 2: Switches, Fans, Thermostat (new), Scenes (new); 3: security family; 4: energy | Owner changed the first group to a Weather-only pilot |
| 2026-11-19 | Widget design: mockup process (D4) | Concepts use HeroUI and installed libraries without per-element asks; any new library, copy-in or dependency is asked first; the chosen concept is recorded before it replaces a real widget | Studio at `/studio` (dev only) |
| 2026-11-19 | Weather pilot: all three concepts ship as styles | Owner liked A, B and C: each is a style picked per widget in the card's edit menu, stored per device layout; Sky (B) is the default; Trend (C) made conditions more visible. Later widgets get several styles only when the concepts are truly different | `widgets/weather/`, `widgets/types.ts` (`designs`), `lib/overviewLayout.ts` (`styles`), WIDGET_DESIGN.md §7 |
| 2026-11-19 | Widget design Phase 1 choices | Lighting B (denser Wide); Media a mix (Small: A on C's surface; Wide/Tall/Large: B's static cover and background with B's progress bar, revised from C's record); Vacuums B with a battery icon; Family presence B. One design each, so no style picker | `widgets/{lights,media,vacuums,presence}/`, WIDGET_DESIGN.md §7 |
| 2026-11-19 | Widget design Phase 2 choices | Switches B (plug board), Fans B (airflow), Thermostat B (climate, new widget), Scenes C (palette, new widget). Thermostat and Scenes replace their dev placeholders; no details sheets yet | `widgets/{switches,fans,thermostat,scenes}/`, WIDGET_DESIGN.md §7 |
| 2026-11-19 | Widget design Phase 3 choices | Areas (new): A's layout with B's pill buttons and lights button at every size; Alarm: B's layout with C's mode track and A's lock colours; Cameras A; Doors & windows B; Safety B; Motion C with room names at Small. Details sheets are redesigned at the end for all widgets | `widgets/{areas,alarm,cameras,openings,safety,motion}/`, WIDGET_DESIGN.md §7 |
| 2026-11-20 | Widget design Phase 4 choices (energy) | Energy now: A's layout on B's source colours, battery prominent (pill / big charge), new Small size; Energy today: A's labels + C's self-powered gauge as a half circle at Small, A's consumption + C's came-from/went-to bars at Wide/Large; Energy flow: A (Sankey). Battery on Energy now only | `widgets/energy/`, WIDGET_DESIGN.md §7 |
| 2026-11-20 | Alarm widget revised | Header from concept C (B's large title was cut off, e.g. "Armed home"); subtitle unchanged. Lock colours redone as soft tints: locked white in the card colour, unlocked soft amber, jammed soft red, replacing solid green/amber/red | `widgets/alarm/AlarmCard.tsx` |
| 2026-11-20 | New widgets: Door locks and Car | Door locks: concept C (bolts: tap to lock, hold to unlock) with icons, no clipped text, and a bolt at Small for a single lock. Car: concept A's layout on concept B's state colours, climate start/stop at every size as a press-and-hold button | `widgets/locks/`, `widgets/car/`, WIDGET_DESIGN.md §7 |
| 2026-11-20 | Rooms section, area choices, thermostat choice, free grid placement | Areas moves out of Climate into a new **Rooms** section (first by default; a saved layout gets it first too). Areas: the room name opens that area on the Rooms page, the menu adds "Open {area}" and "Choose favourites…" (a sheet of every room by floor, saved to `rooms.favoriteAreas`, order = order picked). Thermostat: the room name is a menu of every thermostat; the choice is saved in `preferences.proThermostatEntityId`. Grid: **free placement replaces strict Flow for edits**: a card stays in the cell it is dropped in (a row can be left part empty), others step down to make room, empty rows close up; defaults still flow | `lib/overviewLayout.ts` (`settleCells`), `overviewNext/flowCompactor.ts`, `widgets/areas/`, `widgets/thermostat/`, `widgets/shared/navigate.ts`, WIDGET_DESIGN.md §7 |
| 2026-11-20 | Overview Phase 4: page shell | Tabs = sections on the page ("All" + one per section, Rooms and People included) with counts from each widget's new `count()`, coloured by attention, `?tab=` in the URL; attention pills only for problems, from `attention()`, worst first, tap opens details; "Nothing needs attention" line; empty page state with Add widgets / Restore default; demo mode applies simulated HA state for service calls and shows a quiet demo note. Section headers: no counts, a "show only" arrow | `components/overviewNext/OverviewShell.tsx`, `lib/overviewShell.ts`, `lib/demoServices.ts`, OVERVIEW_REBUILD.md Phase 4 |
| 2026-11-20 | Overview cutover (rebuild Phase 5) | `/overview` is the rebuilt page (the `?next` dev route is gone). Removed the old grid and its parts: `OverviewWidgetGrid`, `OverviewGroupedGrid`, `SortableWidgetCard`, `StatusPillsBar`, `ProOverviewSheets`, `memoWidgetBodies`, old `AddWidgetsSheet`, `useProOverviewModels`/`Actions`/`Layout`, `overviewSheets`, `overviewWidgetSummaries`, the dev placeholders, and the grouped-grid helpers in `overviewSections`. Kept: `useMasonryRowSpan` (BentoGrid, Security page) and `overviewTabs` (the classic UI imports it). Section 7.6 rewritten. Thermostat Small: −/+ stacked beside the target (they ran off the card) | `pages/ProOverview.tsx`, OVERVIEW_REBUILD.md Phase 5 |
| 2026-11-20 | Overview: details sheets redesigned | One frame for every widget sheet (Modal on desktop, Drawer on phones) from a shared kit: hero in the card's colour with the state as the headline and the 1–2 main actions, filter chips and search only for long lists, lists by room, sliders that send on release, hold to unlock. New sheets for Thermostat, Scenes, Door locks, Car and Rooms; one Energy sheet with views; sensor sheets show only their group; Cameras' hero is the live picture. Old `components/overview/*DetailSheet*`, `ControlWidgets`, `FansVacuumWidgets` removed | Agent's calls (owner away), to review one by one: WIDGET_DESIGN.md §8. `widgets/shared/sheet/`, `lib/sheetLists.ts` |
| 2026-11-20 | Overview: details sheets, owner review | Side panel on desktop. Vacuums: clean chosen rooms (`vacuum.clean_area`) and the latest map. Thermostat: 24-hour chart. Weather: rain chart in the sheet and the Sky widget, smoother rain animation. Presence: everyone on the map. Locks: recent activity; the widget unlocks by **swiping** the bolt (not holding). Car: map while driving. Alarm: recent events. Sensors: last-triggered times, most recent first. Cameras: what the camera saw. Rooms: corner details button too. Kept: 2–11, 14, 22, 23 | Owner, item by item. WIDGET_DESIGN.md §8 |
| 2026-11-20 | Rooms page: Gallery | Owner picked **B · Gallery** of three concepts (A Directory, C House section). Room picture cards by floor that glow warm when lit, lights button on each card, "Happening now" pills on top, filter All / Favourites / floors (remembered per browser). A, C and the dev bar removed | Owner. `pages/ProRooms.tsx`, `pages/rooms/`, `lib/roomsPage.ts`, ROOMS.md |
| 2026-11-20 | Rooms page: floors, colours, Customize | Floors highest first. Rooms without a picture get their own colour (chosen, or per kind of room spread round the colour wheel). Customize sheet: page options (Happening now, group by floor, Large/Compact cards, in `preferences.proRooms`), floor order and visibility, room colour, favourite, order and visibility (shared Rooms settings) | Owner asked; sheet layout is the agent's call. `pages/rooms/RoomsCustomizeSheet.tsx`, `lib/roomsPage.ts`, ROOMS.md §3 |
| 2026-11-20 | Rooms page: quick wins | Glow and bulb in the lights' colour; scene menu per room; climate chip with −/+ popover; humidity and power on the card; floor headings with lights on, average temperature and Lights off. Further ideas (who's here, quick-control panel, drag to reorder, featured rooms, floor plan view, time of day) wait for the owner | Owner picked the quick wins; details are the agent's call. `pages/rooms/RoomCardControls.tsx`, ROOMS.md §3 |
| 2026-11-20 | Rooms page: richer, all optional | Home summary tiles that filter, room status words, air quality, 24-hour temperature trend and 3-hour change, heating/cooling ring, swipe between floors, night look, animations (reduced motion respected). Every extra and the earlier quick wins have a switch in Customize (`preferences.proRooms`), all on by default | Owner asked for 1, 3, 4, 5, 9, 12, 13, all optional; thresholds and wording are the agent's call. `lib/roomsInsights.ts`, `pages/rooms/RoomCard.tsx`, `RoomsSummary.tsx`, `useRoomTrends.ts`, ROOMS.md §3 |
| 2026-11-20 | Rooms page: no trend, phone fixes | Temperature trend (line and 3-hour change) removed. Phones: status words, chips and the climate chip never wrap (climate chip shows icon and target only), status "Open while cooling" | Owner |
| 2026-11-21 | Room page: direction | Mockup D: B's slim hero, the room's widgets in their **C · Innovative** looks fed only that room (cameras included), the thermostat dial with a mode menu, then a tile per entity (Apple Home style), names without the room's name. Other details still open | Owner, ROOM_PAGE.md §2–3. `pages/room/`, `widgets/thermostat/concepts/ModeMenu.tsx`, `lib/roomPage.ts` |
| 2026-11-21 | Room page: rows, styles, sizes | Each kind is a row (B's sections) with its widget first and a tile per entity; Lighting B, Door locks / Doors & windows / Car A, the rest C; widgets resizable per room (Edit, saved in `preferences.proRoomWidgets`); room names hidden inside widgets; Fans C reworked (power button, labelled Low/Medium/High steps, preset mode menu) | Owner. ROOM_PAGE.md §2. `pages/room/`, `widgets/fans/concepts/FansConceptC.tsx` |
| 2026-11-21 | Room page: one widget per entity | Widgets replace the tiles: one widget per entity in each row (scenes stay one Palette; blinds and readings keep tiles, no widget exists). Lighting B gets a one-light look (name, level, On/Off, slider from Wide) | Owner. ROOM_PAGE.md §2. `pages/room/useRoomWidgets.ts`, `widgets/lights/concepts/OneLight.tsx` |
| 2026-11-21 | Areas pages: start from zero | Owner set aside the room-page mockups (layout, responsiveness, hierarchy). New rules: one entity per tile, a distinct design per entity type, each size laid out on purpose, scroll-safe gestures. Types grouped into 6 batches; batch 1 (Light, Switch & plug, Fan) has three concepts each in the new Area Tiles Studio (`/?studio=areas`) with a simulated Area page. Production room page untouched until approval | Owner. AREA_TILES.md. `src/pro/areas/` |
| 2026-11-21 | Area tiles: concept D · Ambient | From the owner's reference screenshots: glass cards, a colour wave rising with the level, glowing round buttons. Added as D for Light, Switch & plug and Fan, plus Ambient-only style previews for Thermostat, Blind, Reading, Speaker and Camera, and an "All D" Area page | Owner. AREA_TILES.md §3b. `src/pro/areas/tiles/ambient/` |
| 2026-11-21 | Area tiles: X-small and D refined | New X-small size (1 column, half a Small's height) for every concept, on a half-row area grid. D refined to the owner's second reference (slider lights, gradient thermostat ring, full player, camera header, room page with photo header) | Owner. AREA_TILES.md §1, §3b. `src/pro/areas/` |
| 2026-11-21 | Area tiles: batch 1 chosen | Light B · Halo (Small with %, an on/off-only version with a plain lit ring and how-long state), Switch & plug D · Ambient with Meter's trace for metered plugs, Fan C · Breeze | Owner. AREA_TILES.md §3. `src/pro/areas/` |
| 2026-11-21 | Area tiles: batch 2 concepts | Thermostat A Scale / B Modes / C Big step, Blind & cover A Positions / B Shade / C Arrows, Reading A Gauge / B Trend / C Status, each beside its Ambient D; recommended Scale, Positions, Status; shared comfort bands | Owner review pending. AREA_TILES.md §3c. `src/pro/areas/tiles/{climate,cover,reading}/` |
| 2026-11-21 | Area tiles: batch 2 chosen | Thermostat A · Scale, Blind & cover A · Positions, Reading C · Status (the recommendations, unchanged) | Owner. AREA_TILES.md §3c. `src/pro/areas/` |
| 2026-11-21 | Area tiles: batch 3 concepts | Speaker & TV A Cover / B Remote / C Level (+ Ambient D); Scene A Button / B Palette / C Slide to run / D Ambient; recommended Cover and Button; new scene model and `activate`, media mute and source | Owner review pending. AREA_TILES.md §3d. `src/pro/areas/tiles/{media,scene}/` |
| 2026-11-21 | Area tiles: batch 3 chosen | Speaker & TV D · Ambient, Scene D · Ambient (over the recommended Cover and Button) | Owner. AREA_TILES.md §3d. `src/pro/areas/tiles/ambient/` |
| 2026-11-21 | Area tiles: batch 4 concepts | Camera Window / Timeline / Private; Lock Hold / Bolt / Status; Door & window Plan / Day / Badge; Motion Pulse / Ticks / Since; Leak & smoke Alarm / Device / Advice; Ambient D for each; recommended Timeline, Hold, Badge, Since, Alarm; new lock and sensor models | Owner review pending. AREA_TILES.md §3e. `src/pro/areas/tiles/security/` |
| 2026-11-21 | Area tiles: batch 4 chosen | Camera A Window + B Timeline (either per camera); Lock C Status with unlock as press-then-hold; Door & window B Day; Motion B Ticks; Leak & smoke B Device | Owner. AREA_TILES.md §3e. `src/pro/areas/tiles/security/` |
| 2026-11-21 | Area tiles: batch 5 concepts | Vacuum Dock / Rooms / Path; Car Gauge / Dashboard / Silhouette; Ambient D for each; recommended Rooms and Gauge. Car: X-small and Small are one entity each, Wide / Tall / Large one tile for the whole car (owner). Catalog split into one file per batch | Owner review pending. AREA_TILES.md §3f. `src/pro/areas/tiles/machines/` |
| 2026-11-21 | Area tiles: batch 5 chosen | Vacuum A Dock; Car C Silhouette with no picture on X-small and Small and a Precondition icon button there; picture from the car's HA entity picture or the owner's upload (via `/api/assets`), else a car outline | Owner. AREA_TILES.md §3f. `src/pro/areas/tiles/machines/`, `studio/CarPictureTool.tsx` |
| 2026-11-21 | Area page: batch 6 concepts | Page A Sections / B Rail / C Now first, plus the Ambient preview as D; recommended A. Shared editing = the Overview's (Customize draft, Save / Cancel / Reset, per-device layouts, drag handle and ⋯ menu with size / move / hide, sections move, hidden tray); empty and sensors-only rooms designed | Owner review pending. AREA_TILES.md §3g. `src/pro/areas/page/`, `src/pro/areas/studio/page/` |
| 2026-11-21 | Area page: B + C as two views | The Rail frame with a switch between All (B's sections) and Now (C: sentence, Pinned, Now, the rest folded); one layout for both; the view is a per-screen preference | Owner, chosen 2026-11-21. AREA_TILES.md §3g, build phases in §4. `src/pro/areas/studio/page/PageRail.tsx` (`views`) |
| 2026-11-21 | Area page build, phase 1: HA → tiles | Pure mappers per tile type, a car built from its device, an area turned into ordered tiles with default sizes; entities without a name fall back to the words of their id | Approved by the owner ("start phase 1"). AREA_TILES.md §4. `src/pro/areas/ha/`, `tests/areaHaTiles.test.ts` |
| 2026-11-21 | Area page build, phase 2: actions → HA | Pure action-to-service mapping with optimistic states and local-only changes, sent through `useServiceCall`; light colours normalised to `rgb(r, g, b)` so live lights match the tile presets | Owner ("phase 2"). AREA_TILES.md §4. `src/pro/areas/ha/haTileActions.ts`, `useTileActions.ts`, `tests/areaHaActions.test.ts` |
| 2026-11-22 | Area page build, phase 3: saved layouts | `preferences.proAreaLayouts[areaId][phone|wide]` (not `rooms.areaLayouts`), written on Save; `reconcile` fits it to the room's current tiles; All / Now view per screen in localStorage | Owner ("continue with the remaining phases"). AREA_TILES.md §4. `src/pro/areas/page/roomLayout.ts`, `useAreaLayout.ts`, `tests/areaRoomLayout.test.ts` |
| 2026-11-22 | Area page build, phase 4: the room page | The production room page is the B + C page; Rail, Now and page kit shared with the studio from `src/pro/areas/page/`; chosen tile per kind in `tiles/chosenTiles.tsx`; A–D mockups removed from the build | Owner (same). `src/pro/pages/room/RoomPage.tsx` |
| 2026-11-22 | Area page build, phase 5: cars | One whole-car tile plus an X-small tile per entity (battery and doors shown, the rest hidden at first); `CarTileModel.can` hides buttons the car can't do; picture from HA, or uploaded / none per car in `preferences.proCarPictures` (saved at once) | Owner (batch 5 choice). `src/pro/areas/ha/haRoomTiles.ts`, `carPictures.ts`, `page/CarPictureControl.tsx` |
| 2026-11-23 | Energy: structure, sections & customise | One scrolling page on desktop/tablet (≥ 768 px), tabs on phone (< 768 px); Live now above Period bar; keep all 11 sections (incl. new Battery, Compare with last year, Huawei Lifetime impact) + edge states; Customise (hide/reorder) included | Owner. Energy Studio (`/?studio=energy`) next; bklit charts verified MIT. `docs/pro-ui/ENERGY.md` |
| 2026-11-23 | Energy: section designs chosen & built | Live now B (Ambient flow), Period bar B (Pill rail), Summary B (Autarky gauge + tiles), Usage B (Power curve + mix strip, Power default), Solar C (Solar ledger), Battery A (Charge curve + throughput), Where it went A (Calm Sankey), Devices A (Ranked horizontal bars), Costs B (Spent vs earned balance), Gas & water A (Paired bar cards), Lifetime impact B (Ambient eco banner) | Owner, 11/11 from Energy Studio. Built at `src/pro/pages/ProEnergy.tsx`, saved options in `preferences.proEnergy`. `docs/pro-ui/ENERGY.md` §3 |
| 2026-11-23 | Energy: Solar section revised | Solar A (Production + forecast) instead of C (Solar ledger) | Owner. `src/pro/pages/ProEnergy.tsx` |
| 2026-11-23 | Energy: Live now backdrop | Subtle source-coloured radial glow + ambient shadow on `--surface` (`.pro-eb-live`) instead of full gradient background | Owner. `src/pro/pro.css` |
| 2026-11-23 | Design Studio Hub | `/overview?studio` (bare `?studio`) serves `StudioHub` main menu linking `?studio=widgets`, `?studio=areas`, `?studio=rooms`, `?studio=energy`; shared `StudioNavBar` across all studios, driven by `studioRegistry.ts` (dev-only) | Owner. `src/pro/studio/{StudioHub,StudioNavBar,studioRegistry}.ts*`, `src/pro/ProApp.tsx` |
| 2026-11-23 | Energy: redesigned concepts & responsive picks | All 11 Energy sections redesigned in `/?studio=energy` with distinct visual metaphors per concept. Production picks (`CHOSEN_ENERGY_CONCEPTS` & `ProEnergy.tsx`): Live B/C, Period B/C, Summary B/C, Usage A/A, Solar B/A, Battery B/B, Flow A/C, Devices A/B, Costs C/A, Gas & water A/C, Impact B/B (Desktop / Mobile), plus default edge states | Owner. `src/pro/pages/ProEnergy.tsx`, `src/pro/pages/energy/studio/concepts/*`, `docs/pro-ui/ENERGY.md` §3 |
| 2026-11-23 | Energy: full-width Sankey & Usage | `flow` (`Where it went` / Sankey) and `usage` (`Usage over time`) both set to full width (`desktopSpan: 'full'` / `col-span-12`) across Desktop and Tablet so device labels in Sankey have full breathing room | Owner. `src/pro/lib/energyPage.ts`, `src/pro/pages/ProEnergy.tsx`, `src/pro/pages/energy/studio/EnergyPagePreview.tsx` |
| 2026-11-23 | Security: studio kickoff & responsive structure | Build Security Studio (`/?studio=security`, added to `/overview?studio` hub) with 3 distinct A/B/C concepts across all 5 core sections (`Alarm`, `Attention`, `Cameras`, `Activity`, `Devices`) + edge states; one scrolling page ≥ 768 px, Alarm pinned above `SmoothTab` tabs on phone (< 768 px); keep purple accent (`hue 300`, added `--accent-soft*` tokens). Production `ProSecurity.tsx` untouched until picks approved | Owner. `docs/pro-ui/SECURITY.md`, `src/pro/pages/security/studio/*`, `src/pro/studio/studioRegistry.ts` |
| 2026-11-24 | Security: studio picks chosen & built | Alarm hero **A** (Shield Halo Console), Needs attention **B** (Perimeter Radar Matrix), Cameras **A** (Theater Stage + Filmstrip), Recent activity **C** (Compact Audit Ledger), Device groups **B** (Interactive Tile Deck); **always press-and-hold for critical actions** (arming Away/Vacation, code-free disarm when armed, unlocking locks, opening garages, testing sirens); phone `< 768 px` pins Alarm above Kokonut `SmoothTab` tabs | Owner, 5/5 from Security Studio. Built in `src/pro/pages/ProSecurity.tsx` & `src/pro/components/security/*`, `docs/pro-ui/SECURITY.md` |
| 2026-11-24 | Media page structure | A · Now playing first, then Players by room, with responsive player details | Owner. MEDIA.md |
| 2026-11-24 | Media Now playing review | Rework the three studio concepts into distinct compositions. No production pick. | Owner. MEDIA.md |
| 2026-11-24 | Media monitor refinement | Preview all three refinements together beside original B. | Owner. MEDIA.md |
| 2026-11-24 | Media accent | Fuchsia, hue 330 | Owner, option 1. MEDIA.md |
| 2026-11-24 | Media Now playing | D · Playback monitor approved for production. Players by room remains open. | Owner. MEDIA.md |
| 2026-11-24 | Media directory | A · Room list, compact player rows grouped by floor and room. Rows open player details. | Owner. MEDIA.md |
| 2026-11-24 | Mobility Garage | Direct entry for a lone vehicle, separate tabs for one of each, grouped bays first when either category has multiple vehicles. | Owner. MOBILITY.md |
| 2026-11-24 | Mobility accent | Emerald, hue 155, across both vehicle types. | Owner, option 1. MOBILITY.md |
| 2026-11-24 | Mobility bays | Combine Garage floor (A) and Range dial (B) as studio concept D. | Owner. MOBILITY.md |
| 2026-11-24 | Mobility bay chosen | D · Garage dial for cars and bikes. | Owner. MOBILITY.md |
| 2026-11-24 | Mobility car header review | Preview all three concepts side by side. Production pick pending. | Owner. MOBILITY.md |
| 2026-11-24 | Mobility car header chosen | C · Garage door for the individual car Garage. | Owner. MOBILITY.md |

## 10. Notes for other agents

- Start by reading this file, then `docs/pro-ui/HANDOFF.md` (current state, reusable pieces,
  gotchas, next steps), `CLAUDE.md` and `docs/AI_RULES.md`.
- Check the Decision log and the status line of the component you are asked to work on. If it
  says PENDING DECISION, your job is step 1 and 2 of the working agreement, not building.
- Record every decision and every deviation here in the same change as the code.
- Commands: `npm run lint`, `npm test`, `npm run build:pro`; dev server per `.claude/launch.json`.
