/**
 * Marquee: Magic UI "Marquee" (https://magicui.design/docs/components/marquee, MIT), adapted for
 * pro (docs/pro-ui/DESIGN.md 7.6): adds active/focus-within pause so touch and keyboard users can
 * inspect pills cleanly; reduced motion is honoured in pro.css.
 */
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: ReactNode;
  vertical?: boolean;
  repeat?: number;
  autoScroll?: boolean;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  autoScroll = true,
  ...props
}: MarqueeProps) {
  if (!autoScroll) {
    return (
      <div
        {...props}
        className={cn(
          'no-scrollbar flex w-full touch-pan-x overflow-x-auto scroll-smooth p-2 [--gap:1rem] [gap:var(--gap)]',
          className
        )}
      >
        <div className="flex shrink-0 flex-row items-center [gap:var(--gap)]">{children}</div>
      </div>
    );
  }

  return (
    <div
      {...props}
      className={cn(
        'group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem] [gap:var(--gap)]',
        vertical ? 'flex-col' : 'flex-row',
        className
      )}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 || undefined}
          className={cn('flex shrink-0 justify-around [gap:var(--gap)]', {
            'animate-marquee flex-row': !vertical,
            'animate-marquee-vertical flex-col': vertical,
            'group-hover:[animation-play-state:paused] group-active:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]':
              pauseOnHover,
            '[animation-direction:reverse]': reverse
          })}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
