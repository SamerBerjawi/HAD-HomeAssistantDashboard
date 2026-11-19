import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode
} from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge, Button, Tooltip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowExpandDiagonal01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  DragDropVerticalIcon,
  ViewIcon,
  ViewOffSlashIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { OverviewTileVisibilityMode } from '@/types/userConfig';
import type { PillTone } from '../../lib/overviewPills';
import {
  PREDEFINED_WIDGET_SIZES,
  resolveResizeSnapSize
} from '../../lib/overviewSections';
import {
  proWidgetColSpanClass,
  proWidgetSizeLabel,
  type ProWidgetCatalogItem,
  type ProWidgetLiveSummary,
  type ProWidgetSize
} from '../../lib/overviewWidgets';
import { useMasonryRowSpan } from '../../ui/magicui/BentoGrid';
import { widgetIcon } from './widgetIcons';


/** Clicks starting on these never open the card's details. */
export const CARD_CLICK_IGNORE =
  'button, a, input, select, textarea, label, [role="slider"], [role="switch"], [role="checkbox"], [role="radio"], [data-slot^="slider"], [data-card-click="ignore"]';

const BADGE_ICON_TONE: Record<PillTone, string> = {
  default: 'pro-soft',
  accent: 'pro-soft',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger'
};

export interface SortableWidgetCardProps {
  widget: ProWidgetCatalogItem;
  summary: ProWidgetLiveSummary;
  size: ProWidgetSize;
  visibilityMode: OverviewTileVisibilityMode;
  isEditMode: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onSetSize: (nextSize: ProWidgetSize) => void;
  onToggleHide: () => void;
  customBody?: ReactNode;
  cardClassName?: string;
  isInteractive?: boolean;
  onOpenDetails?: () => void;
}

/**
 * Sortable Overview widget card with Edit Mode controls and a bottom-right corner
 * click-and-drag resize handle that snaps to the predefined sizes (`1×`, `2×`, `2×2`).
 */
export function SortableWidgetCard({
  widget,
  summary,
  size,
  visibilityMode,
  isEditMode,
  canMoveLeft,
  canMoveRight,
  onMoveLeft,
  onMoveRight,
  onSetSize,
  onToggleHide,
  customBody,
  cardClassName,
  isInteractive = false,
  onOpenDetails
}: SortableWidgetCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !isEditMode
  });

  const cardRef = useRef<HTMLElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      cardRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  const [resizePreview, setResizePreview] = useState<ProWidgetSize | null>(null);
  const resizeStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startSize: ProWidgetSize;
  } | null>(null);

  useMasonryRowSpan(cardRef);

  const handleResizePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startSize: size
    };
    setResizePreview(size);
  };

  const handleResizePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = resizeStartRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.stopPropagation();
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const snapped = resolveResizeSnapSize(drag.startSize, dx, dy);
    setResizePreview((prev) => (prev === snapped ? prev : snapped));
  };

  const finishResize = (e: PointerEvent<HTMLDivElement>, commit: boolean) => {
    const drag = resizeStartRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    e.stopPropagation();
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const snapped = resolveResizeSnapSize(drag.startSize, dx, dy);
    resizeStartRef.current = null;
    setResizePreview(null);
    if (commit && snapped !== drag.startSize) {
      onSetSize(snapped);
    }
  };

  // Standard slider keys: Right/Up grow, Left/Down shrink, Home/End jump to the ends.
  const handleResizeKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = PREDEFINED_WIDGET_SIZES.indexOf(size);
    const last = PREDEFINED_WIDGET_SIZES.length - 1;
    let target = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') target = Math.min(last, idx + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') target = Math.max(0, idx - 1);
    else if (e.key === 'Home') target = 0;
    else if (e.key === 'End') target = last;
    else return;
    e.preventDefault();
    const next = PREDEFINED_WIDGET_SIZES[target];
    if (next && next !== size) onSetSize(next);
  };

  // One rule for opening details from the card (audit P4, 2026-11-19): a click opens it unless
  // it started on a control inside the card. Widgets no longer stop click propagation themselves.
  const handleCardClick = (e: MouseEvent<HTMLElement>) => {
    const target = e.target instanceof Element ? e.target.closest(CARD_CLICK_IGNORE) : null;
    if (target && target !== e.currentTarget && e.currentTarget.contains(target)) return;
    onOpenDetails?.();
  };

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
    zIndex: isDragging || resizePreview !== null ? 40 : undefined
  };

  const Icon = widgetIcon(widget.id);
  const isHidden = visibilityMode === 'all_off';
  const isTabOnly = visibilityMode === 'tab_only';
  const iconClass = summary.badgeTone ? BADGE_ICON_TONE[summary.badgeTone] : 'pro-soft';
  const hasCustomBody = customBody !== undefined && customBody !== null;
  const isResizing = resizePreview !== null;
  const sizeIndex = PREDEFINED_WIDGET_SIZES.indexOf(size);

  return (
    <section
      ref={setRefs}
      style={style}
      aria-label={widget.title}
      data-widget-id={widget.id}
      data-widget-size={size}
      onClick={isInteractive ? handleCardClick : undefined}
      className={cn(
        'pro-surface @container isolate relative flex min-w-0 flex-col justify-between gap-3 self-start p-4 transition-opacity',
        size === '2x2' && 'min-h-56 p-5',
        proWidgetColSpanClass(size),
        isInteractive && 'cursor-pointer transition-colors hover:bg-surface-hover',
        isDragging && 'opacity-60 ring-2 ring-[var(--accent)]',
        isResizing && 'ring-2 ring-[var(--accent)]',
        isEditMode && isHidden && 'opacity-55',
        isEditMode && isTabOnly && 'ring-1 ring-warning/40',
        isEditMode && 'pb-7',
        cardClassName
      )}
    >
      {isEditMode ? (
        <div className="relative z-[1] flex flex-wrap items-center justify-between gap-1.5 border-b border-separator pb-2.5">
          <div className="flex items-center gap-1.5">
            <Tooltip delay={0}>
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                aria-label={`Drag to reorder ${widget.title}`}
                className="pro-touch-44 cursor-grab touch-none active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <HugeiconsIcon icon={DragDropVerticalIcon} size={16} />
              </Button>
              <Tooltip.Content placement="top">Drag to reorder</Tooltip.Content>
            </Tooltip>

            {isTabOnly ? (
              <Badge
                size="sm"
                variant="soft"
                color="warning"
                className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
              >
                <Badge.Label>Tab only</Badge.Label>
              </Badge>
            ) : null}
            {isHidden ? (
              <Badge
                size="sm"
                variant="soft"
                color="danger"
                className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
              >
                <Badge.Label>Hidden</Badge.Label>
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            <Tooltip delay={0}>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="pro-touch-44"
                isDisabled={!canMoveLeft}
                aria-label={`Move ${widget.title} earlier`}
                onPress={onMoveLeft}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
              </Button>
              <Tooltip.Content placement="top">Move earlier</Tooltip.Content>
            </Tooltip>

            <Tooltip delay={0}>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="pro-touch-44"
                isDisabled={!canMoveRight}
                aria-label={`Move ${widget.title} later`}
                onPress={onMoveRight}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
              </Button>
              <Tooltip.Content placement="top">Move later</Tooltip.Content>
            </Tooltip>

            <Tooltip delay={0}>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                className="pro-touch-44"
                aria-label={isHidden ? `Show ${widget.title}` : `Hide ${widget.title}`}
                onPress={onToggleHide}
              >
                <HugeiconsIcon icon={isHidden ? ViewIcon : ViewOffSlashIcon} size={15} />
              </Button>
              <Tooltip.Content placement="top">{isHidden ? 'Show widget' : 'Hide widget'}</Tooltip.Content>
            </Tooltip>
          </div>
        </div>
      ) : null}

      <header className="relative z-[1] flex items-center gap-2.5">
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-xl', iconClass)}>
          <HugeiconsIcon icon={Icon} size={18} />
        </span>
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">{widget.title}</h3>
        {isInteractive ? (
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Open ${widget.title} details`}
            className="size-7 min-w-7 shrink-0 text-muted"
            onPress={() => onOpenDetails?.()}
          >
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} />
          </Button>
        ) : null}
      </header>

      {hasCustomBody ? (
        customBody
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <p
                className={cn(
                  'min-w-0 truncate font-mono font-bold tracking-tight text-foreground',
                  size === '2x2' ? 'text-2xl' : 'text-xl'
                )}
              >
                {summary.headline}
              </p>
              {summary.badgeText ? (
                <Badge
                  size="sm"
                  variant="soft"
                  color={summary.badgeTone ?? 'default'}
                  className="static transform-none! min-h-5 min-w-0 shrink-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
                >
                  <Badge.Label>{summary.badgeText}</Badge.Label>
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted">{summary.subtitle}</p>
          </div>

          {size !== '1x' && summary.detail ? (
            <div
              className={cn(
                'rounded-xl bg-default/50 px-3 py-2 text-xs text-muted',
                size === '2x2' && 'mt-auto rounded-2xl p-3 leading-relaxed'
              )}
            >
              {summary.detail}
            </div>
          ) : null}
        </>
      )}

      {isEditMode ? (
        <>
          {isResizing ? (
            <div
              aria-live="polite"
              className="pro-surface pointer-events-none absolute right-10 bottom-2 z-30 flex items-center gap-1 rounded-full px-2 py-1 shadow-md"
            >
              {PREDEFINED_WIDGET_SIZES.map((preset) => {
                const active = resizePreview === preset;
                return (
                  <span
                    key={preset}
                    className={cn(
                      'rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors',
                      active
                        ? 'pro-accent'
                        : 'text-muted'
                    )}
                  >
                    {proWidgetSizeLabel(preset)}
                  </span>
                );
              })}
            </div>
          ) : null}

          <Tooltip delay={0}>
            <div
              role="slider"
              tabIndex={0}
              aria-label={`Drag corner to resize ${widget.title}`}
              aria-valuemin={0}
              aria-valuemax={PREDEFINED_WIDGET_SIZES.length - 1}
              aria-valuenow={sizeIndex}
              aria-valuetext={proWidgetSizeLabel(size)}
              data-resize-handle={widget.id}
              onPointerDown={handleResizePointerDown}
              onPointerMove={handleResizePointerMove}
              onPointerUp={(e) => finishResize(e, true)}
              onPointerCancel={(e) => finishResize(e, false)}
              onKeyDown={handleResizeKeyDown}
              className={cn(
                'pro-touch-44 absolute right-1.5 bottom-1.5 z-20 flex size-8 cursor-nwse-resize items-center justify-center rounded-xl transition-colors select-none touch-none focus-visible:outline-2 focus-visible:outline-[var(--accent)]',
                isResizing
                  ? 'pro-accent shadow-sm'
                  : 'bg-default/65 text-muted hover:bg-default hover:text-foreground'
              )}
            >
              <HugeiconsIcon icon={ArrowExpandDiagonal01Icon} size={15} />
            </div>
            <Tooltip.Content placement="top">
              Drag corner to resize ({proWidgetSizeLabel(size)})
            </Tooltip.Content>
          </Tooltip>
        </>
      ) : null}
    </section>
  );
}
