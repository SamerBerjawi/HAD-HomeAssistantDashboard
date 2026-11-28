/**
 * The Mobility page in the Room page's layout (owner, 2026-11-27; docs/pro-ui/VEHICLE_TILES.md):
 * the sections as tile grids (batch 1–5 picks) framed by batch 6's parts, each switchable here:
 * the rail (Room rail, Garage, Showroom), the sections and views (All, All | Now, Moment order)
 * and the phone (Picture header, Compact, Bottom dock). Live: the controls change the sample.
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Copy01Icon,
  ElectricPlugsIcon,
  EngineIcon,
  PauseIcon,
  GridViewIcon,
  Notification03Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ChosenTile } from '../../../../areas/tiles/chosenTiles';
import type { TileSize } from '../../../../areas/tileTypes';
import { applySampleAction, has, readiness, type MobilityAction, type MobilityHome, type Vehicle } from '../../../../lib/mobilityHome';
import { GuardedLockButton } from '../../../../areas/tiles/security/LockTiles';
import { STUDIO_MOBILITY_STATES, studioMobilityHome, type StudioMobilityId } from '../../../../lib/mobility/sampleVehicles';
import { TONE, VehicleArt } from '../../home/parts';
import { FactRow, momentWhy, nowIds, ReadyCard, VehicleStage } from '../../page/vehiclePageKit';
import { chargingWords, partApplies, rangeText } from '../vehicleTileKit';
import { VEHICLE_TYPES, type VehicleConceptId, type VehicleTileType } from './vehicleCatalog';
import { PAGE_PARTS, type PagePart } from './pageParts';
import { roomStandIns, type StandIn } from './roomStandIns';
import { readVehiclePicks } from './useVehiclePicks';

type Screen = 'phone' | 'desktop';

/** The Room page's grid: half rows of 68 px, 12 px gaps (Small = 148 px). */
const SPAN: Record<TileSize, string> = { xs: 'col-span-1 row-span-1', s: 'col-span-1 row-span-2', w: 'col-span-2 row-span-2', t: 'col-span-1 row-span-4', l: 'col-span-2 row-span-4' };

function conceptFor(t: VehicleTileType) {
  const p = t.chosen ?? readVehiclePicks()[t.id]?.concept;
  return t.concepts.find((c) => c.id === p) ?? t.concepts.find((c) => c.id === t.recommended)!;
}

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

const PAGE_KEY = 'had.pro.vehicleStudio.pagePicks';
type PagePicks = Record<PagePart['id'], VehicleConceptId>;

function readPagePicks(): PagePicks {
  const base = Object.fromEntries(PAGE_PARTS.map((p) => [p.id, p.chosen ?? p.recommended])) as PagePicks;
  try {
    const saved = JSON.parse(window.localStorage.getItem(PAGE_KEY) ?? '{}') as Partial<PagePicks>;
    // A chosen part opens on the choice; the picker still lets you compare.
    return Object.fromEntries(PAGE_PARTS.map((p) => [p.id, p.chosen ?? saved[p.id] ?? base[p.id]])) as PagePicks;
  } catch {
    return base;
  }
}

export default function VehiclePageSim() {
  const [stateId, setStateId] = useState<StudioMobilityId>('charging');
  const [screen, setScreen] = useState<Screen>('desktop');
  const [dark, setDark] = useState(true);
  const [home, setHome] = useState<MobilityHome>(() => studioMobilityHome('charging'));
  const [id, setId] = useState('ford');
  const [picks, setPicksState] = useState<PagePicks>(readPagePicks);
  const [view, setView] = useState<'all' | 'now'>('all');
  const [copied, setCopied] = useState(false);
  const setPick = (part: PagePart['id'], c: VehicleConceptId) => {
    const next = { ...picks, [part]: c };
    setPicksState(next);
    setCopied(false);
    try {
      window.localStorage.setItem(PAGE_KEY, JSON.stringify(next));
    } catch {
      /* blocked storage: works for this visit */
    }
  };
  const copy = async () => {
    const text = PAGE_PARTS.map((p) => `${p.title} ${picks[p.id]} (${p.concepts.find((c) => c.id === picks[p.id])?.name})`).join(', ');
    try {
      await navigator.clipboard.writeText(`Vehicle page · ${text}.`);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };
  const v = home.vehicles.find((x) => x.id === id) ?? home.vehicles[0];
  const act = (vid: string) => (a: MobilityAction) => setHome((h) => ({ ...h, vehicles: h.vehicles.map((x) => (x.id === vid ? applySampleAction(x, a) : x)) }));
  const r = readiness(v, home.now);
  const phone = screen === 'phone';
  const stand = useMemo(() => roomStandIns(v), [v]);
  const i = home.vehicles.indexOf(v);

  // Every part the vehicle's kind has; one its model reports nothing for draws itself greyed.
  const parts = (batch: number) => VEHICLE_TYPES.filter((t) => t.batch === batch && partApplies(t.id, v));
  const energy = parts(1);
  const cabin = parts(2);
  // Doors and alarm first so two Smalls share a row on phone, Openings (Wide) under them.
  const security = (['doors', 'alarm', 'openings'] as const).map((id) => VEHICLE_TYPES.find((t) => t.id === id)!).filter((t) => partApplies(t.id, v));
  const where = parts(4);
  const condition = parts(5);
  const stats = parts(7);
  const SIZE: Record<VehicleTileType['id'], TileSize> = { battery: 'w', charging: phone ? 'w' : 's', limit: phone ? 'w' : 's', climate: 'w', temp: 's', extras: 's', doors: 's', alarm: 's', openings: 'w', location: 'w', today: 's', trip: 's', tyres: 's', health: 's', software: 's', warnings: 's', distance: 'w', efficiency: phone ? 'w' : 's', sessions: phone ? 'w' : 's', allowance: 'w' };
  const drawn = (list: readonly VehicleTileType[]) =>
    list.map((t) => {
      const C = conceptFor(t).Component;
      return (
        <div key={t.id} className={SPAN[SIZE[t.id]]}>
          <C v={v} size={SIZE[t.id]} act={act(v.id)} now={home.now} />
        </div>
      );
    });
  const sections: { id: string; title: string; summary: string; body: ReactNode; note?: string }[] = [
    {
      id: 'energy',
      title: 'Energy',
      summary: v.charging ? chargingWords(v).word : `${v.level ?? '—'}%`,
      body: drawn(energy)
    },
    { id: 'cabin', title: v.climate?.remoteStart ? 'Remote start' : 'Cabin', summary: v.climate ? (v.climate.running ? `On, ${v.climate.target}°` : 'Off') : '', body: drawn(cabin) },
    { id: 'security', title: 'Security', summary: v.security.locked === false ? 'Unlocked' : v.security.open.length ? `${v.security.open.length} open` : 'All closed', body: drawn(security) },
    { id: 'where', title: 'Where', summary: v.motion?.moving ? 'Driving' : v.place?.zone ?? 'Away', body: [...drawn(where), ...tiles(stand.where)] },
    { id: 'condition', title: 'Condition', summary: r.checks.some((c) => c.tone === 'warn' || c.tone === 'bad') ? 'Needs a look' : 'All fine', body: drawn(condition) },
    { id: 'stats', title: 'Statistics', summary: v.history?.months.length ? `${Math.round(v.history.months.at(-1)!.distance).toLocaleString()} ${v.unit} this month` : '', body: drawn(stats) }
  ].filter((s) => (Array.isArray(s.body) ? s.body.length : true));
  const why = momentWhy(v);
  const ordered = picks.sections === 'C' ? [...sections].sort((a, b) => (why[a.id] ? 0 : 1) - (why[b.id] ? 0 : 1)) : sections;
  const now = nowIds(v);
  const nowTiles = VEHICLE_TYPES.filter((t) => now.has(t.id) && partApplies(t.id, v));
  const showNow = picks.sections === 'B' && view === 'now';

  function tiles(list: StandIn[]) {
    return list.map((it) => (
      <div key={it.key} className={SPAN[it.size]}>
        <ChosenTile
          e={it.model}
          size={it.size}
          act={() => {}}
        />
      </div>
    ));
  }

  const switchVehicle = () => setId(home.vehicles[(i + 1) % home.vehicles.length].id);
  const picture = (px: number) => <VehicleStage v={v} px={px} />;
  const nameButton = (cls: string) => (
    <Button variant="ghost" className="h-auto min-w-0 gap-1.5 rounded-xl px-0 text-left text-[var(--foreground)] data-[hovered=true]:bg-transparent" onPress={switchVehicle} aria-label={`${v.name}: switch vehicle`}>
      <span className={cn('truncate font-semibold tracking-[-0.03em]', cls)}>{v.name}</span>
      <HugeiconsIcon icon={ArrowDown01Icon} size={18} className="shrink-0 opacity-60" />
    </Button>
  );
  const factRow = <FactRow v={v} />;
  const ready = (compact?: boolean) => <ReadyCard r={r} compact={compact} />;
  const label = (text: string) => <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide opacity-60">{text}</p>;
  const chips = (sticky: boolean) => (
    <div className={cn('flex gap-2 overflow-x-auto py-2', sticky && 'sticky top-0 z-10 -mx-5 bg-[var(--background)] px-5')}>
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
      {picture(104)}
      <div>
        {nameButton('text-[34px] leading-tight')}
        <div className="mt-2">{factRow}</div>
      </div>
      <div>
        {label('Ready to go?')}
        {ready()}
      </div>
      {onThisPage}
    </div>
  );
  const railB = (
    <div className="sticky top-4 flex flex-col gap-2 self-start">
      {label('Garage')}
      {home.vehicles.map((x) => {
        const open = x.id === v.id;
        const rx = readiness(x, home.now);
        return (
          <div key={x.id} className={cn('rounded-[22px] transition-colors', open ? 'bg-[var(--surface)] p-3' : '')}>
            <Button variant="ghost" onPress={() => setId(x.id)} aria-pressed={open} className="h-auto w-full min-w-0 justify-start gap-3 rounded-2xl px-2 py-2 text-left text-[var(--foreground)]">
              <span className="w-16 shrink-0">
                <VehicleArt v={x} size={28} stage />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[16px] font-semibold">{x.name}</span>
                <span className="block truncate text-[13px]" style={{ color: TONE[rx.tone] }}>
                  {rx.title}
                </span>
              </span>
            </Button>
            {open ? (
              <div className="mt-2 flex flex-col gap-3 px-1">
                {picture(92)}
                {factRow}
                {ready(true)}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
  const big = [
    { k: 'Charge', v: v.level !== null ? `${v.level}%` : '—' },
    { k: 'Range', v: rangeText(v) ?? '—' },
    { k: v.security.locked === null ? 'Doors' : v.security.locked ? 'Locked' : 'Unlocked', v: v.security.locked === null ? '—' : v.security.locked ? '✓' : '!' }
  ];
  const railC = (
    <div className="sticky top-4 flex flex-col gap-4 self-start">
      <div className="relative">
        {picture(128)}
        <div className="absolute inset-x-4 top-3">{nameButton('text-[28px]')}</div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {big.map((x) => (
          <div key={x.k} className="rounded-2xl bg-[var(--surface)] px-3 py-2.5">
            <p className="text-[22px] font-semibold tabular-nums tracking-[-0.02em]" style={x.v === '!' ? { color: TONE.warn } : undefined}>
              {x.v}
            </p>
            <p className="text-[12px] opacity-60">{x.k}</p>
          </div>
        ))}
      </div>
      {ready(true)}
      {chips(false)}
    </div>
  );
  const rail = picks.rail === 'B' ? railB : picks.rail === 'C' ? railC : railA;

  // ---- Phone header ----
  const compactHeader = (
    <div className="flex items-center gap-3">
      <div className="w-24 shrink-0">{picture(40)}</div>
      <div className="min-w-0 flex-1">
        {nameButton('text-[24px]')}
        <p className="truncate text-[14px] font-semibold" style={{ color: TONE[r.tone] }}>
          {r.title}
        </p>
        <p className="truncate text-[12px] opacity-60">{r.detail}</p>
      </div>
    </div>
  );
  const phoneHeader =
    picks.phone === 'A' ? (
      <div className="flex flex-col gap-4">
        {picture(110)}
        <div>
          {nameButton('text-[30px]')}
          <div className="mt-2">{factRow}</div>
        </div>
        {ready()}
      </div>
    ) : (
      compactHeader
    );
  const charging = v.charging?.state === 'charging';
  const dock =
    picks.phone === 'C' ? (
      <div className="sticky bottom-0 z-10 -mx-5 mt-4 flex items-center gap-2 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-5 py-3 backdrop-blur-md">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: TONE[r.tone] }} />
        <p className="min-w-0 flex-1 truncate text-[14px] font-semibold">{r.title}</p>
        {v.security.locked !== null ? <GuardedLockButton name={v.name} locked={!!v.security.locked} available={has(v, v.security.locked ? 'unlock' : 'lock')} onLock={() => act(v.id)({ type: 'lock' })} onUnlock={() => act(v.id)({ type: 'unlock' })} compact /> : null}
        {v.climate && has(v, 'climate') ? (
          <Button isIconOnly size="sm" variant={v.climate.running ? 'primary' : 'secondary'} aria-label={v.climate.running ? 'Stop remote start' : 'Remote start'} aria-pressed={v.climate.running} onPress={() => act(v.id)({ type: 'climate', on: !v.climate!.running })} className="size-9 min-w-0 rounded-full">
            <HugeiconsIcon icon={EngineIcon} size={16} />
          </Button>
        ) : null}
        {v.charging?.plugged && has(v, charging ? 'charge-pause' : 'charge-start') ? (
          <Button isIconOnly size="sm" variant={charging ? 'primary' : 'secondary'} aria-label={charging ? 'Pause charging' : 'Start charging'} aria-pressed={charging} onPress={() => act(v.id)({ type: 'charge', on: !charging })} className="size-9 min-w-0 rounded-full">
            <HugeiconsIcon icon={charging ? PauseIcon : ElectricPlugsIcon} size={16} />
          </Button>
        ) : null}
      </div>
    ) : null;

  // ---- Content: the views ----
  const viewSwitch =
    picks.sections === 'B' ? (
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
        <span style={{ color: TONE[r.tone] }}>{r.title}.</span> <span className="font-normal opacity-60">{r.detail}</span>
      </p>
      {nowTiles.length ? grid(drawn(nowTiles)) : <p className="text-[15px] opacity-60">Nothing on, nothing to check.</p>}
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
          <span className="text-[19px] font-semibold">{x.title}</span>
          <span className="text-[15px] opacity-60">{x.summary}</span>
          {picks.sections === 'C' && why[x.id] ? (
            <span className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }}>
              First: {why[x.id]}
            </span>
          ) : null}
        </h3>
        {grid(x.body)}
      </section>
    ))
  );
  const topBar = (
    <div className="flex items-center justify-between gap-2">
      {viewSwitch}
      <div className="flex items-center gap-3 text-[14px] opacity-80">
        {!phone ? (
          <span className="inline-flex items-center gap-1.5">
            <HugeiconsIcon icon={GridViewIcon} size={16} /> All vehicles
          </span>
        ) : null}
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
          const c = p.concepts.find((x) => x.id === picks[p.id])!;
          return (
            <article key={p.id} className="flex flex-col gap-2 rounded-2xl bg-default/40 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">{p.title}</h3>
                <span className="text-[11px] text-muted">{p.chosen ? `Chosen: ${p.chosen}` : `Recommended: ${p.recommended}`}</span>
              </div>
              <Pick label={p.job} value={picks[p.id]} options={p.concepts.map((x) => ({ id: x.id, text: `${x.id} · ${x.name}` }))} onChange={(x) => setPick(p.id, x)} />
              <p className="text-xs">{c.idea}</p>
              <p className="text-[11px] text-muted">
                + {c.strengths.join('; ')} · − {c.tradeoffs.join('; ')}
              </p>
            </article>
          );
        })}
      </div>
      <p className="text-xs text-muted">
        {PAGE_PARTS.map((p) => `${p.title}: ${p.why}`).join(' ')}
      </p>
      <div className="flex flex-wrap items-end gap-4">
        <Pick
          label="Moment"
          value={stateId}
          options={STUDIO_MOBILITY_STATES.map((x) => ({ id: x.id, text: x.label }))}
          onChange={(next) => {
            setStateId(next);
            setHome(studioMobilityHome(next));
            setId('ford');
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
        <div className="pro rounded-2xl bg-[var(--background)] text-foreground" data-page="mobility" style={phone ? { width: 375 } : { width: 1240 }}>
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
