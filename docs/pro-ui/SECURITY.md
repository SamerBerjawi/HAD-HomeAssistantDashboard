# Security page redesign (restarted 2026-11-26)

Status: **Approved by the owner and built (2026-11-26).** The live page (`src/pro/pages/ProSecurity.tsx`) is
B · Ambient with every round's pick: Slide hero + Summary line, Stage + filmstrip cameras (live
WebRTC), Needs a look + tabs, sirens, garages, and the loading / empty / HA-unreachable states. The earlier AntiGravity/Codex studio and its picks are scrapped (owner,
2026-11-26: too busy, generic, inconsistent); see git history before this date if needed.
Working agreement: [DESIGN.md §1](DESIGN.md#1-working-agreement). Page accent: violet (hue 300).

## 1. Brief

**Job.** Answer one question in a second: is my home secure? If not, say what is wrong and offer
the one fix. Then show the cameras.

**Frame (owner, 2026-11-26).** Phone and desktop: the one clear answer first, cameras right below.
Everything else is secondary, in columns, tabs or below the cameras (to be decided per direction).

**On the page (owner, all four):** alarm control; cameras; activity log; devices and safety
(locks, garages, doors and windows, motion, smoke and water, sirens, low battery, offline).

**Avoid:** busy or dense screens (chips and badges everywhere), a generic template look,
sections that do not feel like one page.

## 2. Approach

1. Round 1 (now): three whole-page directions on one sample home, as on the Rooms page.
2. Then refine the chosen direction section by section, asking per element (library first).
3. Still to decide in refinement: hold-to-confirm for critical actions, PIN entry, loading /
   empty / error states, phone tabs or not.

## 3. Security Studio (`/?studio=security`, dev only)

Code: `src/pro/pages/security/studio/` (`SecurityStudio.tsx`, `studioSecurity.ts`, `designs/`,
`cameraArt.ts`); test: `tests/studioSecurity.test.ts`. Devices and cameras use the Area tile
models, so a design can draw them with the owner's chosen Area tiles. Everything runs on
`applySecurityAction` (sample data only, never HA). Pick stored in `had.pro.securityStudio.round1`.

Sample states: Away · all secure; Evening · things open (2 unlocked, patio and garage open);
Night · motion outside (person in the garden, a window sensor and a camera offline, low
batteries); Alarm triggered (siren, patio forced, back lock jammed, water under the sink); Small
flat (one lock, one camera).

| | A · Quiet column | B · Ambient | C · Perimeter line |
|---|---|---|---|
| Answer | Plain type on the page: tone dot, words, one line, modes; fixes listed under it only when needed | A soft hero lit by the state colour, large shield, modes, fixes as pills | One line of words beside a "perimeter" of bars (one per device and camera, coloured by state), modes below |
| Cameras | Calm grid, name under each view | Area camera tiles: one featured, tap another to feature it | Even wall, small captions |
| The rest | Devices as quiet rows by kind; Today beside them on wide screens | Devices as the chosen Area tiles; Today in a side column on wide screens | Tabs under the cameras: Needs you, Devices, Activity |
| + | Calmest, least busy | One family with Rooms / Area pages, most expressive | Shortest page; whole house at a glance |
| − | Least visual; rows, not tiles | Longest page on phones | Bars are a new idea; details one tap away |

Owner pick (2026-11-26): **B · Ambient**. A and C stay in the studio for reference.

## 4. Round 2: the answer hero (in review)

Owner, 2026-11-26: refine B's hero first; the phone layout below the cameras (one scroll or tabs)
is decided later, with Devices and Today. The studio opens on round 2 (`heroes/`), shown inside
the B page or alone. Shared by all three: B's state-lit surface, the words, the fix pills
(Silence siren leads when it sounds), and the code step: turning an armed alarm off asks for the
code when HA does (`needsCode`), using the existing `AlarmCodeSheet` (sample code 1234).
Critical changes (`isCritical`): Away, Night, and turning an armed alarm off.

| | 1 · Mode bar | 2 · Orb | 3 · Slide |
|---|---|---|---|
| Idea | Round 1's hero refined: shield, words, four modes in one bar | The shield is a big glowing button offering the next step (`suggestedMode`); chips pick another mode | Shield and words; a wide "Slide to arm Away / turn off" track; chips pick what it does |
| Critical change | Press and hold the segment (fills) | Press and hold the orb (ring fills) | Slide the knob to the end |
| Home | Tap | Pick, then hold | Tap its chip |
| + | Every mode one gesture away | One big forgiving target | Never by accident; matches the locks widget |
| − | Hold vs tap to learn | Two steps for other modes; tall on phones | Slower; needs width |

Owner pick (2026-11-26): **3 · Slide**, but the fix pills ("Back Door is unlocked · Lock") are too
bulky, especially on phones. Round 3 replaces them.

Owner change after the build (2026-11-26): the slide track is not always there. The hero shows the
mode chips only; pressing Away, Night, or Off while armed opens the track under them. Pressing the
same chip again or × closes it, and it goes away once the alarm changes. Home still arms with a tap.

Owner change (2026-11-26): the hero is more compact, especially on phones, and the modes sit in one
segmented row (HeroUI ToggleButtonGroup; the current mode is selected, or the one about to be
slid to). Smaller shield and title, less padding, and the summary line keeps its fix (Lock all) on
the same row. About 180 px tall on a phone and 140 px on desktop, with the track closed.

Owner change (2026-11-26): on desktop (900 px and up, with cameras) the cameras take two thirds of
the width and Today sits in the last third, clipped to the cameras' height and scrolling; Today
leaves the tabs there. Each event's icon has its kind's colour (`EVENT_COLOR` in `parts.tsx`);
warnings and alerts keep the tone's colour. Phones keep Today as a tab.

## 5. Round 3: what needs you, inside the Slide hero (decided)

Replaces the fix pills (`heroes/needsStyles.tsx`). "Silence siren" stays a full button in all three.

| | A · Quiet list | B · Summary line | C · Slim strip |
|---|---|---|---|
| Idea | Hairline rows: dot, words, a text action (Lock); three at most, then "N more"; Lock all at the end | One line of counts with icons ("2 unlocked · 2 open") and one main fix; tap it for the list | One line of small icon chips that scrolls sideways; a chip with a fix applies it |
| + | Says exactly what is wrong; no backgrounds | Always one line | One line, every name a swipe away |
| − | Up to three rows taller | Names one tap away | Still chips, only smaller |

Owner pick (2026-11-26): **B · Summary line**. The settled hero is `HeroSlide` with `NeedsSummary`
(`SettledHero` in `designs/DesignB.tsx`); the B page in the studio now uses it by default.

## 6. Round 4: cameras (decided)

Owner, 2026-11-26: cameras next. `cameras/CameraConcepts.tsx`, shown inside the B page under the
settled hero, or alone. No text on the video in any concept; each has a full-screen view (HeroUI
Modal, size full) with previous / next. Cameras are ordered by their latest event.

| | A · Stage + filmstrip | B · Even wall | C · Motion first |
|---|---|---|---|
| Idea | One big view, its name and what it saw under it, a strip of every camera to switch | Every camera the same size, latest first (first one full width on phones); tap for full screen; offline ones become one line | The latest event is the big view; a "Recent" list switches it; quiet cameras in a small row; side by side on desktop |
| + | Biggest picture, calm | Every camera at once | Leads with what happened |
| − | One camera live at a glance | Smaller pictures, long with many cameras | Two lists; layout moves as events come in |

Owner pick (2026-11-26): **A · Stage + filmstrip**. The B page in the studio now uses it by default.

## 7. Round 5: devices and Today (decided)

Owner, 2026-11-26: devices next. `devices/DeviceConcepts.tsx`, inside the B page under the
settled hero and cameras, or alone. All use the chosen Area tiles; open doors and windows take a
Wide tile (their day strip). Each concept owns everything below the cameras, Today included, so
it also settles the phone question.

| | A · By type | B · By area | C · Needs a look + tabs |
|---|---|---|---|
| Idea | Locks, Doors & windows, Smoke & water, Motion, each with a one-line status ("2 of 3 not locked"); problem tiles first | One group per area, areas with problems first, "Secure" on the rest | Problem devices first as tiles; the rest in tabs (All, Locks, Openings, Safety, Motion, Today) |
| Today | Column beside on desktop, under on phones | Same as A | A tab |
| Phones | One scroll | One scroll | Tabs |

Not in the sample yet: sirens and garage covers (`cover` garage / gate).

Owner pick (2026-11-26): **C · Needs a look + tabs**. This also settles phones: the page is hero,
cameras, "Needs a look" tiles, then tabs (Today is a tab), the same on phone and desktop. The B
page in the studio now uses it by default.

## 8. Round 6: the full page, sirens, garages and edge states (in review)

Owner, 2026-11-26: finish the studio before building. The studio opens on round 6: the settled
page (B with every pick) plus a "Page state" switch.

- **Sirens** (`siren.*`): no Area tile type existed, so a proposed `devices/SirenTile.tsx` in the
  security tile family: Quiet / Sounding, Silence when sounding, Test by press-and-hold when quiet.
  A siren sounding while the alarm is not triggered is a danger issue with a Silence fix;
  Silence siren in the hero silences every siren.
- **Garage doors** are `cover` (garage) entities drawn with the chosen cover tile (Cover ·
  Positions); an open garage is an issue with a **Close** fix and counts as "open" in the Summary
  line. Open question: the cover tile shows positions (0 %…100 %), which suits blinds better than
  garages; opening a garage is a single tap there, not a hold.
- **Edge states** (`edge/EdgeStates.tsx`): Loading = skeletons in the page's own shapes; Empty =
  "No security devices yet" with Open Home Assistant; HA unreachable = one danger alert (last known
  time, Retry) over the last known page, dimmed and read-only.

Owner review (2026-11-26): **approved, built**.

## 9. Production build (2026-11-26)

- Model and rules: `src/pro/lib/securityPage.ts` (shared with the studio). HA → model:
  `src/pro/lib/securityHome.ts` (Area tile mappers, batteries from `useSecurityData`, camera AI
  sensors, logbook events). Actions → services: `src/pro/lib/securityActions.ts`. Hook:
  `src/pro/hooks/useSecurityHome.ts`. Tests: `tests/securityHome.test.ts`, `tests/studioSecurity.test.ts`.
- Components: `src/pro/pages/security/` (`SecurityHero`, `NeedsSummary`, `heroKit`, `CameraStage`,
  `SecurityDevices`, `SirenTile`, `SecurityStates`, `parts`). The studio's alternatives import from
  there; the studio is still left out of `dist-pro/`.
- Cameras: the big view and full screen stream with `ProCameraPlayer`; thumbnails are HA snapshots
  refreshed every 25 s. Detections come from the cameras' own HA sensors (the old opt-in on-device
  AI is not on the new page).
- Codes: HA's `code_format` / `code_arm_required` decide when the PIN sheet opens; HA checks the code.
- Not carried over from the old page: the device detail sheet, the multi-panel switcher (the page
  uses the selected panel), and the on-device camera AI. The old components in
  `src/pro/components/security/` stay because Overview widgets still use some of them.
