import { resolveHAGraph } from '@/services/graphResolution';
import type { Hass } from './runtime';

// Home Assistant supplies the same immutable states object to every card on a dashboard.
const cache = new WeakMap<Hass['states'], {
  hass: Hass;
  value: ReturnType<typeof resolve>;
}>();

function resolve(hass: Hass) {
  const areas = Object.values(hass.areas ?? {});
  const devices = Object.values(hass.devices ?? {});
  const floors = Object.values(hass.floors ?? {});
  const entityRegistry = Object.entries(hass.entities ?? {}).map(([id, entry]) => ({
    ...entry,
    entity_id: id,
    hidden_by: entry.hidden ? 'user' : entry.hidden_by,
  }));
  return {
    ...resolveHAGraph(areas, devices, entityRegistry, floors, hass.states),
    states: hass.states, areas, devices, floors, entityRegistry,
  };
}

export function dashboardGraph(hass: Hass) {
  const saved = cache.get(hass.states);
  if (saved && saved.hass.areas === hass.areas && saved.hass.entities === hass.entities &&
      saved.hass.floors === hass.floors && saved.hass.devices === hass.devices) return saved.value;
  const value = resolve(hass);
  cache.set(hass.states, { hass, value });
  return value;
}
