/**
 * Per-widget entity selectors (Overview rebuild, Phase 1). The store keeps the identity of
 * `domainGroups[domain]` while none of its entities change (shareGraphStructure), so a widget
 * subscribed to one domain re-renders only when that domain changes.
 */
import { useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAutoLayoutStore, type AutoLayoutStoreState } from '@/store/useAutoLayoutStore';
import type { ResolvedEntity } from '@/types';

const EMPTY: ResolvedEntity[] = [];

export const isVisibleEntity = (e: ResolvedEntity) => !e.hidden && !e.disabled_by;

/** Visible entities of one HA domain (e.g. 'light'). */
export function useDomainEntities(domain: string): ResolvedEntity[] {
  const group = useAutoLayoutStore((s) => s.domainGroups[domain] ?? EMPTY);
  return useMemo(() => group.filter(isVisibleEntity), [group]);
}

/** Every entity of one domain, hidden ones included (builders that do their own filtering). */
export function useAllDomainEntities(domain: string): ResolvedEntity[] {
  return useAutoLayoutStore((s) => s.domainGroups[domain] ?? EMPTY);
}

/**
 * Entities from other domains that a widget needs, picked by a test (e.g. a fan's paired
 * temperature sensor). Compared item by item, so it only re-renders when a picked entity changes,
 * not on every sensor tick.
 */
export function usePickedEntities(domains: readonly string[], pick: (e: ResolvedEntity) => boolean): ResolvedEntity[] {
  return useAutoLayoutStore(useShallow((s) => domains.flatMap((d) => (s.domainGroups[d] ?? EMPTY).filter(pick))));
}

/**
 * A model derived from the whole store (e.g. vacuums with their battery sensors). It is rebuilt on
 * every store change but only re-renders the widget when `key` (a cheap fingerprint, e.g. JSON)
 * changes, so sensor ticks elsewhere in the house cost a rebuild, not a render.
 */
export function useDerivedModel<T>(build: (s: AutoLayoutStoreState) => T, key: (value: T) => string): T {
  const prev = useRef<{ key: string; value: T } | null>(null);
  return useAutoLayoutStore((s) => {
    const value = build(s);
    const k = key(value);
    if (prev.current && prev.current.key === k) return prev.current.value;
    prev.current = { key: k, value };
    return value;
  });
}
