/**
 * The Mobility page in the Room page's layout (owner, 2026-11-27; docs/pro-ui/VEHICLE_TILES.md),
 * built from the Vehicle Tiles Studio's picks: each part a tile (batches 1–5 and 7, the chosen
 * concept), the Garage rail (batch 6 B: every vehicle, the open one with its picture, facts and
 * readiness), sections in Moment order (C: what needs a look or is running comes first, with why)
 * and on phones a compact header with a bottom dock (C: readiness, lock, remote start, charge).
 * A part a vehicle's kind has but its model reports nothing for draws itself greyed.
 */
import { useState, type ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ElectricPlugsIcon, EngineIcon, PauseIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ChosenTile } from '../../../areas/tiles/chosenTiles';
import type { TileSize } from '../../../areas/tileTypes';
import { GRID, SPAN } from '../../../areas/page/RoomGrid';
import { GuardedLockButton } from '../../../areas/tiles/security/LockTiles';
import { has, readiness, type MobilityAction, type MobilityHome, type Vehicle } from '../../../lib/mobilityHome';
import { TONE, VehicleArt } from '../home/parts';
import { chargingWords, partApplies } from '../tiles/vehicleTileKit';
import { VEHICLE_TYPES, type VehicleTileType } from '../tiles/studio/vehicleCatalog';
import { roomStandIns } from '../tiles/studio/roomStandIns';
import { FactRow, momentWhy, ReadyCard, VehicleStage } from './vehiclePageKit';

const chosen = (t: VehicleTileType) => (t.concepts.find((c) => c.id === t.chosen) ?? t.concepts.find((c) => c.id === t.recommended)!).Component;
const parts = (v: Vehicle, batch: number) => VEHICLE_TYPES.filter((t) => t.batch === batch && partApplies(t.id, v));
const byIds = (v: Vehicle, ids: VehicleTileType['id'][]) => ids.map((id) => VEHICLE_TYPES.find((t) => t.id === id)!).filter((t) => partApplies(t.id, v));
const label = (text: string) => <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{text}</p>;

interface Section {
  id: string;
  title: string;
  summary: string;
  body: ReactNode[];
}

export default function VehiclePage({ home, width, act }: { home: MobilityHome; width: number; act: (vehicleId: string, a: MobilityAction) => void }) {
  const [id, setId] = useState(home.vehicles[0]?.id ?? '');
  const v = home.vehicles.find((x) => x.id === id) ?? home.vehicles[0];
  if (!v) return null;
  const phone = width < 640;
  const railed = width >= 860;
  const r = readiness(v, home.now);
  const actOn = (a: MobilityAction) => act(v.id, a);

  // Sizes on the Room grid (Small 1×1, Wide 2×1); on the phone's two columns the pairs go wide.
  const SIZE: Record<VehicleTileType['id'], TileSize> = { battery: 'w', charging: phone ? 'w' : 's', limit: phone ? 'w' : 's', climate: 'w', temp: 's', extras: 's', doors: 's', alarm: 's', openings: 'w', location: 'w', today: 's', trip: 's', tyres: 's', health: 's', software: 's', warnings: 's', distance: 'w', efficiency: phone ? 'w' : 's', sessions: phone ? 'w' : 's', allowance: 'w' };
  const drawn = (list: readonly VehicleTileType[]) =>
    list.map((t) => {
      const C = chosen(t);
      return (
        <li key={t.id} className={cn('min-w-0', SPAN[SIZE[t.id]])}>
          <C v={v} size={SIZE[t.id]} act={actOn} now={home.now} />
        </li>
      );
    });
  const odometer = roomStandIns(v).where.map((it) => (
    <li key={it.key} className={cn('min-w-0', SPAN[it.size])}>
      <ChosenTile e={it.model} size={it.size} act={() => {}} />
    </li>
  ));
  const last = v.history?.months.at(-1);
  const sections: Section[] = [
    { id: 'energy', title: 'Energy', summary: v.charging ? chargingWords(v).word : v.level !== null ? `${v.level}%` : '', body: drawn(parts(v, 1)) },
    { id: 'cabin', title: v.climate?.remoteStart ? 'Remote start' : 'Cabin', summary: v.climate ? (v.climate.running ? `On, ${v.climate.target}°` : 'Off') : '', body: drawn(parts(v, 2)) },
    // Doors and alarm first so two Smalls share a row on phone, Openings (Wide) under them.
    { id: 'security', title: 'Security', summary: v.security.locked === false ? 'Unlocked' : v.security.open.length ? `${v.security.open.length} open` : 'All closed', body: drawn(byIds(v, ['doors', 'alarm', 'openings'])) },
    { id: 'where', title: 'Where', summary: v.motion?.moving ? 'Driving' : v.place?.zone ?? 'Away', body: [...drawn(parts(v, 4)), ...odometer] },
    { id: 'condition', title: 'Condition', summary: r.checks.some((c) => c.tone === 'warn' || c.tone === 'bad') ? 'Needs a look' : 'All fine', body: drawn(parts(v, 5)) },
    { id: 'stats', title: 'Statistics', summary: last ? `${Math.round(last.distance).toLocaleString()} ${v.unit} this month` : '', body: drawn(parts(v, 7)) }
  ].filter((s) => s.body.length);
  const why = momentWhy(v);
  const ordered = [...sections].sort((a, b) => (why[a.id] ? 0 : 1) - (why[b.id] ? 0 : 1));
  const goTo = (sid: string) => document.getElementById(`vehicle-${sid}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const content = (
    <div className="@container flex min-w-0 flex-1 flex-col gap-7">
      {ordered.map((x) => (
        <section key={x.id} id={`vehicle-${x.id}`} aria-label={x.title} className="flex scroll-mt-32 flex-col gap-3">
          <h2 className="flex items-baseline gap-2.5 px-1">
            <span className="text-[19px] font-semibold">{x.title}</span>
            <span className="truncate text-[15px] opacity-60">{x.summary}</span>
            {why[x.id] ? (
              <span className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }}>
                First: {why[x.id]}
              </span>
            ) : null}
          </h2>
          <ul className={GRID} style={{ gridAutoRows: '68px' }}>
            {x.body}
          </ul>
        </section>
      ))}
    </div>
  );

  if (railed) {
    return (
      <div className="flex items-start gap-6 pb-8">
        <aside aria-label="Garage" className="sticky top-[72px] flex max-h-[calc(100vh-88px)] w-[248px] shrink-0 flex-col gap-2 overflow-y-auto [scrollbar-width:thin]">
          {label('Garage')}
          {home.vehicles.map((x) => {
            const open = x.id === v.id;
            const rx = readiness(x, home.now);
            return (
              <div key={x.id} className={cn('rounded-[22px] transition-colors', open && 'bg-[var(--surface)] p-3')}>
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
                    <VehicleStage v={x} px={92} />
                    <FactRow v={x} />
                    <ReadyCard r={rx} compact />
                  </div>
                ) : null}
              </div>
            );
          })}
        </aside>
        {content}
      </div>
    );
  }

  // Phone and narrow tablet: a compact header, the sections as sticky chips, the dock at the bottom.
  const i = home.vehicles.indexOf(v);
  const several = home.vehicles.length > 1;
  const charging = v.charging?.state === 'charging';
  return (
    <div className="flex flex-col gap-3">
      <header className="flex items-center gap-3">
        <div className="w-24 shrink-0">
          <VehicleStage v={v} px={40} />
        </div>
        <div className="min-w-0 flex-1">
          {several ? (
            <Button variant="ghost" className="h-auto min-w-0 gap-1.5 rounded-xl px-0 text-left text-[var(--foreground)] data-[hovered=true]:bg-transparent" onPress={() => setId(home.vehicles[(i + 1) % home.vehicles.length].id)} aria-label={`${v.name}: switch to ${home.vehicles[(i + 1) % home.vehicles.length].name}`}>
              <span className="truncate text-[24px] font-semibold tracking-[-0.03em]">{v.name}</span>
              <HugeiconsIcon icon={ArrowDown01Icon} size={18} className="shrink-0 opacity-60" />
            </Button>
          ) : (
            <p className="truncate text-[24px] font-semibold tracking-[-0.03em]">{v.name}</p>
          )}
          <p className="truncate text-[14px] font-semibold" style={{ color: TONE[r.tone] }}>
            {r.title}
          </p>
          <p className="truncate text-[12px] opacity-60">{r.detail}</p>
        </div>
      </header>
      <nav aria-label="On this page" className="sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto bg-[var(--background)]/85 px-4 py-2 backdrop-blur-md [scrollbar-width:none]">
        {ordered.map((x) => (
          <Button key={x.id} size="sm" variant="secondary" onPress={() => goTo(x.id)} className="h-8 shrink-0 rounded-full px-3 text-[13px]">
            {x.title}
          </Button>
        ))}
      </nav>
      {content}
      {/* Above the app's floating tab bar. */}
      <div className="sticky bottom-[88px] z-10 -mx-1 mt-2 flex items-center gap-2 rounded-full bg-[color-mix(in_srgb,var(--surface)_88%,transparent)] py-2 pl-4 pr-2 shadow-lg backdrop-blur-md">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: TONE[r.tone] }} />
        <p className="min-w-0 flex-1 truncate text-[14px] font-semibold">{r.title}</p>
        {v.security.locked !== null ? <GuardedLockButton name={v.name} locked={!!v.security.locked} available={has(v, v.security.locked ? 'unlock' : 'lock')} onLock={() => actOn({ type: 'lock' })} onUnlock={() => actOn({ type: 'unlock' })} compact /> : null}
        {v.climate && has(v, 'climate') ? (
          <Button isIconOnly size="sm" variant={v.climate.running ? 'primary' : 'secondary'} aria-label={v.climate.running ? 'Stop remote start' : 'Remote start'} aria-pressed={v.climate.running} onPress={() => actOn({ type: 'climate', on: !v.climate!.running })} className="size-9 min-w-0 rounded-full">
            <HugeiconsIcon icon={EngineIcon} size={16} />
          </Button>
        ) : null}
        {v.charging?.plugged && has(v, charging ? 'charge-pause' : 'charge-start') ? (
          <Button isIconOnly size="sm" variant={charging ? 'primary' : 'secondary'} aria-label={charging ? 'Pause charging' : 'Start charging'} aria-pressed={charging} onPress={() => actOn({ type: 'charge', on: !charging })} className="size-9 min-w-0 rounded-full">
            <HugeiconsIcon icon={charging ? PauseIcon : ElectricPlugsIcon} size={16} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
