/**
 * SmoothTab: Kokonut UI "Smooth Tab" (@kokonutui/smooth-tab,
 * https://kokonutui.com/r/smooth-tab.json, v2.0.0, MIT, @dorianbaffier), re-skinned for HAD pro
 * (docs/pro-ui/DESIGN.md 7.6): uses HeroUI Button triggers, Hugeicons, HeroUI tokens
 * (.pro-surface, .pro-accent, --accent, --accent-foreground, --muted), and mobile-only active
 * label/statistics badge expansion inside a horizontal ScrollShadow track.
 */
import { Badge, Button, ScrollShadow } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { type AnimationPlaybackControls, animate, useMotionValue } from 'motion/react';
import {
  type PointerEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import { cn } from '@/lib/utils';
import type { PillTone } from '../../lib/overviewPills';

export interface SwipeTabItem {
  id: string;
  title: string;
  /** Hugeicons SVG icon element rendered before the title. */
  icon?: IconSvgElement;
  /** Optional statistics badge text shown next to the selected mobile tab. */
  badge?: string;
  badgeTone?: PillTone;
  ariaLabel?: string;
  /** Optional swipeable panel content. When omitted on all items, no panel track is rendered. */
  content?: ReactNode;
}

export interface SmoothTabProps {
  items: SwipeTabItem[];
  defaultTabId?: string;
  value?: string;
  onChange?: (tabId: string) => void;
  className?: string;
  /** Background classes for the sliding clip-path pill indicator. */
  activeColor?: string;
  /** Text classes for the label rendered inside the sliding pill indicator. */
  activeTextColor?: string;
  /** Accessible name for the tablist. */
  label?: string;
  /** When true, inactive tabs collapse to icon-only below md (768 px). */
  mobileIconOnlyInactive?: boolean;
  /**
   * 'selected-mobile' (default): the badge shows on the selected tab below md only.
   * 'always': every tab shows its badge at every width (Overview tab counts, Phase 4).
   */
  badges?: 'selected-mobile' | 'always';
}

const RUBBER_BAND = 0.35;
const SWIPE_VELOCITY = 0.11;
const AXIS_LOCK = 6;
const VELOCITY_WINDOW = 100;
const NEIGHBOUR_OPACITY = 0.35;
const SPRING = { type: 'spring', stiffness: 420, damping: 38 } as const;
const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface TabRect {
  left: number;
  width: number;
  top: number;
  height: number;
}

interface Drag {
  pointerId: number;
  startX: number;
  startY: number;
  startProgress: number;
  axis: 'x' | 'y' | null;
  width: number;
  samples: { x: number; t: number }[];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

function indicatorRect(rects: TabRect[], progress: number): TabRect | null {
  const last = rects.length - 1;
  if (last < 0) return null;
  const p = clamp(progress, 0, last);
  const i = Math.min(Math.floor(p), Math.max(last - 1, 0));
  const a = rects[i];
  const b = rects[Math.min(i + 1, last)];
  const t = p - i;
  let left = lerp(a.left, b.left, t);
  let width = lerp(a.width, b.width, t);
  const over = progress < 0 ? -progress : progress - last;
  if (over > 0) {
    const squash = width * Math.min(over, 0.5) * 0.4;
    width -= squash;
    if (progress > last) left += squash;
  }
  return { left, width, top: a.top, height: a.height };
}

function rubberBand(raw: number, last: number): number {
  if (raw < 0) return raw * RUBBER_BAND;
  if (raw > last) return last + (raw - last) * RUBBER_BAND;
  return raw;
}

function renderTabInner(
  item: SwipeTabItem,
  isSelected: boolean,
  mobileIconOnlyInactive: boolean,
  inOverlay: boolean,
  badgesAlways = false
) {
  const showMobileLabel = !mobileIconOnlyInactive || isSelected;
  return (
    <>
      {item.icon ? <HugeiconsIcon icon={item.icon} size={16} className="shrink-0" /> : null}
      <span className={cn('whitespace-nowrap', !showMobileLabel && 'hidden md:inline')}>{item.title}</span>
      {(badgesAlways || isSelected) && item.badge ? (
        <Badge
          size="sm"
          variant="soft"
          color={inOverlay ? 'default' : (item.badgeTone ?? 'default')}
          className={cn(
            'static transform-none! min-h-4.5 min-w-0 rounded-full border-0 px-1.5 py-0 text-[10px] font-semibold tabular-nums',
            !badgesAlways && 'md:hidden',
            inOverlay && 'bg-black/20 text-[var(--accent-foreground)]'
          )}
        >
          <Badge.Label>{item.badge}</Badge.Label>
        </Badge>
      ) : null}
    </>
  );
}

export function SmoothTab({
  items,
  defaultTabId,
  value,
  onChange,
  className,
  activeColor = 'pro-accent',
  activeTextColor = 'text-[var(--accent-foreground)]',
  label = 'Sections',
  mobileIconOnlyInactive = false,
  badges = 'selected-mobile'
}: SmoothTabProps) {
  const badgesAlways = badges === 'always';
  const count = items.length;
  const hasPanels = items.some((item) => item.content !== undefined);
  const indexOf = (id: string | undefined) => Math.max(items.findIndex((item) => item.id === id), 0);

  const [uncontrolled, setUncontrolled] = useState(() => indexOf(defaultTabId));
  const selected = value === undefined ? clamp(uncontrolled, 0, Math.max(count - 1, 0)) : indexOf(value);
  const [initial] = useState(selected);

  const progress = useMotionValue(selected);
  const baseId = useId();
  const tablistRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rects = useRef<TabRect[]>([]);
  const size = useRef({ width: 0, height: 0 });
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const target = useRef(selected);
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const reducedMotion = useRef(false);
  const latest = useRef({ count, items, selected, onChange });
  latest.current = { count, items, selected, onChange };

  const paint = useCallback(
    (p: number) => {
      const track = trackRef.current;
      if (track) {
        track.style.transform = `translate3d(${(-p * 100) / Math.max(count, 1)}%, 0, 0)`;
      }
      panelRefs.current.forEach((panel, i) => {
        if (panel) {
          const d = Math.min(Math.abs(p - i), 1);
          panel.style.opacity = String(1 - d * (1 - NEIGHBOUR_OPACITY));
        }
      });
      const overlay = overlayRef.current;
      const r = indicatorRect(rects.current, p);
      if (overlay && r) {
        const right = Math.max(0, size.current.width - r.left - r.width);
        const bottom = Math.max(0, size.current.height - r.top - r.height);
        overlay.style.clipPath = `inset(${r.top}px ${right}px ${bottom}px ${r.left}px round ${r.height / 2}px)`;
      }
    },
    [count]
  );

  useLayoutEffect(() => {
    const tablist = tablistRef.current;
    if (!tablist) return;
    let alive = true;
    let rafId = 0;
    const measure = () => {
      if (!alive) return;
      const box = tablist.getBoundingClientRect();
      const ratio = box.width / (tablist.offsetWidth || 1);
      const scale = Math.abs(ratio - 1) < 0.01 ? 1 : ratio;
      size.current = { width: box.width / scale, height: box.height / scale };
      rects.current = tabRefs.current.slice(0, count).map((tab) => {
        const r = tab?.getBoundingClientRect();
        return r
          ? {
              left: (r.left - box.left) / scale,
              width: r.width / scale,
              top: (r.top - box.top) / scale,
              height: r.height / scale
            }
          : { left: 0, width: 0, top: 0, height: 0 };
      });
      paint(progress.get());
    };
    const scheduleMeasure = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(measure);
    };
    measure();
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(tablist);
    tabRefs.current.slice(0, count).forEach((tab) => {
      if (tab) observer.observe(tab);
    });
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => {
      alive = false;
      if (rafId) window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [count, selected, items, paint, progress]);

  useEffect(() => {
    const unsubscribe = progress.on('change', paint);
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      reducedMotion.current = query.matches;
    };
    sync();
    query.addEventListener('change', sync);
    return () => {
      unsubscribe();
      query.removeEventListener('change', sync);
      anim.current?.stop();
    };
  }, [paint, progress]);

  const settle = useCallback(
    (index: number, opts: { instant?: boolean; velocity?: number } = {}) => {
      target.current = index;
      anim.current?.stop();
      anim.current = null;
      if (opts.instant) {
        progress.jump(index);
        return;
      }
      anim.current = reducedMotion.current
        ? animate(progress, index, { duration: 0.15, ease: EASE_OUT })
        : animate(progress, index, { ...SPRING, velocity: opts.velocity ?? 0 });
    },
    [progress]
  );

  const select = useCallback(
    (index: number, opts?: { instant?: boolean; velocity?: number }) => {
      const { count: n, items: list, selected: current } = latest.current;
      if (n === 0) return;
      const next = clamp(index, 0, n - 1);
      settle(next, opts);
      if (next !== current) {
        setUncontrolled(next);
        latest.current.onChange?.(list[next].id);
      }
    },
    [settle]
  );

  useEffect(() => {
    if (selected !== target.current && !drag.current) {
      settle(selected);
    }
  }, [selected, settle]);

  useEffect(() => {
    const node = tabRefs.current[selected];
    node?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [selected]);

  const handleKeyDown = (e: { key: string; repeat: boolean; preventDefault: () => void }, i: number) => {
    if (count === 0) return;
    const keys: Record<string, number> = {
      ArrowRight: (i + 1) % count,
      ArrowLeft: (i - 1 + count) % count,
      Home: 0,
      End: count - 1
    };
    const next = keys[e.key];
    if (next === undefined) return;
    e.preventDefault();
    tabRefs.current[next]?.querySelector<HTMLElement>('button')?.focus();
    select(next, { instant: e.repeat });
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!hasPanels || count < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startProgress: progress.get(),
      axis: null,
      width: e.currentTarget.clientWidth || 1,
      samples: [{ x: e.clientX, t: e.timeStamp }]
    };
  };

  const lockAxis = (current: Drag, e: PointerEvent<HTMLDivElement>) => {
    const dx = e.clientX - current.startX;
    const dy = e.clientY - current.startY;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < AXIS_LOCK) return;
    current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (current.axis === 'x') {
      anim.current?.stop();
      current.startProgress = progress.get();
      current.startX = e.clientX;
      current.samples = [{ x: e.clientX, t: e.timeStamp }];
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.dataset.dragging = '';
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== e.pointerId) return;
    if (current.axis === null) lockAxis(current, e);
    if (current.axis !== 'x') return;
    current.samples.push({ x: e.clientX, t: e.timeStamp });
    while (current.samples.length > 2 && e.timeStamp - current.samples[0].t > VELOCITY_WINDOW) {
      current.samples.shift();
    }
    const raw = current.startProgress - (e.clientX - current.startX) / current.width;
    progress.set(rubberBand(raw, count - 1));
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const current = drag.current;
    if (!current || current.pointerId !== e.pointerId) return;
    drag.current = null;
    delete e.currentTarget.dataset.dragging;
    if (current.axis !== 'x') return;
    if (!cancelled) {
      suppressClick.current = true;
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
    }
    const first = current.samples[0];
    const vx = (e.clientX - first.x) / Math.max(e.timeStamp - first.t, 1);
    const p = progress.get();
    let next = Math.round(p);
    if (!cancelled && Math.abs(vx) > SWIPE_VELOCITY) {
      next = vx < 0 ? Math.floor(p) + 1 : Math.ceil(p) - 1;
    }
    select(next, { velocity: (-vx * 1000) / current.width });
  };

  const tabId = (i: number) => `${baseId}-tab-${i}`;
  const panelId = (i: number) => `${baseId}-panel-${i}`;
  const triggerBaseClass =
    'inline-flex h-9! min-h-9! w-auto! min-w-0! shrink-0 items-center justify-center gap-1.5! rounded-full! text-sm! leading-none font-medium! whitespace-nowrap [&_svg]:mx-0! [&_svg]:my-0! [&_svg]:size-4!';

  return (
    <div className={cn('flex min-w-0 flex-col gap-3', className)}>
      <ScrollShadow orientation="horizontal" hideScrollBar className="w-full max-w-full overflow-x-auto p-0.5">
        <div
          ref={tablistRef}
          role="group"
          aria-label={label}
          className="pro-surface relative inline-flex w-max items-center gap-0.5 rounded-full p-1"
        >
          {items.map((item, i) => {
            const isSelected = i === selected;
            const showExpanded = !mobileIconOnlyInactive || isSelected;
            return (
              <div
                key={item.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                className="inline-flex shrink-0"
              >
                <Button
                  id={tabId(i)}
                  variant="ghost"
                  aria-pressed={isSelected}
                  aria-label={item.ariaLabel ?? item.title}
                  excludeFromTabOrder={!isSelected}
                  onPress={() => select(i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  className={cn(
                    triggerBaseClass,
                    'text-muted transition-colors hover:text-foreground',
                    showExpanded ? 'px-3!' : 'px-2.5! md:px-3!'
                  )}
                >
                  {renderTabInner(item, isSelected, mobileIconOnlyInactive, false, badgesAlways)}
                </Button>
              </div>
            );
          })}

          <div
            ref={overlayRef}
            aria-hidden="true"
            className={cn('pointer-events-none absolute inset-0 z-10 flex items-center gap-0.5 p-1', activeColor)}
            style={{ clipPath: 'inset(0 100% 0 0)' }}
          >
            {items.map((item, i) => {
              const isSelected = i === selected;
              const showExpanded = !mobileIconOnlyInactive || isSelected;
              return (
                <span
                  key={item.id}
                  className={cn(
                    triggerBaseClass,
                    showExpanded ? 'px-3!' : 'px-2.5! md:px-3!',
                    activeTextColor
                  )}
                >
                  {renderTabInner(item, isSelected, mobileIconOnlyInactive, true, badgesAlways)}
                </span>
              );
            })}
          </div>
        </div>
      </ScrollShadow>

      {hasPanels ? (
        <div
          className="relative touch-pan-y select-none overflow-hidden rounded-2xl pro-surface data-dragging:cursor-grabbing"
          onClickCapture={(e) => {
            if (suppressClick.current) {
              suppressClick.current = false;
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onLostPointerCapture={(e) => endDrag(e, false)}
          onPointerCancel={(e) => endDrag(e, true)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => endDrag(e, false)}
        >
          <div
            ref={trackRef}
            className="flex will-change-transform"
            style={{
              width: `${count * 100}%`,
              transform: `translate3d(${(-initial * 100) / count}%, 0, 0)`
            }}
          >
            {items.map((item, i) => (
              <div
                key={item.id}
                id={panelId(i)}
                ref={(el) => {
                  panelRefs.current[i] = el;
                }}
                role="tabpanel"
                aria-labelledby={tabId(i)}
                inert={i !== selected}
                tabIndex={i === selected ? 0 : -1}
                className="p-4 outline-none"
                style={{
                  width: `${100 / count}%`,
                  opacity: i === initial ? 1 : NEIGHBOUR_OPACITY
                }}
              >
                {item.content}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
