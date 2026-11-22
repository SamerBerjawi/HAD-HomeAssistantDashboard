/**
 * Slide to confirm (owner review 2026-11-20, WIDGET_DESIGN.md §8: the Door locks widget unlocks
 * by swiping the bolt back, like "slide to unlock"). The knob follows the finger along its rail;
 * let go before the end and it springs back; reach the end and `onConfirm` runs. Keyboard: each
 * arrow press toward the end moves it a quarter, the other way (or Escape) puts it back.
 * Built on react-aria `useMove` (mouse, touch, pen and keys alike).
 */
import { useRef, useState, type KeyboardEvent } from 'react';
import { useMove } from 'react-aria';

const DONE = 0.86;
const KEY_STEP = 0.25;

/** Next progress after a move of `dx` pixels along a rail of `travel` pixels (`dir` -1: slides left). */
export function slideProgress(progress: number, dx: number, travel: number, dir: 1 | -1 = -1): number {
  if (travel <= 0) return progress;
  return Math.min(1, Math.max(0, progress + (dx * dir) / travel));
}

export function useSlideToConfirm({ onConfirm, travel, dir = -1, disabled = false }: { onConfirm: () => void; travel: () => number; dir?: 1 | -1; disabled?: boolean }) {
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const p = useRef(0);
  const viaKeys = useRef(false);
  const set = (v: number) => {
    p.current = v;
    setProgress(v);
  };
  const finish = () => {
    setDragging(false);
    if (p.current >= DONE) {
      set(1);
      onConfirm();
      // Back to rest once the lock reports its new state (the bolt is drawn then anyway).
      setTimeout(() => set(0), 600);
    } else if (!viaKeys.current) set(0);
  };
  const { moveProps } = useMove({
    onMoveStart: (e) => {
      if (disabled) return;
      viaKeys.current = e.pointerType === 'keyboard';
      setDragging(!viaKeys.current);
    },
    onMove: (e) => {
      if (disabled) return;
      if (e.pointerType === 'keyboard') set(Math.min(1, Math.max(0, p.current + Math.sign(e.deltaX) * dir * KEY_STEP)));
      else set(slideProgress(p.current, e.deltaX, travel(), dir));
    },
    onMoveEnd: () => {
      if (!disabled) finish();
    }
  });
  // Escape puts a half-moved knob back; every other key goes to useMove (arrows).
  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && p.current > 0) {
      e.stopPropagation();
      set(0);
      return;
    }
    moveProps.onKeyDown?.(e);
  };
  return { progress, dragging, armed: progress >= DONE, moveProps: { ...moveProps, onKeyDown } };
}
