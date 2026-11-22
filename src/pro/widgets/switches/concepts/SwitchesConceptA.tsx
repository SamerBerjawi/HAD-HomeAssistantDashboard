/**
 * Switches concept A — Refined & minimal. How many are on and what they draw, then quiet rows
 * with switches. Small: count + power + all. Wide: count | the biggest consumers. Tall/Large: rows.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { PlugSocketIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProControlDomainModel } from '../../../lib/overviewControls';
import { ToggleSwitch } from '../../controls/ControlParts';
import { useControlActions } from '../../controls/useControlActions';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { byPower, watts } from './shared';

export default function SwitchesConceptA({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProControlDomainModel>) {
  const actions = useControlActions(m);
  const anyOn = m.onCount > 0;
  const all = <ToggleSwitch isSelected={anyOn} onChange={(on) => void actions.toggleAll(on)} label={anyOn ? 'Turn all switches off' : 'Turn all switches on'} />;
  const headline = (big?: boolean) => (
    <div className="min-w-0">
      <p className={cn('font-extralight leading-none tracking-tighter tabular-nums', big ? 'text-[56px]' : 'text-[46px]')}>
        {m.onCount}
        <span className="ml-1 text-base font-normal tracking-normal text-muted">/{m.totalCount}</span>
      </p>
      <p className="mt-1 truncate text-xs text-muted">{m.totalPowerWatts > 0 ? `on · ${watts(m.totalPowerWatts)} now` : anyOn ? 'on' : 'All off'}</p>
    </div>
  );
  const rows = (n: number) =>
    m.items.slice(0, n).map((i) => (
      <li key={i.entityId} className="flex min-w-0 items-center gap-2 py-1">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{i.shortName}</span>
          <span className="block truncate text-xs text-muted">{i.isOn && i.powerWatts ? `${i.roomName} · ${watts(i.powerWatts)}` : i.roomName}</span>
        </span>
        <ToggleSwitch isSelected={i.isOn} onChange={() => actions.toggleItem(i)} label={`${i.name}, ${i.isOn ? 'on' : 'off'}`} />
      </li>
    ));

  return (
    <WidgetSurface label="Switches" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Switches" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {m.totalCount === 0 ? (
          <div className="mt-auto flex flex-col gap-1 text-muted">
            <HugeiconsIcon icon={PlugSocketIcon} size={22} />
            <p className="text-sm font-medium">No switches</p>
          </div>
        ) : null}
        {m.totalCount > 0 && size === 's' ? (
          <div className="flex h-full flex-col justify-between">
            {headline()}
            <div className="flex justify-end">{all}</div>
          </div>
        ) : null}
        {m.totalCount > 0 && size === 'w' ? (
          <div className="flex h-full min-w-0 gap-4">
            <div className="flex flex-col justify-between">
              {headline()}
              {all}
            </div>
            <ul aria-label="Using power" className="mt-7 flex min-w-0 flex-1 flex-col justify-end divide-y divide-[var(--separator,rgba(127,127,127,0.18))]">
              {byPower(m)
                .slice(0, 3)
                .map((i) => (
                  <li key={i.entityId} className="flex items-center gap-2 py-1 text-xs">
                    <span className="min-w-0 flex-1 truncate">{i.shortName}</span>
                    <span className="tabular-nums text-muted">{i.isOn ? (i.powerWatts ? watts(i.powerWatts) : 'on') : 'off'}</span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
        {m.totalCount > 0 && (size === 't' || size === 'l') ? (
          <>
            <div className="flex items-end justify-between gap-2 pr-8">
              {headline(size === 'l')}
              {all}
            </div>
            <ul aria-label="Switches" className={cn('mt-auto', size === 'l' ? 'grid grid-cols-2 gap-x-4' : 'flex flex-col divide-y divide-[var(--separator,rgba(127,127,127,0.18))]')}>
              {rows(size === 'l' ? 6 : 3)}
            </ul>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
