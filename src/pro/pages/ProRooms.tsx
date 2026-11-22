/**
 * Pro Rooms page (docs/pro-ui/ROOMS.md): the Ambient explorer (owner, 2026-11-22). Every room as
 * an ambient tile (compact, standard or expanded) in collapsible floor sections; "Customize"
 * (button and the header ⋮ menu) sets page options, quick actions, floor and room order, tile
 * sizes, colours, favourites and what is shown. Opening a room shows its room page
 * (`room/RoomPage.tsx`: the Area page, B + C), unchanged.
 */
import { useMemo, useState } from 'react';
import { PaintBoardIcon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { buildRoomsPage, type RoomsPageModel } from '../lib/roomsPage';
import { useProPageHeader } from '../components/pageHeaderContext';
import { useDerivedModel } from '../widgets/shared/entities';
import { RoomsCustomizeSheet } from './rooms/RoomsCustomizeSheet';
import RoomPage from './room/RoomPage';
import RoomsExplorer from './rooms/RoomsExplorer';
import { readRoomsPrefs } from './rooms/shared';

const EMPTY: string[] = [];

/** The page (hidden rooms and floors left out) and every room for the Customize sheet. */
function useRoomsPageModels(): { model: RoomsPageModel; all: RoomsPageModel } {
  const { config } = useUserConfig();
  const r = config.rooms;
  const favorites = r?.favoriteAreas ?? EMPTY;
  const hidden = r?.hiddenAreas ?? EMPTY;
  const hiddenFloors = r?.hiddenFloors ?? EMPTY;
  const floorOrder = r?.floorOrder ?? EMPTY;
  const areaOrder = r?.areaOrder ?? EMPTY;
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
    (s) => buildRoomsPage(s.resolvedAreas, s.floors, favorites, hidden, { floorOrder, hiddenFloors, areaOrder, colors }),
    (m) => JSON.stringify(m)
  );
  const all = useDerivedModel(
    (s) => buildRoomsPage(s.resolvedAreas, s.floors, favorites, EMPTY, { floorOrder, areaOrder, colors }),
    (m) => JSON.stringify(m)
  );
  return { model, all };
}

export default function ProRooms() {
  const { config } = useUserConfig();
  const { model, all } = useRoomsPageModels();
  const prefs = useMemo(() => readRoomsPrefs(config.preferences), [config.preferences]);
  const [customizing, setCustomizing] = useState(false);
  const selectedAreaId = useAutoLayoutStore((s) => s.selectedAreaId);
  const setSelectedAreaId = useAutoLayoutStore((s) => s.setSelectedAreaId);
  const menu = useMemo(() => [{ id: 'customize', label: 'Customize page', icon: PaintBoardIcon, onAction: () => setCustomizing(true) }], []);
  useProPageHeader({ menu });

  const sheet = <RoomsCustomizeSheet model={all} prefs={prefs} isOpen={customizing} onOpenChange={setCustomizing} />;
  if (selectedAreaId) return <RoomPage areaId={selectedAreaId} rooms={model.rooms} onBack={() => setSelectedAreaId(null)} onOpenRoom={setSelectedAreaId} />;
  if (all.totals.rooms === 0)
    return <div className="pro-surface rounded-[22px] px-6 py-12 text-center text-sm text-muted">No rooms yet. Areas you create in Home Assistant show up here, grouped by floor.</div>;
  return (
    <>
      <RoomsExplorer model={model} prefs={prefs} onOpenRoom={setSelectedAreaId} onCustomize={() => setCustomizing(true)} />
      {sheet}
    </>
  );
}
