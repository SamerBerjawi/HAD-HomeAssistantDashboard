/**
 * Shared responsive ResizeObserver + pointer-scrubbing hook for bklit UI Energy charts.
 */
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';

export function evenlySpacedIndices(length: number, count: number): number[] {
  const visible = Math.min(Math.max(0, Math.floor(count)), length);
  if (visible === 0) return [];
  if (visible === 1) return [0];
  const last = length - 1;
  return Array.from({ length: visible }, (_, i) => Math.round((i * last) / (visible - 1)));
}

/**
 * Width of an element that may mount after the first render (charts show a placeholder until
 * their data arrives). Returns a callback ref: measuring starts whenever the element appears,
 * so a chart whose data arrives late still fills its card (audit P1, 2026-11-19).
 */
export function useMeasuredWidth<T extends HTMLElement = HTMLDivElement>() {
  const nodeRef = useRef<T | null>(null);
  const [node, setNode] = useState<T | null>(null);
  const [width, setWidth] = useState(0);
  const ref = useCallback((el: T | null) => {
    nodeRef.current = el;
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node) return;
    let rafId = 0;
    const measure = () => {
      const next = Math.round(node.clientWidth || node.getBoundingClientRect().width);
      if (next > 0) setWidth(next);
    };
    measure();
    const observer = new ResizeObserver(() => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(measure);
    });
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [node]);

  return { ref, nodeRef, width };
}

export function useBklitChartBox(p: {
  itemCount: number;
  marginLeft: number;
  marginRight: number;
  defaultWidth?: number;
}) {
  const { itemCount, marginLeft, marginRight, defaultWidth = 260 } = p;
  const { ref: containerRef, nodeRef, width: containerWidth } = useMeasuredWidth<HTMLDivElement>();
  const scrubbedRef = useRef(false);
  const pointerDownXRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const width = containerWidth > 0 ? containerWidth : defaultWidth;
  const innerWidth = Math.max(40, width - marginLeft - marginRight);

  const updateIndex = useCallback(
    (clientX: number) => {
      const el = nodeRef.current;
      if (!el || itemCount <= 0) return;
      const rect = el.getBoundingClientRect();
      const relX = Math.max(0, Math.min(innerWidth, clientX - rect.left - marginLeft));
      const idx = Math.min(
        itemCount - 1,
        Math.max(0, Math.round((relX / innerWidth) * Math.max(1, itemCount - 1)))
      );
      setActiveIndex(idx);
    },
    [itemCount, innerWidth, marginLeft, nodeRef]
  );

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    pointerDownXRef.current = e.clientX;
    scrubbedRef.current = false;
    updateIndex(e.clientX);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (pointerDownXRef.current !== null && Math.abs(e.clientX - pointerDownXRef.current) > 5) {
      scrubbedRef.current = true;
    }
    updateIndex(e.clientX);
  };

  const handlePointerLeave = () => {
    pointerDownXRef.current = null;
    setActiveIndex(null);
  };

  const consumeClickIfScrubbed = (stopProp: () => void) => {
    if (scrubbedRef.current) {
      stopProp();
      scrubbedRef.current = false;
    }
  };

  return {
    containerRef,
    width,
    innerWidth,
    activeIndex,
    handlePointerDown,
    handlePointerMove,
    handlePointerLeave,
    consumeClickIfScrubbed
  };
}
