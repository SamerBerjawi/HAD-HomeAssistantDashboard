import { useState } from 'react';
import { Button, Disclosure } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Download04Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { HANotificationItem } from '@/types/notifications';
import { installableUpdates, strongestTone, type NotificationStack as Stack } from '../../lib/notificationLogic';
import { STACK_ICON, TONE_TILE } from './NotificationIcon';
import { NotificationRow, type NotificationRowProps } from './NotificationRow';

type RowShared = Omit<NotificationRowProps, 'item' | 'unread' | 'pendingId'>;

interface NotificationStackProps extends RowShared {
  stack: Stack;
  isUnread: (item: HANotificationItem) => boolean;
  pending: Readonly<Record<string, string>>;
  updatingAll: boolean;
  onUpdateAll: (items: readonly HANotificationItem[]) => void;
}

/**
 * A collapsed stack of one kind (DESIGN.md 7.7): summary line, bulk action (Update all), tap to
 * expand the rows. A stack of one renders as its row.
 */
export function NotificationStack({ stack, isUnread, pending, updatingAll, onUpdateAll, ...row }: NotificationStackProps) {
  const [open, setOpen] = useState(false);
  if (stack.items.length === 1) {
    const item = stack.items[0];
    return (
      <ul className="flex flex-col">
        <NotificationRow item={item} unread={isUnread(item)} pendingId={pending[item.id]} {...row} />
      </ul>
    );
  }
  const unread = stack.items.filter(isUnread).length;
  const tone = strongestTone(stack.items);
  const installable = stack.kind === 'updates' ? installableUpdates(stack.items) : [];

  return (
    <Disclosure isExpanded={open} onExpandedChange={setOpen} className="rounded-2xl">
      <div className="relative flex items-center">
        <Disclosure.Heading className="m-0 min-w-0 flex-1">
          <Disclosure.Trigger className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left outline-none hover:bg-default/40 focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
            <span className="relative isolate">
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', TONE_TILE[tone])}>
                <HugeiconsIcon icon={STACK_ICON[stack.kind]} size={18} />
              </span>
              {/* Stacked-cards hint */}
              <span aria-hidden="true" className={cn('absolute -bottom-1 left-1 right-1 -z-10 h-2 rounded-b-lg opacity-60', TONE_TILE[tone])} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                {stack.title}
                <span className="rounded-full bg-default px-1.5 text-xs font-medium tabular-nums text-muted">{stack.items.length}</span>
                {unread > 0 && <span className="sr-only">{unread} unread</span>}
                {unread > 0 && <span aria-hidden="true" className="size-2 rounded-full bg-[var(--accent)]" />}
              </span>
              <span className="truncate text-xs text-muted">{stack.summary}</span>
            </span>
            {installable.length > 0 && <span aria-hidden="true" className="w-32 shrink-0" />}
            <HugeiconsIcon icon={ArrowDown01Icon} size={18} className={cn('shrink-0 text-muted transition-transform', open && 'rotate-180')} />
          </Disclosure.Trigger>
        </Disclosure.Heading>
        {installable.length > 0 && (
          <Button size="sm" variant="primary" className="absolute right-10 top-1/2 -translate-y-1/2" isPending={updatingAll} onPress={() => onUpdateAll(installable)}>
            <HugeiconsIcon icon={Download04Icon} size={16} />
            {installable.length === stack.items.length ? 'Update all' : `Update ${installable.length}`}
          </Button>
        )}
      </div>
      <Disclosure.Content>
        <Disclosure.Body>
          <ul className="ml-[29px] flex flex-col gap-0.5 border-l border-separator pb-1 pl-2">
            {stack.items.map((item) => (
              <NotificationRow key={item.id} item={item} unread={isUnread(item)} pendingId={pending[item.id]} {...row} />
            ))}
          </ul>
        </Disclosure.Body>
      </Disclosure.Content>
    </Disclosure>
  );
}
