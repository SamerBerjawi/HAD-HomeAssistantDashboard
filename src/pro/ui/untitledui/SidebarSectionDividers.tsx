/**
 * SidebarSectionDividers: the Untitled UI "Section dividers" sidebar, adapted for the HAD pro UI.
 * (It started from the "Section subheadings" variant; the owner switched to dividers on
 * 2026-11-17 because the headings read as confusing.)
 *
 * Source: https://github.com/untitleduico/react
 * (components/application/app-navigation/sidebar-navigation/sidebar-section-dividers.tsx and
 * base-components/nav-item.tsx), MIT.
 *
 * Kept: header row with the logo and a utility button, groups of nav rows separated by space
 * (expanded) or thin dividers (rail), no heading labels, rows of icon + semibold label (p-2, rounded), footer pinned.
 * Changed (docs/pro-ui/DESIGN.md, section 7.2):
 * - Edge-to-edge on the canvas: no card, ring or shadow. Width 256 px.
 * - An icon rail (collapsed) was added; Untitled UI's variant has none. In the rail the headings
 *   every row shows a HeroUI Tooltip.
 * - Rows are HeroUI Buttons (state navigation, not links); the active row uses `.pro-soft`.
 * - Icons are Hugeicons. Group labels are kept only as the sections' accessible names. The mobile hamburger header was removed: phones
 *   use the bottom nav bar.
 */
import type { ReactNode } from 'react';
import { Button, Separator, Tooltip } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: IconSvgElement;
}

export interface SidebarNavGroup {
  /** Accessible name of the section; not shown. */
  label: string;
  items: SidebarNavItem[];
}

export const SIDEBAR_WIDTH = 256;
export const SIDEBAR_RAIL_WIDTH = 72;

interface SidebarNavRowProps {
  item: SidebarNavItem;
  current: boolean;
  collapsed: boolean;
  onPress: () => void;
}

export function SidebarNavRow({ item, current, collapsed, onPress }: SidebarNavRowProps) {
  const row = (
    <Button
      variant="ghost"
      aria-label={collapsed ? item.label : undefined}
      aria-current={current ? 'page' : undefined}
      onPress={onPress}
      className={cn(
        'h-9 min-h-9 w-full justify-start gap-2.5 rounded-xl px-2.5 text-sm font-semibold',
        collapsed && 'size-11 justify-center px-0',
        current ? 'pro-soft hover:bg-[var(--pro-accent-soft)]' : 'text-muted hover:text-foreground'
      )}
    >
      <HugeiconsIcon icon={item.icon} size={20} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Button>
  );

  if (!collapsed) return row;
  return (
    <Tooltip delay={0}>
      {row}
      <Tooltip.Content placement="right">{item.label}</Tooltip.Content>
    </Tooltip>
  );
}

interface SidebarSectionDividersProps {
  groups: SidebarNavGroup[];
  activeId: string;
  onNavigate: (id: string) => void;
  collapsed: boolean;
  /** Brand mark; receives `collapsed` so it can drop its wordmark in the rail. */
  logo: ReactNode;
  /** Utility button beside the logo (the collapse toggle). */
  headerAction?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function SidebarSectionDividers({
  groups,
  activeId,
  onNavigate,
  collapsed,
  logo,
  headerAction,
  footer,
  className
}: SidebarSectionDividersProps) {
  return (
    <aside
      aria-label="Main"
      style={{ width: collapsed ? SIDEBAR_RAIL_WIDTH : SIDEBAR_WIDTH }}
      className={cn(
        'flex h-full shrink-0 flex-col overflow-hidden pt-4 transition-[width] duration-200 ease-out',
        className
      )}
    >
      <div className={cn('flex shrink-0 gap-2 px-3', collapsed ? 'flex-col items-center' : 'items-center justify-between')}>
        {logo}
        {headerAction}
      </div>

      <nav className="mt-5 flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none]">
        {groups.map((group, index) => (
          <section key={group.label} aria-label={group.label} className="pb-3">
            {index > 0 &&
              (collapsed ? (
                <Separator variant="tertiary" className="mx-auto mb-3 w-8" />
              ) : (
                // Expanded: no line, same 13 px gap (owner, 2026-11-17).
                <div aria-hidden="true" className="mb-3 h-px" />
              ))}
            <ul className={cn('flex flex-col gap-0.5', collapsed ? 'items-center px-0' : 'px-3')}>
              {group.items.map((item) => (
                <li key={item.id} className={cn(!collapsed && 'w-full')}>
                  <SidebarNavRow
                    item={item}
                    current={item.id === activeId}
                    collapsed={collapsed}
                    onPress={() => onNavigate(item.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>

      {footer ? (
        <div className={cn('flex shrink-0 flex-col gap-2 pb-4 pt-2', collapsed ? 'items-center px-0' : 'px-3')}>{footer}</div>
      ) : null}
    </aside>
  );
}
