import { describe, expect, it } from 'vitest';
import { toggleFavorite } from '@/pro/lib/overviewAreas';
import { moveInFlow, resizeInFlow, appendToFlow, settlePlacements, type LayoutPlacement } from '@/pro/lib/overviewLayout';
import { DEFAULT_OVERVIEW_SECTION_ORDER, sectionTab } from '@/pro/lib/overviewSections';
import { buildThermostatModel, chosenThermostatId, THERMOSTAT_PREF_KEY } from '@/pro/lib/overviewThermostat';
import type { ResolvedEntity } from '@/types';

const climate = (id: string, state: string, attributes: Record<string, unknown> = {}) => ({ entity_id: `climate.${id}`, state, name: id, attributes }) as unknown as ResolvedEntity;
const pos = (ps: readonly LayoutPlacement[]) => Object.fromEntries(ps.map((p) => [p.i, [p.x, p.y]]));

describe('Rooms section', () => {
  it('comes first and has the Climate tab icon', () => {
    expect(DEFAULT_OVERVIEW_SECTION_ORDER[0]).toBe('rooms');
    expect(sectionTab('rooms')).toBe('climate');
  });

  it('favourites toggle in the order they are picked', () => {
    expect(toggleFavorite([], 'kitchen')).toEqual(['kitchen']);
    expect(toggleFavorite(['kitchen'], 'office')).toEqual(['kitchen', 'office']);
    expect(toggleFavorite(['kitchen', 'office'], 'kitchen')).toEqual(['office']);
  });
});

describe('Thermostat choice', () => {
  const list = [climate('living', 'cool', { hvac_action: 'cooling' }), climate('bedroom', 'heat', { hvac_action: 'idle' })];
  it('shows the chosen thermostat, else the active one', () => {
    expect(buildThermostatModel(list).primary?.entityId).toBe('climate.living');
    expect(buildThermostatModel(list, 'climate.bedroom').primary?.entityId).toBe('climate.bedroom');
    expect(buildThermostatModel(list, 'climate.gone').primary?.entityId).toBe('climate.living');
  });
  it('reads the choice from preferences', () => {
    expect(chosenThermostatId({ [THERMOSTAT_PREF_KEY]: 'climate.bedroom' })).toBe('climate.bedroom');
    expect(chosenThermostatId({ [THERMOSTAT_PREF_KEY]: 7 })).toBeNull();
    expect(chosenThermostatId(undefined)).toBeNull();
  });
});

describe('Free placement', () => {
  const row: LayoutPlacement[] = [
    { i: 'a', x: 0, y: 0, size: 'w' },
    { i: 'b', x: 2, y: 0, size: 's' }
  ];
  it('a widget can start a new row with room left on the row above', () => {
    expect(pos(settlePlacements([...row, { i: 'c', x: 0, y: 1, size: 's' }], 6))).toEqual({ a: [0, 0], b: [2, 0], c: [0, 1] });
  });
  it('overlaps move down and empty rows close up', () => {
    expect(pos(settlePlacements([...row, { i: 'c', x: 1, y: 0, size: 's' }], 6, 'c'))).toEqual({ c: [1, 0], a: [0, 1], b: [2, 0] });
    expect(pos(settlePlacements([...row, { i: 'c', x: 0, y: 5, size: 's' }], 6))).toEqual({ a: [0, 0], b: [2, 0], c: [0, 1] });
  });
  it('resizes in place, moves by trading places, adds on a new row', () => {
    expect(pos(resizeInFlow(row, 'a', 'l', 6))).toEqual({ a: [0, 0], b: [2, 0] });
    expect(pos(resizeInFlow(row, 'b', 'w', 3))).toEqual({ a: [0, 1], b: [1, 0] }); // b keeps its place (clamped into the grid), a makes room
    expect(pos(moveInFlow(row, 'b', -1, 6))).toEqual({ a: [2, 0], b: [0, 0] });
    expect(pos(appendToFlow(row, 'c', 's', 6))).toEqual({ a: [0, 0], b: [2, 0], c: [0, 1] });
  });
});
