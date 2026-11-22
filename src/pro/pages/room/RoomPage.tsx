/**
 * One room's page (docs/pro-ui/AREA_TILES.md, batch 6 "B + C"; Area page build, phase 4): the
 * Rail frame (picture, name, facts, scenes, readings, section index) with a switch between All
 * (every section) and Now (what is on or needs a look, pinned tiles, the rest folded). One tile per
 * entity, drawn with the owner's chosen concept for its kind, live against Home Assistant. Layouts
 * are saved per room and per device class (`preferences.proAreaLayouts`); the view is remembered
 * per screen. All rooms and the previous / next room follow the Rooms page's order.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { resolveHAImageUrl } from '@/services/haImageService';
import type { UserDashboardConfig } from '@/types/userConfig';
import { resolveAssetUrl } from '@/utils/assetUrl';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { TileAction, TileModel, TileSize } from '../../areas/tileTypes';
import { areaTileName, buildAreaTiles, type AreaTile } from '../../areas/ha/haRoomTiles';
import { applyCarPicture, carDeviceId, NO_PICTURE, readCarPictures, withCarPicture } from '../../areas/ha/carPictures';
import { CarPictureControl } from '../../areas/page/CarPictureControl';
import { useTileActions } from '../../areas/ha/useTileActions';
import { ChosenTile } from '../../areas/tiles/chosenTiles';
import { useAreaLayout } from '../../areas/page/useAreaLayout';
import { foldAll } from '../../areas/page/PageNow';
import PageRail from '../../areas/page/PageRail';
import type { PageItem, PageRoom } from '../../areas/page/pageKit';
import { useHaPicture } from '../../widgets/shared/useHaPicture';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import type { RoomItem } from '../../lib/roomsPage';
import { useRoomView } from './useRoomView';

interface RoomPageProps {
  areaId: string;
  /** Rooms in the Rooms page's order, for previous / next. */
  rooms: readonly RoomItem[];
  onBack: () => void;
  onOpenRoom: (areaId: string) => void;
}

/** A tile's own changes HA does not keep (a camera switched live, rooms picked for the vacuum). */
type Patches = Record<string, Partial<TileModel>>;

export default function RoomPage({ areaId, rooms, onBack, onOpenRoom }: RoomPageProps) {
  const area = useAutoLayoutStore((s) => s.resolvedAreas.find((a) => a.area_id === areaId) ?? null);
  const areaNames = useAutoLayoutStore((s) => s.resolvedAreas.map((a) => `${a.area_id}\u0000${a.name}`).join('\u0001'));
  const serverUrl = useAutoLayoutStore((s) => s.serverUrl);
  const device = useMediaQuery('(max-width: 767px)') ? 'phone' : 'wide';
  const [view, setView] = useRoomView(device);
  const roomItem = rooms.find((r) => r.areaId === areaId);
  const photo = useHaPicture(roomItem?.picture ?? area?.picture ?? null);

  const tiles = useMemo(() => (area ? buildAreaTiles(area, { picture: (p) => resolveHAImageUrl(p, serverUrl) || null }) : []), [area, serverUrl]);
  const byKey = useMemo(() => new Map(tiles.map((t) => [t.key, t])), [tiles]);
  // The layout only cares which tiles there are, so it keeps its identity while states change.
  const itemsKey = tiles.map((t) => `${t.key}:${t.section}:${t.size.phone}${t.size.wide}:${t.focus ?? ''}`).join('|');
  const items = useMemo<PageItem[]>(() => tiles.map(({ key, section, size, focus }) => ({ key, section, size, focus })), [itemsKey]);
  const editor = useAreaLayout(areaId, items, device, foldAll);
  const { config } = useUserConfig();
  const carPictures = useMemo(() => readCarPictures(config.preferences), [config.preferences]);

  const [patches, setPatches] = useState<Patches>({});
  useEffect(() => setPatches({}), [areaId]);
  const model = useCallback(
    (key: string): TileModel => {
      const t = byKey.get(key);
      if (!t) return MISSING;
      const m = { ...t.model, ...patches[key] } as TileModel;
      if (m.kind !== 'car') return m;
      const car = applyCarPicture(m, carPictures[carDeviceId(m.entityId)], (url) => resolveAssetUrl(url) ?? null);
      return t.focus ? { ...car, focus: t.focus } : car;
    },
    [byKey, patches, carPictures]
  );
  const name = useCallback((key: string) => (byKey.get(key) ? areaTileName(byKey.get(key)!) : key), [byKey]);

  const onLocal = useCallback(
    (key: string, patch: Partial<TileModel>) =>
      setPatches((all) => {
        const next: Patches = { ...all, [key]: { ...all[key], ...patch } as Partial<TileModel> };
        // One scene holds at a time: running one ends the others.
        if (byKey.get(key)?.model.kind === 'scene' && patch.isOn) for (const t of tiles) if (t.key !== key && t.model.kind === 'scene') next[t.key] = { ...next[t.key], isOn: false } as Partial<TileModel>;
        return next;
      }),
    [byKey, tiles]
  );
  const areaIdOf = useMemo(() => {
    const ids = new Map(areaNames.split('\u0001').map((pair) => pair.split('\u0000')).map(([id, name]) => [(name ?? '').toLowerCase(), id]));
    return (room: string) => ids.get(room.toLowerCase()) ?? null;
  }, [areaNames]);
  const send = useTileActions(onLocal, { areaIdOf });
  const actOn = useCallback(
    (key: string, a: TileAction) => {
      const t = byKey.get(key);
      if (t) send({ key, model: model(key), targets: t.targets }, a);
    },
    [byKey, model, send]
  );
  const renderTile = useCallback((key: string, size: TileSize) => <ChosenTile e={model(key)} size={size} act={(a) => actOn(key, a)} />, [model, actOn]);

  if (!area) {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Button variant="ghost" size="sm" onPress={onBack} className="gap-1.5">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            All rooms
          </Button>
        </div>
        <div className="pro-surface rounded-[22px] px-6 py-12 text-center text-sm text-muted">This room is no longer in Home Assistant.</div>
      </div>
    );
  }

  const haBase = serverUrl ? resolveHAImageUrl('/', serverUrl).replace(/\/$/, '') : '';
  const room: PageRoom = {
    id: areaId,
    name: roomItem?.name ?? area.name,
    photo: photo ? `url(${JSON.stringify(photo)})` : null,
    items,
    haUrl: haBase ? `${haBase}/config/areas/area/${encodeURIComponent(areaId)}` : null
  };

  return (
    <PageRail
      views
      inset={false}
      editor={editor}
      view={view}
      onView={setView}
      room={room}
      rooms={rooms.map((r) => ({ id: r.areaId, name: r.name }))}
      onRoom={onOpenRoom}
      onBack={onBack}
      model={model}
      name={name}
      editExtras={<CarPictures cars={tiles.filter((t) => t.model.kind === 'car' && !t.focus)} chosen={carPictures} />}
      renderTile={renderTile}
      actOn={actOn}
      device={device}
    />
  );
}

/** While customizing: each car's picture (saved at once; it is the car's, not this layout's). */
function CarPictures({ cars, chosen }: { cars: AreaTile[]; chosen: Record<string, string> }) {
  const { updateConfig, uploadVehicleAsset } = useUserConfig();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<Record<string, string>>({});
  if (!cars.length) return null;
  const save = (deviceId: string, choice: string | null) =>
    updateConfig((prev: UserDashboardConfig) => ({ ...prev, preferences: withCarPicture(prev.preferences as Record<string, unknown> | undefined, deviceId, choice) as UserDashboardConfig['preferences'] }));
  return (
    <section aria-label="Car pictures" className="flex flex-col gap-3 rounded-2xl bg-[color-mix(in_srgb,currentColor_4%,transparent)] p-3">
      {cars.map((t) => {
        const id = carDeviceId(t.entityId);
        const c = chosen[id];
        const upload = async (file: File) => {
          setBusy(id);
          setError((e) => ({ ...e, [id]: '' }));
          try {
            const url = await uploadVehicleAsset(file, `car_${id}`.slice(0, 30));
            await save(id, url);
          } catch {
            setError((e) => ({ ...e, [id]: 'Could not upload the picture. PNG, JPEG or WebP up to 5 MB; uploading needs an admin.' }));
          } finally {
            setBusy(null);
          }
        };
        return (
          <CarPictureControl
            key={t.key}
            label={`${t.model.name} picture`}
            source={c === NO_PICTURE ? 'none' : c ? 'upload' : 'entity'}
            onSource={(s) => void save(id, s === 'none' ? NO_PICTURE : null)}
            onUpload={(f) => void upload(f)}
            busy={busy === id}
            error={error[id]}
          />
        );
      })}
    </section>
  );
}

/** A key the layout still names but the room no longer has (never drawn: `reconcile` drops it). */
const MISSING = { kind: 'switch', entityId: '', name: '', available: false, isOn: false } as unknown as TileModel;
