/**
 * Energy Studio, restarted 2026-11-26 (docs/pro-ui/ENERGY.md §0). Dev only: /?studio=energy.
 * Same approach as the Security Studio: round 1 compares three whole-page directions on the same
 * sample home; later rounds refine the chosen one section by section. The owner's frame: live
 * power first; everything else (usage, solar and battery, devices and costs, gas, water, impact,
 * and related integrations such as Electricity Maps and the sun) secondary. Previews use sample
 * data only (`studioEnergyHome.ts`), never Home Assistant. The production page (`ProEnergy.tsx`)
 * is untouched until a direction is approved.
 */
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Button, Chip, TextArea, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, Moon02Icon, PaintBoardIcon, Sun01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { StudioNavBar } from '../../../studio/StudioNavBar';
import { STUDIO_ENERGY_STATES, studioEnergyHome, type StudioEnergyId } from './studioEnergyHome';
import type { DesignProps } from './designs/parts';
import DesignA from './designs/DesignA';
import DesignB from './designs/DesignB';
import DesignC, { CardsGrid, DayTimeline, LiveNumbers } from './designs/DesignC';
import { NowNumbers, NowRing, NowTiles } from './designs/nowConcepts';
import { TodayLanes, TodayNext, TodayShaded } from './designs/todayConcepts';
import { CardsBento, CardsColumns, CardsTiles } from './designs/cardsConcepts';
import { SKIN_CHART, SKIN_HEADLINE, SKIN_SENTENCE } from './designs/cardContents';
import { BlockSkin } from './designs/parts';
import { EnergyLoading, EnergyNotSetUp, EnergyUnreachable } from '../EnergyStates';

interface Design {
  id: string;
  name: string;
  idea: string;
  strengths: string;
  tradeoffs: string;
  Page: ComponentType<DesignProps>;
  /** Round 5: how each card's content is drawn. */
  skin?: Parameters<typeof BlockSkin.Provider>[0]['value'];
}

const DESIGNS: Design[] = [
  {
    id: 'A',
    name: 'Flow',
    idea: 'Right now is a small live diagram: solar on top, grid and battery either side, the home in the middle, a moving beam on every line that carries power. The answer and today’s totals sit beside it. Then the usage chart with Today · Week · Month · Year, then every section as a card in a grid (one column on phones).',
    strengths: 'Where power goes is visible at a glance; everything is on one scroll with nothing hidden.',
    tradeoffs: 'The longest page on phones; a flow diagram is what most energy dashboards show.',
    Page: DesignA
  },
  {
    id: 'B',
    name: 'Ambient',
    idea: 'Built like the Security page you approved: a soft hero lit by where the power comes from now (sun, battery, grid, or violet when exporting), the answer in a few words, one “power river” bar splitting the home’s draw by source, and a line of facts (sunset, price, grid carbon, sun still expected). Then the usage chart, then the other sections in tabs, the same on phone and desktop.',
    strengths: 'One family with Security; the shortest page; one clear answer, then detail on demand.',
    tradeoffs: 'Sections sit one tap away in tabs; less to see at once on desktop.',
    Page: DesignB
  },
  {
    id: 'C',
    name: 'Day timeline',
    idea: 'Organised around today. Live power is four plain numbers in one row, not a card. Under them one large chart of the whole day, with the sun’s hours, the price and the grid’s carbon as strips on the same time axis, so now and what’s next (forecast, cheaper and cleaner hours) read together. The rest is a bento grid; week, month and year sit in a History card.',
    strengths: 'Price, carbon and sun line up with usage: the best view for deciding when to run things.',
    tradeoffs: 'The strips are new to learn; the live numbers carry no diagram.',
    Page: function DesignCRoundOne(p: DesignProps) {
      return <DesignC {...p} Now={LiveNumbers} Today={DayTimeline} Cards={CardsGrid} skin={null} />;
    }
  }
];

/** Round 2: "Right now" inside C (owner picked C · Day timeline on 2026-11-26). */
const NOWS: Design[] = [
  {
    id: '1',
    name: 'Answer + numbers',
    idea: 'The one clear answer on top (“Drawing 5.5 kW from the grid”), a dot in the main source’s colour. Under it round 1’s four numbers, a little smaller, split by hairlines, each saying what it is doing: making, using, buying or selling, charging or giving. Your change: a small line of today so far beside each value.',
    strengths: 'Closest to what you picked; calm, no card, numbers you can read across the room.',
    tradeoffs: 'Shows the totals, not how they connect.',
    Page: NowNumbers
  },
  {
    id: '2',
    name: 'Mix ring',
    idea: 'The answer beside a ring around the home’s draw, split by where it comes from (sun, battery, grid). Next to the ring, two short lists: what is powering the home (kW and %) and what is going out (into the battery, sent to the grid).',
    strengths: 'Shows the split and the flows without a diagram; reads in one look.',
    tradeoffs: 'A card on top again; the battery charge level is not shown.',
    Page: NowRing
  },
  {
    id: '3',
    name: 'Live tiles',
    idea: 'The answer as a line, then one small tile per source (Solar, Home, Grid, Battery): what it is doing, the value, and a sparkline of today so far ending in a dot at now. Two by two on phones.',
    strengths: 'Each number has its context (rising, falling, peaked); tiles match the Rooms pages.',
    tradeoffs: 'Tallest on phones; sparklines repeat a little of the Today chart below.',
    Page: NowTiles
  }
];

/** Round 3: the Today timeline inside C, under the chosen Right now. */
const TODAYS: Design[] = [
  {
    id: 'A',
    name: 'Chart + lanes',
    idea: 'Your pick, with B’s night shading added: night shaded on the chart with sunrise and sunset marked. Round 1’s chart with its sun, price and carbon strips, now placed exactly on the chart’s hours (icons in the chart’s left margin) and a Now line through the chart and every strip. Under it the next things worth knowing, as small icon facts: sun still to come, the cheapest two hours, the cleanest hour. Then today’s totals.',
    strengths: 'Everything on one time axis; closest to what you picked.',
    tradeoffs: 'Three strips to read; the tallest card.',
    Page: TodayLanes
  },
  {
    id: 'B',
    name: 'Shaded day',
    idea: 'Night is shaded on the chart itself, with sunrise and sunset marked on it, so the sun needs no strip. One strip under the chart shows price or carbon (a Price · Carbon switch in the header). The Now line, the next facts and the totals as in A.',
    strengths: 'One strip instead of three; day and night read without a legend.',
    tradeoffs: 'Price and carbon are not visible together.',
    Page: TodayShaded
  },
  {
    id: 'C',
    name: 'What’s next',
    idea: 'The chart shows today so far only. Beside it (under it on phones), “Rest of today” in words: more sun until sunset (or sunrise and tomorrow’s forecast at night), the cheapest two hours, the cleanest hour, how long the battery lasts or when it is full, and the remaining hours’ prices as larger cells.',
    strengths: 'Says what to do next in plain words; the fastest to read.',
    tradeoffs: 'The past and the future are in two places; less of a timeline.',
    Page: TodayNext
  }
];

/** Round 4: the cards under Today, on tablets and desktop (phones keep the tabs). */
const CARDS: Design[] = [
  {
    id: 'A',
    name: 'Bento',
    idea: 'A 12-column grid with fixed places: Solar, Battery and a tall Devices card on top; Costs and Gas & water under the first two; History wide with Impact beside it. Cards in a row share one height, so the edges line up.',
    strengths: 'Everything visible at once, tidy edges, the most dashboard-like.',
    tradeoffs: 'Fixed places leave gaps when a home has no solar or battery; long on tablets.',
    Page: CardsBento
  },
  {
    id: 'B',
    name: 'Two columns',
    idea: 'Grouped by meaning, like the Security page’s headings: “Made and stored” (Solar, Battery, Impact) on one side, “Used and paid” (Devices, Costs, Gas & water) on the other, each with one line of summary. History runs across the bottom.',
    strengths: 'Easy to find things; the headings explain the page; works with any mix of sections.',
    tradeoffs: 'Columns can end at different heights.',
    Page: CardsColumns
  },
  {
    id: 'C',
    name: 'Tiles + detail',
    idea: 'One row of small tiles, each with its headline: solar made, battery charge, the biggest device, today’s cost, gas, impact, this month’s use. Choosing a tile opens its full card under the row, one at a time.',
    strengths: 'The shortest page; every headline in one line; the same idea as the phone tabs.',
    tradeoffs: 'Only one card’s detail at a time; one more tap to see a chart.',
    Page: CardsTiles
  }
];

/** The settled cards (Bento; Tiles + detail on phones), wearing a round-5 skin. */
const cardsOnly = (skin: Design['skin']) =>
  function SkinnedCards(p: DesignProps) {
    return <BlockSkin.Provider value={skin ?? {}}>{p.width < 640 ? <CardsTiles {...p} /> : <CardsBento {...p} />}</BlockSkin.Provider>;
  };

/** Round 5: what goes inside the cards. Every card's content is described once; three styles draw it. */
const CONTENTS: Design[] = [
  {
    id: '1',
    name: 'Headline',
    idea: 'Like the Overview widgets: one big number and its label (made today, battery %, the biggest device, today’s cost…), two or three small numbers under it, and a short chart at the bottom of the card.',
    strengths: 'Readable from across the room; every card has the same shape; matches the Overview widgets.',
    tradeoffs: 'Charts are small; the big number repeats a little of what the tiles and totals say.',
    Page: () => null,
    skin: SKIN_HEADLINE
  },
  {
    id: '2',
    name: 'Chart first',
    idea: 'The chart leads, tall (solar vs forecast, battery charge, the devices list, cost by hour, the last 7 days). The numbers follow as one quiet row under a hairline, the headline first.',
    strengths: 'The most information per card; best on large screens.',
    tradeoffs: 'Busier; on phones each card is tall.',
    Page: () => null,
    skin: SKIN_CHART
  },
  {
    id: '3',
    name: 'Sentence',
    idea: 'Each card says what matters in plain words first (“31.3 kWh so far, 59% of today’s forecast. About 20.6 kWh more before sunset.”), then a small chart, then the numbers as hairline rows, label left and value right.',
    strengths: 'The most human and least generic; matches the page’s answer at the top.',
    tradeoffs: 'More to read; the numbers are less prominent.',
    Page: () => null,
    skin: SKIN_SENTENCE
  }
].map((d) => ({ ...d, Page: cardsOnly(d.skin) }));

/** Round 6: the settled page with its edge states. */
const FULL: Design[] = [
  {
    id: 'C',
    name: 'The settled page',
    idea: 'Everything you picked, together: Right now (Answer + numbers with sparklines), Today (Chart + lanes, night shaded), the cards (Bento with Headline contents; on phones, Tiles + detail with Chart first). New in this round: loading, Energy not set up in Home Assistant, and Home Assistant unreachable (Page state). Homes with part of Energy set up just leave those parts out: try “Grid only”.',
    strengths: 'The whole page as it would ship.',
    tradeoffs: 'History still reads the sample data; on the live page it comes from the statistics server.',
    Page: DesignC
  }
];

type PageState = 'live' | 'loading' | 'empty' | 'error';
type Round = 'r6' | 'r5' | 'r4' | 'r3' | 'r2' | 'r1';
type Show = 'page' | 'alone';
const pickKey = (r: Round) => `had.pro.energyStudio.round${r.slice(1)}`;

const WIDTHS = [
  { id: '375', label: 'Phone 375', content: 343 },
  { id: '768', label: 'Tablet 768', content: 640 },
  { id: '1440', label: 'Desktop 1440', content: 1140 },
  { id: '1920', label: 'Large 1920', content: 1620 }
] as const;
type WidthId = (typeof WIDTHS)[number]['id'];
type Theme = 'light' | 'dark' | 'both';
type View = string;

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

/** A themed stage wearing the Energy accent. */
function Stage({ dark, children }: { dark: boolean; children: ReactNode }) {
  return (
    <div className={cn(dark && 'dark')}>
      <div className="pro overflow-x-auto rounded-2xl bg-[var(--background)] p-4 text-foreground" data-page="energy">
        {children}
      </div>
    </div>
  );
}

function Brief({ round }: { round: Round }) {
  return (
    <section aria-label="Brief" className="pro-surface grid gap-4 p-5 text-sm md:grid-cols-3">
      <div>
        <h2 className="mb-1 text-base font-semibold">The job</h2>
        <p className="text-muted">Answer one question in a second: where is my power coming from and going right now? Then how today is going, what it costs, and what is worth doing next (a cheaper or cleaner hour, sun still to come).</p>
      </div>
      <div>
        <h2 className="mb-1 text-base font-semibold">Frame (you, 2026-11-26)</h2>
        <p className="text-muted">Live power first, on phone and desktop. Everything stays in scope: usage over time, solar and battery, devices and costs, gas, water, lifetime impact, plus related integrations (Electricity Maps, Sun, solar forecast, prices). Not generic, consistent with the rest of HAD Pro, and a better layout.</p>
      </div>
      <div>
        <h2 className="mb-1 text-base font-semibold">{round === 'r6' ? 'Round 6: the full page' : round === 'r5' ? 'Round 5 (decided: Headline, Chart first on phones)' : round === 'r4' ? 'Round 4 (decided: Bento, Tiles + detail on phones)' : round === 'r1' ? 'Round 1 (decided: C · Day timeline)' : round === 'r2' ? 'Round 2 (decided: 1 · Answer + numbers)' : 'Round 3 (decided: A · Chart + lanes, shaded)'}</h2>
        <p className="text-muted">
          {round === 'r6'
            ? 'Every section is settled. This is the whole page, plus its loading, not set up and HA unreachable states (Page state). Try every home state at Phone 375, Tablet 768 and Desktop 1440, in light and dark. Approve to build it on live Home Assistant data.'
            : round === 'r5'
            ? 'Three styles for what goes inside each card, drawn from the same content. You picked 1 · Headline for tablets and desktop and 2 · Chart first for phones on 2026-11-26; the C page now uses them. Next: loading, not configured and HA unreachable, then the live build.'
            : round === 'r4'
            ? 'Three ways to lay out the cards under Today. You picked A · Bento for tablets and desktop and C · Tiles + detail for phones (it replaces the tabs; the tiles scroll sideways) on 2026-11-26. In the C page, Phone 375 now shows the tiles whichever card layout is shown.'
            : round === 'r3'
            ? 'Three ways to read today so far and what is next. You picked A · Chart + lanes on 2026-11-26, with B’s night shading on the chart; it is now the C page’s Today.'
            : round === 'r1'
            ? 'Three whole-page directions. You picked C · Day timeline on 2026-11-26, with tabs after Today on phones.'
            : 'Inside C, three ways to show live power with the one clear answer. You picked 1 · Answer + numbers on 2026-11-26, with a small line of today beside each number; it is now the C page’s Right now.'}
        </p>
      </div>
    </section>
  );
}

function readPick(r: Round): { design: string | null; notes: string } {
  try {
    const v = JSON.parse(localStorage.getItem(pickKey(r)) ?? 'null') as { design?: string; notes?: string } | null;
    return { design: v?.design ?? null, notes: v?.notes ?? '' };
  } catch {
    return { design: null, notes: '' };
  }
}

export default function EnergyStudio() {
  const [round, setRound] = useState<Round>('r6');
  const [pageState, setPageState] = useState<PageState>('live');
  const [show, setShow] = useState<Show>('page');
  const [view, setView] = useState<View>('compare');
  const [stateId, setStateId] = useState<StudioEnergyId>('sunny');
  const [theme, setTheme] = useState<Theme>('light');
  const [widthId, setWidthId] = useState<WidthId>('1440');
  const home = useMemo(() => studioEnergyHome(stateId), [stateId]);
  const [pick, setPickState] = useState(() => readPick('r6'));
  const [copied, setCopied] = useState(false);

  // The chrome stays light; each preview owns its theme.
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  const width = WIDTHS.find((w) => w.id === widthId)?.content ?? 1140;
  const themes = theme === 'both' ? [false, true] : [theme === 'dark'];
  const list = round === 'r1' ? DESIGNS : round === 'r2' ? NOWS : round === 'r3' ? TODAYS : round === 'r4' ? CARDS : round === 'r5' ? CONTENTS : FULL;
  const shown = view === 'compare' ? list : list.filter((d) => d.id === view);
  const label = (d: Pick<Design, 'id'>) => (round === 'r1' ? `Design ${d.id}` : round === 'r2' ? `Right now ${d.id}` : round === 'r3' ? `Today ${d.id}` : round === 'r4' ? `Cards ${d.id}` : round === 'r5' ? `Contents ${d.id}` : 'Energy page');
  const sideBySide = view === 'compare' && width < 700;

  const setPick = (next: { design: string | null; notes: string }) => {
    setPickState(next);
    setCopied(false);
    try {
      localStorage.setItem(pickKey(round), JSON.stringify(next));
    } catch {
      /* storage blocked: the pick lasts this visit */
    }
  };
  const copy = async () => {
    const d = list.find((x) => x.id === pick.design);
    try {
      await navigator.clipboard.writeText(`Energy studio ${round === 'r1' ? 'round 1' : round === 'r2' ? 'round 2 (right now)' : round === 'r3' ? 'round 3 (today timeline)' : round === 'r4' ? 'round 4 (cards)' : round === 'r5' ? 'round 5 (card contents)' : 'round 6 (full page)'}: ${d ? `${label(d)} (${d.name})` : 'no pick'}.${pick.notes.trim() ? ` Notes: ${pick.notes.trim()}` : ''}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="pro h-dvh overflow-y-auto overscroll-contain bg-[var(--background)] text-foreground" data-page="energy">
      <main className="mx-auto flex max-w-[1800px] flex-col gap-6 px-4 py-6">
        <StudioNavBar current="energy" />
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold">Energy Studio</h1>
            <p className="mt-1 text-sm text-muted">Restarted from zero: whole-page directions first, then section by section. Everything runs on sample data only, never Home Assistant.</p>
          </div>
          <Chip size="md" variant="soft" color={round === 'r6' ? 'warning' : 'success'}>
            <Chip.Label>{round === 'r1' ? 'Round 1 decided · C · Day timeline' : round === 'r2' ? 'Round 2 decided · 1 · Answer + numbers' : round === 'r3' ? 'Round 3 decided · A · Chart + lanes' : round === 'r4' ? 'Round 4 decided · Bento + Tiles' : round === 'r5' ? 'Round 5 decided · Headline + Chart' : 'Round 6 · full page'}</Chip.Label>
          </Chip>
        </header>

        <Brief round={round} />

        <div className="pro-surface flex flex-wrap gap-4 p-4">
          <Segmented
            label="Round"
            value={round}
            onChange={(r) => {
              setRound(r);
              setView('compare');
              setPickState(readPick(r));
            }}
            options={[
              { id: 'r6', text: '6 · Full page + edge states' },
              { id: 'r5', text: '5 · Card contents (Headline + Chart chosen)' },
              { id: 'r4', text: '4 · Cards (Bento + Tiles chosen)' },
              { id: 'r3', text: '3 · Today (Chart + lanes chosen)' },
              { id: 'r2', text: '2 · Right now (Answer + numbers chosen)' },
              { id: 'r1', text: '1 · Page direction (C chosen)' }
            ]}
          />
          <Segmented label={round === 'r1' ? 'Design' : round === 'r2' ? 'Right now' : round === 'r3' ? 'Today' : round === 'r4' ? 'Cards' : round === 'r5' ? 'Contents' : 'Page'} value={view} onChange={setView} options={[{ id: 'compare', text: 'Compare all' }, ...list.map((d) => ({ id: d.id, text: `${d.id} · ${d.name}` }))]} />
          {round === 'r6' ? (
            <Segmented
              label="Page state"
              value={pageState}
              onChange={setPageState}
              options={[
                { id: 'live', text: 'Live' },
                { id: 'loading', text: 'Loading' },
                { id: 'empty', text: 'Not set up' },
                { id: 'error', text: 'HA unreachable' }
              ]}
            />
          ) : null}
          {round !== 'r1' && round !== 'r6' ? (
            <Segmented
              label="Show"
              value={show}
              onChange={setShow}
              options={[
                { id: 'page', text: 'In the C page' },
                { id: 'alone', text: round === 'r2' ? 'Right now only' : round === 'r3' ? 'Today only' : 'Cards only' }
              ]}
            />
          ) : null}
          <Segmented label="Home state" value={stateId} onChange={setStateId} options={STUDIO_ENERGY_STATES.map((s) => ({ id: s.id, text: s.label }))} />
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
          <Segmented label="Screen (page content width)" value={widthId} onChange={setWidthId} options={WIDTHS.map((w) => ({ id: w.id, text: w.label }))} />
        </div>

        <div className={cn('flex min-w-0 flex-col gap-6', sideBySide && 'grid grid-cols-[repeat(3,max-content)] items-start overflow-x-auto')}>
          {shown.map((d) => (
            <section key={d.id} aria-labelledby={`design-${d.id}`} className={cn('flex min-w-0 flex-col gap-4 rounded-2xl p-4', pick.design === d.id ? 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]' : 'pro-surface')} style={sideBySide ? { width: width + 64 } : undefined}>
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 max-w-3xl">
                  <h2 id={`design-${d.id}`} className="text-lg font-semibold">
                    {label(d)} · {d.name}
                  </h2>
                  <p className="mt-1 text-sm">{d.idea}</p>
                  <p className="mt-1 text-xs text-muted">
                    + {d.strengths} − {d.tradeoffs}
                  </p>
                </div>
                <Button size="sm" variant={pick.design === d.id ? 'primary' : 'secondary'} onPress={() => setPick({ ...pick, design: pick.design === d.id ? null : d.id })}>
                  {pick.design === d.id ? (round === 'r6' ? 'Approved' : 'Picked') : round === 'r6' ? 'Approve' : `Pick ${d.id}`}
                </Button>
              </header>
              {themes.map((dark) => (
                <Stage key={String(dark)} dark={dark}>
                  <div style={{ width }}>
                    {round === 'r6' ? (
                      pageState === 'loading' ? <EnergyLoading width={width} /> : pageState === 'empty' ? <EnergyNotSetUp haUrl="http://homeassistant.local:8123" /> : pageState === 'error' ? <EnergyUnreachable lastSeen={home.now - 6 * 60_000}><DesignC key={stateId} home={home} width={width} /></EnergyUnreachable> : <DesignC key={stateId} home={home} width={width} />
                    ) : round === 'r5' && show === 'page' ? <DesignC key={stateId} home={home} width={width} skin={d.skin} /> : round === 'r4' && show === 'page' ? <DesignC key={stateId} home={home} width={width} Cards={d.Page} /> : round === 'r3' && show === 'page' ? <DesignC key={stateId} home={home} width={width} Today={d.Page} /> : round === 'r2' && show === 'page' ? <DesignC key={stateId} home={home} width={width} Now={d.Page} /> : <d.Page key={stateId} home={home} width={width} />}
                  </div>
                </Stage>
              ))}
            </section>
          ))}
        </div>

        <section aria-label="Your pick" className="pro-surface flex flex-col gap-3 p-4">
          <h2 className="text-base font-semibold">Your pick</h2>
          <p className="text-sm text-muted">{pick.design ? `${label({ id: pick.design })} picked in this browser. Copy it for the chat.` : 'Pick one above, or note a mix.'}</p>
          <TextArea aria-label="Notes" placeholder="Notes (what to keep, mix or change)" value={pick.notes} onChange={(e) => setPick({ ...pick, notes: e.target.value })} className="min-h-20" />
          <Button size="sm" variant="secondary" isDisabled={!pick.design && !pick.notes.trim()} onPress={copy} className="gap-1.5 self-start">
            <HugeiconsIcon icon={Copy01Icon} size={14} />
            {copied ? 'Copied' : 'Copy for the chat'}
          </Button>
        </section>
      </main>
    </div>
  );
}
