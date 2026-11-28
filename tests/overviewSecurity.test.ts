import { describe, expect, it } from 'vitest';
import type { ResolvedEntity } from '@/types';
import {
  buildOverviewAlarmModel,
  buildOverviewCamerasModel,
  buildOverviewSensorDomainModel,
  filterAndGroupSensorItems
} from '../src/pro/lib/overviewSecurity';

function makeEntity(
  entityId: string,
  state: string,
  name: string,
  attrs: Record<string, unknown> = {},
  areaName?: string
): ResolvedEntity {
  return {
    entity_id: entityId,
    state,
    attributes: attrs,
    domain: entityId.split('.')[0],
    name,
    area_id: areaName ? areaName.toLowerCase().replace(/\s+/g, '_') : null,
    area: areaName ? { area_id: areaName.toLowerCase(), name: areaName } : null,
    floor_id: null,
    device_id: null,
    resolutionSource: 'direct_entity_area',
    hidden: false,
    isDiagnostic: false,
    disabled_by: null
  };
}

describe('overviewSecurity helpers', () => {
  it('builds sensor domain models with critical hazard and warning semantics', () => {
    const doorOpen = makeEntity('binary_sensor.front_door', 'on', 'Front Door', {}, 'Entryway');
    const doorClosed = makeEntity('binary_sensor.back_door', 'off', 'Back Door', {}, 'Kitchen');
    const doorsModel = buildOverviewSensorDomainModel('doors', [doorClosed, doorOpen]);

    expect(doorsModel.activeCount).toBe(1);
    expect(doorsModel.hasWarning).toBe(true);
    expect(doorsModel.isCriticalHazard).toBe(false);
    expect(doorsModel.badgeTone).toBe('warning');
    expect(doorsModel.headlineText).toBe('1 open');
    expect(doorsModel.items[0].entityId).toBe('binary_sensor.front_door');

    const dryLeaks = buildOverviewSensorDomainModel('leak', [
      makeEntity('binary_sensor.sink_leak', 'off', 'Sink Leak', {}, 'Kitchen')
    ]);
    expect(dryLeaks.isCriticalHazard).toBe(false);
    expect(dryLeaks.badgeTone).toBe('success');
    expect(dryLeaks.headlineText).toBe('Dry');

    const activeSmoke = buildOverviewSensorDomainModel('smoke', [
      makeEntity('binary_sensor.hall_smoke', 'on', 'Hallway Smoke', {}, 'Hallway')
    ]);
    expect(activeSmoke.isCriticalHazard).toBe(true);
    expect(activeSmoke.badgeTone).toBe('danger');
    expect(activeSmoke.headlineText).toBe('1 alert');
  });

  it('filters and groups sensors by room with active rooms first', () => {
    const model = buildOverviewSensorDomainModel('motion', [
      makeEntity('binary_sensor.office_motion', 'off', 'Office Motion', {}, 'Office'),
      makeEntity('binary_sensor.hall_motion', 'on', 'Hallway Motion', {}, 'Hallway')
    ]);

    const allGroups = filterAndGroupSensorItems(model.items);
    expect(allGroups.map((g) => g.roomName)).toEqual(['Hallway', 'Office']);

    const onlyActive = filterAndGroupSensorItems(model.items, { onlyActive: true });
    expect(onlyActive).toHaveLength(1);
    expect(onlyActive[0].roomName).toBe('Hallway');

    const searched = filterAndGroupSensorItems(model.items, { query: 'office' });
    expect(searched).toHaveLength(1);
    expect(searched[0].roomName).toBe('Office');
  });

  it('builds alarm and camera overview models cleanly', () => {
    const alarm = makeEntity('alarm_control_panel.home', 'triggered', 'HAD Alarm', {
      code_format: 'number',
      code_arm_required: true,
      supported_features: 15
    });
    const openDoor = makeEntity('binary_sensor.front_door', 'on', 'Front Door', {}, 'Entryway');
    const unlockedLock = makeEntity('lock.front_door', 'unlocked', 'Front Lock', {}, 'Entryway');
    const lockedLock = makeEntity('lock.back_door', 'locked', 'Back Lock', {}, 'Kitchen');

    const alarmModel = buildOverviewAlarmModel({
      alarms: [alarm],
      openDoors: [openDoor],
      openWindows: [],
      locks: [lockedLock, unlockedLock]
    });
    expect(alarmModel.isTriggered).toBe(true);
    expect(alarmModel.tone).toBe('danger');
    expect(alarmModel.openingsCount).toBe(1);
    expect(alarmModel.unlockedLocksCount).toBe(1);
    expect(alarmModel.locks[0].entityId).toBe('lock.front_door');
    expect(alarmModel.shouldConfirmArming('armed_away')).toBe(true);
    expect(alarmModel.shouldConfirmArming('armed_home')).toBe(false);
    expect(alarmModel.needsCodeFor('disarmed')).toBe(true);

    const frontCam = makeEntity('camera.front_porch', 'idle', 'Front Porch Camera', {}, 'Front Porch');
    const camMotion = makeEntity('binary_sensor.front_porch_motion', 'on', 'Front Porch Motion');
    const camerasModel = buildOverviewCamerasModel({
      cameras: [frontCam],
      binarySensors: [camMotion]
    });
    expect(camerasModel.totalCount).toBe(1);
    expect(camerasModel.motionCount).toBe(1);
    expect(camerasModel.badgeTone).toBe('warning');
    expect(camerasModel.featuredCamera?.hasMotion).toBe(true);
  });
});
