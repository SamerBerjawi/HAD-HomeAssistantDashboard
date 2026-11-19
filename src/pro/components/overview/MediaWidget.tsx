/**
 * Pro Overview Media Player widget card body across 1x, 2x, and 2x2 sizes
 * (docs/pro-ui/DESIGN.md 7.6): HeroUI composed card with full rounded-square album cover,
 * dual-layer adaptive album-art background when playing, custom song-adaptive ProWaveformScrubber,
 * HeroUI transport & volume Slider controls, and an expandable "Up next" track queue menu.
 */
import { useState } from 'react';
import { Badge, Button, ScrollShadow } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  MusicNote03Icon,
  Playlist01Icon,
  Speaker01Icon
} from '@hugeicons/core-free-icons';
import { useAlbumArtColor } from '@/hooks/useAlbumArtColor';
import { useMediaPosition } from '@/hooks/useMediaPosition';
import { useHAImage } from '@/services/haImageService';
import type { ProMediaOverviewModel, ProMediaQueueTrack } from '../../lib/overviewMedia';
import type { ProWidgetSize } from '../../lib/overviewWidgets';
import {
  ProMediaAdaptiveBackdrop,
  ProMediaCover,
  ProMediaTransportControls,
  ProMediaUpNextPanel,
  ProMediaVolumeSlider,
  useProDarkMode
} from './MediaShared';
import { ProWaveformScrubber } from './ProWaveformScrubber';

interface MediaWidgetBodyProps {
  model: ProMediaOverviewModel;
  size: ProWidgetSize;
  serverUrl: string;
  onSelectPlayer: (entityId: string) => void;
  onPlayPause: (entityId: string) => void;
  onPrev: (entityId: string) => void;
  onNext: (entityId: string) => void;
  onSeek: (entityId: string, seconds: number) => void;
  onVolumeChange: (entityId: string, volumePct: number) => void;
  onToggleMute: (entityId: string, nextMuted: boolean) => void;
  onToggleShuffle: (entityId: string, nextShuffle: boolean) => void;
  onCycleRepeat: (entityId: string, currentRepeat: 'off' | 'all' | 'one') => void;
  onSelectSource: (entityId: string, source: string) => void;
  onPlayQueueTrack: (entityId: string, track: ProMediaQueueTrack) => void;
  onOpenSheet: () => void;
}

export function MediaWidgetBody({
  model,
  size,
  serverUrl,
  onSelectPlayer,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat,
  onSelectSource,
  onPlayQueueTrack,
  onOpenSheet
}: MediaWidgetBodyProps) {
  const darkMode = useProDarkMode();
  const [queueOpen, setQueueOpen] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekOverride, setSeekOverride] = useState<number | null>(null);

  const player = model.activePlayer;
  const { imageUrl: albumArt } = useHAImage(player?.rawImage || undefined, serverUrl);
  const palette = useAlbumArtColor(albumArt || null, {
    title: player?.title,
    artist: player?.artist,
    darkMode
  });
  const { currentPosition, duration } = useMediaPosition(
    model.activeEntity,
    isSeeking,
    seekOverride,
    Boolean(player)
  );

  if (!player) {
    return (
      <div className="relative z-[1] flex items-center gap-2 rounded-xl bg-default/40 p-3 text-xs text-muted">
        <HugeiconsIcon icon={MusicNote03Icon} size={16} className="shrink-0" />
        <span>{model.subtitleText}</span>
      </div>
    );
  }

  const artistColor = darkMode ? palette.light : palette.badgeText || palette.primary;
  const activeBarCount = size === '1x' ? 22 : size === '2x' ? 40 : 48;

  const handleSeek = (seconds: number) => {
    setSeekOverride(seconds);
    onSeek(player.entityId, seconds);
    window.setTimeout(() => setSeekOverride(null), 900);
  };

  if (size === '1x') {
    return (
      <>
        <ProMediaAdaptiveBackdrop
          albumArt={albumArt || null}
          palette={palette}
          isPlaying={player.isPlaying}
          darkMode={darkMode}
        />

        <div className="relative z-[1] flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <ProMediaCover
              rawImage={player.rawImage}
              alt={player.title}
              serverUrl={serverUrl}
              sizeClass="size-12 rounded-xl"
              palette={palette}
              iconSize={20}
            />

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5">
                <p className="truncate text-sm font-semibold text-foreground">{player.title}</p>
                <Badge
                  size="sm"
                  variant="soft"
                  color={model.badgeTone}
                  className="static transform-none! min-h-4.5 min-w-0 shrink-0 rounded-full border-0 px-1.5 py-0 text-[10px] font-semibold"
                >
                  <Badge.Label>
                    {player.isPlaying ? 'Playing' : player.isPaused ? 'Paused' : 'Idle'}
                  </Badge.Label>
                </Badge>
              </div>
              <p className="truncate text-xs font-medium" style={{ color: artistColor }}>
                {player.artist}
              </p>
              <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-muted">
                <HugeiconsIcon icon={Speaker01Icon} size={10} className="shrink-0" />
                <span className="truncate">{player.shortName}</span>
              </p>
            </div>
          </div>

          <ProWaveformScrubber
            title={player.title}
            artist={player.artist}
            duration={duration || player.durationSecs}
            currentPosition={currentPosition}
            isPlaying={player.isPlaying}
            isDisabled={!player.supportsSeek && !player.isPlaying}
            onSeek={handleSeek}
            onScrubbingChange={(seeking, secs) => {
              setIsSeeking(seeking);
              setSeekOverride(secs);
            }}
            palette={palette}
            darkMode={darkMode}
            barCount={activeBarCount}
            layout="inline"
            compact
          />

          <div
            className="flex items-center justify-between gap-1.5"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ProMediaTransportControls
              isPlaying={player.isPlaying}
              supportsNextPrev={player.supportsNextPrev}
              palette={palette}
              size="sm"
              onPrev={() => onPrev(player.entityId)}
              onPlayPause={() => onPlayPause(player.entityId)}
              onNext={() => onNext(player.entityId)}
            />

            <Button
              size="sm"
              variant="tertiary"
              aria-expanded={queueOpen}
              className="h-7 min-w-0 shrink gap-1 px-2 text-[11px]"
              onPress={() => setQueueOpen((prev) => !prev)}
            >
              <HugeiconsIcon icon={Playlist01Icon} size={12} style={{ color: palette.primary }} />
              <span>Up next</span>
              <HugeiconsIcon icon={queueOpen ? ArrowUp01Icon : ArrowDown01Icon} size={11} />
            </Button>
          </div>

          {queueOpen ? (
            <ProMediaUpNextPanel
              tracks={player.upNextQueue}
              queueSource={player.queueSource}
              sourceList={player.sourceList}
              activeSource={player.source}
              serverUrl={serverUrl}
              palette={palette}
              isExpanded
              showToggleHeader={false}
              onToggleExpand={() => setQueueOpen(false)}
              onPlayTrack={(track) => onPlayQueueTrack(player.entityId, track)}
              onSelectSource={(src) => onSelectSource(player.entityId, src)}
              onNextTrack={() => onNext(player.entityId)}
              supportsNext={player.supportsNextPrev}
              compact
            />
          ) : null}
        </div>
      </>
    );
  }

  if (size === '2x') {
    return (
      <>
        <ProMediaAdaptiveBackdrop
          albumArt={albumArt || null}
          palette={palette}
          isPlaying={player.isPlaying}
          darkMode={darkMode}
        />

        <div className="relative z-[1] flex flex-col gap-3">
          <div className="flex flex-col gap-3 @md:flex-row @md:items-center @md:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <ProMediaCover
                rawImage={player.rawImage}
                alt={player.title}
                serverUrl={serverUrl}
                sizeClass="size-16 rounded-2xl shadow-md"
                palette={palette}
                iconSize={24}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    size="sm"
                    variant="soft"
                    color={model.badgeTone}
                    className="static transform-none! min-h-4.5 min-w-0 gap-1 rounded-full border-0 px-2 py-0 text-[10px] font-semibold [&_svg]:size-2.5!"
                  >
                    <HugeiconsIcon icon={Speaker01Icon} size={10} />
                    <Badge.Label>{player.shortName}</Badge.Label>
                  </Badge>
                  {player.source ? (
                    <Badge
                      size="sm"
                      variant="soft"
                      color="default"
                      className="static transform-none! min-h-4.5 min-w-0 rounded-full border-0 px-2 py-0 text-[10px] font-semibold"
                    >
                      <Badge.Label>{player.source}</Badge.Label>
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-sm font-bold text-foreground">{player.title}</p>
                <p className="truncate text-xs font-medium" style={{ color: artistColor }}>
                  {player.artist}
                  {player.album ? ` · ${player.album}` : ''}
                </p>
              </div>
            </div>

            <ProMediaTransportControls
              isPlaying={player.isPlaying}
              supportsNextPrev={player.supportsNextPrev}
              palette={palette}
              size="md"
              onPrev={() => onPrev(player.entityId)}
              onPlayPause={() => onPlayPause(player.entityId)}
              onNext={() => onNext(player.entityId)}
            />
          </div>

          <ProWaveformScrubber
            title={player.title}
            artist={player.artist}
            duration={duration || player.durationSecs}
            currentPosition={currentPosition}
            isPlaying={player.isPlaying}
            isDisabled={!player.supportsSeek && !player.isPlaying}
            onSeek={handleSeek}
            onScrubbingChange={(seeking, secs) => {
              setIsSeeking(seeking);
              setSeekOverride(secs);
            }}
            palette={palette}
            darkMode={darkMode}
            barCount={activeBarCount}
            layout="inline"
          />

          <div className="grid grid-cols-1 items-center gap-2 @md:grid-cols-[minmax(0,1fr)_auto]">
            {player.supportsVolume ? (
              <ProMediaVolumeSlider
                volumePct={player.volumePct}
                isMuted={player.isMuted}
                accentColor={palette.primary}
                onToggleMute={() => onToggleMute(player.entityId, !player.isMuted)}
                onCommitVolume={(val) => onVolumeChange(player.entityId, val)}
              />
            ) : (
              <div />
            )}

            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
              <Button
                size="sm"
                variant="tertiary"
                aria-expanded={queueOpen}
                onPress={() => setQueueOpen((prev) => !prev)}
              >
                <HugeiconsIcon icon={Playlist01Icon} size={14} style={{ color: palette.primary }} />
                <span>Up next</span>
                {player.upNextQueue.length > 0 ? (
                  <span className="font-mono text-[11px] text-muted">
                    ({player.upNextQueue.length})
                  </span>
                ) : null}
                <HugeiconsIcon icon={queueOpen ? ArrowUp01Icon : ArrowDown01Icon} size={13} />
              </Button>
            </div>
          </div>

          {queueOpen ? (
            <ProMediaUpNextPanel
              tracks={player.upNextQueue}
              queueSource={player.queueSource}
              sourceList={player.sourceList}
              activeSource={player.source}
              serverUrl={serverUrl}
              palette={palette}
              isExpanded
              showToggleHeader={false}
              onToggleExpand={() => setQueueOpen(false)}
              onPlayTrack={(track) => onPlayQueueTrack(player.entityId, track)}
              onSelectSource={(src) => onSelectSource(player.entityId, src)}
              onNextTrack={() => onNext(player.entityId)}
              supportsNext={player.supportsNextPrev}
              compact
            />
          ) : null}
        </div>
      </>
    );
  }

  return (
    <>
      <ProMediaAdaptiveBackdrop
        albumArt={albumArt || null}
        palette={palette}
        isPlaying={player.isPlaying}
        darkMode={darkMode}
      />

      <div className="relative z-[1] flex flex-col gap-3">
        {model.players.length > 1 ? (
          <ScrollShadow
            orientation="horizontal"
            hideScrollBar
            className="flex items-center gap-1.5 pb-0.5"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {model.players.map((p) => {
              const selected = p.entityId === player.entityId;
              return (
                <Button
                  key={p.entityId}
                  size="sm"
                  variant={selected ? 'primary' : 'tertiary'}
                  className="shrink-0 whitespace-nowrap"
                  style={selected ? { backgroundColor: palette.primary, color: '#ffffff' } : undefined}
                  onPress={() => onSelectPlayer(p.entityId)}
                >
                  <HugeiconsIcon icon={Speaker01Icon} size={12} />
                  <span>{p.shortName}</span>
                  {p.isPlaying ? <span className="size-1.5 rounded-full bg-current opacity-85" /> : null}
                </Button>
              );
            })}
          </ScrollShadow>
        ) : null}

        <div className="flex items-center gap-3.5">
          <ProMediaCover
            rawImage={player.rawImage}
            alt={player.title}
            serverUrl={serverUrl}
            sizeClass="size-20 sm:size-22 rounded-2xl shadow-md"
            palette={palette}
            iconSize={30}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                size="sm"
                variant="soft"
                color={model.badgeTone}
                className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
              >
                <HugeiconsIcon icon={MusicNote03Icon} size={11} />
                <Badge.Label>
                  {player.isPlaying ? 'Now playing' : player.isPaused ? 'Paused' : 'Standby'}
                </Badge.Label>
              </Badge>
              {player.source ? (
                <Badge
                  size="sm"
                  variant="soft"
                  color="default"
                  className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
                >
                  <Badge.Label>{player.source}</Badge.Label>
                </Badge>
              ) : null}
            </div>

            <h4 className="mt-1.5 truncate text-base font-bold text-foreground">{player.title}</h4>
            <p className="truncate text-sm font-medium" style={{ color: artistColor }}>
              {player.artist}
            </p>
            {player.album ? <p className="truncate text-xs text-muted">{player.album}</p> : null}
          </div>
        </div>

        <ProWaveformScrubber
          title={player.title}
          artist={player.artist}
          duration={duration || player.durationSecs}
          currentPosition={currentPosition}
          isPlaying={player.isPlaying}
          isDisabled={!player.supportsSeek && !player.isPlaying}
          onSeek={handleSeek}
          onScrubbingChange={(seeking, secs) => {
            setIsSeeking(seeking);
            setSeekOverride(secs);
          }}
          palette={palette}
          darkMode={darkMode}
          barCount={activeBarCount}
          layout="stacked"
        />

        <div
          className="flex flex-wrap items-center justify-between gap-2"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ProMediaTransportControls
            isPlaying={player.isPlaying}
            shuffle={player.shuffle}
            repeat={player.repeat}
            supportsNextPrev={player.supportsNextPrev}
            supportsShuffle={player.supportsShuffle}
            supportsRepeat={player.supportsRepeat}
            palette={palette}
            size="md"
            onPrev={() => onPrev(player.entityId)}
            onPlayPause={() => onPlayPause(player.entityId)}
            onNext={() => onNext(player.entityId)}
            onToggleShuffle={() => onToggleShuffle(player.entityId, !player.shuffle)}
            onCycleRepeat={() => onCycleRepeat(player.entityId, player.repeat)}
          />

          <Button size="sm" variant="tertiary" onPress={onOpenSheet}>
            All {model.totalCount} players
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} />
          </Button>
        </div>

        {player.supportsVolume ? (
          <ProMediaVolumeSlider
            volumePct={player.volumePct}
            isMuted={player.isMuted}
            accentColor={palette.primary}
            onToggleMute={() => onToggleMute(player.entityId, !player.isMuted)}
            onCommitVolume={(val) => onVolumeChange(player.entityId, val)}
          />
        ) : null}

        <ProMediaUpNextPanel
          tracks={player.upNextQueue}
          queueSource={player.queueSource}
          sourceList={player.sourceList}
          activeSource={player.source}
          serverUrl={serverUrl}
          palette={palette}
          isExpanded={queueOpen}
          onToggleExpand={() => setQueueOpen((prev) => !prev)}
          onPlayTrack={(track) => onPlayQueueTrack(player.entityId, track)}
          onSelectSource={(src) => onSelectSource(player.entityId, src)}
          onNextTrack={() => onNext(player.entityId)}
          supportsNext={player.supportsNextPrev}
        />
      </div>
    </>
  );
}
