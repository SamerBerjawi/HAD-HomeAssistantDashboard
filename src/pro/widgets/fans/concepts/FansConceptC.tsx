/**
 * Fans concept C — Innovative ("speed steps"). Each fan is a power button and three labelled
 * steps (Low, Medium, High) like the pull-chain on a ceiling fan: the power button is filled while
 * the fan runs, the steps fill up to its speed and say which one it is on; tap a step to set that
 * speed. When the fan has preset modes (Auto, Sleep, Nature…) a mode menu sits beside its state.
 * Small: the busiest fan, steps stacked. Wide/Tall/Large: a row per fan.
 * Revised 2026-11-21 (owner: off and the levels were confusing; add the mode like thermostats).
 */
import { Button, Dropdown } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Fan01Icon, PowerIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProFanItem, ProFansModel } from '../../../lib/overviewAppliances';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { useFanActions } from '../useFanActions';

const STEPS = [
  { pct: 33, label: 'Low', short: 'L' },
  { pct: 66, label: 'Medium', short: 'M' },
  { pct: 100, label: 'High', short: 'H' }
];
const ON = 'hsl(176 60% 42%)';

/** 0 when off, else 1–3: the step nearest the fan's speed. */
const stepOf = (f: ProFanItem) => (f.isOn ? 1 + STEPS.reduce((best, s, i) => (Math.abs(s.pct - f.percentage) < Math.abs(STEPS[best].pct - f.percentage) ? i : best), 0) : 0);
const stateText = (f: ProFanItem) => (f.isOn ? (f.supportsSpeed ? STEPS[stepOf(f) - 1].label : 'On') : 'Off');

type Actions = ReturnType<typeof useFanActions>;

function PowerButton({ f, actions, className }: { f: ProFanItem; actions: Actions; className?: string }) {
  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      onPress={() => actions.toggleFan(f)}
      aria-label={`${f.name}: ${f.isOn ? 'on, turn off' : 'off, turn on'}`}
      aria-pressed={f.isOn}
      className={cn('shrink-0 rounded-full', f.isOn ? 'text-white' : 'bg-default text-muted ring-1 ring-[var(--separator,rgba(127,127,127,0.3))]', className)}
      style={f.isOn ? { background: ON } : undefined}
    >
      <HugeiconsIcon icon={PowerIcon} size={14} />
    </Button>
  );
}

function Steps({ f, vertical, actions }: { f: ProFanItem; vertical?: boolean; actions: Actions }) {
  const at = stepOf(f);
  if (!f.supportsSpeed) return vertical ? <PowerButton f={f} actions={actions} className="size-8 self-center" /> : <PowerButton f={f} actions={actions} className="size-7" />;
  return (
    <div className={cn('flex gap-1', vertical ? 'h-full flex-col-reverse' : 'w-full items-center')} role="group" aria-label={`${f.name} speed`}>
      <PowerButton f={f} actions={actions} className={vertical ? 'size-8 self-center' : 'size-7'} />
      {STEPS.map((s, i) => {
        const filled = i + 1 <= at;
        const current = i + 1 === at;
        return (
          <Button
            key={s.pct}
            variant="ghost"
            onPress={() => actions.setSpeed(f.entityId, s.pct)}
            aria-label={`${f.name}: ${s.label}${current ? ', current' : ''}`}
            aria-pressed={current}
            className={cn(
              'min-w-0 flex-1 rounded-md p-0 text-[10px] font-semibold leading-none',
              vertical ? 'h-auto min-h-0 w-full' : 'h-7',
              filled ? 'text-white' : 'bg-default text-muted',
              current && 'ring-2 ring-[color-mix(in_oklab,hsl(176_60%_42%)_45%,transparent)]'
            )}
            style={filled ? { background: ON, opacity: current ? 1 : 0.7 } : undefined}
          >
            {vertical ? s.short : s.label}
          </Button>
        );
      })}
    </div>
  );
}

/** The fan's preset modes in a menu (only when it has some). */
function PresetMenu({ f, actions }: { f: ProFanItem; actions: Actions }) {
  if (f.presetModes.length === 0) return null;
  return (
    <Dropdown>
      <Button size="sm" variant="secondary" aria-label={`${f.name} mode: ${f.presetMode ?? 'none'}. Change the mode`} className="h-6 min-w-0 gap-1 rounded-full px-2 text-[11px] font-semibold capitalize">
        {f.presetMode ? f.presetMode.replace(/_/g, ' ') : 'Mode'}
        <HugeiconsIcon icon={ArrowDown01Icon} size={11} className="opacity-60" />
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-36">
        <Dropdown.Menu aria-label={`${f.name} mode`} selectionMode="single" selectedKeys={new Set(f.presetMode ? [f.presetMode] : [])} onAction={(key) => actions.setPreset(f.entityId, String(key))}>
          {f.presetModes.map((p) => (
            <Dropdown.Item key={p} id={p} textValue={p}>
              <span className="truncate capitalize">{p.replace(/_/g, ' ')}</span>
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export default function FansConceptC({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProFansModel>) {
  const actions = useFanActions(m);
  const busiest = [...m.items].sort((a, b) => Number(b.isOn) - Number(a.isOn) || b.percentage - a.percentage)[0];
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
        {m.totalCount > 0 && size === 's' && busiest ? (
          <div className="flex h-full gap-3">
            <div className="flex min-w-0 flex-1 flex-col justify-between pr-1">
              <HugeiconsIcon icon={Fan01Icon} size={22} style={{ color: busiest.isOn ? ON : undefined }} className={busiest.isOn ? '' : 'text-muted'} />
              <div className="flex min-w-0 flex-col items-start gap-1">
                <p className={cn('text-2xl font-semibold leading-none', !busiest.isOn && 'text-muted')}>{stateText(busiest)}</p>
                <p className="w-full truncate text-xs text-muted">{busiest.roomName}</p>
                <PresetMenu f={busiest} actions={actions} />
              </div>
            </div>
            <div className="w-8 pt-9">
              <Steps f={busiest} vertical actions={actions} />
            </div>
          </div>
        ) : null}
        {m.totalCount > 0 && size !== 's' ? (
          <>
            <p className="pr-8 text-sm font-semibold">
              {m.onCount ? `${m.onCount} of ${m.totalCount} running` : m.totalCount === 1 ? 'Off' : 'All off'}
            </p>
            <ul aria-label="Fans" className={cn('mt-auto flex flex-col', size === 'w' ? 'gap-1.5' : 'gap-2.5')}>
              {m.items.slice(0, size === 'w' ? 2 : size === 't' ? 4 : 5).map((f) => (
                <li key={f.entityId} className="flex min-w-0 flex-col gap-1">
                  <span className="flex min-h-6 items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium">{f.roomName}</span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      <PresetMenu f={f} actions={actions} />
                      <span className={cn('font-semibold', f.isOn ? '' : 'text-muted')} style={f.isOn ? { color: ON } : undefined}>
                        {stateText(f)}
                      </span>
                    </span>
                  </span>
                  <Steps f={f} actions={actions} />
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
