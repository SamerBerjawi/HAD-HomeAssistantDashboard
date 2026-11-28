import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { useAlertStore } from '@/store/useAlertStore';
import { useNotificationReadStore } from '@/store/useNotificationReadStore';
import { haWebSocketService } from '@/services/haWebSocket';
import { readKeyOf } from '@/services/notifications/inbox';
import type { HANotificationItem } from '@/types/notifications';
import { installableUpdates } from '../lib/notificationLogic';

export const UNDO_MS = 5000;

/**
 * Actions for the pro notification center (DESIGN.md 7.7). Bulk handlers are ported from the
 * classic NotificationDrawer. Dismissals are deferred for UNDO_MS: HA dismissals can't be undone,
 * so the HA call only runs once the undo window closes (or the panel unmounts).
 */
export function useProNotificationActions(items: readonly HANotificationItem[]) {
  const { callHAService, dismissNotification, clearAllNotifications, updateEntityState, installUpdate } = useAutoLayoutStore(
    useShallow((s) => ({
      callHAService: s.callHAService,
      dismissNotification: s.dismissNotification,
      clearAllNotifications: s.clearAllNotifications,
      updateEntityState: s.updateEntityState,
      installUpdate: s.installUpdate
    }))
  );
  const markRead = useNotificationReadStore((s) => s.markRead);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const [pending, setPending] = useState<Record<string, string>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [updatingAll, setUpdatingAll] = useState(false);

  // ---- deferred dismiss with undo ----
  const [hiddenIds, setHiddenIds] = useState<ReadonlySet<string>>(new Set());
  const [undo, setUndo] = useState<{ ids: string[]; label: string } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queued = useRef<HANotificationItem[]>([]);

  const commit = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
    const list = queued.current;
    queued.current = [];
    for (const item of list) void Promise.resolve(item.onDismiss?.()).catch(() => {});
    setUndo(null);
  }, []);

  const dismiss = useCallback(
    (item: HANotificationItem) => {
      if (!item.dismissable || !item.onDismiss) return;
      // A second dismiss commits the first one: one undo at a time.
      if (queued.current.length) commit();
      queued.current = [item];
      setHiddenIds((prev) => new Set(prev).add(item.id));
      setUndo({ ids: [item.id], label: item.title });
      undoTimer.current = setTimeout(commit, UNDO_MS);
    },
    [commit]
  );

  const undoDismiss = useCallback(() => {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = null;
    const ids = new Set(queued.current.map((i) => i.id));
    queued.current = [];
    setHiddenIds((prev) => new Set([...prev].filter((id) => !ids.has(id))));
    setUndo(null);
  }, []);

  // Closing the panel ends the undo window.
  useEffect(() => () => commit(), [commit]);

  // Forget hidden ids once HA has removed the item.
  useEffect(() => {
    if (hiddenIds.size === 0) return;
    const live = new Set(items.map((i) => i.id));
    const next = [...hiddenIds].filter((id) => live.has(id));
    if (next.length !== hiddenIds.size) setHiddenIds(new Set(next));
  }, [items, hiddenIds]);

  // ---- single actions ----
  const runAction = useCallback(
    async (item: HANotificationItem, actionId: string) => {
      const action = item.actions?.find((a) => a.id === actionId);
      if (!action) return;
      markRead([readKeyOf(item)]);
      setPending((p) => ({ ...p, [item.id]: actionId }));
      try {
        await action.onClick();
      } finally {
        setPending(({ [item.id]: _done, ...rest }) => rest);
      }
    },
    [markRead]
  );

  const markItemsRead = useCallback((list: readonly HANotificationItem[]) => markRead(list.map(readKeyOf)), [markRead]);

  // ---- bulk actions (ported from the classic drawer) ----
  const updateAll = useCallback(
    async (list: readonly HANotificationItem[] = itemsRef.current) => {
      setUpdatingAll(true);
      try {
        for (const item of installableUpdates(list)) {
          if (!item.entity_id) continue;
          if (installUpdate) installUpdate(item.entity_id);
          else await callHAService('update', 'install', {}, { entity_id: item.entity_id }).catch(() => {});
          updateEntityState?.(item.entity_id, 'installing');
        }
      } finally {
        setTimeout(() => setUpdatingAll(false), 800);
      }
    },
    [installUpdate, callHAService, updateEntityState]
  );

  const cleanSkipped = useCallback(() => {
    const ids: string[] = [];
    for (const n of itemsRef.current) {
      if (n.category !== 'update' || !n.skippedVersion) continue;
      ids.push(n.id, `skipped_${n.id}`, `skipped_${n.id}_${n.skippedVersion}`);
    }
    clearAllNotifications(ids);
  }, [clearAllNotifications]);

  const clearAll = useCallback(async () => {
    const list = itemsRef.current;
    for (const n of list) {
      if (n.category === 'persistent_notification' && n.entity_id) {
        const raw = (n as HANotificationItem & { notificationId?: string }).notificationId;
        const haId = raw || n.id.replace(/^pn_/, '').replace(/^ha_notif_/, '');
        await callHAService('persistent_notification', 'dismiss', { notification_id: haId }).catch(() => {});
        updateEntityState?.(n.entity_id, 'dismissed');
      } else if (n.category === 'repair' && n.issueId) {
        const domain = n.domain || n.entity_id?.replace(/^repair\./, '').split('_')[0] || 'homeassistant';
        await haWebSocketService.ignoreRepairIssue(domain, n.issueId).catch(() => {});
        if (n.entity_id) updateEntityState?.(n.entity_id, 'ignored');
      } else if (n.category === 'alert' && n.entity_id) {
        await callHAService('alert', 'acknowledge', { entity_id: n.entity_id }).catch(() => {});
      }
    }
    useAutoLayoutStore.setState({ nativeRepairs: [], nativeNotifications: [] });
    await useAlertStore.getState().clearAllAlerts().catch(() => {});
    clearAllNotifications(list.filter((n) => n.dismissable).map((n) => n.id));
  }, [callHAService, updateEntityState, clearAllNotifications]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await haWebSocketService.refreshStates();
    } finally {
      setTimeout(() => setRefreshing(false), 600);
    }
  }, []);

  return {
    pending,
    refreshing,
    updatingAll,
    hiddenIds,
    undo,
    dismiss,
    undoDismiss,
    runAction,
    markItemsRead,
    updateAll,
    cleanSkipped,
    clearAll,
    refresh,
    dismissNotification
  };
}

export type ProNotificationActions = ReturnType<typeof useProNotificationActions>;
