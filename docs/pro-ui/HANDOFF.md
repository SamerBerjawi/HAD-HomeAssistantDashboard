# Pro UI handoff: brief for the next agent

Written 2026-11-18 at the end of the Security page work. Updated 2026-11-20: the Overview is
rebuilt and live at `/overview` (DESIGN.md 7.6, `docs/pro-ui/OVERVIEW_REBUILD.md`, widget looks
in `docs/pro-ui/WIDGET_DESIGN.md`). Paste the prompt below into the next
agent (Claude Code, Gemini on Antigravity, ...). Everything after the prompt is reference it can
read from this file.

---

## Prompt to paste

> You are continuing the **pro UI redesign** of HAD – Home Assistant Dashboard (always "HAD" /
> "Home Assistant Dashboard", never "HOMZ"). The repo is checked out on branch `feature/pro-ui`,
> which has an open pull request
> (https://github.com/SamerBerjawi/HAD-HomeAssistantDashboard/pull/21) against `main`.
>
> Before anything else, read in this order: `docs/pro-ui/DESIGN.md` (single source of truth, read
> all of it), `docs/pro-ui/HANDOFF.md` (this brief: state, patterns, gotchas, next steps),
> `CLAUDE.md`, `docs/AI_RULES.md`, `.agents/rules/pro_ui.md`.
>
> How we work (non-negotiable, from DESIGN.md section 1): one component at a time. For each
> component: research the options in the library roster (HeroUI v3 free core first, Hugeicons,
> bklit UI, BoardUI free, Magic UI, React Bits, Untitled UI free; never Origin UI, never HeroUI
> Pro), present 2–4 options to the owner with your recommendation first and the trade-offs, wait
> for the answer, record it in DESIGN.md (component spec + decision log) **before** coding, build
> only that, verify, then stop and report. Never choose a library, layout, colour, animation or
> copy on the owner's behalf; when the owner says "your call", decide, and mark it as the agent's
> call in DESIGN.md. Commit and push only when the owner asks.
>
> The **Overview** is done (rebuilt 2026-11-20; remaining: rebuild Phase 6 verification on a
> real touch device and live HA, and the details sheets redesign in WIDGET_DESIGN.md). Your next
> job is roadmap item 6b, **Rooms**, then Energy. (Original Overview brief, kept for reference:)
> Start with Overview: do not write code yet. First study the classic Overview (`src/components/overview/`,
> tiles in `src/components/overview/tiles/`, state in `useOverviewHeaderState.ts`) and the data
> hooks it uses, then come back to the owner with a proposed **section list and layout for the pro
> Overview** (phone and desktop) as your first question, the way the Security page was decided
> (see DESIGN.md 7.5 for the pattern). After the structure is agreed, decide each section's look
> and components one by one.
>
> Verification for every change: `npm run lint`, `npm test`, `npm run build:pro`, then check in a
> browser at 375 px, ~768 px and ≥1280 px, light and dark, with demo data and, when the owner has
> connected it, their live Home Assistant. Report plainly what you could not verify.

---

## 1. Where things stand

- Branch `feature/pro-ui`, PR #21 against `main`, Auto-fix watching CI. Latest commits:
  - `2c15dbe` shell (sign-in, sidebar, mobile nav, page headers, DESIGN.md).
  - `34eb944` Security page redesign + owner's review rounds.
  - `8b7d799` CI fix: `@vitejs/plugin-react` and `@tailwindcss/vite` moved to devDependencies
    (production `npm audit` gate, picomatch advisory with no patch). Confirm CI went green.
- Built (DESIGN.md sections 7.1–7.5): sign-in, sidebar, mobile nav, page headers with a live
  sentence on all 13 pages, Security page.
- Every page except Security renders a placeholder in `src/pro/ProApp.tsx` (`activeTab ===
  'security' ? <ProSecurity /> : placeholder`). Add new pages there.
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

## 5. What to build next

1. **Overview (roadmap 6a).** Done: rebuilt and live (2026-11-20). Details sheets redesigned on a shared kit
   (2026-11-20, WIDGET_DESIGN.md §8; owner-reviewed the same day, changes built).
   Left: Phase 6 verification (OVERVIEW_REBUILD.md). Original note: first decision: the section list and layout. Inputs to study: the
   classic tiles (alarm, cameras, doors, windows, locks, motion, leak, smoke, lights, fans,
   switches, media, vacuums, users/presence, weather + hourly, energy usage, power flow, solar).
   The header already shows the greeting and a weather + presence sentence, so don't repeat that
   in the body. Expect to reuse the Security pieces for any security summary.
2. **Rooms (6b).** Rooms page built: the owner picked B · Gallery (2026-11-20); see [ROOMS.md](ROOMS.md). Next: the room detail view (concepts first). Room detail is the first page with a
   sub-view, which triggers the planned **breadcrumbs decision** (DESIGN.md 7.4: library, HeroUI
   `Breadcrumbs` is free; placement; back affordance on phones).
3. **Energy (6c).** Charts and KPIs from bklit UI (check licence per chart), data from
   `useEnergyData`, `useEnergyComparison`, `services/energy/`.
4. Then the remaining pages (roadmap 7), one at a time, in the order the owner chooses.

For each page: pick its accent hue with the owner (pro.css `data-page`), decide sections, then
each section's components, then build.

## 6. Open follow-ups (not blocking, tell the owner when relevant)

- Not yet verified against a real setup: live WebRTC streaming via go2rtc (needs the Docker/prod
  build), native full screen in Chrome/Safari and the iPhone system player, the PIN sheet with an
  alarm that needs a code, logbook user names (`person.user_id` mapping).
- The owner's "Motion" sensor at the Entrance is classified as a door by the shared classifier
  (`classifyBinarySensors`), probably because of its device class in HA. Changing shared
  classification affects classic too: ask first.
- DESIGN.md section 1 says "Commit only when the owner asks. Never push." The owner has since
  asked for pushes explicitly; push only when asked, never on your own.
- Keep the "Last updated" line at the top of DESIGN.md current.

## 7. Definition of done for a component

- Decision recorded (spec section + decision log), agent's own calls marked as such.
- Lint, tests (add unit tests for any new pure logic in `src/pro/lib/`), `build:pro` green.
- Checked at phone, tablet and desktop widths, light and dark, demo data (and live if connected).
- No `TEMP-VERIFY`, no stray files, nothing outside `src/pro/` changed unless agreed and
  explained.
- A short report to the owner: what was built, what wasn't verified, the next decision.
