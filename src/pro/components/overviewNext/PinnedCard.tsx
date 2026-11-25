/**
 * Instanced Overview cards (Phase 2.2):
 * Renders individual `entity:*`, `scene:*`, `script:*`, `room:*`, or `camera:*` cards
 * inside Overview sections by reusing Pro Area tile models (`ChosenTile`) and `RoomTileBlend`.
 */
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUserConfig } from '@/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { resolveHAImageUrl } from '@/services/haImageService';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { applyEntityCustomization } from '../../areas/ha/haRoomTiles';
import { toTileModel } from '../../areas/ha/haTileModels';
import { useTileActions } from '../../areas/ha/useTileActions';
import { ChosenTile } from '../../areas/tiles/chosenTiles';
import type { TileAction, TileModel, TileSize } from '../../areas/tileTypes';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useLayoutScope } from '../../hooks/useLayoutScope';
import { usePauseOffscreen } from '../../hooks/usePauseOffscreen';
import { pinnedCardAllowedSizes, type AnyOverviewSectionId, type WidgetSize } from '../../lib/overviewLayout';
import { buildRoomItem } from '../../lib/roomsPage';
import { roomActions } from '../../lib/roomTiles';
import { RoomTileBlend } from '../../pages/rooms/RoomTileBlend';
import { enabledActions, readRoomsPrefs } from '../../pages/rooms/shared';
import { openArea } from '../../widgets/shared/navigate';
import { DragHandle } from './WidgetCard';
import { WidgetCardMenu } from './WidgetCardMenu';

interface PinnedCardProps {
  cardId: string;
  section: AnyOverviewSectionId;
  sections: readonly { id: string; title: string }[];
  size: WidgetSize;
  isEditing: boolean;
  canMoveEarlier: boolean;
  canMoveLater: boolean;
  onSetSize: (section: AnyOverviewSectionId, id: string, size: WidgetSize, span: number) => void;
  onMove: (section: AnyOverviewSectionId, id: string, dir: -1 | 1, span: number) => void;
  onMoveToSection: (id: string, fromSection: AnyOverviewSectionId, toSection: AnyOverviewSectionId) => void;
  onRemove: (id: string, section: AnyOverviewSectionId) => void;
  span: number;
}

function parseCardId(cardId: string): { kind: string; targetId: string } {
  const idx = cardId.indexOf(':');
  return idx > 0 ? { kind: cardId.slice(0, idx), targetId: cardId.slice(idx + 1) } : { kind: 'entity', targetId: cardId };
}

function PinnedRoomCard({
  areaId,
  size,
  isEditing
}: {
  areaId: string;
  size: WidgetSize;
  isEditing: boolean;
}) {
  const { config } = useUserConfig();
  const { effectiveFavorites, effectivePrefs } = useLayoutScope();
  const { device } = useDeviceType();
  const area = useAutoLayoutStore((s) => s.resolvedAreas.find((a) => a.area_id === areaId) ?? null);
  const floors = useAutoLayoutStore((s) => s.floors);

  const prefs = useMemo(() => readRoomsPrefs(effectivePrefs, device), [effectivePrefs, device]);
  const actionsOn = useMemo(() => enabledActions(prefs), [prefs]);

  const roomItem = useMemo(() => {
    if (!area) return null;
    const floorName = area.floor_id ? (floors.find((f) => f.floor_id === area.floor_id)?.name ?? null) : null;
    const override = config.rooms?.areaOverrides?.[areaId];
    return buildRoomItem(area, floorName, effectiveFavorites.includes(areaId), override);
  }, [area, floors, config.rooms?.areaOverrides, areaId, effectiveFavorites]);

  if (!roomItem) {
    return (
      <div className="pro-surface flex h-full items-center justify-center rounded-[24px] p-3 text-xs text-muted">
        Room unavailable ({areaId})
      </div>
    );
  }

  const tileSize = size === 's' ? 'standard' : 'expanded';
  return (
    <RoomTileBlend
      r={roomItem}
      size={tileSize}
      prefs={prefs}
      actions={roomActions(roomItem, actionsOn)}
      onOpen={isEditing ? () => undefined : openArea}
    />
  );
}

function PinnedEntityTile({
  entityId,
  size
}: {
  entityId: string;
  size: WidgetSize;
}) {
  const { config } = useUserConfig();
  const serverUrl = useAutoLayoutStore((s) => s.serverUrl);
  const entity = useAutoLayoutStore((s) => s.resolvedEntities[entityId] ?? null);
  const resolvedEntities = useAutoLayoutStore(useShallow((s) => s.resolvedEntities));
  const [localPatch, setLocalPatch] = useState<Partial<TileModel>>({});

  useEffect(() => {
    setLocalPatch({});
  }, [entityId]);

  const onLocal = useCallback((_key: string, patch: Partial<TileModel>) => {
    setLocalPatch((prev) => ({ ...prev, ...patch } as Partial<TileModel>));
  }, []);

  const areaIdOf = useAutoLayoutStore((s) => {
    const map = new Map(s.resolvedAreas.map((a) => [a.name.toLowerCase(), a.area_id]));
    return (name: string) => map.get(name.toLowerCase()) ?? null;
  });

  const send = useTileActions(onLocal, { areaIdOf });

  const baseModel = useMemo(() => {
    if (!entity) return null;
    const siblings = entity.device_id
      ? Object.values(resolvedEntities).filter((e) => e.device_id === entity.device_id && e.entity_id !== entity.entity_id)
      : [];
    const built = toTileModel(entity, {
      room: '',
      now: Date.now(),
      siblings,
      forceInclude: true,
      picture: (p) => resolveHAImageUrl(p, serverUrl) || null
    });
    if (!built) return null;
    return applyEntityCustomization(built, config.entities?.customizations?.[entityId]);
  }, [entity, resolvedEntities, serverUrl, config.entities?.customizations, entityId]);

  const model = useMemo(() => (baseModel ? ({ ...baseModel, ...localPatch } as TileModel) : null), [baseModel, localPatch]);

  const act = useCallback(
    (action: TileAction) => {
      if (!model) return;
      send({ key: entityId, model }, action);
    },
    [model, send, entityId]
  );

  if (!model) {
    return (
      <div className="pro-surface flex h-full items-center justify-center rounded-[24px] p-3 text-xs text-muted">
        Entity unavailable ({entityId})
      </div>
    );
  }

  return <ChosenTile e={model} size={size as TileSize} act={act} />;
}

export const PinnedCard = memo(function PinnedCard({
  cardId,
  section,
  sections,
  size,
  isEditing,
  canMoveEarlier,
  canMoveLater,
  onSetSize,
  onMove,
  onMoveToSection,
  onRemove,
  span
}: PinnedCardProps) {
  const { kind, targetId } = parseCardId(cardId);
  const pauseRef = usePauseOffscreen<HTMLDivElement>();
  const entityName = useAutoLayoutStore((s) =>
    kind === 'room'
      ? s.resolvedAreas.find((a) => a.area_id === targetId)?.name
      : s.resolvedEntities[targetId]?.name
  );
  const title = entityName || targetId;
  const allowed = pinnedCardAllowedSizes(cardId);

  return (
    <div ref={pauseRef} className={cn('relative h-full min-h-0 rounded-[24px]', isEditing && 'ring-2 ring-[var(--accent)]/50')}>
      <div className={cn('h-full', isEditing && 'opacity-80')} inert={isEditing}>
        {kind === 'room' ? (
          <PinnedRoomCard areaId={targetId} size={size} isEditing={isEditing} />
        ) : (
          <PinnedEntityTile entityId={targetId} size={size} />
        )}
      </div>
      {isEditing ? (
        <div className="absolute inset-x-1.5 top-1.5 z-20 flex items-center gap-1 rounded-2xl bg-[var(--surface)]/90 p-0.5 text-foreground shadow-sm backdrop-blur-md">
          <DragHandle className="text-muted hover:bg-default" />
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</span>
          <WidgetCardMenu
            title={title}
            size={size}
            sizes={allowed}
            canMoveEarlier={canMoveEarlier}
            canMoveLater={canMoveLater}
            onSetSize={(next) => onSetSize(section, cardId, next, span)}
            onMove={(dir) => onMove(section, cardId, dir, span)}
            onHide={() => onRemove(cardId, section)}
            hideLabel="Remove"
            sections={sections}
            currentSection={section}
            onMoveToSection={(to) => onMoveToSection(cardId, section, to)}
          />
        </div>
      ) : null}
    </div>
  );
});
