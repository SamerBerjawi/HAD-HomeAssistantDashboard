import { describe, expect, it } from 'vitest';
import { buildControlDomainModel } from '@/pro/lib/overviewControls';
import { normalizeDeviceLayout, WIDGET_SIZES } from '@/pro/lib/overviewLayout';
import { DEFAULT_OVERVIEW_SECTION_ORDER } from '@/pro/lib/overviewSections';
import { LIGHTS_FIXTURE, LIGHTS_FIXTURE_ENTITIES } from '@/pro/widgets/lights/fixture';
import { lightsWidget } from '@/pro/widgets/lights';
import { LEGACY_WIDGET_IDS, WIDGET_BY_ID, WIDGET_LAYOUT_INFO, WIDGETS } from '@/pro/widgets/registry';
import { shareGraphStructure } from '@/services/graphResolution';
import type { ResolvedEntity } from '@/types';

describe('widget registry', () => {
  it('has unique ids, known sections and sizes, and a default size each widget allows', () => {
    expect(new Set(WIDGETS.map((w) => w.id)).size).toBe(WIDGETS.length);
    for (const w of WIDGETS) {
      expect(DEFAULT_OVERVIEW_SECTION_ORDER).toContain(w.section);
      expect(w.sizes.length).toBeGreaterThan(0);
      for (const size of w.sizes) expect(WIDGET_SIZES).toContain(size);
      expect(w.sizes).toContain(w.defaultSize);
      expect(w.fixture).toBeDefined();
    }
    expect(WIDGET_BY_ID.get('lights')).toBeDefined();
  });

  it('maps legacy ids only onto registered widgets', () => {
    for (const id of Object.values(LEGACY_WIDGET_IDS)) expect(WIDGET_BY_ID.has(id)).toBe(true);
  });

  it('gives every registered widget a default place', () => {
    const layout = normalizeDeviceLayout(undefined, WIDGET_LAYOUT_INFO, 'phone');
    const placed = Object.values(layout.items).flat().map((p) => p?.i);
    for (const w of WIDGETS) expect(placed).toContain(w.id);
  });

  it('lights: fixture and subtitle', () => {
    expect(LIGHTS_FIXTURE.totalCount).toBe(10);
    expect(LIGHTS_FIXTURE.onCount).toBe(8);
    expect(lightsWidget.subtitle?.(LIGHTS_FIXTURE)).toBe('8 of 10 on');
    expect(lightsWidget.subtitle?.(buildControlDomainModel('lights', []))).toBe('No lights');
  });

  it('keeps the light group identity when only a switch changes (per-widget re-renders)', () => {
    const sw = { entity_id: 'switch.kettle', domain: 'switch', state: 'off' } as unknown as ResolvedEntity;
    const prev = { light: [...LIGHTS_FIXTURE_ENTITIES], switch: [sw] };
    const next = { light: [...LIGHTS_FIXTURE_ENTITIES], switch: [{ ...sw, state: 'on' } as ResolvedEntity] };
    const shared = shareGraphStructure(prev, next);
    expect(shared.light).toBe(prev.light);
    expect(shared.switch).not.toBe(prev.switch);
  });
});
