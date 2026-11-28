/** Press-and-hold for actions that must never fire by accident (unlock, climate). */
import { useEffect, useRef, useState } from 'react';

/**
 * Press and hold for `ms` before `onConfirm` (unlocking is never one accidental tap). Spread
 * `pressProps` on a HeroUI Button; `progress` (0–1) drives a fill; `hint` is true briefly after
 * an early release.
 */
export function useHold(onConfirm: () => void, ms = 1200) {
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState(false);
  const frame = useRef<number | null>(null);
  const start = useRef(0);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  };
  useEffect(
    () => () => {
      stop();
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    []
  );
  const tick = () => {
    const p = Math.min(1, (performance.now() - start.current) / ms);
    setProgress(p);
    if (p >= 1) {
      stop();
      setProgress(0);
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(15);
      onConfirm();
      return;
    }
    frame.current = requestAnimationFrame(tick);
  };
  return {
    progress,
    hint,
    pressProps: {
      onPressStart: () => {
        setHint(false);
        start.current = performance.now();
        frame.current = requestAnimationFrame(tick);
      },
      onPressEnd: () => {
        const early = frame.current !== null;
        stop();
        setProgress(0);
        if (early) {
          setHint(true);
          if (hintTimer.current) clearTimeout(hintTimer.current);
          hintTimer.current = setTimeout(() => setHint(false), 1600);
        }
      }
    }
  };
}
