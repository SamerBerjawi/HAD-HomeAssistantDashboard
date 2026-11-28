import { useEffect, useState } from 'react';

/**
 * Returns a counter that increments every `intervalMs` (default 30s) while the document is visible
 * so relative timestamps (`timeAgo`) stay fresh on idle dashboards.
 */
export function useMinuteTick(intervalMs = 30_000): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        setTick((n) => n + 1);
      }
    };
    const id = window.setInterval(bump, intervalMs);
    document.addEventListener('visibilitychange', bump);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', bump);
    };
  }, [intervalMs]);

  return tick;
}
