/**
 * Overview edit-mode draft (rebuild, Phase 1). Edits change only this draft; nothing reaches the
 * shared config until Save. Cancel throws the draft away. One draft at a time, for one device type.
 */
import { create } from 'zustand';
import type { DeviceLayout, DeviceType } from '../lib/overviewLayout';

interface OverviewLayoutDraftState {
  device: DeviceType | null;
  draft: DeviceLayout | null;
  begin: (device: DeviceType, layout: DeviceLayout) => void;
  update: (fn: (layout: DeviceLayout) => DeviceLayout) => void;
  end: () => void;
}

export const useOverviewLayoutDraft = create<OverviewLayoutDraftState>((set) => ({
  device: null,
  draft: null,
  begin: (device, layout) => set({ device, draft: structuredClone(layout) }),
  update: (fn) => set((s) => (s.draft ? { draft: fn(s.draft) } : s)),
  end: () => set({ device: null, draft: null })
}));
