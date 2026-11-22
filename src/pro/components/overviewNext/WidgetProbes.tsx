/**
 * Page shell (Phase 4): one invisible probe per widget whose card is not on screen (another tab,
 * a collapsed section). It runs the widget's model hook and reports its tab count and attention
 * pill, so tabs and pills stay right for sections that are not shown. A card on screen reports for
 * itself (`useReportWidgetStatus` in WidgetCard), so no widget runs its model twice.
 */
import { useReportWidgetStatus } from '../../hooks/useWidgetStatus';
import type { EngineWidget } from './WidgetCard';

function Probe({ widget }: { widget: EngineWidget }) {
  useReportWidgetStatus(widget, widget.useModel());
  return null;
}

export function WidgetProbes({ widgets }: { widgets: readonly EngineWidget[] }) {
  return (
    <>
      {widgets
        .filter((w) => w.count || w.attention)
        .map((w) => (
          <Probe key={w.id} widget={w} />
        ))}
    </>
  );
}
