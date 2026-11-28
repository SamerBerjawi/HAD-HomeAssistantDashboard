/**
 * The Vacuums page in the Room page's layout (owner, 2026-11-28; docs/pro-ui/VACUUM_TILES.md),
 * built from the Vacuum Tiles Studio's picks: each part a tile (batches 1–3, the chosen concept),
 * the Fleet rail (batch 4 Rail B: every cleaner, robots then sticks, the open one with its facts
 * and buttons), All | Now (Sections B: the sections in a fixed order, or only what is running or
 * needs you) and on phones a compact header with a bottom dock (Phone C: Start / Pause, Dock, and
 * Wash or Empty).
 */
import { useState } from 'react';
import { Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { TileSize } from '../../../areas/tileTypes';
import { GRID, SPAN } from '../../../areas/page/RoomGrid';
import { statusWords, type Cleaner, type CleanerAction } from '../../../lib/vacuums/cleaner';
import { toneHue } from '../tiles/cleanerTileKit';
import { VACUUM_TYPES, type VacuumTileType } from '../studio/vacuumCatalog';
import { CleanerArt, DockButtons, FactRow, nowIds, QuickActions, sectionsOf } from './vacuumPageKit';

type TileId = VacuumTileType['id'];
const chosen = (id: TileId) => {
  const t = VACUUM_TYPES.find((x) => x.id === id)!;
  return (t.concepts.find((c) => c.id === t.chosen) ?? t.concepts.find((c) => c.id === t.recommended)!).Component;
};
const label = (text: string) => <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{text}</p>;

export default function VacuumPage({ cleaners, now, width, act }: { cleaners: Cleaner[]; now: number; width: number; act: (cleanerId: string, a: CleanerAction) => void }) {
  const [id, setId] = useState(cleaners[0]?.id ?? '');
  const [view, setView] = useState<'all' | 'now'>('all');
  const c = cleaners.find((x) => x.id === id) ?? cleaners[0];
  if (!c) return null;
  const phone = width < 640;
  const railed = width >= 860;
  const s = statusWords(c);
  const hue = toneHue(s.tone);
  const actOn = (a: CleanerAction) => act(c.id, a);

  // Sizes on the Room grid; Status and Rooms side by side as Large on wider screens.
  const SIZE: Record<TileId, TileSize> = { status: phone ? 'w' : 'l', rooms: 'l', station: 'w', care: 'w', history: 'w', lifetime: 'w', settings: 'l', stick: 'w', dock: 'w', energy: 'w' };
  const drawn = (ids: TileId[]) =>
    ids.map((tid) => {
      const C = chosen(tid);
      return (
        <li key={tid} className={cn('min-h-0 min-w-0', SPAN[SIZE[tid]])}>
          <C c={c} size={SIZE[tid]} act={actOn} now={now} />
        </li>
      );
    });
  const grid = (ids: TileId[]) => (
    <ul className={GRID} style={{ gridAutoRows: '68px' }}>
      {drawn(ids)}
    </ul>
  );
  const sections = sectionsOf(c);
  const live = nowIds(c);
  const nowTiles = sections.flatMap((x) => x.tiles).filter((t) => live.has(t));
  const goTo = (sid: string) => {
    setView('all');
    // After the All view has drawn the section.
    requestAnimationFrame(() => document.getElementById(`vacuum-${sid}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const views = (
    <ToggleButtonGroup aria-label="View" size="sm" selectionMode="single" disallowEmptySelection selectedKeys={new Set([view])} onSelectionChange={(k) => setView([...k][0] === 'now' ? 'now' : 'all')}>
      <ToggleButton id="all" className="text-[13px]">
        All
      </ToggleButton>
      <ToggleButton id="now" className="text-[13px]">
        Now · {nowTiles.length}
      </ToggleButton>
    </ToggleButtonGroup>
  );
  const content = (
    <div className="@container flex min-w-0 flex-1 flex-col gap-7">
      {views}
      {view === 'now' ? (
        <div className="flex flex-col gap-6">
          <p className={cn('px-1 font-semibold tracking-[-0.02em]', phone ? 'text-[20px]' : 'text-[24px]')}>
            <span style={{ color: hue }}>{s.word}.</span> <span className="font-normal opacity-60">{s.detail}</span>
          </p>
          {nowTiles.length ? grid(nowTiles) : <p className="px-1 text-[15px] opacity-60">Nothing running, nothing to do.</p>}
          <div>
            {label('Everything else')}
            {sections.map((x) => (
              <Button key={x.id} variant="ghost" onPress={() => goTo(x.id)} className="h-auto w-full min-w-0 justify-start gap-2.5 rounded-none border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] px-1 py-3 text-left text-[15px] text-[var(--foreground)]">
                <span className="shrink-0 font-semibold">{x.title}</span>
                <span className="min-w-0 truncate opacity-60">{x.summary}</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="ml-auto shrink-0 opacity-40" />
              </Button>
            ))}
          </div>
        </div>
      ) : (
        sections.map((x) => (
          <section key={x.id} id={`vacuum-${x.id}`} aria-label={x.title} className="flex scroll-mt-32 flex-col gap-3">
            <h2 className="flex items-baseline gap-2.5 px-1">
              <span className="shrink-0 whitespace-nowrap text-[19px] font-semibold">{x.title}</span>
              <span className="min-w-0 truncate text-[15px] opacity-60">{x.summary}</span>
            </h2>
            {grid(x.tiles)}
          </section>
        ))
      )}
    </div>
  );

  if (railed) {
    return (
      <div className="flex items-start gap-6 pb-8">
        <aside aria-label="Your cleaners" className="sticky top-[72px] flex max-h-[calc(100vh-88px)] w-[248px] shrink-0 flex-col gap-3 overflow-y-auto [scrollbar-width:thin]">
          {(['robot', 'stick'] as const).map((kind) => {
            const list = cleaners.filter((x) => x.kind === kind);
            if (!list.length) return null;
            return (
              <div key={kind} className="flex flex-col gap-1">
                {label(kind === 'robot' ? 'Robots' : 'Sticks')}
                {list.map((x) => {
                  const open = x.id === c.id;
                  const sx = statusWords(x);
                  return (
                    <div key={x.id} className={cn('rounded-[22px] transition-colors', open && 'bg-[var(--surface)] p-3')}>
                      <Button variant="ghost" onPress={() => setId(x.id)} aria-pressed={open} className="h-auto w-full min-w-0 justify-start gap-3 rounded-2xl px-2 py-2 text-left text-[var(--foreground)]">
                        <span className="grid w-12 shrink-0 place-items-center">
                          <CleanerArt c={x} px={52} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[16px] font-semibold">{x.name}</span>
                          <span className="block truncate text-[13px]" style={{ color: toneHue(sx.tone) }}>
                            {sx.word}
                          </span>
                        </span>
                      </Button>
                      {open ? (
                        <div className="mt-2 flex flex-col gap-3 px-1">
                          <FactRow c={x} now={now} />
                          {sx.detail ? <p className="text-[13px] opacity-70">{sx.detail}</p> : null}
                          <QuickActions c={x} act={(a) => act(x.id, a)} />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </aside>
        {content}
      </div>
    );
  }

  // Phone and narrow tablet: a compact header, the sections as sticky chips, the dock at the bottom.
  const i = cleaners.indexOf(c);
  const nextOne = cleaners[(i + 1) % cleaners.length];
  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center gap-3">
        <div className="grid h-16 w-14 shrink-0 place-items-center">
          <CleanerArt c={c} px={c.kind === 'stick' ? 62 : 64} />
        </div>
        <div className="min-w-0 flex-1">
          {cleaners.length > 1 ? (
            <Button variant="ghost" className="h-auto min-w-0 gap-1.5 rounded-xl px-0 text-left text-[var(--foreground)] data-[hovered=true]:bg-transparent" onPress={() => setId(nextOne.id)} aria-label={`${c.name}: switch to ${nextOne.name}`}>
              <span className="truncate text-[22px] font-semibold tracking-[-0.03em]">{c.name}</span>
              <HugeiconsIcon icon={ArrowDown01Icon} size={18} className="shrink-0 opacity-60" />
            </Button>
          ) : (
            <p className="truncate text-[22px] font-semibold tracking-[-0.03em]">{c.name}</p>
          )}
          <p className="truncate text-[14px] font-semibold" style={{ color: hue }}>
            {s.word}
          </p>
          {s.detail ? <p className="truncate text-[12px] opacity-60">{s.detail}</p> : null}
        </div>
      </header>
      <nav aria-label="On this page" className="sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto bg-[var(--background)]/85 px-4 py-2 backdrop-blur-md [scrollbar-width:none]">
        {sections.map((x) => (
          <Button key={x.id} size="sm" variant="secondary" onPress={() => goTo(x.id)} className="h-8 shrink-0 rounded-full px-3 text-[13px]">
            {x.title}
          </Button>
        ))}
      </nav>
      {content}
      {/* Above the app's floating tab bar. */}
      <div className="sticky bottom-[88px] z-10 -mx-1 mt-2 flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] py-2 pl-4 pr-2 shadow-lg backdrop-blur-md">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: hue }} />
        <p className="min-w-0 flex-1 truncate text-[14px] font-semibold">{s.word}</p>
        <DockButtons c={c} act={actOn} />
      </div>
    </div>
  );
}
