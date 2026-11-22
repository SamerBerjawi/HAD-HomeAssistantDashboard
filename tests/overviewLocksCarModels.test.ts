import { describe, expect, it } from 'vitest';
import { buildCarModel, carLine, carMode, estimateChargeMinutes, otaState } from '@/pro/lib/overviewCar';
import { buildLocksModel, buildProLockItem } from '@/pro/lib/overviewLocks';
import type { ResolvedEntity } from '@/types';
import type { CarEvMetrics } from '@/types/mobility';
import { CAR_STATES } from '@/pro/widgets/car/concepts/states';
import { LOCKS_STATES } from '@/pro/widgets/locks/concepts/states';

const lockEntity = (id: string, state: string, attributes: Record<string, unknown> = {}) =>
  ({ entity_id: `lock.${id}`, state, name: `${id} Lock`, attributes, last_changed: new Date(Date.now() - 5 * 60000).toISOString() }) as unknown as ResolvedEntity;

describe('Door locks model', () => {
  it('reads battery, who and when, and sorts problems first', () => {
    const items = [buildProLockItem(lockEntity('front', 'locked', { battery_level: 12, changed_by: 'Keypad' })), buildProLockItem(lockEntity('back', 'unlocked'), true)];
    expect(items[0].batteryPct).toBe(12);
    expect(items[0].changedBy).toBe('Keypad');
    expect(items[0].changedAt).not.toBeNull();
    const m = buildLocksModel(items);
    expect(m.locks[0].entityId).toBe('lock.back');
    expect(m.locks[0].doorOpen).toBe(true);
    expect(m.unlocked).toBe(1);
    expect(m.lowBattery).toBe(1);
    expect(m.allLocked).toBe(false);
  });

  it('headlines', () => {
    expect(buildLocksModel([]).headline).toBe('No locks');
    expect(LOCKS_STATES.find((s) => s.id === 'night')?.model.headline).toBe('All locked');
    expect(LOCKS_STATES.find((s) => s.id === 'one')?.model.headline).toBe('Back door unlocked');
    expect(LOCKS_STATES.find((s) => s.id === 'jammed')?.model.headline).toBe('Front door jammed');
    expect(LOCKS_STATES.find((s) => s.id === 'many')?.model.headline).toBe('2 unlocked');
  });
});

describe('Car model', () => {
  it('picks one state, driving first', () => {
    const base = { moving: false, gear: null, charging: false, climate: false, ota: 'none' as const, ignition: false, plugged: false, asleep: false };
    expect(carMode({ ...base, moving: true, charging: true })).toBe('driving');
    expect(carMode({ ...base, charging: true, climate: true })).toBe('charging');
    expect(carMode({ ...base, ota: 'installing', ignition: true })).toBe('updating');
    expect(carMode({ ...base, plugged: true })).toBe('plugged');
    expect(carMode({ ...base, asleep: true })).toBe('asleep');
    expect(carMode(base)).toBe('parked');
  });

  it('reads software update status', () => {
    expect(otaState('Up to date (No pending OTA)')).toBe('none');
    expect(otaState('Update available')).toBe('available');
    expect(otaState('Installing (in progress)')).toBe('installing');
    expect(otaState('')).toBe('none');
  });

  it('estimates charge time', () => {
    expect(estimateChargeMinutes(40, 80, 7, 70)).toBe(240);
    expect(estimateChargeMinutes(80, 80, 7)).toBeNull();
    expect(estimateChargeMinutes(40, 80, 0)).toBeNull();
  });

  it('builds from car metrics: charging at home with alerts', () => {
    const c = {
      soc: 12,
      range: 40,
      rangeUnit: 'km',
      chargingState: 'Disconnected',
      isPluggedIn: false,
      targetSoc: '80',
      ignitionOn: false,
      ignitionStatus: 'Off',
      isMoving: false,
      gearPosition: 'P',
      doorsLocked: false,
      windowsClosed: false,
      alarmStatus: 'Armed',
      indicatorsStatus: 'Normal',
      tirePressure: { status: 'Low', unit: 'kPa', frontLeft: 200, frontRight: 230, rearLeft: 230, rearRight: 230 },
      hasTirePressure: true,
      deepSleep: false,
      remoteClimateActive: false,
      softwareUpdates: { autoUpdatesEnabled: true, firmwareHistory: '', firmwareStatus: 'Update available', lastFirmwareUpdate: '', otaReadiness: '', nextOtaCheck: '' },
      gps: { latitude: 52.3, longitude: 4.9 },
      locationZone: 'In Work Zone',
      isAtHome: false,
      controls: { unlockDoorLockId: 'lock.car', startClimateSwitchId: 'switch.car_climate' }
    } as unknown as CarEvMetrics;
    const m = buildCarModel(c, 'Volt');
    expect(m.mode).toBe('parked');
    expect(m.location.place).toBe('Work');
    expect(m.ota.state).toBe('available');
    expect(m.alerts.map((a) => a.id)).toEqual(['battery', 'tyres', 'window', 'unlocked']);
    expect(carLine(m, true)).toBe('Work');
    expect(m.controls.lockId).toBe('lock.car');
  });

  it('studio states cover every story', () => {
    const modes = new Set(CAR_STATES.map((s) => s.model.mode));
    for (const mode of ['asleep', 'charging', 'driving', 'parked', 'climate', 'plugged', 'updating']) expect(modes.has(mode as never)).toBe(true);
    expect(CAR_STATES.find((s) => s.id === 'climate')?.model.modeLabel).toBe('Warming up');
    expect(carLine(CAR_STATES.find((s) => s.id === 'charging')!.model)).toBe('7.2 kW · full in 1 h 35 min');
    expect(buildCarModel(null).hasCar).toBe(false);
  });
});
