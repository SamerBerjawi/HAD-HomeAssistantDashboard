/**
 * What each widget on the Overview reports for the page shell (Phase 4): its tab count and its
 * attention pill. Filled by each card on screen (and by `WidgetProbes` for the widgets whose card
 * is not), read by the tabs and the pills.
 */
import { useEffect } from 'react';
import { create } from 'zustand';
import type { AttentionTone, WidgetStatus } from '../lib/overviewShell';

interface WidgetStatusStore {
  byId: Record<string, WidgetStatus>;
  report: (id: string, status: WidgetStatus) => void;
  drop: (id: string) => void;
}

export const useWidgetStatusStore = create<WidgetStatusStore>((set) => ({
  byId: {},
  report: (id, status) =>
    set((s) => {
      const cur = s.byId[id];
      if (cur && cur.count === status.count && cur.attention?.label === status.attention?.label && cur.attention?.tone === status.attention?.tone) return s;
      return { byId: { ...s.byId, [id]: status } };
    }),
  drop: (id) =>
    set((s) => {
      if (!(id in s.byId)) return s;
      const next = { ...s.byId };
      delete next[id];
      return { byId: next };
    })
}));

interface StatusSource<Model> {
  id: string;
  count?: (model: Model) => number;
  attention?: (model: Model) => { label: string; tone: AttentionTone } | null;
}

/**
 * Reports a widget's tab count and attention pill from a model it already has. The card calls it
 * for itself, and a probe only for a widget whose card is not on screen, so each widget runs its
 * model once. Widgets with neither `count` nor `attention` report nothing.
 */
export function useReportWidgetStatus<Model>(widget: StatusSource<Model>, model: Model): void {
  const watches = Boolean(widget.count || widget.attention);
  const count = widget.count?.(model) ?? 0;
  const attention = widget.attention?.(model) ?? null;
  const report = useWidgetStatusStore((s) => s.report);
  const drop = useWidgetStatusStore((s) => s.drop);
  const label = attention?.label;
  const tone = attention?.tone;
  useEffect(() => {
    if (watches) report(widget.id, { count, attention: label && tone ? { label, tone } : null });
  }, [watches, report, widget.id, count, label, tone]);
  useEffect(() => (watches ? () => drop(widget.id) : undefined), [watches, drop, widget.id]);
}
