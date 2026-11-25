import { describe, expect, it } from 'vitest';
import type { HAFloor, ResolvedArea } from '@/types';
import { areaSummaryLine, buildAreasModel, findArea } from '@/pro/lib/overviewAreas';
import { AREAS_STATES } from '@/pro/widgets/areas/concepts/states';

const floors = [
  { floor_id: 'up', name: 'Upstairs', level: 1 },
  { floor_id: 'down', name: 'Downstairs', level: 0 }
] as unknown as HAFloor[];

const area = (id: string, name: string, floor: string | null, lights = 0, on = 0) =>
  ({
    area_id: id,
    name,
    icon: '',
    floor_id: floor,
    entitiesByDomain: { light: Array.from({ length: lights }, (_, i) => ({ entity_id: `light.${id}_${i}` })) },
    summary: { lightsOn: on, totalLights: lights, currentTempAvg: 21.25, activeMediaPlayers: 0, motionDetected: false, openContacts: 0, totalPowerWatts: 0 }
  }) as unknown as ResolvedArea;

const AREAS = [area('bed', 'Bedroom', 'up', 2, 1), area('living', 'Living Room', 'down', 3), area('shed', 'Shed', null), area('kitchen', 'Kitchen', 'down')];

describe('Areas model', () => {
  it('keeps favourites in the user order and groups areas by floor, floorless last', () => {
    const m = buildAreasModel(AREAS, floors, ['kitchen', 'bed', 'gone']);
    expect(m.favorites.map((a) => a.areaId)).toEqual(['kitchen', 'bed']);
    expect(m.favoritesAreDefault).toBe(false);
    expect(m.floors.map((f) => f.name)).toEqual(['Downstairs', 'Upstairs', 'Other areas']);
    expect(m.floors[0].areas.map((a) => a.areaId)).toEqual(['living', 'kitchen']);
    expect(m.totalCount).toBe(4);
  });

  it('falls back to the first areas when no favourites are set, and skips hidden ones', () => {
    const m = buildAreasModel(AREAS, floors, [], ['living']);
    expect(m.favoritesAreDefault).toBe(true);
    expect(m.favorites.map((a) => a.areaId)).toEqual(['bed', 'shed', 'kitchen']);
    expect(findArea(m, 'living')).toBeNull();
  });

  it('carries the light ids and a readable summary', () => {
    const m = buildAreasModel(AREAS, floors, ['bed']);
    const bed = findArea(m, 'bed')!;
    expect(bed.lightIds).toEqual(['light.bed_0', 'light.bed_1']);
    expect(bed.floorName).toBe('Upstairs');
    expect(areaSummaryLine(bed)).toBe('21.3° · 1 light on');
  });

  it('studio states build, including an empty home', () => {
    expect(AREAS_STATES.find((s) => s.id === 'evening')?.model.favorites).toHaveLength(4);
    expect(AREAS_STATES.find((s) => s.id === 'none')?.model.totalCount).toBe(0);
  });

  it('syncs with Rooms floorOrder, hiddenFloors, areaOrder, and areaOverrides', () => {
    const m = buildAreasModel(AREAS, floors, [], [], {
      floorOrder: ['up', 'down'],
      hiddenFloors: [],
      areaOrder: ['kitchen', 'living'],
      overrides: {
        kitchen: { customName: 'Chef Kitchen', customIcon: 'kitchen' }
      }
    });
    expect(m.floors.map((f) => f.floorId)).toEqual(['up', 'down', null]);
    expect(m.floors[1].areas.map((a) => a.areaId)).toEqual(['kitchen', 'living']);
    expect(findArea(m, 'kitchen')).toMatchObject({ name: 'Chef Kitchen', icon: 'kitchen' });

    const withHiddenFloor = buildAreasModel(AREAS, floors, [], [], { hiddenFloors: ['up'] });
    expect(findArea(withHiddenFloor, 'bed')).toBeNull();
    expect(withHiddenFloor.floors.map((f) => f.floorId)).toEqual(['down', null]);
  });
});
