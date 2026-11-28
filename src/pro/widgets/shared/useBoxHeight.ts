import { useCallback, useEffect, useState } from 'react';

/**
 * Height of a box, kept current with a ResizeObserver (charts that take a pixel height). Uses a
 * callback ref, so a box that mounts later (after a loading state) is still measured.
 */
export function useBoxHeight<T extends HTMLElement>(fallback: number) {
  const [el, setEl] = useState<T | null>(null);
  const [height, setHeight] = useState(fallback);
  const ref = useCallback((node: T | null) => setEl(node), []);
  useEffect(() => {
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const h = Math.floor(entry.contentRect.height);
      if (h > 0) setHeight(h);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);
  return { ref, height };
}
