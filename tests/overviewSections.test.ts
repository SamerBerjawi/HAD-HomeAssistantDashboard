import { describe, expect, it } from 'vitest';
import { mergeConfig } from '@/services/configMerge';
import { DEFAULT_USER_CONFIG } from '@/types/userConfig';
import {
  buildOverviewSections,
  getProGroupBySections,
  getProSectionOrder,
  reorderWidgetsWithinSubset,
  resolveResizeSnapSize,
  withProGroupBySections,
  withProSectionOrder
} from '../src/pro/lib/overviewSections';
import { PRO_STANDARD_WIDGETS } from '../src/pro/lib/overviewWidgets';

describe('overviewSections', () => {
  it('groups All-tab widgets into non-duplicated tab sections with adaptive outer BentoGrid spans', () => {
    const widgetIds = PRO_STANDARD_WIDGETS.map((w) => w.id);
    const sections = buildOverviewSections({
      widgetIds,
      catalog: PRO_STANDARD_WIDGETS,
      tileSizes: undefined
    });

    const allGroupedIds = sections.flatMap((s) => s.widgetIds);
    expect(new Set(allGroupedIds).size).toBe(widgetIds.length);
    expect(allGroupedIds.length).toBe(widgetIds.length);

    const lights = sections.find((s) => s.id === 'lights');
    expect(lights?.widgetIds).toEqual(['lights']);
    expect(lights?.outerColSpan).toBe(1);
    expect(lights?.innerGridClass).toBe('grid-cols-1 md:grid-cols-1 xl:grid-cols-1');

    const openings = sections.find((s) => s.id === 'openings');
    expect(openings?.widgetIds).toEqual(['doors', 'windows']);
    expect(openings?.outerColSpan).toBe(2);
    expect(openings?.innerGridClass).toBe('grid-cols-1 md:grid-cols-2 xl:grid-cols-2');

    const energy = sections.find((s) => s.id === 'energy');
    expect(energy?.widgetIds).toHaveLength(8);
    expect(energy?.outerColSpan).toBe(4);
  });

  it('grows a 1-widget section from 1 col to 2 cols when its widget is resized to 2x', () => {
    const sections = buildOverviewSections({
      widgetIds: ['lights', 'switches'],
      catalog: PRO_STANDARD_WIDGETS,
      tileSizes: { lights: '2x' }
    });

    expect(sections.find((s) => s.id === 'lights')?.outerColSpan).toBe(2);
    expect(sections.find((s) => s.id === 'switches')?.outerColSpan).toBe(1);
  });

  it('respects savedSectionOrder and reorders widgets strictly within their section subset', () => {
    const sections = buildOverviewSections({
      widgetIds: ['lights', 'doors', 'windows', 'power_flow'],
      catalog: PRO_STANDARD_WIDGETS,
      tileSizes: undefined,
      savedSectionOrder: ['energy', 'openings', 'lights']
    });
    expect(sections.map((s) => s.id)).toEqual(['energy', 'openings', 'lights']);

    const nextGlobal = reorderWidgetsWithinSubset(
      ['weather', 'lights', 'doors', 'alarm', 'windows'],
      ['doors', 'windows'],
      ['windows', 'doors']
    );
    expect(nextGlobal).toEqual(['weather', 'lights', 'windows', 'alarm', 'doors']);
  });

  it('snaps bottom-right corner drags cleanly to predefined 1x, 2x, and 2x2 sizes', () => {
    // Starting from 1x
    expect(resolveResizeSnapSize('1x', 20, 10)).toBe('1x');
    expect(resolveResizeSnapSize('1x', 64, 10)).toBe('2x');
    expect(resolveResizeSnapSize('1x', 64, 64)).toBe('2x2');
    expect(resolveResizeSnapSize('1x', 10, 90)).toBe('2x2');

    // Starting from 2x
    expect(resolveResizeSnapSize('2x', 10, 10)).toBe('2x');
    expect(resolveResizeSnapSize('2x', -64, 0)).toBe('1x');
    expect(resolveResizeSnapSize('2x', 0, 64)).toBe('2x2');

    // Starting from 2x2
    expect(resolveResizeSnapSize('2x2', 10, 10)).toBe('2x2');
    expect(resolveResizeSnapSize('2x2', 0, -64)).toBe('2x');
    expect(resolveResizeSnapSize('2x2', -64, -64)).toBe('1x');
    expect(resolveResizeSnapSize('2x2', -90, 0)).toBe('1x');
  });

  it('persists groupBySections and sectionOrder cleanly through mergeConfig', () => {
    const toggled = withProGroupBySections(DEFAULT_USER_CONFIG, true);
    const reordered = withProSectionOrder(toggled, ['energy', 'lights', 'security']);
    const merged = mergeConfig(DEFAULT_USER_CONFIG, reordered);

    expect(getProGroupBySections(merged)).toBe(true);
    expect(getProSectionOrder(merged)).toEqual(['energy', 'lights', 'security']);
  });
});
