/**
 * Alarm concept A — Refined & minimal. The state as a quiet headline with who changed it; one
 * arm/disarm button (Small/Tall) or the mode switch (Wide/Large); open doors and locks as text.
 * Colour only in the state icon (D1), red when triggered.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PowerIcon, SecurityCheckIcon, Shield01Icon, SquareLock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { alarmStateIcon, ProAlarmLockRow, ProAlarmModeSegmented } from '../../../components/overview/SecurityAlarmShared';
import { useOpenSheet } from '../../../hooks/useSheetParam';
import type { ProOverviewAlarmModel } from '../../../lib/overviewSecurity';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { changedLine, useAlarm } from './shared';

const TONE_TEXT = { default: 'text-muted', success: 'text-success', warning: 'text-warning', danger: 'text-danger' } as const;

export default function AlarmConceptA({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewAlarmModel>) {
  const { actions, controller, quickTarget, dialogs } = useAlarm(m);
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

  const quick = (
    <Button size="sm" fullWidth variant={m.isTriggered ? 'danger' : m.isArmed ? 'secondary' : 'primary'} isPending={controller.busy} onPress={() => controller.selectMode(quickTarget)}>
      <HugeiconsIcon icon={quickTarget === 'disarmed' ? PowerIcon : SecurityCheckIcon} size={14} />
      {quickTarget === 'disarmed' ? 'Disarm' : 'Arm home'}
    </Button>
  );
  const notes = [m.openingsCount > 0 ? `${m.openingsCount} open` : null, m.unlockedLocksCount > 0 ? `${m.unlockedLocksCount} unlocked` : null].filter(Boolean).join(' · ');

  return (
    <WidgetSurface label="Alarm" className={surface}>
      <DetailsButton title="Alarm" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <div className={cn('min-w-0 pr-8', (size === 'w' || size === 'l') && 'flex items-center gap-2.5')}>
          <HugeiconsIcon icon={alarmStateIcon(m.state)} size={22} className={cn('shrink-0', TONE_TEXT[m.tone], m.isTriggered && 'motion-safe:animate-pulse')} />
          <div className="min-w-0">
            <p className={cn('truncate font-semibold leading-tight', size === 's' ? 'mt-1.5 text-lg' : size === 't' ? 'mt-1.5 text-2xl' : 'text-xl', m.isTriggered && 'text-danger')}>{m.stateLabel}</p>
            <p className="truncate text-xs text-muted">{changedLine(m)}</p>
          </div>
        </div>

        {controller.error ? (
          <p role="alert" className="truncate text-xs font-medium text-danger">
            {controller.error}
          </p>
        ) : null}

        {size === 'l' && m.locks.length > 0 ? (
          <div className="flex min-h-0 flex-col gap-1.5">
            {m.locks.slice(0, 2).map((lock) => (
              <ProAlarmLockRow key={lock.entityId} lock={lock} onSetLockState={actions.setLockState} />
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-2">
          {(size === 't' || size === 'l') && notes ? (
            <div className="flex items-center justify-between gap-2 text-xs">
              <Button size="sm" variant="ghost" className="h-7 min-w-0 px-0 text-xs text-warning" onPress={() => open('openings')}>
                <span className="truncate">{notes}</span>
              </Button>
              {m.unlockedLocksCount > 0 && size !== 'l' ? (
                <Button size="sm" variant="tertiary" className="h-7 shrink-0 px-2 text-xs" onPress={() => void actions.lockAll()}>
                  <HugeiconsIcon icon={SquareLock02Icon} size={12} />
                  Lock all
                </Button>
              ) : null}
            </div>
          ) : null}
          {size === 'w' || size === 'l' ? <ProAlarmModeSegmented model={m} busy={controller.busy} onSelectMode={controller.selectMode} compact /> : quick}
        </div>
      </div>
      {dialogs}
    </WidgetSurface>
  );
}
