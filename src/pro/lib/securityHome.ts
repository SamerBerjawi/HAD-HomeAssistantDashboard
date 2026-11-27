/**
 * Home Assistant → the Security page's model (`securityPage.ts`). Devices and cameras go through the
 * Area page's tile mappers (`areas/ha/haTileModels.ts`), so the page draws them with the same
 * tiles as the room pages. Pure: the hook (`useSecurityHome`) passes the entities, the batteries it
 * already resolved, the day's logbook events and the picture loader.
 */
import type { ResolvedEntity } from '@/types';
import { cameraModel, coverModel, lockModel, motionModel, openingModel, safetyModel, type MapContext } from '../areas/ha/haTileModels';
import { alarmCodeIsNumeric, alarmModes, alarmNeedsCode, type ActivityEvent } from './securityLogic';
import { detectCameraAiAlerts, resolveAlarmTriggerDiagnostic } from './securityCameras';
import { ARM_MODES, type AlarmState, type ArmMode, type Detection, type GarageModel, type SecurityCamera, type SecurityDevice, type SecurityEvent, type SecurityHome, type SirenModel, type Tone } from './securityPage';

export interface SecurityHomeInput {
  now: number;
  /** The panel the user picked (or the first one); none when HA has no alarm panel. */
  alarm: ResolvedEntity | undefined;
  locks: readonly ResolvedEntity[];
  garages: readonly ResolvedEntity[];
  sirens: readonly ResolvedEntity[];
  doorSensors: readonly ResolvedEntity[];
  windowSensors: readonly ResolvedEntity[];
  motionSensors: readonly ResolvedEntity[];
  leakSensors: readonly ResolvedEntity[];
  smokeSensors: readonly ResolvedEntity[];
  cameras: readonly ResolvedEntity[];
  people: readonly ResolvedEntity[];
  /** Every binary sensor, to find a camera's person / vehicle / package / animal sensors. */
  binarySensors: readonly ResolvedEntity[];
  /** Battery per entity, as `useSecurityData` resolved it (own attribute, device sensor, slug). */
  batteries: Readonly<Record<string, number>>;
  events: readonly ActivityEvent[];
  picture?: MapContext['picture'];
}

const OUTDOOR = /\b(outdoor|outside|garden|yard|drive|driveway|porch|front|back|entrance|gate|street|patio|door ?bell)\b/i;

const time = (v: unknown): number | null => {
  const t = typeof v === 'string' ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? t : null;
};

/** HA alarm states → the page's: vacation and custom count as Away, arming and disarming as moving. */
export function alarmStateOf(state: string): AlarmState {
  if (state === 'armed_home' || state === 'armed_night' || state === 'armed_away' || state === 'triggered' || state === 'pending') return state;
  if (state === 'armed_vacation' || state === 'armed_custom_bypass') return 'armed_away';
  if (state === 'arming' || state === 'disarming') return 'arming';
  return 'disarmed';
}

const EVENT_KIND: Record<ActivityEvent['kind'], SecurityEvent['kind']> = {
  alarm: 'alarm',
  siren: 'alarm',
  lock: 'lock',
  garage: 'opening',
  door: 'opening',
  window: 'opening',
  motion: 'motion',
  leak: 'safety',
  smoke: 'safety'
};
const EVENT_TONE: Record<ActivityEvent['tone'], Tone> = { default: 'calm', success: 'calm', warning: 'warning', danger: 'danger' };

export function securityEvent(e: ActivityEvent): SecurityEvent {
  return { id: e.id, at: e.when, kind: e.kind === 'motion' && e.detection ? 'camera' : EVENT_KIND[e.kind], text: e.text, tone: EVENT_TONE[e.tone] };
}

export function buildSecurityHome(input: SecurityHomeInput): SecurityHome {
  const { now, alarm, batteries } = input;
  const ctx = (): MapContext => ({ room: '', now, siblings: [], picture: input.picture });
  const area = (e: ResolvedEntity) => e.area?.name ?? '';
  const battery = <M extends { battery: number | null; entityId: string }>(m: M): M => ({ ...m, battery: batteries[m.entityId] ?? m.battery });

  const sirens: SecurityDevice[] = input.sirens.map((e): SecurityDevice => {
    const m: SirenModel = { kind: 'siren', entityId: e.entity_id, name: ctxName(e), available: e.state !== 'unavailable', isOn: e.state === 'on', lastChanged: time(e.last_changed), battery: null };
    return { ...battery(m), area: area(e) };
  });
  const garages: SecurityDevice[] = input.garages.map((e) => ({ ...(coverModel(e, ctx()) as GarageModel), deviceClass: 'garage' as const, area: area(e) }));

  const devices: SecurityDevice[] = [
    ...input.locks.map((e) => ({ ...battery(lockModel(e, ctx())), area: area(e) })),
    ...garages,
    ...[...input.doorSensors, ...input.windowSensors].map((e) => ({ ...battery(openingModel(e, ctx())), area: area(e) })),
    ...[...input.smokeSensors, ...input.leakSensors].map((e) => ({ ...battery(safetyModel(e, ctx())), area: area(e) })),
    ...sirens,
    ...input.motionSensors.map((e) => ({ ...battery(motionModel(e, ctx())), area: area(e) }))
  ];

  const cameras: SecurityCamera[] = input.cameras.map((e) => {
    const m = cameraModel(e, ctx());
    const seen = detectCameraAiAlerts(e, input.binarySensors);
    const detection = (seen[0]?.kind ?? null) as Detection | null;
    // A sensor that sees someone right now is the freshest motion there is.
    return { ...m, lastMotion: detection ? now : m.lastMotion, area: area(e), outdoor: OUTDOOR.test(`${e.entity_id} ${m.name} ${area(e)}`), detection };
  });

  const modes = alarm ? ARM_MODES.map((m) => m.id).filter((id) => alarmModes(alarm).some((x) => x.id === id)) : [];
  const diag = alarm
    ? resolveAlarmTriggerDiagnostic({
        alarm,
        hazards: [...input.smokeSensors, ...input.leakSensors].filter((e) => e.state === 'on'),
        openings: [...input.doorSensors, ...input.windowSensors].filter((e) => e.state === 'on'),
        events: input.events,
        cameras: input.cameras
      })
    : null;

  return {
    alarm: {
      entityId: alarm && alarm.state !== 'unavailable' ? alarm.entity_id : null,
      state: alarm ? alarmStateOf(alarm.state) : 'disarmed',
      modes: modes as ArmMode[],
      changedBy: typeof alarm?.attributes?.changed_by === 'string' && alarm.attributes.changed_by ? alarm.attributes.changed_by : null,
      changedAt: time(alarm?.last_changed) ?? now,
      cause: diag?.summary ?? null,
      siren: sirens.some((s) => s.available && s.isOn),
      codeToDisarm: alarm ? alarmNeedsCode(alarm, 'disarmed') : false,
      codeToArm: alarm ? alarmNeedsCode(alarm, 'armed_away') : false,
      codeNumeric: alarm ? alarmCodeIsNumeric(alarm) : true
    },
    people: input.people.map((p) => ({ name: ctxName(p), home: p.state === 'home' })),
    cameras,
    devices,
    events: input.events.map(securityEvent)
  };
}

function ctxName(e: ResolvedEntity): string {
  const n = e.name && e.name !== e.entity_id ? e.name : typeof e.attributes?.friendly_name === 'string' ? e.attributes.friendly_name : null;
  if (n) return n;
  const words = e.entity_id.split('.').pop()!.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
