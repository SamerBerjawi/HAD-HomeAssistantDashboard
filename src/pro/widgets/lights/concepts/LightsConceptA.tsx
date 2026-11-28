/**
 * Lighting concept A — Refined & minimal. Neutral surface; the number of lights on is the
 * headline, a single warm dot is the only colour. Small: count + all switch. Wide: count + the
 * brightest rooms. Tall: count + lights with switches. Large: count, average, two columns of lights.
 */
import type { ProControlDomainModel } from '../../../lib/overviewControls';
import { ToggleSwitch } from '../../controls/ControlParts';
import { useControlActions } from '../../controls/useControlActions';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { lightRooms } from './rooms';

function Headline({ m, big }: { m: ProControlDomainModel; big?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={big ? 'text-[60px] font-extralight leading-none tracking-tighter tabular-nums' : 'text-[48px] font-extralight leading-none tracking-tighter tabular-nums'}>
        {m.onCount}
        <span className="ml-1 text-base font-normal tracking-normal text-muted">/{m.totalCount}</span>
      </p>
      <p className="mt-1 flex items-center gap-1.5 truncate text-sm font-medium">
        <span
          className="size-2 shrink-0 rounded-full"
          style={{ background: m.onCount > 0 ? 'hsl(38 95% 55%)' : 'var(--muted)', boxShadow: m.onCount > 0 ? '0 0 8px hsl(38 95% 55% / 0.8)' : undefined }}
        />
        {m.onCount === 0 ? 'All off' : m.onCount === m.totalCount ? 'All on' : 'lights on'}
      </p>
    </div>
  );
}

export default function LightsConceptA({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProControlDomainModel>) {
  const actions = useControlActions(m);
  const anyOn = m.onCount > 0;
  const allSwitch = <ToggleSwitch isSelected={anyOn} onChange={(on) => void actions.toggleAll(on)} label={anyOn ? 'Turn all lights off' : 'Turn all lights on'} tone="warning" />;
  const rows = (count: number) =>
    m.items.slice(0, count).map((item) => (
      <li key={item.entityId} className="flex min-w-0 items-center gap-2 py-1">
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">{item.shortName}</span>
          <span className="block truncate text-xs text-muted">{item.isOn && item.brightnessPct ? `${item.roomName} · ${item.brightnessPct}%` : item.roomName}</span>
        </span>
        <ToggleSwitch isSelected={item.isOn} onChange={() => actions.toggleItem(item)} label={`${item.name}, ${item.isOn ? 'on' : 'off'}`} tone="warning" />
      </li>
    ));

  if (m.totalCount === 0) {
    return (
      <WidgetSurface label="Lighting" className="bg-[var(--surface)]">
        <p className="flex h-full items-end p-3.5 text-sm text-muted">No lights</p>
      </WidgetSurface>
    );
  }

  return (
    <WidgetSurface label="Lighting" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Lighting" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col p-3.5">
        {size === 's' ? (
          <div className="flex h-full flex-col justify-between">
            <Headline m={m} />
            <div className="flex justify-end">{allSwitch}</div>
          </div>
        ) : null}

        {size === 'w' ? (
          <div className="flex h-full min-w-0 gap-4">
            <div className="flex flex-col justify-between">
              <Headline m={m} />
              {allSwitch}
            </div>
            <ul aria-label="Rooms" className="mt-7 flex min-w-0 flex-1 flex-col divide-y divide-[var(--separator,rgba(127,127,127,0.18))] self-end">
              {lightRooms(m)
                .slice(0, 3)
                .map((r) => (
                  <li key={r.name} className="flex items-center gap-2 py-1 text-xs">
                    <span className="min-w-0 flex-1 truncate">{r.name}</span>
                    <span className="tabular-nums text-muted">{r.onCount > 0 ? `${r.onCount} on` : 'off'}</span>
                  </li>
                ))}
            </ul>
          </div>
        ) : null}

        {size === 't' ? (
          <div className="flex h-full min-h-0 flex-col gap-2">
            <Headline m={m} />
            <ul aria-label="Lights" className="mt-auto flex flex-col divide-y divide-[var(--separator,rgba(127,127,127,0.18))]">
              {rows(3)}
            </ul>
            <div className="flex items-center justify-between border-t border-[var(--separator,rgba(127,127,127,0.18))] pt-2 text-xs text-muted">
              All lights
              {allSwitch}
            </div>
          </div>
        ) : null}

        {size === 'l' ? (
          <div className="flex h-full min-h-0 flex-col gap-2">
            <div className="flex items-end justify-between gap-3 pr-8">
              <Headline m={m} big />
              <div className="mb-1 flex flex-col items-end gap-1 text-xs text-muted">
                {m.avgBrightnessPct !== null ? <span>{m.avgBrightnessPct}% average</span> : null}
                {allSwitch}
              </div>
            </div>
            <ul aria-label="Lights" className="mt-auto grid grid-cols-2 gap-x-4">
              {rows(6)}
            </ul>
          </div>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
