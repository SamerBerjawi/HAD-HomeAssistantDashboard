/**
 * Mobility round 1 · C · Garage bays (docs/pro-ui/MOBILITY.md §0): the fleet first. Every car and
 * bike is a bay side by side (stacked on phones): its picture, charge, range and answer, so "is
 * everything ready?" reads across the whole garage at once. Choosing a bay opens its detail under
 * the bays, one section at a time in tabs (Charging, Climate, Where, Trips, Condition).
 */
import { useState } from 'react';
import { Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { fleetReadiness, readiness, type Vehicle } from '../../../../lib/mobilityHome';
import { ActionDock, ChargeRing, Checks, sectionsFor, subtitle, TONE, VehicleArt, type DesignProps } from './parts';

function Bay({ v, on, onPress, phone, now }: { v: Vehicle; on: boolean; onPress: () => void; phone: boolean; now: number }) {
  const r = readiness(v, now);
  return (
    <Button variant="ghost" aria-pressed={on} onPress={onPress} className="pro-surface h-auto min-w-0 w-full flex-col items-stretch gap-4 rounded-[26px] p-5 text-left data-[hovered=true]:bg-[var(--surface)]" style={on ? { boxShadow: '0 0 0 2px var(--accent)' } : undefined}>
      <span className="flex items-center gap-3">
        <VehicleArt v={v} size={phone ? 48 : 56} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-light">{v.name}</span>
          <span className="block truncate text-xs font-normal text-muted">{subtitle(v)}</span>
        </span>
        <ChargeRing v={v} size={phone ? 64 : 72} stroke={6} />
      </span>
      <span className="flex items-start gap-2">
        <span aria-hidden className="mt-2 size-2 shrink-0 rounded-full" style={{ background: TONE[r.tone] }} />
        <span className="min-w-0">
          <span className="block text-[19px] font-light leading-6 tracking-tight">{r.title}</span>
          <span className="block truncate text-xs font-normal text-muted">{r.detail}</span>
        </span>
      </span>
    </Button>
  );
}

export default function DesignC({ home, width, dark, act }: DesignProps) {
  const [id, setId] = useState(home.vehicles[0]?.id ?? '');
  const v = home.vehicles.find((x) => x.id === id) ?? home.vehicles[0];
  const sections = v ? sectionsFor(v) : [];
  const [tab, setTab] = useState(sections[0]?.id ?? '');
  if (!v) return null;
  const phone = width < 640;
  const fleet = fleetReadiness(home);
  const cur = sections.find((s) => s.id === tab) ?? sections[0];
  const r = readiness(v, home.now);
  const cols = phone ? 1 : Math.min(3, home.vehicles.length);
  return (
    <div className="flex flex-col gap-5">
      <div className="px-1">
        <p className="flex items-center gap-2 text-sm text-muted">
          <span aria-hidden className="size-2 rounded-full" style={{ background: TONE[fleet.worst?.r.tone ?? 'good'] }} />
          Garage
        </p>
        <h2 className={cn('mt-1 font-light tracking-tight', phone ? 'text-[26px] leading-8' : 'text-[34px] leading-10')}>
          {home.vehicles.length === 1 ? r.title : fleet.allReady ? 'Everything’s ready to go' : `${fleet.worst?.v.name}: ${fleet.worst?.r.title}`}
        </h2>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {home.vehicles.map((x) => (
          <Bay key={x.id} v={x} on={x.id === v.id} onPress={() => setId(x.id)} phone={phone} now={home.now} />
        ))}
      </div>
      <section aria-label={`${v.name} details`} className="flex flex-col gap-4">
        <div className={cn('flex gap-3', phone ? 'flex-col' : 'items-center justify-between')}>
          <Checks r={r} limit={4} />
          <ActionDock v={v} act={act} compact />
        </div>
        <ToggleButtonGroup
          aria-label={`${v.name} sections`}
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          className="overflow-x-auto [scrollbar-width:none]"
          selectedKeys={new Set([cur?.id ?? ''])}
          onSelectionChange={(k) => setTab(String([...k][0]))}
        >
          {sections.map((s) => (
            <ToggleButton key={s.id} id={s.id} className="shrink-0 gap-1.5">
              <HugeiconsIcon icon={s.icon} size={15} />
              {s.title}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {cur ? <cur.Block v={v} home={home} width={width} dark={dark} act={act} mapHeight={phone ? 200 : 280} /> : null}
      </section>
    </div>
  );
}
