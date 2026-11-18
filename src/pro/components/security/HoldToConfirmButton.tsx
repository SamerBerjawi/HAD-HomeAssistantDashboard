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
  isPending?: boolean;
  isDisabled?: boolean;
  className?: string;
}

/**
 * HeroUI Button that fires only after being held for `holdMs` (DESIGN.md 7.5, unlock). A fill
 * grows while held; releasing early cancels. Works with pointer and with Space/Enter held down,
 * because react-aria's press events cover both.
 */
export function HoldToConfirmButton({ icon, label, ariaLabel, onConfirm, holdMs = 1500, isPending, isDisabled, className }: HoldToConfirmButtonProps) {
  const [progress, setProgress] = useState(0);
  const frame = useRef<number | null>(null);
  const start = useRef(0);

  const stop = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    setProgress(0);
  };

  const tick = () => {
    const p = Math.min(1, (performance.now() - start.current) / holdMs);
    setProgress(p);
    if (p >= 1) {
      stop();
      onConfirm();
      return;
    }
    frame.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => stop(), []);

  return (
    <Button
      size="sm"
      variant="secondary"
      aria-label={ariaLabel}
      isPending={isPending}
      isDisabled={isDisabled}
      className={cn('relative overflow-hidden', className)}
      onPressStart={() => {
        start.current = performance.now();
        frame.current = requestAnimationFrame(tick);
      }}
      onPressEnd={stop}
    >
      <span aria-hidden="true" className="absolute inset-y-0 left-0 bg-warning/25" style={{ width: `${progress * 100}%` }} />
      <span className="relative inline-flex items-center gap-1.5">
        <HugeiconsIcon icon={icon} size={16} />
        {label}
      </span>
    </Button>
  );
}
