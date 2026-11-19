import {
  useCallback,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactNode
} from 'react';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge, Button, Tooltip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  DragDropVerticalIcon,
  UserGroupIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { OVERVIEW_SECTION_LABELS, sectionTab, type OverviewSectionGroup, type OverviewSectionId } from '../../lib/overviewSections';
import type { OverviewTabId } from '../../lib/overviewTabs';
import {
  getProWidgetSize,
  getProWidgetVisibilityMode,
  type ProWidgetCatalogItem,
  type ProWidgetLiveSummary,
  type ProWidgetSize
} from '../../lib/overviewWidgets';
import { BentoGrid, useMasonryRowSpan } from '../../ui/magicui/BentoGrid';
import { TAB_ICON } from './OverviewTabsBar';
import { SortableWidgetCard } from './SortableWidgetCard';


interface SortableSectionContainerProps {
  section: OverviewSectionGroup;
  catalog: ProWidgetCatalogItem[];
  catalogMap: Map<string, ProWidgetCatalogItem>;
  summaries: Record<string, ProWidgetLiveSummary>;
  tileSizes: Record<string, string> | undefined;
  hiddenTilesSet: Set<string>;
  hiddenFromAllSet: Set<string>;
  isEditMode: boolean;
  canMoveEarlier: boolean;
  canMoveLater: boolean;
  onMoveSectionEarlier: () => void;
  onMoveSectionLater: () => void;
  onReorderSectionWidgets: (sectionWidgetIds: string[], nextOrder: string[]) => void;
  onSetSize: (widgetId: string, nextSize: ProWidgetSize) => void;
  onToggleHide: (widgetId: string) => void;
  onSelectTab: (tabId: OverviewTabId) => void;
  renderWidgetBody?: (widget: ProWidgetCatalogItem, size: ProWidgetSize) => ReactNode;
  getWidgetCardClassName?: (widget: ProWidgetCatalogItem, size: ProWidgetSize) => string | undefined;
  onOpenWidgetDetails?: (widgetId: string) => void;
  interactiveWidgetIds?: ReadonlySet<string>;
}

function SortableSectionContainer({
  section,
  catalog,
  catalogMap,
  summaries,
  tileSizes,
  hiddenTilesSet,
  hiddenFromAllSet,
  isEditMode,
  canMoveEarlier,
  canMoveLater,
  onMoveSectionEarlier,
  onMoveSectionLater,
  onReorderSectionWidgets,
  onSetSize,
  onToggleHide,
  onSelectTab,
  renderWidgetBody,
  getWidgetCardClassName,
  onOpenWidgetDetails,
  interactiveWidgetIds
}: SortableSectionContainerProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled: !isEditMode
  });

  const innerSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const sectionRef = useRef<HTMLElement | null>(null);
  const setRefs = useCallback(
    (node: HTMLElement | null) => {
      sectionRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef]
  );

  useMasonryRowSpan(sectionRef);

  const handleWidgetDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = section.widgetIds.indexOf(String(active.id));
      const newIndex = section.widgetIds.indexOf(String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderSectionWidgets(section.widgetIds, arrayMove(section.widgetIds, oldIndex, newIndex));
      }
    },
    [section.widgetIds, onReorderSectionWidgets]
  );

  const handleMoveWidgetInSection = useCallback(
    (widgetId: string, direction: -1 | 1) => {
      const idx = section.widgetIds.indexOf(widgetId);
      const target = idx + direction;
      if (idx === -1 || target < 0 || target >= section.widgetIds.length) return;
      onReorderSectionWidgets(section.widgetIds, arrayMove(section.widgetIds, idx, target));
    },
    [section.widgetIds, onReorderSectionWidgets]
  );

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
    zIndex: isDragging ? 30 : undefined
  };

  const tabLabel = OVERVIEW_SECTION_LABELS[sectionTab(section.id)];
  const SectionIcon = section.id === 'people' ? UserGroupIcon : TAB_ICON[section.id];

  return (
    <section
      ref={setRefs}
      style={style}
      aria-label={`${section.label} section`}
      data-overview-section={section.id}
      className={cn(
        'flex min-w-0 flex-col gap-2.5 self-start',
        section.outerColSpanClass,
        isEditMode && 'rounded-3xl border border-dashed border-separator/80 p-3',
        isDragging && 'opacity-65 ring-2 ring-[var(--accent)]'
      )}
    >
      <header className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex min-w-0 items-center gap-2">
          {isEditMode ? (
            <Tooltip delay={0}>
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                aria-label={`Drag to reorder ${section.label} section`}
                className="pro-touch-44 size-7 min-w-7 cursor-grab touch-none active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <HugeiconsIcon icon={DragDropVerticalIcon} size={14} />
              </Button>
              <Tooltip.Content placement="top">Drag section</Tooltip.Content>
            </Tooltip>
          ) : null}

          <span className="pro-soft grid size-7 shrink-0 place-items-center rounded-xl">
            <HugeiconsIcon icon={SectionIcon} size={15} />
          </span>
          <h2 className="truncate text-sm font-semibold text-foreground">{section.label}</h2>
          <Badge
            size="sm"
            variant="soft"
            color="default"
            className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
          >
            <Badge.Label>{section.widgetIds.length}</Badge.Label>
          </Badge>
        </div>

        {isEditMode ? (
          <div className="flex items-center gap-1">
            <Tooltip delay={0}>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                isDisabled={!canMoveEarlier}
                aria-label={`Move ${section.label} section earlier`}
                className="pro-touch-44 size-7 min-w-7"
                onPress={onMoveSectionEarlier}
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              </Button>
              <Tooltip.Content placement="top">Move section earlier</Tooltip.Content>
            </Tooltip>
            <Tooltip delay={0}>
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                isDisabled={!canMoveLater}
                aria-label={`Move ${section.label} section later`}
                className="pro-touch-44 size-7 min-w-7"
                onPress={onMoveSectionLater}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Button>
              <Tooltip.Content placement="top">Move section later</Tooltip.Content>
            </Tooltip>
          </div>
        ) : (
          <Tooltip delay={0}>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={`Open ${tabLabel} tab`}
              className="pro-touch-44 size-7 min-w-7 shrink-0 text-muted"
              onPress={() => onSelectTab(sectionTab(section.id))}
            >
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} />
            </Button>
            <Tooltip.Content placement="top">Filter to {tabLabel}</Tooltip.Content>
          </Tooltip>
        )}
      </header>

      <DndContext
        sensors={innerSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleWidgetDragEnd}
      >
        <SortableContext items={section.widgetIds} strategy={rectSortingStrategy}>
          <BentoGrid className={section.innerGridClass}>
            {section.widgetIds.map((id, idx) => {
              const widget = catalogMap.get(id);
              if (!widget) return null;
              const summary = summaries[id] ?? { headline: 'Ready', subtitle: widget.description };
              const size = getProWidgetSize(tileSizes, id, catalog);
              const visibilityMode = getProWidgetVisibilityMode(
                id,
                hiddenTilesSet,
                hiddenFromAllSet
              );

              return (
                <SortableWidgetCard
                  key={id}
                  widget={widget}
                  summary={summary}
                  size={size}
                  visibilityMode={visibilityMode}
                  isEditMode={isEditMode}
                  canMoveLeft={idx > 0}
                  canMoveRight={idx < section.widgetIds.length - 1}
                  onMoveLeft={() => handleMoveWidgetInSection(id, -1)}
                  onMoveRight={() => handleMoveWidgetInSection(id, 1)}
                  onSetSize={(nextSize) => onSetSize(id, nextSize)}
                  onToggleHide={() => onToggleHide(id)}
                  customBody={renderWidgetBody?.(widget, size)}
                  cardClassName={getWidgetCardClassName?.(widget, size)}
                  isInteractive={
                    !isEditMode &&
                    Boolean(
                      onOpenWidgetDetails &&
                        (interactiveWidgetIds?.has(id) || id.startsWith('camera:'))
                    )
                  }
                  onOpenDetails={() => onOpenWidgetDetails?.(id)}
                />
              );
            })}
          </BentoGrid>
        </SortableContext>
      </DndContext>
    </section>
  );
}

interface OverviewGroupedGridProps {
  sections: OverviewSectionGroup[];
  catalog: ProWidgetCatalogItem[];
  summaries: Record<string, ProWidgetLiveSummary>;
  tileSizes: Record<string, string> | undefined;
  hiddenTilesSet: Set<string>;
  hiddenFromAllSet: Set<string>;
  isEditMode: boolean;
  onReorderSections: (nextOrder: OverviewSectionId[]) => void;
  onMoveSection: (sectionId: OverviewSectionId, direction: -1 | 1) => void;
  onReorderSectionWidgets: (sectionWidgetIds: string[], nextOrder: string[]) => void;
  onSetSize: (widgetId: string, nextSize: ProWidgetSize) => void;
  onToggleHide: (widgetId: string) => void;
  onSelectTab: (tabId: OverviewTabId) => void;
  renderWidgetBody?: (widget: ProWidgetCatalogItem, size: ProWidgetSize) => ReactNode;
  getWidgetCardClassName?: (widget: ProWidgetCatalogItem, size: ProWidgetSize) => string | undefined;
  onOpenWidgetDetails?: (widgetId: string) => void;
  interactiveWidgetIds?: ReadonlySet<string>;
}

/**
 * Outer BentoGrid of category sections for the grouped `All` tab: each section is itself a
 * sortable BentoGrid so widgets reorder cleanly inside their category while sections pack tightly.
 */
export function OverviewGroupedGrid({
  sections,
  catalog,
  summaries,
  tileSizes,
  hiddenTilesSet,
  hiddenFromAllSet,
  isEditMode,
  onReorderSections,
  onMoveSection,
  onReorderSectionWidgets,
  onSetSize,
  onToggleHide,
  onSelectTab,
  renderWidgetBody,
  getWidgetCardClassName,
  onOpenWidgetDetails,
  interactiveWidgetIds
}: OverviewGroupedGridProps) {
  const outerSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const catalogMap = useMemo(() => {
    const map = new Map<string, ProWidgetCatalogItem>();
    for (const item of catalog) map.set(item.id, item);
    return map;
  }, [catalog]);

  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  const handleSectionDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sectionIds.indexOf(active.id as OverviewSectionId);
      const newIndex = sectionIds.indexOf(over.id as OverviewSectionId);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderSections(arrayMove(sectionIds, oldIndex, newIndex));
      }
    },
    [sectionIds, onReorderSections]
  );

  return (
    <section aria-label="Grouped Overview sections">
      <DndContext
        sensors={outerSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleSectionDragEnd}
      >
        <SortableContext items={sectionIds} strategy={rectSortingStrategy}>
          <BentoGrid className="gap-y-5 gap-x-4">
            {sections.map((section, idx) => (
              <SortableSectionContainer
                key={section.id}
                section={section}
                catalog={catalog}
                catalogMap={catalogMap}
                summaries={summaries}
                tileSizes={tileSizes}
                hiddenTilesSet={hiddenTilesSet}
                hiddenFromAllSet={hiddenFromAllSet}
                isEditMode={isEditMode}
                canMoveEarlier={idx > 0}
                canMoveLater={idx < sections.length - 1}
                onMoveSectionEarlier={() => onMoveSection(section.id, -1)}
                onMoveSectionLater={() => onMoveSection(section.id, 1)}
                onReorderSectionWidgets={onReorderSectionWidgets}
                onSetSize={onSetSize}
                onToggleHide={onToggleHide}
                onSelectTab={onSelectTab}
                renderWidgetBody={renderWidgetBody}
                getWidgetCardClassName={getWidgetCardClassName}
                onOpenWidgetDetails={onOpenWidgetDetails}
                interactiveWidgetIds={interactiveWidgetIds}
              />
            ))}
          </BentoGrid>
        </SortableContext>
      </DndContext>
    </section>
  );
}
