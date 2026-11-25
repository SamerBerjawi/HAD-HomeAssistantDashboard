import { useCallback, useMemo } from 'react';
import type { OverviewLayoutApi } from '../../hooks/useOverviewLayout';
import { useOpenSheet } from '../../hooks/useSheetParam';
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
  const byId = useMemo(() => new Map(widgets.map((w) => [w.id, w])), [widgets]);
  const allowedSizes = useCallback((id: string): readonly WidgetSize[] => byId.get(id)?.sizes ?? ['s', 'w', 't', 'l'], [byId]);
  const { layout, isEditing, update } = api;

  const actions = useMemo<CardActions>(
    () => ({
      open: (id) => open(id),
      setSize: (section, id, size, span) => update((l) => withSectionItems(l, section, resizeInFlow(l.items[section] ?? [], id, size, span))),
      move: (section, id, dir, span) => update((l) => withSectionItems(l, section, moveInFlow(l.items[section] ?? [], id, dir, span))),
      hide: (widget, span) => update((l) => hideWidget(l, widget, span)),
      setDesign: (id, style) => update((l) => withWidgetStyle(l, id, style)),
      moveToSection: (id, fromSec, toSec) => update((l) => moveWidgetToSection(l, id, fromSec, toSec, cols, widgets))
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
  const sections = rawList
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

  return (
    <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, rowGap: GAP_PX * 2, columnGap: GAP_PX, gridAutoFlow: 'row dense' }}>
      {sections.map(({ section, items }, idx) => {
        const span = isEditing || !sideBySide || onlySection ? cols : sectionSpan(items, cols);
        const order = readingOrder(items).map((p) => p.i);
        const isCustom = isCustomOverviewSection(layout, section);
        return (
          <OverviewSection
            key={section}
            id={section}
            title={sectionTitleOf(layout, section)}
            count={items.length}
            span={span}
            isEditing={isEditing}
            isCollapsed={!onlySection && layout.collapsed.includes(section)}
            isFirst={idx === 0}
            isLast={idx === sections.length - 1}
            visibility={sectionVisibilityOf(layout, section)}
            isCustom={isCustom}
            onToggleCollapsed={() => api.toggleCollapsed(section)}
            onMove={(dir) => update((l) => moveSection(l, section, dir))}
            onSetVisibility={(vis) => update((l) => setSectionVisibility(l, section, vis))}
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
  );
}
