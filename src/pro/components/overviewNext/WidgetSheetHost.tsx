import { Suspense } from 'react';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useSheetParam } from '../../hooks/useSheetParam';
import { WIDGET_BY_ID } from '../../widgets/registry';
import type { WidgetDefinition } from '../../widgets/types';

function SheetMount({ widget, itemId, onClose }: { widget: WidgetDefinition<never>; itemId: string | null; onClose: () => void }) {
  const model = widget.useModel();
  const Sheet = widget.Sheet;
  if (!Sheet) return null;
  return (
    <Suspense fallback={null}>
      <Sheet model={model} itemId={itemId ?? undefined} onClose={onClose} />
    </Suspense>
  );
}

/**
 * Renders the sheet named in the URL (rebuild, Phase 1). Sheets load lazily from the registry and
 * only the open one subscribes to its data.
 */
export function WidgetSheetHost() {
  const { sheet, itemId, close } = useSheetParam();
  const widget = sheet ? WIDGET_BY_ID.get(sheet) : undefined;
  if (!widget?.Sheet) return null;
  // A sheet that fails (e.g. its chunk is gone after a deploy) closes quietly, the page stays.
  return (
    <ErrorBoundary variant="silent" label={`${widget.title} sheet`} resetKeys={[widget.id, itemId]}>
      <SheetMount key={widget.id} widget={widget} itemId={itemId} onClose={close} />
    </ErrorBoundary>
  );
}
