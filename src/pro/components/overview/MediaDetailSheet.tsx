/**
 * Media Player Detail Sheet for pro Overview (docs/pro-ui/DESIGN.md 7.6, Option A): ProSheet
 * (Drawer on phones, Modal lg on desktop) with speaker switcher, adaptive album-art Now Playing
 * hero card, custom song-adaptive ProWaveformScrubber, HeroUI volume Slider & transport buttons,
 * expandable "Up next" track queue, Source/Sound-mode HeroUI Select pickers, and room-grouped
 * connected players list.
 */
import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, ListBox, ScrollShadow, Select } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  MusicNote03Icon,
  Radio01Icon,
  ShutDownIcon,
  Speaker01Icon,
  Tv01Icon
} from '@hugeicons/core-free-icons';
import { useAlbumArtColor } from '@/hooks/useAlbumArtColor';
import { useMediaPosition } from '@/hooks/useMediaPosition';
import { cn } from '@/lib/utils';
import { useHAImage } from '@/services/haImageService';
import type {
  ProMediaOverviewModel,
  ProMediaPlayerItem,
  ProMediaQueueTrack
} from '../../lib/overviewMedia';
import { ProSheet } from '../ProSheet';
import {
  ProMediaAdaptiveBackdrop,
  ProMediaCover,
  ProMediaTransportControls,
  ProMediaUpNextPanel,
  ProMediaVolumeSlider,
  useProDarkMode
} from './MediaShared';
import { ProWaveformScrubber } from './ProWaveformScrubber';

interface MediaDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  model: ProMediaOverviewModel;
  serverUrl: string;
  onSelectPlayer: (entityId: string) => void;
  onPlayPause: (entityId: string) => void;
  onPrev: (entityId: string) => void;
  onNext: (entityId: string) => void;
  onSeek: (entityId: string, seconds: number) => void;
  onVolumeChange: (entityId: string, volumePct: number) => void;
  onToggleMute: (entityId: string, nextMuted: boolean) => void;
  onTogglePower: (entityId: string) => void;
  onToggleShuffle: (entityId: string, nextShuffle: boolean) => void;
  onCycleRepeat: (entityId: string, currentRepeat: 'off' | 'all' | 'one') => void;
  onSelectSource: (entityId: string, source: string) => void;
  onSelectSoundMode: (entityId: string, mode: string) => void;
  onPlayQueueTrack: (entityId: string, track: ProMediaQueueTrack) => void;
}

export function MediaDetailSheet({
  isOpen,
  onOpenChange,
  model,
  serverUrl,
  onSelectPlayer,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onTogglePower,
  onToggleShuffle,
  onCycleRepeat,
  onSelectSource,
  onSelectSoundMode,
  onPlayQueueTrack
}: MediaDetailSheetProps) {
  const darkMode = useProDarkMode();
  const [queueOpen, setQueueOpen] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekOverride, setSeekOverride] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQueueOpen(true);
    }
  }, [isOpen]);

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
    isOpen && Boolean(player)
  );

  const groupedByRoom = useMemo(() => {
    const byRoom = new Map<string, ProMediaPlayerItem[]>();
    for (const p of model.players) {
      const list = byRoom.get(p.roomName);
      if (list) list.push(p);
      else byRoom.set(p.roomName, [p]);
    }
    return Array.from(byRoom.entries())
      .map(([roomName, items]) => ({
        roomName,
        items,
        playingCount: items.filter((i) => i.isPlaying).length
      }))
      .sort((a, b) => Number(b.playingCount > 0) - Number(a.playingCount > 0) || a.roomName.localeCompare(b.roomName));
  }, [model.players]);

  const artistColor = darkMode ? palette.light : palette.badgeText || palette.primary;

  const handleSeek = (seconds: number) => {
    if (!player) return;
    setSeekOverride(seconds);
    onSeek(player.entityId, seconds);
    window.setTimeout(() => setSeekOverride(null), 900);
  };

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Media & Speakers"
      subtitle={`${model.playingCount} of ${model.totalCount} players active`}
      icon={MusicNote03Icon}
      page="overview"
      size="lg"
    >
      <div className="flex flex-col gap-4 pb-2">
        {model.players.length > 1 && player ? (
          <ScrollShadow orientation="horizontal" hideScrollBar className="flex items-center gap-1.5 pb-0.5">
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
                  <HugeiconsIcon
                    icon={p.deviceKindLabel.includes('TV') ? Tv01Icon : Speaker01Icon}
                    size={13}
                  />
                  <span>{p.shortName}</span>
                  {p.isPlaying ? <span className="size-1.5 rounded-full bg-current opacity-90" /> : null}
                </Button>
              );
            })}
          </ScrollShadow>
        ) : null}

        {!player ? (
          <div className="pro-surface flex flex-col items-center gap-2 p-6 text-center">
            <HugeiconsIcon icon={MusicNote03Icon} size={22} className="text-muted" />
            <p className="text-sm font-semibold text-foreground">No media players found</p>
            <p className="text-xs text-muted">Connect a Sonos, HomePod, Cast, or TV entity in Home Assistant.</p>
          </div>
        ) : (
          <section
            aria-label={`Now playing on ${player.name}`}
            className="pro-surface relative flex flex-col gap-4 overflow-hidden p-4 sm:p-5"
          >
            <ProMediaAdaptiveBackdrop
              albumArt={albumArt || null}
              palette={palette}
              isPlaying={player.isPlaying}
              darkMode={darkMode}
              roundedClass="rounded-[inherit]"
            />

            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  size="sm"
                  variant="soft"
                  color={player.isPlaying ? 'accent' : player.isPaused ? 'warning' : 'default'}
                  className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
                >
                  <HugeiconsIcon icon={Speaker01Icon} size={11} />
                  <Badge.Label>{player.deviceKindLabel}</Badge.Label>
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

              {player.supportsTurnOnOff ? (
                <Button
                  isIconOnly
                  size="sm"
                  variant="tertiary"
                  aria-label={`Toggle power for ${player.name}`}
                  onPress={() => onTogglePower(player.entityId)}
                >
                  <HugeiconsIcon icon={ShutDownIcon} size={15} />
                </Button>
              ) : null}
            </div>

            <div className="relative z-10 flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:text-left">
              <ProMediaCover
                rawImage={player.rawImage}
                alt={player.title}
                serverUrl={serverUrl}
                sizeClass="size-28 sm:size-24 rounded-2xl shadow-lg"
                palette={palette}
                iconSize={36}
              />

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted">{player.name}</p>
                <h3 className="mt-0.5 truncate text-lg font-bold text-foreground">{player.title}</h3>
                <p className="truncate text-sm font-semibold" style={{ color: artistColor }}>
                  {player.artist}
                </p>
                {player.album ? (
                  <p className="mt-0.5 truncate text-xs text-muted">{player.album}</p>
                ) : null}
              </div>
            </div>

            <div className="relative z-10">
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
                barCount={48}
                layout="stacked"
              />
            </div>

            <div className="relative z-10 flex items-center justify-center">
              <ProMediaTransportControls
                isPlaying={player.isPlaying}
                shuffle={player.shuffle}
                repeat={player.repeat}
                supportsNextPrev={player.supportsNextPrev}
                supportsShuffle={player.supportsShuffle}
                supportsRepeat={player.supportsRepeat}
                palette={palette}
                size="lg"
                onPrev={() => onPrev(player.entityId)}
                onPlayPause={() => onPlayPause(player.entityId)}
                onNext={() => onNext(player.entityId)}
                onToggleShuffle={() => onToggleShuffle(player.entityId, !player.shuffle)}
                onCycleRepeat={() => onCycleRepeat(player.entityId, player.repeat)}
              />
            </div>

            {player.supportsVolume ? (
              <div className="relative z-10 border-t border-separator/70 pt-3">
                <ProMediaVolumeSlider
                  volumePct={player.volumePct}
                  isMuted={player.isMuted}
                  accentColor={palette.primary}
                  onToggleMute={() => onToggleMute(player.entityId, !player.isMuted)}
                  onCommitVolume={(val) => onVolumeChange(player.entityId, val)}
                />
              </div>
            ) : null}

            {(player.sourceList.length > 0 || player.soundModeList.length > 0) ? (
              <div className="relative z-10 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {player.sourceList.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted">Input source</span>
                    <Select
                      aria-label="Input source"
                      selectedKey={player.source || player.sourceList[0]}
                      onSelectionChange={(key) => {
                        if (key) onSelectSource(player.entityId, String(key));
                      }}
                    >
                      <Select.Trigger className="h-9 min-h-9 gap-2 px-3 text-xs">
                        <HugeiconsIcon icon={Radio01Icon} size={14} className="shrink-0 text-muted" />
                        <Select.Value className="flex min-w-0 flex-1 items-center gap-2 pr-6">
                          {({ selectedText }) => (
                            <span className="truncate font-medium text-foreground">
                              {selectedText || player.source || player.sourceList[0]}
                            </span>
                          )}
                        </Select.Value>
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="pro" data-page="overview">
                        <ListBox>
                          {player.sourceList.map((src) => (
                            <ListBox.Item key={src} id={src} textValue={src}>
                              <span className="truncate">{src}</span>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                ) : null}

                {player.soundModeList.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-medium text-muted">Sound mode</span>
                    <Select
                      aria-label="Sound mode"
                      selectedKey={player.soundMode || player.soundModeList[0]}
                      onSelectionChange={(key) => {
                        if (key) onSelectSoundMode(player.entityId, String(key));
                      }}
                    >
                      <Select.Trigger className="h-9 min-h-9 gap-2 px-3 text-xs">
                        <HugeiconsIcon icon={Speaker01Icon} size={14} className="shrink-0 text-muted" />
                        <Select.Value className="flex min-w-0 flex-1 items-center gap-2 pr-6">
                          {({ selectedText }) => (
                            <span className="truncate font-medium text-foreground">
                              {selectedText || player.soundMode || player.soundModeList[0]}
                            </span>
                          )}
                        </Select.Value>
                        <Select.Indicator />
                      </Select.Trigger>
                      <Select.Popover className="pro" data-page="overview">
                        <ListBox>
                          {player.soundModeList.map((mode) => (
                            <ListBox.Item key={mode} id={mode} textValue={mode}>
                              <span className="truncate">{mode}</span>
                              <ListBox.ItemIndicator />
                            </ListBox.Item>
                          ))}
                        </ListBox>
                      </Select.Popover>
                    </Select>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="relative z-10">
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
          </section>
        )}

        {groupedByRoom.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            <p className="px-0.5 text-xs font-semibold text-muted">
              Connected players ({model.totalCount})
            </p>
            {groupedByRoom.map((group) => (
              <section
                key={group.roomName}
                aria-label={group.roomName}
                className="pro-surface flex flex-col gap-2 p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                    <HugeiconsIcon icon={Home01Icon} size={14} className="text-[var(--accent)]" />
                    {group.roomName}
                  </span>
                  <Badge
                    size="sm"
                    variant="soft"
                    color={group.playingCount > 0 ? 'accent' : 'default'}
                    className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
                  >
                    <Badge.Label className="font-mono">
                      {group.playingCount}/{group.items.length} playing
                    </Badge.Label>
                  </Badge>
                </div>

                <div className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const isSelected = player?.entityId === item.entityId;
                    return (
                      <Button
                        key={item.entityId}
                        variant={isSelected ? 'secondary' : 'ghost'}
                        className={cn(
                          'h-auto w-full justify-between gap-3 rounded-xl px-2.5 py-2 text-left',
                          isSelected && 'bg-[var(--pro-accent-soft)]'
                        )}
                        onPress={() => onSelectPlayer(item.entityId)}
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-2.5">
                          <ProMediaCover
                            rawImage={item.rawImage}
                            alt={item.name}
                            serverUrl={serverUrl}
                            sizeClass="size-10 rounded-xl"
                            palette={palette}
                            iconSize={16}
                          />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-semibold text-foreground">
                              {item.name}
                            </span>
                            <span className="truncate text-xs text-muted">
                              {item.isPlaying ? `Playing · ${item.title}` : `${item.deviceKindLabel} · ${item.state}`}
                            </span>
                          </span>
                        </span>

                        <Badge
                          size="sm"
                          variant="soft"
                          color={item.isPlaying ? 'accent' : item.isPaused ? 'warning' : 'default'}
                          className="static transform-none! min-h-5 min-w-0 shrink-0 rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold"
                        >
                          <Badge.Label>
                            {item.isPlaying ? 'Playing' : item.isPaused ? 'Paused' : item.state}
                          </Badge.Label>
                        </Badge>
                      </Button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </ProSheet>
  );
}
