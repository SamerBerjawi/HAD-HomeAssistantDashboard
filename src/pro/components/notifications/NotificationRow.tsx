import { memo, useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { Button, Disclosure, ProgressBar, Spinner } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  ArrowTurnBackwardIcon,
  Cancel01Icon,
  Delete02Icon,
  Download04Icon,
  Forward02Icon,
  LinkSquare02Icon,
  NextIcon,
  Note01Icon,
  Refresh01Icon,
  Tick02Icon,
  Wrench01Icon
} from '@hugeicons/core-free-icons';
import { formatTimeAgo } from '@/services/notifications/formatTimeAgo';
import { haWebSocketService } from '@/services/haWebSocket';
import { cn } from '@/lib/utils';
import type { HANotificationAction, HANotificationItem } from '@/types/notifications';
import { HIDDEN_ACTION_IDS, rowSummary } from '../../lib/notificationLogic';
import { NotificationIcon } from './NotificationIcon';
import { NotificationMarkdown } from './NotificationMarkdown';

const SWIPE_DISMISS_PX = 96;

function actionIcon(a: HANotificationAction): IconSvgElement {
  if (a.id === 'install') return Download04Icon;
  if (a.id === 'skip') return NextIcon;
  if (a.id === 'unskip') return ArrowTurnBackwardIcon;
  if (a.id.startsWith('restart') || a.id.startsWith('reboot')) return Refresh01Icon;
  if (a.id.startsWith('ack')) return Tick02Icon;
  if (a.id === 'learn_more' || a.id.includes('doc') || a.id.includes('repo') || a.id.includes('url')) return LinkSquare02Icon;
  if (a.id.includes('fix')) return Wrench01Icon;
  if (a.id === 'dismiss' || a.id.includes('ignore')) return Cancel01Icon;
  if (a.id === 'later') return Forward02Icon;
  return Tick02Icon;
}

function isPrimary(a: HANotificationAction): boolean {
  return a.variant === 'primary' || a.id === 'install' || a.id.startsWith('restart') || a.id.startsWith('ack') || a.id === 'unskip' || a.id.includes('fix');
}

/** Release notes, fetched from HA the first time the row opens. */
function ReleaseNotes({ item }: { item: HANotificationItem }) {
  const [notes, setNotes] = useState<string | null>(item.releaseNotes || null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (notes || !item.entity_id?.startsWith('update.')) return;
    let live = true;
    setLoading(true);
    haWebSocketService
      .getReleaseNotes(item.entity_id)
      .then((n) => live && n && setNotes(n))
      .catch(() => {})
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [item.entity_id, notes]);

  const text = notes || item.releaseSummary;
  if (loading && !text) {
    return (
      <p className="inline-flex items-center gap-2 text-sm text-muted">
        <Spinner size="sm" /> Loading release notes…
      </p>
    );
  }
  if (!text) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
        <HugeiconsIcon icon={Note01Icon} size={14} /> Release notes
      </p>
      <div className="max-h-64 overflow-y-auto overscroll-contain rounded-xl bg-default/50 p-3">
        <NotificationMarkdown content={text} />
      </div>
    </div>
  );
}

function Details({ item, pendingId, onAction }: { item: HANotificationItem; pendingId?: string; onAction: (id: string) => void }) {
  const actions = (item.actions || []).filter((a) => !HIDDEN_ACTION_IDS.has(a.id));
  const sorted = [...actions.filter(isPrimary), ...actions.filter((a) => !isPrimary(a))];
  const isUpdate = item.category === 'update';
  return (
    <div className="flex flex-col gap-3 pb-1 pt-1">
      {isUpdate && item.installedVersion && item.latestVersion && (
        <p className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-default px-2 py-1 font-mono text-xs">
          <HugeiconsIcon icon={Download04Icon} size={14} className="text-muted" />
          {item.installedVersion}
          <span aria-hidden="true" className="text-muted">→</span>
          <span className="sr-only">to</span>
          <span className="font-semibold text-[var(--accent)]">{item.latestVersion}</span>
        </p>
      )}
      {item.inProgress && (
        <ProgressBar aria-label="Installing" value={item.updatePercentage ?? undefined} isIndeterminate={!item.updatePercentage} size="sm" color="accent">
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      )}
      {item.message && !isUpdate && <NotificationMarkdown content={item.message} />}
      {isUpdate && <ReleaseNotes item={item} />}
      {sorted.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sorted.map((a) => (
            <Button
              key={a.id}
              size="sm"
              variant={isPrimary(a) ? 'primary' : a.variant === 'danger' ? 'danger-soft' : 'tertiary'}
              isPending={pendingId === a.id}
              isDisabled={Boolean(item.inProgress) || (pendingId !== undefined && pendingId !== a.id)}
              onPress={() => onAction(a.id)}
            >
              {pendingId === a.id ? <Spinner size="sm" color="current" /> : <HugeiconsIcon icon={actionIcon(a)} size={16} />}
              {a.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

export interface NotificationRowProps {
  item: HANotificationItem;
  unread: boolean;
  serverUrl?: string;
  pendingId?: string;
  /** Re-render tick for "5m ago". */
  now: number;
  onOpen: (item: HANotificationItem) => void;
  onAction: (item: HANotificationItem, actionId: string) => void;
  onDismiss: (item: HANotificationItem) => void;
}

/**
 * One notification (DESIGN.md 7.7): compact row, tap to expand (HeroUI Disclosure), swipe left
 * to dismiss on touch (motion), ✕ on hover/focus on desktop.
 */
export const NotificationRow = memo(function NotificationRow({ item, unread, serverUrl, pendingId, now, onOpen, onAction, onDismiss }: NotificationRowProps) {
  void now;
  const [open, setOpen] = useState(false);
  const dismissible = Boolean(item.dismissable && item.onDismiss);
  const x = useMotionValue(0);
  const reveal = useTransform(x, [-SWIPE_DISMISS_PX, -16, 0], [1, 0.3, 0]);
  const draggedAt = useRef(0);
  const summary = rowSummary(item);

  const toggle = (next: boolean) => {
    // A swipe ends with a pointer-up on the trigger: don't treat it as a tap.
    if (Date.now() - draggedAt.current < 250) return;
    setOpen(next);
    if (next) onOpen(item);
  };

  return (
    <li className="group/row relative list-none overflow-hidden rounded-2xl">
      {dismissible && (
        <motion.span aria-hidden="true" style={{ opacity: reveal }} className="absolute inset-0 flex items-center justify-end rounded-2xl bg-danger pr-5 text-danger-foreground">
          <HugeiconsIcon icon={Delete02Icon} size={20} />
        </motion.span>
      )}
      <motion.div
        style={{ x }}
        drag={dismissible ? 'x' : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.9, right: 0 }}
        onDragStart={() => (draggedAt.current = Date.now())}
        onDragEnd={(_, info) => {
          draggedAt.current = Date.now();
          if (info.offset.x < -SWIPE_DISMISS_PX || info.velocity.x < -600) {
            animate(x, -480, { duration: 0.18 }).then(() => onDismiss(item));
          }
        }}
        className="relative rounded-2xl bg-background"
      >
        <Disclosure isExpanded={open} onExpandedChange={toggle} className={cn('rounded-2xl transition-colors', open ? 'bg-default/40' : 'hover:bg-default/40')}>
          <Disclosure.Heading className="m-0">
            <Disclosure.Trigger className="flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 pr-10 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
              <NotificationIcon item={item} serverUrl={serverUrl} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-baseline gap-2">
                  <span className={cn('min-w-0 flex-1 truncate text-sm', unread ? 'font-semibold' : 'font-medium')}>{item.title}</span>
                  <time className="shrink-0 text-xs text-muted" dateTime={item.createdAt}>
                    {formatTimeAgo(item.createdAt)}
                  </time>
                </span>
                {summary && !(open && item.message && item.category !== 'update') && <span className="truncate text-xs text-muted">{summary}</span>}
              </span>
              {unread && <span aria-label="Unread" className="absolute right-4 top-4 size-2 rounded-full bg-[var(--accent)] group-hover/row:opacity-0 group-focus-within/row:opacity-0" />}
            </Disclosure.Trigger>
          </Disclosure.Heading>
          {dismissible && (
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label={`Dismiss ${item.title}`}
              className="absolute right-1.5 top-1.5 opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100 [@media(hover:none)]:hidden"
              onPress={() => onDismiss(item)}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </Button>
          )}
          <Disclosure.Content>
            <Disclosure.Body className="px-3 pb-3 pt-0">
              <Details item={item} pendingId={pendingId} onAction={(id) => (id === 'dismiss' && dismissible ? onDismiss(item) : onAction(item, id))} />
            </Disclosure.Body>
          </Disclosure.Content>
        </Disclosure>
      </motion.div>
    </li>
  );
});
