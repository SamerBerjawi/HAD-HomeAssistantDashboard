import { describe, expect, it } from 'vitest';
import type { ResolvedEntity } from '@/types';
import {
  buildControlDomainModel,
  deriveLightBrightnessPct,
  doesLightSupportBrightness,
  filterAndGroupControlItems
} from '../src/pro/lib/overviewControls';

function makeControlEntity(
  entityId: string,
  state: 'on' | 'off',
  name: string,
  attrs: Record<string, unknown> = {},
  areaName?: string
): ResolvedEntity {
  const domain = entityId.split('.')[0];
  return {
    entity_id: entityId,
    state,
    attributes: attrs,
    domain,
    name,
    area_id: areaName ? areaName.toLowerCase().replace(/\s+/g, '_') : null,
    area: areaName ? { area_id: areaName.toLowerCase(), name: areaName } : null,
    floor_id: null,
    device_id: null,
    resolutionSource: 'direct_entity_area',
    hidden: false,
    isDiagnostic: false,
    disabled_by: null
  };
}

describe('overviewControls helpers', () => {
  it('derives brightness percentage and dimmability accurately', () => {
    const dim = makeControlEntity('light.sofa', 'on', 'Sofa Lamp', { brightness: 128 });
    const full = makeControlEntity('light.ceil', 'on', 'Ceiling', { brightness: 255 });
    const onOffOnly = makeControlEntity('light.porch', 'on', 'Porch', { supported_color_modes: ['onoff'] });

    expect(deriveLightBrightnessPct(dim)).toBe(50);
    expect(deriveLightBrightnessPct(full)).toBe(100);
    expect(doesLightSupportBrightness(dim)).toBe(true);
    expect(doesLightSupportBrightness(onOffOnly)).toBe(false);
  });

  it('builds lights and switches models with active-first sort and semantic badge tones', () => {
    const l1 = makeControlEntity('light.kitchen_island', 'off', 'Kitchen Island', {}, 'Kitchen');
    const l2 = makeControlEntity('light.living_floor', 'on', 'Living Floor Lamp', { brightness: 204 }, 'Living Room');
    const l3 = makeControlEntity('light.living_sconce', 'on', 'Living Sconce', { brightness: 102 }, 'Living Room');

    const lightsModel = buildControlDomainModel('lights', [l1, l2, l3]);
    expect(lightsModel.onCount).toBe(2);
    expect(lightsModel.totalCount).toBe(3);
    expect(lightsModel.avgBrightnessPct).toBe(60);
    expect(lightsModel.badgeTone).toBe('warning');
    expect(lightsModel.items[0].isOn).toBe(true);
    expect(lightsModel.items[2].entityId).toBe('light.kitchen_island');

    const offSwitches = buildControlDomainModel('switches', [
      makeControlEntity('switch.kettle', 'off', 'Kettle Plug', {}, 'Kitchen')
    ]);
    expect(offSwitches.badgeText).toBe('All off');
    expect(offSwitches.badgeTone).toBe('default');
  });

  it('filters by query or onlyOn and groups by room with active rooms first', () => {
    const items = buildControlDomainModel('switches', [
      makeControlEntity('switch.coffee', 'on', 'Coffee Maker', { power: 120 }, 'Kitchen'),
      makeControlEntity('switch.amp', 'off', 'Studio Amp', {}, 'Office'),
      makeControlEntity('switch.toaster', 'off', 'Toaster', {}, 'Kitchen')
    ]).items;

    const allGroups = filterAndGroupControlItems(items);
    expect(allGroups.map((g) => g.roomName)).toEqual(['Kitchen', 'Office']);
    expect(allGroups[0].onCount).toBe(1);

    const onlyOnGroups = filterAndGroupControlItems(items, { onlyOn: true });
    expect(onlyOnGroups).toHaveLength(1);
    expect(onlyOnGroups[0].items).toHaveLength(1);

    const searchGroups = filterAndGroupControlItems(items, { query: 'amp' });
    expect(searchGroups).toHaveLength(1);
    expect(searchGroups[0].roomName).toBe('Office');
  });
});
