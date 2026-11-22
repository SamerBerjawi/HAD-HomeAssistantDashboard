/** Pieces the Door locks concepts share: actions, a press-and-hold hook, the lock button, tones and text. */
import { useCallback, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SquareLock02Icon, SquareUnlock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { haWebSocketService } from '@/services/haWebSocket';
import type { ProLockItem, ProLocksModel } from '../../../lib/overviewLocks';
import { LOW_LOCK_BATTERY } from '../../../lib/overviewLocks';
import { timeAgo } from '../../../lib/pageSentences';
import { useHold } from '../../shared/useHold';
import { useServiceCall } from '../../shared/useServiceCall';

export { useHold };

export type LockTone = 'locked' | 'unlocked' | 'jammed' | 'offline';

export const lockTone = (l: ProLockItem): LockTone => (l.isJammed ? 'jammed' : l.isOffline ? 'offline' : l.isUnlocked ? 'unlocked' : 'locked');

/** Soft tints (the owner's preference from the Alarm revision): only what needs attention stands out. */
export const TINT: Record<LockTone, string> = {
  locked: 'bg-default/70 text-foreground',
  unlocked: 'bg-[hsl(44_100%_88%)] text-[hsl(30_85%_30%)]',
  jammed: 'bg-[hsl(0_100%_92%)] text-[hsl(0_70%_42%)]',
  offline: 'bg-default/50 text-muted'
};

/** "Keypad · 5 min ago", "2 h ago", or null. */
export function lockSince(l: ProLockItem, now = Date.now()): string | null {
  const ago = l.changedAt !== null ? timeAgo((now - l.changedAt) / 60000) : null;
  return [l.changedBy, ago].filter(Boolean).join(' · ') || null;
}

/** One line under the headline: what else is worth knowing. */
export function locksSummary(m: ProLocksModel, short = false): string {
  if (m.total === 0) return short ? 'Add one in HA' : 'Add a lock in Home Assistant';
  const parts = [`${m.total - m.unlocked - m.jammed - m.offline} of ${m.total} locked`];
  if (short) return parts[0];
  if (m.offline > 0) parts.push(`${m.offline} offline`);
  if (m.lowBattery > 0) parts.push(`${m.lowBattery} low battery`);
  return parts.join(' · ');
}

/** Unlocked locks that can be locked now (not on an open door). */
export const lockable = (m: ProLocksModel) => m.locks.filter((l) => l.isUnlocked && l.doorOpen !== true);

export const lowBattery = (l: ProLockItem) => l.batteryPct !== null && l.batteryPct < LOW_LOCK_BATTERY;

/** Lock or unlock one lock, or lock every unlocked one. Busy ids show a spinner. */
export function useLockActions(m: ProLocksModel) {
  const { call, setOptimistic } = useServiceCall();
  const [busy, setBusy] = useState<string[]>([]);
  const run = useCallback(
    async (ids: string[], service: 'lock' | 'unlock') => {
      if (ids.length === 0) return;
      setBusy((b) => [...b, ...ids]);
      try {
        await call('lock', service, {}, ids.length === 1 ? ids[0] : ids);
        if (haWebSocketService.isDemo()) for (const id of ids) setOptimistic(id, service === 'lock' ? 'locked' : 'unlocked');
      } finally {
        setBusy((b) => b.filter((x) => !ids.includes(x)));
      }
    },
    [call, setOptimistic]
  );
  return {
    busy: (id: string) => busy.includes(id),
    lock: (id: string) => run([id], 'lock'),
    unlock: (id: string) => run([id], 'unlock'),
    lockAll: () =>
      run(
        lockable(m).map((l) => l.entityId),
        'lock'
      )
  };
}

/**
 * One lock's action: Lock in one tap, Unlock by press and hold (a fill grows while held).
 * `ink`: a colour for the white Lock button on coloured cards; without it the theme's primary.
 * `iconOnly` for narrow cards.
 */
export function LockAction({ l, a, ink, iconOnly = false }: { l: ProLockItem; a: ReturnType<typeof useLockActions>; ink?: string; iconOnly?: boolean }) {
  const hold = useHold(() => void a.unlock(l.entityId));
  if (l.isOffline || l.isJammed) return null;
  const size = iconOnly ? 'size-8 min-w-0 px-0' : 'h-8 px-3';
  if (l.isUnlocked) {
    return (
      <Button
        size="sm"
        variant={ink ? 'ghost' : 'primary'}
        isIconOnly={iconOnly}
        isPending={a.busy(l.entityId)}
        isDisabled={l.doorOpen === true}
        aria-label={`Lock ${l.name}`}
        onPress={() => void a.lock(l.entityId)}
        className={cn('shrink-0 text-xs font-semibold', size, ink && 'bg-white shadow-sm hover:bg-white/90')}
        style={ink ? { color: ink } : undefined}
      >
        <HugeiconsIcon icon={SquareLock02Icon} size={14} />
        {iconOnly ? null : 'Lock'}
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      variant={ink ? 'ghost' : 'secondary'}
      isIconOnly={iconOnly}
      isPending={a.busy(l.entityId)}
      aria-label={`Unlock ${l.name} (press and hold)`}
      {...hold.pressProps}
      className={cn('relative shrink-0 overflow-hidden text-xs', size, ink && 'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25', hold.hint && 'ring-1 ring-warning/60')}
    >
      <span aria-hidden className={cn('absolute inset-y-0 left-0', ink ? 'bg-white/30' : 'bg-warning/25')} style={{ width: `${hold.progress * 100}%` }} />
      <span className="relative inline-flex items-center gap-1">
        <HugeiconsIcon icon={SquareUnlock02Icon} size={14} />
        {iconOnly ? null : hold.hint ? 'Hold' : 'Unlock'}
      </span>
    </Button>
  );
}
