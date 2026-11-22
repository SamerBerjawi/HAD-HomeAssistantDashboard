import { useCallback, useEffect, useState } from 'react';

/** Width and height of a box (callback ref + ResizeObserver), for SVGs drawn at real pixel size. */
export function useBoxSize<T extends HTMLElement>(fallback: { width: number; height: number }) {
  const [el, setEl] = useState<T | null>(null);
  const [size, setSize] = useState(fallback);
  const ref = useCallback((node: T | null) => setEl(node), []);
  useEffect(() => {
    if (!el || typeof ResizeObserver === 'undefined') return;
    let frame = 0;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width);
      const height = Math.floor(entry.contentRect.height);
      if (width <= 0 || height <= 0) return;
      // Next frame, and only on a real change: avoids "ResizeObserver loop" errors when the
      // drawing inside the box reflows it.
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height })));
    });
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [el]);
  return { ref, ...size };
}
