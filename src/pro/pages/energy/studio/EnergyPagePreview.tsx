/**
 * Assembled Energy page preview rendered at a chosen content width (343 / 640 / 740 / 1140 / 1620 px):
 * - Phone (< 600 px): Live now above Period bar, then Kokonut SmoothTab section tabs
 * - Tablet (600–999 px): One scrolling 2-column page
 * - Desktop (>= 1000 px): One scrolling 12-column page with partner-aware span expansion
 */
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { SmoothTab } from '../../../ui/kokonutui/SmoothTab';
import { ENERGY_CATALOG, type ConceptId } from './energyCatalog';
import { buildPhoneTabs, visibleSections } from './energyParts';
import { EnergyStatesPreview } from './concepts/ImpactConcepts';
import type { StudioSectionActions } from './concepts/types';
import type { SectionPick } from './useEnergyPicks';
import { ENERGY_SECTIONS, type EnergySectionId, type PhoneTabId, type StudioEnergySnapshot } from './studioEnergy';

export type PagePreviewMode = ConceptId | 'picks';

interface EnergyPagePreviewProps {
  mode: PagePreviewMode;
  snap: StudioEnergySnapshot;
  actions: StudioSectionActions;
  width: number;
  order: readonly EnergySectionId[];
  hidden: ReadonlySet<EnergySectionId>;
  picks: Partial<Record<EnergySectionId, SectionPick>>;
}

function resolveConceptId(id: EnergySectionId, mode: PagePreviewMode, picks: Partial<Record<EnergySectionId, SectionPick>>): ConceptId {
  const entry = ENERGY_CATALOG.find((e) => e.id === id);
  if (!entry) return 'A';
  if (mode !== 'picks') return mode;
  const chosen = picks[id]?.concept;
  if (chosen === 'A' || chosen === 'B' || chosen === 'C') return chosen;
  return entry.recommended;
}

function renderSection(
  id: EnergySectionId,
  mode: PagePreviewMode,
  snap: StudioEnergySnapshot,
  actions: StudioSectionActions,
  picks: Partial<Record<EnergySectionId, SectionPick>>,
  compact: boolean
) {
  const entry = ENERGY_CATALOG.find((e) => e.id === id);
  if (!entry) return null;
  const conceptId = resolveConceptId(id, mode, picks);
  const concept = entry.concepts.find((c) => c.id === conceptId) ?? entry.concepts[0];
  const Comp = concept.Component;
  return <Comp snap={snap} actions={actions} compact={compact} />;
}

/** Pair-aware 12-column desktop spans so hiding/missing a partner never leaves a half-empty row. */
function desktopSpanClass(id: EnergySectionId, visibleSet: ReadonlySet<EnergySectionId>): string {
  if (id === 'summary' || id === 'usage' || id === 'flow') return 'col-span-12';
  if (id === 'solar') return visibleSet.has('battery') ? 'col-span-6' : 'col-span-12';
  if (id === 'battery') return visibleSet.has('solar') ? 'col-span-6' : 'col-span-12';
  if (id === 'devices') return visibleSet.has('costs') ? 'col-span-6' : 'col-span-12';
  if (id === 'costs') return visibleSet.has('devices') ? 'col-span-6' : 'col-span-12';
  if (id === 'utilities') return visibleSet.has('impact') ? 'col-span-8' : 'col-span-12';
  if (id === 'impact') return visibleSet.has('utilities') ? 'col-span-4' : 'col-span-12';
  return 'col-span-12';
}

export function EnergyPagePreview({ mode, snap, actions, width, order, hidden, picks }: EnergyPagePreviewProps) {
  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 1000;

  const visible = useMemo(() => visibleSections(order, hidden, snap), [order, hidden, snap]);
  const topSections = useMemo(() => visible.filter((id) => id === 'live' || id === 'period'), [visible]);
  const bodySections = useMemo(() => visible.filter((id) => id !== 'live' && id !== 'period'), [visible]);
  const bodySet = useMemo(() => new Set(bodySections), [bodySections]);

  const tabMap = useMemo(
    () => Object.fromEntries(ENERGY_SECTIONS.map((s) => [s.id, s.phoneTab])) as Record<EnergySectionId, PhoneTabId | null>,
    []
  );
  const phoneTabs = useMemo(() => buildPhoneTabs(bodySections, tabMap), [bodySections, tabMap]);
  const [phoneTab, setPhoneTab] = useState<PhoneTabId>('summary');

  useEffect(() => {
    if (phoneTabs.length > 0 && !phoneTabs.some((t) => t.id === phoneTab)) {
      setPhoneTab(phoneTabs[0].id);
    }
  }, [phoneTab, phoneTabs]);

  if (snap.stateId === 'states') {
    return (
      <div style={{ width }}>
        <EnergyStatesPreview compact={isPhone} onRefresh={actions.onRefresh} />
      </div>
    );
  }

  const activePhoneDef = phoneTabs.find((t) => t.id === phoneTab) ?? phoneTabs[0];

  return (
    <div className="flex flex-col gap-4" style={{ width }}>
      {topSections.map((id) => (
        <div key={id}>{renderSection(id, mode, snap, actions, picks, isPhone)}</div>
      ))}

      {bodySections.length === 0 ? (
        <div className="pro-surface p-6 text-center text-sm text-muted">
          All body sections are hidden in Customise. Use Period bar → Customise to bring them back.
        </div>
      ) : isPhone ? (
        <div className="flex flex-col gap-3">
          {phoneTabs.length > 0 ? (
            <SmoothTab
              items={phoneTabs.map((t) => ({ id: t.id, title: t.title, icon: t.icon }))}
              value={activePhoneDef?.id}
              onChange={(id) => setPhoneTab(id as PhoneTabId)}
              label="Energy sections"
            />
          ) : null}
          {activePhoneDef ? (
            <div className="flex flex-col gap-3">
              {activePhoneDef.sections.map((id) => (
                <div key={id}>{renderSection(id, mode, snap, actions, picks, true)}</div>
              ))}
            </div>
          ) : null}
        </div>
      ) : isTablet ? (
        <div className="grid grid-cols-2 items-start gap-4">
          {bodySections.map((id, i) => {
            const meta = ENERGY_SECTIONS.find((s) => s.id === id);
            const fullSpan = meta?.desktopSpan === 'full' || meta?.desktopSpan === 'wide';
            const isOddTrailing = !fullSpan && i === bodySections.length - 1;
            return (
              <div key={id} className={cn(fullSpan || isOddTrailing ? 'col-span-2' : 'col-span-1')}>
                {renderSection(id, mode, snap, actions, picks, false)}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-12 items-start gap-4">
          {bodySections.map((id) => (
            <div key={id} className={desktopSpanClass(id, bodySet)}>
              {renderSection(id, mode, snap, actions, picks, false)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
