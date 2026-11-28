/**
 * Pro Rooms page (docs/pro-ui/ROOMS.md + Phase 0 + Phase 1):
 * - `/rooms/:areaId` URL routing & scroll restoration
 * - Direct in-place Edit Mode with drag-and-drop tiles, floor controls, 20-step Undo/Redo,
 *   per-device density/options, per-room Settings sheet, and floating bottom `ProEditBar`.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { PaintBoardIcon, SlidersHorizontalIcon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { buildRoomPath } from '@/services/appShell';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { ProEditBar } from '../components/ProEditBar';
import { useProPageHeader } from '../components/pageHeaderContext';
import { useDeviceType } from '../hooks/useDeviceType';
import { useLayoutScope } from '../hooks/useLayoutScope';
import { useRoomsEditor, type RoomsDraft } from '../hooks/useRoomsEditor';
import type { DeviceType } from '../lib/overviewLayout';
import { buildRoomsPage, type RoomsPageModel } from '../lib/roomsPage';
import { useDerivedModel } from '../widgets/shared/entities';
import RoomPage from './room/RoomPage';
import { RoomsCustomizeSheet } from './rooms/RoomsCustomizeSheet';
import RoomsExplorer, { type RoomsExplorerEditProps } from './rooms/RoomsExplorer';
import { RoomSettingsSheet } from './rooms/RoomSettingsSheet';

const EMPTY: string[] = [];
const DEVICE_MAX_WIDTH: Record<DeviceType, number | undefined> = { phone: 430, tablet: 1024, desktop: undefined };

/** The page (hidden rooms and floors left out) and every room for the editor/options sheet. */
function useRoomsPageModels(
  favorites: string[],
  draftOverrides: Pick<RoomsDraft, 'floorOrder' | 'hiddenFloors' | 'areaOrder' | 'hiddenAreas' | 'favoriteAreas'> | null
): { model: RoomsPageModel; all: RoomsPageModel } {
  const { config } = useUserConfig();
  const r = config.rooms;
  const hidden = draftOverrides ? draftOverrides.hiddenAreas : (r?.hiddenAreas ?? EMPTY);
  const hiddenFloors = draftOverrides ? draftOverrides.hiddenFloors : (r?.hiddenFloors ?? EMPTY);
  const floorOrder = draftOverrides ? draftOverrides.floorOrder : (r?.floorOrder ?? EMPTY);
  const areaOrder = draftOverrides ? draftOverrides.areaOrder : (r?.areaOrder ?? EMPTY);
  const activeFavs = draftOverrides ? draftOverrides.favoriteAreas : favorites;
  const overrides = r?.areaOverrides;
  const colors = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [id, o] of Object.entries(overrides ?? {})) {
      const c = o?.customColor || o?.color;
      if (c) out[id] = c;
    }
    return out;
  }, [overrides]);
  const model = useDerivedModel(
    (s) => buildRoomsPage(s.resolvedAreas, s.floors, activeFavs, hidden, { floorOrder, hiddenFloors, areaOrder, colors, overrides }),
    (m) => JSON.stringify(m)
  );
  const all = useDerivedModel(
    (s) => buildRoomsPage(s.resolvedAreas, s.floors, activeFavs, EMPTY, { floorOrder, areaOrder, colors, overrides }),
    (m) => JSON.stringify(m)
  );
  return { model, all };
}

export default function ProRooms() {
  const { device: viewDevice, detected, pinned, setPinned } = useDeviceType();
  const { effectiveFavorites, scope, setAdminTarget, toggleShareEnabled, forkToPersonal, revertToShared } = useLayoutScope();
  const editor = useRoomsEditor(viewDevice);
  const { model, all } = useRoomsPageModels(effectiveFavorites, editor.draftOverrides);

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [settingsAreaId, setSettingsAreaId] = useState<string | null>(null);
  const selectedAreaId = useAutoLayoutStore((s) => s.selectedAreaId);
  const setSelectedAreaId = useAutoLayoutStore((s) => s.setSelectedAreaId);
  const savedScrollTop = useRef(0);
  const prevAreaRef = useRef<string | null>(selectedAreaId);

  // Close Rooms editor when entering an individual room view.
  useEffect(() => {
    if (selectedAreaId && editor.editing) {
      editor.cancel();
    }
  }, [selectedAreaId, editor]);

  const openRoom = useCallback(
    (areaId: string, replace = false) => {
      if (!selectedAreaId) {
        const mainEl = document.querySelector('main');
        savedScrollTop.current = mainEl ? mainEl.scrollTop : window.scrollY;
      }
      const nextPath = buildRoomPath(areaId);
      const url = new URL(window.location.href);
      url.pathname = nextPath;
      url.searchParams.delete('tab');
      if (replace) {
        window.history.replaceState({ tab: 'rooms', areaId }, '', `${url.pathname}${url.search}${url.hash}`);
      } else {
        window.history.pushState({ tab: 'rooms', areaId }, '', `${url.pathname}${url.search}${url.hash}`);
      }
      setSelectedAreaId(areaId);
    },
    [selectedAreaId, setSelectedAreaId]
  );

  const backToRooms = useCallback(() => {
    const state = window.history.state as { areaId?: string } | null;
    if (state?.areaId && window.location.pathname.startsWith('/rooms/')) {
      window.history.back();
      return;
    }
    const url = new URL(window.location.href);
    url.pathname = '/rooms';
    window.history.replaceState({ tab: 'rooms' }, '', `${url.pathname}${url.search}${url.hash}`);
    setSelectedAreaId(null);
  }, [setSelectedAreaId]);

  useEffect(() => {
    if (prevAreaRef.current && !selectedAreaId) {
      const y = savedScrollTop.current;
      requestAnimationFrame(() => {
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTop = y;
        else window.scrollTo(0, y);
      });
    }
    prevAreaRef.current = selectedAreaId;
  }, [selectedAreaId]);

  const menu = useMemo(
    () => (selectedAreaId ? [] : [{ id: 'customize', label: 'Customize page', icon: PaintBoardIcon, onAction: () => editor.begin() }]),
    [selectedAreaId, editor]
  );
  useProPageHeader({ menu, hideHeader: Boolean(selectedAreaId) });

  if (selectedAreaId) {
    return (
      <RoomPage
        areaId={selectedAreaId}
        rooms={model.rooms}
        onBack={backToRooms}
        onOpenRoom={(id) => openRoom(id, true)}
      />
    );
  }
  if (all.totals.rooms === 0)
    return <div className="pro-surface rounded-[22px] px-6 py-12 text-center text-sm text-muted">No rooms yet. Areas you create in Home Assistant show up here, grouped by floor.</div>;

  const hiddenRoomSet = new Set(editor.draftOverrides?.hiddenAreas ?? []);
  const hiddenFloorSet = new Set(editor.draftOverrides?.hiddenFloors ?? []);
  const hiddenRooms = all.rooms.filter((r) => hiddenRoomSet.has(r.areaId)).map((r) => ({ areaId: r.areaId, name: r.name }));
  const hiddenFloors = all.floors
    .filter((f) => f.floorId !== null && hiddenFloorSet.has(f.floorId))
    .map((f) => ({ floorId: f.floorId as string, name: f.name }));

  const explorerEdit: RoomsExplorerEditProps = {
    editing: editor.editing,
    hiddenRooms,
    hiddenFloors,
    favorites: editor.draftOverrides?.favoriteAreas ?? effectiveFavorites,
    onMoveRoomOnto: (floorId, activeId, overId) => editor.moveRoomOnto(all, floorId, activeId, overId),
    onMoveRoomBy: (floorId, areaId, dir) => editor.moveRoomBy(all, model, floorId, areaId, dir),
    onSetRoomSize: editor.setRoomSize,
    onToggleFavorite: editor.toggleFavoriteRoom,
    onOpenRoomSettings: (areaId) => setSettingsAreaId(areaId),
    onHideRoom: editor.toggleHideRoom,
    onShowRoom: editor.toggleHideRoom,
    onMoveFloorBy: (floorId, dir) => editor.moveFloorBy(all, floorId, dir),
    onHideFloor: editor.toggleHideFloor,
    onShowFloor: editor.toggleHideFloor
  };

  return (
    <>
      <div
        className={cn('mx-auto w-full', editor.editing && 'pb-24')}
        style={{ maxWidth: editor.editing ? DEVICE_MAX_WIDTH[editor.editingDevice] : undefined }}
      >
        <RoomsExplorer
          model={model}
          prefs={editor.prefs}
          onOpenRoom={(id) => openRoom(id, false)}
          onCustomize={editor.begin}
          edit={explorerEdit}
        />
      </div>

      {editor.editing ? (
        <ProEditBar
          pageLabel="Rooms"
          editingDevice={editor.editingDevice}
          detectedDevice={detected}
          pinnedDevice={pinned}
          scope={scope}
          mode={editor.mode}
          isDirty={editor.isDirty}
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onCancel={editor.cancel}
          onSave={() => void editor.save()}
          onReset={editor.resetToDefault}
          onSelectEditingDevice={editor.switchEditingDevice}
          onSetPinnedDevice={setPinned}
          onCopyFrom={editor.copyFromDevice}
          onAdminTargetChange={(target) => {
            editor.cancel();
            setAdminTarget(target);
          }}
          onToggleShare={(enabled) => void toggleShareEnabled(enabled)}
          onForkToPersonal={() => {
            editor.cancel();
            void forkToPersonal();
          }}
          onRevertToShared={() => {
            editor.cancel();
            void revertToShared();
          }}
          onResetToAuto={() => void editor.resetToAuto()}
          primaryAction={{
            label: 'Options',
            icon: SlidersHorizontalIcon,
            onPress: () => setOptionsOpen(true)
          }}
          extraActions={
            <Button size="sm" variant="ghost" onPress={editor.applySizesToAllDevices} className="h-7 text-xs">
              Sync sizes to all devices
            </Button>
          }
        />
      ) : null}

      <RoomsCustomizeSheet
        model={all}
        prefs={editor.prefs}
        editingDevice={editor.editingDevice}
        isOpen={optionsOpen}
        onOpenChange={setOptionsOpen}
        onUpdatePrefs={editor.updateDevicePrefs}
        onResetPageOptions={editor.resetToDefault}
      />

      <RoomSettingsSheet
        areaId={settingsAreaId}
        isOpen={Boolean(settingsAreaId)}
        onOpenChange={(open) => {
          if (!open) setSettingsAreaId(null);
        }}
      />
    </>
  );
}
