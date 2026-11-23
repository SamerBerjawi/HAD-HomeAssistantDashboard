/**
 * Persists per-section concept approvals and notes for the Energy Studio in localStorage
 * (`had.pro.energyStudio.pick`) and formats chat-ready summaries.
 */
import { useCallback, useMemo, useState } from 'react';
import { CHOSEN_ENERGY_CONCEPTS, type EnergySectionId, type ResponsiveConceptChoice } from '../../../lib/energyPage';
import { ENERGY_CATALOG, type ConceptId } from './energyCatalog';

export type SectionChoice = ConceptId | 'mix' | null;

export interface SectionPick {
  concept: SectionChoice;
  notes: string;
}

export interface EnergyStudioPickState {
  sections: Partial<Record<EnergySectionId, SectionPick>>;
  pageNotes: string;
}

const PICK_KEY = 'had.pro.energyStudio.pick';

function defaultSections(): Partial<Record<EnergySectionId, SectionPick>> {
  const out: Partial<Record<EnergySectionId, SectionPick>> = {};
  for (const [id, choice] of Object.entries(CHOSEN_ENERGY_CONCEPTS) as [EnergySectionId, ResponsiveConceptChoice][]) {
    out[id] = {
      concept: choice.desktop,
      notes: choice.desktop !== choice.mobile ? `Mobile: ${choice.mobile}` : ''
    };
  }
  return out;
}

function readStoredPicks(): EnergyStudioPickState {
  const defaults = defaultSections();
  try {
    const raw = JSON.parse(window.localStorage.getItem(PICK_KEY) ?? 'null') as Partial<EnergyStudioPickState> | null;
    if (raw && typeof raw === 'object') {
      return {
        sections: { ...defaults, ...(raw.sections && typeof raw.sections === 'object' ? raw.sections : {}) },
        pageNotes: typeof raw.pageNotes === 'string' ? raw.pageNotes : ''
      };
    }
  } catch {
    /* blocked storage: state lasts for this visit */
  }
  return { sections: defaults, pageNotes: '' };
}

function writeStoredPicks(next: EnergyStudioPickState) {
  try {
    window.localStorage.setItem(PICK_KEY, JSON.stringify(next));
  } catch {
    /* blocked storage */
  }
}

export function useEnergyPicks() {
  const [state, setState] = useState<EnergyStudioPickState>(readStoredPicks);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getSectionPick = useCallback(
    (id: EnergySectionId): SectionPick => state.sections[id] ?? { concept: null, notes: '' },
    [state.sections]
  );

  const setSectionPick = useCallback((id: EnergySectionId, next: SectionPick) => {
    setCopiedId(null);
    setState((prev) => {
      const updated: EnergyStudioPickState = {
        ...prev,
        sections: { ...prev.sections, [id]: next }
      };
      writeStoredPicks(updated);
      return updated;
    });
  }, []);

  const setPageNotes = useCallback((pageNotes: string) => {
    setCopiedId(null);
    setState((prev) => {
      const updated = { ...prev, pageNotes };
      writeStoredPicks(updated);
      return updated;
    });
  }, []);

  const pickedCount = useMemo(
    () => ENERGY_CATALOG.filter((e) => state.sections[e.id]?.concept).length,
    [state.sections]
  );

  const copySection = useCallback(
    async (id: EnergySectionId) => {
      const entry = ENERGY_CATALOG.find((e) => e.id === id);
      if (!entry) return;
      const pick = state.sections[id];
      if (!pick?.concept) return;
      const conceptName = entry.concepts.find((c) => c.id === pick.concept)?.name;
      const label = pick.concept === 'mix' ? 'Mix' : `Concept ${pick.concept}${conceptName ? ` (${conceptName})` : ''}`;
      const text = `Energy Studio · ${entry.title}: approve ${label}.${pick.notes.trim() ? ` Notes: ${pick.notes.trim()}` : ''}`;
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
      } catch {
        setCopiedId(null);
      }
    },
    [state.sections]
  );

  const copyAll = useCallback(async () => {
    const lines = ENERGY_CATALOG.map((entry) => {
      const pick = state.sections[entry.id];
      if (!pick?.concept) return `- ${entry.title}: pending (recommended ${entry.recommended})`;
      const conceptName = entry.concepts.find((c) => c.id === pick.concept)?.name;
      const label = pick.concept === 'mix' ? 'Mix' : `${pick.concept} (${conceptName ?? ''})`;
      return `- ${entry.title}: ${label}${pick.notes.trim() ? ` — ${pick.notes.trim()}` : ''}`;
    });
    const header = `Energy Studio picks (${pickedCount}/${ENERGY_CATALOG.length}):`;
    const footer = state.pageNotes.trim() ? `\nPage notes: ${state.pageNotes.trim()}` : '';
    try {
      await navigator.clipboard.writeText(`${header}\n${lines.join('\n')}${footer}`);
      setCopiedId('all');
    } catch {
      setCopiedId(null);
    }
  }, [pickedCount, state.pageNotes, state.sections]);

  return {
    state,
    pickedCount,
    copiedId,
    getSectionPick,
    setSectionPick,
    setPageNotes,
    copySection,
    copyAll
  };
}
