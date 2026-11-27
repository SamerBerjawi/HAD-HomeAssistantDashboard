/**
 * Shared pieces for the Media studio's directions (docs/pro-ui/MEDIA.md §0), in the spirit of
 * Spotify and Apple Music: artwork, the page tinted by it, the scrubber and transport, a speaker
 * picker (AirPlay / Spotify Connect: choose rooms, group them, a volume each), shelves of tiles to
 * start something, the mini player bar. Every piece reads the brand-neutral `MediaHome` and shows
 * only what a player can do.
 */
import { createContext, useContext, useEffect, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react';
import { Button, Checkbox, Modal, ScrollShadow, Slider } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  AirplayLineIcon,
  MusicNote01Icon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PodcastIcon,
  PreviousIcon,
  Radio01Icon,
  RepeatIcon,
  RepeatOne01Icon,
  ShuffleIcon,
  SpeakerIcon,
  Tv01Icon,
  VolumeHighIcon,
  VolumeMute01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { clockOf, groupName, groupsOf, isActive, positionNow, tintOf, type Artwork, type LibraryItem, type MediaAction, type MediaHome, type Player, type Shelf } from '../../../lib/mediaHome';

export interface DesignProps {
  home: MediaHome;
  width: number;
  dark: boolean;
  act: (playerId: string, a: MediaAction) => void;
}

/** Whether the page is dark: dialogs render outside the page (a portal), so they read it from here. */
export const MediaDarkContext = createContext<boolean>(false);

/** The clock the scrubbers read, ticking each second while something plays (the studio's sample time, or Date.now live). */
export const NowContext = createContext<number>(Date.now());
export function useTicking(base: number, playing: boolean): number {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    setOffset(0);
    if (!playing) return;
    const start = Date.now();
    const t = setInterval(() => setOffset(Date.now() - start), 1000);
    return () => clearInterval(t);
  }, [base, playing]);
  return base + offset;
}

export const kindIcon = (p: Player): IconSvgElement => (p.kind === 'tv' ? Tv01Icon : p.media?.kind === 'radio' ? Radio01Icon : p.media?.kind === 'podcast' ? PodcastIcon : SpeakerIcon);

// ---------------------------------------------------------------------------------------------
// Artwork and tint
// ---------------------------------------------------------------------------------------------

/** A steady hue from a title, so items without artwork still get their own colour. */
const hueFrom = (seed: string) => [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

/** Square artwork; when there is none (or it fails to load), a cover in a colour of its own (from `seed`, the item's title). */
export function Cover({ art, size, className, round = 'rounded-[12px]', shadow, label, seed }: { art: Artwork | null | undefined; size?: number; className?: string; round?: string; shadow?: boolean; label?: string; seed?: string }) {
  const dark = useContext(MediaDarkContext);
  const [broken, setBroken] = useState<string | null>(null);
  const style: CSSProperties = size ? { width: size, height: size } : {};
  if (art?.src && broken !== art.src) {
    return <img src={art.src} alt={label ?? ''} onError={() => setBroken(art.src)} className={cn('aspect-square shrink-0 object-cover', round, shadow && 'shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)]', className)} style={style} />;
  }
  const hue = art?.hue ?? (seed ? hueFrom(seed) : null);
  const tint = tintOf({ src: null, hue }, dark);
  const background = hue === null ? tint.soft : `linear-gradient(135deg, hsl(${hue} 55% ${dark ? 38 : 72}%), hsl(${(hue + 40) % 360} 50% ${dark ? 22 : 58}%))`;
  return (
    <span aria-hidden className={cn('grid aspect-square shrink-0 place-items-center', hue === null ? 'text-[color-mix(in_oklab,var(--foreground)_45%,transparent)]' : 'text-white/80', round, className)} style={{ ...style, background }}>
      <HugeiconsIcon icon={MusicNote01Icon} size={size ? Math.max(16, size * 0.36) : 28} />
    </span>
  );
}

/** The Apple Music wash: the artwork's colour from the top, fading into the page. */
export const washStyle = (art: Artwork | null | undefined, dark: boolean, strength = 1): CSSProperties => {
  const t = tintOf(art, dark);
  if (t.hue === null) return {};
  return { backgroundImage: `linear-gradient(180deg, color-mix(in oklab, ${t.deep} ${Math.round(100 * strength)}%, transparent) 0%, color-mix(in oklab, ${t.soft} ${Math.round(60 * strength)}%, transparent) 55%, transparent 100%)` };
};

/** The artwork itself, blurred and scaled behind a surface (Apple Music's Now Playing backdrop). */
export function BlurredArt({ art, dark, className }: { art: Artwork | null | undefined; dark: boolean; className?: string }) {
  if (!art?.src) return null;
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0 -z-10 overflow-hidden', className)}>
      <img src={art.src} alt="" className="absolute inset-0 h-full w-full scale-150 object-cover blur-[60px] saturate-150" style={{ opacity: dark ? 0.55 : 0.45 }} />
      <div className="absolute inset-0" style={{ background: dark ? 'linear-gradient(180deg, rgba(0,0,0,0.15), rgba(0,0,0,0.45))' : 'linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0.6))' }} />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Playback
// ---------------------------------------------------------------------------------------------

/** What is playing in words: title, then artist or show (or the app on a TV). */
export function NowText({ p, big, className }: { p: Player; big?: boolean; className?: string }) {
  const m = p.media;
  return (
    <div className={cn('min-w-0', className)}>
      <p className={cn('truncate font-semibold tracking-tight', big ? 'text-[24px] leading-8' : 'text-[15px] leading-5')}>{m?.title ?? (p.state === 'off' ? 'Off' : 'Nothing playing')}</p>
      <p className={cn('truncate text-muted', big ? 'text-[17px]' : 'text-[13px]')}>{m ? [m.subtitle, m.app && m.kind !== 'app' && p.kind !== 'tv' ? `on ${m.app}` : null].filter(Boolean).join(' · ') || ' ' : p.room ?? p.name}</p>
    </div>
  );
}

/** The scrubber: elapsed, the line (seekable when the player can), remaining. Live radio says so. */
export function Scrubber({ p, act, now }: { p: Player; act: DesignProps['act']; now: number }) {
  const m = p.media;
  const [drag, setDrag] = useState<number | null>(null);
  if (!m) return null;
  if (m.duration === null) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-muted">
        <span className="size-1.5 animate-pulse rounded-full bg-[hsl(4_82%_54%)] motion-reduce:animate-none" />
        Live
      </div>
    );
  }
  const pos = drag ?? positionNow(p, now) ?? 0;
  return (
    <div className="flex flex-col gap-1">
      <Slider
        aria-label="Position"
        minValue={0}
        maxValue={m.duration}
        step={1}
        value={pos}
        isDisabled={!p.can.seek}
        onChange={(x) => setDrag(Array.isArray(x) ? x[0] : x)}
        onChangeEnd={(x) => {
          setDrag(null);
          act(p.id, { type: 'seek', seconds: Array.isArray(x) ? x[0] : x });
        }}
        className="pro-media-scrub"
      >
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
      <div className="flex justify-between text-[11px] text-muted tabular-nums">
        <span>{clockOf(pos)}</span>
        <span>-{clockOf(m.duration - pos)}</span>
      </div>
    </div>
  );
}

function Round({ icon, label, onPress, size = 44, iconSize, active, primary, isDisabled }: { icon: IconSvgElement; label: string; onPress: () => void; size?: number; iconSize?: number; active?: boolean; primary?: boolean; isDisabled?: boolean }) {
  return (
    <Button
      isIconOnly
      variant={primary ? 'primary' : 'ghost'}
      aria-label={label}
      aria-pressed={active}
      isDisabled={isDisabled}
      onPress={onPress}
      className={cn('min-w-0 shrink-0 rounded-full p-0', !primary && 'bg-transparent', active && 'text-[var(--accent)]', primary && 'bg-[var(--foreground)] text-[var(--background)] data-[hovered=true]:bg-[var(--foreground)]')}
      style={{ width: size, height: size }}
    >
      <HugeiconsIcon icon={icon} size={iconSize ?? Math.round(size * 0.45)} strokeWidth={primary ? 2 : 1.8} />
    </Button>
  );
}

/** Shuffle · previous · play/pause · next · repeat, each only when the player offers it. */
export function Transport({ p, act, size = 'md' }: { p: Player; act: DesignProps['act']; size?: 'sm' | 'md' | 'lg' }) {
  const big = size === 'lg' ? 68 : size === 'md' ? 56 : 40;
  const side = size === 'lg' ? 48 : size === 'md' ? 44 : 36;
  const playing = p.state === 'playing';
  const nextRepeat = p.repeat === 'off' ? 'all' : p.repeat === 'all' ? 'one' : 'off';
  return (
    <div className={cn('flex items-center', size === 'sm' ? 'gap-1' : 'justify-between gap-2')}>
      {p.can.shuffle && p.shuffle !== null && size !== 'sm' ? <Round icon={ShuffleIcon} label="Shuffle" active={p.shuffle} size={side - 8} onPress={() => act(p.id, { type: 'shuffle', on: !p.shuffle })} /> : size !== 'sm' ? <span style={{ width: side - 8 }} /> : null}
      {p.can.skip ? <Round icon={PreviousIcon} label="Previous" size={side} onPress={() => act(p.id, { type: 'prev' })} /> : null}
      <Round icon={playing ? PauseIcon : PlayIcon} label={playing ? 'Pause' : 'Play'} primary size={big} onPress={() => act(p.id, { type: 'play-pause' })} isDisabled={!p.media} />
      {p.can.skip ? <Round icon={NextIcon} label="Next" size={side} onPress={() => act(p.id, { type: 'next' })} /> : null}
      {p.can.repeat && p.repeat !== null && size !== 'sm' ? (
        <Round icon={p.repeat === 'one' ? RepeatOne01Icon : RepeatIcon} label={`Repeat: ${p.repeat}`} active={p.repeat !== 'off'} size={side - 8} onPress={() => act(p.id, { type: 'repeat', mode: nextRepeat })} />
      ) : size !== 'sm' ? (
        <span style={{ width: side - 8 }} />
      ) : null}
    </div>
  );
}

/** A player's volume as a slider with the speaker icon (mute on tap). */
export function Volume({ p, act, label, compact }: { p: Player; act: DesignProps['act']; label?: string; compact?: boolean }) {
  const [drag, setDrag] = useState<number | null>(null);
  if (!p.can.volume || p.volume === null) return null;
  const v = drag ?? (p.muted ? 0 : p.volume);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Button isIconOnly variant="ghost" size="sm" aria-label={p.muted ? `Unmute ${label ?? p.name}` : `Mute ${label ?? p.name}`} onPress={() => act(p.id, { type: 'mute', muted: !p.muted })} className="size-8 min-w-0 shrink-0 rounded-full p-0 text-muted">
        <HugeiconsIcon icon={p.muted || v === 0 ? VolumeMute01Icon : VolumeHighIcon} size={compact ? 15 : 17} />
      </Button>
      <Slider
        aria-label={`${label ?? p.name} volume`}
        minValue={0}
        maxValue={100}
        step={1}
        value={v}
        onChange={(x) => setDrag(Array.isArray(x) ? x[0] : x)}
        onChangeEnd={(x) => {
          setDrag(null);
          act(p.id, { type: 'volume', pct: Array.isArray(x) ? x[0] : x });
        }}
        className="pro-media-scrub min-w-0 flex-1"
      >
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Speaker picker (AirPlay / Spotify Connect)
// ---------------------------------------------------------------------------------------------

/** "Living room HomePod" with the AirPlay glyph: opens the speaker picker. */
export function DeviceButton({ home, p, act, className, compact }: { home: MediaHome; p: Player; act: DesignProps['act']; className?: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const Picker = useContext(PickerContext);
  const members = [p, ...p.group.map((id) => home.players.find((x) => x.id === id)).filter((x): x is Player => !!x)];
  // A player that can't join others (a TV) has nothing to pick: say where it plays.
  if (!p.can.group || !p.joinable.length)
    return (
      <span className={cn('inline-flex h-8 min-w-0 items-center gap-1.5 px-2.5 text-[13px] font-medium text-muted', className)}>
        <HugeiconsIcon icon={kindIcon(p)} size={15} />
        <span className="truncate">{p.room ? `${p.room}${p.kind === 'tv' ? ' TV' : ''}` : p.name}</span>
      </span>
    );
  return (
    <>
      <Button variant="ghost" size="sm" onPress={() => setOpen(true)} className={cn('h-8 min-w-0 gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-[var(--accent)]', className)}>
        <HugeiconsIcon icon={AirplayLineIcon} size={15} />
        <span className="truncate">{compact ? groupName(members) : `Playing on ${groupName(members)}`}</span>
      </Button>
      <Picker home={home} p={p} act={act} isOpen={open} onOpenChange={setOpen} />
    </>
  );
}

export interface PickerProps {
  home: MediaHome;
  p: Player;
  act: DesignProps['act'];
  isOpen: boolean;
  onOpenChange: (o: boolean) => void;
}

/** Choose the rooms this plays in (grouping) and set each one's volume. TVs and players that can't join are listed as they are. */
export function SpeakerPicker({ home, p, act, isOpen, onOpenChange }: PickerProps) {
  const dark = useContext(MediaDarkContext);
  const inGroup = new Set([p.id, ...p.group]);
  const candidates = home.players.filter((x) => x.id === p.id || p.joinable.includes(x.id));
  const toggle = (id: string, on: boolean) => {
    const next = new Set(inGroup);
    if (on) next.add(id);
    else next.delete(id);
    act(p.id, { type: 'group', with: [...next] });
  };
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size="sm" placement="auto">
        <Modal.Dialog aria-label="Play on" className={cn('pro', dark && 'dark')} data-page="media">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>Play on</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-1 pb-4">
            {candidates.map((x) => {
              const on = inGroup.has(x.id);
              return (
                <div key={x.id} className={cn('flex flex-col gap-1 rounded-2xl px-3 py-2.5', on && 'bg-[color-mix(in_oklab,var(--accent)_10%,transparent)]')}>
                  <Checkbox isSelected={on} isDisabled={x.id === p.id || !p.can.group} onChange={(v: boolean) => toggle(x.id, v)} className="flex w-full flex-row items-center gap-3 data-[disabled=true]:opacity-100">
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Checkbox.Content className="flex min-w-0 flex-1 items-center gap-2.5">
                      <HugeiconsIcon icon={kindIcon(x)} size={18} className="shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px]">{x.room ?? x.name}</span>
                        <span className="block truncate text-xs text-muted">{x.model ?? x.platform}{x.id !== p.id && isActive(x) && !inGroup.has(x.id) ? ` · playing ${x.media?.title ?? ''}` : ''}</span>
                      </span>
                    </Checkbox.Content>
                  </Checkbox>
                  {on ? <Volume p={x} act={act} label={x.room ?? x.name} compact /> : null}
                </div>
              );
            })}
            {home.players.some((x) => x.id !== p.id && !p.joinable.includes(x.id) && x.kind === 'speaker') ? <p className="px-3 pt-2 text-xs text-muted">Speakers from another system can’t join this one; play on them from their own card.</p> : null}
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/** The speaker picker the "Playing on …" button opens (the studio swaps it per round). */
export const PickerContext = createContext<ComponentType<PickerProps>>(SpeakerPicker);

// ---------------------------------------------------------------------------------------------
// Library
// ---------------------------------------------------------------------------------------------

/** The rooms to play on as pills (shown when nothing plays, or to change where a tap plays). */
export function TargetPills({ home, target, onPick }: { home: MediaHome; target: Player | null; onPick: (id: string) => void }) {
  const list = home.players.filter((p) => p.state !== 'unavailable' && (p.kind === 'speaker' || p.kind === 'tv'));
  return (
    <div role="group" aria-label="Play on" className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
      {list.map((p) => (
        <Button key={p.id} size="sm" variant={target?.id === p.id ? 'primary' : 'secondary'} aria-pressed={target?.id === p.id} onPress={() => onPick(p.id)} className="h-9 shrink-0 gap-1.5 rounded-full px-3.5">
          <HugeiconsIcon icon={AirplayLineIcon} size={14} />
          {p.room ?? p.name}
          {p.kind === 'tv' ? ' TV' : ''}
        </Button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Library (shelves)
// ---------------------------------------------------------------------------------------------

/** One shelf of tiles, scrolling sideways (Spotify Home). A tap plays it on `target`. */
export function ShelfRow({ shelf, target, act, tile = 148, round }: { shelf: Shelf; target: Player | null; act: DesignProps['act']; tile?: number; round?: boolean }) {
  return (
    <section aria-label={shelf.title} className="flex min-w-0 flex-col gap-2.5">
      <h3 className="text-[19px] font-semibold tracking-tight">{shelf.title}</h3>
      <ScrollShadow orientation="horizontal" hideScrollBar className="-mx-1 flex gap-3 px-1 pb-1">
        {shelf.items.map((it) => (
          <Tile key={it.id} it={it} target={target} act={act} size={tile} round={round || it.kind === 'artist'} />
        ))}
      </ScrollShadow>
    </section>
  );
}

export function playItem(it: LibraryItem, target: Player | null, act: DesignProps['act']) {
  if (!target) return;
  if (it.kind === 'app' && !it.contentId) act(target.id, { type: 'source', source: it.title });
  else act(target.id, { type: 'play-item', item: it });
}

function Tile({ it, target, act, size, round }: { it: LibraryItem; target: Player | null; act: DesignProps['act']; size: number; round?: boolean }) {
  const tvOnly = it.on && target && !it.on.includes(target.id);
  return (
    <Button variant="ghost" isDisabled={!target || !!tvOnly} onPress={() => playItem(it, target, act)} aria-label={`Play ${it.title}${target ? ` on ${target.room ?? target.name}` : ''}`} className="group h-auto shrink-0 flex-col items-start gap-2 rounded-2xl bg-transparent p-1.5 text-left data-[hovered=true]:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]" style={{ width: size + 12 }}>
      <span className="relative block">
        <Cover art={it.art} seed={it.title} size={size} round={round ? 'rounded-full' : 'rounded-[10px]'} shadow />
        <span aria-hidden className="absolute bottom-2 right-2 grid size-10 translate-y-1 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] opacity-0 shadow-lg transition group-data-[hovered=true]:translate-y-0 group-data-[hovered=true]:opacity-100">
          <HugeiconsIcon icon={PlayIcon} size={18} />
        </span>
      </span>
      <span className="w-full min-w-0">
        <span className="block truncate text-[14px] font-medium">{it.title}</span>
        <span className="block truncate text-[12px] font-normal text-muted">{it.subtitle}</span>
      </span>
    </Button>
  );
}

/** Spotify Home's quick picks: two (phone) to four columns of compact art + name tiles. */
export function QuickGrid({ items, target, act, cols }: { items: LibraryItem[]; target: Player | null; act: DesignProps['act']; cols: number }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {items.map((it) => (
        <Button key={it.id} variant="ghost" isDisabled={!target} onPress={() => playItem(it, target, act)} className="group h-14 w-full min-w-0 justify-start gap-0 overflow-hidden rounded-[10px] bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)] p-0 pr-2 text-left data-[hovered=true]:bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)]">
          <Cover art={it.art} seed={it.title} size={56} round="rounded-none" />
          <span className="min-w-0 flex-1 truncate px-3 text-[13px] font-semibold">{it.title}</span>
          <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-foreground)] opacity-0 transition group-data-[hovered=true]:opacity-100">
            <HugeiconsIcon icon={PlayIcon} size={14} />
          </span>
        </Button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Queue, mini bar, room cards
// ---------------------------------------------------------------------------------------------

export function UpNext({ p, act, limit = 5 }: { p: Player; act: DesignProps['act']; limit?: number }) {
  if (!p.queue.length) return null;
  return (
    <section aria-label="Up next" className="flex flex-col gap-1">
      <h3 className="mb-1 text-[15px] font-semibold">Up next</h3>
      {p.queue.slice(0, limit).map((t) => (
        <Button key={t.id} variant="ghost" onPress={() => act(p.id, { type: 'play-track', track: t })} className="h-auto w-full min-w-0 justify-start gap-3 rounded-xl bg-transparent px-1.5 py-1.5 text-left data-[hovered=true]:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]">
          <Cover art={t.art} size={40} round="rounded-[6px]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium">{t.title}</span>
            <span className="block truncate text-[12px] font-normal text-muted">{t.artist}</span>
          </span>
          <span className="shrink-0 text-[12px] font-normal text-muted tabular-nums">{clockOf(t.duration)}</span>
        </Button>
      ))}
    </section>
  );
}

/** Spotify's bar: a hairline of progress on top, art, title, the device, play/pause. Tap the text to open Now Playing. */
export function MiniBar({ home, p, act, now, onOpen, className }: { home: MediaHome; p: Player; act: DesignProps['act']; now: number; onOpen?: () => void; className?: string }) {
  const m = p.media;
  const pct = m?.duration ? Math.min(100, ((positionNow(p, now) ?? 0) / m.duration) * 100) : 0;
  const t = tintOf(m?.art, true);
  return (
    <div className={cn('relative flex items-center gap-3 overflow-hidden rounded-[14px] p-2 pr-3 text-white shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)]', className)} style={{ background: t.hue === null ? 'hsl(240 6% 18%)' : `hsl(${t.hue} 40% 24%)` }}>
      <Cover art={m?.art} size={44} round="rounded-[8px]" />
      <Button variant="ghost" onPress={onOpen} aria-label={`Open now playing: ${m?.title ?? p.name}`} className="h-auto min-w-0 flex-1 flex-col items-start gap-0 rounded-lg bg-transparent p-0 text-left font-normal text-white data-[hovered=true]:bg-transparent">
        <p className="w-full truncate text-[14px] font-semibold">{m?.title ?? 'Nothing playing'}</p>
        <p className="flex w-full items-center gap-1 truncate text-[12px] text-white/70">
          <HugeiconsIcon icon={AirplayLineIcon} size={12} className="shrink-0 text-[hsl(140_70%_60%)]" />
          {groupName([p, ...p.group.map((id) => home.players.find((x) => x.id === id)).filter((x): x is Player => !!x)])}
        </p>
      </Button>
      <Button isIconOnly variant="ghost" aria-label={p.state === 'playing' ? 'Pause' : 'Play'} onPress={() => act(p.id, { type: 'play-pause' })} isDisabled={!m} className="size-10 min-w-0 rounded-full p-0 text-white">
        <HugeiconsIcon icon={p.state === 'playing' ? PauseIcon : PlayIcon} size={22} />
      </Button>
      {m?.duration ? <span aria-hidden className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-white/20"><span className="block h-full rounded-full bg-white" style={{ width: `${pct}%` }} /></span> : null}
    </div>
  );
}

/** One room (or group of rooms) as a card tinted by what it plays: art, what, play/pause, volume. */
export function RoomCard({ home, members, act, now, dark, onOpen, big }: { home: MediaHome; members: Player[]; act: DesignProps['act']; now: number; dark: boolean; onOpen?: () => void; big?: boolean }) {
  const p = members[0];
  const m = p.media;
  const active = isActive(p);
  return (
    <section aria-label={groupName(members)} className={cn('pro-surface relative isolate flex min-w-0 flex-col gap-3 overflow-hidden rounded-[24px] p-4', !active && 'opacity-90')} style={active ? washStyle(m?.art, dark, 0.9) : undefined}>
      <header className="flex items-center gap-2 text-[13px] text-muted">
        <HugeiconsIcon icon={kindIcon(p)} size={15} />
        <span className="min-w-0 flex-1 truncate font-medium text-[var(--foreground)]">{groupName(members)}</span>
        <span className="shrink-0">{p.state === 'playing' ? 'Playing' : p.state === 'paused' ? 'Paused' : p.state === 'off' ? 'Off' : p.state === 'unavailable' ? 'Unavailable' : 'Idle'}</span>
      </header>
      <Button variant="ghost" onPress={onOpen} aria-label={`Open ${groupName(members)}`} className="h-auto w-full min-w-0 justify-start gap-3 rounded-2xl bg-transparent p-0 text-left font-normal data-[hovered=true]:bg-transparent">
        <Cover art={m?.art} size={big ? 96 : 64} shadow={active} />
        <NowText p={p} big={big} />
      </Button>
      {active ? (
        <div className="flex items-center gap-2">
          <Transport p={p} act={act} size="sm" />
          <div className="min-w-0 flex-1">{members.length === 1 ? <Volume p={p} act={act} compact /> : <DeviceButton home={home} p={p} act={act} compact className="w-full justify-start" />}</div>
        </div>
      ) : null}
      {active && m?.duration ? (
        <span aria-hidden className="h-[3px] rounded-full bg-[color-mix(in_oklab,var(--foreground)_12%,transparent)]">
          <span className="block h-full rounded-full bg-[var(--foreground)]" style={{ width: `${Math.min(100, ((positionNow(p, now) ?? 0) / m.duration) * 100)}%` }} />
        </span>
      ) : null}
    </section>
  );
}

/** The big Now Playing (Apple Music): the artwork, title, scrubber, transport, volume and the speaker; `side` holds Up next on wide screens. */
export function NowPlayingPanel({ home, p, act, now, dark, width, side }: { home: MediaHome; p: Player; act: DesignProps['act']; now: number; dark: boolean; width: number; side?: ReactNode }) {
  const wide = width >= 860;
  const art = Math.min(wide ? 360 : width - 64, 420);
  return (
    <section aria-label={`Now playing in ${p.room ?? p.name}`} className={cn('relative isolate flex overflow-hidden rounded-[32px] p-6', wide ? 'items-center gap-10 p-8' : 'flex-col items-stretch gap-5')} style={{ background: tintOf(p.media?.art, dark).soft }}>
      <BlurredArt art={p.media?.art} dark={dark} />
      <Cover art={p.media?.art} size={art} round="rounded-[18px]" shadow className={cn(!wide && 'self-center', p.state === 'paused' && 'scale-[0.92] transition-transform')} label={p.media?.title} />
      <div className={cn('flex min-w-0 flex-1 flex-col gap-4', wide && 'max-w-[440px]')}>
        <div className="flex items-end justify-between gap-3">
          <NowText p={p} big />
        </div>
        <Scrubber p={p} act={act} now={now} />
        <Transport p={p} act={act} size="lg" />
        <Volume p={p} act={act} />
        <div className="flex items-center justify-between gap-2">
          <DeviceButton home={home} p={p} act={act} />
          {p.media?.album ? <span className="truncate text-[12px] text-muted">{p.media.album}</span> : null}
        </div>
      </div>
      {side && wide ? <div className="hidden min-w-[240px] max-w-[320px] flex-1 self-stretch overflow-hidden lg:block">{side}</div> : null}
    </section>
  );
}

/** Other things playing in the home, as small rows (group by group). */
export function ElsewhereRow({ home, except, act, now, dark, onOpen }: { home: MediaHome; except: string | null; act: DesignProps['act']; now: number; dark: boolean; onOpen: (id: string) => void }) {
  const groups = groupsOf(home.players).filter((g) => g.some(isActive) && !g.some((p) => p.id === except));
  if (!groups.length) return null;
  return (
    <section aria-label="Also playing" className="flex flex-col gap-2.5">
      <h3 className="text-[19px] font-semibold tracking-tight">Also playing</h3>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {groups.map((g) => (
          <RoomCard key={g[0].id} home={home} members={g} act={act} now={now} dark={dark} onOpen={() => onOpen(g[0].id)} />
        ))}
      </div>
    </section>
  );
}

/** The playing sheet: Now Playing in a modal (B's bar and C's cards open it). */
export function NowPlayingSheet({ home, p, act, now, dark, isOpen, onOpenChange }: { home: MediaHome; p: Player | null; act: DesignProps['act']; now: number; dark: boolean; isOpen: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Modal.Backdrop isOpen={isOpen && !!p} onOpenChange={onOpenChange}>
      <Modal.Container size="lg" placement="auto">
        <Modal.Dialog aria-label="Now playing" className={cn('pro p-0', dark && 'dark')} data-page="media">
          <Modal.CloseTrigger className="z-10" />
          {p ? (
            <div className="flex flex-col gap-4 p-2">
              <NowPlayingPanel home={home} p={p} act={act} now={now} dark={dark} width={420} />
              <div className="px-4 pb-4">
                <UpNext p={p} act={act} />
              </div>
            </div>
          ) : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
