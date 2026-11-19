/**
 * BorderBeam: Magic UI "Border Beam" (https://magicui.design/r/border-beam.json, MIT),
 * adapted to HAD pro styling (docs/pro-ui/DESIGN.md 7.6). Reduced motion is honoured by the
 * app-wide `MotionConfig reducedMotion="user"` in src/pro/main.tsx.
 */
import type { CSSProperties } from 'react';
import { motion, type Transition } from 'motion/react';
import { cn } from '@/lib/utils';

interface BorderBeamProps {
  /** Size of the luminous perimeter beam in pixels. */
  size?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /** Optional delay in seconds before starting. */
  delay?: number;
  /** Leading gradient color of the beam. */
  colorFrom?: string;
  /** Trailing gradient color of the beam. */
  colorTo?: string;
  /** Optional custom transition override. */
  transition?: Transition;
  /** Additional className for the beam element. */
  className?: string;
  /** Optional inline styles merged onto the animated beam. */
  style?: CSSProperties;
  /** Reverse animation direction around the border. */
  reverse?: boolean;
  /** Starting offset percentage (0-100). */
  initialOffset?: number;
  /** Border width in pixels matching the mask inset. */
  borderWidth?: number;
}

export function BorderBeam({
  className,
  size = 72,
  delay = 0,
  duration = 5,
  colorFrom = '#ef4444',
  colorTo = '#f97316',
  transition,
  style,
  reverse = false,
  initialOffset = 0,
  borderWidth = 1.5
}: BorderBeamProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
      style={{ borderWidth: `${borderWidth}px`, borderStyle: 'solid' }}
    >
      <motion.div
        className={cn('absolute aspect-square', className)}
        style={{
          width: size,
          offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          background: `linear-gradient(to left, ${colorFrom}, ${colorTo}, transparent)`,
          ...style
        }}
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={{
          offsetDistance: reverse
            ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
            : [`${initialOffset}%`, `${100 + initialOffset}%`]
        }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration,
          delay: -delay,
          ...transition
        }}
      />
    </div>
  );
}
