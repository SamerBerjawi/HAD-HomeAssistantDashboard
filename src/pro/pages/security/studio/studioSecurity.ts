/**
 * Pure fixtures, metadata, phone-tab builder, and interactive stand-in action reducer for the
 * Security Studio (docs/pro-ui/SECURITY.md). Dev-only: never bundled into production, zero HA calls.
 */
import type { IconSvgElement } from '@hugeicons/react';
import {
  Activity01Icon,
  Alert02Icon,
  Camera01Icon,
  Layers01Icon,
  Shield01Icon
} from '@hugeicons/core-free-icons';
import type { AlarmModeId, Tone } from '../../../lib/securityLogic';

export type SecuritySectionId = 'alarm' | 'attention' | 'cameras' | 'activity' | 'devices';
export type SecurityPhoneTabId = 'attention' | 'cameras' | 'activity' | 'devices';
export type StudioSecurityStateId = 'all_clear' | 'attention' | 'night_motion' | 'triggered' | 'states';

export interface SecuritySectionMeta {
  id: SecuritySectionId;
  title: string;
  shortTitle: string;
  icon: IconSvgElement;
  phoneTab: SecurityPhoneTabId | null;
  summary: string;
}

export const SECURITY_SECTIONS: readonly SecuritySectionMeta[] = [
  { id: 'alarm', title: 'Alarm hero', shortTitle: 'Alarm', icon: Shield01Icon, phoneTab: null, summary: 'Alarm state, arm/disarm modes, panel switcher, PIN & countdowns' },
  { id: 'attention', title: 'Needs attention', shortTitle: 'Attention', icon: Alert02Icon, phoneTab: 'attention', summary: 'Active hazards, open entries, unlocked locks, battery & offline alerts' },
  { id: 'cameras', title: 'Cameras', shortTitle: 'Cameras', icon: Camera01Icon, phoneTab: 'cameras', summary: 'Live WebRTC camera stage, surveillance grid, motion & AI badges' },
  { id: 'activity', title: 'Recent activity', shortTitle: 'Activity', icon: Activity01Icon, phoneTab: 'activity', summary: '24 h security logbook timeline and hourly activity pulse' },
  { id: 'devices', title: 'Device groups', shortTitle: 'Devices', icon: Layers01Icon, phoneTab: 'devices', summary: 'Locks, garages, doors, windows, motion & hazard sensors by type or room' }
];

export const STUDIO_SECURITY_STATES: readonly { id: StudioSecurityStateId; label: string; note: string }[] = [
  { id: 'all_clear', label: 'Armed & All Clear', note: 'Armed away, every lock sealed, 4 live cameras, quiet logbook' },
  { id: 'attention', label: 'Evening Attention', note: 'Disarmed, 1 lock unlocked, patio & garage open, driveway motion, low battery' },
  { id: 'night_motion', label: 'Night + Motion', note: 'Armed night, garden person motion, 1 window sensor offline' },
  { id: 'triggered', label: 'Alarm Triggered', note: 'Emergency: siren sounding, back door forced, kitchen leak detected' },
  { id: 'states', label: 'Edge states', note: 'Loading skeleton, Empty no-devices card, and Service error alert' }
];

export interface StudioAlarmPanel {
  id: string;
  name: string;
  state: AlarmModeId | 'arming' | 'pending' | 'triggered';
  changedBy: string;
  changedAgo: string;
  needsCode: boolean;
  supportedModes: readonly AlarmModeId[];
  triggerSource?: string;
}

export interface StudioPerson {
  id: string;
  name: string;
  initials: string;
  home: boolean;
  location: string;
}

export type StudioDeviceKind = 'lock' | 'garage' | 'siren' | 'door' | 'window' | 'motion' | 'smoke' | 'leak';

export interface StudioSecurityDevice {
  id: string;
  name: string;
  kind: StudioDeviceKind;
  area: string;
  floor: string;
  state: string;
  stateLabel: string;
  tone: Tone;
  problem: boolean;
  batteryPct?: number;
  offline?: boolean;
  lastChangedAgo: string;
}

export type StudioAiKind = 'person' | 'vehicle' | 'package' | 'animal';
export type StudioCameraStatus = 'live' | 'motion' | 'snapshot' | 'offline';
export type StudioCameraScene = 'driveway' | 'front_door' | 'garden' | 'living';

export interface StudioCamera {
  id: string;
  name: string;
  area: string;
  zone: 'Exterior' | 'Interior';
  scene: StudioCameraScene;
  status: StudioCameraStatus;
  motion: boolean;
  muted: boolean;
  aiDetections: readonly StudioAiKind[];
  lastEvent: string;
  lastEventAgo: string;
}

export type StudioEventCategory = 'alarm' | 'access' | 'motion' | 'hazard';

export interface StudioActivityEvent {
  id: string;
  time: string;
  ago: string;
  sentence: string;
  area: string;
  actor?: string;
  category: StudioEventCategory;
  tone: Tone;
}

export interface StudioSecuritySnapshot {
  stateId: StudioSecurityStateId;
  activeAlarmId: string;
  alarms: StudioAlarmPanel[];
  people: StudioPerson[];
  devices: StudioSecurityDevice[];
  cameras: StudioCamera[];
  featuredCameraId: string;
  events: StudioActivityEvent[];
  hourlyPulse: readonly { hour: string; count: number; maxTone: Tone }[];
  lastActionFeedback: string | null;
}

export type StudioSecurityAction =
  | { type: 'arm'; mode: AlarmModeId; force?: boolean }
  | { type: 'selectAlarm'; alarmId: string }
  | { type: 'toggleLock'; deviceId: string }
  | { type: 'lockAll' }
  | { type: 'toggleGarage'; deviceId: string }
  | { type: 'silenceSirens' }
  | { type: 'selectCamera'; cameraId: string }
  | { type: 'toggleCameraMute'; cameraId: string }
  | { type: 'clearFeedback' };

function baseHourlyPulse(stateId: StudioSecurityStateId): { hour: string; count: number; maxTone: Tone }[] {
  return Array.from({ length: 24 }, (_, h) => {
    const hour = `${String(h).padStart(2, '0')}:00`;
    if (stateId === 'triggered' && h === 22) return { hour, count: 8, maxTone: 'danger' };
    if (stateId === 'night_motion' && (h === 22 || h === 23)) return { hour, count: 4, maxTone: 'warning' };
    if (h === 8 || h === 18) return { hour, count: 5, maxTone: 'success' };
    if (h === 12 || h === 19 || h === 21) return { hour, count: stateId === 'attention' ? 4 : 2, maxTone: stateId === 'attention' && h === 21 ? 'warning' : 'success' };
    if (h >= 1 && h <= 5) return { hour, count: 0, maxTone: 'default' };
    return { hour, count: h % 3 === 0 ? 1 : 0, maxTone: 'default' };
  });
}

function makeDevices(stateId: StudioSecurityStateId): StudioSecurityDevice[] {
  const isAtt = stateId === 'attention';
  const isNight = stateId === 'night_motion';
  const isTrig = stateId === 'triggered';

  return [
    {
      id: 'lock.front_door',
      name: 'Front door lock',
      kind: 'lock',
      area: 'Entryway',
      floor: 'Ground floor',
      state: isAtt ? 'unlocked' : 'locked',
      stateLabel: isAtt ? 'Unlocked' : 'Locked',
      tone: isAtt ? 'warning' : 'success',
      problem: isAtt,
      batteryPct: 86,
      lastChangedAgo: isAtt ? '6m ago' : '2h ago'
    },
    {
      id: 'lock.back_door',
      name: 'Back patio lock',
      kind: 'lock',
      area: 'Kitchen',
      floor: 'Ground floor',
      state: isTrig ? 'jammed' : 'locked',
      stateLabel: isTrig ? 'Jammed' : 'Locked',
      tone: isTrig ? 'danger' : 'success',
      problem: isTrig,
      batteryPct: 74,
      lastChangedAgo: isTrig ? '1m ago' : '4h ago'
    },
    {
      id: 'lock.side_gate',
      name: 'Side gate lock',
      kind: 'lock',
      area: 'Garden',
      floor: 'Exterior',
      state: isAtt ? 'unlocked' : 'locked',
      stateLabel: isAtt ? 'Unlocked' : 'Locked',
      tone: isAtt ? 'warning' : 'success',
      problem: isAtt,
      batteryPct: 62,
      lastChangedAgo: isAtt ? '19m ago' : 'Yesterday'
    },
    {
      id: 'cover.garage_door',
      name: 'Main garage door',
      kind: 'garage',
      area: 'Garage',
      floor: 'Ground floor',
      state: isAtt ? 'open' : 'closed',
      stateLabel: isAtt ? 'Open' : 'Closed',
      tone: isAtt ? 'warning' : 'success',
      problem: isAtt,
      lastChangedAgo: isAtt ? '11m ago' : '5h ago'
    },
    {
      id: 'siren.entry_hall',
      name: 'Entry hall siren',
      kind: 'siren',
      area: 'Entryway',
      floor: 'Ground floor',
      state: isTrig ? 'on' : 'off',
      stateLabel: isTrig ? 'Sounding' : 'Standby',
      tone: isTrig ? 'danger' : 'success',
      problem: isTrig,
      lastChangedAgo: isTrig ? '40s ago' : '30d ago'
    },
    {
      id: 'binary_sensor.front_door',
      name: 'Front door contact',
      kind: 'door',
      area: 'Entryway',
      floor: 'Ground floor',
      state: 'off',
      stateLabel: 'Closed',
      tone: 'success',
      problem: false,
      batteryPct: 91,
      lastChangedAgo: '24m ago'
    },
    {
      id: 'binary_sensor.patio_door',
      name: 'Patio sliding door',
      kind: 'door',
      area: 'Kitchen',
      floor: 'Ground floor',
      state: isAtt || isTrig ? 'on' : 'off',
      stateLabel: isTrig ? 'Forced open' : isAtt ? 'Open' : 'Closed',
      tone: isTrig ? 'danger' : isAtt ? 'warning' : 'success',
      problem: isAtt || isTrig,
      batteryPct: 80,
      lastChangedAgo: isTrig ? '1m ago' : isAtt ? '8m ago' : '3h ago'
    },
    {
      id: 'binary_sensor.bedroom_window',
      name: 'Master bedroom window',
      kind: 'window',
      area: 'Master bedroom',
      floor: 'First floor',
      state: isNight ? 'unavailable' : 'off',
      stateLabel: isNight ? 'Offline' : 'Closed',
      tone: isNight ? 'danger' : 'success',
      problem: isNight,
      offline: isNight,
      batteryPct: isAtt ? 14 : 68,
      lastChangedAgo: isNight ? '3h ago' : '1d ago'
    },
    {
      id: 'binary_sensor.kitchen_window',
      name: 'Kitchen window',
      kind: 'window',
      area: 'Kitchen',
      floor: 'Ground floor',
      state: 'off',
      stateLabel: 'Closed',
      tone: 'success',
      problem: false,
      batteryPct: 84,
      lastChangedAgo: '2d ago'
    },
    {
      id: 'binary_sensor.hall_motion',
      name: 'Hallway motion',
      kind: 'motion',
      area: 'Entryway',
      floor: 'Ground floor',
      state: isTrig ? 'on' : 'off',
      stateLabel: isTrig ? 'Motion' : 'Clear',
      tone: isTrig ? 'warning' : 'success',
      problem: isTrig,
      batteryPct: 77,
      lastChangedAgo: isTrig ? '30s ago' : '42m ago'
    },
    {
      id: 'binary_sensor.garden_motion',
      name: 'Garden perimeter motion',
      kind: 'motion',
      area: 'Garden',
      floor: 'Exterior',
      state: isNight || isAtt ? 'on' : 'off',
      stateLabel: isNight || isAtt ? 'Motion' : 'Clear',
      tone: isNight || isAtt ? 'warning' : 'success',
      problem: isNight || isAtt,
      batteryPct: 58,
      lastChangedAgo: isNight || isAtt ? '1m ago' : '2h ago'
    },
    {
      id: 'binary_sensor.kitchen_smoke',
      name: 'Kitchen smoke alarm',
      kind: 'smoke',
      area: 'Kitchen',
      floor: 'Ground floor',
      state: 'off',
      stateLabel: 'Clear',
      tone: 'success',
      problem: false,
      batteryPct: 95,
      lastChangedAgo: '14d ago'
    },
    {
      id: 'binary_sensor.sink_leak',
      name: 'Under-sink leak sensor',
      kind: 'leak',
      area: 'Kitchen',
      floor: 'Ground floor',
      state: isTrig ? 'on' : 'off',
      stateLabel: isTrig ? 'Leak detected' : 'Dry',
      tone: isTrig ? 'danger' : 'success',
      problem: isTrig,
      batteryPct: 89,
      lastChangedAgo: isTrig ? '2m ago' : '20d ago'
    }
  ];
}

function makeCameras(stateId: StudioSecurityStateId): StudioCamera[] {
  const isAtt = stateId === 'attention';
  const isNight = stateId === 'night_motion';
  const isTrig = stateId === 'triggered';

  return [
    {
      id: 'camera.driveway',
      name: 'Driveway',
      area: 'Driveway',
      zone: 'Exterior',
      scene: 'driveway',
      status: isAtt ? 'motion' : 'live',
      motion: isAtt,
      muted: true,
      aiDetections: isAtt ? ['vehicle', 'person'] : [],
      lastEvent: isAtt ? 'Vehicle & person approaching' : 'Clear perimeter',
      lastEventAgo: isAtt ? 'Just now' : '38m ago'
    },
    {
      id: 'camera.front_door',
      name: 'Front Porch',
      area: 'Entryway',
      zone: 'Exterior',
      scene: 'front_door',
      status: 'live',
      motion: false,
      muted: true,
      aiDetections: stateId === 'all_clear' ? ['package'] : [],
      lastEvent: stateId === 'all_clear' ? 'Package resting by door' : 'Doorbell idle',
      lastEventAgo: stateId === 'all_clear' ? '18m ago' : '1h ago'
    },
    {
      id: 'camera.garden',
      name: 'Back Garden',
      area: 'Garden',
      zone: 'Exterior',
      scene: 'garden',
      status: isNight || isTrig ? 'motion' : 'live',
      motion: isNight || isTrig,
      muted: true,
      aiDetections: isTrig ? ['person'] : isNight ? ['person', 'animal'] : [],
      lastEvent: isTrig ? 'Person near patio door!' : isNight ? 'Movement near fence' : 'Quiet yard',
      lastEventAgo: isNight || isTrig ? '15s ago' : '2h ago'
    },
    {
      id: 'camera.living',
      name: 'Living Room',
      area: 'Living room',
      zone: 'Interior',
      scene: 'living',
      status: isNight ? 'offline' : 'snapshot',
      motion: false,
      muted: true,
      aiDetections: [],
      lastEvent: isNight ? 'Camera offline' : 'Privacy snapshot only',
      lastEventAgo: isNight ? '2h ago' : '12m ago'
    }
  ];
}

function makeEvents(stateId: StudioSecurityStateId): StudioActivityEvent[] {
  const base: StudioActivityEvent[] = [
    { id: 'e4', time: '19:40', ago: '2h ago', sentence: 'Front door locked by Samer', area: 'Entryway', actor: 'Samer', category: 'access', tone: 'success' },
    { id: 'e5', time: '18:55', ago: '3h ago', sentence: 'Package detected at Front Porch', area: 'Entryway', category: 'motion', tone: 'warning' },
    { id: 'e6', time: '18:12', ago: '4h ago', sentence: 'Main garage door closed', area: 'Garage', actor: 'Maya', category: 'access', tone: 'success' },
    { id: 'e7', time: '14:05', ago: '8h ago', sentence: 'Home alarm armed away by Samer', area: 'Entryway', actor: 'Samer', category: 'alarm', tone: 'success' },
    { id: 'e8', time: '08:18', ago: '14h ago', sentence: 'Home alarm disarmed by Maya', area: 'Entryway', actor: 'Maya', category: 'alarm', tone: 'default' },
    { id: 'e9', time: '07:50', ago: '14h ago', sentence: 'Patio sliding door closed', area: 'Kitchen', category: 'access', tone: 'success' }
  ];

  if (stateId === 'triggered') {
    return [
      { id: 't1', time: '22:13', ago: '40s ago', sentence: 'Entry hall siren triggered — Patio sliding door forced open', area: 'Kitchen', category: 'hazard', tone: 'danger' },
      { id: 't2', time: '22:12', ago: '1m ago', sentence: 'Person detected on Back Garden camera', area: 'Garden', category: 'motion', tone: 'warning' },
      { id: 't3', time: '22:11', ago: '2m ago', sentence: 'Under-sink leak sensor detected water', area: 'Kitchen', category: 'hazard', tone: 'danger' },
      ...base
    ];
  }
  if (stateId === 'attention') {
    return [
      { id: 'a1', time: '22:08', ago: 'Just now', sentence: 'Vehicle & person detected on Driveway camera', area: 'Driveway', category: 'motion', tone: 'warning' },
      { id: 'a2', time: '22:02', ago: '6m ago', sentence: 'Front door unlocked by Samer', area: 'Entryway', actor: 'Samer', category: 'access', tone: 'warning' },
      { id: 'a3', time: '21:57', ago: '11m ago', sentence: 'Main garage door opened', area: 'Garage', actor: 'Samer', category: 'access', tone: 'warning' },
      ...base
    ];
  }
  if (stateId === 'night_motion') {
    return [
      { id: 'n1', time: '22:12', ago: '15s ago', sentence: 'Person detected on Back Garden camera', area: 'Garden', category: 'motion', tone: 'warning' },
      { id: 'n2', time: '21:45', ago: '28m ago', sentence: 'Home alarm armed night by Maya', area: 'Entryway', actor: 'Maya', category: 'alarm', tone: 'success' },
      { id: 'n3', time: '19:10', ago: '3h ago', sentence: 'Master bedroom window went offline', area: 'Master bedroom', category: 'hazard', tone: 'danger' },
      ...base
    ];
  }
  return [
    { id: 'c1', time: '20:10', ago: '2h ago', sentence: 'Home alarm armed away by Samer', area: 'Entryway', actor: 'Samer', category: 'alarm', tone: 'success' },
    { id: 'c2', time: '20:09', ago: '2h ago', sentence: 'All 3 exterior locks verified locked', area: 'Entryway', category: 'access', tone: 'success' },
    ...base
  ];
}

export function buildStudioSecuritySnapshot(stateId: StudioSecurityStateId): StudioSecuritySnapshot {
  const alarmState: StudioAlarmPanel['state'] =
    stateId === 'triggered'
      ? 'triggered'
      : stateId === 'night_motion'
        ? 'armed_night'
        : stateId === 'attention'
          ? 'disarmed'
          : 'armed_away';

  const alarms: StudioAlarmPanel[] = [
    {
      id: 'alarm_control_panel.home_alarm',
      name: 'Aqara Home Alarm',
      state: alarmState,
      changedBy: stateId === 'night_motion' ? 'Maya' : 'Samer',
      changedAgo: stateId === 'triggered' ? '40s ago' : stateId === 'attention' ? '14m ago' : '2h ago',
      needsCode: true,
      supportedModes: ['disarmed', 'armed_home', 'armed_away', 'armed_night'],
      triggerSource: stateId === 'triggered' ? 'Patio sliding door' : undefined
    },
    {
      id: 'alarm_control_panel.garage_zone',
      name: 'Garage Outbuilding',
      state: stateId === 'attention' ? 'disarmed' : 'armed_away',
      changedBy: 'Samer',
      changedAgo: '5h ago',
      needsCode: false,
      supportedModes: ['disarmed', 'armed_away', 'armed_night']
    }
  ];

  const cameras = makeCameras(stateId);
  const motionCam = cameras.find((c) => c.motion) ?? cameras[0];

  return {
    stateId,
    activeAlarmId: alarms[0].id,
    alarms,
    people: [
      { id: 'person.samer', name: 'Samer', initials: 'SB', home: stateId !== 'all_clear', location: stateId === 'all_clear' ? 'Away' : 'Home' },
      { id: 'person.maya', name: 'Maya', initials: 'MB', home: stateId === 'night_motion' || stateId === 'attention', location: stateId === 'night_motion' || stateId === 'attention' ? 'Home' : 'Work' }
    ],
    devices: makeDevices(stateId),
    cameras,
    featuredCameraId: motionCam.id,
    events: makeEvents(stateId),
    hourlyPulse: baseHourlyPulse(stateId),
    lastActionFeedback: null
  };
}

/** Pure stand-in service reducer: simulates HA security actions cleanly inside Studio state. */
export function applySecurityAction(
  snap: StudioSecuritySnapshot,
  action: StudioSecurityAction
): StudioSecuritySnapshot {
  if (action.type === 'clearFeedback') {
    return { ...snap, lastActionFeedback: null };
  }
  if (action.type === 'selectAlarm') {
    return { ...snap, activeAlarmId: action.alarmId, lastActionFeedback: null };
  }
  if (action.type === 'selectCamera') {
    return { ...snap, featuredCameraId: action.cameraId };
  }
  if (action.type === 'toggleCameraMute') {
    return {
      ...snap,
      cameras: snap.cameras.map((c) => (c.id === action.cameraId ? { ...c, muted: !c.muted } : c))
    };
  }
  if (action.type === 'arm') {
    const openOrUnlocked = snap.devices.filter(
      (d) =>
        (d.kind === 'door' || d.kind === 'window' || d.kind === 'garage') && d.state === 'open' ||
        (d.kind === 'door' || d.kind === 'window') && d.state === 'on' ||
        (d.kind === 'lock' && d.state === 'unlocked')
    );
    const needsWarn =
      !action.force &&
      (action.mode === 'armed_away' || action.mode === 'armed_night') &&
      openOrUnlocked.length > 0;
    if (needsWarn) {
      return {
        ...snap,
        lastActionFeedback: `Perimeter check: ${openOrUnlocked.length} entry open/unlocked — tap again or seal perimeter first.`
      };
    }
    const nowTime = '22:15';
    const nextAlarms = snap.alarms.map((a) =>
      a.id === snap.activeAlarmId
        ? { ...a, state: action.mode, changedBy: 'You (Studio)', changedAgo: 'Just now', triggerSource: undefined }
        : a
    );
    const nextDevices =
      action.mode === 'disarmed'
        ? snap.devices.map((d) =>
            d.kind === 'siren' ? { ...d, state: 'off', stateLabel: 'Standby', tone: 'success' as Tone, problem: false } : d
          )
        : snap.devices;
    const modeName = action.mode === 'disarmed' ? 'disarmed' : action.mode.replace('_', ' ');
    return {
      ...snap,
      alarms: nextAlarms,
      devices: nextDevices,
      events: [
        {
          id: `evt-${Date.now()}`,
          time: nowTime,
          ago: 'Just now',
          sentence: `Alarm set to ${modeName} (Studio mock)`,
          area: 'Entryway',
          actor: 'You',
          category: 'alarm',
          tone: action.mode === 'disarmed' ? 'default' : 'success'
        },
        ...snap.events
      ],
      lastActionFeedback: `Simulated: Alarm ${modeName}.`
    };
  }
  if (action.type === 'toggleLock') {
    const target = snap.devices.find((d) => d.id === action.deviceId);
    if (!target || target.kind !== 'lock') return snap;
    const locking = target.state !== 'locked';
    return {
      ...snap,
      devices: snap.devices.map((d) =>
        d.id === action.deviceId
          ? {
              ...d,
              state: locking ? 'locked' : 'unlocked',
              stateLabel: locking ? 'Locked' : 'Unlocked',
              tone: locking ? 'success' : 'warning',
              problem: !locking,
              lastChangedAgo: 'Just now'
            }
          : d
      ),
      events: [
        {
          id: `evt-${Date.now()}`,
          time: '22:15',
          ago: 'Just now',
          sentence: `${target.name} ${locking ? 'locked' : 'unlocked'} (Studio mock)`,
          area: target.area,
          actor: 'You',
          category: 'access',
          tone: locking ? 'success' : 'warning'
        },
        ...snap.events
      ],
      lastActionFeedback: `Simulated: ${target.name} ${locking ? 'locked' : 'unlocked'}.`
    };
  }
  if (action.type === 'lockAll') {
    let lockedCount = 0;
    const nextDevices = snap.devices.map((d) => {
      if (d.kind === 'lock' && d.state !== 'locked') {
        lockedCount++;
        return { ...d, state: 'locked', stateLabel: 'Locked', tone: 'success' as Tone, problem: false, lastChangedAgo: 'Just now' };
      }
      return d;
    });
    if (lockedCount === 0) return snap;
    return {
      ...snap,
      devices: nextDevices,
      events: [
        {
          id: `evt-${Date.now()}`,
          time: '22:15',
          ago: 'Just now',
          sentence: `Locked ${lockedCount} exterior lock${lockedCount > 1 ? 's' : ''} (Studio mock)`,
          area: 'All entries',
          actor: 'You',
          category: 'access',
          tone: 'success'
        },
        ...snap.events
      ],
      lastActionFeedback: `Simulated: Locked ${lockedCount} lock${lockedCount > 1 ? 's' : ''}.`
    };
  }
  if (action.type === 'toggleGarage') {
    const target = snap.devices.find((d) => d.id === action.deviceId);
    if (!target || target.kind !== 'garage') return snap;
    const closing = target.state !== 'closed';
    return {
      ...snap,
      devices: snap.devices.map((d) =>
        d.id === action.deviceId
          ? {
              ...d,
              state: closing ? 'closed' : 'open',
              stateLabel: closing ? 'Closed' : 'Open',
              tone: closing ? 'success' : 'warning',
              problem: !closing,
              lastChangedAgo: 'Just now'
            }
          : d
      ),
      lastActionFeedback: `Simulated: ${target.name} ${closing ? 'closed' : 'opened'}.`
    };
  }
  if (action.type === 'silenceSirens') {
    return {
      ...snap,
      devices: snap.devices.map((d) =>
        d.kind === 'siren'
          ? { ...d, state: 'off', stateLabel: 'Standby', tone: 'success' as Tone, problem: false, lastChangedAgo: 'Just now' }
          : d
      ),
      lastActionFeedback: 'Simulated: Sirens silenced.'
    };
  }
  return snap;
}

export interface SecurityPhoneTabDef {
  id: SecurityPhoneTabId;
  title: string;
  icon: IconSvgElement;
  badge?: string;
  badgeTone?: Tone;
}

export function buildSecurityPhoneTabs(snap: StudioSecuritySnapshot): SecurityPhoneTabDef[] {
  const issues = snap.devices.filter(
    (d) => d.problem || (typeof d.batteryPct === 'number' && d.batteryPct <= 20)
  );
  const dangerCount = issues.filter((d) => d.problem && d.tone === 'danger').length;
  const motionCams = snap.cameras.filter((c) => c.motion).length;
  const tabs: SecurityPhoneTabDef[] = [
    {
      id: 'attention',
      title: 'Alerts',
      icon: Alert02Icon,
      badge: issues.length > 0 ? String(issues.length) : undefined,
      badgeTone: dangerCount > 0 ? 'danger' : issues.length > 0 ? 'warning' : 'success'
    },
    ...(snap.cameras.length > 0
      ? [
          {
            id: 'cameras' as const,
            title: 'Cams',
            icon: Camera01Icon,
            badge: motionCams > 0 ? String(motionCams) : undefined,
            badgeTone: motionCams > 0 ? ('warning' as Tone) : undefined
          }
        ]
      : []),
    {
      id: 'activity',
      title: 'Log',
      icon: Activity01Icon
    },
    ...(snap.devices.length > 0
      ? [
          {
            id: 'devices' as const,
            title: 'Devices',
            icon: Layers01Icon
          }
        ]
      : [])
  ];
  return tabs;
}
