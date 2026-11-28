/** Lights grouped by room, for the Lighting styles (pure). */
import type { ProControlDomainModel, ProControlItem } from '../../../lib/overviewControls';

export interface LightRoom {
  name: string;
  items: ProControlItem[];
  onCount: number;
  /** Average brightness of the lights that are on, 0 when none are (lights without dimming count as 100). */
  level: number;
}

const levelOf = (items: ProControlItem[]) => {
  const on = items.filter((i) => i.isOn);
  if (on.length === 0) return 0;
  return Math.round(on.reduce((sum, i) => sum + (i.brightnessPct ?? 100), 0) / on.length);
};

/** Rooms in the order their first light appears; rooms with lights on first. */
export function lightRooms(model: ProControlDomainModel): LightRoom[] {
  const byRoom = new Map<string, ProControlItem[]>();
  for (const item of model.items) {
    const key = item.roomName || 'Other';
    byRoom.set(key, [...(byRoom.get(key) ?? []), item]);
  }
  const rooms = [...byRoom.entries()].map(([name, items]) => ({ name, items, onCount: items.filter((i) => i.isOn).length, level: levelOf(items) }));
  return rooms.sort((a, b) => Number(b.onCount > 0) - Number(a.onCount > 0));
}

/** 0–1: how much light the home is giving off (share of lights on × their brightness). */
export function glowOf(model: ProControlDomainModel): number {
  if (model.totalCount === 0 || model.onCount === 0) return 0;
  return (model.onCount / model.totalCount) * ((model.avgBrightnessPct ?? 80) / 100);
}

/** Turns a room off when any light is on, else on (one service call per light). */
export function roomTargets(room: LightRoom): { turnOn: boolean; items: ProControlItem[] } {
  const turnOn = room.onCount === 0;
  return { turnOn, items: room.items.filter((i) => i.isOn !== turnOn) };
}
