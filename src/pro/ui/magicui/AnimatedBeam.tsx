/**
 * AnimatedBeam: Magic UI "Animated Beam" (https://magicui.design/docs/components/animated-beam, MIT),
 * adapted for HAD pro onto HeroUI tokens and MotionConfig (`reducedMotion="user"`), with optional
 * orthogonal rounded routing matching Home Assistant Energy distribution connectors.
 */
import { motion } from 'motion/react';
import { useEffect, useId, useState, type RefObject } from 'react';
import { cn } from '@/lib/utils';

export interface AnimatedBeamProps {
  className?: string;
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  routing?: 'curve' | 'orthogonal';
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
  active?: boolean;
}

export function AnimatedBeam({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  routing = 'curve',
  reverse = false,
  duration = 2.8,
  delay = 0,
  pathColor = 'var(--separator)',
  pathOpacity = 0.45,
  pathWidth = 2,
  gradientStartColor = '#f59e0b',
  gradientStopColor = '#38bdf8',
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
  active = true
}: AnimatedBeamProps) {
  const id = useId();
  const [pathD, setPathD] = useState('');
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  const gradientCoordinates = reverse
    ? {
        x1: ['90%', '-10%'],
        x2: ['100%', '0%'],
        y1: ['0%', '0%'],
        y2: ['0%', '0%']
      }
    : {
        x1: ['10%', '110%'],
        x2: ['0%', '100%'],
        y1: ['0%', '0%'],
        y2: ['0%', '0%']
      };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId = 0;

    const updatePath = () => {
      const root = containerRef.current;
      const fromEl = fromRef.current;
      const toEl = toRef.current;
      if (!root || !fromEl || !toEl) return;

      const containerRect = root.getBoundingClientRect();
      const rectA = fromEl.getBoundingClientRect();
      const rectB = toEl.getBoundingClientRect();

      const svgWidth = Math.round(containerRect.width);
      const svgHeight = Math.round(containerRect.height);
      if (svgWidth <= 0 || svgHeight <= 0) return;
      setSvgDimensions({ width: svgWidth, height: svgHeight });

      const startX = rectA.left - containerRect.left + rectA.width / 2 + startXOffset;
      const startY = rectA.top - containerRect.top + rectA.height / 2 + startYOffset;
      const endX = rectB.left - containerRect.left + rectB.width / 2 + endXOffset;
      const endY = rectB.top - containerRect.top + rectB.height / 2 + endYOffset;

      if (routing === 'orthogonal') {
        const dx = endX - startX;
        const dy = endY - startY;
        if (Math.abs(dx) < 2 || Math.abs(dy) < 2) {
          setPathD(`M ${startX.toFixed(1)},${startY.toFixed(1)} L ${endX.toFixed(1)},${endY.toFixed(1)}`);
          return;
        }
        const cornerR = Math.min(18, Math.abs(dx) * 0.4, Math.abs(dy) * 0.4);
        const sx = Math.sign(dx);
        const sy = Math.sign(dy);
        const bendY = endY - sy * cornerR;
        const bendX = startX + sx * cornerR;
        // Start vertical then turn horizontal toward destination node
        setPathD(
          `M ${startX.toFixed(1)},${startY.toFixed(1)} ` +
            `L ${startX.toFixed(1)},${bendY.toFixed(1)} ` +
            `Q ${startX.toFixed(1)},${endY.toFixed(1)} ${bendX.toFixed(1)},${endY.toFixed(1)} ` +
            `L ${endX.toFixed(1)},${endY.toFixed(1)}`
        );
        return;
      }

      const controlY = startY - curvature;
      setPathD(
        `M ${startX.toFixed(1)},${startY.toFixed(1)} Q ${((startX + endX) / 2).toFixed(1)},${controlY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)}`
      );
    };

    const scheduleUpdate = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updatePath);
    };

    scheduleUpdate();
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(container);
    if (fromRef.current) observer.observe(fromRef.current);
    if (toRef.current) observer.observe(toRef.current);

    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [
    containerRef,
    fromRef,
    toRef,
    curvature,
    routing,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset
  ]);

  if (!pathD || svgDimensions.width === 0 || svgDimensions.height === 0) {
    return null;
  }

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      viewBox={`0 0 ${svgDimensions.width} ${svgDimensions.height}`}
      className={cn('pointer-events-none absolute top-0 left-0 transform-gpu stroke-2', className)}
    >
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={active ? pathOpacity : 0.2}
        strokeLinecap="round"
      />
      {active ? (
        <path
          d={pathD}
          strokeWidth={pathWidth}
          stroke={`url(#${id})`}
          strokeOpacity="1"
          strokeLinecap="round"
        />
      ) : null}
      <defs>
        <motion.linearGradient
          className="transform-gpu"
          id={id}
          gradientUnits="userSpaceOnUse"
          initial={{ x1: '0%', x2: '0%', y1: '0%', y2: '0%' }}
          animate={{
            x1: gradientCoordinates.x1,
            x2: gradientCoordinates.x2,
            y1: gradientCoordinates.y1,
            y2: gradientCoordinates.y2
          }}
          transition={{
            delay,
            duration,
            ease: [0.16, 1, 0.3, 1],
            repeat: Infinity,
            repeatDelay: 0
          }}
        >
          <stop stopColor={gradientStartColor} stopOpacity="0" />
          <stop stopColor={gradientStartColor} />
          <stop offset="32.5%" stopColor={gradientStopColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </svg>
  );
}
