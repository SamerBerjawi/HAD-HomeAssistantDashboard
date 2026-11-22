/**
 * Gestures the area tiles share. Both keep a live value while the finger moves and commit once on
 * release, so HA gets one service call per gesture, not one per pixel.
 *
 * - `useSlideValue`: drag across a whole surface to set a value, tap to toggle. Always horizontal
 *   (`touch-action: pan-y`), so a finger that starts on a tile can still scroll the page.
 * - `useRingValue`: turn a ring (270° sweep, gap at the bottom) like a dimmer knob.
 */
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

interface SlideOptions {
  value: number;
  min?: number;
  max?: number;
  /** Off: the surface only taps. */
  enabled: boolean;
  onCommit: (v: number) => void;
  onTap: () => void;
  label: string;
  /** Spoken value, e.g. "62%". */
  valueText: string;
}

export function useSlideValue({ value, min = 1, max = 100, enabled, onCommit, onTap, label, valueText }: SlideOptions) {
  const [live, setLive] = useState<number | null>(null);
  const start = useRef<{ x: number; y: number; v: number; w: number; moved: boolean } | null>(null);
  const reset = () => {
    start.current = null;
    setLive(null);
  };
  const props = {
    role: enabled ? ('slider' as const) : ('switch' as const),
    tabIndex: 0,
    'aria-label': label,
    ...(enabled ? { 'aria-valuemin': min, 'aria-valuemax': max, 'aria-valuenow': Math.round(live ?? value), 'aria-valuetext': valueText } : { 'aria-checked': value > 0 }),
    style: { touchAction: 'pan-y' as const },
    onPointerDown: (ev: PointerEvent<HTMLElement>) => {
      if (ev.button !== 0) return;
      // Controls inside the tile (buttons, menus) handle their own presses.
      if ((ev.target as HTMLElement).closest('[data-tile-control]')) return;
      start.current = { x: ev.clientX, y: ev.clientY, v: value, w: ev.currentTarget.getBoundingClientRect().width, moved: false };
      ev.currentTarget.setPointerCapture(ev.pointerId);
    },
    onPointerMove: (ev: PointerEvent<HTMLElement>) => {
      const s = start.current;
      if (!s) return;
      const dx = ev.clientX - s.x;
      if (!s.moved) {
        if (Math.abs(ev.clientY - s.y) > 10 && Math.abs(dx) < 8) return reset(); // a scroll
        if (Math.abs(dx) < 6) return;
        s.moved = true;
      }
      if (enabled) setLive(clamp(s.v + (dx / Math.max(80, s.w)) * (max - min), min, max));
    },
    onPointerUp: () => {
      const s = start.current;
      if (!s) return;
      if (!s.moved) onTap();
      else if (enabled && live !== null) onCommit(Math.round(live));
      reset();
    },
    onPointerCancel: reset,
    onKeyDown: (ev: KeyboardEvent<HTMLElement>) => {
      if (ev.target !== ev.currentTarget) return;
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        onTap();
      } else if (enabled && (ev.key === 'ArrowRight' || ev.key === 'ArrowUp' || ev.key === 'ArrowLeft' || ev.key === 'ArrowDown')) {
        ev.preventDefault();
        const up = ev.key === 'ArrowRight' || ev.key === 'ArrowUp';
        onCommit(clamp(Math.round(value + (up ? 10 : -10)), min, max));
      }
    }
  };
  return { live, shown: live ?? value, props };
}

/** Ring geometry: 270° sweep starting bottom-left (135°), clockwise. */
export const RING_START = 135;
export const RING_SWEEP = 270;

export function arcPath(cx: number, cy: number, r: number, from: number, to: number): string {
  const p = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const [x1, y1] = p(from);
  const [x2, y2] = p(to);
  return `M ${x1} ${y1} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}`;
}

export function useRingValue({ value, min = 1, max = 100, onCommit }: { value: number; min?: number; max?: number; onCommit: (v: number) => void }) {
  const [live, setLive] = useState<number | null>(null);
  const active = useRef(false);
  const fromPointer = (ev: PointerEvent<Element>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const deg = (Math.atan2(ev.clientY - (r.top + r.height / 2), ev.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
    let rel = (deg - RING_START + 360) % 360;
    if (rel > RING_SWEEP) rel = rel > RING_SWEEP + (360 - RING_SWEEP) / 2 ? 0 : RING_SWEEP; // in the gap: nearest end
    return clamp(min + (rel / RING_SWEEP) * (max - min), min, max);
  };
  return {
    shown: live ?? value,
    props: {
      style: { touchAction: 'none' as const },
      onPointerDown: (ev: PointerEvent<Element>) => {
        active.current = true;
        ev.currentTarget.setPointerCapture(ev.pointerId);
        setLive(fromPointer(ev));
      },
      onPointerMove: (ev: PointerEvent<Element>) => {
        if (active.current) setLive(fromPointer(ev));
      },
      onPointerUp: () => {
        if (active.current && live !== null) onCommit(Math.round(live));
        active.current = false;
        setLive(null);
      },
      onPointerCancel: () => {
        active.current = false;
        setLive(null);
      }
    }
  };
}
