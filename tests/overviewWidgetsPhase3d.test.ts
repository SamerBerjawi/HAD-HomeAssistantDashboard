import { describe, expect, it } from 'vitest';
import type { AutoLayoutStoreState } from '@/store/useAutoLayoutStore';
import { mediaWidget } from '@/pro/widgets/media';
import { MEDIA_FIXTURE, MEDIA_FIXTURE_ENTITIES } from '@/pro/widgets/media/fixture';
import { buildMediaModelFromStore } from '@/pro/widgets/media/useMediaModel';
import { WIDGET_BY_ID, WIDGET_LAYOUT_INFO } from '@/pro/widgets/registry';
import { buildDefaultDeviceLayout } from '@/pro/lib/overviewLayout';
import { vacuumsWidget } from '@/pro/widgets/vacuums';
import { VACUUMS_FIXTURE, VACUUMS_FIXTURE_ENTITIES } from '@/pro/widgets/vacuums/fixture';
import { buildVacuumsModelFromStore, vacuumEntitiesFrom } from '@/pro/widgets/vacuums/useVacuumsModel';

const store = (domainGroups: Record<string, unknown[]>, resolvedEntities: Record<string, unknown> = {}) =>
  ({ domainGroups, resolvedEntities, states: {}, entityRegistry: [], devices: [] }) as unknown as AutoLayoutStoreState;

describe('Phase 3d widgets', () => {
  it('media: the playing player is active', () => {
    expect(MEDIA_FIXTURE.totalCount).toBe(3);
    expect(MEDIA_FIXTURE.playingCount).toBe(1);
    expect(MEDIA_FIXTURE.activePlayer?.entityId).toBe('media_player.living_room');
    expect(mediaWidget.subtitle?.(MEDIA_FIXTURE)).toBe('1 playing');
  });

  it('media: a chosen player wins, hidden players are left out', () => {
    const hidden = { ...MEDIA_FIXTURE_ENTITIES[2], hidden: true };
    const s = store({ media_player: [MEDIA_FIXTURE_ENTITIES[0], MEDIA_FIXTURE_ENTITIES[1], hidden] });
    const m = buildMediaModelFromStore(s, 'media_player.kitchen', false);
    expect(m.totalCount).toBe(2);
    expect(m.activePlayer?.entityId).toBe('media_player.kitchen');
  });

  it('vacuums: the cleaning one comes first', () => {
    expect(VACUUMS_FIXTURE.totalCount).toBe(2);
    expect(VACUUMS_FIXTURE.cleaningCount).toBe(1);
    expect(VACUUMS_FIXTURE.primaryVacuum?.entityId).toBe('vacuum.downstairs');
    expect(VACUUMS_FIXTURE.primaryVacuum?.batteryPct).toBe(64);
    expect(vacuumsWidget.attention?.(VACUUMS_FIXTURE)).toBeNull();
  });

  it('vacuums: falls back to any vacuum.* entity, skips disabled ones', () => {
    const disabled = { ...VACUUMS_FIXTURE_ENTITIES[1], disabled_by: 'user' };
    const s = store({}, { [VACUUMS_FIXTURE_ENTITIES[0].entity_id]: VACUUMS_FIXTURE_ENTITIES[0], [disabled.entity_id]: disabled });
    expect(vacuumEntitiesFrom(s).map((v) => v.entity_id)).toEqual(['vacuum.downstairs']);
    expect(buildVacuumsModelFromStore(store({})).totalCount).toBe(0);
  });

  it('registers Media and Vacuums in their own sections', () => {
    expect(WIDGET_BY_ID.get('media')?.section).toBe('media');
    expect(WIDGET_BY_ID.get('vacuums')?.section).toBe('vacuums');
    const layout = buildDefaultDeviceLayout(WIDGET_LAYOUT_INFO, 'desktop');
    expect(layout.items.media).toEqual([{ i: 'media', x: 0, y: 0, size: 'w' }]);
  });
});
