/**
 * Fans concept A — Refined & minimal. How many are running and how fast, then quiet rows with
 * switches. Small: count + all. Wide: count | running fans with speed. Tall/Large: rows.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Fan01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProFansModel } from '../../../lib/overviewAppliances';
import { ToggleSwitch } from '../../controls/ControlParts';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { useFanActions } from '../useFanActions';

export default function FansConceptA({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProFansModel>) {
  const actions = useFanActions(m);
  const anyOn = m.onCount > 0;
  const all = <ToggleSwitch isSelected={anyOn} onChange={(on) => void actions.toggleAll(on)} label={anyOn ? 'Turn all fans off' : 'Turn all fans on'} />;
  const headline = (big?: boolean) => (
    <div className="min-w-0">
      <p className={cn('font-extralight leading-none tracking-tighter tabular-nums', big ? 'text-[56px]' : 'text-[46px]')}>
        {m.onCount}
        <span className="ml-1 text-base font-normal tracking-normal text-muted">/{m.totalCount}</span>
      </p>
      <p className="mt-1 line-clamp-2 text-xs leading-tight text-muted">{anyOn ? `running${m.avgSpeedPct !== null ? ` · ${m.avgSpeedPct}%` : ''}` : 'All off'}</p>
    </div>
  );
  return (
    <WidgetSurface label="Fans" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Fans" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {m.totalCount === 0 ? (
          <div className="mt-auto flex flex-col gap-1 text-muted">
            <HugeiconsIcon icon={Fan01Icon} size={22} />
            <p className="text-sm font-medium">No fans</p>
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
            <ul aria-label="Fans" className="mt-7 flex min-w-0 flex-1 flex-col justify-end divide-y divide-[var(--separator,rgba(127,127,127,0.18))]">
              {m.items.slice(0, 3).map((f) => (
                <li key={f.entityId} className="flex items-center gap-2 py-1 text-xs">
                  <span className="min-w-0 flex-1 truncate">{f.roomName}</span>
                  <span className="tabular-nums text-muted">{f.isOn ? `${f.percentage}%` : 'off'}</span>
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
            <ul aria-label="Fans" className={cn('mt-auto', size === 'l' ? 'grid grid-cols-2 gap-x-4' : 'flex flex-col divide-y divide-[var(--separator,rgba(127,127,127,0.18))]')}>
              {m.items.slice(0, size === 'l' ? 6 : 3).map((f) => (
                <li key={f.entityId} className="flex min-w-0 items-center gap-2 py-1">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{f.roomName}</span>
                    <span className="block truncate text-xs text-muted">{f.isOn ? `${f.percentage}%${f.oscillating ? ' · oscillating' : ''}` : 'Off'}</span>
                  </span>
                  <ToggleSwitch isSelected={f.isOn} onChange={() => actions.toggleFan(f)} label={`${f.name}, ${f.isOn ? 'on' : 'off'}`} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
