/**
 * Overview shell (rebuild, Phase 4 + Phase 2 custom sections, visibility rules & header options).
 */
import { useCallback, useMemo, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { DashboardSquareAddIcon, PlusSignIcon, RotateLeft01Icon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { haWebSocketService } from '@/services/haWebSocket';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { OverviewLayoutApi } from '../../hooks/useOverviewLayout';
import { useOverviewTab } from '../../hooks/useOverviewTab';
import { useOpenSheet } from '../../hooks/useSheetParam';
import { useWidgetStatusStore } from '../../hooks/useWidgetStatus';
import { applyOverviewVisibilityRules } from '../../lib/visibilityRules';
import {
  editableSections,
  isPinnedCardId,
  sectionTitleOf,
  sectionVisibilityOf,
  visibleSections,
  type AnyOverviewSectionId
} from '../../lib/overviewLayout';
import { resolveShellTabId, sectionShowsCards, type ShellPill, type ShellTabId } from '../../lib/overviewShell';
import { OverviewEngine } from './OverviewEngine';
import { ShellStatusBar } from './ShellStatusBar';
import type { EngineWidget } from './WidgetCard';
import { WidgetProbes } from './WidgetProbes';

interface OverviewShellProps {
  widgets: readonly EngineWidget[];
  api: OverviewLayoutApi;
  cols: number;
  onAddWidgets: () => void;
  onRenameSection?: (sectionId: AnyOverviewSectionId) => void;
  /** Customize, beside the tabs (view mode). */
  toolbar?: ReactNode;
}

function EmptyOverview({ isEditing, onAdd, onRestore }: { isEditing: boolean; onAdd: () => void; onRestore: () => void }) {
  return (
    <section aria-label="No widgets" className="pro-surface flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="pro-soft grid size-12 place-items-center rounded-2xl">
        <HugeiconsIcon icon={DashboardSquareAddIcon} size={24} />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Nothing on your Overview</h2>
        <p className="max-w-sm text-sm text-muted">
          {isEditing ? 'Add the widgets or entities you want here, then Save.' : 'Every widget is hidden. Add some back, or start again from the default layout.'}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" variant="primary" onPress={onAdd}>
          <HugeiconsIcon icon={PlusSignIcon} size={15} />
          Add widgets
        </Button>
        {isEditing ? null : (
          <Button size="sm" variant="tertiary" onPress={onRestore}>
            <HugeiconsIcon icon={RotateLeft01Icon} size={15} />
            Restore default layout
          </Button>
        )}
      </div>
    </section>
  );
}

export function OverviewShell({ widgets, api, cols, onAddWidgets, onRenameSection, toolbar }: OverviewShellProps) {
  const open = useOpenSheet();
  const [askedTab, selectTab] = useOverviewTab();
  const { currentUser } = useUserConfig();
  const resolvedEntities = useAutoLayoutStore(useShallow((s) => s.resolvedEntities));
  const resolvedAreas = useAutoLayoutStore((s) => s.resolvedAreas);
  const widgetStatuses = useWidgetStatusStore((s) => s.byId);
  const byId = useMemo(() => new Map(widgets.map((w) => [w.id, w])), [widgets]);
  const isDemo = haWebSocketService.isDemo();

  const baseSections = useMemo(
    () =>
      visibleSections(api.layout)
        .map((s) => ({ ...s, items: s.items.filter((p) => byId.has(p.i) || isPinnedCardId(p.i)) }))
        .filter((s) => s.items.length > 0 && sectionVisibilityOf(api.layout, s.section) !== 'hidden'),
    [api.layout, byId]
  );

  const sections = useMemo(
    () =>
      api.isEditing
        ? baseSections
        : applyOverviewVisibilityRules(
            baseSections,
            { sectionRules: api.layout.sectionRules, cardRules: api.layout.cardRules },
            {
              entities: resolvedEntities,
              device: api.device,
              user: currentUser ? { id: currentUser.id, isAdmin: currentUser.isAdmin } : null,
              widgetStatuses,
              resolvedAreas
            }
          ),
    [api.isEditing, baseSections, api.layout.sectionRules, api.layout.cardRules, resolvedEntities, api.device, currentUser, widgetStatuses, resolvedAreas]
  );

  const sectionLabels = useMemo(() => {
    const out: Record<string, string> = {};
    for (const s of api.layout.sectionOrder) {
      out[s] = sectionTitleOf(api.layout, s);
    }
    return out;
  }, [api.layout]);

  const editList = useMemo(
    () =>
      editableSections(api.layout).map((s) => ({
        ...s,
        items: s.items.filter((p) => byId.has(p.i) || isPinnedCardId(p.i))
      })),
    [api.layout, byId]
  );

  const onPage = useMemo(
    () => sections.flatMap((s) => s.items.map((p) => byId.get(p.i)).filter((w): w is EngineWidget => Boolean(w))),
    [sections, byId]
  );

  const defaultHeaderTab = api.layout.header?.defaultTab && api.layout.header.defaultTab !== 'all' ? api.layout.header.defaultTab : null;
  const tab: ShellTabId = api.isEditing ? 'all' : resolveShellTabId(askedTab ?? defaultHeaderTab, sections);
  const watches = onPage.some((w) => w.attention);
  const collapsed = api.layout.collapsed;

  const offScreen = useMemo(() => {
    const renderedIds = new Set<string>();
    for (const s of sections) {
      const vis = sectionVisibilityOf(api.layout, s.section);
      if (tab === 'all' && vis === 'tab_only') continue;
      if (!sectionShowsCards(s.section, tab, collapsed)) continue;
      for (const p of s.items) {
        if (byId.has(p.i)) renderedIds.add(p.i);
      }
    }
    const out: EngineWidget[] = [];
    const seen = new Set<string>();
    for (const s of baseSections) {
      for (const p of s.items) {
        if (renderedIds.has(p.i) || seen.has(p.i)) continue;
        const w = byId.get(p.i);
        if (w) {
          seen.add(p.i);
          out.push(w);
        }
      }
    }
    return out;
  }, [baseSections, sections, api.layout, tab, collapsed, byId]);

  const activate = useCallback(
    (pill: ShellPill) => {
      if (byId.get(pill.widgetId)?.Sheet) open(pill.widgetId);
      else selectTab(pill.section);
    },
    [byId, open, selectTab]
  );
  const addWidgets = () => {
    if (!api.isEditing) api.begin();
    onAddWidgets();
  };
  const restore = () => {
    api.begin();
    api.resetToDefault();
  };

  const hasVisibleOrEditable = api.isEditing ? editList.length > 0 : sections.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <WidgetProbes widgets={offScreen} />
      <ShellStatusBar
        sections={sections}
        sectionLabels={sectionLabels}
        byId={byId}
        isEditing={api.isEditing}
        isDemo={isDemo}
        watches={watches}
        showAttentionPills={api.layout.header?.showAttentionPills ?? true}
        showTabs={api.layout.header?.showTabs ?? true}
        toolbar={toolbar}
        tab={tab}
        onSelectTab={selectTab}
        onActivate={activate}
      />

      {!hasVisibleOrEditable ? (
        <EmptyOverview isEditing={api.isEditing} onAdd={addWidgets} onRestore={restore} />
      ) : (
        <OverviewEngine
          widgets={widgets}
          api={api}
          cols={cols}
          onlySection={tab === 'all' ? undefined : tab}
          onOpenSection={selectTab}
          onRenameSection={onRenameSection}
        />
      )}
    </div>
  );
}
