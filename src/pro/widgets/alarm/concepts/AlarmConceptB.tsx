/**
 * Alarm concept B — Expressive & immersive ("shield"). The card is the state: slate when
 * disarmed, deep green when armed home, indigo when away, amber while arming, red and pulsing
 * when triggered, with a large shield behind. Glass buttons: one quick action (Small/Tall), every
 * mode (Wide/Large); open doors and locks as glass chips; lock rows at Large.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, PowerIcon, SecurityCheckIcon, Shield01Icon, SquareLock02Icon, SquareUnlock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { alarmStateIcon, PRO_ALARM_MODE_ICON } from '../../../components/overview/SecurityAlarmShared';
import { useOpenSheet } from '../../../hooks/useSheetParam';
import type { ProOverviewAlarmModel } from '../../../lib/overviewSecurity';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { alarmColors, changedLine, useAlarm } from './shared';

const GLASS = 'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25';

export default function AlarmConceptB({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewAlarmModel>) {
  const { actions, controller, quickTarget, dialogs } = useAlarm(m);
  const open = useOpenSheet();
  const c = alarmColors(m);

  if (!m.panel) {
    return (
      <WidgetSurface label="Alarm" ink="light" style={{ background: `linear-gradient(150deg, ${c.from}, ${c.to})` }}>
        <div className="flex h-full flex-col justify-end gap-1 p-3.5 text-white/75">
          <HugeiconsIcon icon={Shield01Icon} size={22} />
          <p className="text-sm font-medium">No alarm panel</p>
        </div>
      </WidgetSurface>
    );
  }

  const modes = m.modes.slice(0, 4);
  return (
    <WidgetSurface label="Alarm" ink="light" style={{ background: `linear-gradient(150deg, ${c.from}, ${c.to})` }}>
      {m.isTriggered ? <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[hsl(0_90%_60%)] motion-safe:animate-pulse" style={{ opacity: 0.35 }} /> : null}
      <HugeiconsIcon icon={alarmStateIcon(m.state)} aria-hidden size={size === 's' ? 96 : 150} className="pointer-events-none absolute -bottom-6 -right-6 -z-10 text-white/10" />
      <DetailsButton title="Alarm" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <div className="min-w-0 pr-8">
          <p className={cn('truncate font-semibold leading-tight', size === 's' ? 'text-xl' : 'text-[28px]')}>{m.stateLabel}</p>
          <p className="truncate text-xs text-white/75">
            {size === 'w'
              ? [changedLine(m), m.openingsCount > 0 ? `${m.openingsCount} open` : null, m.unlockedLocksCount > 0 ? `${m.unlockedLocksCount} unlocked` : null].filter(Boolean).join(' · ')
              : changedLine(m)}
          </p>
        </div>

        {(size === 't' || size === 'l') && (m.openingsCount > 0 || m.locks.length > 0) ? (
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {m.openingsCount > 0 ? (
              <Button size="sm" variant="ghost" onPress={() => open('openings')} className={cn('h-7 gap-1 rounded-full px-2.5 text-xs', GLASS)}>
                <HugeiconsIcon icon={Alert02Icon} size={12} />
                {m.openingsCount} open
              </Button>
            ) : null}
            {m.unlockedLocksCount > 0 ? (
              <Button size="sm" variant="ghost" onPress={() => void actions.lockAll()} className={cn('h-7 gap-1 rounded-full px-2.5 text-xs', GLASS)}>
                <HugeiconsIcon icon={SquareUnlock02Icon} size={12} />
                Lock {m.unlockedLocksCount}
              </Button>
            ) : m.locks.length > 0 ? (
              <span className="flex h-7 items-center gap-1 rounded-full bg-white/10 px-2.5 text-xs text-white/80">
                <HugeiconsIcon icon={SquareLock02Icon} size={12} />
                Locked
              </span>
            ) : null}
          </div>
        ) : null}

        {size === 'l' && m.locks.length > 0 ? (
          <ul aria-label="Locks" className="flex flex-col gap-1">
            {m.locks.slice(0, 2).map((l) => (
              <li key={l.entityId} className="flex items-center gap-2 rounded-xl bg-white/10 px-2.5 py-1.5 text-xs">
                <HugeiconsIcon icon={l.isUnlocked ? SquareUnlock02Icon : SquareLock02Icon} size={14} />
                <span className="min-w-0 flex-1 truncate">{l.shortName}</span>
                <Button size="sm" variant="ghost" onPress={() => void actions.setLockState(l.entityId, l.isUnlocked ? 'lock' : 'unlock')} className={cn('h-6 rounded-full px-2 text-[11px]', GLASS)}>
                  {l.isUnlocked ? 'Lock' : 'Unlock'}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        {controller.error ? (
          <p role="alert" className="truncate text-xs font-semibold">
            {controller.error}
          </p>
        ) : null}

        <div className="mt-auto">
          {size === 'w' || size === 'l' ? (
            <div role="group" aria-label="Alarm mode" className="grid gap-1" style={{ gridTemplateColumns: `repeat(${modes.length}, minmax(0, 1fr))` }}>
              {modes.map((mode) => {
                const on = mode.id === m.currentMode;
                return (
                  <Button
                    key={mode.id}
                    size="sm"
                    variant="ghost"
                    isDisabled={controller.busy}
                    aria-pressed={on}
                    onPress={() => controller.selectMode(mode.id)}
                    className={cn('h-9 min-w-0 gap-1 rounded-xl px-1 text-xs font-semibold', on ? 'bg-white text-black' : GLASS)}
                  >
                    <HugeiconsIcon icon={PRO_ALARM_MODE_ICON[mode.id]} size={13} className="shrink-0" />
                    <span className="truncate">{mode.label}</span>
                  </Button>
                );
              })}
            </div>
          ) : (
            <Button
              size="sm"
              fullWidth
              variant="ghost"
              isPending={controller.busy}
              onPress={() => controller.selectMode(quickTarget)}
              className={cn('h-9 rounded-xl font-semibold', m.isTriggered ? 'bg-white text-[hsl(0_75%_40%)]' : GLASS)}
            >
              <HugeiconsIcon icon={quickTarget === 'disarmed' ? PowerIcon : SecurityCheckIcon} size={14} />
              {quickTarget === 'disarmed' ? 'Disarm' : 'Arm home'}
            </Button>
          )}
        </div>
      </div>
      {dialogs}
    </WidgetSurface>
  );
}
