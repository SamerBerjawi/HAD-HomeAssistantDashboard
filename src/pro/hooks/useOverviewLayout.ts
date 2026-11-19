/**
 * The Overview layout for this screen's device type, with draft editing (rebuild, Phase 1).
 * Reads `preferences.proOverviewLayout` (or migrates the old keys once), edits a draft, and writes
 * one device type's layout on Save.
 */
import { useCallback, useMemo } from 'react';
import { useUserConfig } from '@/contexts/ConfigContext';
import {
  buildDefaultDeviceLayout,
  getDeviceLayout,
  normalizeDeviceLayout,
  toggleSectionCollapsed,
  withDeviceLayout,
  type DeviceLayout,
  type DeviceType,
  type LayoutWidgetInfo
} from '../lib/overviewLayout';
import type { OverviewSectionId } from '../lib/overviewSections';
import { useOverviewLayoutDraft } from '../store/useOverviewLayoutDraft';

export interface OverviewLayoutApi {
  device: DeviceType;
  layout: DeviceLayout;
  isEditing: boolean;
  isDirty: boolean;
  begin: () => void;
  update: (fn: (layout: DeviceLayout) => DeviceLayout) => void;
  cancel: () => void;
  save: () => Promise<void>;
  /** Replaces the draft with the defaults (saved only on Save). */
  resetToDefault: () => void;
  /** Collapse is a view preference: in view mode it saves at once, in edit mode it joins the draft. */
  toggleCollapsed: (section: OverviewSectionId) => void;
}

export function useOverviewLayout(widgets: readonly LayoutWidgetInfo[], device: DeviceType, legacyIdMap?: Readonly<Record<string, string>>): OverviewLayoutApi {
  const { config, updateConfig } = useUserConfig();
  const saved = useMemo(
    () => getDeviceLayout(config, widgets, device, legacyIdMap),
    // Only the keys the layout reads; other config changes don't rebuild it.
    [config.overview, config.preferences, widgets, device, legacyIdMap]
  );
  const draftDevice = useOverviewLayoutDraft((s) => s.device);
  const draft = useOverviewLayoutDraft((s) => s.draft);
  const { begin: beginDraft, update, end } = useOverviewLayoutDraft.getState();
  const isEditing = draft !== null && draftDevice === device;
  const layout = isEditing ? draft : saved;
  const isDirty = isEditing && JSON.stringify(draft) !== JSON.stringify(saved);

  const begin = useCallback(() => beginDraft(device, saved), [beginDraft, device, saved]);
  const save = useCallback(async () => {
    const current = useOverviewLayoutDraft.getState().draft;
    if (current) {
      const clean = normalizeDeviceLayout(current, widgets, device);
      await updateConfig((prev) => withDeviceLayout(prev, device, clean));
    }
    end();
  }, [device, end, updateConfig, widgets]);
  const resetToDefault = useCallback(() => update(() => buildDefaultDeviceLayout(widgets, device)), [device, update, widgets]);

  const toggleCollapsed = useCallback(
    (section: OverviewSectionId) => {
      if (isEditing) update((l) => toggleSectionCollapsed(l, section));
      else void updateConfig((prev) => withDeviceLayout(prev, device, toggleSectionCollapsed(saved, section)));
    },
    [device, isEditing, saved, update, updateConfig]
  );

  return { device, layout, isEditing, isDirty, begin, update, cancel: end, save, resetToDefault, toggleCollapsed };
}
