import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildRoomsPage } from '../../../src/pro/lib/roomsPage';
import { blendMetrics, roomActions, type TileSize } from '../../../src/pro/lib/roomTiles';
import { RoomTileBlend } from '../../../src/pro/pages/rooms/RoomTileBlend';
import { enabledActions, readRoomsPrefs } from '../../../src/pro/pages/rooms/shared';
import { useRuntime } from './runtime';

export function RoomCard({ area, size, options }: { area?: string; size?: string; options?: Record<string, unknown> }) {
  const { store, open, config } = useRuntime();
  const prefs = useMemo(() => readRoomsPrefs({proRooms: options}), [options]);
  const room = useMemo(() => {
    const selected = store.resolvedAreas.filter(candidate => candidate.area_id === area);
    return buildRoomsPage(selected, store.floors, config.rooms?.favoriteAreas, [], {overrides:config.rooms?.areaOverrides}).rooms[0];
  }, [area, store.resolvedAreas, store.floors, config.rooms?.favoriteAreas, config.rooms?.areaOverrides]);
  const frame = useRef<HTMLDivElement>(null);
  const [composition, setComposition] = useState<TileSize>('standard');
  useLayoutEffect(() => {
    const tile = frame.current;
    if (!tile) return;
    const measure = () => {
      const {width, height} = tile.getBoundingClientRect();
      if (!width || !height) return;
      const metrics = blendMetrics(width);
      // Between a stacked half-band and a full band, switch to HAD's vertical layout.
      if (height < (metrics.compact + metrics.band) / 2 || (size === '2x0.5' && height < metrics.band)) setComposition('compact');
      else if (width >= 320 || height >= metrics.large) setComposition('expanded');
      else setComposition('standard');
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(tile);
    return () => observer.disconnect();
  }, [Boolean(room), size]);
  if (!room) return <p className="p-4">{area ? 'This area is unavailable.' : 'Select a Home Assistant area in the card editor.'}</p>;

  return <div ref={frame} className="atc-room-frame" data-preset={size ?? '1x1'}><RoomTileBlend r={room} size={composition} showStates={options?.showStates !== false} showReading={options?.showReading !== false} showCounts={options?.showCounts !== false} prefs={prefs} actions={roomActions(room, enabledActions(prefs))} onOpen={id => open('room', id)} /></div>;
}
