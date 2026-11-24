# Security page redesign (Security Studio)

Status: **All 5 section designs approved by the owner and built in production (2026-11-24)** (`src/pro/pages/ProSecurity.tsx`, `src/pro/components/security/*`). Studio kept at `/?studio=security` (linked from `/overview?studio`).
Working agreement: [DESIGN.md §1](DESIGN.md#1-working-agreement). Page accent: violet/purple (`hue 300`, `data-page="security"` in `src/pro/pro.css`); status pills stay strictly green / orange / red.

## 1. Agreed structure (owner, 2026-11-23)

- **Desktop and tablet (≥ 768 px):** One scrolling page (Alarm + Attention row, Cameras + Recent Activity row, Device Groups full width).
- **Phone (< 768 px):** **Alarm hero** pinned at the top, followed by Kokonut `SmoothTab` tabs for **Attention**, **Cameras**, **Activity**, and **Devices** (each hiding cleanly when Home Assistant has no devices for it).
- **Core sections kept (all 5 + edge states):**
  1. **Alarm hero** — alarm state, arm/disarm modes, panel switcher, people-home badges, PIN sheet & open-door confirm, triggered emergency banner.
  2. **Needs attention** — active hazards, sirens, jammed/unlocked locks (`Lock all`), open doors/windows/garages, low battery & offline alerts, calm "All secure" state.
  3. **Cameras** — featured WebRTC camera / multi-cam wall, motion alerts, AI detection chips (`Person`, `Vehicle`, `Package`, `Animal`), mute, fullscreen; zero text overlaid on video.
  4. **Recent activity** — 24 h HA security logbook timeline and hourly activity pulse.
  5. **Device groups** — Locks (press-and-hold unlock), Garages & gates, Sirens, Doors & windows, Motion, Leak & smoke hazards (By type / By room / By floor).
- **Edge states:** Loading skeleton, Empty ("No security devices yet"), Service error alert.

## 2. Security Studio (`/?studio=security`)

Dev only (`src/pro/pages/security/studio/SecurityStudio.tsx`), registered in `src/pro/studio/studioRegistry.ts` and excluded from `dist-pro/`. Compares three structurally distinct concepts (`A`, `B`, `C`) per section across 5 interactive sample home states (`studioSecurity.ts`), Light/Dark/Both theme stages, and 375–1920 px widths.

Sample states:
- **Armed & All Clear** — armed away, 3/3 locks locked, 0 open, 4 live cameras (1 quiet package alert).
- **Evening Attention** — disarmed, 2 locks unlocked, patio & garage open, driveway vehicle+person motion, 1 low-battery sensor (14%).
- **Night + Motion** — armed night, garden person motion, 1 offline window sensor, living camera offline.
- **Alarm Triggered** — emergency state: siren sounding, patio door forced open, back lock jammed, kitchen leak active.
- **Edge states** — loading skeleton, empty state, error alert.

All actions (arm/disarm, perimeter warning, switch panel, lock/unlock, lock all, close garage, silence sirens, switch/mute camera) run locally via `applySecurityAction` and never call Home Assistant. Picks persist in `localStorage` (`had.pro.securityStudio.pick`).

## 3. Section concepts & owner picks (2026-11-24)

**Critical action safety rule (owner, 2026-11-24):** Always use **press-and-hold** (`HoldToConfirmButton`) for critical actions — arming the alarm Away / Vacation, disarming without a PIN when armed, unlocking doors, opening garages/gates, and testing sirens.

| # | Section | Concept A | Concept B | Concept C | Chosen |
|---|---|---|---|---|---|
| 1 | **Alarm hero** | **Shield Halo Console**: concentric SVG 4-zone perimeter ring around shield + mode bar (press-and-hold on Away/Vacation/code-free Disarm) | **Interactive Mode Deck**: 4 tactile mode tiles (`Off`/`Home`/`Away`/`Night`) with plain subtitles | **Sentinel Command Strip**: compact header + `SmoothTab` modes + readiness chips | **A** |
| 2 | **Needs attention** | **Triage Priority Stack**: severity-ordered rows + inline `Lock`/`Close`/`Silence` + `Lock all` | **Perimeter Radar Matrix**: 2×2 visual zone status grid (Locks, Entries, Hazards, Health) + drilldown | **Compact Alert Ticker**: single green banner when clear, dense chips + quick-fix bar when active | **B** |
| 3 | **Cameras** | **Theater Stage + Filmstrip**: 16:9 featured camera + caption bar below + thumbnail strip + motion jump | **Multi-Cam Surveillance Wall**: 2-col simultaneous wall with Exterior/Interior filter + spotlight expand | **Motion-First Event Reel**: split live viewport beside vertical AI event & camera switcher rail | **A** |
| 4 | **Recent activity** | **Vertical Spine Timeline**: connected semantic timeline + category filter pills + Show all | **24-Hour Activity Pulse + Feed**: 24 hourly severity density bars above Latest / Earlier groups | **Compact Audit Ledger**: time-first monospace rows with category icon and actor/area tags | **C** |
| 5 | **Device groups** | **Adaptive Bento Cards**: domain cards with `By type` / `By room` toggle and inline actions | **Interactive Tile Deck**: Area-tile-inspired grid with category filter pills (`Locks`/`Openings`/…) | **Floor-by-Floor Security Accordion**: collapsible Ground / First / Exterior tree with Sealed/Open chips | **B** |
