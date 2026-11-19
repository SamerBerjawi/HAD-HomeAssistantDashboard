import { describe, expect, it } from 'vitest';
import {
  buildProWidgetCatalog,
  filterProDisplayWidgets,
  getProWidgetSize,
  getProWidgetVisibilityMode,
  nextProWidgetSize,
  proWidgetColSpanClass,
  proWidgetSizeLabel,
  withProResetLayout,
  withProWidgetSize
} from '@/pro/lib/overviewWidgets';
import { mergeConfig } from '@/services/configMerge';
import { DEFAULT_USER_CONFIG } from '@/types/userConfig';
import type { ResolvedEntity } from '@/types';

const camera = (entity_id: string, name: string): ResolvedEntity => ({
  entity_id,
  domain: 'camera',
  name,
  state: 'idle',
  attributes: {},
  area_id: null,
  device_id: null,
  floor_id: null,
  resolutionSource: 'direct_entity_area' as ResolvedEntity['resolutionSource'],
  hidden: false,
  isDiagnostic: false
});

describe('overviewWidgets', () => {
  it('cycles widget sizes across 1x -> 2x -> 2x2 -> 1x and formats labels and grid spans', () => {
    expect(nextProWidgetSize('1x')).toBe('2x');
    expect(nextProWidgetSize('2x')).toBe('2x2');
    expect(nextProWidgetSize('2x2')).toBe('1x');

    expect(proWidgetSizeLabel('1x')).toBe('1×');
    expect(proWidgetSizeLabel('2x')).toBe('2×');
    expect(proWidgetSizeLabel('2x2')).toBe('2×2');

    expect(proWidgetColSpanClass('1x')).toBe('col-span-1');
    expect(proWidgetColSpanClass('2x')).toBe('col-span-1 md:col-span-2');
    expect(proWidgetColSpanClass('2x2')).toBe('col-span-1 md:col-span-2');
  });

  it('resolves saved sizes and catalog defaults', () => {
    expect(getProWidgetSize(undefined, 'weather')).toBe('2x');
    expect(getProWidgetSize(undefined, 'power_flow_chart')).toBe('2x');
    expect(getProWidgetSize(undefined, 'lights')).toBe('1x');
    expect(getProWidgetSize({ lights: '2x2', weather: '1x' }, 'lights')).toBe('2x2');
    expect(getProWidgetSize({ lights: '2x2', weather: '1x' }, 'weather')).toBe('1x');
  });

  it('computes visibility mode and updates widget size immutably', () => {
    const hidden = new Set(['smoke']);
    const tabOnly = new Set(['solar_production']);
    expect(getProWidgetVisibilityMode('smoke', hidden, tabOnly)).toBe('all_off');
    expect(getProWidgetVisibilityMode('solar_production', hidden, tabOnly)).toBe('tab_only');
    expect(getProWidgetVisibilityMode('lights', hidden, tabOnly)).toBe('all_on');

    const updated = withProWidgetSize(DEFAULT_USER_CONFIG, 'lights', '2x2');
    expect(getProWidgetSize(updated.overview?.tileSizes, 'lights')).toBe('2x2');
    expect(updated.overview?.tileSizes?.weather).toBe('2x');

    const reset = withProResetLayout(updated);
    const mergedAfterReset = mergeConfig(updated, reset);
    expect(getProWidgetSize(mergedAfterReset.overview?.tileSizes, 'lights')).toBe('1x');
    expect(getProWidgetSize(mergedAfterReset.overview?.tileSizes, 'weather')).toBe('2x');
  });

  it('appends configured cameras to the widget catalog and filters display widgets by tab and visibility', () => {
    const cams = [camera('camera.front_door', 'Front Door Cam')];
    const catalog = buildProWidgetCatalog(cams);
    expect(catalog.some((w) => w.id === 'camera:camera.front_door' && w.title === 'Front Door Cam')).toBe(true);

    const { displayWidgetIds } = filterProDisplayWidgets({
      savedTileOrder: undefined,
      switchEntities: [],
      vacuumEntities: [],
      surveillanceCameras: cams,
      isEditMode: false,
      hiddenTilesSet: new Set(['doors']),
      hiddenFromAllSet: new Set(['lights']),
      activeOverviewTab: 'all'
    });
    expect(displayWidgetIds).not.toContain('switches');
    expect(displayWidgetIds).not.toContain('vacuums');
    expect(displayWidgetIds).not.toContain('doors');
    expect(displayWidgetIds).not.toContain('lights');
    expect(displayWidgetIds).toContain('camera:camera.front_door');

    const lightsTab = filterProDisplayWidgets({
      savedTileOrder: undefined,
      switchEntities: [],
      vacuumEntities: [],
      surveillanceCameras: cams,
      isEditMode: false,
      hiddenTilesSet: new Set(['doors']),
      hiddenFromAllSet: new Set(['lights']),
      activeOverviewTab: 'lights'
    });
    expect(lightsTab.displayWidgetIds).toEqual(['lights']);

    const energyTab = filterProDisplayWidgets({
      savedTileOrder: undefined,
      switchEntities: [],
      vacuumEntities: [],
      surveillanceCameras: cams,
      isEditMode: false,
      hiddenTilesSet: new Set(),
      hiddenFromAllSet: new Set(),
      activeOverviewTab: 'energy'
    });
    expect(energyTab.displayWidgetIds).toContain('energy_gauges');
    expect(energyTab.displayWidgetIds).toContain('energy_flow');
  });
});
