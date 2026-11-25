/**
 * The saved layout of one room (Area page build, phase 3 + Phase 0/1 multi-user/Auto/3-device/Undo):
 * Customize starts a draft (preserving drafts & 20-step Undo/Redo per device while switching
 * Phone/Tablet/Desktop); Save writes granular patches to `preferences.proAreaLayouts[areaId]` (or
 * `userLayouts[uid]`) and flushes immediately; Cancel or Escape throws the draft away; Reset to
 * Auto restores dynamic defaults. Transient folding outside Edit Mode stays device-local.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LayoutMode } from '@/types/userConfig';
import { useLayoutScope } from '../../hooks/useLayoutScope';
import {
  canRedo as canRedoHistory,
  canUndo as canUndoHistory,
  createDraftHistory,
  pushDraftHistory,
  redoDraftHistory,
  undoDraftHistory,
  type DraftHistory
} from '../../lib/draftHistory';
import {
  areaLayoutPatch,
  areaLayoutResetPatch,
  copyRoomLayout,
  defaultLayout,
  isDirty as isLayoutDirty,
  readAreaLayout,
  reconcile,
  type AreaDevice,
  type RoomItem,
  type RoomLayout,
  type SectionId
} from './roomLayout';
import type { RoomEditor } from './useRoomEditor';

const same = (l: RoomLayout) => l;
const COLLAPSED_KEY = (areaId: string, device: AreaDevice) => `had.pro.room.collapsed.${areaId}.${device}`;

function readLocalCollapsed(areaId: string, device: AreaDevice): SectionId[] | null {
  try {
    const raw = window.localStorage.getItem(COLLAPSED_KEY(areaId, device));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SectionId[]) : null;
  } catch {
    return null;
  }
}

function writeLocalCollapsed(areaId: string, device: AreaDevice, collapsed: SectionId[]) {
  try {
    window.localStorage.setItem(COLLAPSED_KEY(areaId, device), JSON.stringify(collapsed));
  } catch {}
}

export interface AreaLayoutEditor extends RoomEditor {
  mode: LayoutMode;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  copyFromDevice: (source: AreaDevice) => void;
  resetToAuto: () => Promise<void>;
}

export function useAreaLayout(
  areaId: string,
  items: readonly RoomItem[],
  device: AreaDevice,
  init: (l: RoomLayout) => RoomLayout = same
): AreaLayoutEditor {
  const { effectivePrefs, saveScopedPrefs } = useLayoutScope();
  const [localCollapsedTick, setLocalCollapsedTick] = useState(0);

  const getPersistedForDevice = useCallback(
    (d: AreaDevice): RoomLayout => {
      const roomMode = effectivePrefs.roomModes?.[areaId];
      const stored = roomMode === 'auto' ? null : readAreaLayout(effectivePrefs, areaId, d);
      return stored ? reconcile(stored, items, d) : init(defaultLayout(items, d));
    },
    [effectivePrefs, areaId, items, init]
  );

  const mode: LayoutMode = useMemo(() => {
    const explicit = effectivePrefs.roomModes?.[areaId];
    if (explicit === 'auto' || explicit === 'custom') return explicit;
    return readAreaLayout(effectivePrefs, areaId, device) ? 'custom' : 'auto';
  }, [effectivePrefs, areaId, device]);

  const persistedSaved = useMemo(() => getPersistedForDevice(device), [getPersistedForDevice, device]);

  const viewSaved = useMemo(() => {
    const local = readLocalCollapsed(areaId, device);
    return local ? { ...persistedSaved, collapsed: local } : persistedSaved;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedSaved, areaId, device, localCollapsedTick]);

  const [histories, setHistories] = useState<Partial<Record<AreaDevice, DraftHistory<RoomLayout>>> | null>(null);
  const editing = histories !== null;

  // Switching to a different room resets the draft session.
  useEffect(() => setHistories(null), [areaId]);
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented && !document.querySelector('[role="dialog"]')) setHistories(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing]);

  const activeHistory = editing ? histories[device] ?? null : null;
  const activeDraft = activeHistory ? activeHistory.present : editing ? persistedSaved : null;
  const canUndo = canUndoHistory(activeHistory);
  const canRedo = canRedoHistory(activeHistory);

  const dirty = useMemo(() => {
    if (!histories) return false;
    return Object.entries(histories).some(([d, h]) => h && isLayoutDirty(h.present, getPersistedForDevice(d as AreaDevice)));
  }, [histories, getPersistedForDevice]);

  const begin = useCallback(() => {
    setHistories({ [device]: createDraftHistory(persistedSaved) });
  }, [device, persistedSaved]);

  const cancel = useCallback(() => setHistories(null), []);

  const update = useCallback(
    (fn: (l: RoomLayout) => RoomLayout) => {
      setHistories((prev) => {
        if (!prev) return prev;
        const base = prev[device] ?? createDraftHistory(persistedSaved);
        const nextHistory = pushDraftHistory(base, fn(base.present));
        if (nextHistory === base) return prev;
        return { ...prev, [device]: nextHistory };
      });
    },
    [device, persistedSaved]
  );

  const undo = useCallback(() => {
    setHistories((prev) => {
      if (!prev || !prev[device]) return prev;
      const next = undoDraftHistory(prev[device]!);
      return next === prev[device] ? prev : { ...prev, [device]: next };
    });
  }, [device]);

  const redo = useCallback(() => {
    setHistories((prev) => {
      if (!prev || !prev[device]) return prev;
      const next = redoDraftHistory(prev[device]!);
      return next === prev[device] ? prev : { ...prev, [device]: next };
    });
  }, [device]);

  const copyFromDevice = useCallback(
    (source: AreaDevice) => {
      const sourceLayout = histories?.[source]?.present ?? getPersistedForDevice(source);
      update(() => copyRoomLayout(sourceLayout, items, device));
    },
    [histories, getPersistedForDevice, update, items, device]
  );

  const save = useCallback(() => {
    if (!histories) return;
    const areaPatch: Record<string, unknown> = {};
    for (const [d, h] of Object.entries(histories)) {
      if (!h) continue;
      const dev = d as AreaDevice;
      if (isLayoutDirty(h.present, getPersistedForDevice(dev))) {
        const patch = areaLayoutPatch(areaId, dev, h.present);
        const areaMap = (patch.preferences as { proAreaLayouts: Record<string, Record<string, unknown>> }).proAreaLayouts[areaId];
        Object.assign(areaPatch, areaMap);
      }
    }
    setHistories(null);
    if (Object.keys(areaPatch).length > 0) {
      void saveScopedPrefs(
        {
          roomModes: { [areaId]: 'custom' },
          proAreaLayouts: { version: 1, [areaId]: areaPatch }
        },
        true
      );
    }
  }, [histories, areaId, getPersistedForDevice, saveScopedPrefs]);

  const reset = useCallback(() => {
    update(() => init(defaultLayout(items, device)));
  }, [update, init, items, device]);

  const resetToAuto = useCallback(async () => {
    const resetPatch = areaLayoutResetPatch(areaId, device);
    const areaMap = (resetPatch.preferences as { proAreaLayouts: Record<string, unknown> }).proAreaLayouts[areaId];
    setHistories(null);
    await saveScopedPrefs(
      {
        roomModes: { [areaId]: 'auto' },
        proAreaLayouts: { [areaId]: areaMap }
      },
      true
    );
  }, [areaId, device, saveScopedPrefs]);

  const commit = useCallback(
    (fn: (l: RoomLayout) => RoomLayout) => {
      const next = fn(viewSaved);
      writeLocalCollapsed(areaId, device, next.collapsed);
      setLocalCollapsedTick((t) => t + 1);
    },
    [areaId, device, viewSaved]
  );

  return {
    layout: activeDraft ?? viewSaved,
    editing,
    dirty,
    mode,
    canUndo,
    canRedo,
    begin,
    cancel,
    save,
    reset,
    resetToAuto,
    copyFromDevice,
    update,
    undo,
    redo,
    commit
  };
}
