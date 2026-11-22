/**
 * Thermostat view model for the Overview (WIDGET_DESIGN.md Phase 2, new widget). Pure: reads
 * `climate` entities and returns what a card needs (current and target temperature, what the
 * system is doing now, the modes it offers).
 */
import type { ResolvedEntity } from '@/types';
import { deriveShortName, resolveControlRoomName } from './overviewControls';

/** What the system is doing right now (HA `hvac_action`, else derived from the mode). */
export type ThermostatAction = 'heating' | 'cooling' | 'drying' | 'fan' | 'idle' | 'off';

export interface ProThermostatItem {
  entityId: string;
  name: string;
  shortName: string;
  roomName: string;
  /** HA hvac mode: heat, cool, heat_cool, auto, dry, fan_only, off, … */
  mode: string;
  modes: string[];
  action: ThermostatAction;
  current: number | null;
  target: number | null;
  /** Range mode (heat_cool) bounds, when the device uses them. */
  targetLow: number | null;
  targetHigh: number | null;
  humidity: number | null;
  unit: string;
  min: number;
  max: number;
  step: number;
}

export interface ProThermostatModel {
  items: ProThermostatItem[];
  /** The one the card controls: the user's choice, else active first, then the first one. */
  primary: ProThermostatItem | null;
  activeCount: number;
  totalCount: number;
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

const ACTIONS: Record<string, ThermostatAction> = {
  heating: 'heating',
  preheating: 'heating',
  cooling: 'cooling',
  drying: 'drying',
  fan: 'fan',
  idle: 'idle',
  off: 'off'
};

/** `hvac_action` when the device reports it; otherwise a best guess from the mode. */
export function thermostatAction(mode: string, rawAction: unknown, current: number | null, target: number | null): ThermostatAction {
  if (typeof rawAction === 'string' && ACTIONS[rawAction]) return ACTIONS[rawAction];
  if (mode === 'off' || mode === 'unavailable' || mode === 'unknown') return 'off';
  if (mode === 'dry') return 'drying';
  if (mode === 'fan_only') return 'fan';
  if (current !== null && target !== null) {
    if (mode === 'heat' && current < target - 0.2) return 'heating';
    if (mode === 'cool' && current > target + 0.2) return 'cooling';
  }
  return 'idle';
}

export function buildThermostatItem(entity: ResolvedEntity): ProThermostatItem {
  const a = (entity.attributes ?? {}) as Record<string, unknown>;
  const name = entity.name || (typeof a.friendly_name === 'string' ? a.friendly_name : '') || entity.entity_id;
  const roomName = resolveControlRoomName(entity);
  const mode = entity.state || 'off';
  const current = num(a.current_temperature);
  const target = num(a.temperature) ?? num(a.target_temp);
  const unit = typeof a.temperature_unit === 'string' ? a.temperature_unit : '°C';
  const fahrenheit = unit.includes('F');
  const modes = Array.isArray(a.hvac_modes) ? a.hvac_modes.filter((m): m is string => typeof m === 'string') : [];
  return {
    entityId: entity.entity_id,
    name,
    shortName: deriveShortName(name, roomName),
    roomName,
    mode,
    modes,
    action: thermostatAction(mode, a.hvac_action, current, target),
    current,
    target,
    targetLow: num(a.target_temp_low),
    targetHigh: num(a.target_temp_high),
    humidity: num(a.current_humidity),
    unit,
    min: num(a.min_temp) ?? (fahrenheit ? 45 : 7),
    max: num(a.max_temp) ?? (fahrenheit ? 95 : 35),
    step: num(a.target_temp_step) ?? (fahrenheit ? 1 : 0.5)
  };
}

const isActive = (t: ProThermostatItem) => t.action === 'heating' || t.action === 'cooling' || t.action === 'drying' || t.action === 'fan';

/**
 * `chosenId`: the thermostat the user picked on the widget (owner, 2026-11-20). Without one (or if
 * it is gone), the active one, else the first that is on, else the first.
 */
export function buildThermostatModel(entities: ResolvedEntity[], chosenId: string | null = null): ProThermostatModel {
  const items = entities.map(buildThermostatItem);
  const chosen = chosenId ? items.find((t) => t.entityId === chosenId) : undefined;
  const primary = chosen ?? items.find(isActive) ?? items.find((t) => t.action !== 'off') ?? items[0] ?? null;
  return { items, primary, activeCount: items.filter(isActive).length, totalCount: items.length };
}

/** Next target inside the device's range, on its step. */
export function stepTarget(t: ProThermostatItem, dir: -1 | 1): number {
  const base = t.target ?? t.current ?? (t.min + t.max) / 2;
  const next = Math.round((base + dir * t.step) / t.step) * t.step;
  return Math.max(t.min, Math.min(t.max, Number(next.toFixed(1))));
}

export const ACTION_LABEL: Record<ThermostatAction, string> = {
  heating: 'Heating',
  cooling: 'Cooling',
  drying: 'Drying',
  fan: 'Fan',
  idle: 'Idle',
  off: 'Off'
};

/** Where the widget's chosen thermostat is kept (`config.preferences`, like the Overview layout). */
export const THERMOSTAT_PREF_KEY = 'proThermostatEntityId';

export function chosenThermostatId(preferences: unknown): string | null {
  const v = (preferences as Record<string, unknown> | undefined)?.[THERMOSTAT_PREF_KEY];
  return typeof v === 'string' && v ? v : null;
}
