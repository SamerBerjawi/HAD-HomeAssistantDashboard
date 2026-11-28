/**
 * In-place draft editor for the Pro Rooms page (Phase 1.2 + 1.3):
 *  - Multi-device `proRooms` preferences (`phone` | `tablet` | `desktop`)
 *  - Floor order/visibility, room order/visibility, per-room favorites (scope-aware)
 *  - Bounded 20-step Undo/Redo via `DraftHistory`
 *  - Nothing touches persistent NAS config until Save; Escape or Cancel discards the draft.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUserConfig } from '@/contexts/ConfigContext';
import type { LayoutMode, UserDashboardConfig } from '@/types/userConfig';
import { useLayoutScope } from './useLayoutScope';
import {
  canRedo as canRedoHistory,
  canUndo as canUndoHistory,
  createDraftHistory,
  pushDraftHistory,
  redoDraftHistory,
  undoDraftHistory,
  type DraftHistory
} from '../lib/draftHistory';
import { DEVICE_TYPES, type DeviceType } from '../lib/overviewLayout';
import { toggleFavorite } from '../lib/overviewAreas';
import type { RoomsPageModel } from '../lib/roomsPage';
import type { TileSizeChoice } from '../lib/roomTiles';
import { useProEditChrome } from '../store/useProEditChrome';
import {
  DEFAULT_ROOMS_PREFS,
  rawRoomsPrefs,
  readRoomsPrefs,
  ROOMS_PREF_KEY,
  roomsPrefsPatch,
  roomsPrefsResetPatch,
  type RoomsPagePrefs
} from '../pages/rooms/shared';

export interface RoomsDraft {
  prefsByDevice: Partial<Record<DeviceType, RoomsPagePrefs>>;
  floorOrder: string[];
  hiddenFloors: string[];
  areaOrder: string[];
  hiddenAreas: string[];
  favoriteAreas: string[];
}

function arraySwap<T>(list: readonly T[], i: number, j: number): T[] {
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function arrayToggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function sameArr(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export interface RoomsEditorApi {
  editing: boolean;
  editingDevice: DeviceType;
  isDirty: boolean;
  mode: LayoutMode;
  prefs: RoomsPagePrefs;
  draftOverrides: Pick<RoomsDraft, 'floorOrder' | 'hiddenFloors' | 'areaOrder' | 'hiddenAreas' | 'favoriteAreas'> | null;
  canUndo: boolean;
  canRedo: boolean;
  begin: () => void;
  cancel: () => void;
  save: () => Promise<void>;
  resetToDefault: () => void;
  resetToAuto: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  switchEditingDevice: (target: DeviceType) => void;
  copyFromDevice: (source: DeviceType) => void;
  updateDevicePrefs: (patch: Partial<RoomsPagePrefs>) => void;
  setRoomSize: (areaId: string, size: TileSizeChoice) => void;
  applySizesToAllDevices: () => void;
  moveRoomOnto: (allModel: RoomsPageModel, floorId: string | null, activeId: string, overId: string) => void;
  moveRoomBy: (allModel: RoomsPageModel, visibleModel: RoomsPageModel, floorId: string | null, areaId: string, dir: -1 | 1) => void;
  toggleFavoriteRoom: (areaId: string) => void;
  toggleHideRoom: (areaId: string) => void;
  moveFloorBy: (allModel: RoomsPageModel, floorId: string, dir: -1 | 1) => void;
  toggleHideFloor: (floorId: string) => void;
}

export function useRoomsEditor(viewDevice: DeviceType): RoomsEditorApi {
  const { config, updateConfig, flushPendingSave } = useUserConfig();
  const { scope, effectivePrefs, effectiveFavorites, saveScopedPrefs } = useLayoutScope();
  const setEditingPage = useProEditChrome((s) => s.setEditingPage);

  const [editingDevice, setEditingDevice] = useState<DeviceType>(viewDevice);
  const [history, setHistory] = useState<DraftHistory<RoomsDraft> | null>(null);
  const [baseline, setBaseline] = useState<RoomsDraft | null>(null);
  const editing = history !== null;

  useEffect(() => {
    setEditingPage(editing ? 'rooms' : null);
  }, [editing, setEditingPage]);

  useEffect(() => () => setEditingPage(null), [setEditingPage]);

  useEffect(() => {
    if (!editing) setEditingDevice(viewDevice);
  }, [editing, viewDevice]);

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented && !document.querySelector('[role="dialog"]')) {
        setHistory(null);
        setBaseline(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editing]);

  const getPersistedPrefs = useCallback(
    (d: DeviceType): RoomsPagePrefs => readRoomsPrefs(effectivePrefs, d),
    [effectivePrefs]
  );

  const mode: LayoutMode = useMemo(() => {
    const explicit = effectivePrefs.roomsMode;
    if (explicit === 'auto' || explicit === 'custom') return explicit;
    const raw = rawRoomsPrefs(effectivePrefs);
    return Object.keys(raw).length > 0 ? 'custom' : 'auto';
  }, [effectivePrefs]);

  const snapshotCurrent = useCallback(
    (targetDevice: DeviceType): RoomsDraft => ({
      prefsByDevice: { [targetDevice]: getPersistedPrefs(targetDevice) },
      floorOrder: [...(config.rooms?.floorOrder ?? [])],
      hiddenFloors: [...(config.rooms?.hiddenFloors ?? [])],
      areaOrder: [...(config.rooms?.areaOrder ?? [])],
      hiddenAreas: [...(config.rooms?.hiddenAreas ?? [])],
      favoriteAreas: [...effectiveFavorites]
    }),
    [config.rooms?.areaOrder, config.rooms?.floorOrder, config.rooms?.hiddenAreas, config.rooms?.hiddenFloors, effectiveFavorites, getPersistedPrefs]
  );

  const activeDevice = editing ? editingDevice : viewDevice;
  const prefs = useMemo(() => {
    if (history) {
      return history.present.prefsByDevice[editingDevice] ?? getPersistedPrefs(editingDevice);
    }
    return getPersistedPrefs(activeDevice);
  }, [history, editingDevice, activeDevice, getPersistedPrefs]);

  const isDirty = useMemo(() => {
    if (!history || !baseline) return false;
    const cur = history.present;
    if (
      !sameArr(cur.floorOrder, baseline.floorOrder) ||
      !sameArr(cur.hiddenFloors, baseline.hiddenFloors) ||
      !sameArr(cur.areaOrder, baseline.areaOrder) ||
      !sameArr(cur.hiddenAreas, baseline.hiddenAreas) ||
      !sameArr(cur.favoriteAreas, baseline.favoriteAreas)
    ) {
      return true;
    }
    return Object.entries(cur.prefsByDevice).some(([d, p]) => {
      if (!p) return false;
      return JSON.stringify(p) !== JSON.stringify(getPersistedPrefs(d as DeviceType));
    });
  }, [history, baseline, getPersistedPrefs]);

  const updateDraft = useCallback((fn: (draft: RoomsDraft) => RoomsDraft) => {
    setHistory((prev) => (prev ? pushDraftHistory(prev, fn(prev.present)) : prev));
  }, []);

  const begin = useCallback(() => {
    const start = snapshotCurrent(viewDevice);
    setEditingDevice(viewDevice);
    setBaseline(structuredClone(start));
    setHistory(createDraftHistory(start));
  }, [snapshotCurrent, viewDevice]);

  const cancel = useCallback(() => {
    setHistory(null);
    setBaseline(null);
  }, []);

  const undo = useCallback(() => {
    setHistory((prev) => (prev ? undoDraftHistory(prev) : prev));
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => (prev ? redoDraftHistory(prev) : prev));
  }, []);

  const switchEditingDevice = useCallback(
    (target: DeviceType) => {
      setEditingDevice(target);
      setHistory((prev) => {
        if (!prev || prev.present.prefsByDevice[target]) return prev;
        const p = getPersistedPrefs(target);
        return {
          ...prev,
          present: {
            ...prev.present,
            prefsByDevice: { ...prev.present.prefsByDevice, [target]: p }
          }
        };
      });
    },
    [getPersistedPrefs]
  );

  const copyFromDevice = useCallback(
    (source: DeviceType) => {
      updateDraft((draft) => {
        const src = draft.prefsByDevice[source] ?? getPersistedPrefs(source);
        return {
          ...draft,
          prefsByDevice: { ...draft.prefsByDevice, [editingDevice]: structuredClone(src) }
        };
      });
    },
    [editingDevice, getPersistedPrefs, updateDraft]
  );

  const updateDevicePrefs = useCallback(
    (patch: Partial<RoomsPagePrefs>) => {
      updateDraft((draft) => {
        const cur = draft.prefsByDevice[editingDevice] ?? getPersistedPrefs(editingDevice);
        return {
          ...draft,
          prefsByDevice: {
            ...draft.prefsByDevice,
            [editingDevice]: { ...cur, ...patch }
          }
        };
      });
    },
    [editingDevice, getPersistedPrefs, updateDraft]
  );

  const setRoomSize = useCallback(
    (areaId: string, size: TileSizeChoice) => {
      updateDraft((draft) => {
        const cur = draft.prefsByDevice[editingDevice] ?? getPersistedPrefs(editingDevice);
        const sizes = { ...cur.sizes };
        if (size === 'auto') delete sizes[areaId];
        else sizes[areaId] = size;
        return {
          ...draft,
          prefsByDevice: {
            ...draft.prefsByDevice,
            [editingDevice]: { ...cur, sizes }
          }
        };
      });
    },
    [editingDevice, getPersistedPrefs, updateDraft]
  );

  const applySizesToAllDevices = useCallback(() => {
    updateDraft((draft) => {
      const source = draft.prefsByDevice[editingDevice] ?? getPersistedPrefs(editingDevice);
      const nextMap: Partial<Record<DeviceType, RoomsPagePrefs>> = { ...draft.prefsByDevice };
      for (const d of DEVICE_TYPES) {
        const base = nextMap[d] ?? getPersistedPrefs(d);
        nextMap[d] = { ...base, cardSize: source.cardSize, sizes: { ...source.sizes } };
      }
      return { ...draft, prefsByDevice: nextMap };
    });
  }, [editingDevice, getPersistedPrefs, updateDraft]);

  const moveRoomOnto = useCallback(
    (allModel: RoomsPageModel, floorId: string | null, activeId: string, overId: string) => {
      if (activeId === overId) return;
      updateDraft((draft) => {
        const floor = allModel.floors.find((f) => f.floorId === floorId);
        if (!floor) return draft;
        const ids = floor.rooms.map((r) => r.areaId);
        const fromIdx = ids.indexOf(activeId);
        const toIdx = ids.indexOf(overId);
        if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return draft;
        const reorderedFloorIds = [...ids];
        const [moved] = reorderedFloorIds.splice(fromIdx, 1);
        reorderedFloorIds.splice(toIdx, 0, moved);
        const areaOrder = allModel.floors.flatMap((f) => (f.floorId === floorId ? reorderedFloorIds : f.rooms.map((r) => r.areaId)));
        return { ...draft, areaOrder };
      });
    },
    [updateDraft]
  );

  const moveRoomBy = useCallback(
    (allModel: RoomsPageModel, visibleModel: RoomsPageModel, floorId: string | null, areaId: string, dir: -1 | 1) => {
      const visibleFloor = visibleModel.floors.find((f) => f.floorId === floorId);
      if (!visibleFloor) return;
      const idx = visibleFloor.rooms.findIndex((r) => r.areaId === areaId);
      const neighbor = visibleFloor.rooms[idx + dir];
      if (!neighbor) return;
      moveRoomOnto(allModel, floorId, areaId, neighbor.areaId);
    },
    [moveRoomOnto]
  );

  const toggleFavoriteRoom = useCallback(
    (areaId: string) => {
      updateDraft((draft) => ({ ...draft, favoriteAreas: toggleFavorite(draft.favoriteAreas, areaId) }));
    },
    [updateDraft]
  );

  const toggleHideRoom = useCallback(
    (areaId: string) => {
      updateDraft((draft) => ({ ...draft, hiddenAreas: arrayToggle(draft.hiddenAreas, areaId) }));
    },
    [updateDraft]
  );

  const moveFloorBy = useCallback(
    (allModel: RoomsPageModel, floorId: string, dir: -1 | 1) => {
      updateDraft((draft) => {
        const floorIds = allModel.floors.filter((f) => f.floorId !== null).map((f) => f.floorId as string);
        const idx = floorIds.indexOf(floorId);
        const target = idx + dir;
        if (idx < 0 || target < 0 || target >= floorIds.length) return draft;
        return { ...draft, floorOrder: arraySwap(floorIds, idx, target) };
      });
    },
    [updateDraft]
  );

  const toggleHideFloor = useCallback(
    (floorId: string) => {
      updateDraft((draft) => ({ ...draft, hiddenFloors: arrayToggle(draft.hiddenFloors, floorId) }));
    },
    [updateDraft]
  );

  const resetToDefault = useCallback(() => {
    updateDraft((draft) => ({
      ...draft,
      prefsByDevice: { ...draft.prefsByDevice, [editingDevice]: structuredClone(DEFAULT_ROOMS_PREFS) },
      floorOrder: [],
      hiddenFloors: [],
      areaOrder: [],
      hiddenAreas: []
    }));
  }, [editingDevice, updateDraft]);

  const resetToAuto = useCallback(async () => {
    setHistory(null);
    setBaseline(null);
    await saveScopedPrefs(
      {
        roomsMode: 'auto',
        [ROOMS_PREF_KEY]: roomsPrefsResetPatch(editingDevice)
      },
      false
    );
    await updateConfig(
      (prev) => ({ rooms: { floorOrder: [], hiddenFloors: [], areaOrder: [], hiddenAreas: [] } }) as unknown as Partial<typeof prev>
    );
    await flushPendingSave();
  }, [editingDevice, flushPendingSave, saveScopedPrefs, updateConfig]);

  const save = useCallback(async () => {
    if (!history || !baseline) return;
    const cur = history.present;
    setHistory(null);
    setBaseline(null);

    const proRoomsPatch: Record<string, unknown> = {};
    for (const [d, p] of Object.entries(cur.prefsByDevice)) {
      if (!p) continue;
      if (JSON.stringify(p) !== JSON.stringify(getPersistedPrefs(d as DeviceType))) {
        Object.assign(proRoomsPatch, roomsPrefsPatch(d as DeviceType, p));
      }
    }

    const roomsPatch: Record<string, unknown> = {};
    if (!sameArr(cur.floorOrder, baseline.floorOrder)) roomsPatch.floorOrder = cur.floorOrder;
    if (!sameArr(cur.hiddenFloors, baseline.hiddenFloors)) roomsPatch.hiddenFloors = cur.hiddenFloors;
    if (!sameArr(cur.areaOrder, baseline.areaOrder)) roomsPatch.areaOrder = cur.areaOrder;
    if (!sameArr(cur.hiddenAreas, baseline.hiddenAreas)) roomsPatch.hiddenAreas = cur.hiddenAreas;

    if (!sameArr(cur.favoriteAreas, baseline.favoriteAreas)) {
      if ((scope.activeTarget === 'personal' || !scope.canEditShared) && scope.userId) {
        await updateConfig({
          userLayouts: { [scope.userId]: { ...(scope.shareEnabled ? { useSharedLayout: false } : {}), favoriteAreas: cur.favoriteAreas } }
        });
      } else {
        roomsPatch.favoriteAreas = cur.favoriteAreas;
      }
    }

    if (Object.keys(proRoomsPatch).length > 0) {
      await saveScopedPrefs(
        {
          roomsMode: 'custom',
          [ROOMS_PREF_KEY]: proRoomsPatch
        },
        false
      );
    }

    if (Object.keys(roomsPatch).length > 0) {
      await updateConfig({ rooms: roomsPatch } as unknown as Partial<UserDashboardConfig>);
    }

    await flushPendingSave();
  }, [baseline, flushPendingSave, getPersistedPrefs, history, saveScopedPrefs, scope.activeTarget, scope.canEditShared, scope.shareEnabled, scope.userId, updateConfig]);

  const draftOverrides = useMemo(
    () =>
      history
        ? {
            floorOrder: history.present.floorOrder,
            hiddenFloors: history.present.hiddenFloors,
            areaOrder: history.present.areaOrder,
            hiddenAreas: history.present.hiddenAreas,
            favoriteAreas: history.present.favoriteAreas
          }
        : null,
    [history]
  );

  return {
    editing,
    editingDevice: activeDevice,
    isDirty,
    mode,
    prefs,
    draftOverrides,
    canUndo: canUndoHistory(history),
    canRedo: canRedoHistory(history),
    begin,
    cancel,
    save,
    resetToDefault,
    resetToAuto,
    undo,
    redo,
    switchEditingDevice,
    copyFromDevice,
    updateDevicePrefs,
    setRoomSize,
    applySizesToAllDevices,
    moveRoomOnto,
    moveRoomBy,
    toggleFavoriteRoom,
    toggleHideRoom,
    moveFloorBy,
    toggleHideFloor
  };
}
