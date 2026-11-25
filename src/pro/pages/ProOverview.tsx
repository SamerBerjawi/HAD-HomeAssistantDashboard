/**
 * Pro Overview (rebuilt, docs/pro-ui/OVERVIEW_REBUILD.md; cutover 2026-11-20, Phase 5 + Phase 0/1).
 * Widgets come from the registry (`widgets/registry.ts`) and are placed by the layout engine, one
 * layout per device type (`preferences.proOverviewLayout` or personal `userLayouts[uid]`), with
 * Auto vs. Custom mode, Undo/Redo, and the unified mobile-first `ProEditBar`.
 */
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@heroui/react';
import { PlusSignIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { AddWidgetsSheetNext } from '../components/overviewNext/AddWidgetsSheetNext';
import { EditToolbar } from '../components/overviewNext/EditToolbar';
import { OverviewShell } from '../components/overviewNext/OverviewShell';
import { WidgetSheetHost } from '../components/overviewNext/WidgetSheetHost';
import { ProEditBar } from '../components/ProEditBar';
import { useDeviceType } from '../hooks/useDeviceType';
import { useLayoutScope } from '../hooks/useLayoutScope';
import { useOverviewLayout } from '../hooks/useOverviewLayout';
import { DEVICE_COLUMNS, showWidget, type DeviceType } from '../lib/overviewLayout';
import { useOverviewLayoutDraft } from '../store/useOverviewLayoutDraft';
import { useProEditChrome } from '../store/useProEditChrome';
import { EnergyDataMount } from '../widgets/energy/EnergyDataMount';
import { LEGACY_WIDGET_IDS, WIDGET_LAYOUT_INFO, WIDGETS } from '../widgets/registry';

/** A screen previewing or pinned to a smaller layout shows it at that width, as it will look there. */
const DEVICE_MAX_WIDTH: Record<DeviceType, number | undefined> = { phone: 430, tablet: 1024, desktop: undefined };

export default function ProOverview() {
  const { device: viewDevice, detected, pinned, setPinned } = useDeviceType();
  const activeDraftDevice = useOverviewLayoutDraft((s) => s.device);
  const device = activeDraftDevice ?? viewDevice;
  const api = useOverviewLayout(WIDGET_LAYOUT_INFO, device, LEGACY_WIDGET_IDS);
  const { scope, setAdminTarget, toggleShareEnabled, forkToPersonal, revertToShared } = useLayoutScope();
  const setEditingPage = useProEditChrome((s) => s.setEditingPage);
  const cols = DEVICE_COLUMNS[device];
  const [isAddOpen, setAddOpen] = useState(false);
  const hiddenCount = useMemo(() => api.layout.hidden.filter((id) => WIDGETS.some((w) => w.id === id)).length, [api.layout.hidden]);

  useEffect(() => {
    setEditingPage(api.isEditing ? 'overview' : null);
  }, [api.isEditing, setEditingPage]);

  useEffect(() => () => setEditingPage(null), [setEditingPage]);

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

  return (
    <div className={cn('pro flex flex-col gap-4', api.isEditing && 'pb-24')} data-page="overview">
      <div className="mx-auto w-full" style={{ maxWidth: DEVICE_MAX_WIDTH[device] }}>
        <OverviewShell widgets={WIDGETS} api={api} cols={cols} onAddWidgets={() => setAddOpen(true)} toolbar={api.isEditing ? null : toolbar} />
      </div>
      {api.isEditing ? (
        <ProEditBar
          pageLabel="Overview"
          editingDevice={device}
          detectedDevice={detected}
          pinnedDevice={pinned}
          scope={scope}
          mode={api.mode}
          isDirty={api.isDirty}
          canUndo={api.canUndo}
          canRedo={api.canRedo}
          onUndo={api.undo}
          onRedo={api.redo}
          onCancel={api.cancel}
          onSave={() => void api.save()}
          onReset={api.resetToDefault}
          onSelectEditingDevice={(next) => api.switchEditingDevice(next)}
          onSetPinnedDevice={setPinned}
          onCopyFrom={(src) => api.copyFromDevice(src)}
          onAdminTargetChange={(target) => {
            api.cancel();
            setAdminTarget(target);
          }}
          onToggleShare={(enabled) => void toggleShareEnabled(enabled)}
          onForkToPersonal={() => {
            api.cancel();
            void forkToPersonal();
          }}
          onRevertToShared={() => {
            api.cancel();
            void revertToShared();
          }}
          onResetToAuto={() => void api.resetToAuto()}
          primaryAction={{
            label: 'Add widgets',
            icon: PlusSignIcon,
            badge: hiddenCount,
            onPress: () => setAddOpen(true)
          }}
          extraActions={
            hiddenCount > 0 ? (
              <Button size="sm" variant="ghost" onPress={api.applyHiddenToAllDevices} className="h-7 text-xs">
                Sync hidden to all devices
              </Button>
            ) : undefined
          }
        />
      ) : null}
      <AddWidgetsSheetNext isOpen={isAddOpen} onOpenChange={setAddOpen} widgets={WIDGETS} hidden={api.layout.hidden} onAdd={(w) => api.update((l) => showWidget(l, w, cols))} />
      <WidgetSheetHost />
      <EnergyDataMount layout={api.layout} />
    </div>
  );
}
