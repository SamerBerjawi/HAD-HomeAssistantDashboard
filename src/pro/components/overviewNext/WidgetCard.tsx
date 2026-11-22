import { memo, useCallback } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, DragDropVerticalIcon } from '@hugeicons/core-free-icons';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { cn } from '@/lib/utils';
import { usePauseOffscreen } from '../../hooks/usePauseOffscreen';
import { useReportWidgetStatus } from '../../hooks/useWidgetStatus';
import type { WidgetSize } from '../../lib/overviewLayout';
import type { OverviewSectionId } from '../../lib/overviewSections';
import { resolveDesign, type WidgetDefinition } from '../../widgets/types';
import { WidgetCardMenu } from './WidgetCardMenu';

export type EngineWidget = WidgetDefinition<never>;

/**
 * What a card can ask the layout to do. The engine passes one stable object to every card, and
 * the card binds its own id, section and span, so memoised cards keep the same props between renders.
 */
export interface CardActions {
  open: (id: string) => void;
  setSize: (section: OverviewSectionId, id: string, size: WidgetSize, span: number) => void;
  move: (section: OverviewSectionId, id: string, dir: -1 | 1, span: number) => void;
  hide: (widget: EngineWidget, span: number) => void;
  setDesign: (id: string, design: string) => void;
}

export interface WidgetCardProps {
  widget: EngineWidget;
  section: OverviewSectionId;
  /** Columns of the section's grid (resizing and moving re-flow within it). */
  span: number;
  size: WidgetSize;
  isEditing: boolean;
  canMoveEarlier: boolean;
  canMoveLater: boolean;
  design?: string;
  actions: CardActions;
}

/** The card chrome's props, with the actions already bound to this card. */
interface CardChromeProps {
  widget: EngineWidget;
  size: WidgetSize;
  isEditing: boolean;
  canMoveEarlier: boolean;
  canMoveLater: boolean;
  onOpen: () => void;
  onSetSize: (size: WidgetSize) => void;
  onMove: (dir: -1 | 1) => void;
  onHide: () => void;
  /** Stored style for widgets that offer several. */
  design?: string;
  onSetDesign?: (design: string) => void;
}

/**
 * Card chrome for every widget (Overview rebuild, Phase 2). The header (icon, title, subtitle,
 * chevron) is the one target that opens details; the body holds the widget's controls only.
 * Edit mode: a drag handle (pointer only; the menu covers keyboard) and the "⋯" menu.
 */
/**
 * One widget; an error in its model or body stays inside its own card. Memoised: a card re-renders
 * for its own model, size, style or edit state, not when another part of the page changes. Its
 * looping animations pause while it is scrolled out of view.
 */
export const WidgetCard = memo(function WidgetCard({ widget, section, span, size, isEditing, canMoveEarlier, canMoveLater, design, actions }: WidgetCardProps) {
  const id = widget.id;
  const onOpen = useCallback(() => actions.open(id), [actions, id]);
  const onSetSize = useCallback((next: WidgetSize) => actions.setSize(section, id, next, span), [actions, section, id, span]);
  const onMove = useCallback((dir: -1 | 1) => actions.move(section, id, dir, span), [actions, section, id, span]);
  const onHide = useCallback(() => actions.hide(widget, span), [actions, widget, span]);
  const onSetDesign = useCallback((style: string) => actions.setDesign(id, style), [actions, id]);
  const pauseRef = usePauseOffscreen<HTMLDivElement>();
  return (
    <div ref={pauseRef} className="h-full min-h-0">
      <ErrorBoundary variant="card" label={widget.title} resetKeys={[size, isEditing]}>
        <WidgetCardInner
          widget={widget}
          size={size}
          isEditing={isEditing}
          canMoveEarlier={canMoveEarlier}
          canMoveLater={canMoveLater}
          onOpen={onOpen}
          onSetSize={onSetSize}
          onMove={onMove}
          onHide={onHide}
          design={design}
          onSetDesign={onSetDesign}
        />
      </ErrorBoundary>
    </div>
  );
});

const DRAG_HANDLE = 'pro-drag-handle pro-touch-44 grid size-8 shrink-0 cursor-grab place-items-center rounded-lg active:cursor-grabbing';

function DragHandle({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      title="Drag to move"
      // Inline: the app's base styles set touch-action: manipulation, which would scroll instead.
      style={{ touchAction: 'none' }}
      className={cn(DRAG_HANDLE, className)}
    >
      <HugeiconsIcon icon={DragDropVerticalIcon} size={16} />
    </span>
  );
}

/** Runs the widget's model once, reports its tab count and pill, and draws the card around it. */
function WidgetCardInner(props: CardChromeProps) {
  const model = props.widget.useModel();
  useReportWidgetStatus(props.widget, model);
  const design = resolveDesign(props.widget, props.design);
  return design ? <DesignedCard {...props} model={model} DesignBody={design.Body} designId={design.id} /> : <StandardCard {...props} model={model} />;
}

type ModelOf<W> = W extends { useModel: () => infer M } ? M : never;
type WithModel = { model: ModelOf<EngineWidget> };

/**
 * A widget that owns its card (WIDGET_DESIGN.md D2): it draws its own surface and corner details
 * button. Edit mode lays the drag handle, title and menu over it on a frosted bar.
 */
function DesignedCard({
  widget,
  size,
  isEditing,
  canMoveEarlier,
  canMoveLater,
  onOpen,
  onSetSize,
  onMove,
  onHide,
  onSetDesign,
  DesignBody,
  designId,
  model
}: CardChromeProps & WithModel & { DesignBody: NonNullable<EngineWidget['designs']>[number]['Body']; designId: string }) {
  return (
    <div className={cn('relative h-full min-h-0 rounded-[24px]', isEditing && 'ring-2 ring-[var(--accent)]/50')}>
      <div className={cn('h-full', isEditing && 'opacity-80')} inert={isEditing}>
        <ErrorBoundary variant="card" label={widget.title} resetKeys={[size, designId]}>
          <DesignBody model={model} size={size} onOpenDetails={widget.Sheet && !isEditing ? onOpen : undefined} />
        </ErrorBoundary>
      </div>
      {isEditing ? (
        <div className="absolute inset-x-1.5 top-1.5 z-20 flex items-center gap-1 rounded-2xl bg-[var(--surface)]/90 p-0.5 text-foreground shadow-sm backdrop-blur-md">
          <DragHandle className="text-muted hover:bg-default" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{widget.title}</span>
          <WidgetCardMenu
            title={widget.title}
            size={size}
            sizes={widget.sizes}
            designs={widget.designs}
            design={designId}
            canMoveEarlier={canMoveEarlier}
            canMoveLater={canMoveLater}
            onSetSize={onSetSize}
            onSetDesign={onSetDesign}
            onMove={onMove}
            onHide={onHide}
          />
        </div>
      ) : null}
    </div>
  );
}

function StandardCard({ widget, model, size, isEditing, canMoveEarlier, canMoveLater, onOpen, onSetSize, onMove, onHide }: CardChromeProps & WithModel) {
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
    <article aria-label={widget.title} className={cn('pro-surface relative flex h-full min-h-0 flex-col gap-2 overflow-hidden p-3', isEditing && 'ring-1 ring-[var(--accent)]/40')}>
      <header className="relative z-[1] flex min-w-0 items-center gap-1">
        {isEditing ? <DragHandle className="text-muted hover:bg-default" /> : null}
        {isEditing ? (
          // Edit mode: handle and menu share the top row; the title gets its own line below so it
          // stays readable on a Small card on a phone.
          <span className="flex-1" />
        ) : canOpen ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto min-h-9 min-w-0 flex-1 justify-start gap-2 px-1.5 py-1"
            aria-label={`Open ${widget.title} details${subtitle ? `, ${subtitle}` : ''}`}
            onPress={onOpen}
          >
            {heading}
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="shrink-0 text-muted" />
          </Button>
        ) : (
          <div className="flex min-h-9 min-w-0 flex-1 items-center gap-2 px-1.5">{heading}</div>
        )}
        {isEditing ? (
          <WidgetCardMenu title={widget.title} size={size} sizes={widget.sizes} canMoveEarlier={canMoveEarlier} canMoveLater={canMoveLater} onSetSize={onSetSize} onMove={onMove} onHide={onHide} />
        ) : null}
      </header>
      {isEditing ? <p className="relative z-[1] -mt-1 truncate px-1.5 text-sm font-semibold leading-tight">{widget.title}</p> : null}
      {/* While arranging, the body is inert: no accidental toggles, and it leaves the tab order. */}
      <div className={cn('min-h-0 flex-1 px-1.5', isEditing && 'opacity-70')} inert={isEditing}>
        <ErrorBoundary variant="card" label={widget.title} resetKeys={[size]}>
          {Body ? <Body model={model} size={size} /> : null}
        </ErrorBoundary>
      </div>
    </article>
  );
}
