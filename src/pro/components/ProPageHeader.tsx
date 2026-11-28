import { useEffect, useRef } from 'react';
import { Badge, Button, Dropdown, Label, Tooltip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { MoreVerticalIcon, Notification01Icon, WavingHand01Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { timeGreeting } from '../lib/pageSentences';
import PageSentence from './PageSentence';
import { useHANotificationSummary } from '@/hooks/useHANotifications';
import { cn } from '@/lib/utils';
import { BlurFade } from '../ui/magicui/BlurFade';
import { PRO_NAV_GROUPS, PRO_PAGE_LONG_TITLES, PRO_SETTINGS_ITEM } from './proNav';
import type { PageHeaderMeta } from './pageHeaderContext';
import type { SidebarNavItem } from '../ui/untitledui/SidebarSectionDividers';

const ALL_PAGES: SidebarNavItem[] = [...PRO_NAV_GROUPS.flatMap((g) => g.items), PRO_SETTINGS_ITEM];

export function pageInfo(page: string): SidebarNavItem {
  return ALL_PAGES.find((p) => p.id === page) ?? ALL_PAGES[0];
}

/** "Good evening, Samer" with a waving hand, as in the classic Overview header. */
function Greeting() {
  const { authState } = useAuth();
  const personName = useAutoLayoutStore((s) => s.domainGroups['person']?.[0]?.name);
  const first = (authState.isDemo ? personName : authState.user?.name || personName)?.split(' ')[0];
  return (
    <span className="inline-flex items-center gap-2">
      {timeGreeting(new Date().getHours())}
      {first ? `, ${first}` : ''}
      <HugeiconsIcon icon={WavingHand01Icon} size={26} className="shrink-0 text-[var(--accent)]" aria-hidden="true" />
    </span>
  );
}

/** Short nav name on phones, classic long title from 768 px up; Overview shows the greeting. */
function PageTitle({ item }: { item: SidebarNavItem }) {
  if (item.id === 'overview') return <Greeting />;
  const long = PRO_PAGE_LONG_TITLES[item.id] ?? item.label;
  return (
    <>
      <span className="md:hidden">{item.label}</span>
      <span className="hidden md:inline">{long}</span>
    </>
  );
}

interface HeaderActionsProps {
  meta: PageHeaderMeta;
  onOpenNotifications: () => void;
}

/** Notification bell button with unread badge, shared by ProPageHeader and focused sub-views. */
export function NotificationBellButton({ onPress }: { onPress: () => void }) {
  const { unread } = useHANotificationSummary();
  const bellLabel = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';
  return (
    <Badge.Anchor>
      <Tooltip delay={0}>
        <Button isIconOnly variant="ghost" aria-label={bellLabel} onPress={onPress}>
          <HugeiconsIcon icon={Notification01Icon} size={20} />
        </Button>
        <Tooltip.Content placement="bottom">Notifications</Tooltip.Content>
      </Tooltip>
      {unread > 0 && (
        <Badge color="danger" size="sm" placement="top-right">
          {unread > 99 ? '99+' : unread}
        </Badge>
      )}
    </Badge.Anchor>
  );
}

/** Bell (every page) and the per-page ⋮ menu (only when the page provides items). */
function HeaderActions({ meta, onOpenNotifications }: HeaderActionsProps) {
  const menu = meta.menu ?? [];

  return (
    <div className="flex shrink-0 items-center gap-1">
      <NotificationBellButton onPress={onOpenNotifications} />

      {menu.length > 0 && (
        <Dropdown>
          <Button isIconOnly variant="ghost" aria-label="More actions">
            <HugeiconsIcon icon={MoreVerticalIcon} size={20} />
          </Button>
          <Dropdown.Popover placement="bottom end">
            <Dropdown.Menu aria-label="Page actions" onAction={(key) => menu.find((m) => m.id === key)?.onAction()}>
              {menu.map((item) => (
                <Dropdown.Item key={item.id} id={item.id} textValue={item.label} variant={item.danger ? 'danger' : undefined}>
                  <HugeiconsIcon icon={item.icon} size={16} className="shrink-0" />
                  <Label>{item.label}</Label>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>
      )}
    </div>
  );
}

interface ProPageHeaderProps {
  page: string;
  meta: PageHeaderMeta;
  onOpenNotifications: () => void;
  /** The element that scrolls (the shell's <main>), used to detect when the header leaves view. */
  scrollRoot: React.RefObject<HTMLElement | null>;
  onCompactChange: (compact: boolean) => void;
}

/**
 * Full page header (docs/pro-ui/DESIGN.md 7.4): accent icon tile, short title, live status line,
 * actions. Reports when it scrolls out of view so the shell can show the compact bar.
 */
export function ProPageHeader({ page, meta, onOpenNotifications, scrollRoot, onCompactChange }: ProPageHeaderProps) {
  const info = pageInfo(page);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => onCompactChange(!entry.isIntersecting), { root: scrollRoot.current, threshold: 0 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollRoot, onCompactChange, page]);

  return (
    <BlurFade key={page}>
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="pro-soft grid size-12 shrink-0 place-items-center rounded-2xl">
            <HugeiconsIcon icon={info.icon} size={24} />
          </span>
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">
              <PageTitle item={info} />
            </h1>
          </div>
        </div>
        <HeaderActions meta={meta} onOpenNotifications={onOpenNotifications} />
      </header>
      {/* Rich subtitle (7.4): full width under the title row so the chips can wrap. */}
      <div className="mt-2">
        <PageSentence page={page} />
      </div>
      {/* Below the header: once it scrolls past the top, the compact bar takes over. */}
      <div ref={sentinel} aria-hidden="true" className="h-px" />
    </BlurFade>
  );
}

interface ProCompactHeaderProps {
  page: string;
  meta: PageHeaderMeta;
  visible: boolean;
  onOpenNotifications: () => void;
}

/** Slim sticky bar shown after the full header scrolls away. Canvas colour + hairline shadow. */
export function ProCompactHeader({ page, meta, visible, onOpenNotifications }: ProCompactHeaderProps) {
  const info = pageInfo(page);
  return (
    <div className="sticky top-0 z-10 h-0">
      <div
        aria-hidden={!visible}
        inert={!visible}
        className={cn(
          'absolute inset-x-0 top-0 bg-background px-4 pb-2 pt-[max(8px,env(safe-area-inset-top))] shadow-[0_1px_0_rgba(0,0,0,0.06)] transition-[opacity,transform] duration-200 md:px-8 dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]',
          visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        )}
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="pro-soft grid size-8 shrink-0 place-items-center rounded-xl">
              <HugeiconsIcon icon={info.icon} size={18} />
            </span>
            <span className="truncate text-base font-semibold">
              <PageTitle item={info} />
            </span>
          </div>
          <HeaderActions meta={meta} onOpenNotifications={onOpenNotifications} />
        </div>
      </div>
    </div>
  );
}
