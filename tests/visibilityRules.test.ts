import { describe, expect, it } from 'vitest';
import {
  applyOverviewVisibilityRules,
  evaluateVisibility,
  isPinnedCardActive,
  normalizeRulesMap,
  normalizeVisibilityRules,
  summarizeVisibilityRules,
  withUpdatedRule,
  type VisibilityEvalContext
} from '../src/pro/lib/visibilityRules';

const baseCtx: VisibilityEvalContext = {
  isActive: true,
  entities: {
    'light.kitchen': { state: 'on' },
    'person.alex': { state: 'home' },
    'sensor.temp': { state: '23.5' },
    'sensor.bad': { state: 'unavailable' }
  },
  device: 'phone',
  user: { id: 'u1', isAdmin: false }
};

describe('visibilityRules', () => {
  it('evaluates empty or absent rules as always visible', () => {
    expect(evaluateVisibility(undefined, baseCtx)).toBe(true);
    expect(evaluateVisibility([], baseCtx)).toBe(true);
  });

  it('evaluates all 5 condition types and AND-combines them', () => {
    expect(evaluateVisibility([{ kind: 'active_only' }], { ...baseCtx, isActive: true })).toBe(true);
    expect(evaluateVisibility([{ kind: 'active_only' }], { ...baseCtx, isActive: false })).toBe(false);

    expect(evaluateVisibility([{ kind: 'state', entityId: 'person.alex', operator: 'eq', value: 'HOME' }], baseCtx)).toBe(true);
    expect(evaluateVisibility([{ kind: 'state', entityId: 'person.alex', operator: 'neq', value: 'home' }], baseCtx)).toBe(false);
    expect(evaluateVisibility([{ kind: 'state', entityId: 'missing.ent', operator: 'neq', value: 'on' }], baseCtx)).toBe(true);
    expect(evaluateVisibility([{ kind: 'state', entityId: 'missing.ent', operator: 'eq', value: 'on' }], baseCtx)).toBe(false);

    expect(evaluateVisibility([{ kind: 'numeric', entityId: 'sensor.temp', operator: 'gt', threshold: 20 }], baseCtx)).toBe(true);
    expect(evaluateVisibility([{ kind: 'numeric', entityId: 'sensor.temp', operator: 'lt', threshold: 20 }], baseCtx)).toBe(false);
    expect(evaluateVisibility([{ kind: 'numeric', entityId: 'sensor.bad', operator: 'gt', threshold: 0 }], baseCtx)).toBe(false);

    expect(evaluateVisibility([{ kind: 'device', devices: ['phone', 'tablet'] }], baseCtx)).toBe(true);
    expect(evaluateVisibility([{ kind: 'device', devices: ['desktop'] }], baseCtx)).toBe(false);

    expect(evaluateVisibility([{ kind: 'user', adminOnly: true }], baseCtx)).toBe(false);
    expect(evaluateVisibility([{ kind: 'user', adminOnly: true }], { ...baseCtx, user: { id: 'u2', isAdmin: true } })).toBe(true);
    expect(evaluateVisibility([{ kind: 'user', userIds: ['u1', 'u2'] }], baseCtx)).toBe(true);
    expect(evaluateVisibility([{ kind: 'user', userIds: ['u2'] }], baseCtx)).toBe(false);

    // Combined AND
    expect(
      evaluateVisibility(
        [
          { kind: 'device', devices: ['phone'] },
          { kind: 'state', entityId: 'person.alex', operator: 'eq', value: 'home' },
          { kind: 'numeric', entityId: 'sensor.temp', operator: 'gt', threshold: 20 }
        ],
        baseCtx
      )
    ).toBe(true);
  });

  it('normalizes rule lists, rule maps, updates, and summaries cleanly', () => {
    const clean = normalizeVisibilityRules([
      { kind: 'active_only' },
      { kind: 'active_only' },
      { kind: 'device', devices: ['phone', 'phone', 'desktop', 'tablet'] }, // all 3 = redundant, dropped
      { kind: 'device', devices: ['phone', 'invalid' as 'phone'] },
      { kind: 'numeric', entityId: 'sensor.temp', operator: 'gt', threshold: NaN }, // dropped
      { kind: 'state', entityId: 'sun.sun', operator: 'eq', value: 'above_horizon' }
    ]);
    expect(clean).toEqual([
      { kind: 'active_only' },
      { kind: 'device', devices: ['phone'] },
      { kind: 'state', entityId: 'sun.sun', operator: 'eq', value: 'above_horizon' }
    ]);
    expect(summarizeVisibilityRules(clean)).toBe('Active only · Phone · sun.sun = above_horizon');
    expect(summarizeVisibilityRules([])).toBe('Always visible');

    expect(normalizeRulesMap({ empty: [] })).toBeUndefined();
    const map1 = withUpdatedRule(undefined, 'lights', [{ kind: 'active_only' }]);
    expect(map1).toEqual({ lights: [{ kind: 'active_only' }] });
    expect(withUpdatedRule(map1, 'lights', [])).toBeUndefined();
  });

  it('evaluates pinned cards activity and filters Overview sections consistently', () => {
    const areas = [
      { area_id: 'kitchen', entities: [{ entity_id: 'light.kitchen', state: 'on' }] },
      { area_id: 'garage', entities: [{ entity_id: 'light.garage', state: 'off' }] }
    ];
    expect(isPinnedCardActive('entity:light.kitchen', baseCtx.entities, areas)).toBe(true);
    expect(isPinnedCardActive('room:kitchen', baseCtx.entities, areas)).toBe(true);
    expect(isPinnedCardActive('room:garage', baseCtx.entities, areas)).toBe(false);

    const sections = [
      { section: 'lights', items: [{ i: 'entity:light.kitchen' }] },
      { section: 'extra', items: [{ i: 'room:garage' }] }
    ];
    const filtered = applyOverviewVisibilityRules(
      sections,
      {
        cardRules: { 'room:garage': [{ kind: 'active_only' }] },
        sectionRules: { lights: [{ kind: 'device', devices: ['phone'] }] }
      },
      {
        entities: baseCtx.entities,
        device: 'phone',
        user: baseCtx.user,
        widgetStatuses: {},
        resolvedAreas: areas
      }
    );
    expect(filtered.map((s) => s.section)).toEqual(['lights']);
  });
});
