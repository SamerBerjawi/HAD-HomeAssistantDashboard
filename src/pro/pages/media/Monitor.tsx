import { useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PauseIcon, Speaker01Icon } from '@hugeicons/core-free-icons';
import { useAlbumArtColor } from '@/hooks/useAlbumArtColor';
import { ProWaveformScrubber } from '../../components/overview/ProWaveformScrubber';
import type { ProMediaPlayerItem } from '../../lib/overviewMedia';
import './monitor.css';

const icon = (glyph: typeof PauseIcon) => <HugeiconsIcon icon={glyph} size={18} aria-hidden />;

function Cover({ player }: { player: ProMediaPlayerItem }) {
  const [failed, setFailed] = useState(false);
  return <div className="ms-cover">{player.rawImage && !failed
    ? <img alt="" src={player.rawImage} onError={() => setFailed(true)} />
    : icon(Speaker01Icon)}</div>;
}

export function Monitor({ p, dark, seek, pause, details }: {
  details?: () => void; p: ProMediaPlayerItem; dark: boolean; seek: (id: string, position: number) => void; pause: (id: string) => void;
}) {
  const palette = useAlbumArtColor(p.rawImage, { title: p.title, artist: p.artist, darkMode: dark });
  const station = p.durationSecs === 0 && p.source;
  return <article className="pro-surface ms-D">
    <header className="ms-room">{icon(Speaker01Icon)}{p.roomName || p.name}</header>
    <div className="ms-identity"><Cover key={p.rawImage} player={p} /><div className="ms-track">
      <h4>{station || p.title || p.name}</h4><p>{station ? p.title : p.artist}</p>
    </div></div>
    {p.durationSecs > 0 && <ProWaveformScrubber title={p.title || p.name} artist={p.artist}
      duration={p.durationSecs} currentPosition={p.positionSecs} isPlaying={p.isPlaying}
      isDisabled={!p.supportsSeek} onSeek={seconds => seek(p.entityId, seconds)} palette={palette} darkMode={dark} />}
    <footer className="flex flex-wrap gap-2">{details && <Button className="min-h-11" onPress={details}>{icon(Speaker01Icon)}Details</Button>}
    {p.supportsPlayPause && <Button className="min-h-11" onPress={() => pause(p.entityId)} aria-label={'Pause ' + p.name}>{icon(PauseIcon)}Pause</Button>}</footer>
  </article>;
}

