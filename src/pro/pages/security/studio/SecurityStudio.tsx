/**
 * Security Studio, restarted 2026-11-26 (docs/pro-ui/SECURITY.md). Dev only: /?studio=security.
 * Round 1 compared three whole-page directions (B · Ambient chosen); round 2 compares three
 * heroes inside B (`heroes/`). The owner's frame: the
 * one clear answer first, cameras right below, everything else secondary. Previews are live on
 * sample data only (`applySecurityAction`), never Home Assistant. The production page
 * (`ProSecurity.tsx`) is untouched until a direction is approved.
 */
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Button, Chip, TextArea, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, Moon02Icon, PaintBoardIcon, Sun01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { StudioNavBar } from '../../../studio/StudioNavBar';
import { applySecurityAction, STUDIO_STATES, studioHome, type SecurityAction, type StudioHome, type StudioStateId } from './studioSecurity';
import type { DesignProps } from './designs/parts';
import DesignA from './designs/DesignA';
import DesignB from './designs/DesignB';
import DesignC from './designs/DesignC';
import HeroModeBar from './heroes/HeroModeBar';
import HeroOrb from './heroes/HeroOrb';
import HeroSlide from './heroes/HeroSlide';
import { FixPills } from './heroes/heroKit';
import { NeedsList, NeedsStrip, NeedsSummary, type NeedsProps } from './heroes/needsStyles';
import { CamerasMotion, CamerasStage, CamerasWall, type CamerasProps } from './cameras/CameraConcepts';
import { SettledHero } from './designs/DesignB';
import { DevicesByArea, DevicesByType, DevicesTabs } from './devices/DeviceConcepts';
import { SecurityEmpty, SecurityError, SecurityLoading } from '../SecurityStates';

type DesignId = string;
interface Design {
  id: DesignId;
  name: string;
  idea: string;
  strengths: string;
  tradeoffs: string;
  Page: ComponentType<DesignProps>;
  /** Round 4: the cameras concept, shown inside the B page. */
  Cameras?: ComponentType<CamerasProps>;
  /** Round 5: devices and Today, shown inside the B page. */
  Devices?: ComponentType<DesignProps>;
}

const DESIGNS: Design[] = [
  {
    id: 'A',
    name: 'Quiet column',
    idea: 'The answer is plain type on the page, not a card: a tone dot, a few words, one line, the four modes. Fixes appear under it only when something is wrong. Cameras as a calm grid with the name under each view. Then devices as quiet rows by kind, and today’s activity beside them on wide screens.',
    strengths: 'Calmest and least busy; the answer reads like a sentence; nothing competes with the cameras.',
    tradeoffs: 'Least visual; devices are rows, not tiles, so it looks less like the Rooms pages.',
    Page: DesignA
  },
  {
    id: 'B',
    name: 'Ambient',
    idea: 'The answer is a soft hero lit by the state’s colour, with a large shield, the words, the modes and each fix as a pill. Cameras are Area camera tiles: one featured, tap another to feature it. Devices are the Area tiles you already chose (Lock · Status, Door · Day, Motion · Ticks, Leak · Device), with Today in a side column on wide screens.',
    strengths: 'One family with the Rooms and Area pages; the most expressive answer; tiles keep their own controls.',
    tradeoffs: 'Longest page on phones; the hero takes the most space.',
    Page: function DesignBRoundOne(p: DesignProps) {
      return <DesignB {...p} roundOneHero />;
    }
  },
  {
    id: 'C',
    name: 'Perimeter line',
    idea: 'The answer is one line of words beside a "perimeter": one short bar per device and camera, grouped by kind and coloured by state, so one wrong bar stands out. Cameras as an even wall. Everything else lives in three tabs under the cameras: Needs you, Devices, Activity.',
    strengths: 'The shortest page; the whole house at a glance; the same layout on phone and desktop.',
    tradeoffs: 'The bars are a new idea to learn; details sit one tap away in tabs.',
    Page: DesignC
  }
];

type Round = 'r6' | 'r5' | 'r4' | 'r3' | 'r2' | 'r1';
type PageState = 'live' | 'loading' | 'empty' | 'error';
type HeroShow = 'hero' | 'page';

const HEROES: Design[] = [
  {
    id: '1',
    name: 'Mode bar',
    idea: 'Round 1’s hero, refined: shield, words and the four modes in one bar. Home is a tap; Away, Night and turning an armed alarm off are press-and-hold (the segment fills). The code sheet follows when HA asks for one.',
    strengths: 'Every mode visible and one gesture away; closest to what you picked.',
    tradeoffs: 'Hold on some segments and tap on others must be learned.',
    Page: HeroModeBar
  },
  {
    id: '2',
    name: 'Orb',
    idea: 'The shield becomes one big glowing button in the state’s colour. It offers the obvious next step (off when armed, Away when nobody is home, else Home): hold it, a ring fills, done. Chips under it pick another mode for the orb.',
    strengths: 'The most expressive and the most forgiving: one big target, one gesture for everything.',
    tradeoffs: 'Two steps for a non-suggested mode (pick, then hold); the tallest hero on phones.',
    Page: HeroOrb
  },
  {
    id: '3',
    name: 'Slide',
    idea: 'Shield and words on top; under them a wide track, "Slide to arm Away" (or "turn off"), like the Door locks widget’s slide to unlock. Chips choose what the slide does; Home arms with a tap.',
    strengths: 'Impossible to trigger by accident; matches the locks widget.',
    tradeoffs: 'Sliding is slower than holding; needs width.',
    Page: function SlideWithPills(p: DesignProps) {
      return <HeroSlide {...p} Needs={FixPills} />;
    }
  }
];

const withNeeds = (Needs: ComponentType<NeedsProps>) =>
  function SlideWithNeeds(p: DesignProps) {
    return <HeroSlide {...p} Needs={Needs} />;
  };

const NEEDS: Design[] = [
  {
    id: 'A',
    name: 'Quiet list',
    idea: 'Hairline rows with a small dot, the words and a text action (Lock). Three at most, then “2 more”. Lock all sits at the end when two or more doors are unlocked.',
    strengths: 'Still says exactly what is wrong; light, no backgrounds.',
    tradeoffs: 'Grows by up to three rows.',
    Page: withNeeds(NeedsList)
  },
  {
    id: 'B',
    name: 'Summary line',
    idea: 'One line of counts with icons (“2 unlocked · 2 open”) and one main fix (Lock all, or the single fix). Tap the line to see the list.',
    strengths: 'Always one line, whatever happens; the slimmest when many things are wrong.',
    tradeoffs: 'Names are one tap away.',
    Page: withNeeds(NeedsSummary)
  },
  {
    id: 'C',
    name: 'Slim strip',
    idea: 'One line of small icon chips that scrolls sideways (“Back Door unlocked · Lock”); tapping a chip with a fix applies it.',
    strengths: 'One line with every name visible by swiping.',
    tradeoffs: 'Still chips, only smaller; some hide off-screen.',
    Page: withNeeds(NeedsStrip)
  }
];

const CAMERAS: Design[] = [
  {
    id: 'A',
    name: 'Stage + filmstrip',
    idea: 'One big view (the most recent camera first), its name and what it saw under it, and a strip of every camera to switch. Full screen from the corner button.',
    strengths: 'The biggest picture; one camera at a time stays calm.',
    tradeoffs: 'Only one camera is live at a glance.',
    Page: CamerasStage,
    Cameras: CamerasStage
  },
  {
    id: 'B',
    name: 'Even wall',
    idea: 'Every camera the same size, the most recent first (on phones the first one spans the width). Name and what it saw under each; tap one for full screen. Offline cameras become one quiet line.',
    strengths: 'See every camera at once; nothing to switch.',
    tradeoffs: 'Smaller pictures; a long wall with many cameras.',
    Page: CamerasWall,
    Cameras: CamerasWall
  },
  {
    id: 'C',
    name: 'Motion first',
    idea: 'The latest event is the big view; a short “Recent” list (Car · Driveway · 1m ago) switches it; quiet cameras sit in a small row. Beside the big view on desktop, under it on phones.',
    strengths: 'Leads with what happened; answers “who was that?” fast.',
    tradeoffs: 'Two lists to read; the layout changes as events come in.',
    Page: CamerasMotion,
    Cameras: CamerasMotion
  }
];

const DEVICES: Design[] = [
  {
    id: 'A',
    name: 'By type',
    idea: 'Locks, Doors & windows, Smoke & water, Motion: each a quiet heading with one line of status (“1 of 3 not locked”), tiles that want a look first. Today in a column beside them on desktop, under them on phones (one scroll).',
    strengths: 'Answers “are all doors locked?” per group; predictable order.',
    tradeoffs: 'Long on phones with many devices.',
    Page: DevicesByType,
    Devices: DevicesByType
  },
  {
    id: 'B',
    name: 'By area',
    idea: 'One group per area (Entrance, Kitchen, Garage…), areas with something to look at first, “Secure” on the rest. Today beside on desktop, under on phones (one scroll).',
    strengths: 'Matches how you think of the house; mirrors the Rooms pages.',
    tradeoffs: 'Mixed tile kinds per group; locks spread across areas.',
    Page: DevicesByArea,
    Devices: DevicesByArea
  },
  {
    id: 'C',
    name: 'Needs a look + tabs',
    idea: 'Devices that want a look (unlocked, open, wet, offline) as tiles first; everything else in tabs: All, Locks, Openings, Safety, Motion, Today. The same on phone and desktop, so the page stays short.',
    strengths: 'Shortest page; the problems are never buried.',
    tradeoffs: 'Today and the calm devices are one tap away.',
    Page: DevicesTabs,
    Devices: DevicesTabs
  }
];

const FULL: Design[] = [
  {
    id: 'B',
    name: 'The settled page',
    idea: 'Everything you picked, together: Slide hero with the Summary line, Stage + filmstrip cameras, Needs a look + tabs. New in this round: sirens (a proposed siren tile: Silence, or Test by press-and-hold), garage doors as controllable covers (Close is a fix), and the loading, empty and error states.',
    strengths: 'The whole page as it would ship.',
    tradeoffs: 'The siren tile is new: no Area tile existed for sirens.',
    Page: DesignB
  }
];

const pickKey = (r: Round) => `had.pro.securityStudio.${r === 'r1' ? 'round1' : r === 'r2' ? 'round2' : r === 'r3' ? 'round3' : r === 'r4' ? 'round4' : r === 'r5' ? 'round5' : 'round6'}`;

const WIDTHS = [
  { id: '375', label: 'Phone 375', content: 343 },
  { id: '768', label: 'Tablet 768', content: 640 },
  { id: '1440', label: 'Desktop 1440', content: 1140 },
  { id: '1920', label: 'Large 1920', content: 1620 }
] as const;
type WidthId = (typeof WIDTHS)[number]['id'];
type Theme = 'light' | 'dark' | 'both';
type View = DesignId | 'compare';


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

/** A themed stage wearing the Security accent. */
function Stage({ dark, children }: { dark: boolean; children: ReactNode }) {
  return (
    <div className={cn(dark && 'dark')}>
      <div className="pro overflow-x-auto rounded-2xl bg-[var(--background)] p-4 text-foreground" data-page="security">
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
        <p className="text-muted">Answer one question in a second: is my home secure? If not, say what is wrong and offer the one fix. Then show the cameras.</p>
      </div>
      <div>
        <h2 className="mb-1 text-base font-semibold">Frame (you, 2026-11-26)</h2>
        <p className="text-muted">The answer first, cameras right below, on phone and desktop. Alarm, activity, devices and safety are secondary: in columns, tabs or below. Not busy, not generic, one page that feels like the rest of HAD Pro.</p>
      </div>
      <div>
        <h2 className="mb-1 text-base font-semibold">{round === 'r1' ? 'Round 1 (decided: B)' : round === 'r2' ? 'Round 2 (decided: 3 · Slide)' : round === 'r3' ? 'Round 3 (decided: B · Summary line)' : round === 'r4' ? 'Round 4 (decided: A · Stage + filmstrip)' : round === 'r5' ? 'Round 5 (decided: C · Needs a look + tabs)' : 'Round 6: the full page'}</h2>
        <p className="text-muted">
          {round === 'r1'
            ? 'Three whole-page directions. You picked B · Ambient on 2026-11-26.'
            : round === 'r6'
              ? 'Every section is settled. This is the whole page with sirens and garage doors added, plus its loading, empty and error states (Page state). Try “Alarm triggered” (two sirens sounding) and “Evening” (garage open, Close fix), at Phone 375 and Desktop 1440.'
              : round === 'r5'
              ? 'Hero and cameras are settled. Three ways to lay out the devices (your chosen Area tiles) and Today below the cameras; this also settles phones: A and B are one scroll, C uses tabs. Try “Evening”, “Alarm triggered” and “Small flat” at Phone 375 and Desktop 1440.'
              : round === 'r4'
              ? 'The hero is settled (Slide + Summary line). Three ways to show the cameras right under it. No text on the video; tap for full screen. Try “Evening” (car on the driveway), “Night” (a camera offline) and “Small flat” (one camera).'
              : round === 'r3'
              ? 'You picked the Slide hero; its fix pills were too bulky, mostly on phones. Three slimmer ways to say what needs you. Silence siren stays a full button in all three. Try “Evening”, “Night” and “Alarm triggered” at Phone 375.'
              : 'Three ways to read the state and change the alarm inside B. Critical changes (Away, Night, turning an armed alarm off) need a hold or a slide; turning it off asks for the code (sample code 1234). Try “Alarm triggered” and “Away · all secure”.'}
        </p>
      </div>
    </section>
  );
}

function readPick(r: Round): { design: DesignId | null; notes: string } {
  try {
    const v = JSON.parse(localStorage.getItem(pickKey(r)) ?? 'null') as { design?: DesignId; notes?: string } | null;
    return { design: v?.design ?? null, notes: v?.notes ?? '' };
  } catch {
    return { design: null, notes: '' };
  }
}

export default function SecurityStudio() {
  const [round, setRound] = useState<Round>('r6');
  const [show, setShow] = useState<HeroShow>('page');
  const [pageState, setPageState] = useState<PageState>('live');
  const [view, setView] = useState<View>('compare');
  const [stateId, setStateId] = useState<StudioStateId>('evening');
  const [theme, setTheme] = useState<Theme>('light');
  const [widthId, setWidthId] = useState<WidthId>('375');
  const [home, setHome] = useState<StudioHome>(() => studioHome('evening'));
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

  const act = useMemo(() => (a: SecurityAction) => setHome((h) => applySecurityAction(h, a)), []);
  const width = WIDTHS.find((w) => w.id === widthId)?.content ?? 1140;
  const themes = theme === 'both' ? [false, true] : [theme === 'dark'];
  const list = round === 'r1' ? DESIGNS : round === 'r2' ? HEROES : round === 'r3' ? NEEDS : round === 'r4' ? CAMERAS : round === 'r5' ? DEVICES : FULL;
  const shown = view === 'compare' ? list : list.filter((d) => d.id === view);
  const label = (d: Design) => (round === 'r1' ? `Design ${d.id}` : round === 'r2' ? `Hero ${d.id}` : round === 'r3' ? `Style ${d.id}` : round === 'r4' ? `Cameras ${d.id}` : round === 'r5' ? `Devices ${d.id}` : 'Security page');
  const sideBySide = view === 'compare' && width < 700;

  const setPick = (next: { design: DesignId | null; notes: string }) => {
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
      await navigator.clipboard.writeText(`Security studio ${round === 'r1' ? 'round 1' : round === 'r2' ? 'round 2 (hero)' : round === 'r3' ? 'round 3 (needs you)' : round === 'r4' ? 'round 4 (cameras)' : round === 'r5' ? 'round 5 (devices)' : 'round 6 (full page)'}: ${d ? `${label(d)} (${d.name})` : 'no pick'}.${pick.notes.trim() ? ` Notes: ${pick.notes.trim()}` : ''}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="pro h-dvh overflow-y-auto overscroll-contain bg-[var(--background)] text-foreground" data-page="security">
      <main className="mx-auto flex max-w-[1800px] flex-col gap-6 px-4 py-6">
        <StudioNavBar current="security" />
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold">Security Studio</h1>
            <p className="mt-1 text-sm text-muted">Restarted from zero. Round 1: three whole-page directions on the same sample home. Everything is live on sample data only, never Home Assistant.</p>
          </div>
          <Chip size="md" variant="soft" color="success">
            <Chip.Label>{round === 'r1' ? 'Round 1 decided · B · Ambient' : round === 'r2' ? 'Round 2 decided · 3 · Slide' : round === 'r3' ? 'Round 3 decided · B · Summary line' : round === 'r4' ? 'Round 4 decided · A · Stage + filmstrip' : round === 'r5' ? 'Round 5 decided · C · Needs a look + tabs' : 'Round 6 · full page'}</Chip.Label>
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
              { id: 'r5', text: '5 · Devices (Tabs chosen)' },
              { id: 'r4', text: '4 · Cameras (Stage chosen)' },
              { id: 'r3', text: '3 · Needs you (Summary chosen)' },
              { id: 'r2', text: '2 · The answer hero (Slide chosen)' },
              { id: 'r1', text: '1 · Page direction (B chosen)' }
            ]}
          />
          <Segmented label={round === 'r1' ? 'Design' : round === 'r2' ? 'Hero' : round === 'r3' ? 'Style' : round === 'r4' ? 'Cameras' : 'Devices'} value={view} onChange={setView} options={[{ id: 'compare' as View, text: 'Compare all' }, ...list.map((d) => ({ id: d.id as View, text: `${d.id} · ${d.name}` }))]} />
          {round === 'r6' ? (
            <Segmented
              label="Page state"
              value={pageState}
              onChange={setPageState}
              options={[
                { id: 'live', text: 'Live' },
                { id: 'loading', text: 'Loading' },
                { id: 'empty', text: 'Empty' },
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
                { id: 'page', text: 'In the B page' },
                { id: 'hero', text: round === 'r4' ? 'Cameras only' : round === 'r5' ? 'Devices only' : 'Hero only' }
              ]}
            />
          ) : null}
          <Segmented
            label="Home state (resets the sample)"
            value={stateId}
            onChange={(id) => {
              setStateId(id);
              setHome(studioHome(id));
            }}
            options={STUDIO_STATES.map((s) => ({ id: s.id, text: s.label }))}
          />
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
                      pageState === 'loading' ? <SecurityLoading width={width} /> : pageState === 'empty' ? <SecurityEmpty /> : pageState === 'error' ? <SecurityError lastSeen={Date.now() - 6 * 60_000}><DesignB home={home} width={width} act={act} /></SecurityError> : <DesignB home={home} width={width} act={act} />
                    ) : round !== 'r1' && show === 'page' ? (d.Devices ? <DesignB home={home} width={width} act={act} Devices={d.Devices} /> : d.Cameras ? <DesignB home={home} width={width} act={act} Hero={SettledHero} Cameras={d.Cameras} /> : <DesignB home={home} width={width} act={act} Hero={d.Page} />) : <d.Page home={home} width={width} act={act} />}
                  </div>
                </Stage>
              ))}
            </section>
          ))}
        </div>

        <section aria-label="Your pick" className="pro-surface flex flex-col gap-3 p-4">
          <h2 className="text-base font-semibold">Your pick</h2>
          <p className="text-sm text-muted">{pick.design ? `${label({ id: pick.design } as Design)} picked in this browser. Copy it for the chat.` : 'Pick one above, or note a mix.'}</p>
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
