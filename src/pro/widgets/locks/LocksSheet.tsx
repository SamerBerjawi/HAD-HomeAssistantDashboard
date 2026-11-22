/**
 * Door locks details (sheet kit, WIDGET_DESIGN.md §8; new). Hero: all locked (green), something
 * unlocked (amber) or jammed (red), with Lock all. Each lock is a row: its door icon, state, who
 * changed it and when, battery, and Lock (a tap) or Unlock (press and hold). An open door can't
 * be locked; a jammed or offline lock has no button.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BatteryLowIcon, DoorLockIcon, SquareLock02Icon, SquareUnlock02Icon } from '@hugeicons/core-free-icons';
import type { ProLockItem, ProLocksModel } from '../../lib/overviewLocks';
import { HoldButton } from '../shared/HoldButton';
import { DetailSheet, groupBy, HeroButton, SheetEmpty, SheetHero, SheetRow, SheetSection } from '../shared/sheet/SheetKit';
import { RecentEvents } from '../shared/sheet/RecentEvents';
import type { WidgetSheetProps } from '../types';
import { lockable, lockSince, locksSummary, lockTone, lowBattery, useLockActions } from './concepts/shared';
import { lockIcon } from './LocksCard';

export default function LocksSheet({ model: m, onClose }: WidgetSheetProps<ProLocksModel>) {
  const a = useLockActions(m);
  const canLockAll = lockable(m).length > 0;
  const rooms = groupBy(m.locks, (l) => l.roomName || 'Other', ['Other']);
  const row = (l: ProLockItem) => {
    const tone = lockTone(l);
    return (
      <SheetRow
        key={l.entityId}
        icon={lockIcon(l)}
        tone={tone === 'jammed' ? 'danger' : tone === 'unlocked' ? 'warning' : tone === 'locked' ? 'success' : 'default'}
        title={l.shortName}
        subtitle={[l.doorOpen ? 'Door open' : l.stateLabel, lockSince(l), lowBattery(l) ? `battery ${l.batteryPct}%` : null].filter(Boolean).join(' · ')}
        trailing={
          tone === 'locked' ? (
            <HoldButton
              icon={SquareUnlock02Icon}
              label="Unlock"
              ariaLabel={`Unlock ${l.name}`}
              isPending={a.busy(l.entityId)}
              onConfirm={() => void a.unlock(l.entityId)}
              fillClassName="bg-foreground/15"
              className="h-8 rounded-full px-3 text-xs font-semibold"
            />
          ) : tone === 'unlocked' ? (
            <Button
              size="sm"
              variant="primary"
              isDisabled={l.doorOpen === true}
              isPending={a.busy(l.entityId)}
              onPress={() => void a.lock(l.entityId)}
              className="h-8 gap-1.5 rounded-full px-3 text-xs font-semibold"
            >
              <HugeiconsIcon icon={SquareLock02Icon} size={14} />
              Lock
            </Button>
          ) : null
        }
      />
    );
  };
  return (
    <DetailSheet
      title="Door locks details"
      onClose={onClose}
      hero={
        <SheetHero
          icon={DoorLockIcon}
          eyebrow="Door locks"
          tone={m.total === 0 ? 'slate' : m.jammed > 0 ? 'danger' : m.unlocked > 0 ? 'warning' : 'secure'}
          headline={m.headline}
          sub={locksSummary(m)}
          onClose={onClose}
          actions={
            canLockAll ? (
              <HeroButton icon={SquareLock02Icon} solid onPress={() => void a.lockAll()}>
                {lockable(m).length === 1 ? `Lock ${lockable(m)[0].shortName}` : `Lock all ${lockable(m).length}`}
              </HeroButton>
            ) : null
          }
        />
      }
    >
      {m.total === 0 ? (
        <SheetEmpty icon={DoorLockIcon} title="No locks yet" text="Smart locks from Home Assistant show up here." />
      ) : (
        <>
          {rooms.map((g) => (
            <SheetSection key={g.key} title={g.key}>
              {g.items.map(row)}
            </SheetSection>
          ))}
          <RecentEvents groups={{ locks: m.locks.map((l) => l.entityId) }} />
          {m.lowBattery > 0 ? (
            <p className="flex items-center justify-center gap-1.5 text-xs text-muted">
              <HugeiconsIcon icon={BatteryLowIcon} size={14} />
              Replace the batteries soon: a lock with a flat battery can't be opened from here.
            </p>
          ) : null}
          <p className="text-center text-xs text-muted">Unlocking needs a press and hold.</p>
        </>
      )}
    </DetailSheet>
  );
}
