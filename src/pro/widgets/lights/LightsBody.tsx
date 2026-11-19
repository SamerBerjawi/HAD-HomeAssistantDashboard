import { Switch } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Sun01Icon } from '@hugeicons/core-free-icons';
import type { ProControlDomainModel } from '../../lib/overviewControls';
import { useControlActions } from '../controls/useControlActions';
import type { WidgetBodyProps } from '../types';

function ToggleSwitch({ isSelected, onChange, label }: { isSelected: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Switch size="sm" isSelected={isSelected} onChange={onChange} aria-label={label} className="[--accent:var(--warning)]">
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}

/** Rows a Large card has room for under its summary (4-row rule). */
const LARGE_ROWS = 4;

/**
 * Lights body (pilot widget, Overview rebuild Phase 1). Controls only; the card header opens the
 * sheet. Small: count + all on/off. Wide: adds average brightness. Tall/Large: adds light rows.
 */
export default function LightsBody({ model, size }: WidgetBodyProps<ProControlDomainModel>) {
  const actions = useControlActions(model);
  const anyOn = model.onCount > 0;
  const rows = size === 'l' || size === 't' ? model.items.slice(0, LARGE_ROWS) : [];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {rows.length > 0 ? (
        <ul className="flex min-h-0 flex-col gap-1" aria-label="Lights">
          {rows.map((item) => (
            <li key={item.entityId} className="flex min-w-0 items-center gap-2 rounded-xl bg-default/40 px-2.5 py-1.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.shortName}</span>
                <span className="block truncate text-xs text-muted">
                  {item.roomName}
                  {item.isOn && item.brightnessPct ? ` · ${item.brightnessPct}%` : ''}
                </span>
              </span>
              <ToggleSwitch isSelected={item.isOn} onChange={() => actions.toggleItem(item)} label={`${item.name}, ${item.isOn ? 'on' : 'off'}`} />
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-auto flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl font-semibold leading-none tabular-nums">
            {model.onCount}
            <span className="text-base font-normal text-muted">/{model.totalCount}</span>
          </p>
          <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
            {size !== 's' && model.avgBrightnessPct !== null ? (
              <>
                <HugeiconsIcon icon={Sun01Icon} size={12} className="shrink-0 text-warning" />
                {model.avgBrightnessPct}% average
              </>
            ) : anyOn ? (
              'on'
            ) : (
              'all off'
            )}
          </p>
        </div>
        <ToggleSwitch isSelected={anyOn} onChange={(on) => void actions.toggleAll(on)} label={anyOn ? 'Turn all lights off' : 'Turn all lights on'} />
      </div>
    </div>
  );
}
