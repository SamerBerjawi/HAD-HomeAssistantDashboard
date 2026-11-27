/**
 * Media Studio, restarted 2026-11-27 (docs/pro-ui/MEDIA.md §0). Dev only: /?studio=media. Same
 * approach as Security, Energy and Mobility: round 1 compares three whole-page directions on the
 * same sample homes, later rounds refine the chosen one. The owner's frame: look at it like Spotify
 * or Apple Music; player and library; art-tinted artwork, the mini player bar, shelves, the speaker
 * picker. Previews use sample homes only (`lib/media/sampleMedia.ts`, made-up music and generated
 * art), never Home Assistant; the controls change the sample so you can try them. The production
 * page (`ProMedia.tsx`) is untouched until a direction is approved.
 */
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Button, Chip, TextArea, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, Moon02Icon, PaintBoardIcon, Sun01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { applySampleAction, type MediaHome } from '../../../lib/mediaHome';
import { SAMPLE_MEDIA_STATES, sampleMediaHome, type SampleMediaId } from '../../../lib/media/sampleMedia';
import { StudioNavBar } from '../../../studio/StudioNavBar';
import type { DesignProps, PickerProps } from '../home/parts';
import DesignA from './designs/DesignA';
import DesignB from '../home/MediaPage';
import DesignC from './designs/DesignC';
import { HeroBand, HeroCard, HeroImmersive, type HeroProps } from '../home/heroConcepts';
import { ElsewhereCards, ElsewhereList, ElsewhereTiles, type ElsewhereProps } from '../home/elsewhereConcepts';
import { LibraryQuick, LibraryShelves, LibraryTabs, type LibraryProps } from '../home/libraryConcepts';
import { PickerAirPlay, PickerGrid, PickerList } from '../home/pickerConcepts';
import { IdleBar, IdleResume, IdleRooms, type IdleConcept } from '../home/idleConcepts';

interface Design {
  id: string;
  name: string;
  idea: string;
  strengths: string;
  tradeoffs: string;
  Page: ComponentType<DesignProps>;
}

const DESIGNS: Design[] = [
  {
    id: 'A',
    name: 'Now Playing',
    idea: 'Apple Music’s Now Playing as the page: what plays opens it, big artwork on a backdrop blurred from it, the title, the scrubber, shuffle · previous · play · next · repeat, the volume, and “Playing on Living room” (tap for the speaker picker: tick rooms to group them, a volume each). Up next beside it on desktop, under it on phones. Other rooms that play follow as tinted cards; the library shelves close the page (a tap plays on the room above). Nothing playing: the rooms as pills, then the shelves.',
    strengths: 'The music is the page; the most Apple Music; controls big and calm.',
    tradeoffs: 'One room at a time up top; the library is a scroll away.',
    Page: DesignA
  },
  {
    id: 'B',
    name: 'Home',
    idea: 'Spotify Home, your page direction since 2026-11-27, built with the sections decided in rounds 2–5: a greeting, “Start something” (quick picks, a tap plays in the room shown), “Playing in your home” as the quiet List, then the shelves. What plays sits in the mini player bar pinned to the bottom; tap it (or a room in the list) for the Immersive player as a sheet. On desktop the Immersive player stays open on the right, as in Spotify’s desktop app. “Playing on …” opens the AirPlay sheet.',
    strengths: 'Starting music is one tap; the most Spotify; scales to a big library.',
    tradeoffs: 'What plays is smaller on phones (the bar) until you open it.',
    Page: DesignB
  },
  {
    id: 'C',
    name: 'Rooms',
    idea: 'Room first, like Spotify Connect and AirPlay: every room is a card tinted by what it plays (grouped rooms as one card, idle rooms quiet), with play/pause and its volume. The picked room is where the library below plays (“Start something in the Kitchen”) and the mini bar follows it; tap a playing card for Now Playing and its speakers.',
    strengths: 'The whole home at a glance; easiest to send music to a room or group rooms.',
    tradeoffs: 'Less of the big-artwork feel until you open a room.',
    Page: DesignC
  }
];

/** Round 2: A with one of the Now Playing panels. */
const withHero = (Hero: ComponentType<HeroProps>) =>
  function WithHero(p: DesignProps) {
    return <DesignA {...p} Hero={Hero} />;
  };

const HEROES: Design[] = [
  {
    id: '1',
    name: 'Card',
    idea: 'Round 1’s panel: the artwork left on a backdrop blurred from it, the title, scrubber, transport, volume and “Playing on …” right, Up next beside it on desktop and under it on phones. Follows the page’s light or dark.',
    strengths: 'Calm; light pages stay light.',
    tradeoffs: 'Up next takes a column of its own on desktop.',
    Page: withHero(HeroCard)
  },
  {
    id: '2',
    name: 'Immersive',
    idea: 'Apple Music’s full player: the artwork’s colour floods the panel in light and in dark, white type on it, the artwork shrinks a little when paused. Up next in the player as in Card (your change): a column on its right on desktop, under the controls on tablets and phones. TV shows wide artwork and “On the Living room TV”, radio says Live.',
    strengths: 'The most Apple Music; the artwork’s colour sets the mood; no extra column.',
    tradeoffs: 'A dark, coloured block even on a light page.',
    Page: withHero(HeroImmersive)
  },
  {
    id: '3',
    name: 'Band',
    idea: 'A compact strip so more of the home shows above the fold: the artwork, the title big, the transport and the speaker in one band; the scrubber and volume under it; Up next as a row of small tiles to tap.',
    strengths: 'Other rooms and the library start higher; Up next at a glance.',
    tradeoffs: 'Smaller artwork, less of the Now Playing feel.',
    Page: withHero(HeroBand)
  }
];

/** Round 3: A (Immersive) with one of the "Also playing" sections. */
const withElsewhere = (Elsewhere: ComponentType<ElsewhereProps>) =>
  function WithElsewhere(p: DesignProps) {
    return <DesignA {...p} Elsewhere={Elsewhere} />;
  };

const ELSEWHERE: Design[] = [
  {
    id: '1',
    name: 'Cards',
    idea: 'Round 1’s room cards: one card per room or group, tinted by its artwork, with play/pause, skip and its volume (a group gets its speakers instead), and a thin progress line. Tap the artwork to bring it into the player.',
    strengths: 'Control each room without leaving the page.',
    tradeoffs: 'Heaviest; several cards push the library down.',
    Page: withElsewhere(ElsewhereCards)
  },
  {
    id: '2',
    name: 'List',
    idea: 'One quiet list, like Apple Music’s AirPlay list: the artwork, the title, the room and whether it plays or is paused, a thin progress line, and a play/pause button. Tap a row to bring that room into the player above, where its full controls are.',
    strengths: 'Compact and calm; the player above stays the one big thing.',
    tradeoffs: 'Only play/pause in the row; the rest is one tap away.',
    Page: withElsewhere(ElsewhereList)
  },
  {
    id: '3',
    name: 'Tiles',
    idea: 'Spotify’s “Jump back in”: big artwork per room with the room’s name on it and a play button, the title under it; a shelf you scroll sideways when several rooms play. Paused rooms look faded. Tap the artwork to bring it into the player.',
    strengths: 'The most visual; matches the shelves below.',
    tradeoffs: 'Reads like the library; the room is a small label.',
    Page: withElsewhere(ElsewhereTiles)
  }
];

/** Round 4: A (Immersive, List) with one of the libraries. */
const withLibrary = (Library: ComponentType<LibraryProps>) =>
  function WithLibrary(p: DesignProps) {
    return <DesignA {...p} Library={Library} />;
  };

const LIBRARY: Design[] = [
  {
    id: '1',
    name: 'Shelves',
    idea: 'Round 1’s library: a row of tiles per shelf (Recently played, Your playlists, Radio, and On the TV when the player is a TV), each row scrolling sideways. A line on top says where a tap plays (“Plays in the Living room”); hover a tile for its play button.',
    strengths: 'Everything visible by scrolling down; big artwork.',
    tradeoffs: 'A long page with many shelves.',
    Page: withLibrary(LibraryShelves)
  },
  {
    id: '2',
    name: 'Quick picks + shelves',
    idea: 'Spotify Home: “Start something” opens with a grid of what you played lately (artwork and name, one tap to play), then the other shelves as rows.',
    strengths: 'The likeliest things are one tap away, compactly.',
    tradeoffs: 'Two looks (grid and rows) on one page.',
    Page: withLibrary(LibraryQuick)
  },
  {
    id: '3',
    name: 'Tabs',
    idea: 'Apple Music’s Library: one shelf at a time as a grid of tiles, chosen with tabs (Recently played, Your playlists, Radio, On the TV). The page ends sooner; the grid shows more of one shelf.',
    strengths: 'Short page; each kind of thing easy to find.',
    tradeoffs: 'One shelf at a time; a tap to switch.',
    Page: withLibrary(LibraryTabs)
  }
];

/** Round 5: A as decided, with one of the speaker pickers behind "Playing on …". */
const withPicker = (Picker: ComponentType<PickerProps>) =>
  function WithPicker(p: DesignProps) {
    return <DesignA {...p} Picker={Picker} />;
  };

const PICKERS: Design[] = [
  {
    id: '1',
    name: 'List with ticks',
    idea: 'Round 1’s picker: “Play on” with a checkbox per room (its model, and what it plays if it plays something else), a volume under each room in the group.',
    strengths: 'Plain and familiar; every room’s volume at hand.',
    tradeoffs: 'No volume for the whole group; looks like a settings list.',
    Page: withPicker(PickerList)
  },
  {
    id: '2',
    name: 'AirPlay sheet',
    idea: 'Apple’s AirPlay sheet: what plays (artwork, title, the rooms) and one volume for the group on top; under it the speakers and TVs, each with a tick circle on the right, and a volume under each one in the group.',
    strengths: 'What plays and the group volume first; reads like the iPhone.',
    tradeoffs: 'A longer sheet when many rooms are grouped.',
    Page: withPicker(PickerAirPlay)
  },
  {
    id: '3',
    name: 'Room grid',
    idea: 'Sonos: every room as a tile, lit in the accent when it’s in the group, tap to add or drop it. Under the grid the group volume, then a slider per room in the group.',
    strengths: 'Big tap targets; the group shows at a glance.',
    tradeoffs: 'Wider dialog; less about what plays.',
    Page: withPicker(PickerGrid)
  }
];

/** Round 6: B · Home with nothing playing, one of three ways. */
const withIdle = (Idle: IdleConcept) =>
  function WithIdle(p: DesignProps) {
    return <DesignB {...p} Idle={Idle} />;
  };

const IDLE: Design[] = [
  {
    id: '1',
    name: 'Rooms first',
    idea: 'Round 1’s: under the greeting, “Pick a room, then something to play” and the rooms as pills. The picked room is where a tap in Start something and the shelves plays.',
    strengths: 'Where it plays is chosen first and always in sight.',
    tradeoffs: 'A row of pills before any music.',
    Page: withIdle(IdleRooms)
  },
  {
    id: '2',
    name: 'Pick up where you left off',
    idea: 'What you played last as a big card tinted by its artwork, “Pick up where you left off”, and one button: “Play in the Living room”. The rooms as pills under it to change where.',
    strengths: 'The likeliest thing is one tap; the page keeps the art-tinted feel with nothing playing.',
    tradeoffs: 'Repeats the first quick pick; the card takes room.',
    Page: withIdle(IdleResume)
  },
  {
    id: '3',
    name: 'Room bar',
    idea: 'Spotify’s “Playing on” bar: nothing extra on top; where the mini player goes, a dark bar says “Nothing playing · A tap plays in the Living room” with a Change button (a list of rooms). Once something plays, the bar becomes the mini player.',
    strengths: 'Cleanest page; the bar is where the player will be.',
    tradeoffs: 'Where it plays is at the bottom, easy to miss.',
    Page: withIdle(IdleBar)
  }
];

type Round = 'r6' | 'r5' | 'r4' | 'r3' | 'r2' | 'r1';
const pickKey = (r: Round) => `had.pro.mediaStudio.round${r.slice(1)}`;
const WIDTHS = [
  { id: '375', label: 'Phone 375', content: 343 },
  { id: '768', label: 'Tablet 768', content: 640 },
  { id: '1440', label: 'Desktop 1440', content: 1140 },
  { id: '1920', label: 'Large 1920', content: 1620 }
] as const;
type WidthId = (typeof WIDTHS)[number]['id'];
type Theme = 'light' | 'dark' | 'both';

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

function Stage({ dark, children }: { dark: boolean; children: ReactNode }) {
  return (
    <div className={cn(dark && 'dark')}>
      <div className="pro overflow-x-auto rounded-2xl bg-[var(--background)] p-4 text-foreground" data-page="media">
        {children}
      </div>
    </div>
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

export default function MediaStudio() {
  const [round, setRound] = useState<Round>('r6');
  const [view, setView] = useState<string>('compare');
  const [stateId, setStateId] = useState<SampleMediaId>('quiet');
  const [theme, setTheme] = useState<Theme>('light');
  const [widthId, setWidthId] = useState<WidthId>('1440');
  const base = useMemo(() => sampleMediaHome(stateId), [stateId]);
  const [home, setHome] = useState<MediaHome>(base);
  useEffect(() => setHome(base), [base]);
  const [pick, setPickState] = useState(() => readPick('r6'));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  const act: DesignProps['act'] = (id, a) => setHome((h) => applySampleAction(h, id, a));
  const width = WIDTHS.find((w) => w.id === widthId)?.content ?? 1140;
  const themes = theme === 'both' ? [false, true] : [theme === 'dark'];
  const list = round === 'r1' ? DESIGNS : round === 'r2' ? HEROES : round === 'r3' ? ELSEWHERE : round === 'r4' ? LIBRARY : round === 'r5' ? PICKERS : IDLE;
  const label = (id: string) => (round === 'r1' ? `Design ${id}` : round === 'r2' ? `Panel ${id}` : round === 'r3' ? `Also playing ${id}` : round === 'r4' ? `Library ${id}` : round === 'r5' ? `Picker ${id}` : `Nothing playing ${id}`);
  const shown = view === 'compare' ? list : list.filter((d) => d.id === view);
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
      await navigator.clipboard.writeText(`Media studio ${round === 'r1' ? 'round 1' : round === 'r2' ? 'round 2 (Now Playing panel)' : round === 'r3' ? 'round 3 (Also playing)' : round === 'r4' ? 'round 4 (library)' : round === 'r5' ? 'round 5 (speaker picker)' : 'round 6 (nothing playing)'}: ${d ? `${label(d.id)} (${d.name})` : 'no pick'}.${pick.notes.trim() ? ` Notes: ${pick.notes.trim()}` : ''}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="pro h-dvh overflow-y-auto overscroll-contain bg-[var(--background)] text-foreground" data-page="media">
      <main className="mx-auto flex max-w-[1800px] flex-col gap-6 px-4 py-6">
        <StudioNavBar current="media" />
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold">Media Studio</h1>
            <p className="mt-1 text-sm text-muted">Restarted from zero: whole-page directions first, then section by section. Sample homes only, with made-up music and generated artwork; the controls change the sample.</p>
          </div>
          <Chip size="md" variant="soft" color="success">
            <Chip.Label>{round === 'r1' ? 'Round 1 decided · B · Home' : round === 'r2' ? 'Round 2 decided · 2 · Immersive' : round === 'r3' ? 'Round 3 decided · 2 · List' : round === 'r4' ? 'Round 4 decided · 2 · Quick picks' : round === 'r5' ? 'Round 5 decided · 2 · AirPlay sheet' : 'Round 6 decided · 3 · Room bar'}</Chip.Label>
          </Chip>
        </header>

        <section aria-label="Brief" className="pro-surface grid gap-4 p-5 text-sm md:grid-cols-3">
          <div>
            <h2 className="mb-1 text-base font-semibold">The job</h2>
            <p className="text-muted">See and control what plays anywhere in the home, send it to other rooms, and start something new, as easily as in Spotify or Apple Music.</p>
          </div>
          <div>
            <h2 className="mb-1 text-base font-semibold">Frame (you, 2026-11-27)</h2>
            <p className="text-muted">Like Spotify or Apple Music. Player and library. Big artwork with the page tinted by it, the mini player bar with the device, shelves of tiles, and the speaker picker (choose and group rooms, a volume each). Apple TV and HomePods today; Music Assistant, Spotify, Sonos and other TVs must fit (try “Every integration”).</p>
          </div>
          <div>
            <h2 className="mb-1 text-base font-semibold">{round === 'r1' ? 'Round 1 (decided: B · Home)' : round === 'r2' ? 'Round 2 (decided: 2 · Immersive)' : round === 'r3' ? 'Round 3 (decided: 2 · List)' : round === 'r4' ? 'Round 4 (decided: 2 · Quick picks + shelves)' : round === 'r5' ? 'Round 5 (decided: 2 · AirPlay sheet)' : 'Round 6 (decided: 3 · Room bar)'}</h2>
            <p className="text-muted">{round === 'r6' ? 'B · Home when nothing plays (the “Nothing playing” home is preselected): 1 · Rooms first (pills under the greeting), 2 · Pick up where you left off (what you played last, big, one button to play it), 3 · Room bar (Spotify’s bar at the bottom says where a tap plays; Change to pick a room). Tap something to start it: the page turns into the playing page. You picked 3 · Room bar on 2026-11-27; it is now Home’s “Nothing playing”. All sections are decided; next: build it on live data.' : ''}{round === 'r5' ? 'Tap “Playing on Living room” in the player: three ways to choose where it plays. 1 · List with ticks (round 1’s), 2 · AirPlay sheet (what plays and the group volume on top, rooms with a tick circle), 3 · Room grid (Sonos: tiles to tap on or off, group volume, a slider per room). Try “Grouped: three rooms” and “Every integration” (Sonos and Music Assistant can’t join the HomePods). TVs have no picker: they say where they play. You picked 2 · AirPlay sheet on 2026-11-27; it is now A’s picker. Next: “Nothing playing”.' : ''}{round === 'r4' ? 'Under the player and Also playing, three ways to start something: 1 · Shelves (round 1’s rows), 2 · Quick picks + shelves (Spotify Home), 3 · Tabs (Apple Music’s Library). A tap plays in the room in the player; with “TV on, music paused” the TV’s apps show too. You picked 2 · Quick picks + shelves on 2026-11-27; it is now A’s library.' : ''}{round === 'r3' ? 'Under the Immersive player, three ways to show the other rooms that play: 1 · Cards (round 1’s, each with its controls), 2 · List (Apple Music’s AirPlay list), 3 · Tiles (Spotify’s “Jump back in”). Try “Every integration” (radio in the office, a paused podcast in the garage) and “TV on, music paused”; tap one to bring it into the player. You picked 2 · List on 2026-11-27; it is now A’s Also playing.' : ''}{round === 'r2' ? 'Inside A, three ways to show what plays: 1 · Card (round 1’s), 2 · Immersive (Apple Music’s full player), 3 · Band (compact, Up next as tiles). Try “Music in the living room”, “TV on, music paused” (wide artwork), and “Every integration” → tap Office in Also playing for live radio. Light and dark, phone and desktop. You picked 2 · Immersive on 2026-11-27 with Up next in the player as in Card; it is now A’s panel. Next: Up next, the room cards, the shelves, the speaker picker and “Nothing playing”.' : ''}{round === 'r1' ? 'Three whole pages on the same homes: A · Now Playing (Apple Music), B · Home (Spotify), C · Rooms (room first). You first picked A and refined it in rounds 2–5 (Immersive player, the List, Quick picks, the AirPlay sheet); on 2026-11-27 you moved the page to B · Home and kept those sections. B now shows them: the library first, the Immersive player in the mini bar’s sheet and on the right on desktop. Rounds 2–5 still preview inside A. Next: “Nothing playing”, then build it on live data.' : null}</p>
          </div>
        </section>

        <div className="pro-surface flex flex-wrap gap-4 p-4">
          <Segmented
            label="Round"
            value={round}
            onChange={(r) => {
              setRound(r);
              setView('compare');
              if (r === 'r6') setStateId('quiet');
              setPickState(readPick(r));
            }}
            options={[
              { id: 'r6', text: '6 · Nothing playing (Room bar chosen)' },
              { id: 'r5', text: '5 · Speaker picker (AirPlay sheet chosen)' },
              { id: 'r4', text: '4 · Library (Quick picks chosen)' },
              { id: 'r3', text: '3 · Also playing (List chosen)' },
              { id: 'r2', text: '2 · Now Playing panel (Immersive chosen)' },
              { id: 'r1', text: '1 · Page direction (B chosen)' }
            ]}
          />
          <Segmented label={round === 'r1' ? 'Design' : round === 'r2' ? 'Panel' : round === 'r3' ? 'Also playing' : round === 'r4' ? 'Library' : round === 'r5' ? 'Picker' : 'Nothing playing'} value={view} onChange={setView} options={[{ id: 'compare', text: 'Compare all' }, ...list.map((d) => ({ id: d.id, text: `${d.id} · ${d.name}` }))]} />
          <Segmented label="Home" value={stateId} onChange={setStateId} options={SAMPLE_MEDIA_STATES.map((s) => ({ id: s.id, text: s.label }))} />
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
                    {label(d.id)} · {d.name}
                  </h2>
                  <p className="mt-1 text-sm">{d.idea}</p>
                  <p className="mt-1 text-xs text-muted">
                    + {d.strengths} − {d.tradeoffs}
                  </p>
                </div>
                <Button size="sm" variant={pick.design === d.id ? 'primary' : 'secondary'} onPress={() => setPick({ ...pick, design: pick.design === d.id ? null : d.id })}>
                  {pick.design === d.id ? 'Picked' : `Pick ${d.id}`}
                </Button>
              </header>
              {themes.map((dark) => (
                <Stage key={String(dark)} dark={dark}>
                  <div style={{ width }}>
                    <d.Page key={stateId} home={home} width={width} dark={dark} act={act} />
                  </div>
                </Stage>
              ))}
            </section>
          ))}
        </div>

        <section aria-label="Your pick" className="pro-surface flex flex-col gap-3 p-4">
          <h2 className="text-base font-semibold">Your pick</h2>
          <p className="text-sm text-muted">{pick.design ? `${label(pick.design)} picked in this browser. Copy it for the chat.` : 'Pick one above, or note a mix.'}</p>
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
