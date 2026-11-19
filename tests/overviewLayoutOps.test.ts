import { describe, expect, it } from 'vitest';
import { flowCompactor } from '@/pro/components/overviewNext/flowCompactor';
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
  it('hides a widget (section re-flows) and shows it again at the end', () => {
    const base = buildDefaultDeviceLayout(W, 'desktop');
    const hidden = hideWidget(base, byId.get('weather')!, 6);
    expect(hidden.hidden).toEqual(['weather']);
    expect(hidden.items.climate).toEqual([{ i: 'fans', x: 0, y: 0, size: 's' }]);
    // Normalizing never brings a hidden widget back.
    expect(normalizeDeviceLayout(hidden, W, 'desktop').items.climate?.map((p) => p.i)).toEqual(['fans']);
    const shown = showWidget(hidden, byId.get('weather')!, 6);
    expect(shown.hidden).toEqual([]);
    expect(shown.items.climate).toEqual([
      { i: 'fans', x: 0, y: 0, size: 's' },
      { i: 'weather', x: 1, y: 0, size: 'w' }
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

  it('flow compactor keeps reading order and never overlaps mixed sizes', () => {
    const out = flowCompactor.compact(
      [
        { i: 'a', x: 0, y: 0, w: 2, h: 2 },
        { i: 'b', x: 2, y: 0, w: 1, h: 1 },
        { i: 'c', x: 0, y: 2, w: 2, h: 1 },
        // dragged onto a's spot: react-grid-layout marks it moved → it takes the first place
        { i: 'd', x: 0, y: 0, w: 1, h: 1, moved: true }
      ],
      4
    );
    const pos = Object.fromEntries(out.map((l) => [l.i, [l.x, l.y]]));
    expect(pos).toEqual({ d: [0, 0], a: [1, 0], b: [3, 0], c: [0, 2] });
  });
});
