/** Named Door locks states for the Widget Design Studio, built with the real model builder. */
import type { ProLockItem, ProLocksModel } from '../../../lib/overviewLocks';
import { buildLocksModel } from '../../../lib/overviewLocks';
import type { WidgetState } from '../../../studio/types';

type Kind = 'locked' | 'unlocked' | 'jammed' | 'offline';
const LABEL: Record<Kind, string> = { locked: 'Locked', unlocked: 'Unlocked', jammed: 'Jammed', offline: 'Offline' };

/** A mock lock: room, short name, state, minutes since it changed, who, battery, door open. */
function lock(shortName: string, roomName: string, kind: Kind, mins: number, by: string | null, battery: number | null = 80, doorOpen: boolean | null = false): ProLockItem {
  const name = `${shortName} Lock`;
  return {
    entityId: `lock.${shortName.toLowerCase().replace(/\W+/g, '_')}`,
    name,
    shortName,
    roomName,
    state: kind === 'offline' ? 'unavailable' : kind,
    isUnlocked: kind === 'unlocked',
    isJammed: kind === 'jammed',
    isOffline: kind === 'offline',
    stateLabel: LABEL[kind],
    badgeTone: kind === 'locked' ? 'success' : kind === 'offline' ? 'default' : kind === 'jammed' ? 'danger' : 'warning',
    batteryPct: battery,
    changedAt: Date.now() - mins * 60000,
    changedBy: by,
    doorOpen
  };
}

export const LOCKS_STATES: WidgetState<ProLocksModel>[] = [
  {
    id: 'night',
    label: 'All locked',
    model: buildLocksModel([lock('Front door', 'Hallway', 'locked', 95, 'Auto-lock'), lock('Back door', 'Kitchen', 'locked', 240, 'Sarah', 64), lock('Garage', 'Garage', 'locked', 600, 'Keypad', 41)])
  },
  {
    id: 'one',
    label: 'Back door unlocked',
    model: buildLocksModel([lock('Front door', 'Hallway', 'locked', 35, 'Auto-lock'), lock('Back door', 'Kitchen', 'unlocked', 12, 'Sarah', 64), lock('Garage', 'Garage', 'locked', 600, 'Keypad', 41)])
  },
  {
    id: 'open',
    label: 'Door open, low battery',
    model: buildLocksModel([
      lock('Front door', 'Hallway', 'unlocked', 2, 'Keypad', 12, true),
      lock('Back door', 'Kitchen', 'locked', 180, 'Auto-lock', 64),
      lock('Patio', 'Living Room', 'locked', 1440, null, 9)
    ])
  },
  {
    id: 'jammed',
    label: 'Jammed',
    model: buildLocksModel([lock('Front door', 'Hallway', 'jammed', 1, null), lock('Back door', 'Kitchen', 'locked', 180, 'Auto-lock', 64), lock('Shed', 'Garden', 'offline', 2000, null, null)])
  },
  { id: 'single', label: 'One lock', model: buildLocksModel([lock('Front door', 'Hallway', 'locked', 20, 'Mark')]) },
  {
    id: 'many',
    label: 'Many locks',
    model: buildLocksModel([
      lock('Front door', 'Hallway', 'locked', 20, 'Auto-lock'),
      lock('Back door', 'Kitchen', 'unlocked', 8, 'Sarah'),
      lock('Garage', 'Garage', 'locked', 300, 'Keypad', 41),
      lock('Patio', 'Living Room', 'unlocked', 45, 'Mark'),
      lock('Side gate', 'Garden', 'locked', 900, null, 70),
      lock('Shed', 'Garden', 'locked', 3000, null, 55)
    ])
  },
  { id: 'none', label: 'No locks', model: buildLocksModel([]) }
];
