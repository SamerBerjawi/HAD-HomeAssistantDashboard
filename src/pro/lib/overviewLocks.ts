/**
 * Door locks widget model (new widget, 2026-11-20): every lock with its state, battery, who
 * changed it and when, and whether the door it guards is open. Pure, so it is easy to test.
 */
import type { ResolvedEntity } from '@/types';
import { buildLockItem, sortLocks, type ProOverviewAlarmLockItem } from './overviewSecurity';

export interface ProLockItem extends ProOverviewAlarmLockItem {
  /** Lock battery (0–100) when the lock reports one. */
  batteryPct: number | null;
  /** Epoch ms of the last state change. */
  changedAt: number | null;
  /** Who or what changed it ("Keypad", "Sarah", "Auto-lock"), when the lock reports it. */
  changedBy: string | null;
  /** The door this lock is on is open (from a matching door contact), when known. */
  doorOpen: boolean | null;
}

export interface ProLocksModel {
  locks: ProLockItem[];
  total: number;
  unlocked: number;
  jammed: number;
  offline: number;
  lowBattery: number;
  /** Every reachable lock is locked. */
  allLocked: boolean;
  /** "All locked", "Back door unlocked", "2 unlocked", "Front door jammed", "No locks". */
  headline: string;
}

export const LOW_LOCK_BATTERY = 20;

const num = (v: unknown): number | null => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number.parseFloat(v) : Number.NaN;
  return Number.isFinite(n) ? n : null;
};

/** A lock entity plus its extras; `doorOpen` comes from the caller, which knows the door contacts. */
export function buildProLockItem(entity: ResolvedEntity, doorOpen: boolean | null = null): ProLockItem {
  const at = Date.parse(String(entity.last_changed ?? ''));
  const by = entity.attributes?.changed_by ?? entity.attributes?.last_changed_by ?? entity.attributes?.method;
  const battery = num(entity.attributes?.battery_level ?? entity.attributes?.battery);
  const base = buildLockItem(entity);
  return {
    ...base,
    // "Garage Side Lock" → "Garage Side": the widget already says these are locks.
    shortName: base.shortName.replace(/\s+(smart\s+)?lock$/i, '').trim() || base.shortName,
    batteryPct: battery === null ? null : Math.max(0, Math.min(100, Math.round(battery))),
    changedAt: Number.isFinite(at) ? at : null,
    changedBy: typeof by === 'string' && by.trim() ? by.trim() : null,
    doorOpen
  };
}

export function buildLocksModel(items: ProLockItem[]): ProLocksModel {
  const locks = [...items].sort(sortLocks);
  const unlocked = locks.filter((l) => l.isUnlocked);
  const jammed = locks.filter((l) => l.isJammed);
  const offline = locks.filter((l) => l.isOffline).length;
  const lowBattery = locks.filter((l) => l.batteryPct !== null && l.batteryPct < LOW_LOCK_BATTERY).length;
  const headline =
    locks.length === 0
      ? 'No locks'
      : jammed.length > 0
        ? jammed.length === 1
          ? `${jammed[0].shortName} jammed`
          : `${jammed.length} jammed`
        : unlocked.length > 0
          ? unlocked.length === 1
            ? `${unlocked[0].shortName} unlocked`
            : `${unlocked.length} unlocked`
          : offline === locks.length
            ? 'Locks offline'
            : 'All locked';
  return {
    locks,
    total: locks.length,
    unlocked: unlocked.length,
    jammed: jammed.length,
    offline,
    lowBattery,
    allLocked: locks.length > 0 && unlocked.length === 0 && jammed.length === 0 && offline < locks.length,
    headline
  };
}
