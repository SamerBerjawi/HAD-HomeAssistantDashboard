# HAD Pro UI: design document

Status: living document. Last updated 2026-11-17.
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
| Active tab | **Accent icon + dot**: the icon turns the page accent colour with a small accent dot under it, no background. `aria-current="page"`. |
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

## 8. Page roadmap

| # | Item | Status |
|---|---|---|
| 1 | Sign-in page | Built: `src/pro/components/ProSignIn.tsx` + `src/pro/ui/boardui/AuthCard.tsx` |
| 2 | Sidebar | Built: `src/pro/components/ProSidebar.tsx` + `src/pro/ui/untitledui/SidebarSectionDividers.tsx` |
| 3 | Mobile nav bar | Built: `src/pro/components/ProMobileNav.tsx` + `src/pro/ui/reactbits/GlassSurface.tsx` |
| 4 | Page headers | Built: `src/pro/components/ProPageHeader.tsx` + `pageHeaderContext.ts` + `src/pro/ui/magicui/BlurFade.tsx` |
| 5 | Security page (pilot, first pass in `ProSecurity.tsx`) | To be revisited on the new shell |
| 6 | Overview, Rooms, Energy | Not started |
| — | Breadcrumbs in the page header | Planned: decide with the first page that has sub-views (7.4) |
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

## 10. Notes for other agents

- Start by reading this file, then `CLAUDE.md` and `docs/AI_RULES.md`.
- Check the Decision log and the status line of the component you are asked to work on. If it
  says PENDING DECISION, your job is step 1 and 2 of the working agreement, not building.
- Record every decision and every deviation here in the same change as the code.
- Commands: `npm run lint`, `npm test`, `npm run build:pro`; dev server per `.claude/launch.json`.
