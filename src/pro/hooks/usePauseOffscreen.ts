/**
 * Pauses looping CSS animations inside an element while it is scrolled out of view (Overview perf,
 * 2026-11-21). Sets `data-offscreen` on the element; pro.css pauses every animation under it.
 * One observer serves every card, and the attribute is set on the DOM directly: no re-render.
 */
import { useCallback, useRef } from 'react';

let observer: IntersectionObserver | null = null;

function sharedObserver(): IntersectionObserver | null {
  if (observer || typeof IntersectionObserver === 'undefined') return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.removeAttribute('data-offscreen');
        else entry.target.setAttribute('data-offscreen', '');
      }
    },
    // A little early, so an animation is already running when its card scrolls in.
    { rootMargin: '120px 0px' }
  );
  return observer;
}

/** A callback ref: attach it to the element whose animations should pause off screen. */
export function usePauseOffscreen<T extends HTMLElement>(): (node: T | null) => void {
  const current = useRef<T | null>(null);
  return useCallback((node: T | null) => {
    const io = sharedObserver();
    if (current.current && io) io.unobserve(current.current);
    current.current = node;
    if (node && io) io.observe(node);
  }, []);
}
