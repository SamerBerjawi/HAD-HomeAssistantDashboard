/**
 * The room page's view (All or Now), respecting per-room configured default (`roomDefaultViews[areaId]`)
 * with device-local fallback in `localStorage`.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Device } from '../../areas/page/roomLayout';
import type { RoomView } from '../../areas/page/PageRail';

const key = (device: Device) => `had.pro.room.view.${device}`;

function readLocal(device: Device): RoomView {
  try {
    return window.localStorage.getItem(key(device)) === 'now' ? 'now' : 'all';
  } catch {
    return 'all';
  }
}

export function useRoomView(
  device: Device,
  areaId?: string,
  defaultView?: 'all' | 'now' | null
): [RoomView, (v: RoomView) => void] {
  const resolveInitial = useCallback(
    () => (defaultView === 'all' || defaultView === 'now' ? defaultView : readLocal(device)),
    [defaultView, device]
  );

  const [view, setViewState] = useState<RoomView>(resolveInitial);
  useEffect(() => {
    setViewState(resolveInitial());
  }, [resolveInitial, areaId]);

  const setView = useCallback(
    (v: RoomView) => {
      try {
        window.localStorage.setItem(key(device), v);
      } catch {
        // Private mode or blocked storage: keep it for this visit only.
      }
      setViewState(v);
    },
    [device]
  );

  return [view, setView];
}
