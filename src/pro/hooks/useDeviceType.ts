/**
 * Which Overview layout this screen uses (rebuild, Phase 1): from the window width, unless the
 * screen is pinned to a type (e.g. a wall tablet that should use the desktop layout). The pin is
 * a per-screen convenience in localStorage; the layouts themselves live in the shared config.
 */
import { useCallback, useState } from 'react';
import { DEVICE_TYPES, type DeviceType } from '../lib/overviewLayout';
import { useMediaQuery } from './useMediaQuery';

const PIN_KEY = 'had.pro.overviewDeviceType';

function readPin(): DeviceType | null {
  try {
    const v = window.localStorage.getItem(PIN_KEY);
    return v && (DEVICE_TYPES as readonly string[]).includes(v) ? (v as DeviceType) : null;
  } catch {
    return null;
  }
}

export function useDeviceType(): { device: DeviceType; detected: DeviceType; pinned: DeviceType | null; setPinned: (d: DeviceType | null) => void } {
  const isPhone = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1279px)');
  const detected: DeviceType = isPhone ? 'phone' : isTablet ? 'tablet' : 'desktop';
  const [pinned, setPinnedState] = useState<DeviceType | null>(readPin);
  const setPinned = useCallback((d: DeviceType | null) => {
    try {
      if (d) window.localStorage.setItem(PIN_KEY, d);
      else window.localStorage.removeItem(PIN_KEY);
    } catch {
      // Private mode or blocked storage: keep it for this visit only.
    }
    setPinnedState(d);
  }, []);
  return { device: pinned ?? detected, detected, pinned, setPinned };
}
