import { useCallback } from 'react';
import { create } from 'zustand';
import { haWebSocketService } from '@/services/haWebSocket';
import type { AutoLayoutStoreState } from '@/store/useAutoLayoutStore';
import type { ResolvedEntity } from '@/types';
import { buildMediaOverviewModel, type ProMediaOverviewModel } from '../../lib/overviewMedia';
import { isVisibleEntity, useDerivedModel } from '../shared/entities';

/** The player the card and sheet show (shared, so choosing one in the sheet updates the card). */
export const useMediaSelection = create<{ selected: string | null; select: (entityId: string | null) => void }>((set) => ({
  selected: null,
  select: (selected) => set({ selected })
}));

const EMPTY: ResolvedEntity[] = [];
const ALL = new WeakMap<object, ResolvedEntity[]>();
const allEntities = (resolved: Record<string, ResolvedEntity> | undefined) => {
  if (!resolved) return EMPTY;
  let list = ALL.get(resolved);
  if (!list) {
    list = Object.values(resolved);
    ALL.set(resolved, list);
  }
  return list;
};

/** What the card shows; the full entity is left out so unrelated attribute churn doesn't render. */
const mediaKey = (m: ProMediaOverviewModel) =>
  JSON.stringify([m.players, m.activePlayer?.entityId, m.activeEntity?.attributes?.media_position_updated_at]);

export function buildMediaModelFromStore(s: AutoLayoutStoreState, selected: string | null, isDemo: boolean): ProMediaOverviewModel {
  return buildMediaOverviewModel({
    mediaEntities: (s.domainGroups.media_player ?? EMPTY).filter(isVisibleEntity),
    selectedEntityId: selected,
    devices: s.devices,
    allEntities: allEntities(s.resolvedEntities),
    isDemo
  });
}

export function useMediaModel(): ProMediaOverviewModel {
  const selected = useMediaSelection((s) => s.selected);
  const isDemo = haWebSocketService.isDemo();
  const build = useCallback((s: AutoLayoutStoreState) => buildMediaModelFromStore(s, selected, isDemo), [selected, isDemo]);
  return useDerivedModel(build, mediaKey);
}
