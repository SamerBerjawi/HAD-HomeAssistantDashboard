import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Home01Icon, SidebarLeft01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useSidebarCollapsed } from '../hooks/useSidebarCollapsed';
import { SidebarNavRow, SidebarSectionDividers } from '../ui/untitledui/SidebarSectionDividers';
import { PRO_SETTINGS_ITEM, useVisibleNavGroups } from './proNav';
import { AccountMenu, ConnectionStatusChip, MaybeTip, ThemeToggleButton } from './ProAccountControls';

interface ProSidebarProps {
  page: string;
  darkMode: boolean;
  onNavigate: (id: string) => void;
  onToggleTheme: () => void;
}

/** Desktop and tablet sidebar (docs/pro-ui/DESIGN.md, section 7.2). */
export default function ProSidebar({ page, darkMode, onNavigate, onToggleTheme }: ProSidebarProps) {
  const { collapsed, toggle } = useSidebarCollapsed();
  const groups = useVisibleNavGroups();
  const tip = collapsed ? 'right' : 'top';

  const logo = (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="pro-accent grid size-9 shrink-0 place-items-center rounded-xl">
        <HugeiconsIcon icon={Home01Icon} size={20} />
      </span>
      {!collapsed && (
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="text-base font-bold tracking-tight">HAD</span>
          <span className="truncate text-[11px] text-muted">Home Assistant Dashboard</span>
        </div>
      )}
    </div>
  );

  const collapseLabel = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  const headerAction = (
    <MaybeTip label={collapsed ? collapseLabel : null} placement="right">
      <Button isIconOnly size="sm" variant="ghost" aria-label={collapseLabel} aria-expanded={!collapsed} onPress={toggle}>
        <HugeiconsIcon icon={SidebarLeft01Icon} size={18} />
      </Button>
    </MaybeTip>
  );

  const footer = (
    <>
      <div className={cn(collapsed ? 'flex justify-center' : 'w-full')}>
        <SidebarNavRow item={PRO_SETTINGS_ITEM} current={page === 'settings'} collapsed={collapsed} onPress={() => onNavigate('settings')} />
      </div>
      <div className={cn('flex items-center gap-2', collapsed ? 'flex-col' : 'justify-between px-2')}>
        <ConnectionStatusChip iconOnly={collapsed} tooltipPlacement={tip} />
        <ThemeToggleButton darkMode={darkMode} onToggle={onToggleTheme} tooltipPlacement={tip} />
      </div>
      <AccountMenu compact={collapsed} placement={collapsed ? 'right bottom' : 'top start'} />
    </>
  );

  return (
    <SidebarSectionDividers
      className="hidden md:flex"
      groups={groups}
      activeId={page}
      onNavigate={onNavigate}
      collapsed={collapsed}
      logo={logo}
      headerAction={headerAction}
      footer={footer}
    />
  );
}
