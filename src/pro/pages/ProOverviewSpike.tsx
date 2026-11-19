/**
 * Phase 0 layout spike (docs/pro-ui/OVERVIEW_REBUILD.md). Dev only: /overview?spike.
 * Seven dummy widgets in three sections on react-grid-layout v2. Layouts live in memory only;
 * Save never writes the shared config.
 */
import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import { Button, Dropdown, Label, Switch, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ComputerIcon, PlusSignIcon, SmartPhone01Icon, Tablet01Icon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { ProSheet } from '../components/ProSheet';
import { SpikeCard } from '../components/overviewSpike/SpikeCard';
import { moveByCell, SPIKE_GAP_PX, type SpikeCompaction } from '../components/overviewSpike/SpikeSectionGrid';
import { SpikeSection } from '../components/overviewSpike/SpikeSection';
import { SPIKE_WIDGET_BY_ID, SPIKE_WIDGETS } from '../components/overviewSpike/spikeWidgets';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useSheetParam } from '../hooks/useSheetParam';
import { WidgetSheetHost } from '../components/overviewNext/WidgetSheetHost';
import { WIDGET_BY_ID } from '../widgets/registry';
import type { WidgetDefinition } from '../widgets/types';
import {
  buildDefaultDeviceLayout,
  cellsFor,
  DEVICE_COLUMNS,
  DEVICE_TYPES,
  getDeviceLayout,
  normalizeDeviceLayout,
  packPlacements,
  type DeviceLayout,
  type DeviceType,
  type LayoutPlacement,
  type WidgetSize
} from '../lib/overviewLayout';
import type { OverviewSectionId } from '../lib/overviewSections';

const DEVICE_ICON = { phone: SmartPhone01Icon, tablet: Tablet01Icon, desktop: ComputerIcon };
const DEVICE_MAX_WIDTH: Record<DeviceType, number | undefined> = { phone: 430, tablet: 1024, desktop: undefined };

/** A registry widget inside the spike card: real model, body and sheet (Phase 1 pilot). */
function RegistryCard({ def, ...card }: { def: WidgetDefinition<never> } & Omit<ComponentProps<typeof SpikeCard>, 'subtitle' | 'children'>) {
  const model = def.useModel();
  const Body = def.Body;
  return (
    <SpikeCard {...card} subtitle={def.subtitle?.(model)}>
      <Body model={model} size={card.size} />
    </SpikeCard>
  );
}

export default function ProOverviewSpike() {
  const { config } = useUserConfig();
  const isPhone = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1279px)');
  const detected: DeviceType = isPhone ? 'phone' : isTablet ? 'tablet' : 'desktop';
  const [forced, setForced] = useState<DeviceType | null>(null);
  const device = forced ?? detected;
  const cols = DEVICE_COLUMNS[device];

  const [saved, setSaved] = useState<Record<DeviceType, DeviceLayout>>(() => ({
    phone: getDeviceLayout(config, SPIKE_WIDGETS, 'phone'),
    tablet: getDeviceLayout(config, SPIKE_WIDGETS, 'tablet'),
    desktop: getDeviceLayout(config, SPIKE_WIDGETS, 'desktop')
  }));
  const [draft, setDraft] = useState<DeviceLayout | null>(null);
  const [sideBySide, setSideBySide] = useState(true);
  const [compaction, setCompaction] = useState<SpikeCompaction>('flow');
  const [notice, setNotice] = useState<string | null>(null);
  const { sheet, open: openSheet, close: closeSheet } = useSheetParam();

  const isEditing = draft !== null;
  const layout = draft ?? saved[device];
  const isDirty = isEditing && JSON.stringify(draft) !== JSON.stringify(saved[device]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  const update = (fn: (l: DeviceLayout) => DeviceLayout) => setDraft((d) => (d ? fn(d) : d));
  const setSection = (section: OverviewSectionId, items: LayoutPlacement[]) => update((l) => ({ ...l, items: { ...l.items, [section]: items } }));
  const sectionOf = (id: string) => SPIKE_WIDGET_BY_ID.get(id)?.section;

  const visible = useMemo(
    () =>
      layout.sectionOrder
        .map((section) => ({ section, items: (layout.items[section] ?? []).filter((p) => !layout.hidden.includes(p.i)) }))
        .filter((s) => s.items.length > 0),
    [layout]
  );

  const startEdit = () => {
    setNotice(null);
    setDraft(structuredClone(saved[device]));
  };
  const cancel = () => setDraft(null);
  const save = () => {
    if (draft) setSaved((s) => ({ ...s, [device]: normalizeDeviceLayout(draft, SPIKE_WIDGETS, device) }));
    setDraft(null);
    setNotice(`Saved the ${device} layout in memory (the spike never writes your config).`);
  };

  const hide = (id: string) => update((l) => ({ ...l, hidden: [...l.hidden, id] }));
  const unhide = (id: string) =>
    update((l) => {
      const section = sectionOf(id);
      if (!section) return l;
      const rest = (l.items[section] ?? []).filter((p) => p.i !== id);
      const bottom = rest.reduce((m, p) => Math.max(m, p.y + cellsFor(p.size, cols).h), 0);
      const def = SPIKE_WIDGET_BY_ID.get(id);
      const [placed] = packPlacements([{ i: id, size: def?.defaultSize ?? 's' }], cols);
      return { ...l, hidden: l.hidden.filter((h) => h !== id), items: { ...l.items, [section]: [...rest, { ...placed, y: placed.y + bottom }] } };
    });
  const moveSection = (section: OverviewSectionId, dir: -1 | 1) =>
    update((l) => {
      const order = [...l.sectionOrder];
      const shown = visible.map((v) => v.section);
      const target = shown[shown.indexOf(section) + dir];
      if (!target) return l;
      const a = order.indexOf(section);
      const b = order.indexOf(target);
      [order[a], order[b]] = [order[b], order[a]];
      return { ...l, sectionOrder: order };
    });
  const toggleCollapsed = (section: OverviewSectionId) => {
    const flip = (l: DeviceLayout) => ({ ...l, collapsed: l.collapsed.includes(section) ? l.collapsed.filter((s) => s !== section) : [...l.collapsed, section] });
    if (isEditing) update(flip);
    else setSaved((s) => ({ ...s, [device]: flip(s[device]) }));
  };

  const usedCols = (items: LayoutPlacement[]) => Math.max(2, ...items.map((p) => p.x + cellsFor(p.size, cols).w));
  // Registry widgets open their real sheet through WidgetSheetHost; dummies get a stand-in.
  const sheetWidget = sheet && !WIDGET_BY_ID.has(sheet) ? SPIKE_WIDGET_BY_ID.get(sheet) : undefined;

  return (
    <div className="pro flex flex-col gap-4" data-page="overview">
      <div className="pro-surface flex flex-wrap items-center gap-3 p-3">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Layout spike (Phase 0)</span>
          <span className="text-xs text-muted">
            Detected {detected}; showing {device}, {cols} columns. Nothing here is saved to your config.
          </span>
        </div>
        <ToggleButtonGroup
          aria-label="Preview device type"
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          isDisabled={isEditing}
          selectedKeys={new Set([device])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as DeviceType | undefined;
            if (next) setForced(next === detected ? null : next);
          }}
        >
          {DEVICE_TYPES.map((d) => (
            <ToggleButton key={d} id={d} aria-label={`Preview ${d} layout`}>
              <HugeiconsIcon icon={DEVICE_ICON[d]} size={16} />
              <span className="hidden capitalize sm:inline">{d}</span>
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Switch size="sm" isSelected={sideBySide} onChange={setSideBySide} isDisabled={isEditing} aria-label="Sections side by side when there is room">
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Label className="text-xs">Side by side</Label>
          </Switch.Content>
        </Switch>
        <ToggleButtonGroup
          aria-label="How cards reorder"
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={new Set([compaction])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as SpikeCompaction | undefined;
            if (next) setCompaction(next);
          }}
        >
          <ToggleButton id="flow">Flow</ToggleButton>
          <ToggleButton id="free">Free</ToggleButton>
        </ToggleButtonGroup>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {isEditing ? (
            <>
              <Dropdown>
                <Button size="sm" variant="tertiary" isDisabled={layout.hidden.length === 0}>
                  <HugeiconsIcon icon={PlusSignIcon} size={16} />
                  Add ({layout.hidden.length})
                </Button>
                <Dropdown.Popover placement="bottom end">
                  <Dropdown.Menu aria-label="Hidden widgets" onAction={(key) => unhide(String(key))}>
                    {layout.hidden.map((id) => (
                      <Dropdown.Item key={id} id={id} textValue={SPIKE_WIDGET_BY_ID.get(id)?.title ?? id}>
                        <Label>{SPIKE_WIDGET_BY_ID.get(id)?.title ?? id}</Label>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
              <Button size="sm" variant="ghost" onPress={() => setDraft(buildDefaultDeviceLayout(SPIKE_WIDGETS, device))}>
                Reset
              </Button>
              <Button size="sm" variant="tertiary" onPress={cancel}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onPress={save}>
                Save{isDirty ? '' : ' (no changes)'}
              </Button>
            </>
          ) : (
            <Button size="sm" variant="primary" onPress={startEdit}>
              Customize
            </Button>
          )}
        </div>
        {notice ? <p className="w-full text-xs text-muted" role="status">{notice}</p> : null}
      </div>

      <div
        className="mx-auto grid w-full"
        style={{ maxWidth: DEVICE_MAX_WIDTH[device], gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: SPIKE_GAP_PX * 2, columnGap: SPIKE_GAP_PX, gridAutoFlow: 'row dense' }}
      >
        {visible.map(({ section, items }, idx) => {
          const span = isEditing || !sideBySide ? cols : Math.min(cols, usedCols(items));
          return (
            <SpikeSection
              key={section}
              id={section}
              placements={items}
              cols={span}
              span={span}
              isEditing={isEditing}
              compaction={compaction}
              isCollapsed={layout.collapsed.includes(section)}
              isFirst={idx === 0}
              isLast={idx === visible.length - 1}
              onToggleCollapsed={() => toggleCollapsed(section)}
              onMove={(dir) => moveSection(section, dir)}
              onChange={(next) => setSection(section, next)}
              renderCard={(p) => {
                const widget = SPIKE_WIDGET_BY_ID.get(p.i);
                if (!widget) return null;
                const real = WIDGET_BY_ID.get(p.i);
                const card = {
                  widget,
                  size: p.size,
                  isEditing,
                  onOpen: () => openSheet(widget.id),
                  onSetSize: (size: WidgetSize) => setSection(section, items.map((q) => (q.i === p.i ? { ...q, size } : q))),
                  onHide: () => hide(widget.id),
                  onMoveBy: (dx: number, dy: number) => setSection(section, moveByCell(items, p.i, dx, dy, span, compaction))
                };
                return real ? <RegistryCard def={real} {...card} /> : <SpikeCard {...card} />;
              }}
            />
          );
        })}
      </div>

      <ProSheet isOpen={Boolean(sheetWidget)} onOpenChange={(open) => !open && closeSheet()} title={sheetWidget?.title ?? ''} subtitle={sheetWidget?.subtitle} icon={sheetWidget?.icon ?? PlusSignIcon} page="overview">
        <p className="text-sm text-muted">
          Dummy sheet for <code>?sheet={sheet}</code>. The phone back button closes it.
        </p>
      </ProSheet>
      <WidgetSheetHost />
    </div>
  );
}
