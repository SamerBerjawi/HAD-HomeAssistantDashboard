import type { ReactElement } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Avatar, Button, Chip, Dropdown, Label, Tooltip } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  Loading03Icon,
  Logout01Icon,
  Moon02Icon,
  SparklesIcon,
  Sun03Icon,
  Wifi01Icon,
  WifiDisconnected01Icon
} from '@hugeicons/core-free-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { cn } from '@/lib/utils';
import { connectionBadge, type ConnectionBadgeKind } from '../lib/connectionBadge';

/**
 * Footer controls shared by the sidebar (7.2) and the phone "More" sheet (7.3): connection status
 * chip, theme toggle and account menu.
 */

const STATUS_ICON: Record<ConnectionBadgeKind, IconSvgElement> = {
  demo: SparklesIcon,
  live: Wifi01Icon,
  connecting: Loading03Icon,
  auth_failed: Alert02Icon,
  offline: WifiDisconnected01Icon
};

type TipPlacement = 'top' | 'right';

/** Wraps a control in a tooltip; `label` null means no tooltip. */
export function MaybeTip({ label, placement = 'top', children }: { label: string | null; placement?: TipPlacement; children: ReactElement }) {
  if (!label) return children;
  return (
    <Tooltip delay={0}>
      {children}
      <Tooltip.Content placement={placement}>{label}</Tooltip.Content>
    </Tooltip>
  );
}

export function ConnectionStatusChip({ iconOnly = false, tooltipPlacement = 'top' }: { iconOnly?: boolean; tooltipPlacement?: TipPlacement }) {
  const { isLiveMode, connectionStatus, haCoreVersion } = useAutoLayoutStore(
    useShallow((s) => ({ isLiveMode: s.isLiveMode, connectionStatus: s.connectionStatus, haCoreVersion: s.haCoreVersion }))
  );
  const status = connectionBadge(isLiveMode, connectionStatus, haCoreVersion);
  return (
    <Tooltip delay={0}>
      <Tooltip.Trigger aria-label={status.description}>
        <Chip color={status.color} variant="soft" className={cn('gap-1', iconOnly && 'px-1.5')}>
          <HugeiconsIcon icon={STATUS_ICON[status.kind]} size={14} />
          {!iconOnly && status.label}
        </Chip>
      </Tooltip.Trigger>
      <Tooltip.Content placement={tooltipPlacement}>{status.description}</Tooltip.Content>
    </Tooltip>
  );
}

export function ThemeToggleButton({ darkMode, onToggle, tooltipPlacement = 'top' }: { darkMode: boolean; onToggle: () => void; tooltipPlacement?: TipPlacement }) {
  const label = darkMode ? 'Light mode' : 'Dark mode';
  return (
    <MaybeTip label={label} placement={tooltipPlacement}>
      <Button isIconOnly size="sm" variant="ghost" aria-label={label} onPress={onToggle}>
        <HugeiconsIcon icon={darkMode ? Sun03Icon : Moon02Icon} size={18} />
      </Button>
    </MaybeTip>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'H';
}

/** Account card (avatar, name, role) that opens a menu with Sign out. */
export function AccountMenu({ compact = false, placement = 'top start' }: { compact?: boolean; placement?: 'top start' | 'right bottom' | 'top' }) {
  const { authState, logout } = useAuth();
  const userName = authState.isDemo ? 'Demo user' : authState.user?.name || 'Home Assistant user';
  const userRole = authState.isDemo ? 'Demo mode' : authState.user?.isOwner ? 'Owner' : 'User';

  return (
    <Dropdown>
      <Button
        variant="ghost"
        aria-label={`Account: ${userName}`}
        className={cn('h-auto min-h-12 gap-2.5 rounded-xl px-2 py-2', compact ? 'w-12 justify-center px-0' : 'w-full justify-start')}
      >
        <Avatar size="sm" color="accent">
          <Avatar.Fallback>{authState.isDemo ? <HugeiconsIcon icon={SparklesIcon} size={16} /> : initials(userName)}</Avatar.Fallback>
        </Avatar>
        {!compact && (
          <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
            <span className="truncate text-sm font-semibold text-foreground">{userName}</span>
            <span className="truncate text-xs text-muted">{userRole}</span>
          </span>
        )}
      </Button>
      <Dropdown.Popover placement={placement}>
        <Dropdown.Menu
          aria-label="Account"
          onAction={(key) => {
            if (key === 'sign-out') logout();
          }}
        >
          <Dropdown.Item id="sign-out" textValue="Sign out" variant="danger">
            <HugeiconsIcon icon={Logout01Icon} size={16} className="shrink-0" />
            <Label>Sign out</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
