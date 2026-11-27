/**
 * Vehicle Tiles Studio (docs/pro-ui/VEHICLE_TILES.md). Dev only: /?studio=vehicles. The Mobility
 * page rebuilt in the Room page's layout and tiles (owner, 2026-11-27), designed the way the Area
 * tiles were: the parts grouped into batches, three concepts per part, every size, light and dark,
 * live on the sample vehicles, the owner's pick kept here and copied for the chat; plus the page
 * itself, assembled from the picks.
 */
import { useEffect, useState } from 'react';
import { Button, Chip, TextArea, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Car01Icon, Copy01Icon, Moon02Icon, PaintBoardIcon, StarIcon, Sun01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { StudioNavBar } from '../../../../studio/StudioNavBar';
import { TILE_SIZE_LABEL, type TileSize } from '../../../../areas/tileTypes';
import { applySampleAction, type MobilityAction, type Vehicle } from '../../../../lib/mobilityHome';
import { VEHICLE_BATCHES, VEHICLE_TYPES, type VehicleConceptId, type VehicleTileType } from './vehicleCatalog';
import { vehicleStates } from './vehicleStates';
import { useVehiclePicks } from './useVehiclePicks';
import VehiclePageSim from './VehiclePageSim';

const TAB_KEY = 'had.pro.vehicleStudio.tab';
type Theme = 'light' | 'dark' | 'both';
type Screen = 'phone' | 'desktop';

/** The Room page's cells: phone (2 columns at 375 px) and desktop. */
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

/** A themed stage wearing the Mobility page accent. */
function Stage({ dark, children }: { dark: boolean; children: React.ReactNode }) {
  return (
    <div className={cn(dark && 'dark')}>
      <div className="pro w-max rounded-2xl bg-[var(--background)] p-3 text-foreground" data-page="mobility">
        {children}
      </div>
    </div>
  );
}

function TypeSection({ type }: { type: VehicleTileType }) {
  const states = vehicleStates();
  const [stateId, setStateId] = useState(states[0].id);
  const [live, setLive] = useState<{ v: Vehicle; now: number }>({ v: states[0].v, now: states[0].now });
  const [sizeView, setSizeView] = useState<TileSize | 'all'>('all');
  const [theme, setTheme] = useState<Theme>('both');
  const [screen, setScreen] = useState<Screen>('phone');
  const { pick, setPick, copy, copied } = useVehiclePicks(type);
  const act = (a: MobilityAction) => setLive((s) => ({ ...s, v: applySampleAction(s.v, a) }));
  const sizes = sizeView === 'all' ? type.sizes : [sizeView];
  const themes = theme === 'both' ? [false, true] : [theme === 'dark'];

  return (
    <section aria-labelledby={`vt-${type.id}`} className="pro-surface flex flex-col gap-5 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`vt-${type.id}`} className="text-xl font-semibold">
            {type.title} <span className="text-sm font-normal text-muted">· {type.reads}</span>
          </h2>
          <p className="mt-1 max-w-2xl text-sm">{type.job}</p>
        </div>
        <Chip size="sm" variant="soft" color="accent">
          <Chip.Label>{type.chosen ? `Chosen · ${type.chosen} · ${type.concepts.find((c) => c.id === type.chosen)?.name}` : `Batch ${type.batch} · in review`}</Chip.Label>
        </Chip>
      </header>

      <div className="flex flex-wrap gap-4">
        <Segmented
          label="State (resets the live vehicle)"
          value={stateId}
          onChange={(id) => {
            setStateId(id);
            const s = states.find((x) => x.id === id)!;
            setLive({ v: s.v, now: s.now });
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
      <p className="-mt-2 text-xs text-muted">Live: every preview is the same vehicle. Start, pause, set the limit or the temperature; the others follow, as they would with Home Assistant.</p>

      {type.concepts.map((c) => (
        <article key={c.id} className={cn('flex min-w-0 flex-col gap-3 rounded-2xl p-4', (type.chosen ?? pick.concept) === c.id ? 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]' : 'bg-default/40')}>
          <header className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold">
              {c.id} · {c.name}
            </h3>
            {type.chosen === c.id ? (
              <Chip size="sm" variant="soft" color="success">
                <Chip.Label>Chosen</Chip.Label>
              </Chip>
            ) : !type.chosen && type.recommended === c.id ? (
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
                        <c.Component v={live.v} size={s} act={act} now={live.now} />
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
          {type.chosen ? <span className="font-semibold">Chosen: {type.chosen}. </span> : null}
          <span className="font-semibold">Recommendation was {type.recommended}.</span> {type.why}
        </p>
        <Segmented<VehicleConceptId | 'mix' | 'none'>
          label="Your choice"
          value={pick.concept}
          onChange={(concept) => setPick({ ...pick, concept })}
          options={[{ id: 'none', text: 'Not yet' }, ...type.concepts.map((c) => ({ id: c.id, text: `${c.id} · ${c.name}` })), { id: 'mix', text: 'Mix' }]}
        />
        <TextArea aria-label={`Notes for the ${type.title} tile`} placeholder="Notes: what to keep, change or combine (e.g. A, with C's words on Small)" value={pick.notes} onChange={(ev) => setPick({ ...pick, notes: ev.target.value })} rows={2} />
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" isDisabled={pick.concept === 'none'} onPress={() => void copy()}>
            <HugeiconsIcon icon={Copy01Icon} size={14} />
            {copied ? 'Copied' : 'Copy selection'}
          </Button>
          <span className="text-xs text-muted">Paste it in the chat. Your pick also drives the Mobility page preview.</span>
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
          The Mobility page in the Room page’s layout: the vehicle in the rail (its picture, name, facts, readiness, on this page) and its parts as tiles in sections. Each part gets its own tile,
          designed like the Area tiles: three concepts, every size (X-small, Small, Wide, Large), light and dark, live. Parts that match a Room tile (doors, openings, extras, readings) start
          from it; the others are new. Until a batch is designed, the page preview draws its parts with the Room page’s tiles.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {VEHICLE_BATCHES.map((b) => (
          <article key={b.id} className={cn('flex flex-col gap-3 rounded-2xl p-4', b.status === 'review' || b.status === 'chosen' ? 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]' : 'bg-default/40')}>
            <header className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">
                Batch {b.id} · {b.title}
              </h3>
              <Chip size="sm" variant="soft" color={b.status === 'chosen' ? 'success' : b.status === 'review' ? 'accent' : 'default'}>
                <Chip.Label>{b.status === 'chosen' ? 'Chosen' : b.status === 'review' ? 'In review' : b.status === 'next' ? 'Next' : 'Later'}</Chip.Label>
              </Chip>
            </header>
            <ul className="flex flex-col gap-2 text-sm">
              {b.parts.map((t) => (
                <li key={t.name}>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted">
                    {t.note}
                    {t.standIn !== '—' ? ` · stand-in: ${t.standIn}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

type Tab = 'plan' | 'page' | VehicleTileType['id'];

function readTab(): Tab {
  try {
    const v = localStorage.getItem(TAB_KEY) as Tab | null;
    if (v === 'plan' || v === 'page' || VEHICLE_TYPES.some((t) => t.id === v)) return v as Tab;
  } catch {
    /* storage blocked */
  }
  return 'plan';
}

export default function VehicleTilesStudio() {
  const [tab, setTab] = useState<Tab>(readTab);
  const choose = (t: Tab) => {
    setTab(t);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch {
      /* not remembered */
    }
  };
  // As the Area studio: the chrome stays light; each preview owns its theme.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);
  const type = VEHICLE_TYPES.find((t) => t.id === tab);
  return (
    <div className="pro h-dvh overflow-y-auto overscroll-contain bg-[var(--background)] text-foreground" data-page="mobility">
      <main className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-6">
        <StudioNavBar current="vehicles" />
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <HugeiconsIcon icon={Car01Icon} size={24} className="text-[var(--accent)]" />
              Vehicle Tiles Studio
            </h1>
            <p className="text-sm text-muted">The Mobility page in the Room page’s layout and tiles. Dev only; the live Mobility page is untouched.</p>
          </div>
          <Segmented<Tab> label="Section" value={tab} onChange={choose} options={[{ id: 'plan', text: 'Plan' }, ...VEHICLE_TYPES.map((t) => ({ id: t.id as Tab, text: t.title })), { id: 'page', text: 'Mobility page' }]} />
        </header>
        {tab === 'plan' ? <PlanSection /> : tab === 'page' ? <VehiclePageSim /> : type ? <TypeSection key={type.id} type={type} /> : null}
      </main>
    </div>
  );
}
