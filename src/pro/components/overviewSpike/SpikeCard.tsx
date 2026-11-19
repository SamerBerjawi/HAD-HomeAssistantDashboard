import type { KeyboardEvent } from 'react';
import { Button, Dropdown, Label } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, DragDropVerticalIcon, ResizeFieldIcon, Tick02Icon, ViewOffSlashIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { SIZE_CELLS, SIZE_LABELS, type WidgetSize } from '../../lib/overviewLayout';
import type { SpikeWidget } from './spikeWidgets';

interface SpikeCardProps {
  widget: SpikeWidget;
  size: WidgetSize;
  isEditing: boolean;
  onOpen: () => void;
  onSetSize: (size: WidgetSize) => void;
  onHide: () => void;
  /** Arrow keys on the drag handle move the card one cell. */
  onMoveBy: (dx: number, dy: number) => void;
}

const MOVE_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1]
};

/**
 * Spike card: the header (icon, title, chevron) is the one target that opens details; the body
 * holds controls only. Edit mode adds a drag handle, a size menu and hide.
 */
export function SpikeCard({ widget, size, isEditing, onOpen, onSetSize, onHide, onMoveBy }: SpikeCardProps) {
  const cells = SIZE_CELLS[size];
  const handleKeyDown = (e: KeyboardEvent) => {
    const move = MOVE_KEYS[e.key];
    if (!move) return;
    e.preventDefault();
    onMoveBy(move[0], move[1]);
  };

  return (
    <article
      aria-label={widget.title}
      className={cn(
        'pro-surface flex h-full min-h-0 flex-col gap-2 overflow-hidden p-3',
        isEditing && 'ring-1 ring-[var(--accent)]/40'
      )}
    >
      <header className="flex min-w-0 items-center gap-1.5">
        {isEditing ? (
          // Not a HeroUI Button: react-aria stops pointer propagation, so react-grid-layout would
          // never see the drag start. Focusable, arrow keys move the card (spike; Phase 2 revisits).
          <span
            tabIndex={0}
            aria-label={`Move ${widget.title}. Arrow keys move it one cell.`}
            aria-keyshortcuts="ArrowLeft ArrowRight ArrowUp ArrowDown"
            title="Drag to move"
            // Inline so no stylesheet's touch-action (e.g. manipulation) lets the page scroll instead.
            style={{ touchAction: 'none' }}
            className="pro-drag-handle pro-touch-44 grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-muted outline-none hover:bg-default focus-visible:ring-2 focus-visible:ring-[var(--accent)] active:cursor-grabbing"
            onKeyDown={handleKeyDown}
          >
            <HugeiconsIcon icon={DragDropVerticalIcon} size={16} />
          </span>
        ) : null}
        <Button
          variant="ghost"
          size="sm"
          className="min-w-0 flex-1 justify-start gap-2 px-1.5"
          aria-label={`Open ${widget.title} details`}
          onPress={onOpen}
          isDisabled={isEditing}
        >
          {!isEditing ? (
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
              <HugeiconsIcon icon={widget.icon} size={16} />
            </span>
          ) : null}
          <span className="min-w-0 truncate text-sm font-semibold">{widget.title}</span>
          {!isEditing ? <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="ml-auto shrink-0 text-muted" /> : null}
        </Button>
        {isEditing ? (
          <>
            <Dropdown>
              <Button isIconOnly size="sm" variant="ghost" aria-label={`Size of ${widget.title}: ${SIZE_LABELS[size]}`} className="pro-touch-44 shrink-0">
                <HugeiconsIcon icon={ResizeFieldIcon} size={16} />
              </Button>
              <Dropdown.Popover placement="bottom end">
                <Dropdown.Menu aria-label={`Size of ${widget.title}`} onAction={(key) => onSetSize(key as WidgetSize)}>
                  {widget.sizes.map((s) => (
                    <Dropdown.Item key={s} id={s} textValue={SIZE_LABELS[s]}>
                      <HugeiconsIcon icon={Tick02Icon} size={16} className={cn('shrink-0', s !== size && 'invisible')} />
                      <Label>{SIZE_LABELS[s]}</Label>
                      <span className="ml-auto text-xs text-muted">
                        {SIZE_CELLS[s].w}×{SIZE_CELLS[s].h}
                      </span>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
            <Button isIconOnly size="sm" variant="ghost" aria-label={`Hide ${widget.title}`} className="pro-touch-44 shrink-0" onPress={onHide}>
              <HugeiconsIcon icon={ViewOffSlashIcon} size={16} />
            </Button>
          </>
        ) : null}
      </header>
      <div className="flex min-h-0 flex-1 flex-col justify-end gap-1 px-1.5">
        <p className="text-lg font-semibold leading-tight">{widget.subtitle}</p>
        <p className="text-xs text-muted">
          {SIZE_LABELS[size]} · {cells.w}×{cells.h} cells
        </p>
      </div>
    </article>
  );
}
