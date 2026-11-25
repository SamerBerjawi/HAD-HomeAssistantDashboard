/**
 * Tabbed Add Widgets / Entities / Rooms / Scenes & Scripts / Cameras sheet (Phase 2.2).
 */
import { useMemo, useState } from 'react';
import { Button, Dropdown, InputGroup, Label, TextField } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  Camera01Icon,
  CheckmarkCircle02Icon,
  Home01Icon,
  Layers01Icon,
  MagicWand01Icon,
  PlusSignIcon,
  Search01Icon
} from '@hugeicons/core-free-icons';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { ProSheet } from '../ProSheet';
import { DEFAULT_OVERVIEW_SECTION_ORDER, OVERVIEW_SECTION_LABELS } from '../../lib/overviewSections';
import { SheetFilter } from '../../widgets/shared/sheet/SheetKit';
import type { EngineWidget } from './WidgetCard';

type AddCategory = 'widgets' | 'entities' | 'rooms' | 'scenes' | 'cameras';

interface AddWidgetsSheetNextProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  widgets: readonly EngineWidget[];
  hidden: readonly string[];
  sections?: readonly { id: string; title: string }[];
  pinnedIds?: readonly string[];
  onAdd: (widget: EngineWidget) => void;
  onPinCard?: (cardId: string, sectionId: string) => void;
}

const ENTITY_DOMAINS = new Set(['light', 'switch', 'input_boolean', 'climate', 'fan', 'cover', 'lock', 'media_player', 'vacuum', 'sensor', 'binary_sensor']);

export function AddWidgetsSheetNext({
  isOpen,
  onOpenChange,
  widgets,
  hidden,
  sections = [],
  pinnedIds = [],
  onAdd,
  onPinCard
}: AddWidgetsSheetNextProps) {
  const [category, setCategory] = useState<AddCategory>('widgets');
  const [query, setQuery] = useState('');
  const [targetSection, setTargetSection] = useState<string>('');

  const resolvedEntities = useAutoLayoutStore((s) => s.resolvedEntities);
  const resolvedAreas = useAutoLayoutStore((s) => s.resolvedAreas);

  const defaultTarget = useMemo(() => {
    if (targetSection && sections.some((s) => s.id === targetSection)) return targetSection;
    const custom = sections.find((s) => s.id.startsWith('custom:'));
    return custom?.id ?? sections[0]?.id ?? 'rooms';
  }, [targetSection, sections]);

  const pinnedSet = useMemo(() => new Set(pinnedIds), [pinnedIds]);
  const q = query.trim().toLowerCase();

  const groups = useMemo(
    () =>
      DEFAULT_OVERVIEW_SECTION_ORDER.map((section) => ({
        section,
        items: widgets.filter((w) => w.section === section)
      })).filter((g) => g.items.length > 0),
    [widgets]
  );

  const entityList = useMemo(() => {
    const all = Object.values(resolvedEntities).filter((e) => !e.hidden && ENTITY_DOMAINS.has(e.domain));
    const filtered = q
      ? all.filter((e) => `${e.name} ${e.entity_id}`.toLowerCase().includes(q))
      : all;
    return filtered.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 60);
  }, [resolvedEntities, q]);

  const sceneList = useMemo(() => {
    const all = Object.values(resolvedEntities).filter((e) => !e.hidden && (e.domain === 'scene' || e.domain === 'script' || e.domain === 'button'));
    const filtered = q ? all.filter((e) => `${e.name} ${e.entity_id}`.toLowerCase().includes(q)) : all;
    return filtered.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 60);
  }, [resolvedEntities, q]);

  const cameraList = useMemo(() => {
    const all = Object.values(resolvedEntities).filter((e) => !e.hidden && e.domain === 'camera');
    const filtered = q ? all.filter((e) => `${e.name} ${e.entity_id}`.toLowerCase().includes(q)) : all;
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [resolvedEntities, q]);

  const areaList = useMemo(() => {
    const filtered = q ? resolvedAreas.filter((a) => `${a.name} ${a.area_id}`.toLowerCase().includes(q)) : resolvedAreas;
    return filtered.slice(0, 60);
  }, [resolvedAreas, q]);

  const targetTitle = sections.find((s) => s.id === defaultTarget)?.title ?? 'Overview';

  const renderPinRow = (cardId: string, label: string, sub: string, icon: typeof PlusSignIcon) => {
    const added = pinnedSet.has(cardId);
    return (
      <li key={cardId} className="flex items-center gap-3 rounded-xl bg-default/40 px-3 py-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
          <HugeiconsIcon icon={icon} size={16} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{label}</span>
          <span className="truncate text-[11px] text-muted">{sub}</span>
        </span>
        {added ? (
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-success" />
            Pinned
          </span>
        ) : (
          <Button
            size="sm"
            variant="tertiary"
            className="pro-touch-44 shrink-0"
            isDisabled={!onPinCard}
            aria-label={`Pin ${label}`}
            onPress={() => onPinCard?.(cardId, defaultTarget)}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={14} />
            Pin
          </Button>
        )}
      </li>
    );
  };

  return (
    <ProSheet isOpen={isOpen} onOpenChange={onOpenChange} title="Add to Overview" subtitle={`${hidden.length} hidden widgets · ${pinnedIds.length} pinned cards`} icon={PlusSignIcon} page="overview" size="lg">
      <div className="flex flex-col gap-4">
        <SheetFilter
          label="Category"
          value={category}
          onChange={setCategory}
          options={[
            { id: 'widgets', label: 'Widgets' },
            { id: 'entities', label: 'Entities' },
            { id: 'rooms', label: 'Rooms' },
            { id: 'scenes', label: 'Scenes & Scripts' },
            { id: 'cameras', label: 'Cameras' }
          ]}
        />

        {category !== 'widgets' ? (
          <div className="flex flex-wrap items-center gap-2">
            <TextField aria-label="Search items" value={query} onChange={setQuery} className="min-w-[180px] flex-1">
              <InputGroup fullWidth variant="secondary">
                <InputGroup.Prefix>
                  <HugeiconsIcon icon={Search01Icon} size={15} className="text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input placeholder="Filter by name or entity ID…" />
              </InputGroup>
            </TextField>
            {sections.length > 0 ? (
              <Dropdown>
                <Button size="sm" variant="secondary" className="h-10 gap-1.5 text-xs">
                  <span>Section: {targetTitle}</span>
                  <HugeiconsIcon icon={ArrowDown01Icon} size={13} />
                </Button>
                <Dropdown.Popover placement="bottom end" className="max-h-[50dvh] min-w-48 overflow-y-auto">
                  <Dropdown.Menu aria-label="Target section" onAction={(key) => setTargetSection(String(key))}>
                    {sections.map((s) => (
                      <Dropdown.Item key={s.id} id={s.id} textValue={s.title}>
                        <Label>{s.title}</Label>
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown.Popover>
              </Dropdown>
            ) : null}
          </div>
        ) : null}

        {category === 'widgets' ? (
          groups.map(({ section, items }) => (
            <section key={section} aria-label={OVERVIEW_SECTION_LABELS[section]} className="flex flex-col gap-1.5">
              <h3 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">{OVERVIEW_SECTION_LABELS[section]}</h3>
              <ul className="flex flex-col gap-1.5">
                {items.map((w) => {
                  const isHidden = hidden.includes(w.id);
                  return (
                    <li key={w.id} className="flex items-center gap-3 rounded-xl bg-default/40 px-3 py-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                        <HugeiconsIcon icon={w.icon} size={16} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{w.title}</span>
                      {isHidden ? (
                        <Button size="sm" variant="tertiary" className="pro-touch-44" aria-label={`Add ${w.title}`} onPress={() => onAdd(w)}>
                          <HugeiconsIcon icon={PlusSignIcon} size={14} />
                          Add
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} className="text-success" />
                          On the page
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        ) : category === 'entities' ? (
          <ul className="flex flex-col gap-1.5">
            {entityList.map((e) => renderPinRow(`entity:${e.entity_id}`, e.name || e.entity_id, e.entity_id, Layers01Icon))}
            {entityList.length === 0 ? <li className="py-6 text-center text-xs text-muted">No matching entities.</li> : null}
          </ul>
        ) : category === 'rooms' ? (
          <ul className="flex flex-col gap-1.5">
            {areaList.map((a) => renderPinRow(`room:${a.area_id}`, a.name, `${a.entities?.length ?? 0} entities`, Home01Icon))}
            {areaList.length === 0 ? <li className="py-6 text-center text-xs text-muted">No matching rooms.</li> : null}
          </ul>
        ) : category === 'scenes' ? (
          <ul className="flex flex-col gap-1.5">
            {sceneList.map((s) =>
              renderPinRow(`${s.domain === 'script' ? 'script' : 'scene'}:${s.entity_id}`, s.name || s.entity_id, s.entity_id, MagicWand01Icon)
            )}
            {sceneList.length === 0 ? <li className="py-6 text-center text-xs text-muted">No matching scenes or scripts.</li> : null}
          </ul>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {cameraList.map((c) => renderPinRow(`camera:${c.entity_id}`, c.name || c.entity_id, c.entity_id, Camera01Icon))}
            {cameraList.length === 0 ? <li className="py-6 text-center text-xs text-muted">No matching cameras.</li> : null}
          </ul>
        )}
      </div>
    </ProSheet>
  );
}
