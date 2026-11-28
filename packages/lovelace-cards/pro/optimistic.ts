import { useMemo, useSyncExternalStore } from 'react';
import type { HAState } from '@/types';
import type { Hass } from './runtime';

type Prediction = { base: HAState; state: HAState; timeout: number };
type Predictions = Record<string, Prediction>;

const empty: Predictions = {};
const predictions = new WeakMap<object, Predictions>();
const changes = new EventTarget();
function subscribe(notify: () => void) {
  changes.addEventListener('change', notify);
  return () => changes.removeEventListener('change', notify);
}

function publish(key: object, next: Predictions) {
  predictions.set(key, next);
  changes.dispatchEvent(new Event('change'));
}

function clear(key: object, id: string, expected: Prediction) {
  const current = predictions.get(key);
  if (current?.[id] !== expected) return;
  window.clearTimeout(expected.timeout);
  const next = {...current};
  delete next[id];
  publish(key, next);
}

// Dashboard cards normally share one HA connection. The fallback supports preview hosts.
const preview = {};
const keyOf = (hass: Hass) => hass.connection ?? preview;

export function applyPrediction(hass: Hass, id: string, state: string | null, attributes?: Record<string, unknown>) {
  const base = hass.states[id];
  if (!base) return;
  const key = keyOf(hass);
  const current = predictions.get(key) ?? empty;
  const prior = current[id];
  if (prior) window.clearTimeout(prior.timeout);
  const latest = prior?.base === base ? prior.state : base;
  const prediction = {
    base,
    state: {...latest, state:state ?? latest.state, attributes:{...latest.attributes, ...attributes}},
    timeout: window.setTimeout(() => clear(key, id, prediction), 5000),
  };
  publish(key, {...current,[id]:prediction});
}

export function pendingRollback(hass: Hass, targets: string | string[]) {
  const key = keyOf(hass);
  const current = predictions.get(key);
  return () => {
    for (const id of [targets].flat()) {
      const prediction = current?.[id];
      if (prediction?.base === hass.states[id]) clear(key, id, prediction);
    }
  };
}

export function usePredictedStates(hass: Hass) {
  const key = keyOf(hass);
  const current = useSyncExternalStore(subscribe, () => predictions.get(key) ?? empty);
  return useMemo(() => {
    const active = Object.entries(current).filter(([id, patch]) => hass.states[id] === patch.base);
    if (!active.length) return hass.states;
    return {...hass.states, ...Object.fromEntries(active.map(([id, patch]) => [id, patch.state]))};
  }, [current, hass.states]);
}
