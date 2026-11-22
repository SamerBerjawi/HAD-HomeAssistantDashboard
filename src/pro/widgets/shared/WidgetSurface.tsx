/**
 * Widget surface for the redesigned widgets (docs/pro-ui/WIDGET_DESIGN.md, D1/D2): each widget
 * owns its background and composition; the shared parts are the shape (24 px radius, clipped) and
 * one "open details" button in the same corner on every widget.
 */
import type { CSSProperties, ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowUpRight01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

/** Text on the surface: `auto` follows the theme; `light` is for dark or saturated backgrounds. */
export type SurfaceInk = 'auto' | 'light';

export function WidgetSurface({
  children,
  className,
  style,
  label,
  ink = 'auto'
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Accessible name of the widget (its title, which may not be shown). */
  label: string;
  ink?: SurfaceInk;
}) {
  return (
    <section
      aria-label={label}
      className={cn('relative isolate h-full w-full overflow-hidden rounded-[24px]', ink === 'light' ? 'text-white' : 'text-foreground', className)}
      style={style}
    >
      {children}
    </section>
  );
}

/** The one way into a widget's details: top-right corner, same spot on every widget. */
export function DetailsButton({ title, onPress, ink = 'auto' }: { title: string; onPress?: () => void; ink?: SurfaceInk }) {
  // No details to open (or edit mode): no button.
  if (!onPress) return null;
  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label={`Open ${title} details`}
      onPress={onPress}
      className={cn(
        'pro-touch-44 absolute right-2 top-2 z-10 size-8 min-w-0 rounded-full',
        ink === 'light' ? 'text-white/80 hover:bg-white/15 hover:text-white' : 'text-muted hover:text-foreground'
      )}
    >
      <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
    </Button>
  );
}

/** Props every redesigned widget gets (the model plus the size and the details action). */
export interface DesignedWidgetProps<Model> {
  model: Model;
  size: 's' | 'w' | 't' | 'l';
  onOpenDetails?: () => void;
}
