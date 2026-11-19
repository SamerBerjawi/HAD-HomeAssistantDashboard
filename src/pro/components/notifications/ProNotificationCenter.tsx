import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { AlertDialog, Button, Drawer, Dropdown, Label, SearchField } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  AlertDiamondIcon,
  Cancel01Icon,
  ArrowTurnBackwardIcon,
  CheckmarkCircle02Icon,
  CleanIcon,
  Delete02Icon,
  Message01Icon,
  MoreVerticalIcon,
  Notification03Icon,
  Refresh01Icon,
  Search01Icon,
  TickDouble02Icon
} from '@hugeicons/core-free-icons';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { useNotificationReadStore } from '@/store/useNotificationReadStore';
import { useHANotifications } from '@/hooks/useHANotifications';
import { isUnread as isUnreadIn, matchesSearch, readKeyOf } from '@/services/notifications/inbox';
import { cn } from '@/lib/utils';
import type { HANotificationItem } from '@/types/notifications';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useProNotificationActions } from '../../hooks/useProNotificationActions';
import { buildSections } from '../../lib/notificationLogic';
import { NotificationRow } from './NotificationRow';
import { NotificationStack } from './NotificationStack';

/** Search appears from this many items (owner 2026-11-19). */
const SEARCH_FROM = 8;

function useMinuteTick(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function SectionHeading({ icon, tone, children }: { icon: typeof Message01Icon; tone?: 'danger'; children: React.ReactNode }) {
  return (
    <h3 className={cn('flex items-center gap-1.5 px-3 pb-1 text-xs font-semibold uppercase tracking-wide', tone === 'danger' ? 'text-danger' : 'text-muted')}>
      <HugeiconsIcon icon={icon} size={14} />
      {children}
    </h3>
  );
}

/** Panel content. Mounted only while open, so closing ends the undo window (commits dismissals). */
function CenterContent({ desktop }: { desktop: boolean }) {
  const all = useHANotifications(true);
  const serverUrl = useAutoLayoutStore((s) => s.serverUrl);
  const readKeys = useNotificationReadStore((s) => s.readKeys);
  const now = useMinuteTick();
  const actions = useProNotificationActions(all);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [confirmClear, setConfirmClear] = useState(false);

  const items = useMemo(() => (actions.hiddenIds.size ? all.filter((n) => !actions.hiddenIds.has(n.id)) : all), [all, actions.hiddenIds]);
  const isUnread = useCallback((n: HANotificationItem) => isUnreadIn(n, readKeys), [readKeys]);
  const unread = items.filter(isUnread);
  const searching = deferredQuery.trim().length > 0;
  const results = useMemo(() => (searching ? items.filter((n) => matchesSearch(n, deferredQuery)) : []), [items, deferredQuery, searching]);
  const sections = useMemo(() => buildSections(items), [items]);
  const skipped = items.filter((n) => n.category === 'update' && n.skippedVersion).length;

  const markOne = actions.markItemsRead;
  const onOpen = useCallback((item: HANotificationItem) => markOne([item]), [markOne]);
  const row = {
    serverUrl,
    now,
    onOpen,
    onAction: actions.runAction,
    onDismiss: actions.dismiss
  };

  const menu = [
    { id: 'refresh', label: 'Refresh', icon: Refresh01Icon, run: () => void actions.refresh() },
    ...(skipped > 0 ? [{ id: 'skipped', label: `Clean skipped updates (${skipped})`, icon: CleanIcon, run: actions.cleanSkipped }] : []),
    ...(items.length > 0 ? [{ id: 'clear', label: 'Clear all', icon: Delete02Icon, danger: true, run: () => setConfirmClear(true) }] : [])
  ];

  return (
    <>
      <Drawer.Header className="flex flex-col gap-3 px-4 pt-2 md:pt-5">
        <div className="flex items-center gap-3">
          <span className="pro-soft grid size-10 shrink-0 place-items-center rounded-xl">
            <HugeiconsIcon icon={Notification03Icon} size={20} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <Drawer.Heading className="text-lg font-semibold leading-tight">Notifications</Drawer.Heading>
            <span className="flex items-center gap-1 text-xs text-muted">
              <span aria-live="polite">{items.length === 0 ? 'Nothing here' : unread.length > 0 ? `${unread.length} unread` : 'All read'}</span>
              {unread.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <Button size="sm" variant="ghost" className="h-6 min-w-0 gap-1 px-1.5 text-xs text-[var(--accent)]" onPress={() => actions.markItemsRead(unread)}>
                    <HugeiconsIcon icon={TickDouble02Icon} size={14} />
                    Mark all read
                  </Button>
                </>
              )}
            </span>
          </span>
          <Dropdown>
            <Button isIconOnly size="sm" variant="ghost" aria-label="More notification actions">
              <HugeiconsIcon icon={MoreVerticalIcon} size={18} className={cn(actions.refreshing && 'animate-spin')} />
            </Button>
            <Dropdown.Popover placement="bottom end" className="pro">
              <Dropdown.Menu aria-label="Notification actions" onAction={(key) => menu.find((m) => m.id === key)?.run()}>
                {menu.map((m) => (
                  <Dropdown.Item key={m.id} id={m.id} textValue={m.label} variant={'danger' in m && m.danger ? 'danger' : undefined}>
                    <HugeiconsIcon icon={m.icon} size={16} className="shrink-0" />
                    <Label>{m.label}</Label>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
          {desktop && (
            <Button isIconOnly size="sm" variant="ghost" slot="close" aria-label="Close notifications">
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
            </Button>
          )}
        </div>
        {(items.length >= SEARCH_FROM || query) && (
          <SearchField value={query} onChange={setQuery} fullWidth variant="secondary" aria-label="Search notifications">
            <SearchField.Group>
              <SearchField.SearchIcon>
                <HugeiconsIcon icon={Search01Icon} size={16} />
              </SearchField.SearchIcon>
              <SearchField.Input placeholder="Search notifications…" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        )}
      </Drawer.Header>

      <Drawer.Body className="flex flex-col gap-4 px-2 pb-[max(16px,env(safe-area-inset-bottom))]">
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-success/15 text-success">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} />
            </span>
            <p className="text-base font-semibold">You’re all caught up</p>
            <p className="text-sm text-muted">Alerts, updates and messages from Home Assistant show up here.</p>
          </div>
        ) : searching ? (
          results.length === 0 ? (
            <p className="inline-flex items-center gap-2 px-3 py-6 text-sm text-muted">
              <HugeiconsIcon icon={Search01Icon} size={16} />
              No notifications match “{deferredQuery.trim()}”.
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {results.map((n) => (
                <NotificationRow key={n.id} item={n} unread={isUnread(n)} pendingId={actions.pending[n.id]} {...row} />
              ))}
            </ul>
          )
        ) : (
          <>
            {sections.action.length > 0 && (
              <section aria-label="Needs action" className="flex flex-col">
                <SectionHeading icon={AlertDiamondIcon} tone="danger">
                  Needs action
                </SectionHeading>
                <ul className="flex flex-col gap-0.5">
                  {sections.action.map((n) => (
                    <NotificationRow key={n.id} item={n} unread={isUnread(n)} pendingId={actions.pending[n.id]} {...row} />
                  ))}
                </ul>
              </section>
            )}
            {sections.stacks.length > 0 && (
              <section aria-label="Alerts, repairs and updates" className="flex flex-col gap-0.5">
                {sections.stacks.map((s) => (
                  <NotificationStack
                    key={s.kind}
                    stack={s}
                    isUnread={isUnread}
                    pending={actions.pending}
                    updatingAll={actions.updatingAll}
                    onUpdateAll={(list) => void actions.updateAll(list)}
                    {...row}
                  />
                ))}
              </section>
            )}
            {sections.messages.length > 0 && (
              <section aria-label="Messages" className="flex flex-col">
                <SectionHeading icon={Message01Icon}>Messages</SectionHeading>
                <ul className="flex flex-col gap-0.5">
                  {sections.messages.map((n) => (
                    <NotificationRow key={n.id} item={n} unread={isUnread(n)} pendingId={actions.pending[n.id]} {...row} />
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </Drawer.Body>

      {actions.undo && (
        <div role="status" className="mx-3 mb-[max(12px,env(safe-area-inset-bottom))] flex items-center gap-3 rounded-2xl bg-foreground px-4 py-2.5 text-background shadow-lg">
          <HugeiconsIcon icon={Delete02Icon} size={16} className="shrink-0 opacity-70" />
          <span className="min-w-0 flex-1 truncate text-sm">Dismissed “{actions.undo.label}”</span>
          <Button size="sm" variant="ghost" className="text-background" onPress={actions.undoDismiss}>
            <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={16} />
            Undo
          </Button>
        </div>
      )}

      <AlertDialog.Backdrop isOpen={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialog.Container size="sm">
          <AlertDialog.Dialog className="pro">
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>Clear all notifications?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p className="text-sm text-muted">
                Dismisses Home Assistant messages, ignores open repairs and acknowledges alerts. Updates and live sensor alerts come back while they still apply. This can’t be undone.
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="tertiary" onPress={() => setConfirmClear(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onPress={() => {
                  setConfirmClear(false);
                  void actions.clearAll();
                }}
              >
                <HugeiconsIcon icon={Delete02Icon} size={16} />
                Clear all
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </>
  );
}

interface ProNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current page, for the accent (portaled overlays need `pro` + data-page again). */
  page: string;
}

/**
 * Pro notification center (DESIGN.md 7.7): HeroUI Drawer from the right on tablet/desktop, a
 * full-height bottom sheet on phones. Triage (Needs action), stacks by kind, then messages.
 */
export default function ProNotificationCenter({ isOpen, onClose, page }: ProNotificationCenterProps) {
  const desktop = useMediaQuery('(min-width: 768px)');
  return (
    <Drawer.Backdrop isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Content placement={desktop ? 'right' : 'bottom'}>
        <Drawer.Dialog
          aria-label="Notifications"
          data-page={page}
          className={cn('pro flex flex-col bg-background', desktop ? 'h-full w-[420px] max-w-[100vw]' : 'h-[92dvh] max-h-[92dvh]')}
        >
          {!desktop && <Drawer.Handle />}
          <CenterContent desktop={desktop} />
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
