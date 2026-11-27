/**
 * Security Studio sample homes (docs/pro-ui/SECURITY.md) and `applySecurityAction`, a stand-in
 * for Home Assistant so the mockups react. The model and its rules live in
 * `src/pro/lib/securityPage.ts` (shared with the live page); re-exported here under the studio's
 * names.
 */
import type { CameraTileModel, CoverTileModel, LockTileModel, MotionTileModel, OpeningTileModel, SafetyTileModel } from '../../../areas/tileTypes';
import { applyTileAction } from '../../../areas/studio/areaStates';
import { DRIVEWAY, GARAGE, GARDEN_NIGHT, LIVING_ROOM, PORCH } from './cameraArt';
import { ARM_MODES, needsCode, isGarage, isLock, isSiren, type GarageModel, type Placed, type SecurityAction, type SecurityCamera, type SecurityDevice, type SecurityEvent, type SecurityHome, type SirenModel, type Tone } from '../../../lib/securityPage';

export * from '../../../lib/securityPage';
export type StudioCamera = SecurityCamera;
export type StudioDevice = SecurityDevice;
export type StudioEvent = SecurityEvent;
export type StudioHome = SecurityHome;

const MIN = 60_000;
const PANEL = { entityId: 'alarm_control_panel.home', modes: ARM_MODES.map((m) => m.id), codeToArm: false, codeNumeric: true };

export const STUDIO_STATES = [
  { id: 'secure', label: 'Away · all secure' },
  { id: 'evening', label: 'Evening · things open' },
  { id: 'night', label: 'Night · motion outside' },
  { id: 'triggered', label: 'Alarm triggered' },
  { id: 'flat', label: 'Small flat' }
] as const;
export type StudioStateId = (typeof STUDIO_STATES)[number]['id'];

const times = (now: number, ...minsAgo: number[]) => minsAgo.map((m) => now - m * MIN).sort((a, b) => a - b);

function lock(now: number, p: Partial<LockTileModel> & Pick<LockTileModel, 'entityId' | 'name'>, area: string, minsAgo = 90): Placed<LockTileModel> {
  const state = p.state ?? 'locked';
  return { kind: 'lock', available: true, state, isOn: state === 'locked', battery: 80, changedBy: 'Auto-lock', supportsOpen: false, lastChanged: now - minsAgo * MIN, area, ...p };
}
function opening(now: number, p: Partial<OpeningTileModel> & Pick<OpeningTileModel, 'entityId' | 'name' | 'deviceClass'>, area: string, openMinsAgo: number | null): Placed<OpeningTileModel> {
  const isOn = openMinsAgo !== null;
  return { kind: 'opening', available: true, isOn, battery: 90, lastChanged: now - (openMinsAgo ?? 180) * MIN, spells: isOn ? [[now - openMinsAgo * MIN, null]] : [[now - 300 * MIN, now - 296 * MIN]], area, ...p };
}
function motion(now: number, p: Pick<MotionTileModel, 'entityId' | 'name'> & Partial<MotionTileModel>, area: string, lastMinsAgo: number, active = false): Placed<MotionTileModel> {
  return { kind: 'motion', deviceClass: 'motion', available: true, isOn: active, battery: 70, lastChanged: now - lastMinsAgo * MIN, events: times(now, lastMinsAgo, lastMinsAgo + 40, lastMinsAgo + 130), area, ...p };
}
function safety(now: number, p: Pick<SafetyTileModel, 'entityId' | 'name' | 'deviceClass'> & Partial<SafetyTileModel>, area: string): Placed<SafetyTileModel> {
  return { kind: 'safety', available: true, isOn: false, battery: 95, lastSeen: now - 2 * MIN, lastChanged: now - 60 * 24 * 9 * MIN, area, ...p };
}
function garage(now: number, p: Pick<CoverTileModel, 'entityId' | 'name'> & Partial<CoverTileModel>, area: string, openMinsAgo: number | null): Placed<GarageModel> {
  const open = openMinsAgo !== null;
  return { kind: 'cover', available: true, isOn: open, position: open ? 100 : 0, moving: null, lastChanged: now - (openMinsAgo ?? 300) * MIN, area, ...p, ...{ deviceClass: 'garage' as const } };
}
function siren(now: number, p: Pick<SirenModel, 'entityId' | 'name'> & Partial<SirenModel>, area: string): Placed<SirenModel> {
  return { kind: 'siren', available: true, isOn: false, lastChanged: now - 60 * 24 * 30 * MIN, battery: null, area, ...p };
}
function camera(now: number, p: Pick<CameraTileModel, 'entityId' | 'name' | 'picture'> & Partial<StudioCamera>, area: string, outdoor: boolean, motionMinsAgo: number | null): StudioCamera {
  return { kind: 'camera', available: true, isOn: true, live: true, lastChanged: null, lastMotion: motionMinsAgo === null ? null : now - motionMinsAgo * MIN, events: motionMinsAgo === null ? [] : times(now, motionMinsAgo, motionMinsAgo + 55, motionMinsAgo + 190), detection: null, area, outdoor, ...p };
}

/** The demo home (two floors, garden, garage) in each studio state; "flat" is a small one-floor home. */
export function studioHome(id: StudioStateId, now = Date.now()): StudioHome {
  if (id === 'flat') {
    return {
      alarm: { ...PANEL, state: 'disarmed', changedBy: 'Alex', changedAt: now - 35 * MIN, cause: null, siren: false, codeToDisarm: false },
      people: [{ name: 'Alex', home: true }],
      cameras: [camera(now, { entityId: 'camera.doorbell', name: 'Doorbell', picture: PORCH }, 'Entrance', true, 210)],
      devices: [
        lock(now, { entityId: 'lock.front_door', name: 'Front Door', changedBy: 'Alex' }, 'Entrance', 35),
        opening(now, { entityId: 'binary_sensor.balcony_door', name: 'Balcony Door', deviceClass: 'door' }, 'Living Room', null),
        motion(now, { entityId: 'binary_sensor.hall_motion', name: 'Hall Motion' }, 'Hall', 12),
        safety(now, { entityId: 'binary_sensor.kitchen_smoke', name: 'Kitchen Smoke', deviceClass: 'smoke' }, 'Kitchen')
      ],
      events: [
        { id: 'f1', at: now - 35 * MIN, kind: 'alarm', text: 'Alex turned the alarm off', tone: 'calm' },
        { id: 'f2', at: now - 36 * MIN, kind: 'lock', text: 'Front Door unlocked with the keypad', tone: 'calm' },
        { id: 'f3', at: now - 210 * MIN, kind: 'camera', text: 'Doorbell saw a person', tone: 'calm' }
      ]
    };
  }

  const evening = id === 'evening';
  const night = id === 'night';
  const triggered = id === 'triggered';
  const away = id === 'secure';

  const cameras: StudioCamera[] = [
    camera(now, { entityId: 'camera.front_door', name: 'Front Door', picture: PORCH, detection: away ? 'package' : null }, 'Entrance', true, away ? 48 : 140),
    camera(now, { entityId: 'camera.driveway', name: 'Driveway', picture: DRIVEWAY, detection: evening ? 'vehicle' : null }, 'Driveway', true, evening ? 1 : 260),
    camera(now, { entityId: 'camera.garden', name: 'Garden', picture: GARDEN_NIGHT, detection: night || triggered ? 'person' : null }, 'Garden', true, night || triggered ? 0.5 : 95),
    camera(now, { entityId: 'camera.living_room', name: 'Living Room', picture: LIVING_ROOM, available: !night, live: !night }, 'Living Room', false, night ? null : evening ? 3 : 400),
    camera(now, { entityId: 'camera.garage', name: 'Garage', picture: GARAGE }, 'Garage', false, 600)
  ];

  const devices: StudioDevice[] = [
    lock(now, { entityId: 'lock.front_door', name: 'Front Door', supportsOpen: true }, 'Entrance', away ? 70 : 200),
    lock(now, { entityId: 'lock.back_door', name: 'Back Door', state: evening ? 'unlocked' : triggered ? 'jammed' : 'locked', changedBy: evening ? 'Sam' : 'Auto-lock' }, 'Kitchen', evening ? 25 : 2),
    lock(now, { entityId: 'lock.garage_side', name: 'Garage Side Door', state: evening ? 'unlocked' : 'locked', battery: night ? 12 : 64, changedBy: 'Keypad' }, 'Garage', evening ? 50 : 300),
    opening(now, { entityId: 'binary_sensor.patio_door', name: 'Patio Door', deviceClass: 'door' }, 'Living Room', evening ? 18 : triggered ? 1 : null),
    garage(now, { entityId: 'cover.garage_door', name: 'Garage Door' }, 'Garage', evening ? 6 : null),
    opening(now, { entityId: 'binary_sensor.bedroom_window', name: 'Bedroom Window', deviceClass: 'window', available: !night }, 'Bedroom', null),
    opening(now, { entityId: 'binary_sensor.kitchen_window', name: 'Kitchen Window', deviceClass: 'window' }, 'Kitchen', null),
    motion(now, { entityId: 'binary_sensor.hallway_motion', name: 'Hallway Motion' }, 'Hallway', away ? 72 : 4, evening),
    motion(now, { entityId: 'binary_sensor.garden_motion', name: 'Garden Motion', battery: night ? 14 : 70 }, 'Garden', night || triggered ? 0.5 : 95, night || triggered),
    safety(now, { entityId: 'binary_sensor.hallway_smoke', name: 'Hallway Smoke', deviceClass: 'smoke' }, 'Hallway'),
    siren(now, { entityId: 'siren.hallway', name: 'Hallway Siren', isOn: triggered, lastChanged: triggered ? now - 1 * MIN : now - 60 * 24 * 30 * MIN }, 'Hallway'),
    siren(now, { entityId: 'siren.outdoor', name: 'Outdoor Siren', isOn: triggered, battery: 76, lastChanged: triggered ? now - 1 * MIN : now - 60 * 24 * 30 * MIN }, 'Garden'),
    safety(now, { entityId: 'binary_sensor.kitchen_leak', name: 'Under Sink', deviceClass: 'moisture', isOn: triggered, lastChanged: triggered ? now - 3 * MIN : now - 60 * 24 * 12 * MIN }, 'Kitchen')
  ];

  const alarm: StudioHome['alarm'] = away
    ? { ...PANEL, state: 'armed_away', changedBy: 'Sam', changedAt: now - 75 * MIN, cause: null, siren: false, codeToDisarm: true }
    : night
      ? { ...PANEL, state: 'armed_night', changedBy: 'Automation', changedAt: now - 140 * MIN, cause: null, siren: false, codeToDisarm: true }
      : triggered
        ? { ...PANEL, state: 'triggered', changedBy: null, changedAt: now - 1 * MIN, cause: 'Patio Door opened', siren: true, codeToDisarm: true }
        : { ...PANEL, state: 'disarmed', changedBy: 'Sam', changedAt: now - 30 * MIN, cause: null, siren: false, codeToDisarm: true };

  const people = away
    ? [{ name: 'Sam', home: false }, { name: 'Maya', home: false }]
    : triggered
      ? [{ name: 'Sam', home: false }, { name: 'Maya', home: false }]
      : [{ name: 'Sam', home: true }, { name: 'Maya', home: true }];

  const events: StudioEvent[] = triggered
    ? [
        { id: 't1', at: now - 1 * MIN, kind: 'alarm', text: 'Alarm triggered by Patio Door', tone: 'danger' },
        { id: 't2', at: now - 1.2 * MIN, kind: 'opening', text: 'Patio Door opened', tone: 'danger' },
        { id: 't3', at: now - 2 * MIN, kind: 'lock', text: 'Back Door jammed while locking', tone: 'danger' },
        { id: 't4', at: now - 3 * MIN, kind: 'safety', text: 'Water under the kitchen sink', tone: 'danger' },
        { id: 't5', at: now - 4 * MIN, kind: 'camera', text: 'Garden camera saw a person', tone: 'warning' },
        { id: 't6', at: now - 80 * MIN, kind: 'alarm', text: 'Sam set the alarm to Away', tone: 'calm' }
      ]
    : [
        ...(evening
          ? [
              { id: 'e1', at: now - 1 * MIN, kind: 'camera' as const, text: 'Driveway camera saw a car', tone: 'calm' as const },
              { id: 'e2', at: now - 6 * MIN, kind: 'opening' as const, text: 'Garage Door opened', tone: 'warning' as const },
              { id: 'e3', at: now - 18 * MIN, kind: 'opening' as const, text: 'Patio Door opened', tone: 'warning' as const },
              { id: 'e4', at: now - 25 * MIN, kind: 'lock' as const, text: 'Sam unlocked the Back Door', tone: 'calm' as const },
              { id: 'e5', at: now - 30 * MIN, kind: 'alarm' as const, text: 'Sam turned the alarm off', tone: 'calm' as const },
              { id: 'e6', at: now - 31 * MIN, kind: 'person' as const, text: 'Sam arrived home', tone: 'calm' as const }
            ]
          : []),
        ...(night
          ? [
              { id: 'n1', at: now - 0.5 * MIN, kind: 'camera' as const, text: 'Garden camera saw a person', tone: 'warning' as const },
              { id: 'n2', at: now - 50 * MIN, kind: 'camera' as const, text: 'Living Room camera went offline', tone: 'warning' as const },
              { id: 'n3', at: now - 140 * MIN, kind: 'alarm' as const, text: 'Bedtime automation set the alarm to Night', tone: 'calm' as const }
            ]
          : []),
        ...(away
          ? [
              { id: 'a1', at: now - 48 * MIN, kind: 'camera' as const, text: 'Front Door camera saw a package', tone: 'calm' as const },
              { id: 'a2', at: now - 70 * MIN, kind: 'lock' as const, text: 'Front Door locked itself', tone: 'calm' as const },
              { id: 'a3', at: now - 75 * MIN, kind: 'alarm' as const, text: 'Sam set the alarm to Away', tone: 'calm' as const },
              { id: 'a4', at: now - 76 * MIN, kind: 'person' as const, text: 'Everyone left', tone: 'calm' as const }
            ]
          : []),
        { id: 'x1', at: now - 9 * 60 * MIN, kind: 'lock', text: 'Front Door unlocked with the keypad', tone: 'calm' },
        { id: 'x2', at: now - 11 * 60 * MIN, kind: 'alarm', text: 'Maya turned the alarm off', tone: 'calm' }
      ];

  return { alarm, people, cameras, devices, events };
}


/** The studio's sample alarm code. */
export const STUDIO_CODE = '1234';

/** Apply an action as Home Assistant would, and log it. */
export function applySecurityAction(home: StudioHome, a: SecurityAction, now = Date.now()): StudioHome {
  const log = (text: string, kind: StudioEvent['kind'], tone: Tone = 'calm'): StudioEvent[] => [{ id: `u${now}-${home.events.length}`, at: now, kind, text, tone }, ...home.events];
  switch (a.type) {
    case 'arm':
      if (needsCode(home, a.mode) && a.code !== STUDIO_CODE) return { ...home, events: log('Wrong code: the alarm did not change', 'alarm', 'warning') };
      return {
        ...home,
        alarm: { ...home.alarm, state: a.mode, changedBy: 'You', changedAt: now, cause: null, siren: false },
        events: log(a.mode === 'disarmed' ? 'You turned the alarm off' : `You set the alarm to ${ARM_MODES.find((m) => m.id === a.mode)?.label}`, 'alarm')
      };
    case 'silence':
      return { ...home, alarm: { ...home.alarm, siren: false }, devices: home.devices.map((d) => (isSiren(d) && d.isOn ? { ...d, isOn: false, lastChanged: now } : d)), events: log('You silenced the siren', 'alarm') };
    case 'lockAll': {
      const devices = home.devices.map((d) => (isLock(d) && d.available && (d.state === 'unlocked' || d.state === 'open') ? { ...d, state: 'locked' as const, isOn: true, changedBy: 'You', lastChanged: now } : d));
      return { ...home, devices, events: log('You locked every door', 'lock') };
    }
    case 'device': {
      const cam = home.cameras.find((c) => c.entityId === a.id);
      if (cam) return { ...home, cameras: home.cameras.map((c) => (c === cam ? { ...c, ...(applyTileAction(c, a.action) as CameraTileModel) } : c)) };
      const dev = home.devices.find((d) => d.entityId === a.id);
      if (!dev) return home;
      if (isSiren(dev)) {
        if (a.action.type !== 'toggle') return home;
        const on = !dev.isOn;
        const devices = home.devices.map((d) => (d === dev ? { ...dev, isOn: on, lastChanged: now } : d));
        const anyOn = devices.some((d) => isSiren(d) && d.isOn);
        return { ...home, devices, alarm: { ...home.alarm, siren: anyOn && home.alarm.siren }, events: log(on ? `You tested the ${dev.name}` : `You silenced the ${dev.name}`, 'alarm', on ? 'warning' : 'calm') };
      }
      if (isGarage(dev)) {
        const next = { ...dev, ...(applyTileAction(dev, a.action) as CoverTileModel), deviceClass: 'garage' as const };
        return { ...home, devices: home.devices.map((d) => (d === dev ? next : d)), events: next.isOn !== dev.isOn ? log(`You ${next.isOn ? 'opened' : 'closed'} the ${dev.name}`, 'opening') : home.events };
      }
      const next = { ...dev, ...applyTileAction(dev, a.action) } as StudioDevice;
      const changed = isLock(next) && isLock(dev) && next.state !== dev.state;
      return { ...home, devices: home.devices.map((d) => (d === dev ? next : d)), events: changed && isLock(next) ? log(`You ${next.state === 'locked' ? 'locked' : 'unlocked'} the ${next.name}`, 'lock') : home.events };
    }
  }
}

