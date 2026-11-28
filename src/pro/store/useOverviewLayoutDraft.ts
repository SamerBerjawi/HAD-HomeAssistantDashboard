/**
 * Overview edit-mode draft (rebuild, Phase 1 + DraftHistory Undo/Redo).
 * Edits change only this draft; nothing reaches the shared config until Save. Cancel throws
 * the draft away. Preserves per-device drafts and up to 20 Undo/Redo steps across device switches.
 */
import { create } from 'zustand';
import {
  createDraftHistory,
  pushDraftHistory,
  redoDraftHistory,
  undoDraftHistory,
  type DraftHistory
} from '../lib/draftHistory';
import type { DeviceLayout, DeviceType } from '../lib/overviewLayout';

interface OverviewLayoutDraftState {
  device: DeviceType | null;
  draft: DeviceLayout | null;
  drafts: Partial<Record<DeviceType, DeviceLayout>>;
  histories: Partial<Record<DeviceType, DraftHistory<DeviceLayout>>>;
  begin: (device: DeviceType, layout: DeviceLayout) => void;
  switchDevice: (device: DeviceType, fallbackLayout: DeviceLayout) => void;
  update: (fn: (layout: DeviceLayout) => DeviceLayout) => void;
  replaceDrafts: (nextDrafts: Partial<Record<DeviceType, DeviceLayout>>) => void;
  undo: () => void;
  redo: () => void;
  end: () => void;
}

export const useOverviewLayoutDraft = create<OverviewLayoutDraftState>((set) => ({
  device: null,
  draft: null,
  drafts: {},
  histories: {},
  begin: (device, layout) => {
    const history = createDraftHistory(layout);
    set({
      device,
      draft: history.present,
      drafts: { [device]: history.present },
      histories: { [device]: history }
    });
  },
  switchDevice: (device, fallbackLayout) =>
    set((s) => {
      if (!s.draft) return s;
      const existing = s.histories[device];
      const nextHistory = existing ?? createDraftHistory(fallbackLayout);
      return {
        device,
        draft: nextHistory.present,
        drafts: {
          ...s.drafts,
          ...(s.device ? { [s.device]: s.draft } : {}),
          [device]: nextHistory.present
        },
        histories: {
          ...s.histories,
          [device]: nextHistory
        }
      };
    }),
  update: (fn) =>
    set((s) => {
      if (!s.draft || !s.device) return s;
      const currentHistory = s.histories[s.device] ?? createDraftHistory(s.draft);
      const nextHistory = pushDraftHistory(currentHistory, fn(s.draft));
      if (nextHistory === currentHistory) return s;
      return {
        draft: nextHistory.present,
        drafts: { ...s.drafts, [s.device]: nextHistory.present },
        histories: { ...s.histories, [s.device]: nextHistory }
      };
    }),
  replaceDrafts: (nextDrafts) =>
    set((s) => {
      if (!s.draft || !s.device) return s;
      const nextHistories: Partial<Record<DeviceType, DraftHistory<DeviceLayout>>> = { ...s.histories };
      const nextMap: Partial<Record<DeviceType, DeviceLayout>> = { ...s.drafts };
      for (const [devKey, layout] of Object.entries(nextDrafts)) {
        if (!layout) continue;
        const dev = devKey as DeviceType;
        const baseHistory = nextHistories[dev] ?? createDraftHistory(layout);
        const pushed = pushDraftHistory(baseHistory, layout);
        nextHistories[dev] = pushed;
        nextMap[dev] = pushed.present;
      }
      return {
        draft: nextMap[s.device] ?? s.draft,
        drafts: nextMap,
        histories: nextHistories
      };
    }),
  undo: () =>
    set((s) => {
      if (!s.device) return s;
      const currentHistory = s.histories[s.device];
      if (!currentHistory) return s;
      const nextHistory = undoDraftHistory(currentHistory);
      if (nextHistory === currentHistory) return s;
      return {
        draft: nextHistory.present,
        drafts: { ...s.drafts, [s.device]: nextHistory.present },
        histories: { ...s.histories, [s.device]: nextHistory }
      };
    }),
  redo: () =>
    set((s) => {
      if (!s.device) return s;
      const currentHistory = s.histories[s.device];
      if (!currentHistory) return s;
      const nextHistory = redoDraftHistory(currentHistory);
      if (nextHistory === currentHistory) return s;
      return {
        draft: nextHistory.present,
        drafts: { ...s.drafts, [s.device]: nextHistory.present },
        histories: { ...s.histories, [s.device]: nextHistory }
      };
    }),
  end: () => set({ device: null, draft: null, drafts: {}, histories: {} })
}));
