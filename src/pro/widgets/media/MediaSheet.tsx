/**
 * Media details (sheet kit, WIDGET_DESIGN.md §8). Hero in the album art's colours with the cover:
 * what plays, by whom, where, and previous / play-pause / next. Then playback (the song-shaped
 * scrubber, volume, shuffle, repeat), what's up next, source and sound mode, and every speaker by
 * room to switch to or turn on and off. `?sheet=media&id=…` opens on that player.
 */
import { useEffect, useMemo, useState } from 'react';
import { Button, ToggleButton } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { MusicNote03Icon, NextIcon, PauseIcon, PlayIcon, PreviousIcon, RepeatIcon, RepeatOne01Icon, ShuffleIcon, Speaker01Icon, Tv01Icon } from '@hugeicons/core-free-icons';
import { useAlbumArtColor } from '@/hooks/useAlbumArtColor';
import { useMediaPosition } from '@/hooks/useMediaPosition';
import { useHAImage } from '@/services/haImageService';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { ProMediaCover, ProMediaUpNextPanel, ProMediaVolumeSlider, useProDarkMode } from '../../components/overview/MediaShared';
import { ProWaveformScrubber } from '../../components/overview/ProWaveformScrubber';
import type { ProMediaOverviewModel, ProMediaPlayerItem } from '../../lib/overviewMedia';
import { ToggleSwitch } from '../controls/ControlParts';
import { DetailSheet, groupBy, HeroButton, SheetEmpty, SheetFilter, SheetHero, SheetRow, SheetSection } from '../shared/sheet/SheetKit';
import type { WidgetSheetProps } from '../types';
import { useMediaActions } from './useMediaActions';
import { useMediaSelection } from './useMediaModel';

const CHIP = 'h-8 gap-1.5 rounded-full px-3 text-xs';
const isTv = (p: ProMediaPlayerItem) => /tv|television|shield|chromecast|apple tv/i.test(`${p.deviceKindLabel} ${p.name}`);

export default function MediaSheet({ model: m, itemId, onClose }: WidgetSheetProps<ProMediaOverviewModel>) {
  const serverUrl = useAutoLayoutStore((s) => s.serverUrl) ?? '';
  const select = useMediaSelection((s) => s.select);
  const a = useMediaActions(m);
  const dark = useProDarkMode();
  const [queueOpen, setQueueOpen] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [seekTo, setSeekTo] = useState<number | null>(null);
  useEffect(() => {
    if (itemId) select(itemId);
  }, [itemId, select]);
  const p = m.activePlayer;
  const { imageUrl } = useHAImage(p?.rawImage || undefined, serverUrl);
  const palette = useAlbumArtColor(imageUrl || null, { title: p?.title, artist: p?.artist, darkMode: dark });
  const { currentPosition, duration } = useMediaPosition(m.activeEntity, seeking, seekTo, Boolean(p));
  const rooms = useMemo(() => groupBy(m.players, (x) => x.roomName, ['Other']), [m.players]);
  const seek = (secs: number) => {
    if (!p) return;
    setSeekTo(secs);
    a.seek(p.entityId, secs);
    window.setTimeout(() => setSeekTo(null), 900);
  };

  return (
    <DetailSheet
      title="Media details"
      onClose={onClose}
      hero={
        <SheetHero
          icon={p && isTv(p) ? Tv01Icon : Speaker01Icon}
          eyebrow={p ? [p.shortName, p.roomName].filter(Boolean).join(' · ') : 'Media'}
          background={p && !p.isOff ? `linear-gradient(150deg, ${palette.primary}, ${palette.dark})` : undefined}
          tone="night"
          headline={!p ? 'No players' : p.isOff ? 'Off' : p.title || p.state}
          sub={p && !p.isOff ? [p.artist, p.album].filter(Boolean).join(' · ') || undefined : m.totalCount > 0 ? m.subtitleText : undefined}
          aside={p && !p.isOff ? <ProMediaCover rawImage={p.rawImage} alt={p.title} serverUrl={serverUrl} sizeClass="size-20 sm:size-28 rounded-2xl" palette={palette} iconSize={30} /> : null}
          onClose={onClose}
          actions={
            p && !p.isOff && p.supportsPlayPause ? (
              <>
                {p.supportsNextPrev ? (
                  <HeroButton icon={PreviousIcon} ariaLabel="Previous" onPress={() => a.prev(p.entityId)}>
                    <span className="sr-only">Previous</span>
                  </HeroButton>
                ) : null}
                <HeroButton icon={p.isPlaying ? PauseIcon : PlayIcon} solid onPress={() => a.playPause(p.entityId)}>
                  {p.isPlaying ? 'Pause' : 'Play'}
                </HeroButton>
                {p.supportsNextPrev ? (
                  <HeroButton icon={NextIcon} ariaLabel="Next" onPress={() => a.next(p.entityId)}>
                    <span className="sr-only">Next</span>
                  </HeroButton>
                ) : null}
              </>
            ) : null
          }
        />
      }
      toolbar={
        m.players.length > 1 && p ? (
          <SheetFilter label="Player" value={p.entityId} onChange={select} options={m.players.map((x) => ({ id: x.entityId, label: x.shortName, icon: x.isPlaying ? MusicNote03Icon : undefined }))} />
        ) : null
      }
    >
      {!p ? (
        <SheetEmpty icon={Speaker01Icon} title="No media players yet" text="Speakers and TVs from Home Assistant show up here." />
      ) : (
        <>
          {!p.isOff ? (
            <SheetSection title="Playback" plain>
              <div className="pro-surface flex flex-col gap-3 rounded-[18px] p-3.5">
                {p.durationSecs > 0 || duration > 0 ? (
                  <ProWaveformScrubber
                    title={p.title}
                    artist={p.artist}
                    duration={duration || p.durationSecs}
                    currentPosition={currentPosition}
                    isPlaying={p.isPlaying}
                    isDisabled={!p.supportsSeek}
                    onSeek={seek}
                    onScrubbingChange={(s, secs) => {
                      setSeeking(s);
                      setSeekTo(secs);
                    }}
                    palette={palette}
                    darkMode={dark}
                    barCount={48}
                    layout="stacked"
                  />
                ) : null}
                {p.supportsVolume ? (
                  <ProMediaVolumeSlider
                    volumePct={p.volumePct}
                    isMuted={p.isMuted}
                    isDisabled={!p.supportsVolume}
                    accentColor={palette.primary}
                    onToggleMute={() => a.toggleMute(p.entityId, !p.isMuted)}
                    onCommitVolume={(v) => a.setVolume(p.entityId, v)}
                  />
                ) : null}
                {p.supportsShuffle || p.supportsRepeat ? (
                  <div className="flex flex-wrap gap-1.5">
                    {p.supportsShuffle ? (
                      <ToggleButton size="sm" isSelected={p.shuffle} onChange={() => a.toggleShuffle(p.entityId, !p.shuffle)} className={CHIP}>
                        <HugeiconsIcon icon={ShuffleIcon} size={14} />
                        Shuffle
                      </ToggleButton>
                    ) : null}
                    {p.supportsRepeat ? (
                      <ToggleButton size="sm" isSelected={p.repeat !== 'off'} onChange={() => a.cycleRepeat(p.entityId, p.repeat)} className={CHIP}>
                        <HugeiconsIcon icon={p.repeat === 'one' ? RepeatOne01Icon : RepeatIcon} size={14} />
                        {p.repeat === 'one' ? 'Repeat one' : p.repeat === 'all' ? 'Repeat all' : 'Repeat'}
                      </ToggleButton>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </SheetSection>
          ) : null}
          {!p.isOff && p.upNextQueue.length > 0 ? (
            <SheetSection title="Up next" plain>
              <ProMediaUpNextPanel
                tracks={p.upNextQueue}
                queueSource={p.queueSource}
                sourceList={p.sourceList}
                activeSource={p.source}
                serverUrl={serverUrl}
                palette={palette}
                isExpanded={queueOpen}
                onToggleExpand={() => setQueueOpen((o) => !o)}
                onPlayTrack={(t) => a.playQueueTrack(p.entityId, t)}
                onSelectSource={(s) => a.selectSource(p.entityId, s)}
                onNextTrack={() => a.next(p.entityId)}
                supportsNext={p.supportsNextPrev}
                showToggleHeader={false}
              />
            </SheetSection>
          ) : null}
          {p.sourceList.length > 1 ? (
            <SheetSection title="Source" plain>
              <SheetFilter label={`${p.name} source`} value={p.source ?? ''} onChange={(s) => a.selectSource(p.entityId, s)} options={p.sourceList.map((s) => ({ id: s, label: s }))} />
            </SheetSection>
          ) : null}
          {p.soundModeList.length > 1 ? (
            <SheetSection title="Sound" plain>
              <SheetFilter label={`${p.name} sound mode`} value={p.soundMode ?? ''} onChange={(s) => a.selectSoundMode(p.entityId, s)} options={p.soundModeList.map((s) => ({ id: s, label: s }))} />
            </SheetSection>
          ) : null}
          {rooms.map((g) => (
            <SheetSection key={g.key} title={g.key}>
              {g.items.map((x) => (
                <SheetRow
                  key={x.entityId}
                  icon={isTv(x) ? Tv01Icon : Speaker01Icon}
                  tone={x.isPlaying ? 'active' : 'default'}
                  title={x.shortName}
                  subtitle={x.isOff ? 'Off' : x.isPlaying ? [x.title, x.artist].filter(Boolean).join(' · ') || 'Playing' : x.isPaused ? `Paused${x.title ? ` · ${x.title}` : ''}` : x.state}
                  trailing={
                    <>
                      {x.entityId !== p.entityId ? (
                        <Button size="sm" variant="ghost" onPress={() => select(x.entityId)} className="h-8 rounded-full px-2.5 text-xs">
                          Show
                        </Button>
                      ) : (
                        <span className="px-1 text-xs font-medium text-[var(--accent)]">Shown</span>
                      )}
                      {x.supportsTurnOnOff ? <ToggleSwitch isSelected={!x.isOff} onChange={() => a.togglePower(x.entityId)} label={`${x.name} ${x.isOff ? 'off' : 'on'}`} /> : null}
                    </>
                  }
                />
              ))}
            </SheetSection>
          ))}
        </>
      )}
    </DetailSheet>
  );
}
