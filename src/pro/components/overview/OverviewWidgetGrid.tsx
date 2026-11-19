import { useCallback, useMemo, type ReactNode } from 'react';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { AddCircleIcon, DashboardSquare01Icon } from '@hugeicons/core-free-icons';
import type { OverviewSectionGroup, OverviewSectionId } from '../../lib/overviewSections';
import type { OverviewTabId } from '../../lib/overviewTabs';
import {
  getProWidgetSize,
  getProWidgetVisibilityMode,
  type ProWidgetCatalogItem,
  type ProWidgetLiveSummary,
  type ProWidgetSize
} from '../../lib/overviewWidgets';
import { BentoGrid } from '../../ui/magicui/BentoGrid';
import { OverviewGroupedGrid } from './OverviewGroupedGrid';
import { SortableWidgetCard } from './SortableWidgetCard';

interface OverviewWidgetGridProps {
  widgetIds: string[];
  catalog: ProWidgetCatalogItem[];
  summaries: Record<string, ProWidgetLiveSummary>;
  tileSizes: Record<string, string> | undefined;
  hiddenTilesSet: Set<string>;
  hiddenFromAllSet: Set<string>;
  activeTab: OverviewTabId;
  groupBySections: boolean;
  sections: OverviewSectionGroup[];
  isEditMode: boolean;
  onReorder: (nextOrder: string[]) => void;
  onReorderSectionWidgets: (sectionWidgetIds: string[], nextOrder: string[]) => void;
  onReorderSections: (nextOrder: OverviewSectionId[]) => void;
  onMoveSection: (sectionId: OverviewSectionId, direction: -1 | 1) => void;
  onMoveWidget: (widgetId: string, direction: -1 | 1) => void;
  onSetSize: (widgetId: string, nextSize: ProWidgetSize) => void;
  onToggleHide: (widgetId: string) => void;
  onOpenAddWidgets: () => void;
  onResetTab: () => void;
  onSelectTab: (tabId: OverviewTabId) => void;
  renderWidgetBody?: (widget: ProWidgetCatalogItem, size: ProWidgetSize) => ReactNode;
  getWidgetCardClassName?: (widget: ProWidgetCatalogItem, size: ProWidgetSize) => string | undefined;
  onOpenWidgetDetails?: (widgetId: string) => void;
  interactiveWidgetIds?: ReadonlySet<string>;
}

/**
 * Customizable multi-size widget grid for pro Overview (docs/pro-ui/DESIGN.md 7.6): renders either
 * the flat Magic UI BentoGrid or (when `groupBySections` is enabled on the `All` tab) a BentoGrid
 * of tab-aligned sections, each containing its own sortable BentoGrid.
 */
export function OverviewWidgetGrid({
  widgetIds,
  catalog,
  summaries,
  tileSizes,
  hiddenTilesSet,
  hiddenFromAllSet,
  activeTab,
  groupBySections,
  sections,
  isEditMode,
  onReorder,
  onReorderSectionWidgets,
  onReorderSections,
  onMoveSection,
  onMoveWidget,
  onSetSize,
  onToggleHide,
  onOpenAddWidgets,
  onResetTab,
  onSelectTab,
  renderWidgetBody,
  getWidgetCardClassName,
  onOpenWidgetDetails,
  interactiveWidgetIds
}: OverviewWidgetGridProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );

  const catalogMap = useMemo(() => {
    const map = new Map<string, ProWidgetCatalogItem>();
    for (const item of catalog) map.set(item.id, item);
    return map;
  }, [catalog]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = widgetIds.indexOf(String(active.id));
      const newIndex = widgetIds.indexOf(String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(arrayMove(widgetIds, oldIndex, newIndex));
      }
    },
    [widgetIds, onReorder]
  );

  if (widgetIds.length === 0) {
    return (
      <section aria-label="Overview widgets" className="pro-surface flex flex-col items-center gap-3 p-8 text-center">
        <span className="pro-soft grid size-12 place-items-center rounded-2xl">
          <HugeiconsIcon icon={DashboardSquare01Icon} size={24} />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-base font-semibold text-foreground">No widgets on this view</h2>
          <p className="max-w-sm text-xs text-muted">
            Add hidden widgets back or switch to All to view your configured Overview cards.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <Button size="sm" variant="primary" onPress={onOpenAddWidgets}>
            <HugeiconsIcon icon={AddCircleIcon} size={16} />
            Add widgets
          </Button>
          {activeTab !== 'all' ? (
            <Button size="sm" variant="tertiary" onPress={onResetTab}>
              <HugeiconsIcon icon={DashboardSquare01Icon} size={16} />
              View all
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  if (activeTab === 'all' && groupBySections && sections.length > 0) {
    return (
      <OverviewGroupedGrid
        sections={sections}
        catalog={catalog}
        summaries={summaries}
        tileSizes={tileSizes}
        hiddenTilesSet={hiddenTilesSet}
        hiddenFromAllSet={hiddenFromAllSet}
        isEditMode={isEditMode}
        onReorderSections={onReorderSections}
        onMoveSection={onMoveSection}
        onReorderSectionWidgets={onReorderSectionWidgets}
        onSetSize={onSetSize}
        onToggleHide={onToggleHide}
        onSelectTab={onSelectTab}
        renderWidgetBody={renderWidgetBody}
        getWidgetCardClassName={getWidgetCardClassName}
        onOpenWidgetDetails={onOpenWidgetDetails}
        interactiveWidgetIds={interactiveWidgetIds}
      />
    );
  }

  return (
    <section aria-label="Overview widgets">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
          <BentoGrid>
            {widgetIds.map((id, index) => {
              const widget = catalogMap.get(id);
              if (!widget) return null;
              const summary = summaries[id] ?? { headline: 'Ready', subtitle: widget.description };
              const size = getProWidgetSize(tileSizes, id, catalog);
              const visibilityMode = getProWidgetVisibilityMode(id, hiddenTilesSet, hiddenFromAllSet);

              return (
                <SortableWidgetCard
                  key={id}
                  widget={widget}
                  summary={summary}
                  size={size}
                  visibilityMode={visibilityMode}
                  isEditMode={isEditMode}
                  canMoveLeft={index > 0}
                  canMoveRight={index < widgetIds.length - 1}
                  onMoveLeft={() => onMoveWidget(id, -1)}
                  onMoveRight={() => onMoveWidget(id, 1)}
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
