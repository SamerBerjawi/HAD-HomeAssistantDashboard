/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Main Rooms & Living Areas Subsystem View.
 * Rendered in 2-column mobile virtual grid with clean floating floor tabs.
 */

import React, { useState, useMemo } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import {
  Stack,
  Buildings,
  Tree,
  HouseLine,
  SquaresFour,
  Lightning,
  Star,
  PencilSimpleLine,
  ArrowCounterClockwise,
  CheckCircle
} from '@phosphor-icons/react';
import { useRoomsData } from '../../hooks/useRoomsData';
import AreaTile from '../rooms/AreaTile';
const AreaDetailView = React.lazy(() => import('./AreaDetailView'));
import DynamicPhosphorIcon from '../ui/DynamicPhosphorIcon';
import { useAutoLayoutStore } from '../../store/useAutoLayoutStore';
import ViewEmptyState from '../ui/ViewEmptyState';
import ViewLoadingState from '../ui/ViewLoadingState';
import VirtualGrid from '../layout/VirtualGrid';
import SortableGrid from '../layout/SortableGrid';
import GridTile, { GridColSpan } from '../layout/GridTile';
import { sortTilesForBento, getComputedTileSpans, sortItemsForHybrid, TileLayoutMode } from '../../utils/bentoLayout';
import { useUserConfig } from '../../contexts/ConfigContext';
import { useEditMode } from '../../contexts/EditModeContext';
import { useClassicLayoutScope } from '../../hooks/useClassicLayoutScope';
import { buildRoomPath } from '../../services/appShell';
import AdaptiveSectionTabs, { SectionTabItem } from '../common/AdaptiveSectionTabs';
import { ClassicLayoutScopeBar } from '../common/ClassicLayoutScopeBar';

interface RoomsViewProps {
  darkMode?: boolean;
}

export default function RoomsView({ darkMode = true }: RoomsViewProps) {
  const isLoading = useAutoLayoutStore((s) => s.isLoading);
  const { config, updateConfig } = useUserConfig();
  const {
    isEditMode,
    setEditMode,
    activeBreakpoint,
    editingBreakpoint,
    setEditingBreakpoint,
    activeLayoutOverrides,
    resetBreakpointOverrides
  } = useEditMode();
  const layoutScope = useClassicLayoutScope();
  const {
    areasDataList = [],
    floorDataList = [],
    toggleAreaLights,
    toggleAreaSwitches,
    toggleAreaFans,
    toggleAreaMedia,
    toggleAreaLocks,
    toggleEntityLock,
    turnOffAllAreaEntities,
    callHAService,
    updateEntityState
  } = useRoomsData();

  const selectedAreaId = useAutoLayoutStore((s) => s.selectedAreaId);
  const setSelectedAreaId = useAutoLayoutStore((s) => s.setSelectedAreaId);

  const openRoom = (areaId: string | null) => {
    setSelectedAreaId(areaId);
    const targetPath = buildRoomPath(areaId);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ tab: 'rooms', ...(areaId ? { areaId } : {}) }, '', targetPath);
    }
  };

  // Active Floor Tab Filter: 'all' | 'active' | 'favorites' | floorId
  const [selectedFloorId, setSelectedFloorId] = useState<string>('all');

  const isAreaActive = (a: (typeof areasDataList)[number]) =>
    a.activeLightsCount > 0 ||
    a.activeSwitchesCount > 0 ||
    a.activeFansCount > 0 ||
    a.activeMediaPlayersCount > 0 ||
    a.unlockedLocksCount > 0 ||
    a.sensors.doorsOpenCount > 0 ||
    a.sensors.windowsOpenCount > 0 ||
    a.sensors.motionDetected ||
    a.sensors.presenceDetected ||
    a.sensors.waterLeakDetected ||
    a.sensors.smokeDetected;

  const activeAreasCount = useMemo(() => areasDataList.filter(isAreaActive).length, [areasDataList]);
  const favoriteAreasCount = useMemo(() => areasDataList.filter((a) => a.isFavorite).length, [areasDataList]);

  // Selected Area for Drill-down View
  const selectedArea = useMemo(() => {
    if (!selectedAreaId) return null;
    return (areasDataList || []).find((a) => a.areaId === selectedAreaId) || null;
  }, [selectedAreaId, areasDataList]);

  // Filtered Floors list based on selectedFloorId
  const visibleFloors = useMemo(() => {
    if (selectedFloorId === 'all') return floorDataList || [];
    if (selectedFloorId === 'active') {
      return (floorDataList || [])
        .map((f) => ({ ...f, areas: f.areas.filter(isAreaActive) }))
        .filter((f) => f.areas.length > 0);
    }
    if (selectedFloorId === 'favorites') {
      return (floorDataList || [])
        .map((f) => ({ ...f, areas: f.areas.filter((a) => a.isFavorite) }))
        .filter((f) => f.areas.length > 0);
    }
    return (floorDataList || []).filter((f) => f.floorId === selectedFloorId);
  }, [floorDataList, selectedFloorId]);

  // Floor tab items for AdaptiveSectionTabs
  const floorTabs = useMemo<SectionTabItem[]>(() => {
    const tabs: SectionTabItem[] = [
      {
        id: 'all',
        label: 'All Floors',
        icon: SquaresFour,
        badge: (areasDataList || []).length,
        color: '#6366f1'
      },
      {
        id: 'active',
        label: 'Active',
        icon: Lightning,
        badge: activeAreasCount,
        badgeColor: activeAreasCount > 0 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold' : undefined,
        color: '#f59e0b'
      },
      ...(favoriteAreasCount > 0
        ? [
            {
              id: 'favorites',
              label: 'Favorites',
              icon: Star,
              badge: favoriteAreasCount,
              color: '#ec4899'
            }
          ]
        : [])
    ];

    (floorDataList || []).forEach((floor) => {
      const isOutdoor =
        floor.level < 0 ||
        floor.name.toLowerCase().includes('outdoor') ||
        floor.name.toLowerCase().includes('garden') ||
        floor.name.toLowerCase().includes('perimeter');
      const isUpper = floor.level >= 1;
      const defaultIconComp = isOutdoor ? Tree : isUpper ? Buildings : Stack;
      const floorIconName = floor.icon;
      const activeLights = (floor.areas || []).reduce((sum, a) => sum + (a.activeLightsCount || 0), 0);

      const TabIcon = floorIconName ? (
        <DynamicPhosphorIcon
          name={floorIconName}
          fallback={defaultIconComp}
          size={16}
          weight="bold"
        />
      ) : defaultIconComp;

      tabs.push({
        id: floor.floorId,
        label: floor.name,
        icon: TabIcon,
        color: floor.color || undefined,
        badge: activeLights > 0 ? `${activeLights} on` : (floor.areas || []).length,
        badgeColor: activeLights > 0 ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold' : undefined
      });
    });

    return tabs;
  }, [floorDataList, areasDataList]);

  // If user drilled down into a specific room, render AreaDetailView
  if (selectedArea) {
    return (
      <React.Suspense fallback={<ViewLoadingState title="Loading Living Area..." />}>
        <AreaDetailView
          area={selectedArea}
          allAreas={areasDataList.map((a) => ({ areaId: a.areaId, name: a.name }))}
          onSelectArea={(nextId) => openRoom(nextId)}
          darkMode={darkMode}
          onBack={() => openRoom(null)}
          onToggleLights={toggleAreaLights}
          onToggleLocks={toggleAreaLocks}
          onToggleEntityLock={toggleEntityLock}
          onTurnOffAll={turnOffAllAreaEntities}
          callHAService={callHAService}
          updateEntityState={updateEntityState}
        />
      </React.Suspense>
    );
  }

  if (isLoading) {
    return (
      <ViewLoadingState
        title="Loading Living Areas..."
        subtitle="Fetching areas, floors, and room entities from Home Assistant"
        darkMode={darkMode}
      />
    );
  }

  if (!floorDataList || floorDataList.length === 0) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center">
        <ViewEmptyState
          icon={HouseLine}
          title="No Areas Configured"
          badgeText="Rooms & Living Spaces"
          description="Organize your smart home devices by creating areas and floors in Home Assistant. Assigned devices will automatically populate your room view."
          configPath="Settings → Areas & Zones → Areas"
          darkMode={darkMode}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col gap-5 animate-fadeIn pb-16">
      {isEditMode ? (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <PencilSimpleLine size={16} weight="bold" className="text-sky-500" />
              <span>Customize Rooms</span>
              <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase text-sky-600 dark:text-sky-300">
                {editingBreakpoint}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['mobile', 'laptop', 'desktop'] as const).map((bp) => (
                <AriaButton
                  key={bp}
                  onPress={() => setEditingBreakpoint(bp)}
                  className={`rounded-xl px-2.5 py-1 text-xs font-bold capitalize transition-all cursor-pointer ${
                    editingBreakpoint === bp
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-white/40 text-slate-700 hover:bg-white/70 dark:bg-white/10 dark:text-slate-300'
                  }`}
                >
                  {bp === 'laptop' ? 'tablet' : bp}
                </AriaButton>
              ))}
              {(['compact', 'hybrid', 'full'] as const).map((mode) => {
                const currentMode = config?.rooms?.tileLayout || (config?.rooms?.fullWidthTiles ? 'full' : 'compact');
                return (
                  <AriaButton
                    key={mode}
                    onPress={() => void updateConfig({ rooms: { tileLayout: mode } })}
                    className={`rounded-xl px-2.5 py-1 text-xs font-bold capitalize transition-all cursor-pointer ${
                      currentMode === mode
                        ? 'bg-indigo-500 text-white shadow-xs'
                        : 'bg-white/40 text-slate-700 hover:bg-white/70 dark:bg-white/10 dark:text-slate-300'
                    }`}
                  >
                    {mode}
                  </AriaButton>
                );
              })}
              <AriaButton
                onPress={() => void resetBreakpointOverrides(areasDataList.map((a) => a.areaId))}
                className="inline-flex items-center gap-1 rounded-xl bg-white/40 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white/70 dark:bg-white/10 dark:text-slate-200 cursor-pointer"
              >
                <ArrowCounterClockwise size={13} weight="bold" />
                Reset
              </AriaButton>
              <AriaButton
                onPress={() => setEditMode(false)}
                className="inline-flex items-center gap-1 rounded-xl bg-sky-500 px-3 py-1 text-xs font-bold text-white shadow-xs hover:bg-sky-400 cursor-pointer"
              >
                <CheckCircle size={13} weight="bold" />
                Done
              </AriaButton>
            </div>
          </div>
          <div className="border-t border-sky-500/20 pt-2">
            <ClassicLayoutScopeBar layoutScope={layoutScope} compact />
          </div>
        </div>
      ) : null}

      {/* Clean Floating Floor Filter Tabs (No grey container) */}
      {(floorDataList.length > 0 || floorTabs.length > 1) && (
        <div className="w-full max-w-full min-w-0">
          <AdaptiveSectionTabs
            tabs={floorTabs}
            activeTab={selectedFloorId}
            onChange={setSelectedFloorId}
            darkMode={darkMode}
          />
        </div>
      )}

      {visibleFloors.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300/80 bg-white/30 p-8 text-center text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
          {selectedFloorId === 'active' ? 'No rooms currently have active lights, switches, motion, or open doors.' : 'No rooms match this filter.'}
        </div>
      ) : null}

      {/* Hierarchical Floor Sections in VirtualGrid */}
      <div className="flex flex-col gap-8">
        {visibleFloors.map((floor) => {
          const isOutdoor =
            floor.level < 0 ||
            floor.name.toLowerCase().includes('outdoor') ||
            floor.name.toLowerCase().includes('garden') ||
            floor.name.toLowerCase().includes('perimeter');
          const isUpper = floor.level >= 1;

          const floorIconName = floor.icon || (isOutdoor ? 'Tree' : isUpper ? 'Buildings' : 'Stack');
          const floorAccentColor = floor.color || undefined;

          return (
            <section key={floor.floorId} className="flex flex-col gap-3.5">
              {/* Floor Section Header (when multiple floors shown) */}
              {visibleFloors.length > 1 && (
                <div className="flex items-center justify-between pb-0.5">
                  <div className="flex items-center gap-2.5">
                    <DynamicPhosphorIcon
                      name={floorIconName}
                      fallback={isOutdoor ? Tree : isUpper ? Buildings : Stack}
                      size={22}
                      weight="duotone"
                      style={{ color: floorAccentColor || undefined }}
                      className={`shrink-0 ${
                        floorAccentColor
                          ? ''
                          : darkMode
                          ? 'text-indigo-400'
                          : 'text-indigo-600'
                      }`}
                    />

                    <div>
                      <h3
                        className={`text-base font-black tracking-tight ${
                          darkMode ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {floor.name}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {floor.areas.length} {floor.areas.length === 1 ? 'Area' : 'Areas'}
                        {floor.areas.reduce((sum, a) => sum + a.activeLightsCount, 0) > 0 &&
                          ` • ${floor.areas.reduce((sum, a) => sum + a.activeLightsCount, 0)} lights active`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* 2-Grid Mobile Layout for Room Tiles with SortableGrid */}
              {(() => {
                const hiddenAreasSet = new Set(config?.rooms?.hiddenAreas || []);
                const tileLayoutMode: TileLayoutMode = config?.rooms?.tileLayout || (config?.rooms?.fullWidthTiles ? 'full' : 'compact');
                const sortedAreasInitial = sortTilesForBento({
                  items: floor.areas,
                  getId: (a) => a.areaId,
                  layoutOverrides: activeLayoutOverrides,
                  breakpoint: activeBreakpoint,
                  isEditMode
                });

                const getAreaEntityCount = (a: (typeof floor.areas)[0]) =>
                  (a.totalLightsCount || 0) +
                  (a.entities?.switches?.length || 0) +
                  (a.entities?.fans?.length || 0) +
                  (a.entities?.mediaPlayers?.length || 0);

                const sortedAreas = tileLayoutMode === 'hybrid'
                  ? sortItemsForHybrid({
                      items: sortedAreasInitial,
                      getId: (a) => a.areaId,
                      layoutOverrides: activeLayoutOverrides,
                      isSmall: (a) => a.activeLightsCount === 0 && getAreaEntityCount(a) <= 2,
                      isLarge: (a) => a.activeLightsCount > 0 || getAreaEntityCount(a) >= 4
                    })
                  : sortedAreasInitial;

                const computedSpans = getComputedTileSpans({
                  mode: tileLayoutMode,
                  items: sortedAreas,
                  getId: (a) => a.areaId,
                  layoutOverrides: activeLayoutOverrides,
                  breakpoint: activeBreakpoint,
                  isSmall: (a) => a.activeLightsCount === 0 && getAreaEntityCount(a) <= 2,
                  isLarge: (a) => a.activeLightsCount > 0 || getAreaEntityCount(a) >= 4
                });

                return (
                  <SortableGrid items={sortedAreas.map((a) => a.areaId)}>
                    {sortedAreas.map((area) => {
                      const isGhosted = hiddenAreasSet.has(area.areaId);
                      const span = computedSpans.get(area.areaId) || { colSpan: 2, tabletColSpan: 3, desktopColSpan: 3, rowSpan: 1 };
                      const desktopColSpan = (span.desktopColSpan && span.desktopColSpan >= 3 ? span.desktopColSpan : 3) as GridColSpan;

                      return (
                        <GridTile
                          key={area.areaId}
                          id={area.areaId}
                          areaId={area.areaId}
                          isGhosted={isGhosted}
                          colSpan={span.colSpan}
                          rowSpan={span.rowSpan}
                          tabletColSpan={span.tabletColSpan}
                          desktopColSpan={desktopColSpan}
                          colStart={span.colStart}
                          tabletColStart={span.tabletColStart}
                          desktopColStart={span.desktopColStart}
                          onClick={() => {
                            if (!isEditMode) openRoom(area.areaId);
                          }}
                        >
                          <AreaTile
                            area={area}
                            darkMode={darkMode}
                            colSpan={span.colSpan}
                            rowSpan={span.rowSpan}
                            onSelectArea={(areaId) => {
                              if (!isEditMode) openRoom(areaId);
                            }}
                            onToggleLights={toggleAreaLights}
                            onToggleSwitches={toggleAreaSwitches}
                            onToggleFans={toggleAreaFans}
                            onToggleMedia={toggleAreaMedia}
                            onToggleLocks={toggleAreaLocks}
                          />
                        </GridTile>
                      );
                    })}
                  </SortableGrid>
                );
              })()}
            </section>
          );
        })}
      </div>
    </div>
  );
}
