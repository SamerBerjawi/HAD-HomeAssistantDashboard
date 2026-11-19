import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, DragDropVerticalIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { WidgetSize } from '../../lib/overviewLayout';
import type { WidgetDefinition } from '../../widgets/types';
import { WidgetCardMenu } from './WidgetCardMenu';

export type EngineWidget = WidgetDefinition<never>;

interface WidgetCardProps {
  widget: EngineWidget;
  size: WidgetSize;
  isEditing: boolean;
  canMoveEarlier: boolean;
  canMoveLater: boolean;
  onOpen: () => void;
  onSetSize: (size: WidgetSize) => void;
  onMove: (dir: -1 | 1) => void;
  onHide: () => void;
}

/**
 * Card chrome for every widget (Overview rebuild, Phase 2). The header (icon, title, subtitle,
 * chevron) is the one target that opens details; the body holds the widget's controls only.
 * Edit mode: a drag handle (pointer only; the menu covers keyboard) and the "⋯" menu.
 */
export function WidgetCard({ widget, size, isEditing, canMoveEarlier, canMoveLater, onOpen, onSetSize, onMove, onHide }: WidgetCardProps) {
  const model = widget.useModel();
  const Body = widget.Body;
  const subtitle = widget.subtitle?.(model);
  const canOpen = Boolean(widget.Sheet) && !isEditing;

  const heading = (
    <>
      {!isEditing ? (
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
          <HugeiconsIcon icon={widget.icon} size={16} />
        </span>
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col items-start text-left">
        <span className="w-full truncate text-sm font-semibold leading-tight">{widget.title}</span>
        {subtitle && size !== 's' ? <span className="w-full truncate text-xs font-normal leading-tight text-muted">{subtitle}</span> : null}
      </span>
    </>
  );

  return (
    <article
      aria-label={widget.title}
      className={cn('pro-surface flex h-full min-h-0 flex-col gap-2 overflow-hidden p-3', isEditing && 'ring-1 ring-[var(--accent)]/40')}
    >
      <header className="flex min-w-0 items-center gap-1">
        {isEditing ? (
          <span
            aria-hidden="true"
            title="Drag to move"
            // Inline: the app's base styles set touch-action: manipulation, which would scroll instead.
            style={{ touchAction: 'none' }}
            className="pro-drag-handle pro-touch-44 grid size-8 shrink-0 cursor-grab place-items-center rounded-lg text-muted hover:bg-default active:cursor-grabbing"
          >
            <HugeiconsIcon icon={DragDropVerticalIcon} size={16} />
          </span>
        ) : null}
        {isEditing ? (
          // Edit mode: handle and menu share the top row; the title gets its own line below so it
          // stays readable on a Small card on a phone.
          <span className="flex-1" />
        ) : canOpen ? (
          <Button variant="ghost" size="sm" className="h-auto min-h-9 min-w-0 flex-1 justify-start gap-2 px-1.5 py-1" aria-label={`Open ${widget.title} details${subtitle ? `, ${subtitle}` : ''}`} onPress={onOpen}>
            {heading}
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="shrink-0 text-muted" />
          </Button>
        ) : (
          <div className="flex min-h-9 min-w-0 flex-1 items-center gap-2 px-1.5">{heading}</div>
        )}
        {isEditing ? (
          <WidgetCardMenu
            title={widget.title}
            size={size}
            sizes={widget.sizes}
            canMoveEarlier={canMoveEarlier}
            canMoveLater={canMoveLater}
            onSetSize={onSetSize}
            onMove={onMove}
            onHide={onHide}
          />
        ) : null}
      </header>
      {isEditing ? <p className="-mt-1 truncate px-1.5 text-sm font-semibold leading-tight">{widget.title}</p> : null}
      {/* While arranging, the body is inert: no accidental toggles, and it leaves the tab order. */}
      <div className={cn('min-h-0 flex-1 px-1.5', isEditing && 'opacity-70')} inert={isEditing}>
        <Body model={model} size={size} />
      </div>
    </article>
  );
}
