/**
 * The saved layout of one room (Area page build, phase 3), with the same draft editing as the
 * studio's `useRoomEditor`: Customize starts a draft; Save writes it once to
 * `preferences.proAreaLayouts[areaId][device]` (other screens get it through the config fan-out);
 * Cancel or Escape throws it away; Reset goes back to the defaults. Folding a section outside edit
 * mode is saved at once. The saved layout is fitted to the room's current tiles on every read.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUserConfig } from '@/contexts/ConfigContext';
import type { UserDashboardConfig } from '@/types/userConfig';
import { defaultLayout, isDirty, readAreaLayout, reconcile, withAreaLayout, type Device, type RoomItem, type RoomLayout } from './roomLayout';
import type { RoomEditor } from './useRoomEditor';

const same = (l: RoomLayout) => l;

export function useAreaLayout(areaId: string, items: readonly RoomItem[], device: Device, init: (l: RoomLayout) => RoomLayout = same): RoomEditor {
  const { config, updateConfig } = useUserConfig();
  const stored = readAreaLayout(config.preferences, areaId, device);
  const saved = useMemo(() => (stored ? reconcile(stored, items, device) : init(defaultLayout(items, device))), [stored, items, device, init]);
  const [draft, setDraft] = useState<RoomLayout | null>(null);

  // Another room or device is another draft.
  useEffect(() => setDraft(null), [areaId, device]);
  useEffect(() => {
    if (!draft) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !e.defaultPrevented && setDraft(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draft]);

  const write = useCallback(
    (layout: RoomLayout) => updateConfig((prev: UserDashboardConfig) => ({ ...prev, preferences: withAreaLayout(prev.preferences as Record<string, unknown> | undefined, areaId, device, layout) as UserDashboardConfig['preferences'] })),
    [areaId, device, updateConfig]
  );

  return {
    layout: draft ?? saved,
    editing: draft !== null,
    dirty: draft !== null && isDirty(draft, saved),
    begin: () => setDraft(saved),
    cancel: () => setDraft(null),
    save: () => {
      if (draft && isDirty(draft, saved)) void write(draft);
      setDraft(null);
    },
    reset: () => setDraft(init(defaultLayout(items, device))),
    update: (fn) => setDraft((d) => (d ? fn(d) : d)),
    commit: (fn) => void write(fn(saved))
  };
}
