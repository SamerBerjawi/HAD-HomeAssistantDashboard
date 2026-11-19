/**
 * Pure view-model, brightness, search filtering, and room grouping helpers for pro Overview
 * Lighting & Switches widgets and shared ControlDetailSheet (docs/pro-ui/DESIGN.md 7.6).
 */
import type { ResolvedEntity } from '@/types';
import type { PillTone } from './overviewPills';

export type ProControlDomain = 'lights' | 'switches';

export interface ProControlItem {
  entityId: string;
  domain: 'light' | 'switch';
  name: string;
  shortName: string;
  roomName: string;
  isOn: boolean;
  brightnessPct: number | null;
  supportsBrightness: boolean;
  powerWatts?: number;
}

export interface ProControlRoomGroup {
  roomName: string;
  items: ProControlItem[];
  onCount: number;
  totalCount: number;
}

export interface ProControlDomainModel {
  domain: ProControlDomain;
  items: ProControlItem[];
  onItems: ProControlItem[];
  onCount: number;
  totalCount: number;
  onRatioPct: number;
  avgBrightnessPct: number | null;
  totalPowerWatts: number;
  badgeText: string;
  badgeTone: PillTone;
  subtitleText: string;
}

const KNOWN_ROOMS = [
  'Living Room',
  'Master Bedroom',
  'Guest Bedroom',
  'Bedroom',
  'Kitchen',
  'Home Office',
  'Office',
  'Studio',
  'Dining Room',
  'Bathroom',
  'Hallway',
  'Entryway',
  'Front Porch',
  'Garage',
  'Patio',
  'Basement',
  'Attic',
  'Laundry'
] as const;

export function deriveLightBrightnessPct(entity: ResolvedEntity): number | null {
  if (entity.domain !== 'light') return null;
  const rawBrightness = entity.attributes?.brightness;
  if (typeof rawBrightness === 'number' && Number.isFinite(rawBrightness)) {
    if (rawBrightness <= 0) return 0;
    return Math.max(1, Math.min(100, Math.round((rawBrightness / 255) * 100)));
  }
  const rawPct = entity.attributes?.brightness_pct;
  if (typeof rawPct === 'number' && Number.isFinite(rawPct)) {
    return Math.max(0, Math.min(100, Math.round(rawPct)));
  }
  return null;
}

export function doesLightSupportBrightness(entity: ResolvedEntity): boolean {
  if (entity.domain !== 'light') return false;
  if (
    typeof entity.attributes?.brightness === 'number' ||
    typeof entity.attributes?.brightness_pct === 'number'
  ) {
    return true;
  }
  const modes = entity.attributes?.supported_color_modes;
  if (Array.isArray(modes) && modes.length > 0) {
    return modes.some((mode) => typeof mode === 'string' && mode !== 'onoff' && mode !== 'unknown');
  }
  return true;
}

export function resolveControlRoomName(entity: ResolvedEntity): string {
  const areaName = entity.area?.name;
  if (typeof areaName === 'string' && areaName.trim()) return areaName.trim();
  const attrArea = entity.attributes?.area_name;
  if (typeof attrArea === 'string' && attrArea.trim()) return attrArea.trim();

  const lower = (entity.name || '').toLowerCase();
  for (const room of KNOWN_ROOMS) {
    if (lower.includes(room.toLowerCase())) return room;
  }
  return 'General';
}

export function deriveShortName(name: string, roomName: string): string {
  if (roomName !== 'General' && name.toLowerCase().startsWith(roomName.toLowerCase())) {
    const stripped = name.slice(roomName.length).replace(/^[\s\-–:]+/, '').trim();
    if (stripped.length >= 3) return stripped;
  }
  return name;
}

export function buildControlDomainModel(
  domain: ProControlDomain,
  entities: ResolvedEntity[]
): ProControlDomainModel {
  const mapped: ProControlItem[] = entities.map((entity) => {
    const name = entity.name || entity.entity_id;
    const roomName = resolveControlRoomName(entity);
    const isOn = entity.state === 'on';
    const powerWatts =
      typeof entity.powerWatts === 'number' && Number.isFinite(entity.powerWatts)
        ? Math.round(entity.powerWatts)
        : typeof entity.attributes?.power === 'number' && Number.isFinite(entity.attributes.power)
          ? Math.round(entity.attributes.power)
          : undefined;

    return {
      entityId: entity.entity_id,
      domain: domain === 'lights' ? 'light' : 'switch',
      name,
      shortName: deriveShortName(name, roomName),
      roomName,
      isOn,
      brightnessPct: domain === 'lights' ? deriveLightBrightnessPct(entity) : null,
      supportsBrightness: domain === 'lights' ? doesLightSupportBrightness(entity) : false,
      powerWatts
    };
  });

  const items = [...mapped].sort(
    (a, b) => Number(b.isOn) - Number(a.isOn) || a.name.localeCompare(b.name)
  );
  const onItems = items.filter((item) => item.isOn);
  const onCount = onItems.length;
  const totalCount = items.length;
  const onRatioPct = totalCount > 0 ? Math.round((onCount / totalCount) * 100) : 0;

  const brightnessValues = onItems
    .map((item) => item.brightnessPct)
    .filter((v): v is number => typeof v === 'number' && v > 0);
  const avgBrightnessPct =
    brightnessValues.length > 0
      ? Math.round(brightnessValues.reduce((sum, v) => sum + v, 0) / brightnessValues.length)
      : null;

  const totalPowerWatts = onItems.reduce((sum, item) => sum + (item.powerWatts ?? 0), 0);

  const badgeTone: PillTone =
    onCount === 0 ? 'default' : domain === 'lights' ? 'warning' : 'accent';

  const badgeText =
    domain === 'lights'
      ? onCount > 0
        ? avgBrightnessPct !== null
          ? `${avgBrightnessPct}% avg`
          : `${onCount} on`
        : 'All off'
      : onCount > 0
        ? `${onCount} on`
        : 'All off';

  let subtitleText: string;
  if (domain === 'lights') {
    if (totalCount === 0) subtitleText = 'No lighting entities found';
    else if (onCount > 0) {
      subtitleText =
        avgBrightnessPct !== null
          ? `${onCount} active · Avg ${avgBrightnessPct}% brightness`
          : `${onCount} of ${totalCount} lights active`;
    } else {
      subtitleText = `All lights off · ${totalCount} ready`;
    }
  } else {
    if (totalCount === 0) subtitleText = 'No switch entities found';
    else if (onCount > 0) {
      subtitleText =
        totalPowerWatts > 0
          ? `${onCount} active · ${totalPowerWatts} W draw`
          : `${onCount} of ${totalCount} switches active`;
    } else {
      subtitleText = `All switches off · ${totalCount} ready`;
    }
  }

  return {
    domain,
    items,
    onItems,
    onCount,
    totalCount,
    onRatioPct,
    avgBrightnessPct,
    totalPowerWatts,
    badgeText,
    badgeTone,
    subtitleText
  };
}

export function filterAndGroupControlItems(
  items: ProControlItem[],
  opts: { query?: string; onlyOn?: boolean } = {}
): ProControlRoomGroup[] {
  const q = (opts.query || '').trim().toLowerCase();
  const onlyOn = Boolean(opts.onlyOn);

  const filtered = items.filter((item) => {
    if (onlyOn && !item.isOn) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.roomName.toLowerCase().includes(q) ||
      item.entityId.toLowerCase().includes(q)
    );
  });

  const byRoom = new Map<string, ProControlItem[]>();
  for (const item of filtered) {
    const list = byRoom.get(item.roomName);
    if (list) list.push(item);
    else byRoom.set(item.roomName, [item]);
  }

  return Array.from(byRoom.entries())
    .map(([roomName, roomItems]) => ({
      roomName,
      items: roomItems,
      onCount: roomItems.filter((i) => i.isOn).length,
      totalCount: roomItems.length
    }))
    .sort((a, b) => Number(b.onCount > 0) - Number(a.onCount > 0) || a.roomName.localeCompare(b.roomName));
}
