/**
 * Alarm concept C — Innovative ("key switch and checklist"). The modes are positions on a track,
 * like the key switch on a panel: the lit position is the current mode, tap another to move it.
 * Beside it, a readiness checklist: doors and windows closed, locks locked, so you know before
 * arming. Small: state + a short track. Wide: horizontal track. Tall/Large: vertical track with
 * the checklist.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, CheckmarkCircle02Icon, Shield01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { PRO_ALARM_MODE_ICON } from '../../../components/overview/SecurityAlarmShared';
import { useOpenSheet } from '../../../hooks/useSheetParam';
import type { ProOverviewAlarmModel } from '../../../lib/overviewSecurity';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { alarmColors, changedLine, useAlarm } from './shared';

function Track({
  m,
  vertical,
  labels,
  onSelect,
  busy
}: {
  m: ProOverviewAlarmModel;
  vertical?: boolean;
  labels?: boolean;
  onSelect: (id: ProOverviewAlarmModel['modes'][number]['id']) => void;
  busy: boolean;
}) {
  const c = alarmColors(m);
  const modes = m.modes.slice(0, 4);
  return (
    <div role="group" aria-label="Alarm mode" className={cn('flex rounded-2xl bg-default/60 p-1', vertical ? 'h-full flex-col gap-1' : 'w-full gap-1')}>
      {modes.map((mode) => {
        const on = mode.id === m.currentMode;
        return (
          <Button
            key={mode.id}
            variant="ghost"
            isDisabled={busy}
            aria-pressed={on}
            aria-label={`${mode.label}${on ? ', current' : ''}`}
            onPress={() => onSelect(mode.id)}
            className={cn(
              'min-h-0 min-w-0 flex-1 gap-1.5 rounded-xl px-1.5 text-xs font-semibold',
              vertical ? 'h-auto w-full justify-start px-2.5' : 'h-10 flex-col gap-0.5',
              on ? 'text-white shadow-md' : 'text-muted'
            )}
            style={on ? { background: `linear-gradient(150deg, ${c.from}, ${c.to})` } : undefined}
          >
            <HugeiconsIcon icon={PRO_ALARM_MODE_ICON[mode.id]} size={14} className="shrink-0" />
            {labels ? <span className={cn('truncate', !vertical && 'text-[10px]')}>{mode.label}</span> : null}
          </Button>
        );
      })}
    </div>
  );
}

function Check({ ok, text, onPress }: { ok: boolean; text: string; onPress?: () => void }) {
  const body = (
    <>
      <HugeiconsIcon icon={ok ? CheckmarkCircle02Icon : Alert02Icon} size={14} className={cn('shrink-0', ok ? 'text-success' : 'text-warning')} />
      <span className="truncate">{text}</span>
    </>
  );
  return onPress && !ok ? (
    <Button size="sm" variant="ghost" onPress={onPress} className="h-6 w-full min-w-0 max-w-full justify-start gap-1.5 px-0 text-xs font-normal">
      {body}
    </Button>
  ) : (
    <span className="flex h-6 min-w-0 items-center gap-1.5 text-xs">{body}</span>
  );
}

export default function AlarmConceptC({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewAlarmModel>) {
  const { actions, controller, dialogs } = useAlarm(m);
  const open = useOpenSheet();
  const surface = cn('shadow-[0_1px_2px_rgba(0,0,0,0.06)]', m.isTriggered ? 'bg-danger/12 ring-1 ring-danger/40' : 'bg-[var(--surface)]');

  if (!m.panel) {
    return (
      <WidgetSurface label="Alarm" className={surface}>
        <div className="flex h-full flex-col justify-end gap-1 p-3.5 text-muted">
          <HugeiconsIcon icon={Shield01Icon} size={22} />
          <p className="text-sm font-medium">No alarm panel</p>
        </div>
      </WidgetSurface>
    );
  }

  const ready = m.openingsCount === 0 && m.unlockedLocksCount === 0;
  const head = (
    <div className="min-w-0 pr-8">
      <p className={cn('truncate font-semibold leading-tight', size === 's' ? 'text-base' : 'text-xl', m.isTriggered && 'text-danger motion-safe:animate-pulse')}>{m.stateLabel}</p>
      <p className="truncate text-xs text-muted">{size === 's' ? (ready ? 'Ready' : 'Not ready') : changedLine(m)}</p>
    </div>
  );
  const row = size === 'w';
  const checklist = (
    <div className={cn('flex min-w-0', row ? 'items-center gap-3 [&>*]:w-auto' : 'flex-col')}>
      {row ? null : <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">{ready ? 'Ready to arm' : 'Before arming'}</p>}
      <Check ok={m.openingsCount === 0} text={m.openingsCount === 0 ? 'All closed' : `${m.openingsCount} open`} onPress={() => open('openings')} />
      {m.locks.length > 0 ? (
        <Check ok={m.unlockedLocksCount === 0} text={m.unlockedLocksCount === 0 ? 'Locks locked' : `Lock ${m.unlockedLocksCount} now`} onPress={() => void actions.lockAll()} />
      ) : null}
    </div>
  );

  return (
    <WidgetSurface label="Alarm" className={surface}>
      <DetailsButton title="Alarm" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {size === 's' || size === 'w' ? (
          <>
            {head}
            {size === 'w' ? <div className="-my-1.5">{checklist}</div> : null}
            <div className="mt-auto">
              <Track m={m} labels={size === 'w'} onSelect={controller.selectMode} busy={controller.busy} />
            </div>
          </>
        ) : (
          <>
            {head}
            <div className="flex min-h-0 flex-1 gap-3">
              <div className="w-[48%] shrink-0">
                <Track m={m} vertical labels onSelect={controller.selectMode} busy={controller.busy} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-end">{checklist}</div>
            </div>
          </>
        )}
        {controller.error ? (
          <p role="alert" className="truncate text-xs font-medium text-danger">
            {controller.error}
          </p>
        ) : null}
      </div>
      {dialogs}
    </WidgetSurface>
  );
}
