/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Notification Center: an activity inbox with animated filter tabs, a grouped timeline,
 * unread dots, inline actions, "Mark all read" and a composed empty state.
 *
 * Presentational only: the caller owns the data and read state. Derived data (counts, filtering,
 * grouping) is memoized here and rows are memoized cards, so an update to one item re-renders
 * that one card.
 */

import React, { useCallback, useId, useMemo, useRef, useState } from 'react';
import { BellSlash, Checks } from '@phosphor-icons/react';
import { Tab, TabList, TabPanel, Tabs } from 'react-aria-components';
import { cn } from '@/lib/utils';
import { glass } from '@/lib/glass';
import { groupEntries } from '../../services/notifications/inbox';
import NotificationCenterCard, { type NotificationCenterItem } from './NotificationCenterCard';

export type { NotificationCenterItem, NotificationCenterAction, NotificationCenterStatus } from './NotificationCenterCard';

export interface NotificationCenterTab {
  id: string;
  label: string;
}

const DEFAULT_TABS: readonly NotificationCenterTab[] = [
  { id: 'all', label: 'All' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'system', label: 'System' }
];

export interface NotificationCenterProps {
  notifications: readonly NotificationCenterItem[];
  /** Tabs; the first one ("all") shows everything, others filter on `item.category`. */
  tabs?: readonly NotificationCenterTab[];
  defaultTab?: string;
  tab?: string;
  onTabChange?: (tab: string) => void;
  onAction?: (notificationId: string, actionId: string) => void;
  onDismiss?: (notificationId: string) => void;
  /** Called with the ids of every unread notification. Hidden when omitted. */
  onMarkAllRead?: (notificationIds: string[]) => void;
  /** notificationId -> actionId currently running. */
  pendingActions?: Readonly<Record<string, string>>;
  title?: string;
  emptyMessage?: string;
  /** Extra controls rendered between the tabs and the list (search, bulk actions). */
  toolbar?: React.ReactNode;
  /** Constrain the list to ~516px and scroll it. Turn off inside an already scrolling drawer. */
  scrollable?: boolean;
  className?: string;
}

export function NotificationCenter({
  notifications,
  tabs = DEFAULT_TABS,
  defaultTab,
  tab: controlledTab,
  onTabChange,
  onAction,
  onDismiss,
  onMarkAllRead,
  pendingActions,
  title = 'Notifications',
  emptyMessage = "You're all caught up.",
  toolbar,
  scrollable = true,
  className
}: NotificationCenterProps) {
  const baseId = useId();
  const allTabId = tabs[0]?.id ?? 'all';
  const [uncontrolledTab, setUncontrolledTab] = useState(defaultTab ?? allTabId);
  const activeTab = controlledTab ?? uncontrolledTab;

  const selectTab = useCallback(
    (id: string) => {
      if (controlledTab === undefined) setUncontrolledTab(id);
      onTabChange?.(id);
    },
    [controlledTab, onTabChange]
  );

  // One pass for every tab's counts and the unread list
  const { counts, unreadIds } = useMemo(() => {
    const c: Record<string, { total: number; unread: number }> = {};
    for (const t of tabs) c[t.id] = { total: 0, unread: 0 };
    const unread: string[] = [];
    for (const n of notifications) {
      c[allTabId].total++;
      const bucket = c[n.category];
      if (bucket && n.category !== allTabId) bucket.total++;
      if (n.unread) {
        unread.push(n.id);
        c[allTabId].unread++;
        if (bucket && n.category !== allTabId) bucket.unread++;
      }
    }
    return { counts: c, unreadIds: unread };
  }, [notifications, tabs, allTabId]);

  const sections = useMemo(() => {
    const visible = activeTab === allTabId ? notifications : notifications.filter((n) => n.category === activeTab);
    return groupEntries(visible);
  }, [notifications, activeTab, allTabId]);

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === activeTab));
  const unreadCount = unreadIds.length;

  const headingId = `${baseId}-title`;

  return (
    <section aria-labelledby={headingId} className={cn('flex flex-col gap-3', className)}>
      {/* Header: title, unread summary, mark all read */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 id={headingId} className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400" aria-live="polite">
            {unreadCount > 0 ? `${unreadCount} unread` : 'No unread notifications'}
          </p>
        </div>
        {onMarkAllRead && (
          <button
            type="button"
            onClick={() => onMarkAllRead(unreadIds)}
            disabled={unreadCount === 0}
            className={cn(
              glass.field,
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200',
              'hover:text-sky-600 dark:hover:text-sky-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-inherit'
            )}
          >
            <Checks size={14} weight="bold" />
            Mark all read
          </button>
        )}
      </div>

      <Tabs selectedKey={activeTab} onSelectionChange={(key) => selectTab(String(key))}>
      {/* Segmented tabs: the indicator slides with a transform, no layout measurement */}
      <TabList aria-label={`${title} filters`} className={cn(glass.field, 'relative grid p-1 rounded-xl')} style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 left-1 rounded-lg bg-white dark:bg-white/[0.12] shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{
            width: `calc((100% - 0.5rem) / ${tabs.length})`,
            transform: `translateX(${activeIndex * 100}%)`
          }}
        />
        {tabs.map((t) => {
          const selected = t.id === activeTab;
          const count = counts[t.id]?.total ?? 0;
          const unread = counts[t.id]?.unread ?? 0;
          return (
            <Tab
              key={t.id}
              id={t.id}
              className={cn(
                'relative z-10 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                'focus-visible:outline-2 focus-visible:outline-sky-500 focus-visible:outline-offset-1',
                selected ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              )}
            >
              <span>{t.label}</span>
              <span
                className={cn(
                  'min-w-[18px] px-1 rounded-full text-[10px] leading-[18px] tabular-nums',
                  unread > 0
                    ? 'bg-sky-500 text-white'
                    : selected
                      ? 'bg-slate-900/10 text-slate-700 dark:bg-white/15 dark:text-slate-200'
                      : 'bg-slate-900/5 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                )}
                aria-label={unread > 0 ? `${count} total, ${unread} unread` : `${count} total`}
              >
                {count}
              </span>
            </Tab>
          );
        })}
      </TabList>

      {toolbar}

      {/* Timeline */}
      <TabPanel
        id={activeTab}
        shouldForceMount
        className={cn(scrollable && 'max-h-[516px] overflow-y-auto overscroll-contain -mx-1 px-1')}
      >
        {sections.length === 0 ? (
          <div className={cn(glass.tile, 'rounded-2xl px-6 py-10 flex flex-col items-center text-center gap-3')}>
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-sky-400/20 blur-xl" aria-hidden="true" />
              <div className={cn(glass.iconWell, 'relative w-12 h-12 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-300')}>
                <BellSlash size={24} weight="duotone" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{emptyMessage}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">New activity will appear here when it arrives.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sections.map((section) => (
              <div key={section.group} role="group" aria-label={section.group} className="flex flex-col gap-2">
                <h4 className="px-1 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {section.group}
                </h4>
                {section.entries.map((item) => (
                  <NotificationCenterCard
                    key={item.id}
                    item={item}
                    pendingActionId={pendingActions?.[item.id]}
                    onAction={onAction}
                    onDismiss={onDismiss}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </TabPanel>
      </Tabs>
    </section>
  );
}

export default NotificationCenter;
