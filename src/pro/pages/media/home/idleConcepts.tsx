/**
 * Media round 6: "Nothing playing" on B · Home (docs/pro-ui/MEDIA.md §0). With nothing to show in
 * the player, the page has to say where a tap will play and offer the likeliest thing. Three ways:
 * 1 · Rooms first (round 1's: the rooms as pills under the greeting), 2 · Pick up where you left off
 * (a big card tinted by what you played last, one button to play it, the rooms under it), 3 · Room
 * bar (nothing on top; the mini bar's place at the bottom says where it plays, tap to change, as in
 * Spotify's "Playing on" bar).
 */
import { useContext, useState, type ComponentType } from 'react';
import { Button, Modal } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { AirplayLineIcon, CheckmarkCircle02Icon, PlayIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { tintOf, type MediaHome, type Player } from '../../../lib/mediaHome';
import { BlurredArt, Cover, MediaDarkContext, TargetPills, kindIcon, playItem, type DesignProps } from './parts';
import { shelvesFor } from './libraryConcepts';

export interface IdleProps {
  home: MediaHome;
  /** Where a tap plays. */
  target: Player | null;
  act: DesignProps['act'];
  width: number;
  dark: boolean;
  onPick: (id: string) => void;
}

/** What B shows with nothing playing: something under the greeting, and optionally a bar where the mini player goes. */
export interface IdleConcept {
  Top: ComponentType<IdleProps>;
  Bar?: ComponentType<IdleProps>;
}

const roomOf = (p: Player) => `${p.room ?? p.name}${p.kind === 'tv' ? ' TV' : ''}`;
const playable = (home: MediaHome) => home.players.filter((p) => p.state !== 'unavailable' && (p.kind === 'speaker' || p.kind === 'tv'));

/** 1 · Rooms first: round 1's pills under the greeting; the picked one is where a tap plays. */
function RoomsTop({ home, target, onPick }: IdleProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] text-muted">Pick a room, then something to play.</p>
      <TargetPills home={home} target={target} onPick={onPick} />
    </div>
  );
}
export const IdleRooms: IdleConcept = { Top: RoomsTop };

/** 2 · Pick up where you left off: what you played last, big and tinted, one button to play it in the room; the rooms under it. */
function ResumeTop({ home, target, act, width, dark, onPick }: IdleProps) {
  const last = shelvesFor(home, target).find((s) => s.kind === 'recent')?.items[0];
  if (!last) return <RoomsTop home={home} target={target} act={act} width={width} dark={dark} onPick={onPick} />;
  const phone = width < 640;
  return (
    <div className="flex flex-col gap-3">
      <section aria-label="Pick up where you left off" className={cn('relative isolate flex overflow-hidden rounded-[28px] p-5', phone ? 'flex-col gap-4' : 'items-center gap-6')} style={{ background: tintOf(last.art, dark).soft }}>
        <BlurredArt art={last.art} dark={dark} />
        <Cover art={last.art} size={phone ? width - 40 > 260 ? 260 : width - 40 : 168} round={last.kind === 'artist' ? 'rounded-full' : 'rounded-[16px]'} shadow className={phone ? 'self-center' : undefined} label={last.title} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-muted">Pick up where you left off</p>
            <p className={cn('truncate font-bold tracking-tight', phone ? 'text-[24px]' : 'text-[30px]')}>{last.title}</p>
            {last.subtitle ? <p className="truncate text-[15px] text-muted">{last.subtitle}</p> : null}
          </div>
          <Button variant="primary" isDisabled={!target} onPress={() => playItem(last, target, act)} className="h-11 self-start gap-2 rounded-full px-5 font-semibold">
            <HugeiconsIcon icon={PlayIcon} size={18} />
            {target ? `Play in the ${roomOf(target)}` : 'Play'}
          </Button>
        </div>
      </section>
      <TargetPills home={home} target={target} onPick={onPick} />
    </div>
  );
}
export const IdleResume: IdleConcept = { Top: ResumeTop };

/** 3 · Room bar (owner's pick, 2026-11-27; B's default): the greeting stays clean; where the mini player goes, a bar says where a tap plays. Tap it to choose the room. */
function RoomBar({ home, target, onPick }: IdleProps) {
  const [open, setOpen] = useState(false);
  const dark = useContext(MediaDarkContext);
  const rooms = playable(home);
  return (
    <>
      <div className="flex items-center gap-3 rounded-[14px] bg-[hsl(240_6%_18%)] p-2 pl-3 text-white shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)]">
        <span className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-white/10">
          <HugeiconsIcon icon={target ? kindIcon(target) : AirplayLineIcon} size={20} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold">Nothing playing</span>
          <span className="flex items-center gap-1 truncate text-[12px] text-white/70">
            <HugeiconsIcon icon={AirplayLineIcon} size={12} className="shrink-0 text-[hsl(140_70%_60%)]" />
            {target ? `A tap plays in the ${roomOf(target)}` : 'Pick a room'}
          </span>
        </span>
        <Button size="sm" variant="ghost" onPress={() => setOpen(true)} className="h-9 shrink-0 rounded-full bg-white/10 px-3.5 text-white data-[hovered=true]:bg-white/20">
          Change
        </Button>
      </div>
      <Modal.Backdrop isOpen={open} onOpenChange={setOpen}>
        <Modal.Container size="sm" placement="auto">
          <Modal.Dialog aria-label="Play on" className={cn('pro', dark && 'dark')} data-page="media">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Play on</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-0.5 pb-4">
              {rooms.map((x) => {
                const on = target?.id === x.id;
                return (
                  <Button
                    key={x.id}
                    variant="ghost"
                    aria-pressed={on}
                    onPress={() => {
                      onPick(x.id);
                      setOpen(false);
                    }}
                    className="h-auto w-full justify-start gap-3 rounded-2xl bg-transparent px-2 py-2 text-left font-normal data-[hovered=true]:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]"
                  >
                    <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', on ? 'bg-[var(--accent)] text-white' : 'bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] text-muted')}>
                      <HugeiconsIcon icon={kindIcon(x)} size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px]">{roomOf(x)}</span>
                      <span className="block truncate text-xs text-muted">{x.model ?? x.platform}{x.state === 'off' ? ' · Off' : ''}</span>
                    </span>
                    {on ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={22} className="shrink-0 text-[var(--accent)]" /> : null}
                  </Button>
                );
              })}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
export const IdleBar: IdleConcept = { Top: () => null, Bar: RoomBar };
