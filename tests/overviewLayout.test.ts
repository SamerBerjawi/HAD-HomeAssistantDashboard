import { describe, expect, it } from 'vitest';
import { DEFAULT_USER_CONFIG, type UserDashboardConfig } from '@/types/userConfig';
import {
  appendToFlow,
  buildDefaultDeviceLayout,
  flowPlacements,
  moveInFlow,
  readingOrder,
  resizeInFlow,
  cellsFor,
  deviceTypeForWidth,
  getDeviceLayout,
  migrateLegacyOverview,
  normalizeDeviceLayout,
  packPlacements,
  snapToAllowedSize,
  withDeviceLayout,
  withoutDeviceLayout,
  type LayoutWidgetInfo
} from '@/pro/lib/overviewLayout';

const WIDGETS: LayoutWidgetInfo[] = [
  { id: 'lights', section: 'lights', sizes: ['s', 'w', 'l'], defaultSize: 'w' },
  { id: 'weather', section: 'climate', sizes: ['s', 'w', 't', 'l'], defaultSize: 'w' },
  { id: 'fans', section: 'climate', sizes: ['s', 'w'], defaultSize: 's' },
  { id: 'energy_now', section: 'energy', sizes: ['w', 'l'], defaultSize: 'l' },
  { id: 'energy_today', section: 'energy', sizes: ['w', 'l'], defaultSize: 'w' }
];

const config = (extra: Partial<UserDashboardConfig>): UserDashboardConfig => ({ ...DEFAULT_USER_CONFIG, ...extra });

describe('overviewLayout', () => {
  it('picks the device type from width', () => {
    expect(deviceTypeForWidth(375)).toBe('phone');
    expect(deviceTypeForWidth(1024)).toBe('tablet');
    expect(deviceTypeForWidth(1440)).toBe('desktop');
  });

  it('clamps sizes to the column count and snaps a dragged corner to an allowed size', () => {
    expect(cellsFor('l', 1)).toEqual({ w: 1, h: 2 });
    expect(snapToAllowedSize(2, 1, ['s', 'w', 'l'], 6)).toBe('w');
    expect(snapToAllowedSize(3, 3, ['s', 'w', 'l'], 6)).toBe('l');
    expect(snapToAllowedSize(1, 2, ['s', 'w'], 6)).toBe('s');
  });

  it('packs widgets densely, row by row', () => {
    expect(
      packPlacements(
        [
          { i: 'a', size: 'l' },
          { i: 'b', size: 's' },
          { i: 'c', size: 'w' },
          { i: 'd', size: 's' }
        ],
        4
      )
    ).toEqual([
      { i: 'a', x: 0, y: 0, size: 'l' },
      { i: 'b', x: 2, y: 0, size: 's' },
      { i: 'c', x: 2, y: 1, size: 'w' },
      { i: 'd', x: 3, y: 0, size: 's' }
    ]);
  });

  it('builds defaults per section', () => {
    const layout = buildDefaultDeviceLayout(WIDGETS, 'desktop');
    // Rooms (the Areas widget) comes first; this test registry has none, so it is empty.
    expect(layout.sectionOrder.slice(0, 2)).toEqual(['rooms', 'climate']);
    expect(layout.items.climate).toEqual([
      { i: 'weather', x: 0, y: 0, size: 'w' },
      { i: 'fans', x: 2, y: 0, size: 's' }
    ]);
    expect(layout.items.people).toBeUndefined();
  });

  it('cleans stored layouts: unknown ids, wrong sections, disallowed sizes, duplicates, new widgets', () => {
    const layout = normalizeDeviceLayout(
      {
        sectionOrder: ['energy', 'bogus', 'energy'],
        collapsed: ['climate', 7],
        hidden: ['fans', 'gone'],
        items: {
          climate: [{ i: 'fans', x: 5, y: 0, size: 'l' }, { i: 'lights', x: 0, y: 0, size: 's' }, 'junk'],
          energy: [
            { i: 'energy_now', x: -1, y: 2.5, size: 'l' },
            { i: 'energy_now', x: 0, y: 0, size: 'w' }
          ]
        }
      },
      WIDGETS,
      'desktop'
    );
    // Rooms was added after this layout was saved: it goes first, like on a new layout.
    expect(layout.sectionOrder.slice(0, 3)).toEqual(['rooms', 'energy', 'climate']);
    expect(layout.sectionOrder).toHaveLength(11);
    expect(layout.collapsed).toEqual(['climate']);
    expect(layout.hidden).toEqual(['fans']);
    // fans is hidden, so it has no place; weather was missing → added on a new row (the first).
    expect(layout.items.climate).toEqual([{ i: 'weather', x: 0, y: 0, size: 'w' }]);
    // A stored size a widget doesn't allow falls back to its default.
    expect(normalizeDeviceLayout({ items: { climate: [{ i: 'fans', x: 5, y: 0, size: 'l' }] } }, WIDGETS, 'desktop').items.climate?.[0]).toEqual({ i: 'fans', x: 5, y: 0, size: 's' });
    // A bad x/y falls back to 0; the missing energy_today goes on a new row below.
    expect(layout.items.energy).toEqual([
      { i: 'energy_now', x: 0, y: 0, size: 'l' },
      { i: 'energy_today', x: 0, y: 2, size: 'w' }
    ]);
    expect(layout.items.lights).toEqual([{ i: 'lights', x: 0, y: 0, size: 'w' }]);
    expect(normalizeDeviceLayout('nope', WIDGETS, 'phone')).toEqual(buildDefaultDeviceLayout(WIDGETS, 'phone'));
  });

  it('migrates the old tile order, sizes, hidden list and section order, mapping merged ids', () => {
    const old = config({
      overview: {
        tileOrder: ['fans', 'power_flow', 'weather_hourly', 'weather', 'lights'],
        tileSizes: { fans: '2x', power_flow: '2x', weather_hourly: '2x2' } as unknown as Record<string, '1x' | '2x'>,
        hiddenTiles: ['solar_production']
      },
      preferences: { ...DEFAULT_USER_CONFIG.preferences, proOverviewSectionOrder: ['energy'] } as UserDashboardConfig['preferences']
    });
    const map = { power_flow: 'energy_now', solar_production: 'energy_today', weather_hourly: 'weather' };
    const layout = migrateLegacyOverview(old, WIDGETS, 'tablet', map);
    expect(layout.sectionOrder.slice(0, 2)).toEqual(['rooms', 'energy']);
    expect(layout.hidden).toEqual(['energy_today']);
    expect(layout.items.climate).toEqual([
      { i: 'fans', x: 0, y: 0, size: 'w' },
      { i: 'weather', x: 2, y: 0, size: 'l' }
    ]);
    expect(layout.items.energy?.[0]).toEqual({ i: 'energy_now', x: 0, y: 0, size: 'w' });
  });

  it('stores each device type on its own and falls back to migration when missing', () => {
    const base = config({});
    const phone = buildDefaultDeviceLayout(WIDGETS, 'phone');
    const stored = withDeviceLayout(base, 'phone', { ...phone, collapsed: ['energy'] });
    expect(getDeviceLayout(stored, WIDGETS, 'phone').collapsed).toEqual(['energy']);
    expect(getDeviceLayout(stored, WIDGETS, 'desktop').collapsed).toEqual([]);
    const both = withDeviceLayout(stored, 'desktop', buildDefaultDeviceLayout(WIDGETS, 'desktop'));
    const reset = withoutDeviceLayout(both, 'phone');
    expect(getDeviceLayout(reset, WIDGETS, 'phone').collapsed).toEqual([]);
    expect((reset.preferences as { proOverviewLayout?: { desktop?: unknown } }).proOverviewLayout?.desktop).toBeDefined();
    expect(base.overview).toEqual(stored.overview);
  });

  it('flows in reading order without overlaps, whatever the sizes', () => {
    const placed = flowPlacements(
      [
        { i: 'a', size: 'l' },
        { i: 'b', size: 's' },
        { i: 'c', size: 'w' },
        { i: 'd', size: 's' },
        { i: 'e', size: 't' },
        { i: 'f', size: 'w' }
      ],
      4
    );
    const cells = new Set<string>();
    for (const p of placed) {
      const c = cellsFor(p.size, 4);
      for (let y = p.y; y < p.y + c.h; y++)
        for (let x = p.x; x < p.x + c.w; x++) {
          expect(cells.has(`${x},${y}`)).toBe(false);
          cells.add(`${x},${y}`);
        }
    }
    // Order is kept: each widget starts at or after the previous one.
    for (let k = 1; k < placed.length; k++) {
      const prev = placed[k - 1];
      const cur = placed[k];
      expect(cur.y > prev.y || (cur.y === prev.y && cur.x > prev.x)).toBe(true);
    }
  });

  it('moves, resizes and appends within the flow', () => {
    const base = flowPlacements(
      [
        { i: 'a', size: 's' },
        { i: 'b', size: 'w' },
        { i: 'c', size: 's' }
      ],
      4
    );
    expect(readingOrder(moveInFlow(base, 'c', -1, 4)).map((p) => p.i)).toEqual(['a', 'c', 'b']);
    expect(moveInFlow(base, 'a', -1, 4)).toEqual(base);
    const grown = resizeInFlow(base, 'a', 'l', 4);
    expect(grown.find((p) => p.i === 'a')).toEqual({ i: 'a', x: 0, y: 0, size: 'l' });
    expect(readingOrder(appendToFlow(base, 'z', 's', 4)).map((p) => p.i)).toEqual(['a', 'b', 'c', 'z']);
  });
});
