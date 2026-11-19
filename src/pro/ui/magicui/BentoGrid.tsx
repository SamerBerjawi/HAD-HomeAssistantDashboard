/**
 * Magic UI Bento Grid (MIT, https://magicui.design/docs/components/bento-grid), adapted for pro
 * (docs/pro-ui/DESIGN.md 7.5): `.pro-surface` cards on HeroUI tokens, Hugeicons, no hover CTA
 * (touch first), content-sized rows (`auto-rows-min` + `grid-flow-dense`) instead of 22rem rows,
 * and a header slot with a count instead of name/description/href.
 *
 * Packing (owner 2026-11-18, "optimise space"): masonry on a fine grid. Rows are 4 px and each card
 * spans as many rows as its measured height needs, so short cards slot in under each other instead
 * of leaving holes. `grid-flow-dense` back-fills earlier gaps.
 */

import { useLayoutEffect, useRef, type ComponentPropsWithoutRef, type ReactNode, type RefObject } from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';

/** Grid row unit and gap; must match `auto-rows-[4px]` and `gap-3` below. */
export const MASONRY_ROW_PX = 4;
export const MASONRY_GAP_PX = 12;

/**
 * Masonry packing for any direct child of a `BentoGrid`: spans as many 4 px rows as the element's
 * measured height needs, re-measured (once per frame) whenever its size changes. Shared by
 * `BentoCard`, the Overview widget cards and the grouped sections (audit P4, 2026-11-19).
 */
export function useMasonryRowSpan(ref: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let rafId = 0;
    const fit = () => {
      const span = Math.max(1, Math.ceil((el.getBoundingClientRect().height + MASONRY_GAP_PX) / (MASONRY_ROW_PX + MASONRY_GAP_PX)));
      el.style.gridRowEnd = `span ${span}`;
    };
    fit();
    const observer = new ResizeObserver(() => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(fit);
    });
    observer.observe(el);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [ref]);
}

interface BentoGridProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
}

/** 1 column on phones, 2 from md, 4 from xl. Cards set their own column spans; rows are measured. */
export function BentoGrid({ children, className, ...props }: BentoGridProps) {
  return (
    <div className={cn('grid w-full auto-rows-[4px] grid-flow-dense grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4', className)} {...props}>
      {children}
    </div>
  );
}

interface BentoCardProps extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
  icon: IconSvgElement;
  /** Tailwind classes for the icon tile, e.g. the accent or a state tone. */
  iconClassName?: string;
  title: string;
  /** Short status beside the title, e.g. "1 open". */
  aside?: ReactNode;
  children: ReactNode;
}

export function BentoCard({ icon, iconClassName, title, aside, children, className, ...props }: BentoCardProps) {
  const ref = useRef<HTMLElement>(null);
  useMasonryRowSpan(ref);
  return (
    <section ref={ref} aria-label={title} className={cn('pro-surface @container flex min-w-0 flex-col gap-3 self-start p-4', className)} {...props}>
      <header className="flex items-center gap-2.5">
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-xl', iconClassName ?? 'pro-soft')}>
          <HugeiconsIcon icon={icon} size={18} />
        </span>
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</h3>
        {aside}
      </header>
      {children}
    </section>
  );
}
