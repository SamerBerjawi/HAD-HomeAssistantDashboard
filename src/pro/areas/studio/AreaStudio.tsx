/**
 * Area Tiles Studio (docs/pro-ui/AREA_TILES.md). Dev only: /?studio=areas. A fresh start for the
 * Areas pages: one entity per tile, three concepts per entity type, every size, light and dark,
 * live (tap, slide and turn them: a mock HA answers). Plus the plan (grouping into batches) and a
 * simulated Area page. Nothing here touches the production Areas pages.
 */
import { useEffect, useState } from 'react';
import { Button, Chip, TextArea, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, Copy01Icon, GridViewIcon, Moon02Icon, PaintBoardIcon, StarIcon, Sun01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TILE_SIZE_LABEL as SIZE_LABELS, type TileAction, type TileModel, type TileSize } from '../tileTypes';
import { BATCHES, TILE_TYPES, type TileConceptId, type TileTypeEntry } from './areaCatalog';
import { applyTileAction } from './areaStates';
import AreaPageSim from './AreaPageSim';
import { Stage } from './Stage';
import { useAreaPicks } from './useAreaPicks';

const TAB_KEY = 'had.pro.areaStudio.tab';
type Theme = 'light' | 'dark' | 'both';
type Screen = 'phone' | 'desktop';

/** Cell sizes: phone (2 columns at 375 px) and a desktop cell (6 columns at ~1400 px). */
const CELL: Record<Screen, { w: number; h: number; gap: number }> = { phone: { w: 165, h: 148, gap: 12 }, desktop: { w: 208, h: 148, gap: 12 } };
const dims = (size: TileSize, s: Screen) => ({
  width: size === 'w' || size === 'l' ? CELL[s].w * 2 + CELL[s].gap : CELL[s].w,
  height: size === 'xs' ? (CELL[s].h - CELL[s].gap) / 2 : size === 't' || size === 'l' ? CELL[s].h * 2 + CELL[s].gap : CELL[s].h
});

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; text: string; icon?: Parameters<typeof HugeiconsIcon>[0]['icon'] }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      <ToggleButtonGroup
        aria-label={label}
        size="sm"
        selectionMode="single"
        disallowEmptySelection
        className="flex-wrap"
        selectedKeys={new Set([value])}
        onSelectionChange={(keys) => {
          const hit = options.find((o) => o.id === [...keys][0]);
          if (hit) onChange(hit.id);
        }}
      >
        {options.map((o) => (
          <ToggleButton key={o.id} id={o.id} className="gap-1.5 text-xs">
            {o.icon ? <HugeiconsIcon icon={o.icon} size={14} /> : null}
            {o.text}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

function TypeSection({ entry }: { entry: TileTypeEntry<TileModel> }) {
  const [stateId, setStateId] = useState(entry.states[0].id);
  const [live, setLive] = useState<TileModel>(entry.states[0].model);
  const [sizeView, setSizeView] = useState<TileSize | 'all'>('all');
  const [theme, setTheme] = useState<Theme>('both');
  const [screen, setScreen] = useState<Screen>('phone');
  const { pick, setPick, copy, copied } = useAreaPicks(entry);
  const act = (a: TileAction) => setLive((m) => applyTileAction(m, a));
  const sizes = sizeView === 'all' ? entry.sizes : [sizeView];
  const themes = theme === 'both' ? [false, true] : [theme === 'dark'];

  return (
    <section aria-labelledby={`tile-${entry.id}`} className="pro-surface flex flex-col gap-5 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`tile-${entry.id}`} className="text-xl font-semibold">
            {entry.title} <span className="text-sm font-normal text-muted">· {entry.domains}</span>
          </h2>
          <p className="mt-1 max-w-2xl text-sm">{entry.job}</p>
        </div>
        <Chip size="sm" variant="soft" color="accent">
          <Chip.Label>{entry.chosen ? `Chosen · ${entry.chosen.concept} · ${entry.concepts.find((c) => c.id === entry.chosen?.concept)?.name}` : entry.concepts.length > 1 ? `Batch ${entry.batch} · in review` : `Batch ${entry.batch} · Ambient style preview`}</Chip.Label>
        </Chip>
      </header>

      <div className="flex flex-wrap gap-4">
        <Segmented
          label="State (resets the live entity)"
          value={stateId}
          onChange={(id) => {
            setStateId(id);
            setLive(entry.states.find((s) => s.id === id)!.model);
          }}
          options={entry.states.map((s) => ({ id: s.id, text: s.label }))}
        />
        {entry.Tools ? <entry.Tools e={live} onChange={setLive} /> : null}
        <Segmented label="Size" value={sizeView} onChange={setSizeView} options={[{ id: 'all' as const, text: 'All sizes' }, ...entry.sizes.map((s) => ({ id: s, text: SIZE_LABELS[s] }))]} />
        <Segmented
          label="Theme"
          value={theme}
          onChange={setTheme}
          options={[
            { id: 'light', text: 'Light', icon: Sun01Icon },
            { id: 'dark', text: 'Dark', icon: Moon02Icon },
            { id: 'both', text: 'Both', icon: PaintBoardIcon }
          ]}
        />
        <Segmented
          label="Cell"
          value={screen}
          onChange={setScreen}
          options={[
            { id: 'phone', text: 'Phone 165 px' },
            { id: 'desktop', text: 'Desktop 208 px' }
          ]}
        />
      </div>
      <p className="-mt-2 text-xs text-muted">Live: every preview below is the same entity. Tap, slide and turn them; the others follow, as they would with Home Assistant.</p>

      {entry.concepts.map((c) => (
        <article key={c.id} className={cn('flex min-w-0 flex-col gap-3 rounded-2xl p-4', (entry.chosen?.concept ?? pick.concept) === c.id ? 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]' : 'bg-default/40')}>
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold">
              {c.id} · {c.name}
            </h3>
            {entry.chosen?.concept === c.id ? (
              <Chip size="sm" variant="soft" color="success">
                <Chip.Label>Chosen</Chip.Label>
              </Chip>
            ) : !entry.chosen && entry.recommended === c.id ? (
              <Chip size="sm" variant="soft" color="accent">
                <HugeiconsIcon icon={StarIcon} size={12} />
                <Chip.Label>Recommended</Chip.Label>
              </Chip>
            ) : null}
          </header>
          <div className="grid gap-3 text-sm lg:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <p>{c.idea}</p>
              <p className="mt-1 text-muted">{c.interaction}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-success">Strengths</p>
              <ul className="flex list-disc flex-col gap-0.5 pl-4 text-xs">
                {c.strengths.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-warning">Trade-offs</p>
              <ul className="flex list-disc flex-col gap-0.5 pl-4 text-xs">
                {c.tradeoffs.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-3 overflow-x-auto pb-1">
            {themes.map((dark) => (
              <Stage key={String(dark)} dark={dark} className="w-max">
                <div className="flex items-start gap-3">
                  {sizes.map((s) => (
                    <div key={s} className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-medium text-muted">{SIZE_LABELS[s]}</span>
                      <div style={dims(s, screen)}>
                        {(c.sizes ?? entry.sizes).includes(s) ? (
                          <c.Component e={live} size={s} act={act} />
                        ) : (
                          <div className="grid h-full place-items-center rounded-[22px] border border-dashed border-[var(--separator,rgba(127,127,127,0.35))] px-2 text-center text-[11px] text-muted">Not designed yet</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Stage>
            ))}
          </div>
        </article>
      ))}

      <div className="flex flex-col gap-3 rounded-2xl bg-default/40 p-4">
        {entry.chosen ? (
          <p className="text-sm">
            <span className="font-semibold">Chosen: {entry.chosen.concept}.</span> {entry.chosen.notes}
          </p>
        ) : (
          <p className="text-sm">
            <span className="font-semibold">Recommendation: {entry.recommended}.</span> {entry.why}
          </p>
        )}
        <Segmented<TileConceptId | 'mix' | 'none'>
          label="Your choice"
          value={pick.concept}
          onChange={(concept) => setPick({ ...pick, concept })}
          options={[{ id: 'none', text: 'Not yet' }, ...entry.concepts.map((c) => ({ id: c.id, text: `${c.id} · ${c.name}` })), { id: 'mix', text: 'Mix' }]}
        />
        <TextArea aria-label={`Notes for the ${entry.title} tile`} placeholder="Notes: what to keep, change or combine (e.g. A, with C's palette on Large)" value={pick.notes} onChange={(ev) => setPick({ ...pick, notes: ev.target.value })} rows={2} />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" isDisabled={pick.concept === 'none'} onPress={() => void copy()}>
            <HugeiconsIcon icon={Copy01Icon} size={14} />
            {copied ? 'Copied' : 'Copy selection'}
          </Button>
          <span className="text-xs text-muted">Paste it in the chat. Your pick also drives the simulated Area page.</span>
        </div>
      </div>
    </section>
  );
}

function PlanSection() {
  return (
    <section className="pro-surface flex flex-col gap-5 p-5">
      <div>
        <h2 className="text-xl font-semibold">The plan</h2>
        <p className="mt-1 max-w-3xl text-sm">
          A blank canvas. Rules for every tile: <b>one entity per tile</b> (never a group); each type gets its own look and interaction; every size is laid out on purpose (never stretched); the
          state reads from across the room; the main action is one tap or one slide on the tile; nothing clips at any size on a phone or a desktop cell. Sizes: X-small 1×½ (new), Small 1×1,
          Wide 2×1, Tall 1×2, Large 2×2 (2 / 4 / 6 columns).
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {BATCHES.map((b) => (
          <article key={b.id} className={cn('flex flex-col gap-3 rounded-2xl p-4', b.status === 'review' || b.status === 'chosen' ? 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]' : 'bg-default/40')}>
            <header className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">
                Batch {b.id} · {b.title}
              </h3>
              <Chip size="sm" variant="soft" color={b.status === 'chosen' ? 'success' : b.status === 'review' ? 'accent' : 'default'}>
                <Chip.Label>{b.status === 'chosen' ? 'Chosen' : b.status === 'review' ? 'Next up' : b.status === 'next' ? 'Next' : 'Later'}</Chip.Label>
              </Chip>
            </header>
            <ul className="flex flex-col gap-2 text-sm">
              {b.types.map((t) => (
                <li key={t.name}>
                  <p className="font-medium">
                    {t.name} <span className="text-xs font-normal text-muted">· {t.domains}</span>
                  </p>
                  <p className="text-xs text-muted">{t.note}</p>
                </li>
              ))}
            </ul>
          </article>
        ))}
        <article className="flex flex-col gap-2 rounded-2xl bg-[var(--accent-soft)] p-4 text-sm ring-2 ring-[var(--accent)]">
          <h3 className="font-semibold">Batch 6 · The page itself (in review)</h3>
          <p className="text-xs text-muted">Room header, grouping, editing and resizing, empty and sensors-only rooms: three page concepts (A Sections, B Rail, C Now first) plus the Ambient preview. Try them in the Area page tab.</p>
          <h3 className="mt-2 font-semibold">Open question</h3>
          <ul className="flex list-disc flex-col gap-1 pl-4 text-xs">
            <li>Add types the page skips today? Humidifier, valve, siren, button / script, select, number.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}

type Tab = 'plan' | 'page' | TileTypeEntry<TileModel>['id'];

function readTab(): Tab {
  try {
    const v = localStorage.getItem(TAB_KEY) as Tab | null;
    if (v === 'plan' || v === 'page' || TILE_TYPES.some((t) => t.id === v)) return v as Tab;
  } catch {
    /* storage blocked */
  }
  return 'plan';
}

export default function AreaStudio() {
  const [tab, setTab] = useState<Tab>(readTab);
  const choose = (t: Tab) => {
    setTab(t);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {
      /* not remembered */
    }
  };
  // Same as the Widget Studio: the chrome stays light; each preview owns its theme.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);
  const entry = TILE_TYPES.find((t) => t.id === tab);
  return (
    <div className="pro h-dvh overflow-y-auto overscroll-contain bg-[var(--background)] text-foreground" data-page="rooms">
      <main className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <HugeiconsIcon icon={GridViewIcon} size={24} className="text-[var(--accent)]" />
              Area Tiles Studio
            </h1>
            <p className="text-sm text-muted">A fresh start for the Areas pages: one entity per tile. Dev only; the production Areas pages are untouched.</p>
            <Button size="sm" variant="ghost" className="mt-1 -ml-2 gap-1 text-xs" onPress={() => window.location.assign('?studio')}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
              Widget Design Studio
            </Button>
          </div>
          <Segmented<Tab>
            label="Section"
            value={tab}
            onChange={choose}
            options={[{ id: 'plan', text: 'Plan' }, ...TILE_TYPES.map((t) => ({ id: t.id as Tab, text: t.batch <= 5 ? t.title : `${t.title} (D)` })), { id: 'page', text: 'Area page' }]}
          />
        </header>
        {tab === 'plan' ? <PlanSection /> : tab === 'page' ? <AreaPageSim /> : entry ? <TypeSection key={entry.id} entry={entry} /> : null}
      </main>
    </div>
  );
}
