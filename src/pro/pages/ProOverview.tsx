/**
 * Pro Overview (rebuilt, docs/pro-ui/OVERVIEW_REBUILD.md; cutover 2026-11-20, Phase 5).
 * Widgets come from the registry (`widgets/registry.ts`) and are placed by the layout engine, one
 * layout per device type (`preferences.proOverviewLayout`). The shell adds the attention pills,
 * the section tabs with counts and the empty state. Customize opens a draft: nothing is written
 * until Save; while editing, the screen can be pinned to a device type's layout (wall tablets).
 */
import { useEffect, useMemo, useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ComputerIcon, SmartPhone01Icon, Tablet01Icon } from '@hugeicons/core-free-icons';
import { AddWidgetsSheetNext } from '../components/overviewNext/AddWidgetsSheetNext';
import { EditToolbar } from '../components/overviewNext/EditToolbar';
import { OverviewShell } from '../components/overviewNext/OverviewShell';
import { WidgetSheetHost } from '../components/overviewNext/WidgetSheetHost';
import { useDeviceType } from '../hooks/useDeviceType';
import { useOverviewLayout } from '../hooks/useOverviewLayout';
import { DEVICE_COLUMNS, DEVICE_TYPES, showWidget, type DeviceType } from '../lib/overviewLayout';
import { EnergyDataMount } from '../widgets/energy/EnergyDataMount';
import { LEGACY_WIDGET_IDS, WIDGET_LAYOUT_INFO, WIDGETS } from '../widgets/registry';

const DEVICE_ICON = { phone: SmartPhone01Icon, tablet: Tablet01Icon, desktop: ComputerIcon };
const DEVICE_LABEL: Record<DeviceType, string> = { phone: 'Phone', tablet: 'Tablet', desktop: 'Desktop' };
/** A screen pinned to a smaller layout shows it at that width, as it will look there. */
const DEVICE_MAX_WIDTH: Record<DeviceType, number | undefined> = { phone: 430, tablet: 1024, desktop: undefined };

export default function ProOverview() {
  const { device, detected, pinned, setPinned } = useDeviceType();
  const api = useOverviewLayout(WIDGET_LAYOUT_INFO, device, LEGACY_WIDGET_IDS);
  const cols = DEVICE_COLUMNS[device];
  const [isAddOpen, setAddOpen] = useState(false);
  const hiddenCount = useMemo(() => api.layout.hidden.filter((id) => WIDGETS.some((w) => w.id === id)).length, [api.layout.hidden]);

  // Leaving with unsaved layout changes asks first.
  useEffect(() => {
    if (!api.isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [api.isDirty]);

  // Escape cancels editing (a sheet open on top handles its own Escape first).
  useEffect(() => {
    if (!api.isEditing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented && !document.querySelector('[role="dialog"]')) api.cancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [api]);

  const toolbar = (
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
  );

  const editBar = api.isEditing ? (
    <div className="pro-surface flex flex-wrap items-center gap-3 p-3">
      <div className="flex min-w-0 flex-col">
        <span className="text-sm font-semibold">Customize Overview</span>
        <span className="text-xs text-muted">
          {DEVICE_LABEL[device]} layout{pinned ? ' (pinned on this screen)' : ''}. Nothing is saved until Save.
        </span>
      </div>
      <ToggleButtonGroup
        aria-label="Layout this screen uses"
        size="sm"
        selectionMode="single"
        disallowEmptySelection
        isDisabled={api.isDirty}
        selectedKeys={new Set([pinned ?? 'auto'])}
        onSelectionChange={(keys) => {
          const next = [...keys][0] as DeviceType | 'auto' | undefined;
          if (!next) return;
          // The draft belongs to one device type: switch, then start editing that layout.
          api.cancel();
          setPinned(next === 'auto' ? null : next);
        }}
      >
        <ToggleButton id="auto" aria-label={`Automatic (${DEVICE_LABEL[detected]} on this screen)`}>
          Auto
        </ToggleButton>
        {DEVICE_TYPES.map((d) => (
          <ToggleButton key={d} id={d} aria-label={`Use the ${DEVICE_LABEL[d].toLowerCase()} layout on this screen`}>
            <HugeiconsIcon icon={DEVICE_ICON[d]} size={16} />
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <div className="ml-auto">{toolbar}</div>
    </div>
  ) : null;

  return (
    <div className="pro flex flex-col gap-4" data-page="overview">
      {editBar}
      <div className="mx-auto w-full" style={{ maxWidth: DEVICE_MAX_WIDTH[device] }}>
        <OverviewShell widgets={WIDGETS} api={api} cols={cols} onAddWidgets={() => setAddOpen(true)} toolbar={api.isEditing ? null : toolbar} />
      </div>
      <AddWidgetsSheetNext isOpen={isAddOpen} onOpenChange={setAddOpen} widgets={WIDGETS} hidden={api.layout.hidden} onAdd={(w) => api.update((l) => showWidget(l, w, cols))} />
      <WidgetSheetHost />
      <EnergyDataMount layout={api.layout} />
    </div>
  );
}
