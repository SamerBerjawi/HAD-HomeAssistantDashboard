/**
 * The Overview layout for a device type, with draft editing (rebuild, Phase 1 + Phase 0 multi-user/Auto).
 * Reads the active scope's `proOverviewLayout` (shared or personal), supports Auto vs. Custom mode,
 * edits multi-device drafts cleanly, stores transient view collapses locally in `localStorage`, and
 * flushes granular patches on Save.
 */
import { useCallback, useMemo, useState } from 'react';
import { useUserConfig } from '@/contexts/ConfigContext';
import type { LayoutMode } from '@/types/userConfig';
import {
  buildDefaultDeviceLayout,
  copyDeviceLayout,
  DEVICE_TYPES,
  deviceLayoutPatch,
  deviceLayoutResetPatch,
  getDeviceLayout,
  hideWidget,
  normalizeDeviceLayout,
  showWidget,
  toggleSectionCollapsed,
  type DeviceLayout,
  type DeviceType,
  type LayoutWidgetInfo
} from '../lib/overviewLayout';
import { canRedo as canRedoHistory, canUndo as canUndoHistory } from '../lib/draftHistory';
import type { OverviewSectionId } from '../lib/overviewSections';
import { useOverviewLayoutDraft } from '../store/useOverviewLayoutDraft';
import { useLayoutScope } from './useLayoutScope';

const COLLAPSED_KEY = (device: DeviceType) => `had.pro.overview.collapsed.${device}`;

function readLocalCollapsed(device: DeviceType): OverviewSectionId[] | null {
  try {
    const raw = window.localStorage.getItem(COLLAPSED_KEY(device));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OverviewSectionId[]) : null;
  } catch {
    return null;
  }
}

function writeLocalCollapsed(device: DeviceType, collapsed: OverviewSectionId[]) {
  try {
    window.localStorage.setItem(COLLAPSED_KEY(device), JSON.stringify(collapsed));
  } catch {}
}

export interface OverviewLayoutApi {
  device: DeviceType;
  layout: DeviceLayout;
  mode: LayoutMode;
  isEditing: boolean;
  isDirty: boolean;
  canUndo: boolean;
  canRedo: boolean;
  begin: () => void;
  switchEditingDevice: (target: DeviceType) => void;
  copyFromDevice: (source: DeviceType) => void;
  applyHiddenToAllDevices: () => void;
  update: (fn: (layout: DeviceLayout) => DeviceLayout) => void;
  undo: () => void;
  redo: () => void;
  cancel: () => void;
  save: () => Promise<void>;
  /** Replaces the draft with the defaults (saved only on Save). */
  resetToDefault: () => void;
  /** Switches this device layout back to dynamic Auto mode and clears its override. */
  resetToAuto: () => Promise<void>;
  /** Collapse in view mode stays device-local; in edit mode it updates the saved default collapsed list. */
  toggleCollapsed: (section: OverviewSectionId) => void;
}

export function useOverviewLayout(
  widgets: readonly LayoutWidgetInfo[],
  device: DeviceType,
  legacyIdMap?: Readonly<Record<string, string>>
): OverviewLayoutApi {
  const { config, updateConfig, flushPendingSave } = useUserConfig();
  const { scope, effectivePrefs, saveScopedPrefs } = useLayoutScope();
  const [localCollapsedTick, setLocalCollapsedTick] = useState(0);

  const storedMap = (effectivePrefs.proOverviewLayout ?? {}) as Record<string, unknown>;
  const mode: LayoutMode =
    effectivePrefs.overviewMode === 'auto' || effectivePrefs.overviewMode === 'custom'
      ? effectivePrefs.overviewMode
      : storedMap[device]
      ? 'custom'
      : 'auto';

  const getPersistedForDevice = useCallback(
    (d: DeviceType): DeviceLayout => {
      const devMode: LayoutMode =
        effectivePrefs.overviewMode === 'auto' || effectivePrefs.overviewMode === 'custom'
          ? effectivePrefs.overviewMode
          : storedMap[d]
          ? 'custom'
          : 'auto';
      if (devMode === 'auto' && !storedMap[d]) {
        return buildDefaultDeviceLayout(widgets, d);
      }
      return getDeviceLayout({ ...config, preferences: effectivePrefs }, widgets, d, legacyIdMap);
    },
    [config, effectivePrefs, storedMap, widgets, legacyIdMap]
  );

  const persistedSaved = useMemo(() => getPersistedForDevice(device), [getPersistedForDevice, device]);

  const viewSaved = useMemo(() => {
    const localCollapsed = readLocalCollapsed(device);
    return localCollapsed ? { ...persistedSaved, collapsed: localCollapsed } : persistedSaved;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedSaved, device, localCollapsedTick]);

  const draftDevice = useOverviewLayoutDraft((s) => s.device);
  const draft = useOverviewLayoutDraft((s) => s.draft);
  const drafts = useOverviewLayoutDraft((s) => s.drafts);
  const histories = useOverviewLayoutDraft((s) => s.histories);
  const { begin: beginDraft, switchDevice, update, replaceDrafts, undo, redo, end } = useOverviewLayoutDraft.getState();
  const isEditing = draft !== null && draftDevice === device;
  const layout = isEditing ? draft : viewSaved;
  const activeHistory = isEditing ? histories[device] : undefined;
  const canUndo = canUndoHistory(activeHistory);
  const canRedo = canRedoHistory(activeHistory);

  const isDirty = useMemo(() => {
    if (!isEditing) return false;
    return Object.entries(drafts).some(([dev, dLayout]) => {
      if (!dLayout) return false;
      return JSON.stringify(dLayout) !== JSON.stringify(getPersistedForDevice(dev as DeviceType));
    });
  }, [isEditing, drafts, getPersistedForDevice]);

  const begin = useCallback(() => beginDraft(device, persistedSaved), [beginDraft, device, persistedSaved]);

  const switchEditingDevice = useCallback(
    (target: DeviceType) => {
      switchDevice(target, getPersistedForDevice(target));
    },
    [switchDevice, getPersistedForDevice]
  );

  const copyFromDevice = useCallback(
    (source: DeviceType) => {
      const sourceLayout = drafts[source] ?? getPersistedForDevice(source);
      update(() => copyDeviceLayout(sourceLayout, widgets, device));
    },
    [drafts, getPersistedForDevice, update, widgets, device]
  );

  const applyHiddenToAllDevices = useCallback(() => {
    const currentDraft = useOverviewLayoutDraft.getState().draft;
    if (!currentDraft) return;
    const targetHidden = new Set(currentDraft.hidden);
    const byId = new Map(widgets.map((w) => [w.id, w]));
    const nextDrafts: Partial<Record<DeviceType, DeviceLayout>> = { ...useOverviewLayoutDraft.getState().drafts, [device]: currentDraft };
    for (const d of DEVICE_TYPES) {
      if (d === device) continue;
      let base = nextDrafts[d] ? structuredClone(nextDrafts[d]!) : getPersistedForDevice(d);
      const cols = d === 'phone' ? 2 : d === 'tablet' ? 4 : 6;
      for (const w of widgets) {
        const shouldHide = targetHidden.has(w.id);
        const currentlyHidden = base.hidden.includes(w.id);
        if (shouldHide && !currentlyHidden) base = hideWidget(base, w, cols);
        else if (!shouldHide && currentlyHidden) base = showWidget(base, w, cols);
      }
      // Keep only valid ids
      base = { ...base, hidden: base.hidden.filter((id) => byId.has(id)) };
      nextDrafts[d] = base;
    }
    replaceDrafts(nextDrafts);
  }, [device, getPersistedForDevice, replaceDrafts, widgets]);

  const save = useCallback(async () => {
    const state = useOverviewLayoutDraft.getState();
    const allDrafts = Object.keys(state.drafts).length > 0 ? state.drafts : state.draft && state.device ? { [state.device]: state.draft } : {};
    const layoutBuckets: Record<string, unknown> = { version: 1 };
    for (const [dev, dLayout] of Object.entries(allDrafts)) {
      if (!dLayout) continue;
      const d = dev as DeviceType;
      const clean = normalizeDeviceLayout(dLayout, widgets, d);
      const patch = deviceLayoutPatch(d, clean);
      Object.assign(layoutBuckets, patch.preferences?.proOverviewLayout ?? {});
    }
    if (Object.keys(layoutBuckets).length > 1) {
      await saveScopedPrefs({ overviewMode: 'custom', proOverviewLayout: layoutBuckets }, true);
    }
    end();
  }, [end, saveScopedPrefs, widgets]);

  const resetToDefault = useCallback(
    () => update(() => buildDefaultDeviceLayout(widgets, device)),
    [device, update, widgets]
  );

  const resetToAuto = useCallback(async () => {
    const resetPatch = deviceLayoutResetPatch(device);
    await saveScopedPrefs(
      {
        overviewMode: 'auto',
        proOverviewLayout: resetPatch.preferences?.proOverviewLayout
      },
      true
    );
    end();
  }, [device, saveScopedPrefs, end]);

  const toggleCollapsed = useCallback(
    (section: OverviewSectionId) => {
      if (isEditing) {
        update((l) => toggleSectionCollapsed(l, section));
      } else {
        const base = viewSaved.collapsed;
        const next = base.includes(section) ? base.filter((s) => s !== section) : [...base, section];
        writeLocalCollapsed(device, next);
        setLocalCollapsedTick((t) => t + 1);
      }
    },
    [device, isEditing, update, viewSaved.collapsed]
  );

  // If user is non-admin following shared layout and clicks Customize, caller can fork or edit personal;
  // keeping `scope` and `config` referenced cleanly for future extensions.
  void scope;
  void updateConfig;
  void flushPendingSave;

  return {
    device,
    layout,
    mode,
    isEditing,
    isDirty,
    canUndo,
    canRedo,
    begin,
    switchEditingDevice,
    copyFromDevice,
    applyHiddenToAllDevices,
    update,
    undo,
    redo,
    cancel: end,
    save,
    resetToDefault,
    resetToAuto,
    toggleCollapsed
  };
}
