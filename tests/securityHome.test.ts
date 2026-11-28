import { describe, expect, it } from 'vitest';
import type { ResolvedEntity } from '@/types';
import { alarmStateOf, buildSecurityHome, securityEvent, type SecurityHomeInput } from '@/pro/lib/securityHome';
import { securityActionCalls } from '@/pro/lib/securityActions';
import { needsCode, securityIssues, securityVerdict, suggestedMode } from '@/pro/lib/securityPage';

const NOW = Date.parse('2026-11-26T19:00:00Z');
const ago = (min: number) => new Date(NOW - min * 60000).toISOString();

function ent(entity_id: string, state: string, attributes: Record<string, unknown> = {}, extra: Partial<ResolvedEntity> = {}): ResolvedEntity {
  return {
    entity_id,
    domain: entity_id.split('.')[0],
    name: String(attributes.friendly_name ?? entity_id),
    state,
    attributes,
    area_id: 'hall',
    device_id: null,
    floor_id: null,
    resolutionSource: 'direct_entity_area',
    hidden: false,
    isDiagnostic: false,
    last_changed: ago(30),
    last_updated: ago(5),
    ...extra
  };
}

function input(over: Partial<SecurityHomeInput> = {}): SecurityHomeInput {
  return {
    now: NOW,
    alarm: ent('alarm_control_panel.home', 'disarmed', { supported_features: 1 | 2 | 4, code_format: 'number', code_arm_required: false, changed_by: 'Sam' }),
    locks: [ent('lock.back_door', 'unlocked', { friendly_name: 'Back Door' })],
    garages: [ent('cover.garage', 'open', { friendly_name: 'Garage Door', device_class: 'garage' })],
    sirens: [ent('siren.hall', 'off', { friendly_name: 'Hall Siren' })],
    doorSensors: [ent('binary_sensor.patio', 'on', { friendly_name: 'Patio Door', device_class: 'door' })],
    windowSensors: [],
    motionSensors: [],
    leakSensors: [],
    smokeSensors: [ent('binary_sensor.smoke', 'off', { friendly_name: 'Hall Smoke', device_class: 'smoke' })],
    cameras: [ent('camera.driveway', 'streaming', { friendly_name: 'Driveway' }, { device_id: 'cam1' })],
    people: [ent('person.sam', 'home', { friendly_name: 'Sam' })],
    binarySensors: [ent('binary_sensor.driveway_vehicle', 'on', { friendly_name: 'Driveway Vehicle' }, { device_id: 'cam1' })],
    batteries: { 'lock.back_door': 12 },
    events: [{ id: 'e1', entityId: 'lock.back_door', kind: 'lock', text: 'Sam unlocked the Back Door', when: NOW - 60000, tone: 'default' }],
    ...over
  };
}

describe('buildSecurityHome', () => {
  it('maps the alarm panel, its modes and its code rules', () => {
    const home = buildSecurityHome(input());
    expect(home.alarm).toMatchObject({ entityId: 'alarm_control_panel.home', state: 'disarmed', modes: ['disarmed', 'armed_home', 'armed_night', 'armed_away'], changedBy: 'Sam', codeToDisarm: true, codeToArm: false, codeNumeric: true });
    expect(needsCode(home, 'armed_away')).toBe(false);
    expect(suggestedMode(home)).toBe('armed_home');
  });

  it('maps devices, batteries, garages, sirens, camera detections and events', () => {
    const home = buildSecurityHome(input());
    expect(home.devices.map((d) => d.kind)).toEqual(['lock', 'cover', 'opening', 'safety', 'siren']);
    expect(home.devices[0]).toMatchObject({ name: 'Back Door', state: 'unlocked', battery: 12 });
    expect(home.devices[1]).toMatchObject({ deviceClass: 'garage', isOn: true });
    expect(home.cameras[0]).toMatchObject({ name: 'Driveway', detection: 'vehicle', lastMotion: NOW, outdoor: true });
    expect(home.events[0]).toMatchObject({ kind: 'lock', tone: 'calm', at: NOW - 60000 });
    expect(securityIssues(home).map((i) => i.text)).toEqual(['Back Door is unlocked', 'Garage Door is open', 'Patio Door is open', 'Back Door battery at 12%']);
  });

  it('reads vacation as Away, arming as moving, and works with no alarm panel', () => {
    expect(alarmStateOf('armed_vacation')).toBe('armed_away');
    expect(alarmStateOf('disarming')).toBe('arming');
    expect(alarmStateOf('unknown')).toBe('disarmed');
    const home = buildSecurityHome(input({ alarm: undefined, locks: [], garages: [], doorSensors: [], batteries: {} }));
    expect(home.alarm).toMatchObject({ entityId: null, modes: [] });
    expect(securityVerdict(home)).toMatchObject({ tone: 'calm', title: 'All locked and closed', detail: '1 home' });
  });

  it('flags a sounding siren and turns logbook events into page events', () => {
    const home = buildSecurityHome(input({ sirens: [ent('siren.hall', 'on', { friendly_name: 'Hall Siren' })] }));
    expect(home.alarm.siren).toBe(true);
    expect(securityIssues(home)[0]).toMatchObject({ text: 'Hall Siren is sounding', fix: { label: 'Silence' } });
    expect(securityEvent({ id: 'm', entityId: 'binary_sensor.x', kind: 'motion', detection: 'person', text: 'Person at Front Door', when: 1, tone: 'warning' })).toMatchObject({ kind: 'camera', tone: 'warning' });
  });
});

describe('securityActionCalls', () => {
  const home = buildSecurityHome(input());

  it('arms with the panel service and passes the code', () => {
    expect(securityActionCalls(home, { type: 'arm', mode: 'armed_away' })).toEqual([{ domain: 'alarm_control_panel', service: 'alarm_arm_away', data: {}, entityId: 'alarm_control_panel.home' }]);
    expect(securityActionCalls(home, { type: 'arm', mode: 'disarmed', code: '1234' })[0]).toMatchObject({ service: 'alarm_disarm', data: { code: '1234' } });
  });

  it('locks every unlocked lock, closes the garage, and silences or tests sirens', () => {
    expect(securityActionCalls(home, { type: 'lockAll' })).toEqual([{ domain: 'lock', service: 'lock', data: {}, entityId: 'lock.back_door', optimistic: { state: 'locked' } }]);
    expect(securityActionCalls(home, { type: 'device', id: 'cover.garage', action: { type: 'cover', cmd: 'close' } })[0]).toMatchObject({ domain: 'cover', service: 'close_cover', entityId: 'cover.garage' });
    expect(securityActionCalls(home, { type: 'device', id: 'siren.hall', action: { type: 'toggle' } })[0]).toMatchObject({ domain: 'siren', service: 'turn_on' });
    const sounding = buildSecurityHome(input({ sirens: [ent('siren.hall', 'on', { friendly_name: 'Hall Siren' })] }));
    expect(securityActionCalls(sounding, { type: 'silence' })).toEqual([{ domain: 'siren', service: 'turn_off', data: {}, entityId: 'siren.hall', optimistic: { state: 'off' } }]);
  });

  it('does nothing without a panel or for an unsupported mode', () => {
    const noPanel = buildSecurityHome(input({ alarm: undefined }));
    expect(securityActionCalls(noPanel, { type: 'arm', mode: 'armed_away' })).toEqual([]);
    const homeOnly = buildSecurityHome(input({ alarm: ent('alarm_control_panel.home', 'disarmed', { supported_features: 1 }) }));
    expect(securityActionCalls(homeOnly, { type: 'arm', mode: 'armed_night' })).toEqual([]);
  });
});
