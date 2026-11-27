/**
 * The Mobility page in the Room page's layout (owner, 2026-11-27; docs/pro-ui/VEHICLE_TILES.md):
 * the rail (the vehicle's picture, its name with the other vehicles, facts, readiness, on this
 * page) and the sections as tile grids with a summary in each heading. Energy, Cabin and Security use
 * the batch 1–3 picks (or the recommendations); the other sections use the Room page's chosen tiles as
 * stand-ins until their batch. Live: the controls change the sample.
 */
import { useMemo, useState } from 'react';
import { Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BatteryFullIcon,
  ElectricPlugsIcon,
  GridViewIcon,
  Notification03Icon,
  Route01Icon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  TemperatureIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ChosenTile } from '../../../../areas/tiles/chosenTiles';
import type { TileSize } from '../../../../areas/tileTypes';
import { applySampleAction, has, readiness, type MobilityAction, type MobilityHome, type Vehicle } from '../../../../lib/mobilityHome';
import { STUDIO_MOBILITY_STATES, studioMobilityHome, type StudioMobilityId } from '../../../../lib/mobility/sampleVehicles';
import { TONE, toneIcon, VehicleArt } from '../../home/parts';
import { chargingWords, rangeText } from '../vehicleTileKit';
import { VEHICLE_TYPES, type VehicleTileType } from './vehicleCatalog';
import { roomStandIns, type StandIn } from './roomStandIns';
import { readVehiclePicks } from './useVehiclePicks';

type Screen = 'phone' | 'desktop';

/** The Room page's grid: half rows of 68 px, 12 px gaps (Small = 148 px). */
const SPAN: Record<TileSize, string> = { xs: 'col-span-1 row-span-1', s: 'col-span-1 row-span-2', w: 'col-span-2 row-span-2', t: 'col-span-1 row-span-4', l: 'col-span-2 row-span-4' };

function conceptFor(t: VehicleTileType) {
  const p = t.chosen ?? readVehiclePicks()[t.id]?.concept;
  return t.concepts.find((c) => c.id === p) ?? t.concepts.find((c) => c.id === t.recommended)!;
}

function Fact({ icon, text, hue }: { icon: IconSvgElement; text: string; hue?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[15px]">
      <HugeiconsIcon icon={icon} size={17} style={hue ? { color: hue } : undefined} className={hue ? undefined : 'opacity-60'} />
      {text}
    </span>
  );
}

function facts(v: Vehicle) {
  const out: { icon: IconSvgElement; text: string; hue?: string }[] = [];
  if (v.level !== null) out.push({ icon: BatteryFullIcon, text: `${v.level}%`, hue: TONE.good });
  const r = rangeText(v);
  if (r) out.push({ icon: Route01Icon, text: r });
  if (v.security.locked !== null) out.push({ icon: v.security.locked ? SquareLock02Icon : SquareUnlock02Icon, text: v.security.locked ? 'Locked' : 'Unlocked', hue: v.security.locked ? undefined : TONE.warn });
  if (v.charging?.plugged) out.push({ icon: ElectricPlugsIcon, text: chargingWords(v).word, hue: v.charging.state === 'charging' ? TONE.good : undefined });
  if (v.climate?.cabin != null) out.push({ icon: TemperatureIcon, text: `${v.climate.cabin}° inside`, hue: v.climate.running ? 'hsl(22 95% 58%)' : undefined });
  return out;
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

export default function VehiclePageSim() {
  const [stateId, setStateId] = useState<StudioMobilityId>('charging');
  const [screen, setScreen] = useState<Screen>('desktop');
  const [dark, setDark] = useState(true);
  const [home, setHome] = useState<MobilityHome>(() => studioMobilityHome('charging'));
  const [id, setId] = useState('ford');
  const v = home.vehicles.find((x) => x.id === id) ?? home.vehicles[0];
  const act = (vid: string) => (a: MobilityAction) => setHome((h) => ({ ...h, vehicles: h.vehicles.map((x) => (x.id === vid ? applySampleAction(x, a) : x)) }));
  const r = readiness(v, home.now);
  const phone = screen === 'phone';
  const stand = useMemo(() => roomStandIns(v), [v]);
  const i = home.vehicles.indexOf(v);

  const batch1 = VEHICLE_TYPES.filter((t) => t.batch === 1);
  const energy = v.kind === 'car' && v.charging ? batch1 : batch1.filter((t) => t.id === 'battery');
  const cabin = v.climate ? VEHICLE_TYPES.filter((t) => t.batch === 2 && (t.id !== 'extras' || v.climate!.extras.length) && (t.id !== 'temp' || v.climate!.target !== null)) : [];
  const security = (['doors', 'alarm', 'openings'] as const)
    .filter((id) => (id === 'doors' ? v.security.locked !== null : id === 'openings' ? v.kind === 'car' : v.security.alarm !== null || v.kind === 'bike' || has(v, 'honk')))
    .map((id) => VEHICLE_TYPES.find((t) => t.id === id)!);
  const SIZE: Record<VehicleTileType['id'], TileSize> = { battery: 'w', charging: phone ? 'w' : 's', limit: phone ? 'w' : 's', climate: 'w', temp: 's', extras: 's', doors: 's', alarm: 's', openings: 'w' };
  const drawn = (list: readonly VehicleTileType[]) =>
    list.map((t) => {
      const C = conceptFor(t).Component;
      return (
        <div key={t.id} className={SPAN[SIZE[t.id]]}>
          <C v={v} size={SIZE[t.id]} act={act(v.id)} now={home.now} />
        </div>
      );
    });
  const sections: { id: string; title: string; summary: string; body: React.ReactNode; note?: string }[] = [
    {
      id: 'energy',
      title: 'Energy',
      summary: v.charging ? chargingWords(v).word : `${v.level ?? '—'}%`,
      body: drawn(energy)
    },
    { id: 'cabin', title: v.climate?.remoteStart ? 'Remote start' : 'Cabin', summary: v.climate ? (v.climate.running ? `On, ${v.climate.target}°` : 'Off') : '', body: drawn(cabin) },
    { id: 'security', title: 'Security', summary: v.security.locked === false ? 'Unlocked' : v.security.open.length ? `${v.security.open.length} open` : 'All closed', body: drawn(security) },
    { id: 'where', title: 'Where', summary: v.motion?.moving ? 'Driving' : v.place?.zone ?? 'Away', body: tiles(stand.where), note: 'Batch 4' },
    { id: 'condition', title: 'Condition', summary: r.checks.some((c) => c.tone === 'warn' || c.tone === 'bad') ? 'Needs a look' : 'All fine', body: tiles(stand.condition), note: 'Batch 5' }
  ].filter((s) => (Array.isArray(s.body) ? s.body.length : true));

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

  const rail = (
    <div className={cn('flex flex-col gap-4', !phone && 'sticky top-4 self-start')}>
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[26px]" style={{ background: 'radial-gradient(120% 90% at 50% 100%, color-mix(in oklab, var(--foreground) 10%, transparent), transparent 60%), linear-gradient(180deg, color-mix(in oklab, var(--foreground) 4%, var(--surface)), var(--surface))' }}>
        <span aria-hidden className="absolute bottom-[18%] left-1/2 h-4 w-[70%] -translate-x-1/2 rounded-[50%]" style={{ background: 'radial-gradient(closest-side, color-mix(in oklab, var(--foreground) 22%, transparent), transparent)' }} />
        <VehicleArt v={v} size={phone ? 110 : 104} stage />
      </div>
      <div>
        <Button variant="ghost" className="h-auto min-w-0 gap-1.5 rounded-xl px-0 text-left text-[var(--foreground)] data-[hovered=true]:bg-transparent" onPress={() => setId(home.vehicles[(i + 1) % home.vehicles.length].id)} aria-label={`${v.name}: switch vehicle`}>
          <span className={cn('font-semibold tracking-[-0.03em]', phone ? 'text-[30px]' : 'text-[34px] leading-tight')}>{v.name}</span>
          <HugeiconsIcon icon={ArrowDown01Icon} size={18} className="opacity-60" />
        </Button>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
          {facts(v).map((f) => (
            <Fact key={f.text} {...f} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide opacity-60">Ready to go?</p>
        <div className="flex items-center gap-3 rounded-[22px] p-3.5" style={{ background: `linear-gradient(150deg, color-mix(in srgb, ${TONE[r.tone]} 16%, var(--surface)), var(--surface) 80%)` }}>
          <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${TONE[r.tone]} 18%, transparent)`, color: TONE[r.tone] }}>
            <HugeiconsIcon icon={toneIcon(r.tone)} size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[17px] font-semibold" style={{ color: TONE[r.tone] }}>
              {r.title}
            </p>
            <p className="truncate text-[13px] opacity-70">{r.detail}</p>
          </div>
        </div>
      </div>
      {!phone ? (
        <nav aria-label="On this page">
          <p className="mb-1 text-[13px] font-semibold uppercase tracking-wide opacity-60">On this page</p>
          {sections.map((s) => (
            <p key={s.id} className="py-2 text-[15px]">
              {s.title} <span className="opacity-60">{s.summary}</span>
            </p>
          ))}
        </nav>
      ) : (
        <div className="flex gap-2 overflow-x-auto">
          {sections.map((s) => (
            <span key={s.id} className="shrink-0 rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] px-3 py-1.5 text-[13px]">
              {s.title}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section className="pro-surface flex flex-col gap-4 p-5">
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
        <p className="text-xs text-muted">Energy, Cabin and Security use the batch 1–3 choices (or your picks, else the recommendation). The other sections are the Room page’s tiles as stand-ins until their batch. Tap the name to switch vehicle.</p>
      </div>

      <div className={cn('overflow-x-auto', dark && 'dark')}>
        <div className="pro rounded-2xl bg-[var(--background)] p-5 text-foreground" data-page="mobility" style={phone ? { width: 375 } : { width: 1240 }}>
          <div className={cn('grid gap-8', phone ? 'grid-cols-1' : 'grid-cols-[300px_minmax(0,1fr)]')}>
            {rail}
            <div className="flex min-w-0 flex-col gap-7">
              <div className="flex items-center justify-between gap-2">
                <div className="flex rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)] p-1 text-[14px]">
                  <span className="rounded-full bg-[color-mix(in_oklab,var(--accent)_25%,transparent)] px-3 py-1 font-semibold text-[var(--accent)]">All</span>
                  <span className="px-3 py-1">Now · {r.checks.filter((c) => c.tone !== 'good').length}</span>
                </div>
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
              {sections.map((s) => (
                <section key={s.id} aria-label={s.title} className="flex flex-col gap-3">
                  <h3 className="flex items-baseline gap-2.5">
                    <span className="text-[19px] font-semibold">{s.title}</span>
                    <span className="text-[15px] opacity-60">{s.summary}</span>
                    {s.note ? <span className="ml-auto rounded-full border border-dashed border-current px-2 py-0.5 text-[10px] opacity-40">Room tiles · {s.note}</span> : null}
                  </h3>
                  <div className={cn('grid auto-rows-[68px] gap-3 [grid-auto-flow:dense]', phone ? 'grid-cols-2' : 'grid-cols-4')}>{s.body}</div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
