import { describe, expect, it } from 'vitest';
import type { HAZone, ResolvedEntity } from '@/types';
import {
  buildOverviewPresenceModel,
  getBatteryBadgeTone,
  getProMinimalBasemapConfig
} from '../src/pro/lib/overviewPresence';

function makePerson(
  entityId: string,
  state: string,
  name: string,
  attrs: Record<string, unknown> = {}
): ResolvedEntity {
  return {
    entity_id: entityId,
    state,
    attributes: attrs,
    domain: 'person',
    name,
    area_id: null,
    floor_id: null,
    device_id: null,
    resolutionSource: 'direct_entity_area',
    hidden: false,
    isDiagnostic: false,
    disabled_by: null
  };
}

const ZONES: HAZone[] = [
  {
    entity_id: 'zone.home',
    name: 'Home',
    latitude: 37.7749,
    longitude: -122.4194,
    radius: 100
  },
  {
    entity_id: 'zone.school',
    name: 'Campus / School',
    latitude: 37.765,
    longitude: -122.44,
    radius: 200
  }
];

describe('overviewPresence helpers', () => {
  it('returns dark and light minimal OpenStreetMap tile configs', () => {
    const dark = getProMinimalBasemapConfig(true);
    const light = getProMinimalBasemapConfig(false);

    expect(dark.primaryTileUrl).toContain('tile.openstreetmap.org');
    expect(light.primaryTileUrl).toContain('tile.openstreetmap.org');
    expect(dark.tileClassName).toBe('pro-osm-tiles-dark');
    expect(light.tileClassName).toBe('pro-osm-tiles-light');
  });

  it('maps battery state to green, orange, and red tones only', () => {
    expect(getBatteryBadgeTone(10, false)).toBe('danger');
    expect(getBatteryBadgeTone(25, false)).toBe('warning');
    expect(getBatteryBadgeTone(85, false)).toBe('success');
    expect(getBatteryBadgeTone(10, true)).toBe('success');
  });

  it('builds member summaries, status tones, and distinct coordinates per zone', () => {
    const sarah = makePerson('person.sarah', 'home', 'Sarah Jenkins', {
      battery: 88,
      location: 'Living Room',
      last_changed: 'Today, 8:15 AM'
    });
    const alex = makePerson('person.alex', 'home', 'Alex Miller', {
      battery: 20,
      location: 'Office'
    });
    const emma = makePerson('person.emma', 'away', 'Emma Miller', {
      battery: 62,
      location: 'Downtown Campus'
    });

    const model = buildOverviewPresenceModel({
      peopleEntities: [sarah, alex, emma],
      resolvedZones: ZONES,
      isDemo: true
    });

    expect(model.homeCount).toBe(2);
    expect(model.awayCount).toBe(1);
    expect(model.summaryBadgeText).toBe('2 home');
    expect(model.summaryBadgeTone).toBe('success');

    const [mSarah, mAlex, mEmma] = model.members;
    expect(mSarah.statusTone).toBe('success');
    expect(mSarah.batteryTone).toBe('success');
    expect(mSarah.lastUpdatedFormatted).toBe('Today, 8:15 AM');
    expect(mAlex.batteryTone).toBe('warning');
    expect(mEmma.statusTone).toBe('default');

    // Emma resolves to zone.school via "Campus", while Sarah & Alex spread around zone.home.
    expect(mEmma.latitude).toBeCloseTo(37.765, 3);
    expect(mEmma.longitude).toBeCloseTo(-122.44, 3);
    expect(mSarah.latitude).not.toBe(mAlex.latitude);
    expect(mSarah.osmUrl).toContain('openstreetmap.org');
  });
});
