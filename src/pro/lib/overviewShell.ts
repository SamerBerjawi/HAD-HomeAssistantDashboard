/**
 * Overview page shell (rebuild, Phase 4 + Phase 2 custom sections): tabs and attention pills.
 */
import type { AnyOverviewSectionId } from './overviewLayout';
import { OVERVIEW_SECTION_LABELS, type OverviewSectionId } from './overviewSections';

export type AttentionTone = 'warning' | 'danger';

export interface WidgetStatus {
  count: number;
  attention: { label: string; tone: AttentionTone } | null;
}

export type ShellTabId = 'all' | AnyOverviewSectionId;

export interface ShellTab {
  id: ShellTabId;
  label: string;
  /** 0 = no number on the tab. */
  count: number;
  tone: AttentionTone | null;
}

export interface ShellPill {
  widgetId: string;
  section: AnyOverviewSectionId;
  label: string;
  tone: AttentionTone;
}

export interface ShellSection {
  section: AnyOverviewSectionId;
  items: readonly { i: string }[];
}

const worse = (a: AttentionTone | null, b: AttentionTone | null): AttentionTone | null => (a === 'danger' || b === 'danger' ? 'danger' : (a ?? b));

export function buildShellTabs(
  sections: readonly ShellSection[],
  status: Readonly<Record<string, WidgetStatus | undefined>>,
  sectionLabels?: Readonly<Record<string, string>>
): ShellTab[] {
  const tabs: ShellTab[] = sections.map(({ section, items }) => {
    let count = 0;
    let tone: AttentionTone | null = null;
    for (const { i } of items) {
      const s = status[i];
      if (!s) continue;
      count += Math.max(0, Math.round(s.count || 0));
      tone = worse(tone, s.attention?.tone ?? null);
    }
    const label = sectionLabels?.[section] ?? OVERVIEW_SECTION_LABELS[section as OverviewSectionId] ?? String(section);
    return { id: section, label, count, tone };
  });
  return [{ id: 'all', label: 'All', count: 0, tone: null }, ...tabs];
}

export function buildAttentionPills(sections: readonly ShellSection[], status: Readonly<Record<string, WidgetStatus | undefined>>): ShellPill[] {
  const pills: ShellPill[] = [];
  for (const { section, items } of sections) {
    for (const { i } of items) {
      const a = status[i]?.attention;
      if (a) pills.push({ widgetId: i, section, label: a.label, tone: a.tone });
    }
  }
  return pills
    .map((p, idx) => ({ p, idx }))
    .sort((a, b) => Number(b.p.tone === 'danger') - Number(a.p.tone === 'danger') || a.idx - b.idx)
    .map(({ p }) => p);
}

/** The tab to show: the asked one while it is on the page, else All (a tab can empty out). */
export function resolveShellTab(asked: string | null, tabs: readonly ShellTab[]): ShellTabId {
  return tabs.find((t) => t.id === asked)?.id ?? 'all';
}

export function resolveShellTabId(asked: string | null, sections: readonly { section: AnyOverviewSectionId }[]): ShellTabId {
  return sections.find((s) => s.section === asked)?.section ?? 'all';
}

/** Whether a section's cards are on screen: "All" shows every expanded section, a tab only its own. */
export function sectionShowsCards(
  section: AnyOverviewSectionId,
  tab: ShellTabId,
  collapsed: readonly AnyOverviewSectionId[]
): boolean {
  return tab === 'all' ? !collapsed.includes(section) : section === tab;
}
