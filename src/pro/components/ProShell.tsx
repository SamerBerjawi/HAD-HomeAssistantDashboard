import { useCallback, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import ProSidebar from './ProSidebar';
import ProMobileNav from './ProMobileNav';
import { ProCompactHeader, ProPageHeader } from './ProPageHeader';
import { PageHeaderContext, ShellNotificationsContext, type PageHeaderMeta } from './pageHeaderContext';

interface ProShellProps {
  page: string;
  darkMode: boolean;
  onNavigate: (id: string) => void;
  onToggleTheme: () => void;
  onOpenNotifications: () => void;
  children: ReactNode;
}

/**
 * Sidebar (ProSidebar) from md up, glass tab bar (ProMobileNav) on phones, and the shared page
 * header (7.4) above every page. The page accent comes from data-page (pro.css).
 */
export default function ProShell({ page, darkMode, onNavigate, onToggleTheme, onOpenNotifications, children }: ProShellProps) {
  const mainRef = useRef<HTMLElement>(null);
  const [meta, setMetaState] = useState<PageHeaderMeta>({});
  const [compact, setCompact] = useState(false);
  const setMeta = useCallback((m: PageHeaderMeta) => setMetaState(m), []);
  const onCompactChange = useCallback((c: boolean) => setCompact(c), []);

  return (
    <div className={cn('pro absolute inset-0 flex', darkMode && 'dark')} data-page={page}>
      <ProSidebar page={page} darkMode={darkMode} onNavigate={onNavigate} onToggleTheme={onToggleTheme} />

      <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto px-4 md:px-8 pb-28 md:pb-10">
        {!meta.hideHeader ? (
          <ProCompactHeader page={page} meta={meta} visible={compact} onOpenNotifications={onOpenNotifications} />
        ) : null}
        {/* Top padding lives here, not on <main>: padding on the scroller would offset the sticky bar. */}
        <div
          className={cn(
            'mx-auto w-full max-w-5xl flex flex-col',
            meta.hideHeader
              ? 'gap-3 pt-[max(12px,env(safe-area-inset-top))] md:pt-[max(20px,env(safe-area-inset-top))]'
              : 'gap-6 pt-[max(24px,env(safe-area-inset-top))]'
          )}
        >
          {!meta.hideHeader ? (
            <ProPageHeader
              page={page}
              meta={meta}
              onOpenNotifications={onOpenNotifications}
              scrollRoot={mainRef}
              onCompactChange={onCompactChange}
            />
          ) : null}
          <ShellNotificationsContext.Provider value={onOpenNotifications}>
            <PageHeaderContext.Provider value={setMeta}>{children}</PageHeaderContext.Provider>
          </ShellNotificationsContext.Provider>
        </div>
      </main>

      <ProMobileNav page={page} darkMode={darkMode} onNavigate={onNavigate} onToggleTheme={onToggleTheme} />
    </div>
  );
}
