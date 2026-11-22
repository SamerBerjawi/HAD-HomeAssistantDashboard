/**
 * A HeroUI Button that acts only after a press and hold (`useHold`): a fill grows while held, an
 * early release says "Hold". For actions that must never fire by a stray tap (unlock, climate).
 * `iconOnly` keeps the label for screen readers only.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { useHold } from './useHold';

export function HoldButton({
  icon,
  label,
  ariaLabel,
  onConfirm,
  iconOnly = false,
  isPending,
  isDisabled,
  className,
  fillClassName = 'bg-white/35',
  ms = 1200
}: {
  icon: IconSvgElement;
  label: string;
  /** Spoken name; "(press and hold)" is added. */
  ariaLabel: string;
  onConfirm: () => void;
  iconOnly?: boolean;
  isPending?: boolean;
  isDisabled?: boolean;
  className?: string;
  fillClassName?: string;
  ms?: number;
}) {
  const hold = useHold(onConfirm, ms);
  return (
    <Button
      size="sm"
      variant="ghost"
      isIconOnly={iconOnly}
      isPending={isPending}
      isDisabled={isDisabled}
      aria-label={`${ariaLabel} (press and hold)`}
      {...hold.pressProps}
      className={cn('relative shrink-0 overflow-hidden', className)}
    >
      <span aria-hidden className={cn('absolute inset-y-0 left-0', fillClassName)} style={{ width: `${hold.progress * 100}%` }} />
      <span className="relative inline-flex items-center gap-1.5">
        <HugeiconsIcon icon={icon} size={15} />
        {iconOnly ? null : hold.hint ? 'Hold…' : label}
      </span>
    </Button>
  );
}
