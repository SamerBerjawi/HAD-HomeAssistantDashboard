"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface ParentSizeProps {
  children: (size: { width: number; height: number }) => ReactNode;
  debounceTime?: number;
  className?: string;
}

/**
 * Responsive ResizeObserver parent box measurer compatible with @bklit/gauge-chart.
 */
export function ParentSize({
  children,
  debounceTime = 10,
  className,
}: ParentSizeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.round(el.clientWidth || rect.width);
      const height = Math.round(el.clientHeight || rect.height);
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    };

    measure();
    const observer = new ResizeObserver(() => {
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(measure, debounceTime);
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (timer !== null) clearTimeout(timer);
    };
  }, [debounceTime]);

  return (
    <div ref={ref} className={cn("relative h-full w-full min-w-0", className)}>
      {size.width > 0 && size.height > 0 ? children(size) : null}
    </div>
  );
}
