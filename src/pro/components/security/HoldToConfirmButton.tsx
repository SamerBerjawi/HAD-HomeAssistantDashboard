import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';

interface HoldToConfirmButtonProps {
  icon: IconSvgElement;
  label: string;
  /** Accessible name, e.g. "Hold to unlock Front door". */
  ariaLabel: string;
  onConfirm: () => void;
  holdMs?: number;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
  fullWidth?: boolean;
  hintLabel?: string;
  fillClassName?: string;
  isPending?: boolean;
  isDisabled?: boolean;
  className?: string;
}

/**
 * HeroUI Button that fires only after being held for `holdMs` (DESIGN.md 7.5: critical security
 * actions — arming Away/Vacation, code-free disarm, unlocking doors, opening garages, testing sirens).
 * A fill grows while held; releasing early cancels and briefly shows a "Hold…" hint.
 */
export function HoldToConfirmButton({
  icon,
  label,
  ariaLabel,
  onConfirm,
  holdMs = 1400,
  variant = 'secondary',
  fullWidth,
  hintLabel,
  fillClassName = 'bg-warning/30',
  isPending,
  isDisabled,
  className
}: HoldToConfirmButtonProps) {
  const [progress, setProgress] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const frame = useRef<number | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef(0);
  const progressRef = useRef(0);

  const clearFrame = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
  };

  const cancel = (fromRelease: boolean) => {
    const hadPartial = progressRef.current > 0 && progressRef.current < 1;
    clearFrame();
    progressRef.current = 0;
    setProgress(0);
    if (fromRelease && hadPartial) {
      setShowHint(true);
      if (hintTimer.current) clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setShowHint(false), 1800);
    }
  };

  const tick = () => {
    const p = Math.min(1, (performance.now() - start.current) / holdMs);
    progressRef.current = p;
    setProgress(p);
    if (p >= 1) {
      clearFrame();
      progressRef.current = 0;
      setProgress(0);
      setShowHint(false);
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(15);
      }
      onConfirm();
      return;
    }
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(
    () => () => {
      clearFrame();
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    []
  );

  return (
    <Button
      size="sm"
      variant={variant}
      fullWidth={fullWidth}
      aria-label={ariaLabel}
      isPending={isPending}
      isDisabled={isDisabled}
      className={cn('relative overflow-hidden', showHint && 'ring-1 ring-warning/60', className)}
      onPressStart={() => {
        if (isDisabled || isPending) return;
        setShowHint(false);
        start.current = performance.now();
        progressRef.current = 0.01;
        frame.current = requestAnimationFrame(tick);
      }}
      onPressEnd={() => cancel(true)}
      onBlur={() => cancel(false)}
    >
      <span
        aria-hidden="true"
        className={cn('pointer-events-none absolute inset-y-0 left-0', fillClassName)}
        style={{ width: `${progress * 100}%` }}
      />
      <span className="relative inline-flex items-center gap-1.5">
        <HugeiconsIcon icon={icon} size={15} />
        <span className="truncate">{showHint ? (hintLabel ?? `Hold ${label.toLowerCase()}`) : label}</span>
      </span>
    </Button>
  );
}
