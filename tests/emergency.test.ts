import { describe, expect, it } from 'vitest';
import { emergencyTypeOf } from '@/services/notifications/emergency';
import { isLeakSensor } from '@/lib/entityClassifiers';

describe('emergencyTypeOf', () => {
  it('ignores camera floodlights and other non-binary-sensor domains (owner report)', () => {
    expect(emergencyTypeOf('light.driveway_camera_floodlight', 'on', { friendly_name: 'Driveway Floodlight' })).toBeNull();
    expect(emergencyTypeOf('switch.garage_floodlight', 'on')).toBeNull();
    expect(emergencyTypeOf('switch.leak_valve', 'on')).toBeNull();
    expect(emergencyTypeOf('sensor.kitchen_smoke_level', 'on')).toBeNull();
    expect(emergencyTypeOf('binary_sensor.camera_floodlight', 'on')).toBeNull();
  });

  it('uses the device class of binary sensors that are on', () => {
    expect(emergencyTypeOf('binary_sensor.kitchen', 'on', { device_class: 'smoke' })).toBe('smoke');
    expect(emergencyTypeOf('binary_sensor.boiler', 'on', { device_class: 'carbon_monoxide' })).toBe('co');
    expect(emergencyTypeOf('binary_sensor.sink', 'on', { device_class: 'moisture' })).toBe('moisture');
    expect(emergencyTypeOf('binary_sensor.sink', 'off', { device_class: 'moisture' })).toBeNull();
    // A device class that isn't a hazard wins over words in the name.
    expect(emergencyTypeOf('binary_sensor.flood_light_motion', 'on', { device_class: 'motion' })).toBeNull();
  });

  it('falls back to whole words only when there is no device class', () => {
    expect(emergencyTypeOf('binary_sensor.washer_leak', 'on')).toBe('moisture');
    expect(emergencyTypeOf('binary_sensor.basement_flood', 'on')).toBe('moisture');
    expect(emergencyTypeOf('binary_sensor.x', 'on', { friendly_name: 'Hallway Smoke' })).toBe('smoke');
    expect(emergencyTypeOf('binary_sensor.rain_leak', 'on')).toBeNull();
  });

  it('treats a triggered alarm as an emergency', () => {
    expect(emergencyTypeOf('alarm_control_panel.home', 'triggered')).toBe('alarm');
    expect(emergencyTypeOf('alarm_control_panel.home', 'armed_away')).toBeNull();
  });
});

describe('isLeakSensor', () => {
  it('does not take floodlights for flood sensors', () => {
    expect(isLeakSensor({ entity_id: 'binary_sensor.garage_floodlight_motion' })).toBe(false);
    expect(isLeakSensor({ entity_id: 'binary_sensor.basement_flood' })).toBe(true);
    expect(isLeakSensor({ entity_id: 'binary_sensor.x', attributes: { friendly_name: 'Flood sensor' } })).toBe(true);
  });
});
