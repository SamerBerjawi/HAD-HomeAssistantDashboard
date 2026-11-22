/**
 * Switches concept C — Innovative ("power share"). One bar shows where the power goes: each
 * switch that is on takes a slice as wide as what it draws, in its own colour; tap a slice's
 * legend to switch it. Small: total + bar. Wide: total, bar, top three. Tall/Large: bar + every
 * switch with its share and a switch. A single switch (the room page's one widget per switch)
 * shows its name, On/Off with what it draws, and its switch (`OneSwitch`).
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlugSocketIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { WidgetSize } from '../../../lib/overviewLayout';
import type { ProControlDomainModel, ProControlItem } from '../../../lib/overviewControls';
import { ToggleSwitch } from '../../controls/ControlParts';
import { useControlActions } from '../../controls/useControlActions';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { byPower, SHARE_COLORS, watts } from './shared';

/** One switch: plug tile, name, state and watts, and its switch; the plug lights in the share colour. */
function OneSwitch({ i, size, actions }: { i: ProControlItem; size: WidgetSize; actions: ReturnType<typeof useControlActions> }) {
  const draws = i.isOn && (i.powerWatts ?? 0) > 0;
  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
      <span
        className={cn('grid size-9 place-items-center rounded-full', i.isOn ? 'text-white' : 'bg-default text-muted')}
        style={i.isOn ? { background: SHARE_COLORS[0] } : undefined}
      >
        <HugeiconsIcon icon={PlugSocketIcon} size={17} />
      </span>
      <div className="mt-auto flex min-w-0 items-end justify-between gap-2">
        <div className="min-w-0">
          <p className={cn('line-clamp-2 break-words font-semibold leading-tight', size === 's' ? 'text-sm' : 'text-base')}>{i.name}</p>
          <p className={cn('mt-0.5 text-xs tabular-nums', i.isOn ? '' : 'text-muted')}>
            {i.isOn ? 'On' : 'Off'}
            {draws ? <span className="font-semibold"> · {watts(i.powerWatts ?? 0)}</span> : null}
          </p>
        </div>
        <ToggleSwitch isSelected={i.isOn} onChange={() => actions.toggleItem(i)} label={`${i.name}, ${i.isOn ? 'on' : 'off'}`} />
      </div>
    </div>
  );
}

export default function SwitchesConceptC({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProControlDomainModel>) {
  const actions = useControlActions(m);
  const sorted = byPower(m);
  const drawing = sorted.filter((i) => i.isOn && (i.powerWatts ?? 0) > 0);
  const total = drawing.reduce((s, i) => s + (i.powerWatts ?? 0), 0);
  const colorOf = (id: string) =>
    SHARE_COLORS[
      Math.max(
        0,
        drawing.findIndex((d) => d.entityId === id)
      ) % SHARE_COLORS.length
    ];
  const anyOn = m.onCount > 0;

  const bar = (
    <div
      className={cn('flex w-full overflow-hidden rounded-full bg-default', size === 's' ? 'h-3' : 'h-4')}
      role="img"
      aria-label={drawing.length ? `Power: ${drawing.map((d) => `${d.shortName} ${watts(d.powerWatts ?? 0)}`).join(', ')}` : 'No power drawn'}
    >
      {drawing.map((d) => (
        <span
          key={d.entityId}
          className="h-full border-r-2 border-[var(--surface)] last:border-r-0"
          style={{ width: `${((d.powerWatts ?? 0) / (total || 1)) * 100}%`, background: colorOf(d.entityId) }}
        />
      ))}
    </div>
  );
  const head = (
    <div className="min-w-0 pr-8">
      <p className="text-2xl font-semibold leading-none tabular-nums">{total > 0 ? watts(total) : `${m.onCount} on`}</p>
      <p className="mt-1 truncate text-xs text-muted">{total > 0 ? `from ${drawing.length} of ${m.onCount} on` : anyOn ? 'no power data' : 'All off'}</p>
    </div>
  );

  return (
    <WidgetSurface label="Switches" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Switches" onPress={onOpenDetails} />
      {m.totalCount === 1 && m.items[0] ? <OneSwitch i={m.items[0]} size={size} actions={actions} /> : null}
      <div className={cn('flex h-full min-h-0 flex-col gap-2.5 p-3.5', m.totalCount === 1 && 'hidden')}>
        {m.totalCount === 0 ? (
          <div className="mt-auto flex flex-col gap-1 text-muted">
            <HugeiconsIcon icon={PlugSocketIcon} size={22} />
            <p className="text-sm font-medium">No switches</p>
          </div>
        ) : null}
        {m.totalCount > 0 ? head : null}
        {m.totalCount > 0 ? bar : null}
        {m.totalCount > 0 && size === 's' ? (
          <div className="mt-auto flex justify-end">
            <ToggleSwitch isSelected={anyOn} onChange={(on) => void actions.toggleAll(on)} label={anyOn ? 'Turn all switches off' : 'Turn all switches on'} />
          </div>
        ) : null}
        {m.totalCount > 0 && size === 'w' ? (
          <ul aria-label="Switches" className="mt-auto grid grid-cols-3 gap-1.5">
            {sorted.slice(0, 3).map((i) => (
              <li key={i.entityId} className="min-w-0">
                <Button
                  variant="ghost"
                  onPress={() => actions.toggleItem(i)}
                  aria-label={`${i.name}, ${i.isOn ? 'on' : 'off'}. Switch ${i.isOn ? 'off' : 'on'}`}
                  className={cn('h-auto w-full min-w-0 justify-start gap-1.5 rounded-lg bg-default/50 px-2 py-1 text-left', !i.isOn && 'opacity-60')}
                >
                  <span className="size-2 shrink-0 rounded-full" style={{ background: i.isOn && i.powerWatts ? colorOf(i.entityId) : 'var(--muted)' }} />
                  <span className="truncate text-xs">{i.shortName}</span>
                </Button>
              </li>
            ))}
          </ul>
        ) : null}
        {m.totalCount > 0 && (size === 't' || size === 'l') ? (
          <ul aria-label="Switches" className={cn('mt-auto', size === 'l' ? 'grid grid-cols-2 gap-x-4' : 'flex flex-col')}>
            {sorted.slice(0, size === 'l' ? 6 : 4).map((i) => (
              <li key={i.entityId} className="flex min-w-0 items-center gap-2 py-1">
                <span className="size-2 shrink-0 rounded-full" style={{ background: i.isOn && i.powerWatts ? colorOf(i.entityId) : 'var(--muted)' }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{i.shortName}</span>
                  <span className="block truncate text-xs text-muted tabular-nums">
                    {i.isOn ? (i.powerWatts ? `${watts(i.powerWatts)} · ${Math.round((i.powerWatts / (total || 1)) * 100)}%` : 'On') : 'Off'}
                  </span>
                </span>
                <ToggleSwitch isSelected={i.isOn} onChange={() => actions.toggleItem(i)} label={`${i.name}, ${i.isOn ? 'on' : 'off'}`} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
