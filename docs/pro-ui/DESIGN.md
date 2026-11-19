# HAD Pro UI: design document

Status: living document. Last updated 2026-11-19.
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
  Security violet (300). Other pages: pending.
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

### 7.5 Security page — status: BUILT (2026-11-18)

The owner did not like the first pass's alarm card and status tiles; this replaces them.

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

### 7.6 Overview page — status: BUILT (2026-11-18)

| Part | Decision |
|---|---|
| Overall structure | **Active status pills bar → Category filter tabs + Edit mode → Customizable multi-size widget grid** (add, remove, reorder, multiple sizes). Includes Weather & People in the body alongside Home Controls, Security & Cameras, and Energy (Energy and Security widgets open to pro redesign). |
| Active status pills bar | **HeroUI `TagGroup` (`TagGroup.List` + `Tag`), `Avatar`, `Badge` (instead of `Chip`), and `Button`, wrapped in Magic UI `BlurFade`** (Magic UI choice: agent's call). Shows only active/home items, sorted hazards first (smoke, leaks, triggered alarm, open doors, open windows, motion, arming/armed alarm, people in known zones, lights on, switches on, fans running, cleaning vacuums, playing media). Tones: **red** (`danger`: smoke, leak, triggered alarm), **orange** (`warning`: lights on, open doors/windows, motion, arming), **green** (`success`: people at home, armed alarm), **blue/neutral** (`accent`/`default`: person in named zone, fans, vacuums, media, switches). Tapping a pill activates its domain target; when hidden in Edit mode, a calm row with a HeroUI `Button` ("Show status pills") lets the user restore it. **Revised 2026-11-18 (owner):** on phones (`<768 px`), the pills run in a single-row horizontally swipeable strip with auto-scroll disabled (`src/pro/ui/magicui/Marquee.tsx` with `autoScroll={false}`); from `768 px` up they wrap across rows. |
| Category filter tabs | **Kokonut UI `SmoothTab` (`@kokonutui/smooth-tab`, `src/pro/ui/kokonutui/SmoothTab.tsx`, MIT)** re-skinned onto HeroUI tokens (`.pro-surface` pill track, `.pro-accent` spring-animated `clip-path` indicator overlay, HeroUI `Button` tab triggers, and Hugeicons icons) inside a horizontal scroll container. Tabs cover `All`, `Lights`, `Switches`, `Energy`, `Security`, `Cameras`, `Climate`, `Doors & windows`, `Media`, `Vacuums` (`Switches`, `Cameras`, and `Vacuums` hide when none exist unless in Edit mode). **Revised 2026-11-18 (owner):** replaced HeroUI `Tabs` with `@kokonutui/smooth-tab`; statistics badges are hidden on tablet/desktop (`≥768 px`, since active statistics are already shown in the status pills bar), and on phones (`<768 px`) inactive tabs show the Hugeicons icon only while the selected tab shows the Hugeicons icon + text label + statistics `Badge`. |
| Edit mode controls | **Customize HeroUI `Button` at the right of the tabs row** (icon-only with HeroUI `Tooltip` below `768 px`, icon + label from `768 px` up) **and mirrored in the shared Page Header `⋮` menu** (`useProPageHeader`). Entering Edit mode switches to the `All` tab and reveals a `.pro-surface` action bar (wrapped in Magic UI `BlurFade`, agent's call) with HeroUI controls: **Group by sections** `Switch` toggle (`Layers01Icon`), **Add widgets** (with `+N` hidden count `Badge`), **Hide/Show status pills**, **Reset layout**, and **Done**. |
| Widget grid & edit controls | **Magic UI `BentoGrid` (`grid-flow-dense` masonry) + `@dnd-kit/sortable` drag + optional section grouping + corner drag-to-resize.** Supports **3 predefined widget sizes** (`1x` Compact = 1 col, `2x` Wide = 2 cols on `md+`, `2x2` Large = 2 cols + expanded detail body), stored in `config.overview.tileSizes`. **Revised 2026-11-19 (owner):** (1) Optional **Group by sections** toggle in Customize view groups the `All` tab into category sections matching the tabs (`Climate`, `Lights`, `Switches`, `Energy`, `Security`, `Cameras`, `Doors & windows`, `Media`, `Vacuums`), where the `All` tab is a `BentoGrid` of sections (`1`/`2`/`4` col adaptive spans, reorderable in Edit mode) and each section contains its own sortable `BentoGrid` so widgets reorder cleanly inside their section. (2) Replaced the top-toolbar `1×`/`2×`/`2×2` cycle button with a **bottom-right corner click-and-drag resize handle** (`ArrowExpandDiagonal01Icon`, `cursor-nwse-resize`, `role="slider"` with keyboard arrow support) that snaps to the predefined `1×`, `2×`, and `2×2` sizes with a live snap-preview pill during drag. |
| Add widgets sheet | **`ProSheet` (`Drawer` on phones, `Modal` `size="lg"` from `768 px` up)** with HeroUI `SearchField`, category `ToggleButtonGroup`, `Show all` / `Reset layout` buttons, and per-widget rows with a size cycle button and a 3-way HeroUI `ToggleButtonGroup` (`All` / `Tab only` / `Hidden`). |
| Weather & Hourly Forecast widgets | **Calm `.pro-surface` HeroUI composed cards with Hugeicons condition icons, HeroUI `Badge`s, and a `bklit UI` `AreaChart` (`src/pro/ui/bklit/AreaChart.tsx`, MIT, re-skinned onto HeroUI tokens) on the `2×2` Hourly Forecast widget.** `Weather & 3-day forecast` (`weather`): `1x` shows current mono temp, condition `Badge`, and `H/L + humidity`; `2x` adds a 3-day mini-forecast strip with Hugeicons icons and mono high/lows; `2x2` adds a 4-pill atmospheric strip (`Feels like`, `Humidity`, `Wind`, `UV` with green/orange/red `Badge`) and a 5-day forecast with horizontal temperature range bars. `Hourly forecast` (`weather_hourly`): `1x` shows current temp + 3 upcoming hour slots; `2x` shows 5 upcoming hour columns with time, Hugeicons icon, mono temp, and rain `%`; `2x2` shows a 24-hour temperature **`bklit UI` `AreaChart`** with smart value labels and interactive crosshair tooltip above a 6-slot hourly condition + rain `%` strip. Tapping either card outside Edit mode opens the Weather detail sheet. |
| Weather detail sheet | **`ProSheet` (`Drawer` on phones, `Modal` `size="lg"` from `768 px` up)** with a HeroUI `Select` weather station picker (when 2+ `weather.*` entities exist), a flat `.pro-surface` current conditions hero summary (`Feels like`, `High / Low`, condition `Badge`), a horizontal `ScrollShadow` 24-hour forecast strip, a 2–3 column atmospheric metrics grid (`Humidity & Dew point`, `Wind & Direction`, `Pressure`, `UV Index` with green/orange/red `Badge`, `Cloud coverage`, `Visibility`), and a 7-day forecast list with horizontal min–max temperature range bars. |
| Family presence widget | **Calm `.pro-surface` HeroUI `Avatar` + `Badge` card across `1x`, `2x`, and `2x2` (Option 3, with an optimized minimal dark/light OpenStreetMap basemap at `2x2`).** `1x` shows an overlapping HeroUI `Avatar` stack with green (`success` = Home), blue (`accent` = named zone), or neutral (`default` = Away) presence dot badges, a `X of Y home` `Badge`, and a compact member location summary; `2x` shows per-person mini-cards (up to 4 members + `+N` badge) with `Avatar`, first name, Hugeicons location label (`Home` / zone / `Away`), and mono phone battery `%` (green/orange/red tones); `2x2` adds a HeroUI `ToggleButtonGroup` member selector above an embedded, viewport-lazy OpenStreetMap mini-map (`src/pro/components/overview/PresenceMap.tsx`) using direct OpenStreetMap raster tiles styled into minimal dark/light basemaps (`.pro-osm-tiles-dark` / `.pro-osm-tiles-light`) and member pin markers. Tapping the card or a member opens the Presence detail sheet focused on that member. |
| Presence detail sheet | **`ProSheet` (`Drawer` on phones, `Modal` `size="lg"` from `768 px` up, Option A)** with a HeroUI `ToggleButtonGroup` member switcher, a `.pro-surface` member summary card (`Avatar`, full name, presence `Badge`, location/zone subtitle), a mobile device & battery card (with green/orange/red battery status `Badge` and level bar), a 2×2 telemetry grid (Presence state, Zone/room, Last updated, HA entity ID), and an interactive OpenStreetMap location card (minimal dark/light basemap, zoom `−`/`+` HeroUI `Button`s, GPS coordinates pill, and an "Open map" HeroUI `Button`). |
| Lighting & Switches widgets | **HeroUI `Switch` + `Slider` + `Badge` cards with a soft warm-amber surface tint on `Lighting` when any light is on (Option 3) across `1x`, `2x`, and `2x2`.** `Lighting` (`lights`): `1x` shows `X / Y on` mono ratio, average brightness `%` `Badge` (`warning` amber when on, `default` when all off), a batch HeroUI `Switch`, and a warm amber ratio progress bar; `2x` adds up to 3 interactive lamp rows (HeroUI `Switch`, lamp name, room subtitle, and mono brightness `%`); `2x2` adds an `All` / `On only` HeroUI `ToggleButtonGroup` filter and up to 6 interactive lamp rows with inline HeroUI `Slider` brightness controls for dimmable lights. `Switches` (`switches`): `1x` shows `X / Y on` mono ratio, active count `Badge`, batch HeroUI `Switch`, and active ratio bar; `2x` adds up to 3 interactive switch toggle rows; `2x2` adds an `All` / `On only` filter and up to 6 interactive switch rows. Tapping either card (or the `Lights` / `Switches` status pills) opens the Lighting & Switches control sheet. |
| Lighting & Switches control sheet | **Shared `ProSheet` (`Drawer` on phones, `Modal` `size="lg"` from `768 px` up, Option A)** supporting both `lights` and `switches` domains with a HeroUI `SearchField`, `All` / `On only` HeroUI `ToggleButtonGroup`, `Turn all on` / `Turn all off` HeroUI `Button`s, room-grouped sections with active count `Badge`s, and per-device rows with a HeroUI `Switch` and (for dimmable lights) a HeroUI `Slider` (`1–100%`) brightness control. |
| Fans, Vacuums & Media player widgets | **`Fans & airflow` (`fans`) & `Vacuums` (`vacuums`)**: Calm `.pro-surface` HeroUI composed cards across `1x`, `2x`, and `2x2` (Option 3) using HeroUI `Switch`, `Slider`, `ToggleButtonGroup`, `Button`, and `Badge` with Hugeicons icons (`Fans`: active ratio, inline fan switches, speed `Slider`, oscillation & `All`/`Running` filter; `Vacuums`: cleaning/paused/error/docked semantic `Badge`s, battery `Badge` & bar, suction speed `ToggleButtonGroup`, and `Clean`/`Pause`/`Dock`/`Locate` `Button`s). **`Media player` (`media`)**: HeroUI v3 composed `.pro-surface` card across `1x`, `2x`, and `2x2` (Option 1 + custom waveform & queue) with a **full rounded-square album cover**, a **dual-layer adaptive album-art background when playing** (blurred zoomed album cover + `useAlbumArtColor` dominant radial wash), a **custom song-adaptive waveform scrubber (`ProWaveformScrubber`)** shaped per track (`title`, `artist`, `duration`) and tinted to the album palette, HeroUI transport `Button`s & volume `Slider`, and an **expandable "Up next" track queue menu** (resolving live HA queue attributes with a curated multi-track queue fallback in Demo mode). |
| Fans, Vacuums & Media detail sheets | **`ProSheet` (`Drawer` on phones `<768 px`, `Modal` `size="lg"` from `768 px` up, Option A)** for each domain: `FansDetailSheet` (search, `All`/`Running` filter, `Turn all on/off`, room-grouped HeroUI `Switch`, speed `Slider`, preset modes, oscillation & direction controls), `VacuumsDetailSheet` (fleet banner, room-grouped cards with status & battery `Badge`s, progress bar, `Clean`/`Pause`/`Dock`/`Locate` `Button`s, suction `ToggleButtonGroup`), and `MediaDetailSheet` (speaker switcher, adaptive album-art Now Playing hero card with square cover, `ProWaveformScrubber`, transport & power `Button`s, volume `Slider` with mute, expandable "Up next" track queue, source/sound-mode HeroUI `Select` pickers, and room-grouped speakers). |
| Security, Cameras & Sensor widgets | **Calm `.pro-surface` HeroUI composed cards across `1x`, `2x`, and `2x2` + Magic UI `BorderBeam` perimeter alert pulse on active critical safety hazards (`smoke`, `leak`, or `triggered` alarm) (Option 2).** **`Security alarm` (`alarm`)**: state-tinted shield tile + green/orange/red/neutral `Badge`, quick `Arm Home` / `Disarm` HeroUI `Button` (`1x`), inline `ToggleButtonGroup` (`Off`/`Home`/`Away`/`Night`) + open-entries warning (`2x`), and connected door lock controls reusing `HoldToConfirmButton` + `Lock all` (`2x2`), backed by `AlarmCodeSheet` and open-entry `AlertDialog`. **`Cameras` (`cameras`)**: featured 16:9 camera frame reusing `ProCameraPlayer` (`live={false}` preview at `1x`/`2x`, `live={true}` stream with full-screen & snapshot controls at `2x2`), motion/ready `Badge`, and camera switcher pills. **`Entry doors`, `Windows`, `Motion zones`, `Water leaks`, `Smoke & fire`**: calm `.pro-surface` cards with danger (`leak`/`smoke`) or warning (`doors`/`windows`/`motion`) active tints, Magic UI `BorderBeam` on active leaks/smoke, mono counts (`1x`), top-3 sensor rows (`2x`), and `All`/`Active` `ToggleButtonGroup` filter with room & `timeAgo` rows (`2x2`). |
| Security, Cameras & Sensor detail sheets | **`ProSheet` (`Drawer` on phones `<768 px`, `Modal` `size="lg"` from `768 px` up, Option A)**: `AlarmDetailSheet` (panel `Select` picker, state hero with `BorderBeam` when triggered, `ToggleButtonGroup` modes with `AlarmCodeSheet` + open-entry `AlertDialog`, open entries summary, and door locks with `HoldToConfirmButton` + `Lock all`), `CamerasDetailSheet` (live `ProCameraPlayer` + camera switcher), and shared `SensorsOpeningsDetailSheet` (domain switcher pills for `doors`/`windows`/`motion`/`leak`/`smoke`, `SearchField`, `All`/`Active` filter, and room-grouped rows). |
| Energy widgets | **Full 8-widget Home Assistant Energy Suite built as calm `.pro-surface` HeroUI composed cards across `1x`, `2x`, and `2x2` using `@bklit` charts (`PowerSourcesAreaChart`, `BidirectionalBarChart`, `SolarForecastBarChart`, `SankeyChart`, and official `@bklit/gauge-chart` `Gauge` under `src/pro/ui/bklit/gauge/`) plus `Magic UI` (`AnimatedBeam`) re-skinned onto HeroUI tokens and Hugeicons (Option 1 + Option A, refined 2026-11-18).** Visualizations sit directly on the widget's `.pro-surface` card with no nested card-inside-card boxes. **`Power flow` (`power_flow` — Energy distribution):** Diamond node flow using borderless HeroUI mini-cards (`bg-default/55`, soft icon tiles, and `Home` supply split bar) wired with Magic UI `AnimatedBeam` (`src/pro/ui/magicui/AnimatedBeam.tsx`) pulses (`Low-carbon` node shown on `2x2`). **`Power flow (12h)` (`power_flow_chart` — Power sources):** `bklit UI` bidirectional zero-baseline stacked area chart (`src/pro/ui/bklit/PowerSourcesAreaChart.tsx`) aggregated in **10-minute intervals** (`step = 2` on 5-minute `powerBuckets`) with airy HeroUI token gradients (`--warning`, `--success`, `--accent`, `#818cf8`), dashed `Consumption` overlay, scrub tooltip, and clickable legend pills. **`Energy usage` (`energy_usage`):** Total `kWh` + net cost `Badge` + flat borderless `Grid energy balance` center-zero pill bar (`import - export = net`). **`Energy usage (hourly)` (`energy_usage_chart` — Electricity):** `bklit UI` bidirectional stacked bar chart (`src/pro/ui/bklit/BidirectionalBarChart.tsx`) with borderless rounded HeroUI tonal bars, scrub tooltip, and series toggles. **`Solar production` (`solar_production`):** Yield `kWh` + live `kW` `Badge` + official `@bklit/gauge-chart` semicircular `Gauge` (`startAngle={-90}`, `endAngle={90}`, solid rounded arc + ruler) (`1x`/`2x`) and forecast curve (`2x2`). **`Solar forecast (chart)` (`solar_production_chart`):** 24 h amber gradient rounded bars overlaid with dashed `Solar forecast` curve (`src/pro/ui/bklit/SolarForecastBarChart.tsx`). **`Grid balance & gauges` (`energy_gauges`):** Flat borderless `Grid energy balance` bar + up to 4 official `@bklit/gauge-chart` semicircular `Gauge` arcs (`src/pro/ui/bklit/GaugeChart.tsx`, using `zones` + `needle` on bipolar net grid). **`Energy flow` (`energy_flow`):** Left-to-right `bklit UI` `SankeyChart` (`src/pro/ui/bklit/SankeyChart.tsx`) tracing `Sources` -> `Home` -> `Floors` -> `Areas` -> `Tracked devices` + `Untracked consumption`. When `useEnergyData()` returns no buckets yet, charts show an honest awaiting-statistics notice rather than synthetic fallback curves. |
| Energy detail sheet | **`ProSheet` (`Drawer` on phones `<768 px`, `Modal` `size="lg"` from `768 px` up, Option A)** (`src/pro/components/overview/EnergyDetailSheet.tsx`) opening to the tapped widget's focus (`Distribution & power`, `Electricity`, `Solar & forecast`, `Energy flow`, or `Gauges & balance` via wrapped HeroUI `ToggleButtonGroup`), with `Day` / `Week` / `Month` period `ToggleButtonGroup` (`useEnergyData`), 4-card KPI grid, single `.pro-surface` container wrapping the active full-size interactive chart/diagram (10-min `PowerSourcesAreaChart`, `BidirectionalBarChart`, `SolarForecastBarChart`, `SankeyChart`, or `GridBalanceBar` + 4 `@bklit/gauge-chart` semicircular `Gauge` dials), top tracked consumers, and a `"Full Energy Analytics"` HeroUI `Button` to `/energy`. |

Audit fixes (2026-11-19, owner approved P1 + P2):
- bklit charts measure their width with `useMeasuredWidth` (`src/pro/ui/bklit/useBklitChartBox.ts`),
  a callback ref that starts measuring when the chart element appears. Charts that first render
  their "awaiting statistics" placeholder used to stay at the 260 px fallback and draw small in
  the middle of the card.
- Demo statistics: `*_energy` sensors of gas/water appliances are generated as kWh, not gas or
  water volume (`sensor.water_heater_energy` showed 288 kWh). Test: `tests/energyDemoStatistics.test.ts`.
- Energy colours are tokens in `pro.css` (`--energy-solar`, `--energy-battery`, `--energy-grid`,
  `--energy-export`, `--energy-gas`, `--energy-untracked`, light and dark values; `--chart-4` =
  export). No hex or Tailwind palette colours left in the energy widgets, charts, beams or hazard
  `BorderBeam` (`--danger` → `--warning`). Export text is AA in light mode (was indigo-400, 2.9:1).
- Gauges (`ArcGauge`) are `role="img"` with "label: value".
- Edit-mode controls (drag, move, hide, resize corner, section buttons) are 44 px on touch screens
  (`.pro-touch-44`, `pointer: coarse`); mouse layouts unchanged.
- Resize corner keys follow sliders: Right/Up grow, Left/Down shrink, Home/End.

Audit fixes P3 + P4 (2026-11-19, owner approved):
- Grouped view: Family presence gets its own **People** section (agent's call; it was filed under
  Security). Its open button goes to the Security tab (`sectionTab('people')`), since there is no
  People tab. `src/pro/lib/overviewSections.ts`.
- Add widgets sheet categories are the Overview tabs (same labels, icons and order).
- Edit mode has one Done control, the tab-row toggle; the second one in the action bar is gone.
- Top consumers hides devices under 0.005 kWh.
- Masonry row spans come from one hook, `useMasonryRowSpan` (`src/pro/ui/magicui/BentoGrid.tsx`),
  used by cards, sections and `BentoCard`.
- Card clicks: `SortableWidgetCard` opens details unless the click started on a control
  (`CARD_CLICK_IGNORE`: buttons, links, form fields, sliders, switches, or `data-card-click="ignore"`).
  Widgets no longer stop click propagation; control rows that also stop `pointerdown` (so dragging
  doesn't start on them) carry `data-card-click="ignore"`. Presence member cards and the charts'
  scrub guard keep their own handlers.
- Sheets: ProOverview keeps one `OverviewSheet` value (`src/pro/lib/overviewSheets.ts`) instead of
  ten booleans, so only one sheet is open at a time. Widget and pill mapping is pure and tested.
- Re-renders: widget bodies are memoized (`components/overview/memoWidgetBodies.ts`), ProOverview
  passes stable handlers, and empty store values fall back to shared constants.

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

## 8. Page roadmap

| # | Item | Status |
|---|---|---|
| 1 | Sign-in page | Built: `src/pro/components/ProSignIn.tsx` + `src/pro/ui/boardui/AuthCard.tsx` |
| 2 | Sidebar | Built: `src/pro/components/ProSidebar.tsx` + `src/pro/ui/untitledui/SidebarSectionDividers.tsx` |
| 3 | Mobile nav bar | Built: `src/pro/components/ProMobileNav.tsx` + `src/pro/ui/reactbits/GlassSurface.tsx` |
| 4 | Page headers | Built: `src/pro/components/ProPageHeader.tsx` + `pageHeaderContext.ts` + `src/pro/ui/magicui/BlurFade.tsx` |
| 5 | Security page | Built: `src/pro/pages/ProSecurity.tsx` + `src/pro/components/security/` (7.5) |
| 6 | Overview, Rooms, Energy | Overview built (7.6); Rooms, Energy not started |
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

## 10. Notes for other agents

- Start by reading this file, then `docs/pro-ui/HANDOFF.md` (current state, reusable pieces,
  gotchas, next steps), `CLAUDE.md` and `docs/AI_RULES.md`.
- Check the Decision log and the status line of the component you are asked to work on. If it
  says PENDING DECISION, your job is step 1 and 2 of the working agreement, not building.
- Record every decision and every deviation here in the same change as the code.
- Commands: `npm run lint`, `npm test`, `npm run build:pro`; dev server per `.claude/launch.json`.
