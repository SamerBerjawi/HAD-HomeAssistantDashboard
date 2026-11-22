/**
 * Alarm card (owner's choice, WIDGET_DESIGN.md Phase 3): concept B's layout (the card is the
 * state colour, pulsing red when triggered, shield behind) with concept C's mode buttons (one
 * track, the current position filled) and lock rows (unlocking needs a press and hold).
 * Small: state + a short track. Wide: + every mode.
 * Tall/Large: open doors and locks, then the track. Revised 2026-11-20: concept C's header (the
 * state never cut off) and soft lock colours.
 */
import { useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Shield01Icon, SquareLock02Icon, SquareUnlock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { alarmStateIcon, PRO_ALARM_MODE_ICON } from '../../components/overview/SecurityAlarmShared';
import { HoldToConfirmButton } from '../../components/security/HoldToConfirmButton';
import { useOpenSheet } from '../../hooks/useSheetParam';
import type { ProOverviewAlarmLockItem, ProOverviewAlarmModel } from '../../lib/overviewSecurity';
import type { AlarmModeId } from '../../lib/securityLogic';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../shared/WidgetSurface';
import { alarmColors, changedLine, useAlarm } from './concepts/shared';

const CHIP = 'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25';
/**
 * Lock colours (revised 2026-11-20, owner): soft pastels instead of solid green/amber/red. Locked is
 * a white tile in the card's own colour (like the current mode), unlocked a soft amber, jammed a
 * soft red, so only what needs attention stands out.
 */
const UNLOCKED_TINT = 'bg-[hsl(44_100%_88%)] text-[hsl(30_85%_30%)]';
const LOCK_TILE = { jammed: 'bg-[hsl(0_100%_92%)] text-[hsl(0_70%_42%)]', unlocked: UNLOCKED_TINT, locked: 'bg-white' } as const;

/** C's track on B's card: one rail, the current mode filled white in the state's colour. */
function ModeTrack({ m, labels, onSelect, busy }: { m: ProOverviewAlarmModel; labels: boolean; onSelect: (id: AlarmModeId) => void; busy: boolean }) {
  const c = alarmColors(m);
  const modes = m.modes.slice(0, labels ? 4 : 3);
  return (
    <div role="group" aria-label="Alarm mode" className="flex w-full gap-1 rounded-2xl bg-black/25 p-1 ring-1 ring-white/15 backdrop-blur-md">
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
              'min-h-0 min-w-0 flex-1 flex-col gap-0.5 rounded-xl px-1 text-xs font-semibold',
              labels ? 'h-11' : 'h-9',
              on ? 'bg-white shadow-md' : 'text-white/75 hover:bg-white/10 hover:text-white'
            )}
            style={on ? { color: c.to } : undefined}
          >
            <HugeiconsIcon icon={PRO_ALARM_MODE_ICON[mode.id]} size={15} className="shrink-0" />
            {labels ? <span className="w-full truncate text-[10px]">{mode.label}</span> : null}
          </Button>
        );
      })}
    </div>
  );
}

function LockRow({ lock, ink, onSetLockState }: { lock: ProOverviewAlarmLockItem; ink: string; onSetLockState: (entityId: string, service: 'lock' | 'unlock') => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const run = async (service: 'lock' | 'unlock') => {
    setBusy(true);
    try {
      await onSetLockState(lock.entityId, service);
    } finally {
      setBusy(false);
    }
  };
  const tone = lock.isJammed ? 'jammed' : lock.isUnlocked ? 'unlocked' : 'locked';
  return (
    <li className="flex min-w-0 items-center gap-2 rounded-xl bg-white/12 px-2 py-1.5 ring-1 ring-white/15">
      <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg', LOCK_TILE[tone])} style={tone === 'locked' ? { color: ink } : undefined}>
        <HugeiconsIcon icon={lock.isUnlocked || lock.isJammed ? SquareUnlock02Icon : SquareLock02Icon} size={14} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{lock.shortName}</span>
        <span className="block truncate text-[10px] text-white/70">{lock.stateLabel}</span>
      </span>
      {lock.isOffline || lock.isJammed ? null : lock.isUnlocked ? (
        <Button
          size="sm"
          variant="ghost"
          isPending={busy}
          aria-label={`Lock ${lock.name}`}
          onPress={() => void run('lock')}
          className="h-7 bg-white px-2.5 text-xs font-semibold shadow-sm hover:bg-white/90"
          style={{ color: ink }}
        >
          <HugeiconsIcon icon={SquareLock02Icon} size={13} />
          Lock
        </Button>
      ) : (
        <HoldToConfirmButton
          icon={SquareUnlock02Icon}
          label="Unlock"
          ariaLabel={`Unlock ${lock.name} (press and hold)`}
          isPending={busy}
          onConfirm={() => void run('unlock')}
          className="h-7 border-0 bg-white/15 px-2.5 text-xs text-white ring-1 ring-white/25 hover:bg-white/25"
        />
      )}
    </li>
  );
}

export default function AlarmCard({ model: m, size, onOpenDetails }: DesignedWidgetProps<ProOverviewAlarmModel>) {
  const { actions, controller, dialogs } = useAlarm(m);
  const open = useOpenSheet();
  const c = alarmColors(m);
  const background = { background: `linear-gradient(150deg, ${c.from}, ${c.to})` };

  if (!m.panel) {
    return (
      <WidgetSurface label="Alarm" ink="light" style={background}>
        <div className="flex h-full flex-col justify-end gap-1 p-3.5 text-white/75">
          <HugeiconsIcon icon={Shield01Icon} size={22} />
          <p className="text-sm font-medium">No alarm panel</p>
        </div>
      </WidgetSurface>
    );
  }

  const tallish = size === 't' || size === 'l';
  return (
    <WidgetSurface label="Alarm" ink="light" style={background}>
      {m.isTriggered ? <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[hsl(0_90%_60%)] opacity-35 motion-safe:animate-pulse" /> : null}
      <HugeiconsIcon icon={alarmStateIcon(m.state)} aria-hidden size={size === 's' ? 96 : 150} className="pointer-events-none absolute -bottom-6 -right-6 -z-10 text-white/10" />
      <DetailsButton title="Alarm" onPress={onOpenDetails} ink="light" />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        <div className="min-w-0 pr-8">
          {/* C's header (owner, 2026-11-20): smaller title that wraps instead of being cut off. */}
          <p className={cn('line-clamp-2 break-words font-semibold leading-tight', size === 's' ? 'text-base' : 'text-xl')}>{m.stateLabel}</p>
          <p className="truncate text-xs text-white/75">
            {size === 'w'
              ? [changedLine(m), m.openingsCount > 0 ? `${m.openingsCount} open` : null, m.unlockedLocksCount > 0 ? `${m.unlockedLocksCount} unlocked` : null].filter(Boolean).join(' · ')
              : changedLine(m)}
          </p>
        </div>

        {tallish && (m.openingsCount > 0 || m.unlockedLocksCount > 0) ? (
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {m.openingsCount > 0 ? (
              <Button size="sm" variant="ghost" onPress={() => open('openings')} className={cn('h-7 gap-1 rounded-full px-2.5 text-xs', CHIP)}>
                <HugeiconsIcon icon={Alert02Icon} size={12} />
                {m.openingsCount} open
              </Button>
            ) : null}
            {m.unlockedLocksCount > 0 ? (
              <Button size="sm" variant="ghost" onPress={() => void actions.lockAll()} className={cn('h-7 gap-1 rounded-full px-2.5 text-xs font-semibold hover:opacity-90', UNLOCKED_TINT)}>
                <HugeiconsIcon icon={SquareLock02Icon} size={12} />
                Lock {m.unlockedLocksCount}
              </Button>
            ) : null}
          </div>
        ) : null}

        {tallish && m.locks.length > 0 ? (
          <ul aria-label="Locks" className="flex flex-col gap-1">
            {m.locks.slice(0, size === 'l' ? 2 : 1).map((l) => (
              <LockRow key={l.entityId} lock={l} ink={c.to} onSetLockState={actions.setLockState} />
            ))}
          </ul>
        ) : null}

        {controller.error ? (
          <p role="alert" className="truncate text-xs font-semibold">
            {controller.error}
          </p>
        ) : null}

        <div className="mt-auto">
          <ModeTrack m={m} labels={size !== 's'} onSelect={controller.selectMode} busy={controller.busy} />
        </div>
      </div>
      {dialogs}
    </WidgetSurface>
  );
}
