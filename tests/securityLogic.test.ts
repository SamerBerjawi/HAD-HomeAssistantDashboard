import { describe, expect, it } from 'vitest';
import { classifyBinarySensors } from '@/lib/entityClassifiers';
import {
  detectCameraAiAlerts,
  detectCameraNativeAiKinds,
  mergeCameraDetections,
  resolveAlarmTriggerDiagnostic
} from '@/pro/lib/securityCameras';
import {
  ALARM_FEATURE,
  activitySentence,
  alarmModes,
  alarmNeedsCode,
  alarmTone,
  bentoSpan,
  buildActivity,
  deviceItem,
  groupByRoom,
  groupByType,
  groupHasDanger,
  packOrder,
  resolveMotionActivityMeta,
  shouldConfirmArming
} from '@/pro/lib/securityLogic';
import type { ResolvedEntity } from '@/types';

const ent = (entity_id: string, state: string, extra: Partial<ResolvedEntity> = {}): ResolvedEntity => ({
  entity_id,
  domain: entity_id.split('.')[0],
  name: extra.name ?? entity_id.split('.')[1],
  state,
  attributes: {},
  area_id: null,
  device_id: null,
  floor_id: null,
  resolutionSource: 'direct_entity_area' as ResolvedEntity['resolutionSource'],
  hidden: false,
  isDiagnostic: false,
  ...extra
});

describe('securityLogic: alarm', () => {
  it('lists Off plus supported arm modes', () => {
    expect(alarmModes({ attributes: {} }).map((m) => m.id)).toEqual(['disarmed', 'armed_home', 'armed_away', 'armed_night']);
    expect(alarmModes({ attributes: { supported_features: ALARM_FEATURE.ARM_AWAY | ALARM_FEATURE.TRIGGER } }).map((m) => m.id)).toEqual([
      'disarmed',
      'armed_away'
    ]);
    expect(
      alarmModes({
        attributes: {
          supported_features:
            ALARM_FEATURE.ARM_HOME | ALARM_FEATURE.ARM_VACATION | ALARM_FEATURE.ARM_CUSTOM_BYPASS
        }
      }).map((m) => m.id)
    ).toEqual(['disarmed', 'armed_home', 'armed_vacation', 'armed_custom_bypass']);
  });

  it('tones and code rules', () => {
    expect(alarmTone('triggered')).toBe('danger');
    expect(alarmTone('armed_night')).toBe('success');
    expect(alarmTone('arming')).toBe('warning');
    expect(alarmTone('disarmed')).toBe('default');
    expect(alarmNeedsCode({ attributes: {} }, 'armed_away')).toBe(false);
    expect(alarmNeedsCode({ attributes: { code_format: 'number' } }, 'armed_away')).toBe(true);
    expect(alarmNeedsCode({ attributes: { code_format: 'number', code_arm_required: false } }, 'armed_away')).toBe(false);
    expect(alarmNeedsCode({ attributes: { code_format: 'number', code_arm_required: false } }, 'disarmed')).toBe(true);
  });

  it('confirms arming Away/Night/Vacation with openings open or locks unlocked', () => {
    expect(shouldConfirmArming('armed_away', 2)).toBe(true);
    expect(shouldConfirmArming('armed_night', 1)).toBe(true);
    expect(shouldConfirmArming('armed_vacation', 0, 1)).toBe(true);
    expect(shouldConfirmArming('armed_away', 0, 2)).toBe(true);
    expect(shouldConfirmArming('armed_home', 3, 2)).toBe(false);
    expect(shouldConfirmArming('armed_away', 0, 0)).toBe(false);
  });

  it('detects danger problems inside a device group', () => {
    expect(groupHasDanger([deviceItem(ent('binary_sensor.l', 'on'), 'leak')])).toBe(true);
    expect(groupHasDanger([deviceItem(ent('lock.front', 'jammed'), 'lock')])).toBe(true);
    expect(groupHasDanger([deviceItem(ent('binary_sensor.d', 'on'), 'door')])).toBe(false);
    expect(groupHasDanger([deviceItem(ent('binary_sensor.s', 'unavailable'), 'smoke')])).toBe(false);
  });
});

describe('securityLogic: devices', () => {
  it('describes device states', () => {
    expect(deviceItem(ent('lock.front', 'unlocked'), 'lock')).toMatchObject({ problem: true, stateLabel: 'Unlocked', tone: 'warning' });
    expect(deviceItem(ent('lock.front', 'jammed'), 'lock')).toMatchObject({ problem: true, tone: 'danger' });
    expect(deviceItem(ent('binary_sensor.d', 'on'), 'door')).toMatchObject({ problem: true, stateLabel: 'Open' });
    expect(deviceItem(ent('binary_sensor.m', 'on'), 'motion')).toMatchObject({ problem: false, stateLabel: 'Detected' });
    expect(deviceItem(ent('binary_sensor.l', 'off'), 'leak')).toMatchObject({ stateLabel: 'Dry' });
    expect(deviceItem(ent('binary_sensor.s', 'unavailable'), 'smoke')).toMatchObject({ stateLabel: 'Offline', problem: false, tone: 'danger' });
    // Pill colours (owner 2026-11-18): green fine, orange needs a look, red problem.
    expect(deviceItem(ent('binary_sensor.d', 'off'), 'door').tone).toBe('success');
    expect(deviceItem(ent('binary_sensor.m', 'off'), 'motion').tone).toBe('success');
    expect(deviceItem(ent('binary_sensor.l', 'on'), 'leak').tone).toBe('danger');
  });

  const entities = {
    locks: [ent('lock.back', 'locked'), ent('lock.front', 'unlocked')],
    doorSensors: [ent('binary_sensor.garage', 'on', { area: { area_id: 'garage', name: 'Garage' }, area_id: 'garage' })],
    windowSensors: [ent('binary_sensor.kitchen', 'off', { area: { area_id: 'kitchen', name: 'Kitchen' }, area_id: 'kitchen', floor: { floor_id: 'g', name: 'Ground', level: 0 } })],
    motionSensors: [],
    leakSensors: [],
    smokeSensors: []
  };

  it('groups by type, problems first, empty groups dropped', () => {
    const groups = groupByType(entities);
    expect(groups.map((g) => g.id)).toEqual(['locks', 'openings']);
    expect(groups[0].items[0].entity.entity_id).toBe('lock.front');
    expect(groups[0].summary).toBe('1 unlocked');
    expect(groups[1].summary).toBe('1 open');
  });

  it('groups by room, floor order, unassigned last', () => {
    const groups = groupByRoom(entities);
    expect(groups.map((g) => g.title)).toEqual(['Kitchen', 'Garage', 'No room']);
    expect(groups[0].summary).toBe('Ground · All clear');
  });

  it('sizes bento cards by content', () => {
    expect(bentoSpan(2)).toBe('col-span-1');
    expect(bentoSpan(5)).toBe('md:col-span-2');
    expect(bentoSpan(9)).toBe('md:col-span-2');
    expect(packOrder([{ items: [1] }, { items: [1, 2, 3] }, { items: [1, 2] }]).map((g) => g.items.length)).toEqual([3, 2, 1]);
  });
});

describe('securityLogic: activity', () => {
  it('writes sentences', () => {
    expect(activitySentence('lock', 'Front door', 'unlocked', 'Samer')).toEqual({ text: 'Front door unlocked by Samer', tone: 'warning' });
    expect(activitySentence('alarm', 'Home alarm', 'armed_away', 'Samer')?.text).toBe('Home alarm armed away by Samer');
    expect(activitySentence('motion', 'Hallway', 'off', undefined)).toBeNull();
  });

  it('builds a newest-first timeline from logbook rows', () => {
    const events = buildActivity(
      [
        { entity_id: 'lock.front', state: 'locked', when: 1_700_000_000 },
        { entity_id: 'binary_sensor.garage', state: 'on', when: 1_700_000_100 },
        { entity_id: 'sensor.ignored', state: '5', when: 1_700_000_200 },
        { entity_id: 'alarm_control_panel.home', state: 'armed_home', when: '2023-11-14T22:20:00Z', context_user_id: 'u1' }
      ],
      { 'lock.front': 'lock', 'binary_sensor.garage': 'door' },
      { 'lock.front': 'Front door', 'binary_sensor.garage': 'Garage door', 'alarm_control_panel.home': 'Alarm' },
      { u1: 'Samer' }
    );
    expect(events.map((e) => e.text)).toEqual(['Alarm armed home by Samer', 'Garage door opened', 'Front door locked']);
    expect(events[2].when).toBe(1_700_000_000_000);
  });
});

describe('securityLogic: garages, sirens, AI camera alerts & trigger diagnostics', () => {
  it('handles garage covers and sirens cleanly', () => {
    expect(deviceItem(ent('cover.garage', 'open'), 'garage')).toMatchObject({
      problem: true,
      stateLabel: 'Open',
      tone: 'warning'
    });
    expect(deviceItem(ent('cover.garage', 'closed'), 'garage')).toMatchObject({
      problem: false,
      stateLabel: 'Closed',
      tone: 'success'
    });
    expect(deviceItem(ent('siren.indoor', 'on'), 'siren')).toMatchObject({
      problem: true,
      stateLabel: 'Sounding',
      tone: 'danger'
    });
    expect(activitySentence('garage', 'Main Garage', 'open', 'Samer')).toEqual({
      text: 'Main Garage opened by Samer',
      tone: 'warning'
    });
    expect(activitySentence('siren', 'Indoor Siren', 'on')).toEqual({
      text: 'Indoor Siren siren activated',
      tone: 'danger'
    });
    expect(activitySentence('motion', 'Hallway', 'on')).toEqual({
      text: 'Motion detected at Hallway',
      tone: 'warning'
    });
    expect(activitySentence('leak', 'Kitchen Sink', 'off')).toEqual({
      text: 'Water leak cleared at Kitchen Sink',
      tone: 'success'
    });
    expect(activitySentence('lock', 'Front Door', 'locked', undefined, 'Night Auto-Lock')).toEqual({
      text: 'Front Door locked via Night Auto-Lock',
      tone: 'success'
    });
  });

  it('detects active AI camera detections by device_id or slug prefix', () => {
    const cam = ent('camera.front_porch', 'streaming', { device_id: 'dev_cam1' });
    const sensors = [
      ent('binary_sensor.front_porch_person', 'on', { device_id: 'dev_cam1', name: 'Front Porch Person' }),
      ent('binary_sensor.front_porch_package', 'on', { name: 'Front Porch Package' }),
      ent('binary_sensor.backyard_vehicle', 'on', { name: 'Backyard Vehicle' })
    ];
    const alerts = detectCameraAiAlerts(cam, sensors);
    expect(alerts.map((a) => a.kind)).toEqual(['person', 'package']);
  });

  it('resolves triggered alarm diagnostic and matches nearest camera by area', () => {
    const alarm = ent('alarm_control_panel.home', 'triggered');
    const door = ent('binary_sensor.patio_door', 'on', { name: 'Patio Door', area_id: 'patio' });
    const cam1 = ent('camera.front', 'idle', { area_id: 'front' });
    const cam2 = ent('camera.patio', 'idle', { area_id: 'patio' });
    const diag = resolveAlarmTriggerDiagnostic({
      alarm,
      hazards: [],
      openings: [door],
      events: [],
      cameras: [cam1, cam2]
    });
    expect(diag).toEqual({
      summary: 'Triggered by Patio Door',
      areaId: 'patio',
      cameraId: 'camera.patio'
    });
  });

  it('classifies door/garage-named motion sensors as motion (never doors) and classifies leak sensors', () => {
    const res = classifyBinarySensors([
      ent('binary_sensor.front_door_motion', 'on', { attributes: { device_class: 'motion' } }),
      ent('binary_sensor.garage_occupancy', 'off', { attributes: { device_class: 'occupancy' } }),
      ent('binary_sensor.front_door_contact', 'on', { attributes: { device_class: 'door' } }),
      ent('binary_sensor.kitchen_sink_leak', 'off', { attributes: { device_class: 'moisture' } })
    ]);
    expect(res.motionSensors.map((s) => s.entity_id)).toEqual([
      'binary_sensor.front_door_motion',
      'binary_sensor.garage_occupancy'
    ]);
    expect(res.doorSensors.map((s) => s.entity_id)).toEqual(['binary_sensor.front_door_contact']);
    expect(res.leakSensors.map((s) => s.entity_id)).toEqual(['binary_sensor.kitchen_sink_leak']);
  });

  it('prioritizes native Tapo C260 person & pet sensors over local in-browser AI', () => {
    const tapo = ent('camera.tapo_c260_hd_stream', 'streaming', { device_id: 'dev_tapo_1' });
    const sensors = [
      ent('binary_sensor.tapo_c260_person_detection', 'off', { device_id: 'dev_tapo_1', name: 'Person Detection' }),
      ent('binary_sensor.tapo_c260_pet_detection', 'on', { device_id: 'dev_tapo_1', name: 'Pet Detection' })
    ];

    const nativeKinds = detectCameraNativeAiKinds(tapo, sensors);
    expect([...nativeKinds].sort()).toEqual(['animal', 'person']);

    const nativeAlerts = detectCameraAiAlerts(tapo, sensors);
    expect(nativeAlerts).toEqual([
      { kind: 'animal', label: 'Pet', entityId: 'binary_sensor.tapo_c260_pet_detection' }
    ]);

    const merged = mergeCameraDetections(
      nativeAlerts,
      [
        { kind: 'person', label: 'Person', entityId: 'local_ai:person' },
        { kind: 'animal', label: 'Animal', entityId: 'local_ai:animal' },
        { kind: 'vehicle', label: 'Vehicle', entityId: 'local_ai:vehicle' }
      ],
      nativeKinds
    );
    expect(merged.map((m) => `${m.kind}:${m.label}`)).toEqual(['animal:Pet', 'vehicle:Vehicle']);
  });

  it('formats explicit motion, person, and pet activity sentences with device or room names', () => {
    const doorbell = ent('binary_sensor.entrance_door_bell_motion', 'on', {
      name: 'Motion',
      attributes: { friendly_name: 'Entrance Door Bell Motion', device_class: 'motion' },
      device: { id: 'd1', name: 'Entrance Door Bell' }
    });
    const livingPerson = ent('binary_sensor.tapo_c260_person_detection', 'on', {
      name: 'Person Detection',
      attributes: { friendly_name: 'Tapo C260 Person Detection', device_class: 'motion' },
      device: { id: 'd2', name: 'Tapo C260', model: 'C260' },
      area: { area_id: 'living_room', name: 'Living Room' },
      area_id: 'living_room'
    });
    const bedroomPet = ent('binary_sensor.tapo_c260_pet_detection', 'on', {
      name: 'Pet Detection',
      attributes: { friendly_name: 'Tapo C260 Pet Detection', device_class: 'motion' },
      device: { id: 'd3', name: 'Tapo C260', model: 'C260' },
      area: { area_id: 'bedroom', name: 'Bedroom' },
      area_id: 'bedroom'
    });

    const meta = {
      [doorbell.entity_id]: resolveMotionActivityMeta(doorbell),
      [livingPerson.entity_id]: resolveMotionActivityMeta(livingPerson),
      [bedroomPet.entity_id]: resolveMotionActivityMeta(bedroomPet)
    };

    const events = buildActivity(
      [
        { entity_id: doorbell.entity_id, state: 'on', when: 1_700_000_300 },
        { entity_id: livingPerson.entity_id, state: 'on', when: 1_700_000_200 },
        { entity_id: bedroomPet.entity_id, state: 'on', when: 1_700_000_100 }
      ],
      {
        [doorbell.entity_id]: 'motion',
        [livingPerson.entity_id]: 'motion',
        [bedroomPet.entity_id]: 'motion'
      },
      {
        [doorbell.entity_id]: 'Motion',
        [livingPerson.entity_id]: 'Person Detection',
        [bedroomPet.entity_id]: 'Pet Detection'
      },
      {},
      {
        [livingPerson.entity_id]: 'Living Room',
        [bedroomPet.entity_id]: 'Bedroom'
      },
      meta
    );

    expect(events.map((e) => e.text)).toEqual([
      'Motion detected at Entrance Door Bell',
      'Person detected in Living Room',
      'Pet detected in Bedroom'
    ]);
    expect(events.map((e) => e.detection)).toEqual([undefined, 'person', 'pet']);
    expect(events.map((e) => e.area)).toEqual([undefined, undefined, undefined]);
  });
});
