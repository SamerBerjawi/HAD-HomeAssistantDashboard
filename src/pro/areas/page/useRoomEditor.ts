/**
 * Edit mode for one room (batch 6), the Overview's model: Customize starts a draft; nothing is
 * kept until Save; Cancel (or Escape) throws the draft away; Reset goes back to the defaults for
 * this device. One saved layout per device class.
 */
import { useCallback, useEffect, useState } from 'react';
import { defaultLayout, isDirty, type Device, type RoomItem, type RoomLayout } from './roomLayout';

export interface RoomEditor {
  layout: RoomLayout;
  editing: boolean;
  dirty: boolean;
  begin: () => void;
  cancel: () => void;
  save: () => void;
  reset: () => void;
  update: (fn: (l: RoomLayout) => RoomLayout) => void;
  /** Outside edit mode: a view choice kept at once (folding a section). */
  commit: (fn: (l: RoomLayout) => RoomLayout) => void;
}

export function useRoomEditor(items: readonly RoomItem[], device: Device, init: (l: RoomLayout) => RoomLayout = (l) => l): RoomEditor {
  const fresh = useCallback((d: Device) => init(defaultLayout(items, d)), [items, init]);
  const [saved, setSaved] = useState<Record<Device, RoomLayout>>(() => ({ phone: fresh('phone'), wide: fresh('wide') }));
  const [draft, setDraft] = useState<RoomLayout | null>(null);
  // Another device's layout is another draft: switching screens ends the edit.
  useEffect(() => setDraft(null), [device]);
  useEffect(() => {
    if (!draft) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !e.defaultPrevented && setDraft(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draft]);
  const layout = draft ?? saved[device];
  return {
    layout,
    editing: draft !== null,
    dirty: draft !== null && isDirty(draft, saved[device]),
    begin: () => setDraft(saved[device]),
    cancel: () => setDraft(null),
    save: () => {
      if (draft) setSaved((s) => ({ ...s, [device]: draft }));
      setDraft(null);
    },
    reset: () => setDraft(fresh(device)),
    update: (fn) => setDraft((d) => (d ? fn(d) : d)),
    commit: (fn) => setSaved((s) => ({ ...s, [device]: fn(s[device]) }))
  };
}
