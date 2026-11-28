/**
 * Vacuum Tiles Studio (docs/pro-ui/VACUUM_TILES.md). Dev only: /?studio=vacuums. The Vacuums page
 * in the Room page's layout and tiles, designed the way the Vehicle tiles were: parts in batches,
 * three concepts each, every size, light and dark, live on samples of the owner's Dreame robot and
 * Samsung stick (and a plainer robot), the pick kept in this browser and copied for the chat.
 * When Home Assistant is connected in this browser, "Your …" states show the real devices
 * (read-only: actions change the preview, never Home Assistant).
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button, Chip, TextArea, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, Moon02Icon, PaintBoardIcon, RoboticIcon, StarIcon, Sun01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { StudioNavBar } from '../../../studio/StudioNavBar';
import { TILE_SIZE_LABEL, type TileSize } from '../../../areas/tileTypes';
import { applySampleAction, type Cleaner, type CleanerAction } from '../../../lib/vacuums/cleaner';
import { cleanerSources } from '../../../lib/vacuums/adapters';
import { cleanerSamples } from '../../../lib/vacuums/samples';
import { VACUUM_BATCHES, VACUUM_TYPES, type VacuumConceptId, type VacuumTileType } from './vacuumCatalog';

const VacuumPageSim = lazy(() => import('./VacuumPageSim'));

const TAB_KEY = 'had.pro.vacuumStudio.tab';
const PICKS_KEY = 'had.pro.vacuumStudio.picks';
type Theme = 'light' | 'dark' | 'both';
type Screen = 'phone' | 'desktop';
interface Pick {
  concept: VacuumConceptId | 'mix' | 'none';
  notes: string;
}

const CELL: Record<Screen, { w: number; h: number; gap: number }> = { phone: { w: 165, h: 148, gap: 12 }, desktop: { w: 208, h: 148, gap: 12 } };
const dims = (size: TileSize, s: Screen) => ({
  width: size === 'w' || size === 'l' ? CELL[s].w * 2 + CELL[s].gap : CELL[s].w,
  height: size === 'xs' ? (CELL[s].h - CELL[s].gap) / 2 : size === 't' || size === 'l' ? CELL[s].h * 2 + CELL[s].gap : CELL[s].h
});

function readPicks(): Record<string, Pick> {
  try {
    const p: unknown = JSON.parse(localStorage.getItem(PICKS_KEY) ?? '{}');
    return p && typeof p === 'object' ? (p as Record<string, Pick>) : {};
  } catch {
    return {};
  }
}

function usePick(type: VacuumTileType) {
  const [pick, set] = useState<Pick>(() => readPicks()[type.id] ?? { concept: 'none', notes: '' });
  const [copied, setCopied] = useState(false);
  const setPick = useCallback(
    (next: Pick) => {
      set(next);
      setCopied(false);
      try {
        localStorage.setItem(PICKS_KEY, JSON.stringify({ ...readPicks(), [type.id]: next }));
      } catch {
        /* works for this visit */
      }
    },
    [type.id]
  );
  const copy = useCallback(async () => {
    const name = type.concepts.find((c) => c.id === pick.concept)?.name;
    const choice = pick.concept === 'mix' ? 'a mix' : `Concept ${pick.concept}${name ? ` (${name})` : ''}`;
    try {
      await navigator.clipboard.writeText(`Vacuum tiles · ${type.title}: ${choice}.${pick.notes.trim() ? ` Notes: ${pick.notes.trim()}` : ''}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [type, pick]);
  return { pick, setPick, copy, copied };
}

/** The owner's real cleaners, when Home Assistant is connected in this browser. */
function useLiveCleaners(): Cleaner[] {
  const { states, registry, devices } = useAutoLayoutStore(useShallow((s) => ({ states: s.states, registry: s.rawEntityRegistry, devices: s.rawDevices })));
  return useMemo(() => (registry?.length ? cleanerSources({ states, registry, devices: devices ?? [], zones: [], now: Date.now() }).map((s) => s.cleaner) : []), [states, registry, devices]);
}

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

function Stage({ dark, children }: { dark: boolean; children: React.ReactNode }) {
  return (
    <div className={cn(dark && 'dark')}>
      <div className="pro w-max rounded-2xl bg-[var(--background)] p-3 text-foreground" data-page="vacuums">
        {children}
      </div>
    </div>
  );
}

function TypeSection({ type, live }: { type: VacuumTileType; live: Cleaner[] }) {
  const states = useMemo(() => {
    const samples = cleanerSamples().filter((s) => s.c.kind === type.kind);
    const mine = live.filter((c) => c.kind === type.kind).map((c) => ({ id: `live:${c.id}`, label: `Yours · ${c.name}`, c, now: Date.now() }));
    return [...mine, ...samples];
  }, [type.kind, live]);
  const [stateId, setStateId] = useState(states[0].id);
  const [cur, setCur] = useState({ c: states[0].c, now: states[0].now });
  const [sizeView, setSizeView] = useState<TileSize | 'all'>('all');
  const [theme, setTheme] = useState<Theme>('both');
  const [screen, setScreen] = useState<Screen>('phone');
  const { pick, setPick, copy, copied } = usePick(type);
  const act = (a: CleanerAction) => setCur((s) => ({ ...s, c: applySampleAction(s.c, a) }));
  const sizes = sizeView === 'all' ? type.sizes : [sizeView];
  const themes = theme === 'both' ? [false, true] : [theme === 'dark'];

  return (
    <section aria-labelledby={`vac-${type.id}`} className="pro-surface flex flex-col gap-5 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`vac-${type.id}`} className="text-xl font-semibold">
            {type.title} <span className="text-sm font-normal text-muted">· {type.reads}</span>
          </h2>
          <p className="mt-1 max-w-2xl text-sm">{type.job}</p>
        </div>
        <Chip size="sm" variant="soft" color="accent">
          <Chip.Label>{type.chosen ? `Chosen · ${type.chosen}` : `Batch ${type.batch} · in review`}</Chip.Label>
        </Chip>
      </header>

      <div className="flex flex-wrap gap-4">
        <Segmented
          label="State (resets the preview)"
          value={stateId}
          onChange={(id) => {
            setStateId(id);
            const s = states.find((x) => x.id === id)!;
            setCur({ c: s.c, now: s.now });
          }}
          options={states.map((s) => ({ id: s.id, text: s.label }))}
        />
        <Segmented label="Size" value={sizeView} onChange={setSizeView} options={[{ id: 'all' as const, text: 'All sizes' }, ...type.sizes.map((s) => ({ id: s, text: TILE_SIZE_LABEL[s] }))]} />
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
      <p className="-mt-2 text-xs text-muted">Live: every preview is the same device. Start, pause, wash, empty or reset; the others follow. Nothing is sent to Home Assistant.</p>

      {type.concepts.map((c) => (
        <article key={c.id} className={cn('flex min-w-0 flex-col gap-3 rounded-2xl p-4', (type.chosen ?? pick.concept) === c.id ? 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]' : 'bg-default/40')}>
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold">
              {c.id} · {c.name}
            </h3>
            {!type.chosen && type.recommended === c.id ? (
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
              <Stage key={String(dark)} dark={dark}>
                <div className="flex items-start gap-3">
                  {sizes.map((s) => (
                    <div key={s} className="flex flex-col gap-1.5">
                      <span className="text-[11px] font-medium text-muted">{TILE_SIZE_LABEL[s]}</span>
                      <div style={dims(s, screen)}>
                        <c.Component c={cur.c} size={s} act={act} now={cur.now} />
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
        <p className="text-sm">
          <span className="font-semibold">Recommendation: {type.recommended}.</span> {type.why}
        </p>
        <Segmented<VacuumConceptId | 'mix' | 'none'>
          label="Your choice"
          value={pick.concept}
          onChange={(concept) => setPick({ ...pick, concept })}
          options={[{ id: 'none', text: 'Not yet' }, ...type.concepts.map((c) => ({ id: c.id, text: `${c.id} · ${c.name}` })), { id: 'mix', text: 'Mix' }]}
        />
        <TextArea aria-label={`Notes for the ${type.title} tile`} placeholder="Notes: what to keep, change or combine" value={pick.notes} onChange={(ev) => setPick({ ...pick, notes: ev.target.value })} rows={2} />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" isDisabled={pick.concept === 'none'} onPress={() => void copy()}>
            <HugeiconsIcon icon={Copy01Icon} size={14} />
            {copied ? 'Copied' : 'Copy selection'}
          </Button>
          <span className="text-xs text-muted">Paste it in the chat.</span>
        </div>
      </div>
    </section>
  );
}

function PlanSection({ live }: { live: Cleaner[] }) {
  return (
    <section className="pro-surface flex flex-col gap-5 p-5">
      <div>
        <h2 className="text-xl font-semibold">The plan</h2>
        <p className="mt-1 max-w-3xl text-sm">
          The Vacuums page in the Room page’s layout, as Mobility: each cleaner in the rail and its parts as tiles. Robots and sticks share one model, so a Roborock, an Ecovacs or a Dyson
          fits the same tiles; a tile says when a model doesn’t report something. Three concepts per part, every size, light and dark, live on samples of your Dreame and Samsung.
        </p>
        <p className="mt-2 text-sm text-muted">
          {live.length ? `Found in Home Assistant: ${live.map((c) => `${c.name} (${c.make ?? c.integration})`).join(', ')}. Pick “Yours · …” as the state to see them.` : 'Home Assistant isn’t connected in this browser, so only the samples show.'}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {VACUUM_BATCHES.map((b) => (
          <article key={b.id} className={cn('flex flex-col gap-3 rounded-2xl p-4', b.status === 'review' ? 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]' : 'bg-default/40')}>
            <header className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">
                Batch {b.id} · {b.title}
              </h3>
              <Chip size="sm" variant="soft" color={b.status === 'review' ? 'accent' : 'default'}>
                <Chip.Label>{b.status === 'review' ? 'In review' : b.status === 'next' ? 'Next' : b.status === 'chosen' ? 'Chosen' : 'Later'}</Chip.Label>
              </Chip>
            </header>
            <ul className="flex flex-col gap-2 text-sm">
              {b.parts.map((t) => (
                <li key={t.name}>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted">{t.note}</p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

type Tab = 'plan' | 'page' | VacuumTileType['id'];

function readTab(): Tab {
  try {
    const v = localStorage.getItem(TAB_KEY);
    if (v === 'plan' || v === 'page' || VACUUM_TYPES.some((t) => t.id === v)) return v as Tab;
  } catch {
    /* storage blocked */
  }
  return 'plan';
}

export default function VacuumTilesStudio() {
  const [tab, setTab] = useState<Tab>(readTab);
  const live = useLiveCleaners();
  const choose = (t: Tab) => {
    setTab(t);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {
      /* not remembered */
    }
  };
  // As the other studios: the chrome stays light; each preview owns its theme.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);
  const type = VACUUM_TYPES.find((t) => t.id === tab);
  return (
    <div className="pro h-dvh overflow-y-auto overscroll-contain bg-[var(--background)] text-foreground" data-page="vacuums">
      <main className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6">
        <StudioNavBar current="vacuums" />
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <HugeiconsIcon icon={RoboticIcon} size={24} className="text-[var(--accent)]" />
              Vacuum Tiles Studio
            </h1>
            <p className="text-sm text-muted">The Vacuums page in the Room page’s layout and tiles. Dev only; the live page is untouched.</p>
          </div>
          <Segmented<Tab> label="Section" value={tab} onChange={choose} options={[{ id: 'plan', text: 'Plan' }, ...VACUUM_TYPES.map((t) => ({ id: t.id as Tab, text: `${t.batch} · ${t.title}` })), { id: 'page', text: '4 · Vacuums page' }]} />
        </header>
        {tab === 'plan' ? (
          <PlanSection live={live} />
        ) : tab === 'page' ? (
          <Suspense fallback={null}>
            <VacuumPageSim live={live} />
          </Suspense>
        ) : type ? <TypeSection key={type.id} type={type} live={live} /> : null}
      </main>
    </div>
  );
}
