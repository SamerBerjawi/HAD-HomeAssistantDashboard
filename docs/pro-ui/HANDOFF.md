# Pro UI handoff: brief for the next agent

Written 2026-11-18 at the end of the Security page work. Updated 2026-11-20 (Overview rebuilt)
and 2026-11-23 (Rooms page, room/area page and the studio pattern; Energy next). Paste the prompt
below into the next agent (Claude Code, Gemini on Antigravity, ...). Everything after the prompt
is reference it can read from this file.

---

## Prompt to paste

```text
You are continuing the PRO UI redesign of HAD – Home Assistant Dashboard (always "HAD" /
"Home Assistant Dashboard", never "HOMZ"). Repo checked out on branch `feature/pro-ui`
(open PR #21 against `main`). The classic UI (src/App.tsx, src/components/**) must stay
untouched; all pro work lives in `src/pro/`.

Read first, in this order: `docs/pro-ui/DESIGN.md` (single source of truth, read all of it),
`docs/pro-ui/HANDOFF.md` (this brief: state, reusable pieces, studio pattern, gotchas, next
steps), `docs/pro-ui/ROOMS.md`, `docs/pro-ui/AREA_TILES.md`, `docs/pro-ui/WIDGET_DESIGN.md`,
`CLAUDE.md`, `docs/AI_RULES.md`, `.agents/rules/pro_ui.md`.

How we work (non-negotiable, DESIGN.md §1): one component at a time. Research the options in
the library roster (HeroUI v3 free core first, Hugeicons only, bklit for charts/KPIs (check per
chart that it is free), BoardUI free, Magic UI, React Bits, Untitled UI free, Kokonut UI; never
Origin UI, never HeroUI Pro), present 2–4 options to the owner with your recommendation first and
the trade-offs, wait for the answer, record it in DESIGN.md (component spec + decision log)
BEFORE coding, build only that, verify, then stop and report. Never choose a library, layout,
colour, animation or copy on the owner's behalf; when the owner says "your call", decide and mark
it as the agent's call in DESIGN.md. Never run Prettier. Commit only when the owner asks; push only
when explicitly asked.

Looks are decided in dev-only design studios, not in production. Follow the studio pattern in
HANDOFF.md §5 for every new page (the Rooms Studio, `/?studio=rooms`, is the template).

Your next job is roadmap item 6c, Energy (accent already set: orange hue 52, dark foreground).
Do not write code yet. Study the classic Energy view and its data (`useEnergyData`,
`useEnergyComparison`, `src/services/energy/`, `/api/statistics/*`) and the Overview's energy
widgets (`src/pro/widgets/energy/`), then propose a section list and layout (phone and desktop)
to the owner as your first question. Once agreed, build an Energy Studio (`/?studio=energy`) with
concepts per section and decide each one with the owner. After Energy, the remaining pages one at
a time in the owner's order.

Verification for every change: `npm run lint`, `npm test`, `npm run build:pro` (plus
`npm run check:bundle` if the bundle could grow), then check in a browser (`npm run dev:pro`,
port 3000) at 375 px, ~768 px and ≥1280 px, light and dark, with demo data and, when the owner
has connected it, their live Home Assistant. Report plainly what you could not verify.
```

---

## 1. Where things stand (2026-11-23)

- Branch `feature/pro-ui`, PR #21 against `main`. Latest commit `901c562` (Rooms page + Rooms
  Studio). `scratch/room-page-mockups/` is untracked on purpose (old A–D room mockups kept
  outside the build): do not commit or delete it.
- Built: sign-in, sidebar, mobile nav, page headers with a live sentence on every page, Security
  (7.5), Overview (7.6; widget registry `src/pro/widgets/`, chosen looks in
  `widgets/designRegistry.ts`, details sheets on a shared kit), notification center (7.7), toasts
  and emergency alert (7.8).
- **Rooms page** (ROOMS.md §1–3, §5): floor-grouped explorer with Design D "Soft blend" tiles:
  `src/pro/pages/rooms/RoomsExplorer.tsx`, `RoomTileBlend.tsx`, `RoomQuickActions.tsx`,
  `tileParts.ts`, pure sizing/packing in `src/pro/lib/roomTiles.ts`, styles `.pro-rb*` in
  `pro.css`. Per-room sizes and options in Customize (`preferences.proRooms`).
- **Room / area page** (AREA_TILES.md): the B + C page (Rail with All / Now views) is in
  production at `src/pro/pages/room/RoomPage.tsx`. HA → tile mappers in `src/pro/areas/ha/`,
  actions in `haTileActions.ts` + `useTileActions.ts`, chosen tile per kind in
  `src/pro/areas/tiles/chosenTiles.tsx`, saved layouts in `preferences.proAreaLayouts`, page kit
  shared with the studio in `src/pro/areas/page/`.
- Not started: Energy (6c) and the remaining pages (roadmap 7). Pages without a pro version still
  render a placeholder in `src/pro/ProApp.tsx`; add new pages there.
- Run it: `npm run dev:pro` (port 3000, `.claude/launch.json` config "dev-pro"). Demo mode works
  without Home Assistant; the owner sometimes connects their live instance in the same browser.

## 2. What the owner cares about (learned from feedback)

- Library first, decision by decision, with a recommendation; record everything.
- Phone first, then tablet, then desktop. They test all three and send screenshots.
- Every button, pill, label and box has an icon (icon + text, or icon only by context).
- Status pills are **green / orange / red only**: green fine, orange needs a look, red problem
  (DESIGN.md 7.5 "Status pills"). Neutral tiles when all is well.
- Calm, clean surfaces: no text over video/photos, no glass except the mobile nav pill.
- Space must be used well on desktop (they asked for masonry packing of the device grid).
- Compact states when nothing is wrong (the slim "All secure" row below 1024 px).
- Controls should "explain themselves" (Unlock button with hold, no extra "Hold to" text).

## 3. Reusable pieces (use these before inventing new ones)

| Need | Use |
|---|---|
| Card surface / accent | `.pro-surface`, `.pro-soft`, `.pro-accent`, `var(--accent)`; accent per page via `data-page` (`src/pro/pro.css`; add a page's hue there when you decide it). |
| Page ⋮ menu | `useProPageHeader({ menu })` from `src/pro/components/pageHeaderContext.ts`. |
| Header sentence | Already built for all 13 pages: `src/pro/lib/pageSentences.ts` + `PageSentence.tsx`. |
| Bottom sheet on phone / modal on desktop | `src/pro/components/ProSheet.tsx`. |
| Widget details sheet | `src/pro/widgets/shared/sheet/SheetKit.tsx` (`DetailSheet`, `SheetHero`, `SheetSection`/`SheetRow`, `SheetFilter`, `SheetSearch`, `SheetSlider`, `SheetTiles`); list helpers in `src/pro/lib/sheetLists.ts`; `RecentEvents` (logbook, 24 h) next to it. Slide to confirm: `widgets/shared/useSlideToConfirm.ts`. Rules: WIDGET_DESIGN.md §8. |
| Bento / masonry grid | `src/pro/ui/magicui/BentoGrid.tsx` (`BentoGrid`, `BentoCard`; cards measure their height; `packOrder` in `securityLogic.ts`). |
| Status pill / device row | `StatusChip`, `DeviceRow`, `LockAction` in `src/pro/components/security/DeviceRow.tsx`; tones from `deviceItem()` in `src/pro/lib/securityLogic.ts`. |
| Hold-to-confirm | `src/pro/components/security/HoldToConfirmButton.tsx`. |
| Camera | `ProCameraPlayer` (WebRTC → native `<video>`, snapshot underneath, full screen with fallbacks) + `useWebRtcCamera`; `SecurityCameras` for featured + strip. |
| Alarm | `AlarmHero` (modes, PIN sheet, confirm, panel picker). An Overview alarm tile should reuse its logic. |
| Activity feed | `useSecurityActivity` (HA `logbook/get_events`) + `RecentActivity`. |
| Breakpoints in JS | `src/pro/hooks/useMediaQuery.ts`. Prefer Tailwind container queries (`@container`, `@md:`) inside cards. |

If a piece becomes shared by a second page, move it out of `components/security/` into
`src/pro/components/` (or `src/pro/lib/` for pure logic) in the same change and say so.

## 4. Gotchas (each one cost time)

- **Vite HMR is unreliable here.** Reload the page after edits. If a change still doesn't show,
  fetch the module to check what is served: the pro app's root is `src/pro`, so the URL is
  `/components/...`, not `/src/pro/components/...`.
- **Import cycle** `haWebSocket → alertService → useAutoLayoutStore → haWebSocket`. The store now
  reads the HA version defensively at creation, but do not add code that touches
  `haWebSocketService` at module or store-creation time, and avoid changing import order in
  `ProApp`/`main.tsx` casually. Symptom: blank page, "Cannot access 'haWebSocketService' before
  initialization".
- **Do not press the in-app theme toggle while testing**: it persists to the shared server config
  and syncs to the owner's other screens. Switch themes for testing by toggling the `dark` class
  with JS (and remember components that take `darkMode` as a prop won't follow).
- **Portaled overlays** (Drawer, Modal, AlertDialog, Select popover) render outside `.pro`: give
  the dialog/popover `className="pro"` and `data-page="<page>"`, or the accent is lost.
- HeroUI `variant="secondary"` buttons fall back to HeroUI's blue inside portals; use `tertiary`
  for neutral keys.
- The global UI-006 focus ring in `src/index.css` is `!important`; override narrowly in `pro.css`
  only where the component already shows its own focus (see the InputOTP rule).
- **Demo data gaps:** no configured camera streams (cameras section is empty in demo), no
  `last_changed` (activity is empty in demo). The dev server has no go2rtc, so WebRTC returns 503
  and the player shows "Snapshot". Inject test data temporarily, mark it `TEMP-VERIFY`, and remove
  it before finishing (`grep -rn TEMP-VERIFY src` must be empty).
- The in-app browser pane can't enter real full screen; the camera falls back to a full-window
  view there. Test native full screen in a normal browser.
- Repo guards: no raw `<button>` (`tests/rawControlGuard.test.ts`), new files ≤ 800 lines
  (`tests/fileSizeGuard`). No `any`, no `@ts-ignore`.
- CI runs `npm audit --omit=dev --audit-level=high`. Build-only packages must be
  `devDependencies`, or a transitive advisory fails the pipeline.
- Hugeicons free set: check an icon exists before using it (grep
  `node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts`). There is no window icon;
  `BlindsIcon` is used for windows.
- bklit UI: the chart section is marked "Included with Pro" on their site. Verify per component
  which charts are free before proposing any for Energy.

## 5. Design studios (use the same pattern for every new page)

Looks are decided in dev-only studios, on sample data, before production changes. Existing ones:

| Studio | Route | Code |
|---|---|---|
| Widget Design Studio | `/overview?studio` | `src/pro/studio/WidgetStudio.tsx`, concepts in `src/pro/widgets/<id>/concepts/`, picks in `widgets/designRegistry.ts` (WIDGET_DESIGN.md §4) |
| Area Tiles Studio | `/?studio=areas` | `src/pro/areas/studio/AreaStudio.tsx`, one catalog per batch in `areas/studio/catalog/`, simulated Area page, picks via `useAreaPicks.ts` (AREA_TILES.md) |
| Rooms Studio (the template) | `/?studio=rooms` | `src/pro/pages/rooms/studio/RoomsStudio.tsx`, sample home `studioRooms.ts` (ROOMS.md §5) |

The pattern for a new page (for example `/?studio=energy`):

- Lazy loaded behind `import.meta.env.DEV` in `src/pro/ProApp.tsx` (next to the `RoomsStudio` and
  `AreaStudio` lines), rendered outside the shell, left out of the production bundle (confirm
  with `npm run build:pro`).
- A realistic sample dataset with named states (busy, quiet, edge cases). No calls to Home
  Assistant: actions go through a stand-in service (like `RoomServiceContext` +
  `applyStudioService`) and change local state only.
- Concepts A, B, C (and D when the owner mixes) side by side on the same data, with a
  light / dark / both switch local to the studio (never the shared theme setting) and page widths
  for 375, 768, 1024, 1440 and 1920 px screens.
- Concepts share their "what it says" helpers (like `tileParts.ts`) so they differ only in
  composition; styles namespaced per concept in `pro.css`.
- "Approve" stores the pick in localStorage (`had.pro.<page>Studio.pick`) with notes and a
  "Copy for the chat" button. Production changes only after the owner approves; the decision goes
  into DESIGN.md §9 and the page's own doc (`docs/pro-ui/<PAGE>.md`, structured like ROOMS.md).
- Keep the studio after the page ships so concepts can be revisited.

## 6. What to build next

1. **Energy (6c).** First question to the owner: the section list and layout (phone and
   desktop). Inputs: the classic Energy view, `useEnergyData`, `useEnergyComparison`,
   `src/services/energy/`, `/api/statistics/*`, and the Overview's energy widgets
   (`src/pro/widgets/energy/`: Energy now, Energy today, Energy flow). Charts and KPIs from bklit
   UI (check the licence per chart). Then an Energy Studio and section-by-section decisions.
2. **Remaining pages (roadmap 7)**, one at a time, in the order the owner chooses. For each: pick
   its accent hue with the owner (`data-page` in `pro.css`), decide sections, then each section's
   components through a studio, then build.
3. **Open room-page items** (raise when relevant, ask before starting): history for trends,
   events and open spells (the Door & window tile says "Not opened in 24 h" until then); the
   Rooms page header still shows above the room page; the breadcrumbs decision (DESIGN.md 7.4) is
   due now that Rooms has a sub-view.
4. Overview leftovers: rebuild Phase 6 verification on a real touch device and live HA
   (OVERVIEW_REBUILD.md).

## 7. Open follow-ups (not blocking, tell the owner when relevant)

- Not yet verified against a real setup: live WebRTC streaming via go2rtc (needs the Docker/prod
  build), native full screen in Chrome/Safari and the iPhone system player, the PIN sheet with an
  alarm that needs a code, logbook user names (`person.user_id` mapping).
- The owner's "Motion" sensor at the Entrance is classified as a door by the shared classifier
  (`classifyBinarySensors`), probably because of its device class in HA. Changing shared
  classification affects classic too: ask first.
- DESIGN.md section 1 says "Commit only when the owner asks. Never push." The owner has since
  asked for pushes explicitly; push only when asked, never on your own.
- Never run Prettier: it reformats files into a foreign style.
- Not checked on the room page: a real car in an area (the demo has none), `test:integration`.
- Keep the "Last updated" line at the top of DESIGN.md current.

## 8. Definition of done for a component

- Decision recorded (spec section + decision log), agent's own calls marked as such.
- Lint, tests (add unit tests for any new pure logic in `src/pro/lib/`), `build:pro` green.
- Checked at phone, tablet and desktop widths, light and dark, demo data (and live if connected).
- No `TEMP-VERIFY`, no stray files, nothing outside `src/pro/` changed unless agreed and
  explained.
- A short report to the owner: what was built, what wasn't verified, the next decision.
