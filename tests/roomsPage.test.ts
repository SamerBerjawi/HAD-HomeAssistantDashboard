import { describe, expect, it } from 'vitest';
import type { HAFloor, ResolvedArea } from '@/types';
import { assignRoomColors, buildRoomsPage, hexHue, roomLightColor, roomStatusLine } from '@/pro/lib/roomsPage';

const floors: HAFloor[] = [
  { floor_id: 'first', name: 'First floor', level: 1 },
  { floor_id: 'ground', name: 'Ground floor', level: 0 }
] as HAFloor[];

const area = (area_id: string, floor_id: string | null, summary: Partial<ResolvedArea['summary']>, lights = 0) =>
  ({
    area_id,
    name: area_id.replace(/_/g, ' '),
    icon: '',
    floor_id,
    devices: [{}, {}],
    entities: [],
    entitiesByDomain: { light: Array.from({ length: lights }, (_, i) => ({ entity_id: `light.${area_id}_${i}` })) },
    bannerImage: null,
    summary: {
      totalEntities: 0,
      lightsOn: 0,
      totalLights: lights,
      climatesActive: 0,
      totalClimates: 0,
      activeMediaPlayers: 0,
      totalMediaPlayers: 0,
      totalPowerWatts: 0,
      openContacts: 0,
      motionDetected: false,
      lowBatteryCount: 0,
      activeCleaners: 0,
      activeSwitches: 0,
      ...summary
    }
  }) as unknown as ResolvedArea;

describe('roomsPage', () => {
  const areas = [
    area('bedroom', 'first', { currentTempAvg: 19.5 }, 2),
    area('kitchen', 'ground', { lightsOn: 2, motionDetected: true, currentTempAvg: 22, totalPowerWatts: 120 }, 3),
    area('living_room', 'ground', { activeMediaPlayers: 1, lightsOn: 1, openContacts: 1, currentTempAvg: 21 }, 4),
    area('shed', null, {}),
    area('attic', 'first', { lowBatteryCount: 2 })
  ];

  it('groups rooms by floor, highest first, rooms without a floor last', () => {
    const m = buildRoomsPage(areas, floors);
    expect(m.floors.map((f) => f.name)).toEqual(['First floor', 'Ground floor', 'Other areas']);
    const ground = m.floors[1];
    expect(ground.lightsOn).toBe(3);
    expect(ground.occupied).toBe(2);
    expect(ground.avgTemp).toBe(21.5);
  });

  it('orders what is going on, busiest first, and adds up the home', () => {
    const m = buildRoomsPage(areas, floors, ['kitchen'], ['attic']);
    expect(m.active.map((r) => r.areaId)).toEqual(['living_room', 'kitchen']);
    expect(m.totals).toMatchObject({ rooms: 4, active: 2, occupied: 2, lightsOn: 3, roomsLit: 2, open: 1, powerWatts: 120, minTemp: 19.5, maxTemp: 22, lowBattery: 0 });
    expect(m.rooms.find((r) => r.areaId === 'kitchen')?.isFavorite).toBe(true);
  });

  it('describes a room most telling first', () => {
    const m = buildRoomsPage(areas, floors);
    const living = m.rooms.find((r) => r.areaId === 'living_room')!;
    expect(living.signals).toEqual(['open', 'media', 'lights']);
    expect(roomStatusLine(living)).toBe('1 open · Playing · 1 light on · 21°');
    expect(
      roomStatusLine(
        m.rooms.find((r) => r.areaId === 'bedroom')!,
        false
      )
    ).toBe('All off');
    expect(roomStatusLine(m.rooms.find((r) => r.areaId === 'shed')!)).toBe('Quiet');
  });

  it("follows the user's floor and room order and leaves out hidden floors", () => {
    const m = buildRoomsPage(areas, floors, [], [], { floorOrder: ['ground'], areaOrder: ['living_room'] });
    expect(m.floors.map((f) => f.floorId)).toEqual(['ground', 'first', null]);
    expect(m.floors[0].rooms.map((r) => r.areaId)).toEqual(['living_room', 'kitchen']);
    const hidden = buildRoomsPage(areas, floors, [], [], { hiddenFloors: ['first'] });
    expect(hidden.rooms.map((r) => r.areaId)).toEqual(['kitchen', 'living_room', 'shed']);
  });

  it('gives rooms of the same kind different colours, and keeps chosen ones', () => {
    const c = assignRoomColors(
      [
        { areaId: 'a', name: 'Bedroom' },
        { areaId: 'b', name: 'Guest bedroom' },
        { areaId: 'c', name: 'Kids room' },
        { areaId: 'd', name: 'Office' }
      ],
      { d: '#e5484d' }
    );
    expect(new Set(c.values()).size).toBe(4);
    expect(c.get('d')).toBe('#e5484d');
    expect(c.get('a')).toBe('hsl(255 42% 48%)');
    expect(hexHue('#ff0000')).toBe(0);
    expect(hexHue('#00f')).toBe(240);
    expect(hexHue('nope')).toBeNull();
    const m = buildRoomsPage(areas, floors, [], [], { colors: { kitchen: '#46a758' } });
    expect(m.rooms.find((r) => r.areaId === 'kitchen')).toMatchObject({ color: '#46a758', customColor: true });
  });

  it("takes the lit lights' colour, white and warm white count as none", () => {
    const on = (attributes: Record<string, unknown>) => ({ state: 'on', attributes });
    expect(roomLightColor([on({ rgb_color: [255, 0, 0] }), on({ color: '#0000ff' })])).toBe('rgb(128 0 128)');
    expect(roomLightColor([on({ color: '#ffffff' }), on({ color_temp_kelvin: 2700 })])).toBeNull();
    expect(roomLightColor([on({ color_temp: 160 })])).toBe('rgb(205 222 255)');
    expect(roomLightColor([{ state: 'off', attributes: { rgb_color: [255, 0, 0] } }])).toBeNull();
  });
});
