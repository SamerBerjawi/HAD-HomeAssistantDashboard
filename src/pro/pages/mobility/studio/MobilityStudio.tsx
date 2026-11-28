/**
 * Mobility Studio, restarted 2026-11-26 (docs/pro-ui/MOBILITY.md §0). Dev only: /?studio=mobility.
 * Same approach as Security and Energy: round 1 compares three whole-page directions on the same
 * sample vehicles, later rounds refine the chosen one section by section. The owner's frame:
 * "Ready to go?" first; charging and range, controls, location and trips, and condition all in
 * scope; built from what FordPass and Cowboy offer, but brand-neutral so the next car (Mercedes,
 * BMW, Volvo…) only needs an adapter. Previews use sample data only (`studioMobility.ts`), never
 * Home Assistant; the controls change the sample so you can try them. The production page
 * (`ProMobility.tsx`) is untouched until a direction is approved.
 */
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { Button, Chip, TextArea, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Copy01Icon, Moon02Icon, PaintBoardIcon, Sun01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { MobilityHome, Vehicle } from '../../../lib/mobilityHome';
import { StudioNavBar } from '../../../studio/StudioNavBar';
import { STUDIO_MOBILITY_STATES, studioMobilityHome, type StudioMobilityId } from './studioMobility';
import { useMobilityHome } from '../../../hooks/useMobilityHome';
import { MobilityLoading, MobilityNotSetUp, MobilityUnreachable } from '../MobilityStates';
import type { DesignProps, MobilityAction } from './designs/parts';
import DesignA from './designs/DesignA';
import DesignB, { type ChargeClimateSlot, type ConditionSlot, type WhereTripsSlot } from './designs/DesignB';
import type { Life } from '../home/parts';
import { BatteryPackCard, BatteryTidy, ConditionTidy, ConditionTop, HealthCheck } from './designs/conditionConcepts';
import { DayOnMap, TripsLog, TripsTidy, WhereCompact, WhereTidy } from './designs/whereTripsConcepts';
import { BeforeYouLeave, ChargingDial, ChargingTidy, ClimateDial, ClimateTidy } from './designs/chargeClimateConcepts';
import DesignC from './designs/DesignC';
import { HeroKeys, HeroPicture, HeroRing, type HeroProps } from './designs/heroConcepts';

interface Design {
  id: string;
  name: string;
  idea: string;
  strengths: string;
  tradeoffs: string;
  Page: ComponentType<DesignProps>;
  /** Round 2: the hero shown alone. */
  Hero?: ComponentType<HeroProps>;
  /** Round 3: the Charging and Climate cards shown alone. */
  Cards?: ChargeClimateSlot;
  /** Round 4: the Where and Trips cards shown alone. */
  Places?: WhereTripsSlot;
  /** Round 5: the Condition and Battery cards shown alone. */
  Health?: ConditionSlot;
}

const DESIGNS: Design[] = [
  {
    id: 'A',
    name: 'Cockpit',
    idea: 'The classic Mobility layout you like, reworked into HAD Pro. Vehicles as pills on top. On desktop classic’s three columns: the vehicle (picture, “Ready to go?” answered in a few words, the checks behind it, the controls, four key numbers), then Charging and Climate, then Where (map and the day’s speed), Trips and Condition. Tablets put the vehicle across the top; phones stack everything.',
    strengths: 'Closest to classic; everything on one screen on desktop.',
    tradeoffs: 'The answer shares its column with the picture and numbers, so it reads a little quieter.',
    Page: DesignA
  },
  {
    id: 'B',
    name: 'Ready check',
    idea: 'Built like the Security and Energy pages. With several vehicles, Cockpit’s pills on top (your change; each pill has a dot for its answer). Then one hero lit by the answer (green ready, blue charging, amber to check, red stolen or crashed): the charge ring with the range and the charge limit, the answer, the checks, the controls. The sections follow in a bento; one column on phones.',
    strengths: 'One family with Security and Energy; the answer is the first thing you see.',
    tradeoffs: 'The picture gives way to the ring; the page is longer on phones.',
    Page: DesignB
  },
  {
    id: 'C',
    name: 'Garage bays',
    idea: 'The fleet first. One line for the whole garage (“Everything’s ready to go”, or the vehicle that needs you), then every car and bike as a bay side by side with its picture, charge, range and answer. Choosing a bay opens its checks, controls and one section at a time in tabs underneath.',
    strengths: 'Best with several vehicles: the whole garage in one look; the shortest page.',
    tradeoffs: 'Details are a tap away in tabs; with one vehicle the bay row is just one card.',
    Page: DesignC
  }
];

/** Round 2: the hero inside B (owner picked B · Ready check with A's pills on 2026-11-26). */
const inB = (Hero: ComponentType<HeroProps>) =>
  function InB(p: DesignProps) {
    return <DesignB {...p} Hero={Hero} />;
  };

const HEROES: Design[] = [
  {
    id: '1',
    name: 'Ring',
    idea: 'Round 1’s hero: the charge ring with the range inside and the charge limit as a tick, the answer and its checks beside it, the controls in a row under.',
    strengths: 'The charge reads at a glance; what you saw in round 1.',
    tradeoffs: 'No picture of the vehicle; checks and controls are two rows saying similar things (Locked / Unlock).',
    Page: inB(HeroRing),
    Hero: HeroRing
  },
  {
    id: '2',
    name: 'Picture',
    idea: 'Your pick, made compact: the vehicle’s picture (yours from classic’s Customise, else a silhouette) beside its name and the answer; one line for the charge (level, range, a slim bar with the charge limit); the checks and the controls share the last row (stacked on phones).',
    strengths: 'Feels like your car, not a gauge; closest to classic’s hero.',
    tradeoffs: 'Needs a good picture to shine; the tallest hero.',
    Page: inB(HeroPicture),
    Hero: HeroPicture
  },
  {
    id: '3',
    name: 'Status keys',
    idea: 'The answer on top, then one key per thing you check before leaving: Charge (level and range), Plug (charging, ready by), Doors (locked, or what is open), Climate (inside temperature, or on). Each key shows its state and does its job when tapped, so checks and controls are one thing. Anything else (a low tyre, an update) stays a pill; Flash and Refresh sit small in the corner. Two by two on phones.',
    strengths: 'One row instead of two; every state is also its control; even-sized targets.',
    tradeoffs: 'No ring or picture; a tap changes the car, so keys need clear states.',
    Page: inB(HeroKeys),
    Hero: HeroKeys
  }
];

/** Round 3: Charging and Climate inside B, under the chosen hero. */
const withCards = (cards: ChargeClimateSlot) =>
  function WithCards(p: DesignProps) {
    return <DesignB {...p} cards={cards} />;
  };

const CARDS: Design[] = [
  {
    id: '1',
    name: 'Tidy cards',
    idea: 'The two cards you saw, about doing rather than reading (the hero already shows the charge). Charging: what it is doing in one sentence, the charge limit on a slider that snaps to what the car accepts, one Start or Pause button. Climate: inside and outside, the set temperature with − and +, the extras (windscreen, rear window, wheel, seat) as icon toggles, one Warm up button.',
    strengths: 'Familiar; each card does one job; a slider and a stepper instead of six pills.',
    tradeoffs: 'Two cards side by side on desktop; plain to look at.',
    Page: withCards({ charging: ChargingTidy, climate: ClimateTidy }),
    Cards: { charging: ChargingTidy, climate: ClimateTidy }
  },
  {
    id: '2',
    name: 'Dials',
    idea: 'Each card around a half dial. Charging: the charge filled along the arc with the limit as a dot, kW and “90% by 07:10” in the middle, limit chips for 80, 90 and 100, one button. Climate: a thermostat dial, the set temperature in the middle with − and + either side, inside and outside under it, the arc warming as the cabin heats; the extras and one button under.',
    strengths: 'Most like a car’s own app; the set temperature is big and easy to change.',
    tradeoffs: 'Taller cards; a second gauge of the charge after the hero’s bar.',
    Page: withCards({ charging: ChargingDial, climate: ClimateDial }),
    Cards: { charging: ChargingDial, climate: ClimateDial }
  },
  {
    id: '3',
    name: 'Before you leave',
    idea: 'One card for both, since they answer the same question. A line on top says how the car will be when you go (“90% by 07:10, cabin warming to 21°”). Charge on the left (its state and the limit slider), cabin on the right (inside and outside, − 21° +, the extras); stacked on phones. Start charging and Warm up share the bottom row. Wide on desktop (two thirds), with Where beside it.',
    strengths: 'One place to get the car ready; the shortest page; reads as a plan, not two gadgets.',
    tradeoffs: 'A wide card; charging and climate are less separate when only one matters.',
    Page: withCards({ combined: BeforeYouLeave }),
    Cards: { combined: BeforeYouLeave }
  }
];

/** Round 4: Where and Trips inside B, under the chosen hero and cards. */
const withPlaces = (places: WhereTripsSlot) =>
  function WithPlaces(p: DesignProps) {
    return <DesignB {...p} places={places} />;
  };

const PLACES: Design[] = [
  {
    id: '1',
    name: 'Tidy cards',
    idea: 'The two cards you saw, tidied like round 3’s. Where: the map, then the zone and the address, and when it last reported (no speed chart). Trips: the last trip or ride in big numbers (distance, time, energy or calories) with when it ended, then drives today, today’s distance and the odometer under a hairline.',
    strengths: 'Matches the Tidy Charging and Climate cards; the map stays big.',
    tradeoffs: 'The day’s drives are only a count.',
    Page: withPlaces({ where: WhereTidy, trips: TripsTidy }),
    Places: { where: WhereTidy, trips: TripsTidy }
  },
  {
    id: '2',
    name: 'The day on the map',
    idea: 'One wide card for both: the map large on the left (on top on phones); beside it where it is, today as a 24-hour bar with each drive marked and a tick at now, the drives listed (“08:00 – 08:30 · about 18 km · top 72 km/h”, read from the speed history), and the last trip under a hairline.',
    strengths: 'Where it is and what it did today in one place; the day reads at a glance.',
    tradeoffs: 'A wide card; drive distances are estimates from speed.',
    Page: withPlaces({ combined: DayOnMap }),
    Places: { combined: DayOnMap }
  },
  {
    id: '3',
    name: 'Journey log',
    idea: 'Where shrinks to a round map thumbnail beside the zone, the address and when it was seen. Trips becomes a log: today’s drives and the last trip as a timeline, newest first (“now” while driving), with today’s distance, the odometer and, for the bike, CO₂ saved at the foot.',
    strengths: 'The shortest; the log grows naturally when the live page has more trips.',
    tradeoffs: 'The map is small; no picture of the day.',
    Page: withPlaces({ where: WhereCompact, trips: TripsLog, short: true }),
    Places: { where: WhereCompact, trips: TripsLog, short: true }
  }
];

/** Round 5: Condition and the bike's Battery inside B, under everything chosen so far. */
const withHealth = (health: ConditionSlot) =>
  function WithHealth(p: DesignProps) {
    return <DesignB {...p} health={health} />;
  };

const HEALTH: Design[] = [
  {
    id: '1',
    name: 'Tidy cards',
    idea: 'Tidied like rounds 3 and 4. Condition: the make’s warnings on tinted rows, the tyres in a 2 × 2 laid out like the car (a low one in amber), then 12 V battery, software and oil in two columns. Battery (bike): in or out in one sentence with the ride mode, the health as a bar (“of what it held when new”), time ridden and CO₂ saved.',
    strengths: 'Matches the other cards; every number in one place.',
    tradeoffs: 'Reads as numbers; a low tyre is a small amber cell.',
    Page: withHealth({ condition: ConditionTidy, battery: BatteryTidy }),
    Health: { condition: ConditionTidy, battery: BatteryTidy }
  },
  {
    id: '2',
    name: 'Top view',
    idea: 'Condition: the car drawn from above with the pressure by each wheel, the low wheel lit amber; the drive battery (not the 12 V) as a pack at its health with capacity and temperature (added with the pick); the other readings as soft pills under it (icon, name, value), tinted when they need a look. Battery (bike): the pack drawn filled to its health with the lost part hatched, dashed when it is out of the bike; CO₂ saved and time ridden as two tiles.',
    strengths: 'Which tyre is low reads at a glance; the bike card has a picture of its own.',
    tradeoffs: 'Taller Condition card; a drawing that only cars with tyre sensors get.',
    Page: withHealth({ condition: ConditionTop, battery: BatteryPackCard }),
    Health: { condition: ConditionTop, battery: BatteryPackCard }
  },
  {
    id: '3',
    name: 'Health check',
    idea: 'One checklist for everything the vehicle reports, problems first: a tick, an amber alert or a blue note, the name, the value. For the bike it takes in the Battery card (in or out, health, firmware, ride mode), so the bike page has one card fewer; the odometer, or CO₂ saved and time ridden, at the foot. Two columns when the card is wide.',
    strengths: 'The same shape for any make; problems read first; the shortest bike page.',
    tradeoffs: 'No picture; tyres are one line (which one is low, not all four).',
    Page: withHealth({ condition: HealthCheck, merge: true }),
    Health: { condition: HealthCheck, merge: true }
  }
];

/** Round 6: colour and life on the page, as on the room pages (after the live page was built). */
const withLife = (life: Life) =>
  function WithLife(p: DesignProps) {
    return <DesignB {...p} life={life} />;
  };

const LIFE: Design[] = [
  {
    id: '1',
    name: 'Ambient colour',
    idea: 'The room tiles’ look on every card: one hue per kind of thing (charge in the power green, the cabin warm orange or cool blue, the road blue, condition teal, amber when something needs a look), a soft glow from the corner (the wave was dropped when picked); the controls in the card’s hue; each card’s icon in a tinted orb; the vehicle’s picture glowing in the answer’s colour. Nothing moves.',
    strengths: 'Colour at a glance, calm, matches Rooms.',
    tradeoffs: 'Still: charging and driving look the same as parked.',
    Page: withLife('ambient')
  },
  {
    id: '2',
    name: 'Ambient + motion',
    idea: '1, and what is happening moves, as the fan and media tiles do: charge streams flowing in across the Charging card (and the hero) while it charges, out while driving or conditioning; warm or cool air drifting across Climate while it runs; the road passing under Where and today while driving; a ring pulsing on Condition’s icon when something needs a look; stars twinkling in the hero while the car sleeps.',
    strengths: 'The page shows activity, not just numbers; the room pages’ liveliness.',
    tradeoffs: 'More movement (all of it still under reduced motion).',
    Page: withLife('motion')
  },
  {
    id: '3',
    name: 'Scene',
    idea: '2, and the hero opens with a little scene in place of the picture: the sky for the hour (night with stars and the moon, dawn, day, dusk), the ground, the car or bike drawn on it, the charger and its cable with the charge flowing when it charges, the road moving when it drives, “z z” while asleep, a warm or cool glow while the cabin conditions.',
    strengths: 'The most life; reads like the room page’s picture; time of day at a glance.',
    tradeoffs: 'An illustration of a car rather than your car’s photo (the photo stays for 1 and 2).',
    Page: withLife('scene')
  }
];

type Round = 'r6' | 'r5' | 'r4' | 'r3' | 'r2' | 'r1';
type Show = 'page' | 'alone';
const pickKey = (r: Round) => `had.pro.mobilityStudio.round${r.slice(1)}`;

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
      <div className="pro overflow-x-auto rounded-2xl bg-[var(--background)] p-4 text-foreground" data-page="mobility">
        {children}
      </div>
    </div>
  );
}

/** What the controls do to the sample vehicle (moved to `lib/mobilityHome.ts`; the demo page uses it too). */
export { applySampleAction as applyAction } from '../../../lib/mobilityHome';
import { applySampleAction as applyAction } from '../../../lib/mobilityHome';

/** Round 3, "Cards only": the chosen cards for each car, as they sit in B. */
function CardsAlone({ home, width, dark, act, cards, all }: DesignProps & { cards: ChargeClimateSlot; all?: boolean }) {
  const cars = all ? home.vehicles : home.vehicles.filter((v) => v.charging || v.climate);
  const two = width >= 640;
  return (
    <div className="flex flex-col gap-4">
      {cars.map((v) => {
        const p = { v, home, width, dark, act };
        return cards.combined ? (
          <cards.combined key={v.id} {...p} />
        ) : (
          <div key={v.id} className={cn('grid items-start gap-4', two ? 'grid-cols-2' : 'grid-cols-1')}>
            {cards.charging ? <cards.charging {...p} /> : null}
            {cards.climate ? <cards.climate {...p} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function Brief({ round }: { round: Round }) {
  return (
    <section aria-label="Brief" className="pro-surface grid gap-4 p-5 text-sm md:grid-cols-3">
      <div>
        <h2 className="mb-1 text-base font-semibold">The job</h2>
        <p className="text-muted">Answer one question in a second: is it ready to go? Charge and range, plugged in or charging, locked, warm. Then the controls, where it is, its trips and its condition, for the car and the bike.</p>
      </div>
      <div>
        <h2 className="mb-1 text-base font-semibold">Frame (you, 2026-11-26)</h2>
        <p className="text-muted">
          Ready to go first. Charging and range, controls, location and trips, condition, and whatever else FordPass and Cowboy offer. Future proof: one brand-neutral vehicle model, so a new car (Mercedes, BMW, Volvo…) needs an adapter, not a new page; the page leaves out what a vehicle lacks (try “Two cars + bike”). Keep what works in classic, fuller and consistent with Security and Energy.
        </p>
      </div>
      <div>
        <h2 className="mb-1 text-base font-semibold">{round === 'r6' ? 'Round 6 (decided: 1 · Ambient colour, no wave)' : round === 'r5' ? 'Round 5 (decided: 2 · Top view)' : round === 'r4' ? 'Round 4 (decided: 2 · The day on the map)' : round === 'r3' ? 'Round 3 (decided: 1 · Tidy cards)' : round === 'r2' ? 'Round 2 (decided: 2 · Picture, compact)' : 'Round 1 (decided: B · Ready check)'}</h2>
        <p className="text-muted">{round === 'r6'
            ? 'The live page as built, with more colour and life, like the room pages (your ask, 2026-11-27): 1 colour only, 2 colour and motion, 3 also a little scene in the hero. You picked 1 · Ambient colour on 2026-11-27, without the curved wave backgrounds, and the hero keeps only the controls no card has (Lock, Flash, Refresh). It is now the live page.'
            : round === 'r5'
            ? 'Inside B, under the Picture hero, the Tidy cards and the day on the map: three ways to show how the vehicle is doing (tyres, 12 V battery, oil, software, the make’s warnings) and the bike’s battery. You picked 2 · Top view on 2026-11-27 and asked for the battery pack on the car too: its drive battery (not the 12 V one) now sits in Condition as a pack at its health, with capacity and temperature. It is now B’s Condition and Battery.'
            : round === 'r4'
            ? 'Inside B, under the Picture hero and the Tidy cards: three ways to show where the vehicle is and where it has been. You picked 2 · The day on the map on 2026-11-26: one full-width card with the map, today’s drives on a 24-hour bar and the last trip. It is now B’s Where and Trips.'
            : round === 'r3'
            ? 'Inside B, under the Picture hero: three ways to set the charge and the cabin. You picked 1 · Tidy cards on 2026-11-26 (limit slider, − set temperature +, extras as icon toggles); they are now B’s Charging and Climate.'
            : round === 'r2'
            ? 'Inside B, three ways to carry the answer. You picked 2 · Picture on 2026-11-26 and asked for it more compact: the name, answer and picture share one block, the charge is one line, and the checks and controls share a row. It is now B’s hero.'
            : 'Three whole pages on the same vehicles. You picked B · Ready check on 2026-11-26, with Cockpit’s (A) vehicle pills instead of B’s cards.'}</p>
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

export default function MobilityStudio() {
  const [round, setRound] = useState<Round>('r6');
  const [show, setShow] = useState<Show>('page');
  const [edge, setEdge] = useState<'none' | 'loading' | 'empty' | 'offline'>('none');
  const [view, setView] = useState<string>('compare');
  const [stateId, setStateId] = useState<StudioMobilityId | 'live'>('charging');
  const live = useMobilityHome();
  const [theme, setTheme] = useState<Theme>('light');
  const [widthId, setWidthId] = useState<WidthId>('1440');
  const base = useMemo(() => (stateId === 'live' ? null : studioMobilityHome(stateId)), [stateId]);
  const [sample, setHome] = useState<MobilityHome>(() => studioMobilityHome('charging'));
  useEffect(() => {
    if (base) setHome(base);
  }, [base]);
  // Live: your own vehicles through the adapters, read only here (the controls send nothing).
  const home = stateId === 'live' ? live.home : sample;
  const [pick, setPickState] = useState(() => readPick(round));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains('dark');
    root.classList.remove('dark');
    return () => {
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  const act: DesignProps['act'] = (id, a) => stateId !== 'live' && setHome((h) => ({ ...h, vehicles: h.vehicles.map((v) => (v.id === id ? applyAction(v, a) : v)) }));
  const width = WIDTHS.find((w) => w.id === widthId)?.content ?? 1140;
  const themes = theme === 'both' ? [false, true] : [theme === 'dark'];
  const list = round === 'r1' ? DESIGNS : round === 'r2' ? HEROES : round === 'r3' ? CARDS : round === 'r4' ? PLACES : round === 'r5' ? HEALTH : LIFE;
  const shown = view === 'compare' ? list : list.filter((d) => d.id === view);
  const label = (d: Pick<Design, 'id'>) => (round === 'r1' ? `Design ${d.id}` : round === 'r2' ? `Hero ${d.id}` : round === 'r3' ? `Cards ${d.id}` : round === 'r4' ? `Where ${d.id}` : round === 'r5' ? `Condition ${d.id}` : `Life ${d.id}`);
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
      await navigator.clipboard.writeText(`Mobility studio ${round === 'r1' ? 'round 1' : round === 'r2' ? 'round 2 (hero)' : round === 'r3' ? 'round 3 (charging and climate)' : round === 'r4' ? 'round 4 (where and trips)' : round === 'r5' ? 'round 5 (condition and bike battery)' : 'round 6 (life)'}: ${d ? `${label(d)} (${d.name})` : 'no pick'}.${pick.notes.trim() ? ` Notes: ${pick.notes.trim()}` : ''}`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="pro h-dvh overflow-y-auto overscroll-contain bg-[var(--background)] text-foreground" data-page="mobility">
      <main className="mx-auto flex max-w-[1800px] flex-col gap-6 px-4 py-6">
        <StudioNavBar current="mobility" />
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-2xl font-semibold">Mobility Studio</h1>
            <p className="mt-1 text-sm text-muted">Restarted from zero: whole-page directions first, then section by section. Everything runs on sample vehicles, never Home Assistant.</p>
          </div>
          <Chip size="md" variant="soft" color="success">
            <Chip.Label>{round === 'r6' ? 'Round 6 decided · 1 · Ambient colour' : round === 'r5' ? 'Round 5 decided · 2 · Top view' : round === 'r1' ? 'Round 1 decided · B · Ready check' : round === 'r2' ? 'Round 2 decided · 2 · Picture' : round === 'r3' ? 'Round 3 decided · 1 · Tidy cards' : 'Round 4 decided · 2 · The day on the map'}</Chip.Label>
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
              { id: 'r6', text: '6 · Colour and life (Ambient chosen)' },
              { id: 'r5', text: '5 · Condition and battery (Top view chosen)' },
              { id: 'r4', text: '4 · Where and trips (Day on the map chosen)' },
              { id: 'r3', text: '3 · Charging and climate (Tidy chosen)' },
              { id: 'r2', text: '2 · Hero (Picture chosen)' },
              { id: 'r1', text: '1 · Page direction (B chosen)' }
            ]}
          />
          <Segmented label={round === 'r1' ? 'Design' : round === 'r2' ? 'Hero' : round === 'r3' ? 'Cards' : round === 'r4' ? 'Where' : round === 'r5' ? 'Condition' : 'Life'} value={view} onChange={setView} options={[{ id: 'compare', text: 'Compare all' }, ...list.map((d) => ({ id: d.id, text: `${d.id} · ${d.name}` }))]} />
          {round !== 'r1' && round !== 'r6' ? (
            <Segmented
              label="Show"
              value={show}
              onChange={setShow}
              options={[
                { id: 'page', text: 'In the B page' },
                { id: 'alone', text: round === 'r2' ? 'Hero only' : round === 'r3' ? 'Cards only' : round === 'r4' ? 'Where and trips only' : 'Condition and battery only' }
              ]}
            />
          ) : null}
          <Segmented label="Vehicles" value={stateId} onChange={setStateId} options={[...STUDIO_MOBILITY_STATES.map((s) => ({ id: s.id, text: s.label })), { id: 'live' as const, text: 'Your vehicles (live, read only)' }]} />
          <Segmented
            label="Page state"
            value={edge}
            onChange={setEdge}
            options={[
              { id: 'none', text: 'Normal' },
              { id: 'loading', text: 'Loading' },
              { id: 'empty', text: 'No vehicles' },
              { id: 'offline', text: 'HA unreachable' }
            ]}
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

        {stateId === 'live' ? (
          <p className="pro-surface p-4 text-sm text-muted">
            {home.vehicles.length
              ? live.demo
                ? 'Demo mode: no Home Assistant, so this shows the sample vehicles (as the live page does in demo mode). Sign in to Home Assistant to see yours.'
                : `Live from Home Assistant: ${home.vehicles.map((v) => `${v.name} (${v.integration})`).join(', ')}. Read only here: the controls send nothing to the vehicles.`
              : live.loading
              ? 'Loading your vehicles from Home Assistant…'
              : 'No vehicles found. The page reads FordPass and Cowboy devices, and any device with a battery level and a range (the generic adapter).'}
          </p>
        ) : null}

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
                  {pick.design === d.id ? 'Picked' : `Pick ${d.id}`}
                </Button>
              </header>
              {themes.map((dark) => (
                <Stage key={String(dark)} dark={dark}>
                  <div style={{ width }}>
                    {edge === 'loading' ? (
                      <MobilityLoading width={width} />
                    ) : edge === 'empty' ? (
                      <MobilityNotSetUp haUrl="http://homeassistant.local:8123" />
                    ) : edge === 'offline' ? (
                      <MobilityUnreachable lastSeen={home.now - 12 * 60_000}>
                        <d.Page key={stateId} home={home} width={width} dark={dark} act={act} />
                      </MobilityUnreachable>
                    ) : round === 'r5' && show === 'alone' && d.Health ? (
                      <CardsAlone home={home} width={width} dark={dark} act={act} cards={{ charging: d.Health.merge ? undefined : d.Health.battery, climate: d.Health.condition }} all />
                    ) : round === 'r4' && show === 'alone' && d.Places ? (
                      <CardsAlone home={home} width={width} dark={dark} act={act} cards={{ charging: d.Places.where, climate: d.Places.trips, combined: d.Places.combined }} all />
                    ) : round === 'r3' && show === 'alone' && d.Cards ? (
                      <CardsAlone home={home} width={width} dark={dark} act={act} cards={d.Cards} />
                    ) : round === 'r2' && show === 'alone' && d.Hero ? (
                      <div className="flex flex-col gap-4">
                        {home.vehicles.map((v) => d.Hero && <d.Hero key={v.id} v={v} home={home} width={width} dark={dark} act={act} />)}
                      </div>
                    ) : (
                      <d.Page key={stateId} home={home} width={width} dark={dark} act={act} />
                    )}
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
