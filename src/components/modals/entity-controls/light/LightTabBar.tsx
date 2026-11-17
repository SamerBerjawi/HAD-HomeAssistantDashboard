import { Tab, TabList, Tabs } from 'react-aria-components';
import type { TabOption } from './lightPresets';

// Mode tab bar (Warmth / Color / Scenes), rendered when more than one mode is supported.
interface LightTabBarProps {
  darkMode: boolean;
  availableTabs: TabOption[];
  activeTab: TabOption['id'];
  setActiveTab: (id: TabOption['id']) => void;
}

export default function LightTabBar({
  darkMode,
  availableTabs,
  activeTab,
  setActiveTab
}: LightTabBarProps) {
  return (
    <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as TabOption['id'])}>
    <TabList
      aria-label="Light mode"
      className={`p-1 rounded-2xl flex items-center gap-1 border backdrop-blur-md ${
        darkMode ? 'bg-black/30 border-white/5' : 'bg-white/40 border-white/50'
      }`}
    >
      {availableTabs.map((tab) => {
        const TabIcon = tab.icon;
        const isTabActive = activeTab === tab.id;
        return (
          <Tab
            key={tab.id}
            id={tab.id}
            className={`outline-none focus-visible:ring-2 focus-visible:ring-sky-400 flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isTabActive
                ? darkMode
                  ? 'bg-white/15 text-white shadow-xs'
                  : 'bg-white text-slate-950 shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 font-bold'
            }`}
          >
            <TabIcon size={14} weight="duotone" />
            <span>{tab.label}</span>
          </Tab>
        );
      })}
    </TabList>
    </Tabs>
  );
}
