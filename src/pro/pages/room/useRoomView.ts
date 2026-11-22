/**
 * The room page's view (All or Now), remembered per screen and device class in localStorage: a
 * convenience for this screen, not part of the shared layout.
 */
import { useCallback, useEffect, useState } from 'react';
import type { Device } from '../../areas/page/roomLayout';
import type { RoomView } from '../../areas/page/PageRail';

const key = (device: Device) => `had.pro.room.view.${device}`;

function read(device: Device): RoomView {
  try {
    return window.localStorage.getItem(key(device)) === 'now' ? 'now' : 'all';
  } catch {
    return 'all';
  }
}

export function useRoomView(device: Device): [RoomView, (v: RoomView) => void] {
  const [view, setViewState] = useState<RoomView>(() => read(device));
  useEffect(() => setViewState(read(device)), [device]);
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
