import { useCallback, useMemo } from 'react';
import type { OverviewLayoutApi } from '../../hooks/useOverviewLayout';
import { useOpenSheet } from '../../hooks/useSheetParam';
import { hideWidget, moveInFlow, moveSection, readingOrder, resizeInFlow, sectionSpan, visibleSections, withSectionItems, withWidgetStyle, type WidgetSize } from '../../lib/overviewLayout';
import type { OverviewSectionId } from '../../lib/overviewSections';
import { OverviewSection } from './OverviewSection';
import { GAP_PX, SectionGrid } from './SectionGrid';
import { WidgetCard, type CardActions, type EngineWidget } from './WidgetCard';

interface OverviewEngineProps {
  widgets: readonly EngineWidget[];
  api: OverviewLayoutApi;
  cols: number;
  /** A tab: show only this section, full width. */
  onlySection?: OverviewSectionId;
  /** View mode: small sections sit side by side when there is room (owner decision). */
  sideBySide?: boolean;
  /** View mode on "All": a section header button opens that section's tab (Phase 4). */
  onOpenSection?: (section: OverviewSectionId) => void;
}

/**
 * The Overview layout engine (rebuild, Phase 2): sections in the user's order, each with its own
 * grid. Everything an edit does goes to the draft through `api.update`; nothing is saved here.
 */
export function OverviewEngine({ widgets, api, cols, onlySection, sideBySide = true, onOpenSection }: OverviewEngineProps) {
  const open = useOpenSheet();
  const byId = useMemo(() => new Map(widgets.map((w) => [w.id, w])), [widgets]);
  const allowedSizes = useCallback((id: string): readonly WidgetSize[] => byId.get(id)?.sizes ?? ['s'], [byId]);
  const { layout, isEditing, update } = api;
  // One stable object for every card, so a memoised card re-renders only when its own props change.
  // Each action reads the current layout inside `update`, never a copy from an earlier render.
  const actions = useMemo<CardActions>(
    () => ({
      open: (id) => open(id),
      setSize: (section, id, size, span) => update((l) => withSectionItems(l, section, resizeInFlow(l.items[section] ?? [], id, size, span))),
      move: (section, id, dir, span) => update((l) => withSectionItems(l, section, moveInFlow(l.items[section] ?? [], id, dir, span))),
      hide: (widget, span) => update((l) => hideWidget(l, widget, span)),
      setDesign: (id, style) => update((l) => withWidgetStyle(l, id, style))
    }),
    [open, update]
  );

  const sections = visibleSections(layout)
    .map((s) => ({ ...s, items: s.items.filter((p) => byId.has(p.i)) }))
    .filter((s) => s.items.length > 0 && (!onlySection || s.section === onlySection));

  return (
    <div className="grid w-full" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, rowGap: GAP_PX * 2, columnGap: GAP_PX, gridAutoFlow: 'row dense' }}>
      {sections.map(({ section, items }, idx) => {
        const span = isEditing || !sideBySide || onlySection ? cols : sectionSpan(items, cols);
        const order = readingOrder(items).map((p) => p.i);
        return (
          <OverviewSection
            key={section}
            id={section}
            count={items.length}
            span={span}
            isEditing={isEditing}
            isCollapsed={!onlySection && layout.collapsed.includes(section)}
            isFirst={idx === 0}
            isLast={idx === sections.length - 1}
            onToggleCollapsed={() => api.toggleCollapsed(section)}
            onMove={(dir) => update((l) => moveSection(l, section, dir))}
            onOpenTab={!isEditing && !onlySection && onOpenSection ? () => onOpenSection(section) : undefined}
          >
            <SectionGrid
              placements={items}
              cols={span}
              isEditing={isEditing}
              allowedSizes={allowedSizes}
              onChange={(next) => update((l) => withSectionItems(l, section, next))}
              renderCard={(p) => {
                const widget = byId.get(p.i);
                if (!widget) return null;
                const at = order.indexOf(p.i);
                return (
                  <WidgetCard
                    widget={widget}
                    section={section}
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
          </OverviewSection>
        );
      })}
    </div>
  );
}
