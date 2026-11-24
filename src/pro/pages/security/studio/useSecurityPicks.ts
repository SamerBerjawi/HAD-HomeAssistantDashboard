/**
 * Persists per-section concept approvals and notes for the Security Studio in localStorage
 * (`had.pro.securityStudio.pick`) and formats chat-ready summaries.
 */
import { useCallback, useMemo, useState } from 'react';
import { SECURITY_CATALOG, type SecurityConceptId } from './securityCatalog';
import type { SecuritySectionId } from './studioSecurity';

export type SecuritySectionChoice = SecurityConceptId | 'mix' | null;

export interface SecuritySectionPick {
  concept: SecuritySectionChoice;
  notes: string;
}

export interface SecurityStudioPickState {
  sections: Partial<Record<SecuritySectionId, SecuritySectionPick>>;
  pageNotes: string;
}

const PICK_KEY = 'had.pro.securityStudio.pick';

function readStored(): SecurityStudioPickState {
  try {
    const raw = JSON.parse(window.localStorage.getItem(PICK_KEY) ?? 'null') as Partial<SecurityStudioPickState> | null;
    if (raw && typeof raw === 'object') {
      return {
        sections: raw.sections && typeof raw.sections === 'object' ? raw.sections : {},
        pageNotes: typeof raw.pageNotes === 'string' ? raw.pageNotes : ''
      };
    }
  } catch {
    /* blocked storage */
  }
  return { sections: {}, pageNotes: '' };
}

function writeStored(next: SecurityStudioPickState) {
  try {
    window.localStorage.setItem(PICK_KEY, JSON.stringify(next));
  } catch {
    /* blocked storage */
  }
}

export function useSecurityPicks() {
  const [state, setState] = useState<SecurityStudioPickState>(readStored);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getSectionPick = useCallback(
    (id: SecuritySectionId): SecuritySectionPick => state.sections[id] ?? { concept: null, notes: '' },
    [state.sections]
  );

  const setSectionPick = useCallback((id: SecuritySectionId, next: SecuritySectionPick) => {
    setCopiedId(null);
    setState((prev) => {
      const updated: SecurityStudioPickState = {
        ...prev,
        sections: { ...prev.sections, [id]: next }
      };
      writeStored(updated);
      return updated;
    });
  }, []);

  const setPageNotes = useCallback((pageNotes: string) => {
    setCopiedId(null);
    setState((prev) => {
      const updated = { ...prev, pageNotes };
      writeStored(updated);
      return updated;
    });
  }, []);

  const pickedCount = useMemo(
    () => SECURITY_CATALOG.filter((e) => state.sections[e.id]?.concept).length,
    [state.sections]
  );

  const copySection = useCallback(
    async (id: SecuritySectionId) => {
      const entry = SECURITY_CATALOG.find((e) => e.id === id);
      if (!entry) return;
      const pick = state.sections[id];
      if (!pick?.concept) return;
      const name = entry.concepts.find((c) => c.id === pick.concept)?.name;
      const label = pick.concept === 'mix' ? 'Mix' : `Concept ${pick.concept}${name ? ` (${name})` : ''}`;
      const text = `Security Studio · ${entry.title}: approve ${label}.${pick.notes.trim() ? ` Notes: ${pick.notes.trim()}` : ''}`;
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
    const lines = SECURITY_CATALOG.map((entry) => {
      const pick = state.sections[entry.id];
      if (!pick?.concept) return `- ${entry.title}: pending (recommended ${entry.recommended})`;
      const name = entry.concepts.find((c) => c.id === pick.concept)?.name;
      const label = pick.concept === 'mix' ? 'Mix' : `${pick.concept} (${name ?? ''})`;
      return `- ${entry.title}: ${label}${pick.notes.trim() ? ` — ${pick.notes.trim()}` : ''}`;
    });
    const header = `Security Studio picks (${pickedCount}/${SECURITY_CATALOG.length}):`;
    const footer = state.pageNotes.trim() ? `\nPage notes: ${state.pageNotes.trim()}` : '';
    try {
      await navigator.clipboard.writeText(`${header}\n${lines.join('\n')}${footer}`);
      setCopiedId('all');
    } catch {
      setCopiedId(null);
    }
  }, [pickedCount, state.pageNotes, state.sections]);

  return { state, pickedCount, copiedId, getSectionPick, setSectionPick, setPageNotes, copySection, copyAll };
}
