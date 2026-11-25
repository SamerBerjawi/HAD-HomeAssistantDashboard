/**
 * Pro Overview (rebuilt, docs/pro-ui/OVERVIEW_REBUILD.md + Phase 0/1/2):
 * Custom & auto sections, pinned entities/rooms/scenes/cameras, header/tab controls,
 * 20-step Undo/Redo, multi-user scope, and mobile-first `ProEditBar`.
 */
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { PlusSignIcon, SlidersHorizontalIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { AddWidgetsSheetNext } from '../components/overviewNext/AddWidgetsSheetNext';
import { EditToolbar } from '../components/overviewNext/EditToolbar';
import { OverviewOptionsSheet } from '../components/overviewNext/OverviewOptionsSheet';
import { OverviewShell } from '../components/overviewNext/OverviewShell';
import { WidgetSheetHost } from '../components/overviewNext/WidgetSheetHost';
import { ProEditBar } from '../components/ProEditBar';
import { useDeviceType } from '../hooks/useDeviceType';
import { useLayoutScope } from '../hooks/useLayoutScope';
import { useOverviewLayout } from '../hooks/useOverviewLayout';
import {
  allPinnedCardIds,
  DEVICE_COLUMNS,
  isCustomOverviewSection,
  pinCardToSection,
  sectionTitleOf,
  showWidget,
  type AnyOverviewSectionId,
  type DeviceType
} from '../lib/overviewLayout';
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
  const [isOptionsOpen, setOptionsOpen] = useState(false);
  const [renameSectionId, setRenameSectionId] = useState<AnyOverviewSectionId | null>(null);
  const hiddenCount = useMemo(() => api.layout.hidden.filter((id) => WIDGETS.some((w) => w.id === id)).length, [api.layout.hidden]);
  const pinnedIds = useMemo(() => allPinnedCardIds(api.layout), [api.layout]);
  const sectionChoices = useMemo(
    () =>
      api.layout.sectionOrder
        .filter((id) => (api.layout.items[id] ?? []).some((p) => !api.layout.hidden.includes(p.i)) || isCustomOverviewSection(api.layout, id))
        .map((id) => ({ id, title: sectionTitleOf(api.layout, id) })),
    [api.layout]
  );

  useEffect(() => {
    setEditingPage(api.isEditing ? 'overview' : null);
  }, [api.isEditing, setEditingPage]);

  useEffect(() => () => setEditingPage(null), [setEditingPage]);

  useEffect(() => {
    if (!api.isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [api.isDirty]);

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
        <OverviewShell
          widgets={WIDGETS}
          api={api}
          cols={cols}
          onAddWidgets={() => setAddOpen(true)}
          onRenameSection={(sec) => {
            setRenameSectionId(sec);
            setOptionsOpen(true);
          }}
          toolbar={api.isEditing ? null : toolbar}
        />
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
            label: 'Add',
            icon: PlusSignIcon,
            badge: hiddenCount,
            onPress: () => setAddOpen(true)
          }}
          extraActions={
            <>
              <Button size="sm" variant="ghost" onPress={() => setOptionsOpen(true)} className="h-7 gap-1 text-xs">
                <HugeiconsIcon icon={SlidersHorizontalIcon} size={13} />
                Sections &amp; header
              </Button>
              {hiddenCount > 0 ? (
                <Button size="sm" variant="ghost" onPress={api.applyHiddenToAllDevices} className="h-7 text-xs">
                  Sync hidden to all devices
                </Button>
              ) : null}
            </>
          }
        />
      ) : null}
      <AddWidgetsSheetNext
        isOpen={isAddOpen}
        onOpenChange={setAddOpen}
        widgets={WIDGETS}
        hidden={api.layout.hidden}
        sections={sectionChoices}
        pinnedIds={pinnedIds}
        onAdd={(w) => api.update((l) => showWidget(l, w, cols))}
        onPinCard={(cardId, secId) => api.update((l) => pinCardToSection(l, cardId, secId, cols))}
      />
      <OverviewOptionsSheet
        isOpen={isOptionsOpen}
        onOpenChange={setOptionsOpen}
        layout={api.layout}
        device={device}
        widgets={WIDGET_LAYOUT_INFO}
        renameTargetId={renameSectionId}
        onClearRenameTarget={() => setRenameSectionId(null)}
        onUpdateLayout={api.update}
      />
      <WidgetSheetHost />
      <EnergyDataMount layout={api.layout} />
    </div>
  );
}
