import { useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { MusicNote01Icon } from '@hugeicons/core-free-icons';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { useHAImage } from '@/services/haImageService';
import { useMediaPosition } from '@/hooks/useMediaPosition';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useMediaModel } from '../widgets/media/useMediaModel';
import { useMediaActions } from '../widgets/media/useMediaActions';
import { useServiceCall } from '../widgets/shared/useServiceCall';
import MediaSheet from '../widgets/media/MediaSheet';
import type { ProMediaPlayerItem } from '../lib/overviewMedia';
import { RoomList } from './media/RoomList';
import { Monitor } from './media/Monitor';

function Player({ p, dark, actions, details }: {
  p: ProMediaPlayerItem; dark: boolean; actions: ReturnType<typeof useMediaActions>; details: () => void;
}) {
  const { call } = useServiceCall();
  const entity = useAutoLayoutStore(s => s.resolvedEntities[p.entityId]);
  const server = useAutoLayoutStore(s => s.serverUrl);
  const { imageUrl } = useHAImage(p.rawImage, server);
  const { duration, currentPosition } = useMediaPosition(entity, false, null, Number(entity?.attributes.media_duration) > 0);
  return <Monitor p={{ ...p, rawImage: imageUrl || null, durationSecs: duration, positionSecs: currentPosition }}
    dark={dark} seek={actions.seek} pause={id => void call('media_player', 'media_pause', {}, id)} details={details} />;
}

export default function ProMedia({ dark }: { dark: boolean }) {
  const model = useMediaModel();
  const actions = useMediaActions(model);
  const wide = useMediaQuery('(min-width: 768px)');
  const [selected, select] = useState('');
  const [detail, open] = useState('');
  const resolved = useAutoLayoutStore(s => s.resolvedEntities);
  const loading = useAutoLayoutStore(s => s.isLoading);
  const active = model.players.filter(p => p.isPlaying);
  const focus = active.find(p => p.entityId === selected) ?? active[0];
  const cards = wide ? active : focus ? [focus] : [];
  const icon = <HugeiconsIcon icon={MusicNote01Icon} size={18} aria-hidden />;
  return <>
    {focus && <section aria-label="Now playing">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">{icon}Now playing</h2>
      <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(p => <Player key={p.entityId} {...{p, dark, actions}} details={() => open(p.entityId)} />)}
      </div>
      {!wide && active.filter(p => p !== focus).map(p => <Button key={p.entityId} variant="ghost"
        className="mt-1 min-h-11 w-full justify-start" onPress={() => select(p.entityId)}>
        {icon}<span className="truncate">{p.roomName} · {p.title || p.name}</span>
      </Button>)}
    </section>}
    <RoomList players={model.players} loading={loading} open={open} locate={id => {
      const e = resolved[id];
      return { floorId: e?.floor_id, floorName: e?.floor?.name, roomId: e?.area_id, roomName: e?.area?.name };
    }} />
    {detail && <MediaSheet page="media" model={model} itemId={detail} onClose={() => open('')} />}
  </>;
}
