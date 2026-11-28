import { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUserConfig } from '@/contexts/ConfigContext';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import type { OverviewLayoutApi } from '../../hooks/useOverviewLayout';
import { useOpenSheet } from '../../hooks/useSheetParam';
import { useWidgetStatusStore } from '../../hooks/useWidgetStatus';
import { VisibilityEditorSheet } from '../VisibilityEditorSheet';
import {
  applyOverviewVisibilityRules,
  withUpdatedRule
} from '../../lib/visibilityRules';
import {
  DEVICE_COLUMNS,
  deleteOverviewSection,
  editableSections,
  hideWidget,
  isCustomOverviewSection,
  isPinnedCardId,
  moveInFlow,
  moveSection,
  moveWidgetToSection,
  readingOrder,
  removePinnedCard,
  resizeInFlow,
  sectionSpan,
  sectionTitleOf,
  sectionVisibilityOf,
  setSectionVisibility,
  visibleSections,
  withSectionItems,
  withWidgetStyle,
  type AnyOverviewSectionId,
  type WidgetSize
} from '../../lib/overviewLayout';
import { OverviewSection } from './OverviewSection';
import { PinnedCard } from './PinnedCard';
import { GAP_PX, SectionGrid } from './SectionGrid';
import { WidgetCard, type CardActions, type EngineWidget } from './WidgetCard';

interface OverviewEngineProps {
  widgets: readonly EngineWidget[];
  api: OverviewLayoutApi;
  cols: number;
  /** A tab: show only this section, full width. */
  onlySection?: AnyOverviewSectionId;
  /** View mode: small sections sit side by side when there is room (owner decision). */
  sideBySide?: boolean;
  /** View mode on "All": a section header button opens that section's tab (Phase 4). */
  onOpenSection?: (section: AnyOverviewSectionId) => void;
  /** Edit mode: open rename UI for a custom section. */
  onRenameSection?: (section: AnyOverviewSectionId) => void;
}

/**
 * The Overview layout engine (rebuild, Phase 2 + Phase 2.1/2.2 custom sections & pinned cards).
 */
export function OverviewEngine({ widgets, api, cols, onlySection, sideBySide = true, onOpenSection, onRenameSection }: OverviewEngineProps) {
  const open = useOpenSheet();
  const { currentUser } = useUserConfig();
  const resolvedEntities = useAutoLayoutStore(useShallow((s) => s.resolvedEntities));
  const resolvedAreas = useAutoLayoutStore((s) => s.resolvedAreas);
  const widgetStatuses = useWidgetStatusStore((s) => s.byId);
  const byId = useMemo(() => new Map(widgets.map((w) => [w.id, w])), [widgets]);
  const allowedSizes = useCallback((id: string): readonly WidgetSize[] => byId.get(id)?.sizes ?? ['s', 'w', 't', 'l'], [byId]);
  const { layout, isEditing, update } = api;
  const [ruleTarget, setRuleTarget] = useState<{ scope: 'section' | 'card'; id: string; label: string } | null>(null);

  const actions = useMemo<CardActions>(
    () => ({
      open: (id) => open(id),
      setSize: (section, id, size, span) => update((l) => withSectionItems(l, section, resizeInFlow(l.items[section] ?? [], id, size, span))),
      move: (section, id, dir, span) => update((l) => withSectionItems(l, section, moveInFlow(l.items[section] ?? [], id, dir, span))),
      hide: (widget, span) => update((l) => hideWidget(l, widget, span)),
      setDesign: (id, style) => update((l) => withWidgetStyle(l, id, style)),
      moveToSection: (id, fromSec, toSec) => update((l) => moveWidgetToSection(l, id, fromSec, toSec, cols, widgets)),
      editVisibility: (id, title) => setRuleTarget({ scope: 'card', id, label: title })
    }),
    [open, update, cols, widgets]
  );

  const handleRemovePinned = useCallback(
    (cardId: string, sec: AnyOverviewSectionId) => update((l) => removePinnedCard(l, cardId, sec, DEVICE_COLUMNS[api.device])),
    [update, api.device]
  );

  const sectionChoices = useMemo(
    () =>
      layout.sectionOrder
        .filter((id) => (layout.items[id] ?? []).some((p) => !layout.hidden.includes(p.i)) || isCustomOverviewSection(layout, id))
        .map((id) => ({ id, title: sectionTitleOf(layout, id) })),
    [layout]
  );

  const rawList = isEditing ? editableSections(layout) : visibleSections(layout);
  const preFiltered = rawList
    .map((s) => ({ ...s, items: s.items.filter((p) => byId.has(p.i) || isPinnedCardId(p.i)) }))
    .filter((s) => {
      if (!isEditing && s.items.length === 0) return false;
      const vis = sectionVisibilityOf(layout, s.section);
      if (!isEditing) {
        if (vis === 'hidden') return false;
        if (!onlySection && vis === 'tab_only') return false;
      }
      return !onlySection || s.section === onlySection;
    });

  const sections = isEditing
    ? preFiltered
    : applyOverviewVisibilityRules(
        preFiltered,
        { sectionRules: layout.sectionRules, cardRules: layout.cardRules },
        {
          entities: resolvedEntities,
          device: api.device,
          user: currentUser ? { id: currentUser.id, isAdmin: currentUser.isAdmin } : null,
          widgetStatuses,
          resolvedAreas
        }
      );

  const activeRules =
    ruleTarget?.scope === 'section'
      ? layout.sectionRules?.[ruleTarget.id] ?? []
      : ruleTarget?.scope === 'card'
      ? layout.cardRules?.[ruleTarget.id] ?? []
      : [];

  return (
    <>
    <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, rowGap: GAP_PX * 2, columnGap: GAP_PX, gridAutoFlow: 'row dense' }}>
      {sections.map(({ section, items }, idx) => {
        const span = isEditing || !sideBySide || onlySection ? cols : sectionSpan(items, cols);
        const order = readingOrder(items).map((p) => p.i);
        const isCustom = isCustomOverviewSection(layout, section);
        const secTitle = sectionTitleOf(layout, section);
        return (
          <OverviewSection
            key={section}
            id={section}
            title={secTitle}
            count={items.length}
            span={span}
            isEditing={isEditing}
            isCollapsed={!onlySection && layout.collapsed.includes(section)}
            isFirst={idx === 0}
            isLast={idx === sections.length - 1}
            visibility={sectionVisibilityOf(layout, section)}
            isCustom={isCustom}
            hasVisibilityRules={Boolean(layout.sectionRules?.[section]?.length)}
            onToggleCollapsed={() => api.toggleCollapsed(section)}
            onMove={(dir) => update((l) => moveSection(l, section, dir))}
            onSetVisibility={(vis) => update((l) => setSectionVisibility(l, section, vis))}
            onEditVisibility={() => setRuleTarget({ scope: 'section', id: section, label: `${secTitle} section` })}
            onRename={isCustom && onRenameSection ? () => onRenameSection(section) : undefined}
            onDelete={isCustom ? () => update((l) => deleteOverviewSection(l, section, widgets, cols)) : undefined}
            onOpenTab={!isEditing && !onlySection && onOpenSection ? () => onOpenSection(section) : undefined}
          >
            {items.length === 0 && isEditing ? (
              <div className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-[color-mix(in_srgb,currentColor_18%,transparent)] p-4 text-center text-xs text-muted">
                Empty section — use “Add widgets” or a card’s “⋯” menu to place cards here.
              </div>
            ) : (
              <SectionGrid
                placements={items}
                cols={span}
                isEditing={isEditing}
                allowedSizes={allowedSizes}
                onChange={(next) => update((l) => withSectionItems(l, section, next))}
                renderCard={(p) => {
                  const at = order.indexOf(p.i);
                  const hasCardRules = Boolean(layout.cardRules?.[p.i]?.length);
                  if (isPinnedCardId(p.i)) {
                    return (
                      <PinnedCard
                        cardId={p.i}
                        section={section}
                        sections={sectionChoices}
                        size={p.size}
                        span={span}
                        isEditing={isEditing}
                        canMoveEarlier={at > 0}
                        canMoveLater={at < order.length - 1}
                        onSetSize={actions.setSize}
                        onMove={actions.move}
                        onMoveToSection={actions.moveToSection}
                        onRemove={handleRemovePinned}
                        hasVisibilityRules={hasCardRules}
                        onEditVisibility={actions.editVisibility}
                      />
                    );
                  }
                  const widget = byId.get(p.i);
                  if (!widget) return null;
                  return (
                    <WidgetCard
                      widget={widget}
                      section={section}
                      sections={sectionChoices}
                      span={span}
                      size={p.size}
                      isEditing={isEditing}
                      canMoveEarlier={at > 0}
                      canMoveLater={at < order.length - 1}
                      design={layout.styles?.[widget.id]}
                      hasVisibilityRules={hasCardRules}
                      actions={actions}
                    />
                  );
                }}
              />
            )}
          </OverviewSection>
        );
      })}
    </div>
    <VisibilityEditorSheet
      isOpen={Boolean(ruleTarget)}
      onOpenChange={(openSheet) => !openSheet && setRuleTarget(null)}
      page="overview"
      targetLabel={ruleTarget?.label ?? ''}
      rules={activeRules}
      onSave={(nextRules) => {
        if (!ruleTarget) return;
        if (ruleTarget.scope === 'section') {
          update((l) => ({ ...l, sectionRules: withUpdatedRule(l.sectionRules, ruleTarget.id, nextRules) }));
        } else {
          update((l) => ({ ...l, cardRules: withUpdatedRule(l.cardRules, ruleTarget.id, nextRules) }));
        }
      }}
    />
    </>
  );
}
