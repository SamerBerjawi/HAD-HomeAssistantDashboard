/**
 * The Vacuums page in the Room page's layout (owner, 2026-11-28; docs/pro-ui/VACUUM_TILES.md):
 * the chosen tiles (batches 1–3) in sections, framed by batch 4's parts, each switchable here:
 * the rail (Room rail, Fleet, Home base), the sections and views (Kind tabs, All | Now, Moment
 * order) and the phone (Picture header, Compact, Bottom dock). Live: the buttons change the sample.
 */
import { useState, type ReactNode } from 'react';
import { Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowLeft01Icon, ArrowRight01Icon, Copy01Icon, Notification03Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { TileSize } from '../../../areas/tileTypes';
import { applySampleAction, statusWords, type Cleaner, type CleanerAction } from '../../../lib/vacuums/cleaner';
import { cleanerSamples, SAMPLE_NOW } from '../../../lib/vacuums/samples';
import { toneHue } from '../tiles/cleanerTileKit';
import { CleanerArt, CleanerStage, DockButtons, FactRow, HomeArt, momentWhy, nowIds, QuickActions, sectionsOf, StatusCard } from '../page/vacuumPageKit';
import { VACUUM_TYPES, type VacuumConceptId, type VacuumTileType } from './vacuumCatalog';
import { PAGE_PARTS, type PagePart } from './pageParts';

type Screen = 'phone' | 'desktop';
type TileId = VacuumTileType['id'];

/** The Room page's grid: half rows of 68 px, 12 px gaps (Small = 148 px). */
const SPAN: Record<TileSize, string> = { xs: 'col-span-1 row-span-1', s: 'col-span-1 row-span-2', w: 'col-span-2 row-span-2', t: 'col-span-1 row-span-4', l: 'col-span-2 row-span-4' };
const SIZE = (phone: boolean): Record<TileId, TileSize> => ({ status: phone ? 'w' : 'l', rooms: 'l', station: 'w', care: 'w', history: 'w', lifetime: 'w', settings: 'l', stick: 'w', dock: 'w', energy: 'w' });

/** The moments to look at: which samples are home together. */
const MOMENTS: { id: string; label: string; ids: string[] }[] = [
  { id: 'quiet', label: 'All quiet', ids: ['ready', 'stick-ready'] },
  { id: 'cleaning', label: 'Robot cleaning', ids: ['cleaning', 'stick-home'] },
  { id: 'chores', label: 'Station needs you', ids: ['chores', 'stick-ready'] },
  { id: 'stuck', label: 'Robot stuck, stick out', ids: ['stuck', 'stick-use'] },
  { id: 'worn', label: 'Parts worn', ids: ['worn', 'stick-ready'] },
  { id: 'bag', label: 'Dust bag full', ids: ['ready', 'stick-full'] },
  { id: 'three', label: 'Two robots and a stick', ids: ['cleaning', 'other', 'stick-ready'] }
];
const fleetOf = (m: string, live: Cleaner[]) => (m === 'live' ? live : MOMENTS.find((x) => x.id === m)!.ids.map((id) => cleanerSamples().find((s) => s.id === id)!.c));
// Robots first, then sticks: the rail's order.
const sorted = (cs: Cleaner[]) => [...cs].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'robot' ? -1 : 1));

function Pick<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; text: string }[]; onChange: (v: T) => void }) {
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
          <ToggleButton key={o.id} id={o.id} className="text-xs">
            {o.text}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

const PAGE_KEY = 'had.pro.vacuumStudio.pagePicks';
type PagePicks = Record<PagePart['id'], VacuumConceptId>;

function readPagePicks(): PagePicks {
  const base = Object.fromEntries(PAGE_PARTS.map((p) => [p.id, p.chosen ?? p.recommended])) as PagePicks;
  try {
    const saved = JSON.parse(window.localStorage.getItem(PAGE_KEY) ?? '{}') as Partial<PagePicks>;
    return Object.fromEntries(PAGE_PARTS.map((p) => [p.id, p.chosen ?? saved[p.id] ?? base[p.id]])) as PagePicks;
  } catch {
    return base;
  }
}

export default function VacuumPageSim({ live }: { live: Cleaner[] }) {
  const [moment, setMoment] = useState('cleaning');
  const [fleet, setFleet] = useState<Cleaner[]>(() => sorted(fleetOf('cleaning', live)));
  const [id, setId] = useState(fleet[0].id);
  const [screen, setScreen] = useState<Screen>('desktop');
  const [dark, setDark] = useState(true);
  const [picks, setPicksState] = useState<PagePicks>(readPagePicks);
  const [view, setView] = useState<'all' | 'now'>('all');
  const [copied, setCopied] = useState(false);
  const now = moment === 'live' ? Date.now() : SAMPLE_NOW;
  const setPick = (part: PagePart['id'], x: VacuumConceptId) => {
    const next = { ...picks, [part]: x };
    setPicksState(next);
    setCopied(false);
    try {
      window.localStorage.setItem(PAGE_KEY, JSON.stringify(next));
    } catch {
      /* blocked storage: works for this visit */
    }
  };
  const copy = async () => {
    const text = PAGE_PARTS.map((p) => `${p.title} ${picks[p.id]} (${p.concepts.find((x) => x.id === picks[p.id])?.name})`).join(', ');
    try {
      await navigator.clipboard.writeText(`Vacuums page · ${text}.`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const c = fleet.find((x) => x.id === id) ?? fleet[0];
  const act = (cid: string) => (a: CleanerAction) => setFleet((f) => f.map((x) => (x.id === cid ? applySampleAction(x, a) : x)));
  const phone = screen === 'phone';
  const size = SIZE(phone);
  const s = statusWords(c);
  const hue = toneHue(s.tone);

  const conceptOf = (tid: TileId) => {
    const t = VACUUM_TYPES.find((x) => x.id === tid)!;
    return t.concepts.find((x) => x.id === (t.chosen ?? t.recommended))!.Component;
  };
  const drawn = (ids: TileId[]) =>
    ids.map((tid) => {
      const C = conceptOf(tid);
      return (
        <div key={tid} className={SPAN[size[tid]]}>
          <C c={c} size={size[tid]} act={act(c.id)} now={now} />
        </div>
      );
    });
  const sections = sectionsOf(c);
  const why = momentWhy(c);
  const ordered = picks.sections === 'C' ? [...sections].sort((a, b) => (why[a.id]?.rank ?? 9) - (why[b.id]?.rank ?? 9)) : sections;
  const nowTiles = sections.flatMap((x) => x.tiles).filter((t) => nowIds(c).has(t));
  const showNow = picks.sections === 'B' && view === 'now';

  const next = () => setId(fleet[(fleet.indexOf(c) + 1) % fleet.length].id);
  const nameButton = (cls: string) => (
    <Button variant="ghost" className="h-auto min-w-0 gap-1.5 rounded-xl px-0 text-left text-[var(--foreground)] data-[hovered=true]:bg-transparent" onPress={next} isDisabled={fleet.length < 2} aria-label={`${c.name}: switch cleaner`}>
      <span className={cn('truncate font-semibold tracking-[-0.03em]', cls)}>{c.name}</span>
      {fleet.length > 1 ? <HugeiconsIcon icon={ArrowDown01Icon} size={18} className="shrink-0 opacity-60" /> : null}
    </Button>
  );
  const label = (text: string) => <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide opacity-60">{text}</p>;
  const chips = (sticky: boolean) => (
    <div className={cn('flex gap-2 py-2', sticky ? 'sticky top-0 z-10 -mx-5 overflow-x-auto bg-[var(--background)] px-5' : 'flex-wrap')}>
      {ordered.map((x) => (
        <span key={x.id} className="shrink-0 rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] px-3 py-1.5 text-[13px]">
          {x.title}
        </span>
      ))}
    </div>
  );
  const onThisPage = (
    <nav aria-label="On this page">
      {label('On this page')}
      {ordered.map((x) => (
        <p key={x.id} className="py-2 text-[15px]">
          {x.title} <span className="opacity-60">{x.summary}</span>
        </p>
      ))}
    </nav>
  );

  // ---- Rail (tablet and desktop) ----
  const railA = (
    <div className="sticky top-4 flex flex-col gap-4 self-start">
      <CleanerStage c={c} px={c.kind === 'stick' ? 150 : 130} />
      <div>
        {nameButton('text-[30px] leading-tight')}
        <div className="mt-2">
          <FactRow c={c} now={now} />
        </div>
      </div>
      <StatusCard c={c} />
      <QuickActions c={c} act={act(c.id)} />
      {onThisPage}
    </div>
  );
  const railB = (
    <div className="sticky top-4 flex flex-col gap-2 self-start">
      {(['robot', 'stick'] as const).map((kind) => {
        const list = fleet.filter((x) => x.kind === kind);
        if (!list.length) return null;
        return (
          <div key={kind} className="flex flex-col gap-1">
            {label(kind === 'robot' ? 'Robots' : 'Sticks')}
            {list.map((x) => {
              const open = x.id === c.id;
              const sx = statusWords(x);
              return (
                <div key={x.id} className={cn('rounded-[22px] transition-colors', open ? 'bg-[var(--surface)] p-3' : '')}>
                  <Button variant="ghost" onPress={() => setId(x.id)} aria-pressed={open} className="h-auto w-full min-w-0 justify-start gap-3 rounded-2xl px-2 py-2 text-left text-[var(--foreground)]">
                    <span className="grid w-12 shrink-0 place-items-center">
                      <CleanerArt c={x} px={x.kind === 'stick' ? 52 : 52} />
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
                      <QuickActions c={x} act={act(x.id)} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
  const railC = (
    <div className="sticky top-4 flex flex-col gap-4 self-start">
      {label('Home base')}
      <div className="flex items-end justify-around gap-2 rounded-[28px] bg-[var(--surface)] px-3 pb-3 pt-5">
        {fleet.map((x) => {
          const open = x.id === c.id;
          const hx = toneHue(statusWords(x).tone);
          return (
            <Button key={x.id} variant="ghost" onPress={() => setId(x.id)} aria-pressed={open} aria-label={`${x.name}: ${statusWords(x).word}`} className={cn('h-auto min-w-0 flex-col items-center gap-2 rounded-2xl px-1.5 pb-1.5 pt-2 text-[var(--foreground)] transition-opacity', !open && 'opacity-60')}>
              <span className="relative flex items-end">
                <span aria-hidden className="absolute inset-x-0 -bottom-1 h-3 rounded-[50%] blur-md" style={{ background: `color-mix(in srgb, ${hx} ${open ? 55 : 25}%, transparent)` }} />
                <HomeArt c={x} px={fleet.length > 2 ? 72 : 92} />
              </span>
              <span className="size-2 rounded-full" style={{ background: hx }} />
            </Button>
          );
        })}
      </div>
      <div>
        {nameButton('text-[26px] leading-tight')}
        <div className="mt-2">
          <FactRow c={c} now={now} />
        </div>
      </div>
      <StatusCard c={c} compact />
      <QuickActions c={c} act={act(c.id)} />
      {chips(false)}
    </div>
  );
  const rail = picks.rail === 'B' ? railB : picks.rail === 'C' ? railC : railA;

  // ---- Phone header and dock ----
  const compactHeader = (
    <div className="flex items-center gap-3">
      <div className="grid h-16 w-14 shrink-0 place-items-center">
        <CleanerArt c={c} px={c.kind === 'stick' ? 62 : 64} />
      </div>
      <div className="min-w-0 flex-1">
        {nameButton('text-[22px]')}
        <p className="truncate text-[14px] font-semibold" style={{ color: hue }}>
          {s.word}
        </p>
        {s.detail ? <p className="truncate text-[12px] opacity-60">{s.detail}</p> : null}
      </div>
    </div>
  );
  const phoneHeader =
    picks.phone === 'A' ? (
      <div className="flex flex-col gap-4">
        <CleanerStage c={c} px={c.kind === 'stick' ? 130 : 110} />
        <div>
          {nameButton('text-[28px]')}
          <div className="mt-2">
            <FactRow c={c} now={now} />
          </div>
        </div>
        <StatusCard c={c} />
      </div>
    ) : (
      compactHeader
    );
  const dock =
    picks.phone === 'C' ? (
      <div className="sticky bottom-0 z-10 -mx-5 mt-4 flex items-center gap-2 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-5 py-3 backdrop-blur-md">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: hue }} />
        <p className="min-w-0 flex-1 truncate text-[14px] font-semibold">{s.word}</p>
        <DockButtons c={c} act={act(c.id)} />
      </div>
    ) : null;

  // ---- Content: the views ----
  const kindTabs = (
    <ToggleButtonGroup
      aria-label="Kind"
      size="sm"
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={new Set([c.kind])}
      onSelectionChange={(k) => {
        const hit = fleet.find((x) => x.kind === [...k][0]);
        if (hit) setId(hit.id);
      }}
    >
      <ToggleButton id="robot" isDisabled={!fleet.some((x) => x.kind === 'robot')} className="text-[13px]">
        Robot vacuums
      </ToggleButton>
      <ToggleButton id="stick" isDisabled={!fleet.some((x) => x.kind === 'stick')} className="text-[13px]">
        Stick vacuums
      </ToggleButton>
    </ToggleButtonGroup>
  );
  const viewSwitch =
    picks.sections === 'A' ? (
      kindTabs
    ) : picks.sections === 'B' ? (
      <ToggleButtonGroup aria-label="View" size="sm" selectionMode="single" disallowEmptySelection selectedKeys={new Set([view])} onSelectionChange={(k) => setView([...k][0] === 'now' ? 'now' : 'all')}>
        <ToggleButton id="all" className="text-[13px]">
          All
        </ToggleButton>
        <ToggleButton id="now" className="text-[13px]">
          Now · {nowTiles.length}
        </ToggleButton>
      </ToggleButtonGroup>
    ) : (
      <span />
    );
  const grid = (body: ReactNode) => <div className={cn('grid auto-rows-[68px] gap-3 [grid-auto-flow:dense]', phone ? 'grid-cols-2' : 'grid-cols-4')}>{body}</div>;
  const content = showNow ? (
    <div className="flex flex-col gap-6">
      <p className={cn('font-semibold tracking-[-0.02em]', phone ? 'text-[20px]' : 'text-[24px]')}>
        <span style={{ color: hue }}>{s.word}.</span> <span className="font-normal opacity-60">{s.detail}</span>
      </p>
      {nowTiles.length ? grid(drawn(nowTiles)) : <p className="text-[15px] opacity-60">Nothing running, nothing to do.</p>}
      <div>
        {label('Everything else')}
        {sections.map((x) => (
          <p key={x.id} className="flex items-baseline gap-2.5 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] py-3 text-[15px]">
            <span className="font-semibold">{x.title}</span>
            <span className="opacity-60">{x.summary}</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="ml-auto opacity-40" />
          </p>
        ))}
      </div>
    </div>
  ) : (
    ordered.map((x) => (
      <section key={x.id} aria-label={x.title} className="flex flex-col gap-3">
        <h3 className="flex items-baseline gap-2.5">
          <span className="shrink-0 whitespace-nowrap text-[19px] font-semibold">{x.title}</span>
          <span className="min-w-0 truncate text-[15px] opacity-60">{x.summary}</span>
          {picks.sections === 'C' && why[x.id] ? (
            <span className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }}>
              First: {why[x.id]!.why}
            </span>
          ) : null}
        </h3>
        {grid(drawn(x.tiles))}
      </section>
    ))
  );
  const topBar = (
    <div className="flex items-center justify-between gap-2">
      {viewSwitch}
      <div className="flex shrink-0 items-center gap-3 opacity-80">
        <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
        <HugeiconsIcon icon={Notification03Icon} size={18} />
      </div>
    </div>
  );

  return (
    <section className="pro-surface flex flex-col gap-4 p-5">
      <div className="grid gap-3 lg:grid-cols-3">
        {PAGE_PARTS.map((p) => {
          const x = p.concepts.find((k) => k.id === picks[p.id])!;
          return (
            <article key={p.id} className="flex flex-col gap-2 rounded-2xl bg-default/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{p.title}</h3>
                <span className="text-[11px] text-muted">{p.chosen ? `Chosen: ${p.chosen}` : `Recommended: ${p.recommended}`}</span>
              </div>
              <Pick label={p.job} value={picks[p.id]} options={p.concepts.map((k) => ({ id: k.id, text: `${k.id} · ${k.name}` }))} onChange={(k) => setPick(p.id, k)} />
              <p className="text-xs">{x.idea}</p>
              <p className="text-[11px] text-muted">
                + {x.strengths.join('; ')} · − {x.tradeoffs.join('; ')}
              </p>
            </article>
          );
        })}
      </div>
      <p className="text-xs text-muted">{PAGE_PARTS.map((p) => `${p.title}: ${p.why}`).join(' ')}</p>
      <div className="flex flex-wrap items-end gap-4">
        <Pick
          label="Moment"
          value={moment}
          options={[...(live.length ? [{ id: 'live', text: 'Yours' }] : []), ...MOMENTS.map((m) => ({ id: m.id, text: m.label }))]}
          onChange={(m) => {
            const f = sorted(fleetOf(m, live));
            setMoment(m);
            setFleet(f);
            setId(f[0].id);
          }}
        />
        <Pick label="Screen" value={screen} options={[{ id: 'desktop' as Screen, text: 'Desktop' }, { id: 'phone' as Screen, text: 'Phone 375 px' }]} onChange={setScreen} />
        <Pick label="Theme" value={dark ? 'dark' : 'light'} options={[{ id: 'light', text: 'Light' }, { id: 'dark', text: 'Dark' }]} onChange={(t) => setDark(t === 'dark')} />
        <Button size="sm" variant="secondary" onPress={copy} className="gap-1.5">
          <HugeiconsIcon icon={Copy01Icon} size={14} />
          {copied ? 'Copied' : 'Copy selection'}
        </Button>
      </div>

      <div className={cn('overflow-x-auto', dark && 'dark')}>
        <div className="pro rounded-2xl bg-[var(--background)] text-foreground" data-page="vacuums" style={phone ? { width: 375 } : { width: 1240 }}>
          {phone ? (
            // A phone screen: scrolls inside, so the sticky chips and the dock behave as on a phone.
            <div className="h-[760px] overflow-y-auto px-5 pt-5">
              <div className="flex flex-col gap-4">
                {phoneHeader}
                {chips(true)}
                {topBar}
                <div className="flex flex-col gap-7 pb-5">{content}</div>
              </div>
              {dock}
            </div>
          ) : (
            <div className="grid grid-cols-[300px_minmax(0,1fr)] gap-8 p-5">
              {rail}
              <div className="flex min-w-0 flex-col gap-7">
                {topBar}
                {content}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
