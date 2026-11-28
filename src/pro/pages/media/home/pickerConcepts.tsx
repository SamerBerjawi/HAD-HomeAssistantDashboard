/**
 * Media round 5: the speaker picker the "Playing on …" button opens (docs/pro-ui/MEDIA.md §0).
 * Three ways: 1 · List with ticks (round 1's: a checkbox per room, a volume under each one picked),
 * 2 · AirPlay sheet (Apple's: what plays and the group volume on top, rooms below with a tick
 * circle on the right, a volume under each one picked), 3 · Room grid (Sonos: rooms as tiles you
 * tap on or off, one group volume, then a slider for each room in the group).
 */
import { useContext, useState } from 'react';
import { Button, Modal, Slider } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, CircleIcon, VolumeHighIcon, VolumeMute01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { groupName, isActive, type MediaHome, type Player } from '../../../lib/mediaHome';
import { Cover, MediaDarkContext, Volume, kindIcon, type PickerProps } from './parts';

export { SpeakerPicker as PickerList } from './parts';

/** The rooms this can play in (itself first), the ones in its group, and a toggle that regroups. */
function useRooms(home: MediaHome, p: Player, act: PickerProps['act']) {
  const inGroup = new Set([p.id, ...p.group]);
  const rooms = home.players.filter((x) => x.id === p.id || p.joinable.includes(x.id));
  const members = rooms.filter((x) => inGroup.has(x.id));
  const toggle = (id: string) => {
    if (id === p.id || !p.can.group) return;
    const next = new Set(inGroup);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    act(p.id, { type: 'group', with: [...next] });
  };
  return { inGroup, rooms, members, toggle };
}

/** One slider for the whole group: moves every room by the same step, as AirPlay and Sonos do. */
function GroupVolume({ members, act }: { members: Player[]; act: PickerProps['act'] }) {
  const withVol = members.filter((m) => m.can.volume && m.volume !== null);
  const avg = withVol.length ? Math.round(withVol.reduce((s, m) => s + (m.muted ? 0 : m.volume ?? 0), 0) / withVol.length) : null;
  const [drag, setDrag] = useState<number | null>(null);
  if (avg === null) return null;
  const v = drag ?? avg;
  const allMuted = withVol.every((m) => m.muted);
  const set = (to: number) => {
    const delta = to - avg;
    for (const m of withVol) act(m.id, { type: 'volume', pct: Math.max(0, Math.min(100, (m.muted ? 0 : m.volume ?? 0) + delta)) });
  };
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Button isIconOnly variant="ghost" size="sm" aria-label={allMuted ? 'Unmute all' : 'Mute all'} onPress={() => withVol.forEach((m) => act(m.id, { type: 'mute', muted: !allMuted }))} className="size-8 min-w-0 shrink-0 rounded-full p-0 text-muted">
        <HugeiconsIcon icon={allMuted || v === 0 ? VolumeMute01Icon : VolumeHighIcon} size={17} />
      </Button>
      <Slider
        aria-label="Group volume"
        minValue={0}
        maxValue={100}
        step={1}
        value={v}
        onChange={(x) => setDrag(Array.isArray(x) ? x[0] : x)}
        onChangeEnd={(x) => {
          setDrag(null);
          set(Array.isArray(x) ? x[0] : x);
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

function Shell({ isOpen, onOpenChange, title, children, size = 'sm' }: Pick<PickerProps, 'isOpen' | 'onOpenChange'> & { title: string; children: React.ReactNode; size?: 'sm' | 'md' }) {
  const dark = useContext(MediaDarkContext);
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container size={size} placement="auto">
        <Modal.Dialog aria-label={title} className={cn('pro', dark && 'dark')} data-page="media">
          <Modal.CloseTrigger />
          {children}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

const sub = (x: Player, p: Player, inGroup: Set<string>) => `${x.model ?? x.platform}${x.id !== p.id && isActive(x) && !inGroup.has(x.id) ? ` · playing ${x.media?.title ?? ''}` : ''}`;

/**
 * 2 · AirPlay sheet (owner's pick, 2026-11-27; A's picker): what plays (artwork, title, where) and one volume for the group on top; then
 * the rooms, each a row with a tick circle on the right (the one it plays from can't be dropped),
 * a volume under each one in the group.
 */
export function PickerAirPlay({ home, p, act, isOpen, onOpenChange }: PickerProps) {
  const { inGroup, rooms, members, toggle } = useRooms(home, p, act);
  return (
    <Shell isOpen={isOpen} onOpenChange={onOpenChange} title="AirPlay">
      <Modal.Header className="flex flex-col items-stretch gap-3">
        <div className="flex items-center gap-3 pr-8">
          <Cover art={p.media?.art} size={48} round="rounded-[8px]" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-semibold">{p.media?.title ?? 'Nothing playing'}</span>
            <span className="block truncate text-[13px] text-muted">{groupName(members)}</span>
          </span>
        </div>
        {members.length > 1 ? <GroupVolume members={members} act={act} /> : <Volume p={p} act={act} label={p.room ?? p.name} />}
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-0.5 pb-4">
        <p className="px-2 pb-1 pt-2 text-[12px] font-semibold uppercase tracking-wider text-muted">Speakers &amp; TVs</p>
        {rooms.map((x) => {
          const on = inGroup.has(x.id);
          const lead = x.id === p.id;
          return (
            <div key={x.id} className="flex flex-col">
              <Button variant="ghost" onPress={() => toggle(x.id)} isDisabled={lead || !p.can.group} aria-pressed={on} className="h-auto w-full justify-start gap-3 rounded-2xl bg-transparent px-2 py-2 text-left font-normal data-[disabled=true]:opacity-100 data-[hovered=true]:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]">
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-full', on ? 'bg-[var(--accent)] text-white' : 'bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] text-muted')}>
                  <HugeiconsIcon icon={kindIcon(x)} size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px]">{x.room ?? x.name}</span>
                  <span className="block truncate text-xs text-muted">{sub(x, p, inGroup)}</span>
                </span>
                <HugeiconsIcon icon={on ? CheckmarkCircle02Icon : CircleIcon} size={22} className={cn('shrink-0', on ? 'text-[var(--accent)]' : 'text-muted opacity-50')} />
              </Button>
              {on && members.length > 1 ? (
                <div className="pb-1 pl-12 pr-2">
                  <Volume p={x} act={act} label={x.room ?? x.name} compact />
                </div>
              ) : null}
            </div>
          );
        })}
      </Modal.Body>
    </Shell>
  );
}

/**
 * 3 · Room grid (Sonos): every room as a tile, lit when it's in the group, tap to add or drop it.
 * The group volume under the grid, then a slider per room in the group.
 */
export function PickerGrid({ home, p, act, isOpen, onOpenChange }: PickerProps) {
  const { inGroup, rooms, members, toggle } = useRooms(home, p, act);
  return (
    <Shell isOpen={isOpen} onOpenChange={onOpenChange} title="Rooms" size="md">
      <Modal.Header>
        <Modal.Heading>Rooms</Modal.Heading>
      </Modal.Header>
      <Modal.Body className="flex flex-col gap-4 pb-5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {rooms.map((x) => {
            const on = inGroup.has(x.id);
            const lead = x.id === p.id;
            return (
              <Button key={x.id} variant="ghost" onPress={() => toggle(x.id)} isDisabled={lead || !p.can.group} aria-pressed={on} className={cn('h-auto w-full min-w-0 flex-col items-start gap-3 rounded-[20px] p-3.5 text-left font-normal data-[disabled=true]:opacity-100', on ? 'bg-[var(--accent)] text-white data-[hovered=true]:bg-[var(--accent)]' : 'bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] data-[hovered=true]:bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]')}>
                <span className="flex w-full items-center justify-between">
                  <HugeiconsIcon icon={kindIcon(x)} size={20} />
                  {on ? <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} /> : null}
                </span>
                <span className="w-full min-w-0">
                  <span className="block truncate text-[15px] font-semibold">{x.room ?? x.name}</span>
                  <span className={cn('block truncate text-xs', on ? 'text-white/75' : 'text-muted')}>{lead ? 'Playing from here' : on ? 'In the group' : isActive(x) ? `Playing ${x.media?.title ?? ''}` : x.model ?? x.platform}</span>
                </span>
              </Button>
            );
          })}
        </div>
        {members.length > 1 ? (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold">Group volume</p>
            <GroupVolume members={members} act={act} />
            <div className="mt-1 flex flex-col gap-1.5 rounded-2xl bg-[color-mix(in_oklab,var(--foreground)_4%,transparent)] p-2.5">
              {members.map((m) => (
                <div key={m.id} className="grid grid-cols-[96px_1fr] items-center gap-2">
                  <span className="truncate text-[13px] text-muted">{m.room ?? m.name}</span>
                  <Volume p={m} act={act} label={m.room ?? m.name} compact />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-semibold">Volume</p>
            <Volume p={p} act={act} label={p.room ?? p.name} />
          </div>
        )}
      </Modal.Body>
    </Shell>
  );
}
