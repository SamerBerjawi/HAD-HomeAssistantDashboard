import { describe, expect, it } from 'vitest';
import { makeSettleCompactor } from '@/pro/components/overviewNext/flowCompactor';
import {
  buildDefaultDeviceLayout,
  hideWidget,
  moveSection,
  normalizeDeviceLayout,
  sectionSpan,
  showWidget,
  toggleSectionCollapsed,
  visibleSections,
  type LayoutWidgetInfo
} from '@/pro/lib/overviewLayout';

const W: LayoutWidgetInfo[] = [
  { id: 'weather', section: 'climate', sizes: ['s', 'w', 'l'], defaultSize: 'w' },
  { id: 'fans', section: 'climate', sizes: ['s'], defaultSize: 's' },
  { id: 'lights', section: 'lights', sizes: ['s', 'w'], defaultSize: 'w' },
  { id: 'energy_now', section: 'energy', sizes: ['l'], defaultSize: 'l' }
];
const byId = new Map(W.map((w) => [w.id, w]));

describe('overview layout edit operations', () => {
  it('hides a widget (the others stay put) and shows it again on a new row at the end', () => {
    const base = buildDefaultDeviceLayout(W, 'desktop');
    const hidden = hideWidget(base, byId.get('weather')!, 6);
    expect(hidden.hidden).toEqual(['weather']);
    expect(hidden.items.climate).toEqual([{ i: 'fans', x: 2, y: 0, size: 's' }]);
    // Normalizing never brings a hidden widget back.
    expect(normalizeDeviceLayout(hidden, W, 'desktop').items.climate?.map((p) => p.i)).toEqual(['fans']);
    const shown = showWidget(hidden, byId.get('weather')!, 6);
    expect(shown.hidden).toEqual([]);
    expect(shown.items.climate).toEqual([
      { i: 'fans', x: 2, y: 0, size: 's' },
      { i: 'weather', x: 0, y: 1, size: 'w' }
    ]);
  });

  it('moves sections past the next visible one and toggles collapse', () => {
    const base = buildDefaultDeviceLayout(W, 'desktop');
    expect(visibleSections(base).map((s) => s.section)).toEqual(['climate', 'lights', 'energy']);
    const moved = moveSection(base, 'energy', -1);
    expect(visibleSections(moved).map((s) => s.section)).toEqual(['climate', 'energy', 'lights']);
    expect(moveSection(base, 'climate', -1)).toBe(base);
    expect(toggleSectionCollapsed(toggleSectionCollapsed(base, 'lights'), 'lights').collapsed).toEqual([]);
  });

  it('spans only the columns a section needs (min 2)', () => {
    const base = buildDefaultDeviceLayout(W, 'desktop');
    expect(sectionSpan(base.items.climate!, 6)).toBe(3);
    expect(sectionSpan(base.items.lights!, 6)).toBe(2);
    expect(sectionSpan([{ i: 'x', x: 0, y: 0, size: 's' }], 6)).toBe(2);
  });

  it('settle compactor: the card in hand goes where it is dropped, the rest make room and come back', () => {
    const before = [
      { i: 'a', x: 0, y: 0, w: 2, h: 2 },
      { i: 'b', x: 2, y: 0, w: 1, h: 1 },
      { i: 'c', x: 0, y: 2, w: 2, h: 1 }
    ];
    let active: string | null = null;
    const base = new Map(before.map((l) => [l.i, { x: l.x, y: l.y }]));
    const compactor = makeSettleCompactor(
      () => active,
      () => base
    );
    const pos = (out: readonly { i: string; x: number; y: number }[]) => Object.fromEntries(out.map((l) => [l.i, [l.x, l.y]]));
    active = 'b';
    // b dropped on a new row under a, with room left on the first row: it stays there.
    expect(pos(compactor.compact([before[0], { ...before[1], x: 2, y: 1 }, before[2]], 4))).toEqual({ a: [0, 0], b: [2, 1], c: [0, 2] });
    // b dragged onto c: c steps down; dragged on to an empty cell, c comes back.
    expect(pos(compactor.compact([before[0], { ...before[1], x: 0, y: 2 }, { ...before[2], y: 3 }], 4))).toEqual({ a: [0, 0], b: [0, 2], c: [0, 3] });
    expect(pos(compactor.compact([before[0], { ...before[1], x: 3, y: 0 }, { ...before[2], y: 3 }], 4))).toEqual({ a: [0, 0], b: [3, 0], c: [0, 2] });
    // b dropped far below: the empty rows close up.
    expect(pos(compactor.compact([before[0], { ...before[1], x: 0, y: 6 }, before[2]], 4))).toEqual({ a: [0, 0], b: [0, 3], c: [0, 2] });
  });
});
