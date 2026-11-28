/**
 * Thermostat history for the sheet's chart (owner review 2026-11-20, WIDGET_DESIGN.md §8 #13).
 * HA keeps the room temperature and the target as climate attributes, so the history is asked
 * for with attributes and read here: one point per recorded change, oldest first.
 */
import { extractHATimestamp } from '@/services/haHistoryService';

export interface ClimatePoint {
  t: number;
  room: number | null;
  target: number | null;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);

/** Reads `history/history_during_period` (compressed `{s, a, lu}` or full rows) for one entity. */
export function parseClimateHistory(res: unknown, entityId: string): ClimatePoint[] {
  let rows: unknown[] = [];
  if (Array.isArray(res)) rows = Array.isArray(res[0]) ? (res[0] as unknown[]) : res;
  else if (res && typeof res === 'object') {
    const r = (res as Record<string, unknown>)[entityId];
    if (Array.isArray(r)) rows = r;
  }
  let last: Record<string, unknown> = {};
  const out: ClimatePoint[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const attrs = (r.a ?? r.attributes) as Record<string, unknown> | undefined;
    if (attrs && typeof attrs === 'object') last = attrs;
    const room = num(last.current_temperature);
    const target = num(last.temperature);
    if (room === null && target === null) continue;
    out.push({ t: extractHATimestamp(r), room, target });
  }
  return out.sort((a, b) => a.t - b.t);
}

/** A believable day for demo mode: the room drifts around the target, a little cooler at night. */
export function demoClimateHistory(room: number | null, target: number | null, now = Date.now(), hours = 24): ClimatePoint[] {
  const base = room ?? target ?? 21;
  const set = target ?? base;
  return Array.from({ length: hours * 2 + 1 }, (_, i) => {
    const t = now - (hours * 2 - i) * 30 * 60_000;
    const hour = new Date(t).getHours() + new Date(t).getMinutes() / 60;
    const wave = Math.sin(((hour - 9) / 24) * Math.PI * 2) * 1.2 + Math.sin(i * 1.7) * 0.15;
    const v = i === hours * 2 ? base : Math.round((base + wave) * 10) / 10;
    return { t, room: v, target: hour >= 23 || hour < 6 ? set - 2 : set };
  });
}

/** Lowest and highest value across both lines, padded so the lines never touch the edges. */
export function climateRange(points: readonly ClimatePoint[]): { lo: number; hi: number } {
  const vals = points.flatMap((p) => [p.room, p.target]).filter((v): v is number => v !== null);
  if (vals.length === 0) return { lo: 15, hi: 25 };
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const pad = Math.max(0.5, (hi - lo) * 0.15);
  return { lo: Math.floor((lo - pad) * 2) / 2, hi: Math.ceil((hi + pad) * 2) / 2 };
}
