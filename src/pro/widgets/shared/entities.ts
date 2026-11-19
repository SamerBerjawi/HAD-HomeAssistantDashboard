/**
 * Per-widget entity selectors (Overview rebuild, Phase 1). The store keeps the identity of
 * `domainGroups[domain]` while none of its entities change (shareGraphStructure), so a widget
 * subscribed to one domain re-renders only when that domain changes.
 */
import { useMemo } from 'react';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { ResolvedEntity } from '@/types';

const EMPTY: ResolvedEntity[] = [];

export const isVisibleEntity = (e: ResolvedEntity) => !e.hidden && !e.disabled_by;

/** Visible entities of one HA domain (e.g. 'light'). */
export function useDomainEntities(domain: string): ResolvedEntity[] {
  const group = useAutoLayoutStore((s) => s.domainGroups[domain] ?? EMPTY);
  return useMemo(() => group.filter(isVisibleEntity), [group]);
}
