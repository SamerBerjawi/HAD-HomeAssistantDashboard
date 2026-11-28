/**
 * Pro Media page, restarted in the Media Studio (docs/pro-ui/MEDIA.md §0, picks of 2026-11-27):
 * B · Home (Spotify) with the Immersive player, "Playing in your home" as a list, quick picks and
 * shelves, the AirPlay sheet and the Room bar, on live Home Assistant media players
 * (`useMediaHome`). Loading, no players and "HA unreachable" page states.
 */
import { haWebSocketService } from '@/services/haWebSocket';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { useMediaHome } from '../hooks/useMediaHome';
import { useBoxSize } from '../widgets/shared/useBoxSize';
import { useInDark } from '../widgets/shared/useInDark';
import MediaPage from './media/home/MediaPage';
import { MediaLoading, MediaNotSetUp, MediaUnreachable } from './media/MediaStates';

export default function ProMedia() {
  const { home, act, onTarget, loading, notSetUp, offline } = useMediaHome();
  const box = useBoxSize<HTMLDivElement>({ width: 375, height: 0 });
  const { ref: darkRef, isDark } = useInDark<HTMLDivElement>();
  const width = box.width;
  const haUrl = useAutoLayoutStore((s) => s.serverUrl);

  const retry = () => {
    const url = haWebSocketService.getCurrentUrl();
    const token = haWebSocketService.getCurrentToken();
    if (url && token) haWebSocketService.connect(url, token, true);
  };

  const page = <MediaPage home={home} width={width} dark={isDark} act={act} onTarget={onTarget} />;
  return (
    <div ref={box.ref} className="min-w-0">
      <div ref={darkRef}>
        {loading ? (
          <MediaLoading width={width} />
        ) : offline ? (
          <MediaUnreachable onRetry={retry}>{home.players.length ? page : <MediaLoading width={width} />}</MediaUnreachable>
        ) : notSetUp ? (
          <MediaNotSetUp haUrl={haUrl} />
        ) : (
          page
        )}
      </div>
    </div>
  );
}
