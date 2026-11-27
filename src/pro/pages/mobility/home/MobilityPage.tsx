/**
 * Mobility round 1 · B · Ready check (docs/pro-ui/MOBILITY.md §0): built like the Security and
 * Energy pages. With more than one vehicle, Cockpit's (A) pills on top, each with a dot for its
 * answer (owner, 2026-11-26). Then one hero lit by the answer's tone (`Hero`; owner picked 2 · Picture, compact, in round 2), then the sections in a bento (one column on phones).
 */
import { useState, type ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { LifeContext, sectionsFor, VehiclePills, type DesignProps, type Life, type VehicleProps } from './parts';
import { HeroPicture, type HeroProps } from './heroConcepts';
import { ChargingTidy, ClimateTidy } from './chargeClimateConcepts';
import { DayOnMap } from './whereTripsConcepts';
import { BatteryPackCard, ConditionTop } from './conditionConcepts';

/** Round 3 pick (owner, 2026-11-26): 1 · Tidy cards. */
const TIDY: ChargeClimateSlot = { charging: ChargingTidy, climate: ClimateTidy };
/** Round 4 pick (owner, 2026-11-26): 2 · The day on the map. */
const DAY: WhereTripsSlot = { combined: DayOnMap };
/** Round 5 pick (owner, 2026-11-27): 2 · Top view, with the car's drive battery drawn as a pack too. */
const TOP: ConditionSlot = { condition: ConditionTop, battery: BatteryPackCard };

/** Round 5: Condition and the bike's Battery drawn another way; `merge` folds the bike's Battery into Condition. */
export interface ConditionSlot {
  condition?: ComponentType<VehicleProps & { className?: string }>;
  battery?: ComponentType<VehicleProps & { className?: string }>;
  merge?: boolean;
}

/** Round 3: Charging and Climate drawn another way, or one card in place of both (`combined`). */
export interface ChargeClimateSlot {
  charging?: ComponentType<VehicleProps & { className?: string }>;
  climate?: ComponentType<VehicleProps & { className?: string }>;
  combined?: ComponentType<VehicleProps & { className?: string }>;
}

/** Round 4: Where and Trips drawn another way, or one card in place of both. `short`: Where is not a tall map. */
export interface WhereTripsSlot {
  where?: ComponentType<VehicleProps & { className?: string }>;
  trips?: ComponentType<VehicleProps & { className?: string }>;
  combined?: ComponentType<VehicleProps & { className?: string }>;
  short?: boolean;
}

export default function DesignB({ home, width, dark, act, Hero = HeroPicture, cards = TIDY, places = DAY, health = TOP, life = 'ambient' }: DesignProps & { Hero?: ComponentType<HeroProps>; cards?: ChargeClimateSlot; places?: WhereTripsSlot; health?: ConditionSlot; life?: Life }) {
  const [id, setId] = useState(home.vehicles[0]?.id ?? '');
  const v = home.vehicles.find((x) => x.id === id) ?? home.vehicles[0];
  if (!v) return null;
  const phone = width < 640;
  const desk = width >= 1000;
  // A vehicle whose integration reports nothing has only its hero (which says so).
  const base = v.offline ? [] : sectionsFor(v);
  const combined = cards?.combined;
  const withCards = combined
    ? base.filter((x) => x.id !== 'climate').map((x) => (x.id === 'charging' ? { ...x, id: 'combined', Block: combined } : x))
    : base.map((x) => (x.id === 'charging' && cards?.charging ? { ...x, Block: cards.charging } : x.id === 'climate' && cards?.climate ? { ...x, Block: cards.climate } : x));
  const place = places?.combined;
  const withPlaces = place
    ? withCards.filter((x) => x.id !== 'trips').map((x) => (x.id === 'where' ? { ...x, id: 'place', Block: place } : x))
    : withCards.map((x) => (x.id === 'where' && places?.where ? { ...x, Block: places.where } : x.id === 'trips' && places?.trips ? { ...x, Block: places.trips } : x));
  const merged = !!health?.merge && v.kind === 'bike';
  const sections = withPlaces
    .filter((x) => !(merged && x.id === 'battery'))
    .map((x) => (x.id === 'condition' && health?.condition ? { ...x, Block: health.condition } : x.id === 'battery' && health?.battery ? { ...x, Block: health.battery } : x));
  const bike = v.kind === 'bike';
  const p = { v, home, width, dark, act, noRing: true };
  const span: Record<string, string> = desk
    ? { charging: 'col-span-4', combined: 'col-span-8', battery: bike ? 'col-span-6' : 'col-span-4', climate: 'col-span-4', where: places?.short ? 'col-span-4' : 'col-span-4 row-span-2', place: 'col-span-12', trips: 'col-span-4', condition: merged ? 'col-span-12' : bike ? 'col-span-6' : 'col-span-4' }
    : phone
    ? {}
    : { where: places?.short ? '' : 'col-span-2', combined: 'col-span-2', place: 'col-span-2', condition: bike && !merged ? '' : 'col-span-2' };
  return (
    <LifeContext.Provider value={life}>
    <div className="flex flex-col gap-5">
      <VehiclePills home={home} current={v.id} onPick={setId} />
      <Hero v={v} home={home} width={width} dark={dark} act={act} />
      <div className={cn('grid items-stretch gap-4 [grid-auto-flow:dense]', desk ? 'grid-cols-12' : phone ? 'grid-cols-1' : 'grid-cols-2')}>
        {sections.map(({ id: sid, Block }) => (
          <div key={sid} className={cn('min-w-0 [&>section]:h-full', span[sid])}>
            <Block {...p} />
          </div>
        ))}
      </div>
    </div>
    </LifeContext.Provider>
  );
}
