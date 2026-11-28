/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dedicated Area Detail Drill-Down View
 * Categorized device sections with category titles, bulk master actions,
 * granular sensor sub-grouping (Entry, Motion, Environmental, Safety, Energy, Battery),
 * automatic companion battery sensor pairing & deduplication, and Phosphor battery icons.
 */

import React from 'react';
import { Button as AriaButton, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { ArrowCounterClockwise, CaretDown, CaretLeft, CaretRight, CheckCircle, HouseLine, PencilSimpleLine } from '@phosphor-icons/react';
import MediaOverviewDrawer from '../overview/modals/MediaOverviewDrawer';
import ViewEmptyState from '../ui/ViewEmptyState';
import AdaptiveSectionTabs from '../common/AdaptiveSectionTabs';
import { useClassicLayoutScope } from '../../hooks/useClassicLayoutScope';
import { ClassicLayoutScopeBar } from '../common/ClassicLayoutScopeBar';
import { useAreaDetailState } from './areaDetail/useAreaDetailState';
import type { AreaDetailViewProps } from './areaDetail/shared';
import LightsSection from './areaDetail/LightsSection';
import ClimateFansSection from './areaDetail/ClimateFansSection';
import SwitchesSection from './areaDetail/SwitchesSection';
import MediaSection from './areaDetail/MediaSection';
import SensorsSection from './areaDetail/SensorsSection';
import { DomainTab } from './areaDetail/shared';

export default function AreaDetailView(props: AreaDetailViewProps) {
  const s = useAreaDetailState(props);
  const layoutScope = useClassicLayoutScope();
  const {
    activeDomainTab,
    activeMediaDrawerEntity,
    activeTotalCount,
    area,
    darkMode,
    domainTabs,
    editingBreakpoint,
    enrichedClimates,
    enrichedCovers,
    enrichedFans,
    enrichedLights,
    enrichedLocks,
    enrichedSwitches,
    enrichedVacuums,
    entities,
    isEditMode,
    resetBreakpointOverrides,
    roomEntityIds,
    sensorsCount,
    setActiveDomainTab,
    setActiveMediaDrawerEntity,
    setEditMode,
    setEditingBreakpoint,
    totalEntityCount,
    updateEntityState
  } = s;

  const allAreas = props.allAreas ?? [];
  const currentRoomIdx = allAreas.findIndex((a) => a.areaId === area.areaId);
  const prevRoom = currentRoomIdx > 0 ? allAreas[currentRoomIdx - 1] : null;
  const nextRoom = currentRoomIdx >= 0 && currentRoomIdx < allAreas.length - 1 ? allAreas[currentRoomIdx + 1] : null;

  if (totalEntityCount === 0) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center pb-24 md:pb-8">
        <ViewEmptyState
          icon={HouseLine}
          title={`No Devices in ${area.name}`}
          badgeText="Empty Room"
          description={`No smart devices, lights, sensors, or switches are currently assigned to ${area.name}. Assign entities to this area in Home Assistant.`}
          configPath={`Settings → Areas & Zones → Areas → ${area.name}`}
          darkMode={darkMode}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col gap-6 animate-fadeIn pb-24 md:pb-8 relative">
      {/* Ambient Room Wallpaper Backdrop */}
      {(area.picture || area.backgroundImageUrl) && (
        <div className="absolute -top-6 -left-6 -right-6 h-64 -z-10 overflow-hidden pointer-events-none opacity-15 dark:opacity-20 mask-[linear-gradient(to_bottom,black_50%,transparent)]">
          <img
            src={area.picture || area.backgroundImageUrl}
            alt={area.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover blur-sm scale-105"
          />
        </div>
      )}

      {/* Quick Room Switcher Bar */}
      {allAreas.length > 1 && props.onSelectArea ? (
        <div className="flex items-center justify-between gap-2">
          <MenuTrigger>
            <AriaButton className="inline-flex items-center gap-1.5 rounded-xl bg-white/40 px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-white/70 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15 backdrop-blur-md cursor-pointer">
              <span>Switch room</span>
              <CaretDown size={13} weight="bold" />
            </AriaButton>
            <Popover className="max-h-72 min-w-48 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/95">
              <Menu
                aria-label="Jump to room"
                onAction={(key) => props.onSelectArea?.(String(key))}
                className="outline-hidden"
              >
                {allAreas.map((r) => (
                  <MenuItem
                    key={r.areaId}
                    id={r.areaId}
                    textValue={r.name}
                    className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold outline-hidden ${
                      r.areaId === area.areaId
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
                        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {r.name}
                  </MenuItem>
                ))}
              </Menu>
            </Popover>
          </MenuTrigger>
          <div className="flex items-center gap-1.5">
            <AriaButton
              isDisabled={!prevRoom}
              onPress={() => prevRoom && props.onSelectArea?.(prevRoom.areaId)}
              aria-label={prevRoom ? `Previous room: ${prevRoom.name}` : 'No previous room'}
              className="inline-flex size-8 items-center justify-center rounded-xl bg-white/40 text-slate-700 hover:bg-white/70 disabled:opacity-40 dark:bg-white/10 dark:text-slate-200 cursor-pointer"
            >
              <CaretLeft size={15} weight="bold" />
            </AriaButton>
            <AriaButton
              isDisabled={!nextRoom}
              onPress={() => nextRoom && props.onSelectArea?.(nextRoom.areaId)}
              aria-label={nextRoom ? `Next room: ${nextRoom.name}` : 'No next room'}
              className="inline-flex size-8 items-center justify-center rounded-xl bg-white/40 text-slate-700 hover:bg-white/70 disabled:opacity-40 dark:bg-white/10 dark:text-slate-200 cursor-pointer"
            >
              <CaretRight size={15} weight="bold" />
            </AriaButton>
          </div>
        </div>
      ) : null}

      {isEditMode ? (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-sky-500/30 bg-sky-500/10 p-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
              <PencilSimpleLine size={16} weight="bold" className="text-sky-500" />
              <span>Customize {area.name}</span>
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
              <AriaButton
                onPress={() => void resetBreakpointOverrides(roomEntityIds)}
                className="inline-flex items-center gap-1 rounded-xl bg-white/40 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white/70 dark:bg-white/10 dark:text-slate-200 cursor-pointer"
              >
                <ArrowCounterClockwise size={13} weight="bold" />
                Reset Room
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

      {/* Top Floating Filter Bar */}
      <div className="w-full max-w-full min-w-0">
        <AdaptiveSectionTabs
          tabs={domainTabs}
          activeTab={activeDomainTab}
          onChange={(tab) => setActiveDomainTab(tab as DomainTab)}
          darkMode={darkMode}
        />
      </div>

      {activeDomainTab === 'active' && !isEditMode && activeTotalCount === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300/80 bg-white/30 p-8 text-center text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-400">
          Everything is quiet in {area.name} right now.
        </div>
      ) : null}

      {/* 1. LIGHTING CATEGORY */}
      {(activeDomainTab === 'all' || activeDomainTab === 'active' || activeDomainTab === 'lights') && enrichedLights.length > 0 && <LightsSection s={s} />}

      {/* 2. CLIMATE & FANS CATEGORY */}
      {(activeDomainTab === 'all' || activeDomainTab === 'active' || activeDomainTab === 'climate') && (enrichedClimates.length > 0 || enrichedFans.length > 0) && <ClimateFansSection s={s} />}

      {/* 3. SWITCHES, LOCKS & COVERS CATEGORY */}
      {(activeDomainTab === 'all' || activeDomainTab === 'active' || activeDomainTab === 'switches') && (enrichedSwitches.length > 0 || enrichedLocks.length > 0 || enrichedCovers.length > 0) && <SwitchesSection s={s} />}

      {/* 4. MEDIA & PLAYERS CATEGORY */}
      {(activeDomainTab === 'all' || activeDomainTab === 'active' || activeDomainTab === 'media') && (entities.mediaPlayers.length > 0 || (enrichedVacuums?.length || 0) > 0 || (entities.cameras?.length || 0) > 0) && <MediaSection s={s} />}

      {/* 5. GRANULAR SENSORS BY TYPE */}
      {(activeDomainTab === 'all' || activeDomainTab === 'active' || activeDomainTab === 'sensors') && sensorsCount > 0 && <SensorsSection s={s} />}

      {/* Media Player Sidebar Drawer */}
      {activeMediaDrawerEntity && (
        <MediaOverviewDrawer
          isOpen={Boolean(activeMediaDrawerEntity)}
          onClose={() => setActiveMediaDrawerEntity(null)}
          mediaPlayers={entities.mediaPlayers}
          activeEntity={activeMediaDrawerEntity}
          darkMode={darkMode}
          onUpdateEntity={updateEntityState}
        />
      )}
    </div>
  );
}
