import { useState } from 'react';
import { Button, Drawer, Separator } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Menu01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import GlassSurface from '../ui/reactbits/GlassSurface';
import { SidebarNavRow } from '../ui/untitledui/SidebarSectionDividers';
import { PRO_NAV_GROUPS, PRO_SETTINGS_ITEM, useVisibleNavGroups } from './proNav';
import { AccountMenu, ConnectionStatusChip, ThemeToggleButton } from './ProAccountControls';

/**
 * React Bits Glass Surface "Frost" preset (its demo's LOOK values + displace 3, backgroundOpacity
 * 0.28): blurs and tints what shows through so the icons stay readable over page content.
 */
const FROST = {
  borderWidth: 0.07,
  brightness: 50,
  opacity: 0.93,
  blur: 11,
  displace: 3,
  backgroundOpacity: 0.28,
  saturation: 1,
  distortionScale: -180,
  redOffset: 0,
  greenOffset: 10,
  blueOffset: 20
} as const;

/** The first group is the tab bar; everything else lives in the More sheet. */
const TAB_IDS = new Set(PRO_NAV_GROUPS[0].items.map((i) => i.id));

interface ProMobileNavProps {
  page: string;
  darkMode: boolean;
  onNavigate: (id: string) => void;
  onToggleTheme: () => void;
}

function TabButton({ label, icon, current, onPress }: { label: string; icon: IconSvgElement; current: boolean; onPress: () => void }) {
  return (
    <Button
      isIconOnly
      variant="ghost"
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      onPress={onPress}
      // Owner 2026-11-18: pure black/white icons for contrast on the glass; the current tab is bolder.
      className="relative size-12 rounded-full text-black sm:size-14 dark:text-white"
    >
      {/* 26 px on phones, 30 px from 640 px (tablets); owner 2026-11-18. */}
      <HugeiconsIcon icon={icon} size={26} strokeWidth={current ? 2.4 : 1.6} className="sm:size-[30px]" />
      {current && <span aria-hidden="true" className="absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[var(--accent)]" />}
    </Button>
  );
}

/**
 * Phone navigation (docs/pro-ui/DESIGN.md, section 7.3): a floating React Bits Glass Surface pill
 * with icon-only tabs, and a HeroUI Drawer for everything else, mirroring the sidebar.
 */
export default function ProMobileNav({ page, darkMode, onNavigate, onToggleTheme }: ProMobileNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const isTablet = useMediaQuery('(min-width: 640px)');
  const groups = useVisibleNavGroups();
  const [tabGroup, ...sheetGroups] = groups;
  const inSheet = !TAB_IDS.has(page);

  const go = (id: string) => {
    setMoreOpen(false);
    onNavigate(id);
  };

  return (
    <>
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden">
        {/* Light mode: a more opaque white so black icons stay readable over photos (owner 2026-11-18). */}
        <GlassSurface
          width="100%"
          height={isTablet ? 76 : 64}
          borderRadius={isTablet ? 38 : 32}
          {...FROST}
          backgroundOpacity={darkMode ? FROST.backgroundOpacity : 0.72}
          colorScheme={darkMode ? 'dark' : 'light'}
          className="max-w-sm sm:max-w-md"
        >
          <div className="flex w-full items-center justify-around">
            {tabGroup?.items.map((item) => (
              <TabButton key={item.id} label={item.label} icon={item.icon} current={item.id === page} onPress={() => go(item.id)} />
            ))}
            <TabButton label="More" icon={Menu01Icon} current={inSheet || moreOpen} onPress={() => setMoreOpen(true)} />
          </div>
        </GlassSurface>
      </nav>

      <Drawer.Backdrop isOpen={moreOpen} onOpenChange={setMoreOpen}>
        <Drawer.Content placement="bottom">
          <Drawer.Dialog aria-label="More" className={cn('pro pb-[max(16px,env(safe-area-inset-bottom))]', darkMode && 'dark')} data-page={page}>
            <Drawer.Handle />
            <Drawer.Body className="flex flex-col gap-3 px-3 pt-2">
              {sheetGroups.map((group, index) => (
                <section key={group.label} aria-label={group.label} className="flex flex-col gap-0.5">
                  {index > 0 && <Separator variant="tertiary" className="mx-2 mb-2.5 w-auto" />}
                  {group.items.map((item) => (
                    <SidebarNavRow key={item.id} item={item} current={item.id === page} collapsed={false} onPress={() => go(item.id)} />
                  ))}
                </section>
              ))}
              <Separator variant="tertiary" className="mx-2 w-auto" />
              <SidebarNavRow item={PRO_SETTINGS_ITEM} current={page === 'settings'} collapsed={false} onPress={() => go('settings')} />
              <div className="flex items-center justify-between px-2">
                <ConnectionStatusChip />
                <ThemeToggleButton darkMode={darkMode} onToggle={onToggleTheme} />
              </div>
              <AccountMenu placement="top" />
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}
