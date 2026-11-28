/**
 * Shared bits of the on/off widgets (Lights, Switches, Fans): a switch, a device row and the
 * count footer with the all on/off switch. Widget bodies hold controls only (rebuild, Phase 3).
 */
import type { ReactNode } from 'react';
import { Switch } from '@heroui/react';
import { cn } from '@/lib/utils';
import type { WidgetSize } from '../../lib/overviewLayout';

export type ControlTone = 'warning' | 'accent';

export function ToggleSwitch({ isSelected, onChange, label, tone = 'accent' }: { isSelected: boolean; onChange: (v: boolean) => void; label: string; tone?: ControlTone }) {
  return (
    <Switch size="sm" isSelected={isSelected} onChange={onChange} aria-label={label} className={cn(tone === 'warning' && '[--accent:var(--warning)]')}>
      <Switch.Content>
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}

export function ToggleRow({ name, detail, isOn, onToggle, label, tone }: { name: string; detail: string; isOn: boolean; onToggle: () => void; label: string; tone?: ControlTone }) {
  return (
    <li className="flex min-w-0 items-center gap-2 rounded-xl bg-default/40 px-2.5 py-1.5">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="block truncate text-xs text-muted">{detail}</span>
      </span>
      <ToggleSwitch isSelected={isOn} onChange={onToggle} label={label} tone={tone} />
    </li>
  );
}

/** Rows a Tall or Large card has room for above the footer (4-row rule). */
export const ROWS_FOR_SIZE: Record<WidgetSize, number> = { s: 0, w: 0, t: 3, l: 3 };

export function CountFooter({
  onCount,
  totalCount,
  detail,
  allLabel,
  onToggleAll,
  tone
}: {
  onCount: number;
  totalCount: number;
  detail: ReactNode;
  allLabel: string;
  onToggleAll: (on: boolean) => void;
  tone?: ControlTone;
}) {
  return (
    <div className="mt-auto flex items-end justify-between gap-2">
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none tabular-nums">
          {onCount}
          <span className="text-base font-normal text-muted">/{totalCount}</span>
        </p>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">{detail}</p>
      </div>
      {totalCount > 0 ? <ToggleSwitch isSelected={onCount > 0} onChange={onToggleAll} label={allLabel} tone={tone} /> : null}
    </div>
  );
}
