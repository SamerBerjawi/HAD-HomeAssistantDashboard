import { useCallback, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import ProSidebar from './ProSidebar';
import ProMobileNav from './ProMobileNav';
import { ProCompactHeader, ProPageHeader } from './ProPageHeader';
import { PageHeaderContext, type PageHeaderMeta } from './pageHeaderContext';

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
        <ProCompactHeader page={page} meta={meta} visible={compact} onOpenNotifications={onOpenNotifications} />
        {/* Top padding lives here, not on <main>: padding on the scroller would offset the sticky bar. */}
        <div className="mx-auto w-full max-w-5xl flex flex-col gap-6 pt-[max(24px,env(safe-area-inset-top))]">
          <ProPageHeader
            page={page}
            meta={meta}
            onOpenNotifications={onOpenNotifications}
            scrollRoot={mainRef}
            onCompactChange={onCompactChange}
          />
          <PageHeaderContext.Provider value={setMeta}>{children}</PageHeaderContext.Provider>
        </div>
      </main>

      <ProMobileNav page={page} darkMode={darkMode} onNavigate={onNavigate} onToggleTheme={onToggleTheme} />
    </div>
  );
}
