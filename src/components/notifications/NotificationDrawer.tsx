/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Notification drawer: wires the live Home Assistant notification list into <NotificationCenter>.
 *
 * Performance: the list comes from a gated, reconciled selector (useHANotifications), so items keep
 * their identity across unrelated HA state events. Each item's view model is cached by that
 * identity, so the memoized cards only re-render when their own notification (or read state)
 * changes.
 */

import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  ArrowsClockwise,
  Trash,
  ArrowSquareOut,
  Warning,
  ShieldWarning,
  Drop,
  Flame,
  BatteryLow,
  DownloadSimple,
  SkipForward,
  Sparkle,
  Info,
  X,
  MagnifyingGlass,
  Check,
  ArrowUUpLeft,
  Broom
} from '@phosphor-icons/react';
import DetailsRightDrawer from '../overview/DetailsRightDrawer';
import { useAutoLayoutStore } from '../../store/useAutoLayoutStore';
import { useShallow } from 'zustand/react/shallow';
import { formatTimeAgo } from '../../services/notificationsService';
import { useHANotifications } from '../../hooks/useHANotifications';
import type { HANotificationItem, HANotificationAction } from '../../types/notifications';
import { haWebSocketService } from '../../services/haWebSocket';
import { useAlertStore } from '../../store/useAlertStore';
import { useNotificationReadStore } from '../../store/useNotificationReadStore';
import {
  INBOX_TABS,
  buildInboxEntries,
  matchesSearch,
  readKeyOf,
  type InboxEntry,
  type InboxTab
} from '../../services/notifications/inbox';
import { normalizeIntegrationDomain } from './IntegrationIcon';
import NotificationRichContent from './NotificationRichContent';
import IntegrationIcon from './IntegrationIcon';
import NotificationChangelog from './NotificationChangelog';
import NotificationCenter from './NotificationCenter';
import type {
  NotificationCenterAction,
  NotificationCenterItem,
  NotificationCenterStatus
} from './NotificationCenterCard';
import { cn } from '@/lib/utils';
import { glass } from '@/lib/glass';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
}

// ---------------------------------------------------------------------------------------------
// Item -> card view model
// ---------------------------------------------------------------------------------------------

function statusOf(item: HANotificationItem): NotificationCenterStatus {
  switch (item.severity) {
    case 'critical':
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'update':
    case 'info':
      return item.category === 'persistent_notification' ? 'neutral' : 'information';
    default:
      return 'neutral';
  }
}

function categoryGlyph(item: HANotificationItem): React.ReactNode {
  const props = { size: 18, weight: 'duotone' as const };
  switch (item.category) {
    case 'update':
      return <DownloadSimple {...props} />;
    case 'restart':
      return <ArrowsClockwise size={18} weight="bold" />;
    case 'hazard':
      return item.sensorType === 'leak' ? <Drop {...props} /> : <Flame {...props} />;
    case 'battery':
      return <BatteryLow {...props} />;
    case 'security':
      return <ShieldWarning {...props} />;
    case 'appliance':
      return <Sparkle {...props} />;
    case 'repair':
    case 'alert':
      return <Warning {...props} />;
    default:
      return <Info {...props} />;
  }
}

function isPrimaryAction(a: HANotificationAction): boolean {
  return a.variant === 'primary' || a.id === 'install' || a.id.startsWith('restart_') || a.id.startsWith('ack_') || a.id === 'unskip';
}

function actionIcon(a: HANotificationAction): React.ReactNode {
  if (a.id.startsWith('restart_')) return <ArrowsClockwise size={11} weight="bold" />;
  if (a.id === 'install') return <DownloadSimple size={11} weight="bold" />;
  if (a.id === 'skip') return <SkipForward size={11} weight="bold" />;
  if (a.id === 'unskip') return <ArrowUUpLeft size={11} weight="bold" />;
  if (a.id.startsWith('ack_')) return <Check size={11} weight="bold" />;
  if (a.id === 'learn_more') return <ArrowSquareOut size={11} weight="bold" />;
  return undefined;
}

function toCardActions(item: HANotificationItem): NotificationCenterAction[] | undefined {
  // Release notes are shown by the expandable changelog instead
  const actions = (item.actions || []).filter((a) => a.id !== 'release_notes');
  if (actions.length === 0) return undefined;
  const primary = actions.filter(isPrimaryAction);
  const rest = actions.filter((a) => !isPrimaryAction(a));
  return [...primary, ...rest].map((a) => ({
    id: a.id,
    label: a.label,
    variant: isPrimaryAction(a) ? 'primary' : a.variant === 'danger' ? 'danger' : 'secondary',
    icon: actionIcon(a)
  }));
}

function ItemDetails({ item, darkMode }: { item: HANotificationItem; darkMode: boolean }) {
  return (
    <div className="space-y-2">
      {item.category === 'update' && (
        <div className="flex items-center gap-1.5 flex-wrap font-semibold">
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-900/[0.04] dark:bg-white/5 border border-slate-900/[0.06] dark:border-white/5 font-mono text-[11px] text-slate-700 dark:text-slate-300">
            <span>{item.installedVersion || 'Current'}</span>
            <span className="text-slate-400" aria-hidden="true">→</span>
            <span className="sr-only">to</span>
            <span className="font-bold text-sky-700 dark:text-sky-400">{item.latestVersion || 'New'}</span>
          </div>
          {item.skippedVersion && (
            <span className="text-[11px] font-bold px-1.5 rounded bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/25">
              Skipped
            </span>
          )}
        </div>
      )}

      {item.message ? (
        <NotificationRichContent content={item.message} imageUrl={item.image} darkMode={darkMode} compact />
      ) : null}

      <NotificationChangelog item={item} darkMode={darkMode} />

      {item.inProgress && (
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] font-bold text-sky-600 dark:text-sky-400">
            <span className="flex items-center gap-1">
              <ArrowsClockwise size={11} className="animate-spin" />
              Installing update...
            </span>
            <span>{item.updatePercentage ? `${item.updatePercentage}%` : 'In progress'}</span>
          </div>
          <div className="w-full h-1 rounded-full bg-sky-500/20 overflow-hidden">
            {/* scaleX instead of width: progress changes don't trigger layout */}
            <div
              className="h-full w-full origin-left bg-sky-500 rounded-full transition-transform duration-300"
              style={{ transform: `scaleX(${(item.updatePercentage ?? 70) / 100})` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function buildCard(
  entry: InboxEntry,
  timestamp: string,
  darkMode: boolean,
  serverUrl: string | undefined
): NotificationCenterItem {
  const { item } = entry;
  const hasBrand = Boolean(item.image || normalizeIntegrationDomain(item.domain, undefined, item.title));
  const metaParts = [item.source, item.areaName && item.areaName !== item.source ? item.areaName : undefined].filter(Boolean);
  return {
    id: item.id,
    category: entry.category,
    group: entry.group,
    title: item.title,
    timestamp,
    meta: metaParts.length ? metaParts.join(' · ') : undefined,
    unread: entry.unread,
    status: statusOf(item),
    statusIcon: categoryGlyph(item),
    icon: hasBrand ? (
      <IntegrationIcon
        domain={item.domain}
        entityPicture={item.image}
        title={item.title}
        category={item.category}
        serverUrl={serverUrl}
        size="md"
      />
    ) : undefined,
    actions: toCardActions(item),
    actionsDisabled: item.inProgress,
    dismissible: Boolean(item.dismissable && item.onDismiss),
    details: <ItemDetails item={item} darkMode={darkMode} />
  };
}

interface CachedCard {
  unread: boolean;
  group: string;
  timestamp: string;
  card: NotificationCenterItem;
}

/** Re-renders the drawer once a minute while open so "5m ago" stays current. */
function useMinuteTick(enabled: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, [enabled]);
  return now;
}

// ---------------------------------------------------------------------------------------------
// Drawer
// ---------------------------------------------------------------------------------------------

export default function NotificationDrawer({ isOpen, onClose, darkMode = true }: NotificationDrawerProps) {
  const { callHAService, dismissNotification, clearAllNotifications, updateEntityState, installUpdate, serverUrl } =
    useAutoLayoutStore(
      useShallow((s) => ({
        callHAService: s.callHAService,
        dismissNotification: s.dismissNotification,
        clearAllNotifications: s.clearAllNotifications,
        updateEntityState: s.updateEntityState,
        installUpdate: s.installUpdate,
        serverUrl: s.serverUrl
      }))
    );
  const readKeys = useNotificationReadStore((s) => s.readKeys);
  const markRead = useNotificationReadStore((s) => s.markRead);

  const [activeTab, setActiveTab] = useState<InboxTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredQuery = useDeferredValue(searchQuery);
  const [pendingActions, setPendingActions] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingAll, setIsUpdatingAll] = useState(false);

  // The drawer stays mounted after its first open; only track the live list while it's open,
  // and keep showing the last list during the closing animation.
  const liveNotifications = useHANotifications(isOpen);
  const lastNotificationsRef = useRef(liveNotifications);
  if (isOpen) lastNotificationsRef.current = liveNotifications;
  const allNotifications = isOpen ? liveNotifications : lastNotificationsRef.current;
  const now = useMinuteTick(isOpen);

  // Latest list for callbacks, so they can stay referentially stable for the memoized cards
  const itemsRef = useRef(allNotifications);
  itemsRef.current = allNotifications;

  const entries = useMemo(() => {
    const searched = deferredQuery.trim() ? allNotifications.filter((n) => matchesSearch(n, deferredQuery)) : allNotifications;
    return buildInboxEntries(searched, readKeys, now);
  }, [allNotifications, deferredQuery, readKeys, now]);

  // View models cached by item identity; rebuilt only when that item, its read state, its group
  // or its relative time changes. Theme or server changes reset the cache.
  const cacheRef = useRef<{ key: string; map: WeakMap<HANotificationItem, CachedCard> }>({ key: '', map: new WeakMap() });
  const cards = useMemo(() => {
    const cacheKey = `${darkMode}|${serverUrl ?? ''}`;
    if (cacheRef.current.key !== cacheKey) cacheRef.current = { key: cacheKey, map: new WeakMap() };
    const cache = cacheRef.current.map;
    return entries.map((entry) => {
      const timestamp = formatTimeAgo(entry.item.createdAt);
      const hit = cache.get(entry.item);
      if (hit && hit.unread === entry.unread && hit.group === entry.group && hit.timestamp === timestamp) return hit.card;
      const card = buildCard(entry, timestamp, darkMode, serverUrl);
      cache.set(entry.item, { unread: entry.unread, group: entry.group, timestamp, card });
      return card;
    });
  }, [entries, darkMode, serverUrl]);

  const handleAction = useCallback(
    async (notificationId: string, actionId: string) => {
      const item = itemsRef.current.find((n) => n.id === notificationId);
      const action = item?.actions?.find((a) => a.id === actionId);
      if (!item || !action) return;
      markRead([readKeyOf(item)]);
      setPendingActions((prev) => ({ ...prev, [notificationId]: actionId }));
      try {
        await action.onClick();
      } finally {
        setPendingActions((prev) => {
          const { [notificationId]: _done, ...rest } = prev;
          return rest;
        });
      }
    },
    [markRead]
  );

  const handleDismiss = useCallback(
    (notificationId: string) => {
      const item = itemsRef.current.find((n) => n.id === notificationId);
      if (!item?.onDismiss) return;
      markRead([readKeyOf(item)]);
      void item.onDismiss();
    },
    [markRead]
  );

  const handleMarkAllRead = useCallback(
    (ids: string[]) => {
      const wanted = new Set(ids);
      markRead(itemsRef.current.filter((n) => wanted.has(n.id)).map(readKeyOf));
    },
    [markRead]
  );

  // ---- Bulk actions (unchanged behaviour from the previous drawer) ----

  const skippedUpdates = useMemo(
    () => allNotifications.filter((n) => n.category === 'update' && n.skippedVersion),
    [allNotifications]
  );
  const pendingUpdateCount = useMemo(
    () => allNotifications.reduce((acc, n) => acc + (n.category === 'update' ? 1 : 0), 0),
    [allNotifications]
  );

  const handleDismissSkippedUpdates = () => {
    const idsToDismiss: string[] = [];
    for (const n of skippedUpdates) {
      idsToDismiss.push(n.id, `skipped_${n.id}`);
      if (n.skippedVersion) idsToDismiss.push(`skipped_${n.id}_${n.skippedVersion}`);
    }
    clearAllNotifications(idsToDismiss);
  };

  const handleDismissAll = async () => {
    const list = itemsRef.current;
    const dismissableIds = list.filter((n) => n.dismissable).map((n) => n.id);
    for (const notif of list) {
      if (notif.category === 'persistent_notification' && notif.entity_id) {
        const cleanHaId =
          (notif as typeof notif & { notificationId?: string }).notificationId ||
          (notif.id.startsWith('pn_') ? notif.id.replace('pn_', '') : notif.id.startsWith('ha_notif_') ? notif.id.replace('ha_notif_', '') : notif.id);
        await callHAService('persistent_notification', 'dismiss', { notification_id: cleanHaId }).catch(() => {});
        if (updateEntityState) updateEntityState(notif.entity_id, 'dismissed');
      } else if (notif.category === 'repair' && notif.issueId) {
        const issueDomain = notif.domain || notif.entity_id?.replace(/^repair\./, '').split('_')[0] || 'homeassistant';
        await haWebSocketService.ignoreRepairIssue(issueDomain, notif.issueId).catch(() => {});
        if (updateEntityState && notif.entity_id) updateEntityState(notif.entity_id, 'ignored');
      } else if (notif.category === 'alert' && notif.entity_id) {
        await callHAService('alert', 'acknowledge', { entity_id: notif.entity_id }).catch(() => {});
      }
    }
    useAutoLayoutStore.setState({ nativeRepairs: [], nativeNotifications: [] });
    await useAlertStore.getState().clearAllAlerts().catch(() => {});
    clearAllNotifications(dismissableIds);
  };

  const handleUpdateAll = async () => {
    setIsUpdatingAll(true);
    const updateItems = itemsRef.current.filter((n) => n.category === 'update');
    try {
      for (const item of updateItems) {
        if (!item.entity_id) continue;
        if (installUpdate) {
          installUpdate(item.entity_id);
        } else {
          await callHAService('update', 'install', {}, { entity_id: item.entity_id }).catch(() => {});
        }
        if (updateEntityState) updateEntityState(item.entity_id, 'installing');
        dismissNotification(item.id);
      }
    } finally {
      setTimeout(() => setIsUpdatingAll(false), 800);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await haWebSocketService.refreshStates();
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const total = allNotifications.length;
  const chip = cn(
    glass.field,
    'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 text-slate-700 dark:text-slate-200'
  );

  const toolbar = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {pendingUpdateCount > 0 && (
          <button
            type="button"
            onClick={handleUpdateAll}
            disabled={isUpdatingAll}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Install all updates"
          >
            <DownloadSimple size={13} weight="bold" />
            <span>{isUpdatingAll ? 'Updating...' : `Update all (${pendingUpdateCount})`}</span>
          </button>
        )}
        {skippedUpdates.length > 0 && (
          <button
            type="button"
            onClick={handleDismissSkippedUpdates}
            className={cn(chip, 'hover:text-amber-600 dark:hover:text-amber-300')}
            title="Clean all skipped updates from notifications"
          >
            <Broom size={13} weight="bold" />
            <span>Clean skipped ({skippedUpdates.length})</span>
          </button>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRefresh}
            className={cn(chip, 'px-2 hover:text-sky-600 dark:hover:text-sky-300')}
            aria-label="Refresh states and notifications"
            title="Refresh states and notifications"
          >
            <ArrowsClockwise size={14} className={isRefreshing ? 'animate-spin text-sky-500' : ''} />
          </button>
          {total > 0 && (
            <button
              type="button"
              onClick={handleDismissAll}
              className={cn(chip, 'hover:text-rose-600 dark:hover:text-rose-400')}
              title="Dismiss all notifications"
            >
              <Trash size={13} />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>

      {(total > 4 || searchQuery.length > 0) && (
        <div className="relative w-full">
          <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            aria-label="Search notifications"
            className={cn(
              glass.field,
              'w-full pl-8 pr-8 py-1.5 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-sky-500/40'
            )}
          />
          {searchQuery && (
            <button
              aria-label="Clear search"
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <DetailsRightDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Notifications"
      subtitle={`${total} active item${total === 1 ? '' : 's'}`}
      icon={<Bell size={20} weight="duotone" className="text-sky-400" />}
      darkMode={darkMode}
    >
      <div className="pb-24 sm:pb-6">
        <NotificationCenter
          title="Activity"
          notifications={cards}
          tabs={INBOX_TABS}
          tab={activeTab}
          onTabChange={(t) => setActiveTab(t as InboxTab)}
          onAction={handleAction}
          onDismiss={handleDismiss}
          onMarkAllRead={handleMarkAllRead}
          pendingActions={pendingActions}
          toolbar={toolbar}
          scrollable={false}
          emptyMessage={searchQuery ? 'No notifications match your search.' : "You're all caught up."}
        />
      </div>
    </DetailsRightDrawer>
  );
}
