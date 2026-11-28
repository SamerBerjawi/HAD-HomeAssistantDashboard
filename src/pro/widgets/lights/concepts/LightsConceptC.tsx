/**
 * Lighting concept C — Innovative ("light map"). Every light is a dot that glows at its own
 * brightness, grouped by room, so the card is a small map of where the light is. Tapping a dot
 * switches that light. Small: all dots + count. Wide: a column of dots per room. Tall/Large:
 * a row per room (name, dots, level).
 */
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils';
import type { ProControlDomainModel, ProControlItem } from '../../../lib/overviewControls';
import { ToggleSwitch } from '../../controls/ControlParts';
import { useControlActions } from '../../controls/useControlActions';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { lightRooms } from './rooms';

function Dot({ item, onPress, size = 22 }: { item: ProControlItem; onPress: () => void; size?: number }) {
  const level = item.isOn ? (item.brightnessPct ?? 100) / 100 : 0;
  return (
    <Button
      isIconOnly
      variant="ghost"
      onPress={onPress}
      aria-label={`${item.name}, ${item.isOn ? `on${item.brightnessPct ? ` ${item.brightnessPct}%` : ''}` : 'off'}`}
      className="min-w-0 rounded-full p-0"
      style={{ width: size, height: size }}
    >
      <span
        className={cn('block rounded-full transition-[background,box-shadow]', !item.isOn && 'bg-default ring-1 ring-[var(--separator,rgba(127,127,127,0.25))]')}
        style={{
          width: size - 6,
          height: size - 6,
          ...(item.isOn
            ? {
                background: `radial-gradient(circle at 35% 35%, hsl(48 100% ${82 - level * 12}%), hsl(36 100% ${58 - level * 6}%))`,
                boxShadow: `0 0 ${4 + level * 12}px hsl(38 100% 58% / ${0.35 + level * 0.5})`
              }
            : {})
        }}
      />
    </Button>
  );
}

export default function LightsConceptC({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProControlDomainModel>) {
  const actions = useControlActions(m);
  const rooms = lightRooms(m);
  const anyOn = m.onCount > 0;
  const allSwitch = <ToggleSwitch isSelected={anyOn} onChange={(on) => void actions.toggleAll(on)} label={anyOn ? 'Turn all lights off' : 'Turn all lights on'} tone="warning" />;
  const count = (
    <p className="text-2xl font-semibold leading-none tabular-nums">
      {m.onCount}
      <span className="text-sm font-normal text-muted"> of {m.totalCount} on</span>
    </p>
  );

  return (
    <WidgetSurface label="Lighting" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Lighting" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {size === 's' ? (
          <>
            <ul aria-label="Lights" className="flex flex-wrap gap-0.5 pr-8">
              {m.items.slice(0, 12).map((i) => (
                <li key={i.entityId}>
                  <Dot item={i} onPress={() => actions.toggleItem(i)} />
                </li>
              ))}
            </ul>
            <div className="mt-auto flex items-end justify-between gap-2">
              {count}
              {allSwitch}
            </div>
          </>
        ) : null}

        {size === 'w' ? (
          <div className="flex h-full min-w-0 gap-3">
            <div className="flex shrink-0 flex-col justify-between">
              {count}
              {allSwitch}
            </div>
            <ul aria-label="Rooms" className="flex min-w-0 flex-1 items-end justify-around gap-1 pt-6">
              {rooms.slice(0, 5).map((r) => (
                <li key={r.name} className="flex min-w-0 flex-col items-center gap-0.5">
                  <span className="flex flex-col-reverse items-center">
                    {r.items.slice(0, 3).map((i) => (
                      <Dot key={i.entityId} item={i} onPress={() => actions.toggleItem(i)} />
                    ))}
                  </span>
                  <span className="max-w-12 truncate text-[10px] text-muted">{r.name.split(' ')[0]}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {size === 't' || size === 'l' ? (
          <>
            <div className="flex items-center justify-between gap-2 pr-8">{count}</div>
            <ul aria-label="Rooms" className={cn('mt-auto flex flex-col', size === 'l' ? 'gap-1.5' : 'gap-1')}>
              {rooms.slice(0, 6).map((r) => (
                <li key={r.name} className="flex min-w-0 items-center gap-2">
                  <span className={cn('shrink-0 truncate text-xs', size === 'l' ? 'w-24 text-sm' : 'w-16', r.onCount > 0 ? 'font-medium' : 'text-muted')}>{r.name}</span>
                  <span className="flex min-w-0 flex-1 flex-wrap">
                    {r.items.slice(0, size === 'l' ? 8 : 3).map((i) => (
                      <Dot key={i.entityId} item={i} onPress={() => actions.toggleItem(i)} size={size === 'l' ? 28 : 22} />
                    ))}
                  </span>
                  {size === 'l' ? <span className="w-9 text-right text-xs tabular-nums text-muted">{r.onCount > 0 ? `${r.level}%` : 'off'}</span> : null}
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between text-xs text-muted">
              All lights
              {allSwitch}
            </div>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
