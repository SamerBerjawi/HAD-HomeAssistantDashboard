/**
 * Catalog of all 5 Security sections with three structurally distinct design concepts per section
 * (docs/pro-ui/SECURITY.md).
 */
import type { ComponentType } from 'react';
import { ActivityA, ActivityB, ActivityC } from './concepts/ActivityConcepts';
import { AlarmA, AlarmB, AlarmC } from './concepts/AlarmConcepts';
import { AttentionA, AttentionB, AttentionC } from './concepts/AttentionConcepts';
import { CamerasA, CamerasB, CamerasC } from './concepts/CameraConcepts';
import { DeviceGroupsA, DeviceGroupsB, DeviceGroupsC } from './concepts/DeviceGroupsConcepts';
import type { SecurityConceptProps } from './concepts/types';
import type { SecuritySectionId } from './studioSecurity';

export type SecurityConceptId = 'A' | 'B' | 'C';

/** Owner-approved production concepts for the Security page (docs/pro-ui/SECURITY.md). */
export const CHOSEN_SECURITY_CONCEPTS: Record<SecuritySectionId, SecurityConceptId> = {
  alarm: 'A',
  attention: 'B',
  cameras: 'A',
  activity: 'C',
  devices: 'B'
};

export interface SecurityConceptEntry {
  id: SecurityConceptId;
  name: string;
  idea: string;
  strengths: string[];
  tradeoffs: string[];
  Component: ComponentType<SecurityConceptProps>;
}

export interface SecurityCatalogEntry {
  id: SecuritySectionId;
  title: string;
  job: string;
  recommended: SecurityConceptId;
  chosen: SecurityConceptId;
  why: string;
  concepts: readonly [SecurityConceptEntry, SecurityConceptEntry, SecurityConceptEntry];
}

export const SECURITY_CATALOG: readonly SecurityCatalogEntry[] = [
  {
    id: 'alarm',
    title: 'Alarm hero',
    job: 'Pinned above tabs on phone; top hero on desktop. Shows alarm state, panel switcher, arm/disarm modes, people home, and triggered emergency actions.',
    recommended: 'A',
    chosen: CHOSEN_SECURITY_CONCEPTS.alarm,
    why: 'Shield Halo Console fuses live alarm status and 4-zone perimeter readiness into one unmistakable visual anchor without feeling crowded.',
    concepts: [
      {
        id: 'A',
        name: 'Shield Halo Console',
        idea: 'Bespoke concentric SVG perimeter-readiness ring around the central shield icon, panel switcher, people-home badges, segmented modes, and subtle state glow.',
        strengths: ['Perimeter health visible directly around the shield', 'Strong visual hierarchy across armed, disarmed, and triggered states'],
        tradeoffs: ['Taller than a single-row command strip on phones'],
        Component: AlarmA
      },
      {
        id: 'B',
        name: 'Interactive Mode Deck',
        idea: 'Clean status header above 4 bold tactile mode tiles (Off / Home / Away / Night) with plain-English scope subtitles and active checkmarks.',
        strengths: ['Huge thumb-friendly mode targets', 'Self-explanatory labels for every household member'],
        tradeoffs: ['Uses more vertical height on desktop when 2×2'],
        Component: AlarmB
      },
      {
        id: 'C',
        name: 'Sentinel Command Strip',
        idea: 'Low-height command banner with Kokonut SmoothTab sliding mode switcher and semantic readiness chips along the bottom.',
        strengths: ['Minimal vertical height above phone tabs', 'Instant chip summary of locks, entries, garage, and hazards'],
        tradeoffs: ['Less dramatic hero presence on wide desktops'],
        Component: AlarmC
      }
    ]
  },
  {
    id: 'attention',
    title: 'Needs attention',
    job: 'Surfaces hazards, active sirens, jammed/unlocked locks, open entries, low batteries, and offline sensors — or shows a calm All Secure state.',
    recommended: 'A',
    chosen: CHOSEN_SECURITY_CONCEPTS.attention,
    why: 'Triage Priority Stack puts critical red hazards and 1-tap Lock / Close / Silence buttons first while collapsing calmly when everything is sealed.',
    concepts: [
      {
        id: 'A',
        name: 'Triage Priority Stack',
        idea: 'Severity-ordered rows (Critical → Warning → Low battery) with 1-tap inline Lock, Lock all, Close garage, and Silence buttons.',
        strengths: ['Zero clicks required to see every active problem and fix it', 'Calm centered All Secure card on desktop, slim row on phone'],
        tradeoffs: ['Card height grows when many sensors are open simultaneously'],
        Component: AttentionA
      },
      {
        id: 'B',
        name: 'Perimeter Radar Matrix',
        idea: '2×2 visual zone matrix (Locks, Entries, Hazards, Health) lighting up green/orange/red with click-to-inspect drilldown below.',
        strengths: ['Instant high-level health overview even with dozens of sensors', 'Consistent square footprint beside the Alarm Hero'],
        tradeoffs: ['Shows one zone’s items at a time below the matrix'],
        Component: AttentionB
      },
      {
        id: 'C',
        name: 'Compact Alert Ticker',
        idea: 'Single-line green strip when clear, or high-density severity chips + quick-fix action bar when active.',
        strengths: ['Lowest possible vertical footprint on mobile'],
        tradeoffs: ['Chip wall is less structured than dedicated rows during big alerts'],
        Component: AttentionC
      }
    ]
  },
  {
    id: 'cameras',
    title: 'Cameras',
    job: 'Shows live WebRTC cameras, motion jump alerts, AI Person/Vehicle/Package/Animal detections, mute/fullscreen controls — with captions strictly below frames.',
    recommended: 'A',
    chosen: CHOSEN_SECURITY_CONCEPTS.cameras,
    why: 'Theater Stage + Filmstrip gives the active or motion-triggered camera full resolution while keeping every other camera one tap away underneath.',
    concepts: [
      {
        id: 'A',
        name: 'Theater Stage + Filmstrip',
        idea: 'Large 16:9 featured camera with clean caption bar below (status, AI chips, audio/fullscreen) plus horizontal clickable thumbnail strip.',
        strengths: ['Full-size inspection of live motion without clutter', 'Motion jump button flags activity on non-featured cameras'],
        tradeoffs: ['Only one camera streams at full size at a time'],
        Component: CamerasA
      },
      {
        id: 'B',
        name: 'Multi-Cam Surveillance Wall',
        idea: '2-column simultaneous camera grid (1-col on phone) with Exterior/Interior filter and 1-tap spotlight expand per camera.',
        strengths: ['Watch all perimeter angles simultaneously', 'Clean zone filter'],
        tradeoffs: ['Smaller frames per camera until spotlighted'],
        Component: CamerasB
      },
      {
        id: 'C',
        name: 'Motion-First Event Reel',
        idea: 'Split live camera viewport beside a vertical camera & latest-AI-event switcher rail.',
        strengths: ['Pairs live picture directly with each camera’s latest detection sentence and time ago'],
        tradeoffs: ['No thumbnail previews on inactive cameras'],
        Component: CamerasC
      }
    ]
  },
  {
    id: 'activity',
    title: 'Recent activity',
    job: 'Displays the last 24 h of security events (alarm changes, locks, entries, motion, hazards) from Home Assistant logbook.',
    recommended: 'B',
    chosen: CHOSEN_SECURITY_CONCEPTS.activity,
    why: '24-Hour Activity Pulse gives an immediate visual scan of when security events happened (e.g. midnight motion spikes) above a clean grouped feed.',
    concepts: [
      {
        id: 'A',
        name: 'Vertical Spine Timeline',
        idea: 'Editorial connected timeline with semantic icon dots, category filters (All / Alarm / Access / Motion), and Show all expand.',
        strengths: ['Easy to filter to alarm or access history only', 'Clear chronological story'],
        tradeoffs: ['No hourly visual overview of busy periods'],
        Component: ActivityA
      },
      {
        id: 'B',
        name: '24-Hour Activity Pulse + Feed',
        idea: '24 hourly severity-colored density bars above a Latest / Earlier grouped event list.',
        strengths: ['Unusual nighttime activity stands out immediately in the pulse bar', 'Great visual partner beside Cameras'],
        tradeoffs: ['No category filter pills'],
        Component: ActivityB
      },
      {
        id: 'C',
        name: 'Compact Audit Ledger',
        idea: 'Time-first monospace table with category icon, single-line sentence, and actor/area column.',
        strengths: ['Highest information density for power users', 'Fastest timestamp scanning'],
        tradeoffs: ['More utilitarian aesthetic'],
        Component: ActivityC
      }
    ]
  },
  {
    id: 'devices',
    title: 'Device groups',
    job: 'Organizes all locks (hold-to-unlock), garages, sirens, doors, windows, motion, and hazard sensors by type or by room/floor.',
    recommended: 'A',
    chosen: CHOSEN_SECURITY_CONCEPTS.devices,
    why: 'Adaptive Bento Cards preserve clean domain grouping with a 1-tap By type / By room switcher, inline Lock/Close actions, and problem-first sorting.',
    concepts: [
      {
        id: 'A',
        name: 'Adaptive Bento Cards',
        idea: 'Domain cards (Locks, Garages, Doors & windows, Motion, Hazards) with By type / By room toggle, count badges, and inline action buttons.',
        strengths: ['Scales cleanly from small apartments to 40+ sensors', 'Instant switch between device type and room view'],
        tradeoffs: ['Row lists feel more traditional than big visual tiles'],
        Component: DeviceGroupsA
      },
      {
        id: 'B',
        name: 'Interactive Tile Deck',
        idea: 'Area-tile-inspired visual device cards in a responsive grid with category filter pills (All / Locks / Openings / Motion / Hazards).',
        strengths: ['Matches the modern Area Tiles visual language', 'Problems pop immediately with soft state backgrounds'],
        tradeoffs: ['Flat grid loses room/floor grouping unless filtered'],
        Component: DeviceGroupsB
      },
      {
        id: 'C',
        name: 'Floor-by-Floor Security Accordion',
        idea: 'Expandable Ground Floor / First Floor / Exterior tree with Sealed or Open badges per floor and inline controls.',
        strengths: ['Mirrors physical house layout when doing a bedtime perimeter check', 'Collapsible floors save phone scroll'],
        tradeoffs: ['Requires expanding floors to see every device when folded'],
        Component: DeviceGroupsC
      }
    ]
  }
];
