/**
 * Mobility round 1 · A · Cockpit (docs/pro-ui/MOBILITY.md §0): the classic Mobility layout you
 * like, reworked. Vehicles as pills on top. Desktop keeps classic's three columns: the vehicle
 * (picture, the answer, its checks, the controls, four key numbers), then charging and climate,
 * then where, trips and condition. Tablets put the vehicle across the top, phones stack it all.
 */
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { fmtDistance, readiness, type Vehicle } from '../../../../lib/mobilityHome';
import { ActionDock, Answer, Checks, sectionsFor, Stat, subtitle, VehicleArt, VehiclePills, type DesignProps } from './parts';

function keyNumbers(v: Vehicle) {
  return [
    v.range !== null ? { label: 'Range', value: fmtDistance(v.range, v.unit) } : null,
    v.level !== null ? { label: v.powertrain === 'ice' ? 'Fuel' : 'Charge', value: `${v.level}%` } : null,
    v.climate?.cabin != null ? { label: 'Inside', value: `${v.climate.cabin}°` } : v.lifetime?.co2SavedKg != null ? { label: 'CO₂ saved', value: `${v.lifetime.co2SavedKg} kg` } : null,
    v.odometer !== null ? { label: v.kind === 'bike' ? 'Ridden' : 'Odometer', value: fmtDistance(v.odometer, v.unit) } : null
  ].filter((x): x is { label: string; value: string } => x !== null);
}

export default function DesignA({ home, width, dark, act }: DesignProps) {
  const [id, setId] = useState(home.vehicles[0]?.id ?? '');
  const v = home.vehicles.find((x) => x.id === id) ?? home.vehicles[0];
  if (!v) return null;
  const r = readiness(v, home.now);
  const desk = width >= 1000;
  const phone = width < 640;
  const sections = sectionsFor(v);
  const p = { v, home, width, dark, act };
  const hero = (
    <section aria-label={v.name} className="pro-surface flex min-w-0 flex-col gap-5 rounded-[26px] p-5">
      <div className="flex items-center gap-4">
        <VehicleArt v={v} size={phone ? 64 : 84} />
        <div className="min-w-0">
          <h2 className="truncate text-xl font-light">{v.name}</h2>
          <p className="truncate text-sm text-muted">{subtitle(v)}</p>
        </div>
      </div>
      <Answer r={r} width={desk ? 420 : width} />
      <Checks r={r} />
      <ActionDock v={v} act={act} compact={phone} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[color-mix(in_oklab,var(--foreground)_10%,transparent)] pt-4">
        {keyNumbers(v).map((k) => (
          <Stat key={k.label} label={k.label} value={k.value} />
        ))}
      </div>
    </section>
  );
  const cols = desk
    ? [sections.filter((s) => s.id === 'charging' || s.id === 'battery' || s.id === 'climate'), sections.filter((s) => s.id === 'where' || s.id === 'trips' || s.id === 'condition')]
    : null;
  return (
    <div className="flex flex-col gap-5">
      <VehiclePills home={home} current={v.id} onPick={setId} />
      {desk && cols ? (
        <div className="grid grid-cols-3 items-start gap-4">
          {hero}
          {cols.map((col, i) => (
            <div key={i} className="flex min-w-0 flex-col gap-4">
              {col.map(({ id: sid, Block }) => (
                <Block key={sid} {...p} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className={cn('grid items-start gap-4', phone ? 'grid-cols-1' : 'grid-cols-2')}>
          <div className={cn(!phone && 'col-span-2')}>{hero}</div>
          {sections.map(({ id: sid, Block }) => (
            <Block key={sid} {...p} className={cn(!phone && sid === 'where' && 'row-span-2')} />
          ))}
        </div>
      )}
    </div>
  );
}
