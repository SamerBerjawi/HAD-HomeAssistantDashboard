import { useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Home01Icon, Speaker01Icon } from '@hugeicons/core-free-icons';
import type { ProMediaPlayerItem } from '../../lib/overviewMedia';

interface Location {
  floorId?: string | null;
  floorName?: string;
  roomId?: string | null;
  roomName?: string;
}

export function RoomList({ players, locate, open, loading = false }: {
  players: ProMediaPlayerItem[]; locate: (id: string) => Location;
  open: (id: string) => void; loading?: boolean;
}) {
  const [filter, setFilter] = useState<string | null>(null);
  const floors = new Map<string, { name: string; rooms: Map<string, { name: string; players: ProMediaPlayerItem[] }> }>();
  for (const p of players) {
    const location = locate(p.entityId);
    const floorId = location.floorId ?? '';
    const roomId = location.roomId ?? '';
    const floor = floors.get(floorId) ?? { name: location.floorName || 'No assigned floor', rooms: new Map() };
    const room = floor.rooms.get(roomId) ?? { name: location.roomName || 'No assigned room', players: [] };
    room.players.push(p);
    floor.rooms.set(roomId, room);
    floors.set(floorId, floor);
  }
  const active = filter !== null && floors.has(filter) && floors.size > 1 ? filter : null;
  const icon = (glyph = Speaker01Icon) => <HugeiconsIcon icon={glyph} size={17} aria-hidden className="shrink-0" />;
  const ordered = [...floors].sort(([,a],[,b]) => a.name.localeCompare(b.name));
  return <section aria-label="Players by room" className="@container mt-5 space-y-3">
    <h2 className="flex items-center gap-2 text-lg font-semibold">{icon()}Players by room</h2>
    {floors.size > 1 && <div aria-label="Filter players by floor" role="group" className="flex flex-wrap gap-1">
      {[[null, 'All floors'], ...ordered.map(([id, floor]) => [id, floor.name])].map(([id, name]) =>
        <Button key={id === null ? 'all' : 'floor-' + id} size="sm" className="min-h-11" variant={active === id ? 'secondary' : 'ghost'}
          aria-pressed={active === id} onPress={() => setFilter(id)}>{icon(Home01Icon)}{name}</Button>)}
    </div>}
    {!players.length && <p className="flex items-center gap-2 text-muted">{icon()}{loading ? 'Loading players…' : 'No media players configured'}</p>}
    {ordered.filter(([id]) => active === null || id === active).map(([id, floor]) =>
      <section key={id} aria-label={floor.name} className="space-y-2">
        <h3 className="flex items-center gap-2 font-semibold">{icon(Home01Icon)}{floor.name}</h3>
        <div className="grid items-start gap-3 @min-[560px]:grid-cols-2 @min-[1000px]:grid-cols-3">
          {[...floor.rooms].sort(([,a],[,b]) => a.name.localeCompare(b.name)).map(([key, room]) =>
            <section key={key} className="pro-surface min-w-0 p-3">
              <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold">{icon(Home01Icon)}{room.name}</h4>
              {[...room.players].sort((a,b) => a.name.localeCompare(b.name)).map(p =>
                <Button key={p.entityId} variant="ghost" onPress={() => open(p.entityId)} className="flex min-h-11 w-full justify-start gap-2 px-1 text-left">
                  {icon()}<span className="min-w-0 flex-1 truncate">{p.shortName || p.name}</span>
                  <span className="shrink-0 text-xs capitalize text-muted">{p.state}</span>{icon(ArrowRight01Icon)}
                </Button>)}
            </section>)}
        </div>
      </section>)}
  </section>;
}
