import { describe, expect, it } from 'vitest';
import { DEFAULT_USER_CONFIG, type UserDashboardConfig } from '@/types/userConfig';
import { migrateLegacyOverview } from '@/pro/lib/overviewLayout';
import { alarmWidget } from '@/pro/widgets/alarm';
import { ALARM_FIXTURE } from '@/pro/widgets/alarm/fixture';
import { camerasWidget } from '@/pro/widgets/cameras';
import { CAMERAS_FIXTURE } from '@/pro/widgets/cameras/fixture';
import { withFeatured } from '@/pro/widgets/cameras/useCamerasModel';
import { motionWidget } from '@/pro/widgets/motion';
import { openingsWidget } from '@/pro/widgets/openings';
import { LEGACY_WIDGET_IDS, WIDGET_BY_ID, WIDGET_LAYOUT_INFO } from '@/pro/widgets/registry';
import { safetyWidget } from '@/pro/widgets/safety';
import { SENSOR_FIXTURE_ENTITIES, sensorFixture } from '@/pro/widgets/sensors/fixture';
import { buildSensorDomainModels, buildSensorGroupModel, classifyBinarySensorsCached } from '@/pro/widgets/sensors/sensorGroup';

const config = (overview: Partial<UserDashboardConfig['overview']>): UserDashboardConfig =>
  ({ ...DEFAULT_USER_CONFIG, overview: { ...DEFAULT_USER_CONFIG.overview, ...overview } }) as UserDashboardConfig;

describe('Phase 3c widgets', () => {
  it('openings merges doors and windows, open ones first', () => {
    const m = sensorFixture('openings');
    expect(m.domains.map((d) => d.domain)).toEqual(['doors', 'windows']);
    expect(m.totalCount).toBe(5);
    expect(m.activeCount).toBe(2);
    expect(m.items.slice(0, 2).every((i) => i.isActive)).toBe(true);
    expect(m.headlineText).toBe('2 open');
    expect(openingsWidget.subtitle?.(m)).toBe('2 of 5 open');
    expect(openingsWidget.attention?.(m)).toEqual({ label: '2 open', tone: 'warning' });
  });

  it('safety merges leak and smoke and turns critical on an alert', () => {
    const calm = sensorFixture('safety');
    expect(calm.totalCount).toBe(3);
    expect(calm.isCritical).toBe(false);
    expect(calm.headlineText).toBe('All clear');
    expect(safetyWidget.attention?.(calm)).toBeNull();

    const wet = SENSOR_FIXTURE_ENTITIES.map((e) => (e.entity_id === 'binary_sensor.kitchen_leak' ? { ...e, state: 'on' } : e));
    const alert = buildSensorGroupModel('safety', buildSensorDomainModels(['leak', 'smoke'], wet));
    expect(alert.isCritical).toBe(true);
    expect(alert.badgeText).toBe('Leak');
    expect(alert.badgeTone).toBe('danger');
    expect(safetyWidget.attention?.(alert)).toEqual({ label: 'Leak detected', tone: 'danger' });
  });

  it('motion counts active zones', () => {
    const m = sensorFixture('motion');
    expect(m.activeCount).toBe(1);
    expect(motionWidget.subtitle?.(m)).toBe('1 of 3 zones');
  });

  it('classifies a sensor array once', () => {
    expect(classifyBinarySensorsCached(SENSOR_FIXTURE_ENTITIES)).toBe(classifyBinarySensorsCached(SENSOR_FIXTURE_ENTITIES));
  });

  it('alarm: panel state, open doors/windows and unlocked locks', () => {
    expect(ALARM_FIXTURE.stateLabel).toBe('Armed home');
    expect(ALARM_FIXTURE.openingsCount).toBe(2);
    expect(ALARM_FIXTURE.unlockedLocksCount).toBe(1);
    expect(alarmWidget.attention?.(ALARM_FIXTURE)).toBeNull();
    expect(alarmWidget.attention?.({ ...ALARM_FIXTURE, isTriggered: true })).toEqual({ label: 'Alarm triggered', tone: 'danger' });
  });

  it('cameras: offline last, a picked camera becomes featured', () => {
    expect(CAMERAS_FIXTURE.totalCount).toBe(3);
    expect(CAMERAS_FIXTURE.cameras.at(-1)?.isOffline).toBe(true);
    expect(withFeatured(CAMERAS_FIXTURE, 'camera.garden').featuredCamera?.entityId).toBe('camera.garden');
    expect(withFeatured(CAMERAS_FIXTURE, 'camera.nope')).toBe(CAMERAS_FIXTURE);
    expect(camerasWidget.sizes).not.toContain('t');
  });

  it('registers every 3c widget in its section', () => {
    expect(WIDGET_BY_ID.get('alarm')?.section).toBe('security');
    expect(WIDGET_BY_ID.get('motion')?.section).toBe('security');
    expect(WIDGET_BY_ID.get('safety')?.section).toBe('security');
    expect(WIDGET_BY_ID.get('cameras')?.section).toBe('cameras');
    expect(WIDGET_BY_ID.get('openings')?.section).toBe('openings');
  });

  it('migrates doors/windows and leak/smoke to the merged widgets', () => {
    const layout = migrateLegacyOverview(
      config({ tileOrder: ['windows', 'doors', 'smoke', 'leak'], tileSizes: { windows: '2x' }, hiddenTiles: ['doors', 'leak', 'smoke'] }),
      WIDGET_LAYOUT_INFO,
      'tablet',
      LEGACY_WIDGET_IDS
    );
    // Windows was still visible, so Openings stays; both Safety sources were hidden.
    expect(layout.hidden).toEqual(['safety']);
    expect(layout.items.openings).toEqual([{ i: 'openings', x: 0, y: 0, size: 'w' }]);
    expect(layout.items.security?.map((p) => p.i)).toEqual(['alarm', 'locks', 'motion']);
  });
});
