/**
 * Overview Sections & Header Options Sheet (Phase 2.1):
 * Create/rename/delete custom sections, configure section visibility (Overview & Tab / Tab only / Hidden),
 * toggle Attention Pills & horizontal Tabs, and set default landing tab.
 */
import { useEffect, useState } from 'react';
import { Button, InputGroup, Switch, TextField } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, PlusSignIcon, SlidersHorizontalIcon } from '@hugeicons/core-free-icons';
import { ProSheet } from '../ProSheet';
import {
  DEVICE_COLUMNS,
  createOverviewSection,
  deleteOverviewSection,
  isCustomOverviewSection,
  renameOverviewSection,
  sectionTitleOf,
  sectionVisibilityOf,
  setSectionVisibility,
  updateOverviewHeader,
  type AnyOverviewSectionId,
  type DeviceLayout,
  type DeviceType,
  type LayoutWidgetInfo,
  type SectionTabVisibility
} from '../../lib/overviewLayout';
import { SheetFilter } from '../../widgets/shared/sheet/SheetKit';

interface OverviewOptionsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  layout: DeviceLayout;
  device: DeviceType;
  widgets: readonly LayoutWidgetInfo[];
  renameTargetId?: AnyOverviewSectionId | null;
  onClearRenameTarget?: () => void;
  onUpdateLayout: (fn: (l: DeviceLayout) => DeviceLayout) => void;
}

const VISIBILITY_OPTIONS: { id: SectionTabVisibility; label: string }[] = [
  { id: 'all_and_tab', label: 'All + Tab' },
  { id: 'tab_only', label: 'Tab only' },
  { id: 'hidden', label: 'Hidden' }
];

export function OverviewOptionsSheet({
  isOpen,
  onOpenChange,
  layout,
  device,
  widgets,
  renameTargetId,
  onClearRenameTarget,
  onUpdateLayout
}: OverviewOptionsSheetProps) {
  const [newTitle, setNewTitle] = useState('');
  const [renameText, setRenameText] = useState('');
  const cols = DEVICE_COLUMNS[device];

  useEffect(() => {
    if (renameTargetId) {
      setRenameText(sectionTitleOf(layout, renameTargetId));
    }
  }, [renameTargetId, layout]);

  const handleAddSection = () => {
    const clean = newTitle.trim();
    if (!clean) return;
    onUpdateLayout((l) => createOverviewSection(l, clean).layout);
    setNewTitle('');
  };

  const handleCommitRename = () => {
    if (!renameTargetId) return;
    const clean = renameText.trim();
    if (clean) {
      onUpdateLayout((l) => renameOverviewSection(l, renameTargetId, clean));
    }
    onClearRenameTarget?.();
  };

  const tabSections = layout.sectionOrder.filter(
    (s) =>
      sectionVisibilityOf(layout, s) !== 'hidden' &&
      ((layout.items[s] ?? []).some((p) => !layout.hidden.includes(p.i)) || isCustomOverviewSection(layout, s))
  );

  const defaultTabOptions = [
    { id: 'all', label: 'All' },
    ...tabSections.map((id) => ({ id, label: sectionTitleOf(layout, id) }))
  ];
  const showPills = layout.header?.showAttentionPills ?? true;
  const showTabs = layout.header?.showTabs ?? true;
  const currentDefaultTab = layout.header?.defaultTab && defaultTabOptions.some((o) => o.id === layout.header?.defaultTab) ? layout.header.defaultTab : 'all';

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClearRenameTarget?.();
        onOpenChange(open);
      }}
      title="Sections & header"
      subtitle="Applies to draft — tap Save to keep"
      icon={SlidersHorizontalIcon}
      page="overview"
      size="lg"
    >
      <div className="flex flex-col gap-5">
        {renameTargetId && isCustomOverviewSection(layout, renameTargetId) ? (
          <section aria-label="Rename section" className="flex flex-col gap-2 rounded-2xl bg-default/40 p-3">
            <h3 className="text-xs font-semibold text-muted">Rename custom section</h3>
            <div className="flex items-center gap-2">
              <TextField aria-label="Section name" value={renameText} onChange={setRenameText} className="min-w-0 flex-1">
                <InputGroup fullWidth variant="secondary">
                  <InputGroup.Input
                    placeholder="Section name"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitRename();
                    }}
                  />
                </InputGroup>
              </TextField>
              <Button size="sm" variant="primary" onPress={handleCommitRename} className="h-10 px-3 text-xs">
                Rename
              </Button>
            </div>
          </section>
        ) : null}

        <section aria-label="Create custom section" className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-muted">New custom section</h3>
          <div className="flex items-center gap-2">
            <TextField aria-label="New section title" value={newTitle} onChange={setNewTitle} className="min-w-0 flex-1">
              <InputGroup fullWidth variant="secondary">
                <InputGroup.Input
                  placeholder="e.g. Quick Controls, Downstairs, Morning…"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSection();
                  }}
                />
              </InputGroup>
            </TextField>
            <Button size="sm" variant="secondary" onPress={handleAddSection} isDisabled={!newTitle.trim()} className="h-10 gap-1 px-3 text-xs">
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
              Add
            </Button>
          </div>
        </section>

        <section aria-label="Header & horizontal tabs" className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-muted">Header &amp; tabs</h3>
          <div className="flex min-h-10 items-center justify-between gap-2">
            <span className="text-sm">Show Attention Pills</span>
            <Switch
              size="sm"
              isSelected={showPills}
              onChange={() => onUpdateLayout((l) => updateOverviewHeader(l, { showAttentionPills: !showPills }))}
              aria-label="Show Attention Pills"
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Content>
            </Switch>
          </div>
          <div className="flex min-h-10 items-center justify-between gap-2">
            <span className="text-sm">Show horizontal section tabs</span>
            <Switch
              size="sm"
              isSelected={showTabs}
              onChange={() => onUpdateLayout((l) => updateOverviewHeader(l, { showTabs: !showTabs }))}
              aria-label="Show horizontal section tabs"
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Content>
            </Switch>
          </div>
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-xs text-muted">Default landing tab</span>
            <SheetFilter
              label="Default landing tab"
              value={currentDefaultTab}
              onChange={(v) => onUpdateLayout((l) => updateOverviewHeader(l, { defaultTab: v }))}
              options={defaultTabOptions}
            />
          </div>
        </section>

        <section aria-label="Section visibility" className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-muted">Section visibility</h3>
          {layout.sectionOrder.map((secId) => {
            const custom = isCustomOverviewSection(layout, secId);
            const vis = sectionVisibilityOf(layout, secId);
            const count = (layout.items[secId] ?? []).filter((p) => !layout.hidden.includes(p.i)).length;
            if (count === 0 && !custom) return null;
            const title = sectionTitleOf(layout, secId);
            return (
              <div key={secId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-default/40 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {title}
                  {custom ? <span className="ml-1.5 text-xs font-normal text-muted">(custom)</span> : null}
                </span>
                <SheetFilter
                  label={`${title} visibility`}
                  value={vis}
                  onChange={(next) => onUpdateLayout((l) => setSectionVisibility(l, secId, next))}
                  options={VISIBILITY_OPTIONS}
                />
                {custom ? (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={`Delete ${title}`}
                    onPress={() => onUpdateLayout((l) => deleteOverviewSection(l, secId, widgets, cols))}
                    className="size-8 min-w-0 text-danger"
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={15} />
                  </Button>
                ) : null}
              </div>
            );
          })}
        </section>
      </div>
    </ProSheet>
  );
}
