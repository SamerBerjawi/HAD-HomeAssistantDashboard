/**
 * Media round 4: the library, where you start something (docs/pro-ui/MEDIA.md §0), under A's player
 * and "Also playing". Three ways: 1 · Shelves (round 1's: a row of tiles per shelf), 2 · Quick picks
 * + shelves (Spotify Home: a grid of what you played lately on top, then the shelves), 3 · Tabs
 * (Apple Music's Library: one shelf at a time in a grid, chosen with tabs). Each says where a tap
 * plays ("Plays in the Living room"), and TV apps only show for a TV.
 */
import { useState } from 'react';
import { Button, Tabs } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { AirplayLineIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { MediaHome, Player, Shelf } from '../../../lib/mediaHome';
import { Cover, QuickGrid, ShelfRow, playItem, type DesignProps } from './parts';

export interface LibraryProps {
  home: MediaHome;
  /** Where a tap plays (the room in the player, or the one picked when nothing plays). */
  target: Player | null;
  act: DesignProps['act'];
  width: number;
}

/** The shelves that fit the target: TV apps only for a TV, music only for speakers. */
export const shelvesFor = (home: MediaHome, target: Player | null): Shelf[] =>
  home.shelves
    .map((s) => ({ ...s, items: s.items.filter((it) => !it.on || (target ? it.on.includes(target.id) : false)) }))
    .filter((s) => s.items.length > 0)
    .filter((s) => (target?.kind === 'tv' ? true : s.kind !== 'apps'));

export function PlaysIn({ target }: { target: Player | null }) {
  if (!target) return null;
  return (
    <p className="-mt-1 flex items-center gap-1.5 text-[13px] text-muted">
      <HugeiconsIcon icon={AirplayLineIcon} size={14} />
      Plays in the {target.room ?? target.name}
      {target.kind === 'tv' ? ' (TV)' : ''}
    </p>
  );
}

/** 1 · Shelves: round 1's rows of tiles, one per shelf, scrolling sideways. */
export function LibraryShelves({ home, target, act, width }: LibraryProps) {
  const phone = width < 640;
  return (
    <div className="flex flex-col gap-6">
      <PlaysIn target={target} />
      {shelvesFor(home, target).map((s) => (
        <ShelfRow key={s.id} shelf={s} target={target} act={act} tile={phone ? 132 : 160} />
      ))}
    </div>
  );
}

/** 2 · Quick picks + shelves: Spotify Home's grid of what you played lately (one tap to play), then the other shelves. */
export function LibraryQuick({ home, target, act, width }: LibraryProps) {
  const phone = width < 640;
  const shelves = shelvesFor(home, target);
  const recent = shelves.find((s) => s.kind === 'recent');
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <h3 className="text-[19px] font-semibold tracking-tight">Start something</h3>
        <PlaysIn target={target} />
        {recent ? <QuickGrid items={recent.items.slice(0, phone ? 6 : 8)} target={target} act={act} cols={width < 520 ? 2 : width < 900 ? 3 : 4} /> : null}
      </div>
      {shelves
        .filter((s) => s.kind !== 'recent')
        .map((s) => (
          <ShelfRow key={s.id} shelf={s} target={target} act={act} tile={phone ? 128 : 150} />
        ))}
    </div>
  );
}

/** 3 · Tabs: Apple Music's Library. One shelf at a time as a grid of tiles, chosen with tabs (Recently played, Playlists, Radio, On the TV). */
export function LibraryTabs({ home, target, act, width }: LibraryProps) {
  const shelves = shelvesFor(home, target);
  const [tab, setTab] = useState<string>(shelves[0]?.id ?? '');
  const current = shelves.find((s) => s.id === tab) ?? shelves[0];
  const cols = width < 420 ? 2 : width < 640 ? 3 : width < 900 ? 4 : width < 1300 ? 6 : 8;
  if (!current) return null;
  return (
    <section aria-label="Library" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-[19px] font-semibold tracking-tight">Library</h3>
        <PlaysIn target={target} />
      </div>
      <Tabs selectedKey={current.id} onSelectionChange={(k) => setTab(String(k))}>
        <Tabs.ListContainer className="self-start">
          <Tabs.List aria-label="Library" className="min-w-0">
            {shelves.map((s) => (
              <Tabs.Tab key={s.id} id={s.id} className="w-auto flex-none whitespace-nowrap px-4">
                {s.title}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
        {shelves.map((s) => (
          <Tabs.Panel key={s.id} id={s.id} className="px-0 pb-0 pt-4">
            <div className="grid gap-x-3 gap-y-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {s.items.map((it) => (
                <Button key={it.id} variant="ghost" isDisabled={!target} onPress={() => playItem(it, target, act)} aria-label={`Play ${it.title}${target ? ` in the ${target.room ?? target.name}` : ''}`} className="h-auto w-full min-w-0 flex-col items-start gap-2 rounded-2xl bg-transparent p-1.5 text-left font-normal data-[hovered=true]:bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]">
                  <Cover art={it.art} seed={it.title} round={cn(it.kind === 'artist' ? 'rounded-full' : 'rounded-[10px]')} shadow className="w-full" />
                  <span className="w-full min-w-0">
                    <span className="block truncate text-[14px] font-medium">{it.title}</span>
                    <span className="block truncate text-[12px] text-muted">{it.subtitle}</span>
                  </span>
                </Button>
              ))}
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </section>
  );
}
