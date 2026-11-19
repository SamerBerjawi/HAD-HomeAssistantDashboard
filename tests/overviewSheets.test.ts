import { describe, expect, it } from 'vitest';
import type { OverviewStatusPill } from '@/pro/lib/overviewPills';
import { isSensorDomain, sheetForPill, sheetForWidget } from '@/pro/lib/overviewSheets';

describe('overviewSheets', () => {
  it('maps widget ids to the one sheet they open', () => {
    expect(sheetForWidget('weather_hourly')).toEqual({ kind: 'weather' });
    expect(sheetForWidget('users')).toEqual({ kind: 'presence' });
    expect(sheetForWidget('switches')).toEqual({ kind: 'control', domain: 'switches' });
    expect(sheetForWidget('camera:camera.porch')).toEqual({ kind: 'cameras', cameraId: 'camera.porch' });
    expect(sheetForWidget('leak')).toEqual({ kind: 'sensor', domain: 'leak' });
    expect(sheetForWidget('power_flow_chart')).toEqual({ kind: 'energy', view: 'power_flow' });
    expect(sheetForWidget('unknown')).toBeNull();
  });

  it('maps status pills, carrying the person to preselect', () => {
    expect(sheetForPill({ kind: 'person', person: { entityId: 'person.sam' } as OverviewStatusPill['person'] })).toEqual({ kind: 'presence', personId: 'person.sam' });
    expect(sheetForPill({ kind: 'person' })).toBeNull();
    expect(sheetForPill({ kind: 'alarm' })).toEqual({ kind: 'alarm' });
    expect(sheetForPill({ kind: 'smoke' })).toEqual({ kind: 'sensor', domain: 'smoke' });
  });

  it('knows the sensor domains', () => {
    expect(isSensorDomain('motion')).toBe(true);
    expect(isSensorDomain('lights')).toBe(false);
  });
});
