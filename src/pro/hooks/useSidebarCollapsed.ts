import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'had_pro_sidebar_collapsed';
const DESKTOP_QUERY = '(min-width: 1024px)';

function readPreference(): boolean | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'true' ? true : v === 'false' ? false : null;
  } catch {
    return null;
  }
}

function isDesktop(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches;
}

/**
 * Sidebar collapse (docs/pro-ui/DESIGN.md 7.2, "Auto + toggle"): an icon rail below 1024 px and
 * full above, until the user toggles it; from then on their choice is kept on this device.
 */
export function useSidebarCollapsed() {
  const [preference, setPreference] = useState<boolean | null>(readPreference);
  const [desktop, setDesktop] = useState<boolean>(isDesktop);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const collapsed = preference ?? !desktop;

  const toggle = useCallback(() => {
    const next = !collapsed;
    setPreference(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Private mode or blocked storage: the toggle still works for this visit.
    }
  }, [collapsed]);

  return { collapsed, toggle };
}
