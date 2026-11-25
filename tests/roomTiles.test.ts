import { describe, expect, it } from 'vitest';
import { AMBIENT, autoTileSize, bandLayout, bandMetrics, cssHue, nearestAmbient, packTileBands, roomActions, roomAmbient, tileColumns, tileSizeFor, type TileSize } from '@/pro/lib/roomTiles';

const thermostat = (action: string) => ({ action }) as never;
const room = (over: Record<string, unknown> = {}) => ({
  areaId: 'r',
  totalLights: 0,
  lightsOn: 0,
  thermostat: null,
  media: null,
  mediaPlaying: 0,
  fanIds: [] as string[],
  fansOn: 0,
  coverIds: [] as string[],
  scenes: [] as { entityId: string; name: string }[],
  deviceCount: 0,
  isFavorite: false,
  temperature: null,
  humidity: null,
  lightColor: null,
  color: 'hsl(255 42% 48%)',
  ...over
});

describe('roomActions', () => {
  it('offers only what the room has, most wanted first', () => {
    expect(roomActions(room())).toEqual([]);
    expect(roomActions(room({ totalLights: 2, coverIds: ['cover.a'], media: { entityId: 'media_player.tv', playing: false, title: null } }))).toEqual(['lights', 'media', 'cover']);
  });
  it('drops actions the user switched off', () => {
    expect(roomActions(room({ totalLights: 2, fanIds: ['fan.a'] }), new Set(['fan'] as const))).toEqual(['fan']);
  });
  it('honors per-room customQuickActions ordering and filters missing device capabilities', () => {
    expect(
      roomActions(
        room({
          totalLights: 2,
          coverIds: ['cover.garage'],
          fanIds: ['fan.a'],
          customQuickActions: ['cover', 'media', 'lights']
        })
      )
    ).toEqual(['cover', 'lights']);
    expect(
      roomActions(
        room({
          totalLights: 2,
          customQuickActions: []
        })
      )
    ).toEqual([]);
  });
});

describe('autoTileSize', () => {
  it('is compact for rooms with little to control, whatever their name', () => {
    expect(autoTileSize(room({ deviceCount: 1 }))).toBe('compact');
    expect(autoTileSize(room({ totalLights: 1, deviceCount: 1, temperature: 20 }))).toBe('compact');
  });
  it('does not grow a room for its thermostat alone', () => {
    expect(autoTileSize(room({ thermostat: thermostat('heating'), deviceCount: 7 }))).toBe('compact');
    expect(autoTileSize(room({ totalLights: 1, thermostat: thermostat('heating') }))).toBe('compact');
  });
  it('is standard for a typical room and expanded for a rich one or a busy favourite', () => {
    expect(autoTileSize(room({ totalLights: 3, deviceCount: 4 }))).toBe('standard');
    expect(autoTileSize(room({ totalLights: 2, thermostat: thermostat('idle'), fanIds: ['fan.a'] }))).toBe('standard');
    expect(autoTileSize(room({ totalLights: 3, media: { entityId: 'm', playing: true, title: null } }))).toBe('expanded');
    expect(autoTileSize(room({ totalLights: 3, fanIds: ['fan.a'], coverIds: ['cover.a'] }))).toBe('expanded');
    expect(autoTileSize(room({ totalLights: 3, fanIds: ['fan.a'], isFavorite: true }))).toBe('expanded');
  });
  it('follows the user, and "All compact" wins', () => {
    const r = room({ totalLights: 3 });
    expect(tileSizeFor(r, { r: 'expanded' })).toBe('expanded');
    expect(tileSizeFor(r, { r: 'auto' })).toBe('standard');
    expect(tileSizeFor(r, { r: 'expanded' }, true)).toBe('compact');
    expect(tileSizeFor(room({ deviceCount: 1 }), { r: 'expanded' }, 'standard')).toBe('standard');
  });
});

describe('roomAmbient', () => {
  const amb = (over: Record<string, unknown>, own = true) => roomAmbient(room(over) as never, own);
  it('lights glow amber, with media violet underneath', () => {
    expect(amb({ lightsOn: 2 })).toMatchObject({ primary: AMBIENT.amber, secondary: null, level: 'active' });
    expect(amb({ lightsOn: 2, mediaPlaying: 1 })).toMatchObject({ primary: AMBIENT.amber, secondary: AMBIENT.violet });
  });
  it('uses the lights own colour when asked', () => {
    expect(amb({ lightsOn: 1, lightColor: 'rgb(255 0 120)' }).primary).toBe('255, 0, 120');
    expect(amb({ lightsOn: 1, lightColor: 'rgb(255 0 120)' }, false).primary).toBe(AMBIENT.amber);
  });
  it('never turns a tile orange for heating: a calm tile with a soft glow from below', () => {
    expect(amb({ thermostat: thermostat('heating') })).toMatchObject({ level: 'calm', secondary: AMBIENT.rose, name: 'violet' });
    expect(amb({ thermostat: thermostat('cooling'), lightsOn: 1 })).toMatchObject({ primary: AMBIENT.amber, secondary: AMBIENT.blue });
  });
  it('media alone is violet, fans teal, idle a hint of the room colour', () => {
    expect(amb({ mediaPlaying: 1 }).primary).toBe(AMBIENT.violet);
    expect(amb({ fansOn: 1 }).primary).toBe(AMBIENT.teal);
    expect(amb({})).toMatchObject({ level: 'idle', name: 'violet' });
  });
  it('maps colours to the nearest palette tone', () => {
    expect(cssHue('#ff0000')).toBe(0);
    expect(cssHue('hsl(188 42% 48%)')).toBe(188);
    expect(nearestAmbient('hsl(28 42% 48%)')).toBe('amber');
    expect(nearestAmbient('#3e63dd')).toBe('blue');
    expect(nearestAmbient('#888888')).toBe('neutral');
  });
});

describe('packTileBands', () => {
  const tiles = (sizes: TileSize[]) => sizes.map((size, i) => ({ item: `r${i}`, size }));
  const widths = (bands: ReturnType<typeof packTileBands<string>>) => bands.map((b) => b.map((x) => x.width));
  const ids = (bands: ReturnType<typeof packTileBands<string>>) => bands.map((b) => b.map((x) => x.items.map((t) => t.item).join('+')));

  it('pairs compact tiles into one column and keeps order', () => {
    const bands = packTileBands(tiles(['expanded', 'standard', 'compact', 'compact', 'compact', 'compact']), 5);
    expect(widths(bands)).toEqual([[2, 1, 1, 1]]);
    expect(ids(bands)).toEqual([['r0', 'r1', 'r2+r3', 'r4+r5']]);
  });
  it('lets a tile that fits go before a wide one that does not', () => {
    const bands = packTileBands(tiles(['standard', 'standard', 'expanded', 'standard']), 3);
    expect(ids(bands)).toEqual([['r0', 'r1', 'r3'], ['r2']]);
  });
  it('narrows a wide tile into the space left when nothing else fits', () => {
    const bands = packTileBands(tiles(['expanded', 'expanded']), 3);
    expect(ids(bands)).toEqual([['r0', 'r1']]);
    expect(widths(bands)).toEqual([[2, 1]]);
  });
  it('makes compact tiles full-width rows on phones', () => {
    expect(widths(packTileBands(tiles(['compact', 'standard', 'standard', 'compact']), 2, true))).toEqual([[2], [1, 1], [2]]);
  });
  it('never makes a tile wider than the grid', () => {
    expect(widths(packTileBands(tiles(['expanded']), 1))).toEqual([[1]]);
  });
  it('places every tile exactly once', () => {
    const sizes: TileSize[] = ['compact', 'expanded', 'standard', 'compact', 'expanded', 'compact', 'standard', 'standard', 'expanded'];
    for (const cols of [2, 3, 4, 5, 6]) {
      for (const rows of [false, true]) {
        const bands = packTileBands(tiles(sizes), cols, rows);
        const placed = bands.flatMap((b) => b.flatMap((x) => x.items.map((t) => t.item)));
        expect(placed.sort()).toEqual(sizes.map((_, i) => `r${i}`).sort());
        for (const band of bands) expect(band.reduce((n, b) => n + b.width, 0)).toBeLessThanOrEqual(cols);
      }
    }
  });
});

describe('grid metrics', () => {
  it('uses 2 columns on phones and up to 6 on wide screens', () => {
    expect(tileColumns(343)).toBe(2);
    expect(tileColumns(626)).toBe(3);
    expect(tileColumns(1140)).toBe(5);
    expect(tileColumns(3000)).toBe(6);
  });
  it('fills a last row of two or more tiles and keeps a lone last tile from stretching', () => {
    const m = bandMetrics(1200);
    const two = packTileBands([{ item: 'a', size: 'standard' as const }, { item: 'b', size: 'expanded' as const }], 5);
    expect(bandLayout(two[0], 5, true, m)).toMatchObject({ weights: [1, 2], spacer: 0, height: m.large });
    const one = packTileBands([{ item: 'a', size: 'standard' as const }], 5);
    expect(bandLayout(one[0], 5, true, m)).toMatchObject({ weights: [2], spacer: 3, height: m.band });
  });
  it('keeps an even "All standard" grid even: a short last row leaves the rest empty', () => {
    const m = bandMetrics(1200);
    const bands = packTileBands(['a', 'b', 'c', 'd', 'e'].map((item) => ({ item, size: 'standard' as const })), 4);
    expect(bandLayout(bands[1], 4, true, m, 12, true)).toMatchObject({ weights: [1], spacer: 3, height: m.band });
    expect(tileColumns(1140, 12, 288)).toBe(3);
  });
  it('gives rows of single compact tiles their own short height', () => {
    const m = bandMetrics(343);
    const rows = packTileBands([{ item: 'a', size: 'compact' as const }], 2, true);
    expect(bandLayout(rows[0], 2, true, m).height).toBe(m.compact);
  });
});
