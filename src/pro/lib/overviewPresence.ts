/**
 * Pure Family Presence view-model and minimal dark/light OpenStreetMap basemap config for the pro
 * Overview widget and detail sheet (docs/pro-ui/DESIGN.md 7.6). No React, no store.
 */
import { resolvePersonZoneDetails } from '@/services/overview/entityGroups';
import type { HAZone, ResolvedEntity } from '@/types';
import { formatLastUpdated, getLastUpdatedDetail } from '@/utils/dateFormat';
import { personInitials } from './overviewPills';

export type ProPresenceTone = 'success' | 'accent' | 'default';
export type ProBatteryBadgeTone = 'success' | 'warning' | 'danger';

export interface ProMinimalBasemapConfig {
  primaryTileUrl: string;
  fallbackTileUrl: string;
  subdomains: string[];
  containerBgClass: string;
  tileClassName: string;
  attribution: string;
}

export interface ProPersonPresenceItem {
  entityId: string;
  name: string;
  firstName: string;
  initials: string;
  entityPicture?: string;
  rawState: string;
  isHome: boolean;
  isInKnownZone: boolean;
  statusLabel: string;
  statusTone: ProPresenceTone;
  locationLabel: string;
  deviceName: string;
  batteryPct?: number;
  batteryStateLabel: string;
  batteryTone: ProBatteryBadgeTone;
  isCharging: boolean;
  lastUpdatedFormatted: string;
  lastUpdatedRelative?: string;
  latitude?: number;
  longitude?: number;
  osmUrl?: string;
}

export interface ProOverviewPresenceModel {
  members: ProPersonPresenceItem[];
  homeCount: number;
  zoneCount: number;
  awayCount: number;
  totalCount: number;
  summaryBadgeText: string;
  summaryBadgeTone: ProPresenceTone;
  subtitleSummary: string;
  defaultCenter?: [number, number];
}

const DEMO_FALLBACK_COORDS: [number, number] = [37.7749, -122.4194];
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

/**
 * Returns OpenStreetMap tile configuration paired with minimal theme-matched basemap CSS classes
 * (.pro-osm-tiles-dark / .pro-osm-tiles-light) so the street network blends calmly in both modes.
 */
export function getProMinimalBasemapConfig(isDarkMode: boolean): ProMinimalBasemapConfig {
  return {
    primaryTileUrl: OSM_TILE_URL,
    fallbackTileUrl: OSM_TILE_URL,
    subdomains: [],
    containerBgClass: isDarkMode ? 'bg-[#16171a]' : 'bg-[#f4f5f7]',
    tileClassName: isDarkMode ? 'pro-osm-tiles-dark' : 'pro-osm-tiles-light',
    attribution: OSM_ATTRIBUTION
  };
}

/**
 * Semantic green/orange/red battery tone (docs/pro-ui/DESIGN.md 7.6).
 */
export function getBatteryBadgeTone(batteryPct: number | undefined, isCharging: boolean): ProBatteryBadgeTone {
  if (isCharging) return 'success';
  if (batteryPct !== undefined && batteryPct <= 15) return 'danger';
  if (batteryPct !== undefined && batteryPct <= 30) return 'warning';
  return 'success';
}

function readOptionalNumber(val: unknown): number | undefined {
  return typeof val === 'number' && Number.isFinite(val) ? val : undefined;
}

function extractBattery(entity: ResolvedEntity): {
  batteryPct?: number;
  isCharging: boolean;
  batteryStateLabel: string;
} {
  const attr = (entity.attributes || {}) as Record<string, unknown>;
  const batteryPct =
    readOptionalNumber(entity.batteryPct) ??
    readOptionalNumber(attr.battery) ??
    readOptionalNumber(attr.battery_level);

  const rawBatteryState = attr.battery_state ?? attr.battery_status;
  const batteryStateStr = typeof rawBatteryState === 'string' ? rawBatteryState.trim() : '';
  const isCharging = Boolean(
    attr.battery_charging || (batteryStateStr && batteryStateStr.toLowerCase().includes('charg'))
  );

  const batteryStateLabel =
    batteryStateStr ||
    (batteryPct === undefined
      ? 'Unknown'
      : batteryPct >= 90
        ? 'Full'
        : batteryPct <= 20
          ? 'Low'
          : 'Normal');

  return { batteryPct, isCharging, batteryStateLabel };
}

function extractDeviceName(entity: ResolvedEntity, firstName: string): string {
  const attr = (entity.attributes || {}) as Record<string, unknown>;
  const custom = attr.device_friendly_name ?? attr.device_name;
  if (typeof custom === 'string' && custom.trim()) return custom.trim();
  const source = attr.source ?? attr.device_tracker;
  if (typeof source === 'string' && source.trim()) {
    return source
      .replace(/^device_tracker\./, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (ch) => ch.toUpperCase());
  }
  return `${firstName}'s phone`;
}

function matchPersonZone(
  entity: ResolvedEntity,
  isHome: boolean,
  resolvedZones: HAZone[]
): HAZone | undefined {
  const stateLower = (entity.state || '').trim().toLowerCase();
  const direct = resolvedZones.find(
    (z) =>
      z.name.toLowerCase() === stateLower ||
      z.entity_id.toLowerCase() === `zone.${stateLower}` ||
      (isHome && (z.entity_id === 'zone.home' || z.name.toLowerCase() === 'home'))
  );
  if (direct) return direct;

  const attrLoc = typeof entity.attributes?.location === 'string' ? entity.attributes.location.toLowerCase() : '';
  if (!attrLoc) return undefined;

  const words = attrLoc
    .split(/[\s/,_-]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4);

  return resolvedZones.find((z) => {
    const zn = z.name.toLowerCase();
    return words.some((word) => zn.includes(word));
  });
}

export function resolvePersonCoordinates(
  entity: ResolvedEntity,
  resolvedZones: HAZone[],
  isHome: boolean,
  isDemo: boolean
): { latitude?: number; longitude?: number; hasExactCoords: boolean } {
  const lat = readOptionalNumber(entity.attributes?.latitude);
  const lon = readOptionalNumber(entity.attributes?.longitude);
  if (lat !== undefined && lon !== undefined) {
    return { latitude: lat, longitude: lon, hasExactCoords: true };
  }

  const matchedZone = matchPersonZone(entity, isHome, resolvedZones);
  if (matchedZone?.latitude !== undefined && matchedZone?.longitude !== undefined) {
    return { latitude: matchedZone.latitude, longitude: matchedZone.longitude, hasExactCoords: false };
  }

  if (isHome) {
    const homeZone = resolvedZones.find((z) => z.entity_id === 'zone.home' || z.name.toLowerCase() === 'home');
    if (homeZone?.latitude !== undefined && homeZone?.longitude !== undefined) {
      return { latitude: homeZone.latitude, longitude: homeZone.longitude, hasExactCoords: false };
    }
  }

  if (isDemo) {
    return {
      latitude: DEMO_FALLBACK_COORDS[0],
      longitude: DEMO_FALLBACK_COORDS[1],
      hasExactCoords: false
    };
  }

  return { latitude: undefined, longitude: undefined, hasExactCoords: false };
}

export interface BuildOverviewPresenceInput {
  peopleEntities: ResolvedEntity[];
  resolvedZones: HAZone[];
  isDemo?: boolean;
}

export function buildOverviewPresenceModel({
  peopleEntities,
  resolvedZones,
  isDemo = false
}: BuildOverviewPresenceInput): ProOverviewPresenceModel {
  const rawEntries = peopleEntities.map((entity) => {
    const name = entity.name || entity.entity_id;
    const firstName = name.trim().split(/\s+/)[0] || name;
    const zoneDetails = resolvePersonZoneDetails(entity, resolvedZones);
    const { isHome, isInKnownZone, zoneName } = zoneDetails;

    const statusTone: ProPresenceTone = isHome ? 'success' : isInKnownZone ? 'accent' : 'default';
    const statusLabel = isHome ? 'Home' : isInKnownZone ? zoneName : 'Away';

    const attrLocation =
      typeof entity.attributes?.location === 'string' && entity.attributes.location.trim()
        ? entity.attributes.location.trim()
        : '';
    const locationLabel = attrLocation
      ? isHome
        ? `${attrLocation} · Home`
        : attrLocation
      : isHome
        ? 'At home'
        : isInKnownZone
          ? `${zoneName} zone`
          : 'Away from home';

    const { batteryPct, isCharging, batteryStateLabel } = extractBattery(entity);
    const batteryTone = getBatteryBadgeTone(batteryPct, isCharging);
    const deviceName = extractDeviceName(entity, firstName);

    const rawUpdated =
      entity.attributes?.last_seen ??
      entity.attributes?.updated_at ??
      entity.last_updated ??
      entity.last_changed ??
      entity.attributes?.last_changed;
    const detail = getLastUpdatedDetail(rawUpdated as string | number | Date | undefined);
    const lastUpdatedFormatted = detail ? detail.formatted : formatLastUpdated(rawUpdated as string | undefined);
    const lastUpdatedRelative = detail?.relative;

    const coords = resolvePersonCoordinates(entity, resolvedZones, isHome, isDemo);

    return {
      entity,
      coords,
      base: {
        entityId: entity.entity_id,
        name,
        firstName,
        initials: personInitials(name),
        entityPicture: typeof entity.attributes?.entity_picture === 'string' ? entity.attributes.entity_picture : undefined,
        rawState: entity.state || 'unknown',
        isHome,
        isInKnownZone,
        statusLabel,
        statusTone,
        locationLabel,
        deviceName,
        batteryPct: batteryPct !== undefined ? Math.round(batteryPct) : undefined,
        batteryStateLabel,
        batteryTone,
        isCharging,
        lastUpdatedFormatted,
        lastUpdatedRelative
      }
    };
  });

  // Spread members sharing the exact same zone center by ~20m so map pins never stack invisibly.
  const bucketCounts = new Map<string, number>();
  for (const entry of rawEntries) {
    if (entry.coords.latitude !== undefined && entry.coords.longitude !== undefined) {
      const key = `${entry.coords.latitude.toFixed(4)},${entry.coords.longitude.toFixed(4)}`;
      bucketCounts.set(key, (bucketCounts.get(key) || 0) + 1);
    }
  }
  const bucketSeen = new Map<string, number>();

  const members: ProPersonPresenceItem[] = rawEntries.map((entry) => {
    let latitude = entry.coords.latitude;
    let longitude = entry.coords.longitude;
    if (latitude !== undefined && longitude !== undefined && !entry.coords.hasExactCoords) {
      const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
      const count = bucketCounts.get(key) || 1;
      const idx = bucketSeen.get(key) || 0;
      bucketSeen.set(key, idx + 1);
      if (count > 1) {
        const angle = (idx * 2 * Math.PI) / count - Math.PI / 4;
        latitude += Math.cos(angle) * 0.00022;
        longitude += Math.sin(angle) * 0.00026;
      }
    }

    const osmUrl =
      latitude !== undefined && longitude !== undefined
        ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`
        : undefined;

    return {
      ...entry.base,
      latitude,
      longitude,
      osmUrl
    };
  });

  const homeCount = members.filter((m) => m.isHome).length;
  const zoneCount = members.filter((m) => !m.isHome && m.isInKnownZone).length;
  const totalCount = members.length;
  const awayCount = Math.max(0, totalCount - homeCount - zoneCount);

  const summaryBadgeText =
    totalCount === 0
      ? 'No people'
      : homeCount > 0
        ? `${homeCount} home`
        : zoneCount > 0
          ? `${zoneCount} in zone`
          : 'All away';

  const summaryBadgeTone: ProPresenceTone =
    homeCount > 0 ? 'success' : zoneCount > 0 ? 'accent' : 'default';

  let subtitleSummary = 'No household members tracked';
  if (totalCount > 0) {
    if (homeCount === totalCount) {
      subtitleSummary = 'Everyone is currently at home';
    } else if (homeCount === 0 && zoneCount === 0) {
      subtitleSummary = 'All household members are away';
    } else {
      subtitleSummary = members
        .slice(0, 4)
        .map((m) => `${m.firstName} (${m.statusLabel})`)
        .join(' · ');
    }
  }

  const firstPinned = members.find((m) => m.isHome && m.latitude !== undefined) || members.find((m) => m.latitude !== undefined);
  const defaultCenter: [number, number] | undefined =
    firstPinned?.latitude !== undefined && firstPinned?.longitude !== undefined
      ? [firstPinned.latitude, firstPinned.longitude]
      : undefined;

  return {
    members,
    homeCount,
    zoneCount,
    awayCount,
    totalCount,
    summaryBadgeText,
    summaryBadgeTone,
    subtitleSummary,
    defaultCenter
  };
}
