/**
 * The rebuilt Overview while it is being built (rebuild, Phase 2). Dev only: /overview?next.
 * Real widgets come from the registry; placeholders stand in for the rest until Phase 3.
 * Unlike the spike, Save writes this device type's layout to the shared config.
 */
import { useEffect, useMemo, useState } from 'react';
import { Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ComputerIcon, SmartPhone01Icon, Tablet01Icon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { AddWidgetsSheetNext } from '../components/overviewNext/AddWidgetsSheetNext';
import { EditToolbar } from '../components/overviewNext/EditToolbar';
import { OverviewEngine } from '../components/overviewNext/OverviewEngine';
import type { EngineWidget } from '../components/overviewNext/WidgetCard';
import { WidgetSheetHost } from '../components/overviewNext/WidgetSheetHost';
import { useDeviceType } from '../hooks/useDeviceType';
import { useOverviewLayout } from '../hooks/useOverviewLayout';
import { DEVICE_COLUMNS, DEVICE_TYPES, showWidget, withoutDeviceLayout, type DeviceType, type LayoutWidgetInfo } from '../lib/overviewLayout';
import { DEV_PLACEHOLDERS } from '../widgets/devPlaceholders';
import { LEGACY_WIDGET_IDS, WIDGETS } from '../widgets/registry';

const DEVICE_ICON = { phone: SmartPhone01Icon, tablet: Tablet01Icon, desktop: ComputerIcon };
const DEVICE_MAX_WIDTH: Record<DeviceType, number | undefined> = { phone: 430, tablet: 1024, desktop: undefined };

const DEV_WIDGETS: readonly EngineWidget[] = [
  ...WIDGETS,
  ...DEV_PLACEHOLDERS.filter((p) => !WIDGETS.some((w) => w.id === p.id)).map((p) => p as unknown as EngineWidget)
];
const DEV_LAYOUT_INFO: readonly LayoutWidgetInfo[] = DEV_WIDGETS.map(({ id, section, sizes, defaultSize }) => ({ id, section, sizes, defaultSize }));

export default function ProOverviewNext() {
  const { updateConfig } = useUserConfig();
  const { device, detected, pinned, setPinned } = useDeviceType();
  const api = useOverviewLayout(DEV_LAYOUT_INFO, device, LEGACY_WIDGET_IDS);
  const cols = DEVICE_COLUMNS[device];
  const [isAddOpen, setAddOpen] = useState(false);
  const hiddenCount = useMemo(() => api.layout.hidden.filter((id) => DEV_WIDGETS.some((w) => w.id === id)).length, [api.layout.hidden]);

  useEffect(() => {
    if (!api.isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [api.isDirty]);

  return (
    <div className="pro flex flex-col gap-4" data-page="overview">
      <div className="pro-surface flex flex-wrap items-center gap-3 p-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold">Overview rebuild (dev)</span>
          <span className="text-xs text-muted">
            {device} layout, {cols} columns{pinned ? ` (pinned; detected ${detected})` : ''}. Save writes it to your config.
          </span>
        </div>
        <ToggleButtonGroup
          aria-label="Layout for this screen"
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          isDisabled={api.isEditing}
          selectedKeys={new Set([pinned ?? 'auto'])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as DeviceType | 'auto' | undefined;
            if (next) setPinned(next === 'auto' ? null : next);
          }}
        >
          <ToggleButton id="auto">Auto</ToggleButton>
          {DEVICE_TYPES.map((d) => (
            <ToggleButton key={d} id={d} aria-label={`Use the ${d} layout on this screen`}>
              <HugeiconsIcon icon={DEVICE_ICON[d]} size={16} />
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!api.isEditing ? (
            <Button size="sm" variant="ghost" onPress={() => void updateConfig((prev) => DEVICE_TYPES.reduce((acc, d) => withoutDeviceLayout(acc, d), prev))}>
              Forget saved layouts (dev)
            </Button>
          ) : null}
          <EditToolbar
            isEditing={api.isEditing}
            isDirty={api.isDirty}
            hiddenCount={hiddenCount}
            onBegin={api.begin}
            onAddWidgets={() => setAddOpen(true)}
            onReset={api.resetToDefault}
            onCancel={api.cancel}
            onSave={() => void api.save()}
          />
        </div>
      </div>

      <div className="mx-auto w-full" style={{ maxWidth: DEVICE_MAX_WIDTH[device] }}>
        <OverviewEngine widgets={DEV_WIDGETS} api={api} cols={cols} />
      </div>

      <AddWidgetsSheetNext
        isOpen={isAddOpen}
        onOpenChange={setAddOpen}
        widgets={DEV_WIDGETS}
        hidden={api.layout.hidden}
        onAdd={(w) => api.update((l) => showWidget(l, w, cols))}
      />
      <WidgetSheetHost />
    </div>
  );
}
