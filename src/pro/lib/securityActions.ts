/**
 * The Security page's actions → Home Assistant service calls. Pure. Devices reuse the Area tiles'
 * mapping (`tileActionCalls`: unlocking only ever comes from the tiles' guarded controls); the
 * alarm uses the panel's service per mode, with the code when HA asks for one; sirens are
 * `siren.turn_on` / `turn_off`; Lock all and Silence act on every unlocked lock or sounding siren.
 */
import { tileActionCalls, type HaCall } from '../areas/ha/haTileActions';
import type { TileModel } from '../areas/tileTypes';
import { isLock, isSiren, type ArmMode, type SecurityAction, type SecurityHome } from './securityPage';

const ARM_SERVICE: Record<ArmMode, string> = { disarmed: 'alarm_disarm', armed_home: 'alarm_arm_home', armed_night: 'alarm_arm_night', armed_away: 'alarm_arm_away' };

export function securityActionCalls(home: SecurityHome, a: SecurityAction): HaCall[] {
  switch (a.type) {
    case 'arm': {
      const id = home.alarm.entityId;
      if (!id || !home.alarm.modes.includes(a.mode)) return [];
      return [{ domain: 'alarm_control_panel', service: ARM_SERVICE[a.mode], data: a.code ? { code: a.code } : {}, entityId: id }];
    }
    case 'lockAll':
      return home.devices
        .filter((d) => isLock(d) && d.available && (d.state === 'unlocked' || d.state === 'open'))
        .map((d) => ({ domain: 'lock', service: 'lock', data: {}, entityId: d.entityId, optimistic: { state: 'locked' } }));
    case 'silence':
      return home.devices
        .filter((d) => isSiren(d) && d.available && d.isOn)
        .map((d) => ({ domain: 'siren', service: 'turn_off', data: {}, entityId: d.entityId, optimistic: { state: 'off' } }));
    case 'device': {
      const d = home.devices.find((x) => x.entityId === a.id);
      if (!d || !d.available) return [];
      if (isSiren(d)) return a.action.type === 'toggle' ? [{ domain: 'siren', service: d.isOn ? 'turn_off' : 'turn_on', data: {}, entityId: d.entityId, optimistic: { state: d.isOn ? 'off' : 'on' } }] : [];
      return tileActionCalls(d as TileModel, a.action).calls;
    }
  }
}
