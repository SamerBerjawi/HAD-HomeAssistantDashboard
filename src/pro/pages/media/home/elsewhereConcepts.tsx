/**
 * Media round 3: "Also playing", the other rooms that play, under A's Immersive player
 * (docs/pro-ui/MEDIA.md §0). Three ways: 1 · Cards (round 1's tinted room cards with their own
 * controls), 2 · List (one quiet list, Apple Music's AirPlay list: artwork, what, the room, a play
 * button), 3 · Tiles (Spotify's "Jump back in": big artwork with the room on it, a shelf). In all
 * three a tap brings that room into the player above.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { groupName, groupsOf, isActive, positionNow, type MediaHome, type Player } from '../../../lib/mediaHome';
import { Cover, ElsewhereRow, kindIcon, type DesignProps } from './parts';

export interface ElsewhereProps {
  home: MediaHome;
  /** The player in the hero (its group is left out). */
  except: string | null;
  act: DesignProps['act'];
  now: number;
  dark: boolean;
  width: number;
  /** Bring this room into the player above. */
  onOpen: (id: string) => void;
  /** The heading ("Also playing" under a player, "Playing in your home" on B's Home). */
  title?: string;
}

const others = (home: MediaHome, except: string | null) => groupsOf(home.players).filter((g) => g.some(isActive) && !g.some((p) => p.id === except));
const stateWord = (p: Player) => (p.state === 'playing' ? (p.media?.kind === 'radio' ? 'Live' : 'Playing') : 'Paused');

function PlayButton({ p, act, size = 36, solid }: { p: Player; act: DesignProps['act']; size?: number; solid?: boolean }) {
  const playing = p.state === 'playing';
  return (
    <Button isIconOnly variant={solid ? 'primary' : 'ghost'} aria-label={`${playing ? 'Pause' : 'Play'} ${p.room ?? p.name}`} onPress={() => act(p.id, { type: 'play-pause' })} className={cn('min-w-0 shrink-0 rounded-full p-0', solid ? 'bg-[var(--foreground)] text-[var(--background)] shadow-lg data-[hovered=true]:bg-[var(--foreground)]' : 'bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]')} style={{ width: size, height: size }}>
      <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={Math.round(size * 0.45)} />
    </Button>
  );
}

/** 1 · Cards: round 1's room cards, tinted by their artwork, with play/pause, skip and the volume (or the speakers for a group). */
export function ElsewhereCards({ home, except, act, now, dark, onOpen }: ElsewhereProps) {
  return <ElsewhereRow home={home} except={except} act={act} now={now} dark={dark} onOpen={onOpen} />;
}

/** 2 · List: one quiet list, like Apple Music's AirPlay list. Artwork, what, the room and its state, a thin progress line, play/pause. */
export function ElsewhereList({ home, except, act, now, onOpen, title = 'Also playing' }: ElsewhereProps) {
  const groups = others(home, except);
  if (!groups.length) return null;
  return (
    <section aria-label={title} className="flex flex-col gap-2.5">
      <h3 className="text-[19px] font-semibold tracking-tight">{title}</h3>
      <ul className="pro-surface flex flex-col overflow-hidden rounded-[22px] p-1.5">
        {groups.map((g, i) => {
          const p = g[0];
          const m = p.media;
          const pct = m?.duration ? Math.min(100, ((positionNow(p, now) ?? 0) / m.duration) * 100) : null;
          return (
            <li key={p.id} className={cn('flex items-center gap-3 rounded-2xl px-2 py-2', i > 0 && 'border-t border-[color-mix(in_oklab,var(--foreground)_6%,transparent)]')}>
              <Button variant="ghost" onPress={() => onOpen(p.id)} aria-label={`Show ${groupName(g)} in the player`} className="h-auto min-w-0 flex-1 justify-start gap-3 rounded-xl bg-transparent p-0 text-left font-normal data-[hovered=true]:bg-transparent">
                <Cover art={m?.art} size={52} round="rounded-[8px]" />
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-[15px] font-semibold">{m?.title}</span>
                  <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted">
                    <HugeiconsIcon icon={kindIcon(p)} size={13} className="shrink-0" />
                    <span className="truncate">
                      {groupName(g)} · {stateWord(p)}
                      {m?.subtitle ? ` · ${m.subtitle}` : ''}
                    </span>
                  </span>
                  {pct !== null ? (
                    <span aria-hidden className="h-[3px] w-full max-w-[220px] rounded-full bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]">
                      <span className="block h-full rounded-full bg-[color-mix(in_oklab,var(--foreground)_60%,transparent)]" style={{ width: `${pct}%` }} />
                    </span>
                  ) : null}
                </span>
              </Button>
              <PlayButton p={p} act={act} />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** 3 · Tiles: Spotify's "Jump back in". Big artwork with the room on it and a play button, the title under; a shelf when there are several. */
export function ElsewhereTiles({ home, except, act, width, onOpen }: ElsewhereProps) {
  const groups = others(home, except);
  if (!groups.length) return null;
  const tile = width < 640 ? 150 : 184;
  return (
    <section aria-label="Also playing" className="flex flex-col gap-2.5">
      <h3 className="text-[19px] font-semibold tracking-tight">Also playing</h3>
      <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none]">
        {groups.map((g) => {
          const p = g[0];
          const m = p.media;
          return (
            <div key={p.id} className="flex shrink-0 flex-col gap-2" style={{ width: tile }}>
              <div className="relative">
                <Button variant="ghost" onPress={() => onOpen(p.id)} aria-label={`Show ${groupName(g)} in the player`} className="h-auto min-w-0 rounded-[14px] bg-transparent p-0 data-[hovered=true]:bg-transparent">
                  <Cover art={m?.art} size={tile} round="rounded-[14px]" shadow className={cn(p.state === 'paused' && 'opacity-75 saturate-50')} />
                </Button>
                <span className="pointer-events-none absolute left-2 top-2 inline-flex max-w-[85%] items-center gap-1 truncate rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                  <HugeiconsIcon icon={kindIcon(p)} size={11} className="shrink-0" />
                  <span className="truncate">{groupName(g)}</span>
                </span>
                <span className="absolute bottom-2 right-2">
                  <PlayButton p={p} act={act} size={40} solid />
                </span>
              </div>
              <div className="min-w-0 px-0.5">
                <p className="truncate text-[14px] font-semibold">{m?.title}</p>
                <p className="truncate text-[12px] text-muted">
                  {stateWord(p)}
                  {m?.subtitle ? ` · ${m.subtitle}` : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
