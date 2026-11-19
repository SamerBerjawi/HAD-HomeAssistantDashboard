/**
 * Edit-mode, widget reorder, resize, visibility, and status-pill layout handlers for pro Overview.
 */
import { useCallback, useMemo } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import {
  AddCircleIcon,
  CheckmarkCircle02Icon,
  Layers01Icon,
  PencilEdit01Icon,
  RotateLeft01Icon,
  ViewIcon,
  ViewOffSlashIcon
} from '@hugeicons/core-free-icons';
import {
  applyTileReorder,
  computeTileVisibilityMode,
  toggleInSet,
  withHideBadgesToggled,
  withHiddenTiles,
  withTileVisibility
} from '@/services/overview/tileLayout';
import type { OverviewTileVisibilityMode, UserDashboardConfig } from '@/types/userConfig';
import type { PageMenuItem } from '../components/pageHeaderContext';
import {
  reorderWidgetsWithinSubset,
  withProGroupBySections,
  withProSectionOrder,
  type OverviewSectionId
} from '../lib/overviewSections';
import {
  getProWidgetSize,
  nextProWidgetSize,
  withProResetLayout,
  withProWidgetSize,
  type ProWidgetCatalogItem,
  type ProWidgetSize
} from '../lib/overviewWidgets';

interface UseProOverviewLayoutParams {
  catalog: ProWidgetCatalogItem[];
  currentTileOrder: string[];
  displayWidgetIds: string[];
  tileSizes: Record<string, string> | undefined;
  hiddenTilesSet: Set<string>;
  hiddenFromAllSet: Set<string>;
  hideBadges: boolean;
  groupBySections: boolean;
  sectionIds: OverviewSectionId[];
  isEditMode: boolean;
  setEditMode: (editing: boolean) => void;
  updateConfig: (updater: (prev: UserDashboardConfig) => UserDashboardConfig) => void;
  flushPendingSave: () => Promise<unknown>;
  onOpenAddWidgets: () => void;
}

export function useProOverviewLayout({
  catalog,
  currentTileOrder,
  displayWidgetIds,
  tileSizes,
  hiddenTilesSet,
  hiddenFromAllSet,
  hideBadges,
  groupBySections,
  sectionIds,
  isEditMode,
  setEditMode,
  updateConfig,
  flushPendingSave,
  onOpenAddWidgets
}: UseProOverviewLayoutParams) {
  const handleDoneEditMode = useCallback(() => {
    setEditMode(false);
    void flushPendingSave();
  }, [setEditMode, flushPendingSave]);

  const handleToggleEditMode = useCallback(() => {
    if (isEditMode) {
      handleDoneEditMode();
    } else {
      setEditMode(true);
    }
  }, [isEditMode, handleDoneEditMode, setEditMode]);

  const handleToggleHideBadges = useCallback(() => {
    updateConfig((prev) => withHideBadgesToggled(prev));
  }, [updateConfig]);

  const handleToggleGroupBySections = useCallback(() => {
    updateConfig((prev) => withProGroupBySections(prev, !groupBySections));
  }, [groupBySections, updateConfig]);

  const handleResetLayout = useCallback(() => {
    updateConfig((prev) => withProResetLayout(prev, catalog));
  }, [updateConfig, catalog]);

  const handleReorder = useCallback(
    (nextOrder: string[]) => {
      updateConfig((prev) => applyTileReorder(prev, currentTileOrder, nextOrder));
    },
    [updateConfig, currentTileOrder]
  );

  const handleReorderSectionWidgets = useCallback(
    (sectionWidgetIds: string[], nextSectionOrder: string[]) => {
      const nextGlobalOrder = reorderWidgetsWithinSubset(
        currentTileOrder,
        sectionWidgetIds,
        nextSectionOrder
      );
      updateConfig((prev) => applyTileReorder(prev, currentTileOrder, nextGlobalOrder));
    },
    [currentTileOrder, updateConfig]
  );

  const handleReorderSections = useCallback(
    (nextSectionOrder: OverviewSectionId[]) => {
      updateConfig((prev) => withProSectionOrder(prev, nextSectionOrder));
    },
    [updateConfig]
  );

  const handleMoveSection = useCallback(
    (sectionId: OverviewSectionId, direction: -1 | 1) => {
      const index = sectionIds.indexOf(sectionId);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= sectionIds.length) return;
      handleReorderSections(arrayMove(sectionIds, index, targetIndex));
    },
    [sectionIds, handleReorderSections]
  );

  const handleMoveWidget = useCallback(
    (widgetId: string, direction: -1 | 1) => {
      const index = displayWidgetIds.indexOf(widgetId);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= displayWidgetIds.length) return;
      handleReorder(arrayMove(displayWidgetIds, index, targetIndex));
    },
    [displayWidgetIds, handleReorder]
  );

  const handleSetSize = useCallback(
    (widgetId: string, nextSize: ProWidgetSize) => {
      updateConfig((prev) => withProWidgetSize(prev, widgetId, nextSize));
    },
    [updateConfig]
  );

  const handleCycleSize = useCallback(
    (widgetId: string) => {
      const currentSize = getProWidgetSize(tileSizes, widgetId, catalog);
      const nextSize = nextProWidgetSize(currentSize);
      updateConfig((prev) => withProWidgetSize(prev, widgetId, nextSize));
    },
    [tileSizes, catalog, updateConfig]
  );

  const handleToggleHide = useCallback(
    (widgetId: string) => {
      const nextSet = toggleInSet(hiddenTilesSet, widgetId);
      updateConfig((prev) => withHiddenTiles(prev, Array.from(nextSet)));
    },
    [hiddenTilesSet, updateConfig]
  );

  const handleSetVisibilityMode = useCallback(
    (widgetId: string, mode: OverviewTileVisibilityMode) => {
      const { nextOrder, nextHiddenTiles, nextHiddenFromAll } = computeTileVisibilityMode(
        hiddenTilesSet,
        hiddenFromAllSet,
        currentTileOrder,
        widgetId,
        mode
      );
      updateConfig((prev) => withTileVisibility(prev, nextOrder, nextHiddenTiles, nextHiddenFromAll));
    },
    [hiddenTilesSet, hiddenFromAllSet, currentTileOrder, updateConfig]
  );

  const handleShowAllWidgets = useCallback(() => {
    updateConfig((prev) => withHiddenTiles(prev, []));
  }, [updateConfig]);

  const headerMenu = useMemo<PageMenuItem[]>(
    () => [
      {
        id: 'toggle-edit',
        label: isEditMode ? 'Done customizing' : 'Customize widgets',
        icon: isEditMode ? CheckmarkCircle02Icon : PencilEdit01Icon,
        onAction: handleToggleEditMode
      },
      {
        id: 'toggle-sections',
        label: groupBySections ? 'Ungroup All tab' : 'Group All tab by sections',
        icon: Layers01Icon,
        onAction: handleToggleGroupBySections
      },
      {
        id: 'add-widgets',
        label: 'Add widgets',
        icon: AddCircleIcon,
        onAction: onOpenAddWidgets
      },
      {
        id: 'toggle-pills',
        label: hideBadges ? 'Show status pills' : 'Hide status pills',
        icon: hideBadges ? ViewIcon : ViewOffSlashIcon,
        onAction: handleToggleHideBadges
      },
      {
        id: 'reset-layout',
        label: 'Reset widget layout',
        icon: RotateLeft01Icon,
        onAction: handleResetLayout
      }
    ],
    [
      isEditMode,
      groupBySections,
      hideBadges,
      handleToggleEditMode,
      handleToggleGroupBySections,
      onOpenAddWidgets,
      handleToggleHideBadges,
      handleResetLayout
    ]
  );

  return {
    handleDoneEditMode,
    handleToggleEditMode,
    handleToggleHideBadges,
    handleToggleGroupBySections,
    handleResetLayout,
    handleReorder,
    handleReorderSectionWidgets,
    handleReorderSections,
    handleMoveSection,
    handleMoveWidget,
    handleSetSize,
    handleCycleSize,
    handleToggleHide,
    handleSetVisibilityMode,
    handleShowAllWidgets,
    headerMenu
  };
}

export type ProOverviewLayout = ReturnType<typeof useProOverviewLayout>;
