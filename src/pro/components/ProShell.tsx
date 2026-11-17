import type { ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  BulbIcon,
  FlashIcon,
  Shield01Icon,
  Moon02Icon,
  Sun03Icon,
  Notification01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

export const PRO_NAV = [
  { id: 'overview', label: 'Overview', icon: Home01Icon },
  { id: 'rooms', label: 'Rooms', icon: BulbIcon },
  { id: 'energy', label: 'Energy', icon: FlashIcon },
  { id: 'security', label: 'Security', icon: Shield01Icon }
] as const;

interface ProShellProps {
  page: string;
  darkMode: boolean;
  onNavigate: (id: string) => void;
  onToggleTheme: () => void;
  onOpenNotifications: () => void;
  children: ReactNode;
}

/** Sidebar on desktop, tab bar on phones. The page accent comes from data-page (pro.css). */
export default function ProShell({
  page,
  darkMode,
  onNavigate,
  onToggleTheme,
  onOpenNotifications,
  children
}: ProShellProps) {
  const active = PRO_NAV.some((n) => n.id === page) ? page : 'overview';
  return (
    <div className={cn('pro absolute inset-0 flex', darkMode && 'dark')} data-page={active}>
      <aside className="hidden md:flex w-64 shrink-0 flex-col gap-1 p-4" aria-label="Main">
        <div className="flex items-center gap-3 px-3 py-3 mb-2">
          <span className="pro-accent size-9 rounded-xl grid place-items-center">
            <HugeiconsIcon icon={Home01Icon} size={20} />
          </span>
          <span className="font-bold text-lg tracking-tight">HOMZ</span>
        </div>
        {PRO_NAV.map((item) => (
          <Button
            key={item.id}
            variant={item.id === active ? 'primary' : 'ghost'}
            className="justify-start"
            onPress={() => onNavigate(item.id)}
            aria-current={item.id === active ? 'page' : undefined}
          >
            <HugeiconsIcon icon={item.icon} size={18} />
            {item.label}
          </Button>
        ))}
        <div className="mt-auto flex gap-1">
          <Button isIconOnly variant="ghost" aria-label="Notifications" onPress={onOpenNotifications}>
            <HugeiconsIcon icon={Notification01Icon} size={18} />
          </Button>
          <Button isIconOnly variant="ghost" aria-label={darkMode ? 'Light mode' : 'Dark mode'} onPress={onToggleTheme}>
            <HugeiconsIcon icon={darkMode ? Sun03Icon : Moon02Icon} size={18} />
          </Button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto px-4 md:px-8 pt-6 pb-28 md:pb-10">
        <div className="mx-auto w-full max-w-5xl flex flex-col gap-6">{children}</div>
      </main>

      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-20 flex justify-around px-2 pt-2 pb-[max(8px,env(safe-area-inset-bottom))] bg-surface shadow-[0_-1px_0_rgba(0,0,0,0.06)]"
        aria-label="Main"
      >
        {PRO_NAV.map((item) => (
          <Button
            key={item.id}
            variant={item.id === active ? 'primary' : 'ghost'}
            className="flex-col h-auto min-w-16 gap-0.5 px-3 py-1.5 text-xs"
            onPress={() => onNavigate(item.id)}
            aria-current={item.id === active ? 'page' : undefined}
          >
            <HugeiconsIcon icon={item.icon} size={22} />
            {item.label}
          </Button>
        ))}
      </nav>
    </div>
  );
}
