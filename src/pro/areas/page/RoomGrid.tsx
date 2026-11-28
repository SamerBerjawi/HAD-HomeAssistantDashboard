/**
 * One grid of Area tiles (batch 6 + Phase 2 TouchSensor, Edit Tile, & Move-to-Section).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { closestCenter, DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { Button, Dropdown, Header, Label } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  DragDropVerticalIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilEdit01Icon,
  PinIcon,
  PinOffIcon,
  Tick02Icon,
  ViewOffSlashIcon
} from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { cn } from '@/lib/utils';
import { TILE_SIZE_LABEL, TILE_SIZES, type TileSize } from '../tileTypes';
import type { SectionId } from './roomLayout';

export const SPAN: Record<TileSize, string> = { xs: 'col-span-1 row-span-1', s: 'col-span-1 row-span-2', w: 'col-span-2 row-span-2', t: 'col-span-1 row-span-4', l: 'col-span-2 row-span-4' };
const CELLS: Record<TileSize, string> = { xs: '1×½', s: '1×1', w: '2×1', t: '1×2', l: '2×2' };
export const GRID = 'grid grid-flow-dense grid-cols-2 gap-3 @2xl:grid-cols-4 @5xl:grid-cols-6';

export interface GridEditing {
  name: (key: string) => string;
  onMoveOnto: (key: string, over: string) => void;
  onMoveBy: (key: string, dir: -1 | 1) => void;
  onSize: (key: string, size: TileSize) => void;
  onHide: (key: string) => void;
  /** Concept C only: pin to the top. */
  pinned?: (key: string) => boolean;
  onPin?: (key: string) => void;
  /** Phase 2.3/2.4: Move tile across sections and open per-tile Editor sheet. */
  sections?: readonly { id: SectionId; title: string }[];
  currentSection?: SectionId;
  onMoveToSection?: (key: string, target: SectionId) => void;
  onEditTile?: (key: string) => void;
  hasVisibilityRules?: (key: string) => boolean;
  onEditVisibility?: (key: string) => void;
}

interface RoomGridProps {
  keys: string[];
  sizeOf: (key: string) => TileSize;
  renderTile: (key: string, size: TileSize) => ReactNode;
  /** Present while editing. */
  editing?: GridEditing;
  className?: string;
}

export function RoomGrid({ keys, sizeOf, renderTile, editing, className }: RoomGridProps) {
  if (!editing) {
    return (
      <ul className={cn(GRID, className)} style={{ gridAutoRows: '68px' }}>
        {keys.map((k) => (
          <li key={k} className={cn(SPAN[sizeOf(k)], 'min-h-0 min-w-0')}>
            {renderTile(k, sizeOf(k))}
          </li>
        ))}
      </ul>
    );
  }
  return <EditGrid keys={keys} sizeOf={sizeOf} renderTile={renderTile} editing={editing} className={className} />;
}

function EditGrid({ keys, sizeOf, renderTile, editing, className }: RoomGridProps & { editing: GridEditing }) {
  const { setDragActive } = useUserConfig();
  const [active, setActive] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  useEffect(() => () => setDragActive?.(false), [setDragActive]);
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => {
        setActive(String(e.active.id));
        setDragActive?.(true);
      }}
      onDragOver={(e) => e.over && e.active.id !== e.over.id && editing.onMoveOnto(String(e.active.id), String(e.over.id))}
      onDragEnd={() => {
        setActive(null);
        setDragActive?.(false);
      }}
      onDragCancel={() => {
        setActive(null);
        setDragActive?.(false);
      }}
      accessibility={{ screenReaderInstructions: { draggable: 'To move a tile, press Space, use the arrow keys, then press Space again to drop it. Escape cancels.' } }}
    >
      {/* No sorting strategy: the grid reflows for real as the order changes, so tiles of different sizes never overlap. */}
      <SortableContext items={keys} strategy={() => null}>
        <ul className={cn(GRID, className)} style={{ gridAutoRows: '68px' }}>
          {keys.map((k, i) => (
            <EditCell key={k} id={k} size={sizeOf(k)} first={i === 0} last={i === keys.length - 1} editing={editing} dragging={active === k}>
              {renderTile(k, sizeOf(k))}
            </EditCell>
          ))}
        </ul>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' }}>
        {active ? <div className="h-full w-full scale-[1.03] rounded-[26px] opacity-95 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)]">{renderTile(active, sizeOf(active))}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}

function EditCell({ id, size, first, last, editing, dragging, children }: { id: string; size: TileSize; first: boolean; last: boolean; editing: GridEditing; dragging: boolean; children: ReactNode }) {
  const { setNodeRef, attributes, listeners } = useSortable({ id });
  const name = editing.name(id);
  const hasRules = editing.hasVisibilityRules?.(id) ?? false;
  return (
    <li ref={setNodeRef} className={cn(SPAN[size], 'relative min-h-0 min-w-0', dragging && 'opacity-30')}>
      <div inert className="h-full w-full opacity-90 saturate-[.85]">
        {children}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-[26px] ring-2 ring-inset ring-[color-mix(in_srgb,var(--accent)_55%,transparent)] [background:color-mix(in_srgb,var(--accent)_6%,transparent)]" />
      {hasRules ? (
        <span className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-full bg-[var(--surface)]/90 px-2 py-0.5 text-[10px] font-medium text-[var(--accent)] shadow-sm">
          Rule
        </span>
      ) : null}
      <div className="absolute -inset-x-2 -top-2 z-10 flex items-center justify-between">
        <span
          {...attributes}
          {...listeners}
          aria-label={`Move ${name}`}
          className="grid size-8 cursor-grab touch-none place-items-center rounded-full bg-[var(--surface)] shadow-md ring-1 ring-black/10 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] active:cursor-grabbing dark:ring-white/10"
        >
          <HugeiconsIcon icon={DragDropVerticalIcon} size={16} />
        </span>
        <TileEditMenu id={id} name={name} size={size} first={first} last={last} editing={editing} />
      </div>
    </li>
  );
}

function TileEditMenu({ id, name, size, first, last, editing }: { id: string; name: string; size: TileSize; first: boolean; last: boolean; editing: GridEditing }) {
  const pinned = editing.pinned?.(id) ?? false;
  const hasRules = editing.hasVisibilityRules?.(id) ?? false;
  const otherSections = (editing.sections ?? []).filter((s) => s.id !== editing.currentSection);
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="secondary" aria-label={`Edit ${name}: ${TILE_SIZE_LABEL[size]}`} className="size-8 min-w-0 rounded-full bg-[var(--surface)] shadow-md ring-1 ring-black/10 dark:ring-white/10">
        <HugeiconsIcon icon={MoreHorizontalIcon} size={17} />
      </Button>
      <Dropdown.Popover placement="bottom end" className="max-h-[65dvh] overflow-y-auto">
        <Dropdown.Menu
          aria-label={`Edit ${name}`}
          onAction={(key) => {
            const k = String(key);
            if (k.startsWith('size:')) editing.onSize(id, k.slice(5) as TileSize);
            else if (k.startsWith('move:')) editing.onMoveToSection?.(id, k.slice(5) as SectionId);
            else if (k === 'editTile') editing.onEditTile?.(id);
            else if (k === 'visibility') editing.onEditVisibility?.(id);
            else if (k === 'earlier') editing.onMoveBy(id, -1);
            else if (k === 'later') editing.onMoveBy(id, 1);
            else if (k === 'pin') editing.onPin?.(id);
            else if (k === 'hide') editing.onHide(id);
          }}
        >
          <Dropdown.Section>
            <Header>Size</Header>
            {TILE_SIZES.map((s) => (
              <Dropdown.Item key={s} id={`size:${s}`} textValue={s === size ? `${TILE_SIZE_LABEL[s]}, current size` : TILE_SIZE_LABEL[s]}>
                <HugeiconsIcon icon={Tick02Icon} size={16} className={s === size ? 'shrink-0 text-[var(--accent)]' : 'invisible shrink-0'} aria-hidden="true" />
                <Label>{TILE_SIZE_LABEL[s]}</Label>
                <span className="ml-auto pl-4 text-xs text-muted">{CELLS[s]}</span>
              </Dropdown.Item>
            ))}
          </Dropdown.Section>
          <Dropdown.Section>
            <Header>Arrange</Header>
            <Dropdown.Item id="earlier" textValue="Move earlier" isDisabled={first}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="shrink-0" />
              <Label>Move earlier</Label>
            </Dropdown.Item>
            <Dropdown.Item id="later" textValue="Move later" isDisabled={last}>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="shrink-0" />
              <Label>Move later</Label>
            </Dropdown.Item>
            {editing.onEditTile ? (
              <Dropdown.Item id="editTile" textValue="Edit tile">
                <HugeiconsIcon icon={PencilEdit01Icon} size={16} className="shrink-0" />
                <Label>Edit tile…</Label>
              </Dropdown.Item>
            ) : null}
            {editing.onEditVisibility ? (
              <Dropdown.Item id="visibility" textValue="Visibility rules">
                <HugeiconsIcon icon={EyeIcon} size={16} className={hasRules ? 'shrink-0 text-[var(--accent)]' : 'shrink-0'} />
                <Label>{hasRules ? 'Visibility rules (active)…' : 'Visibility rules…'}</Label>
              </Dropdown.Item>
            ) : null}
            {editing.onPin ? (
              <Dropdown.Item id="pin" textValue={pinned ? 'Unpin' : 'Pin to the top'}>
                <HugeiconsIcon icon={pinned ? PinOffIcon : PinIcon} size={16} className="shrink-0" />
                <Label>{pinned ? 'Unpin' : 'Pin to the top'}</Label>
              </Dropdown.Item>
            ) : null}
            <Dropdown.Item id="hide" textValue="Hide">
              <HugeiconsIcon icon={ViewOffSlashIcon} size={16} className="shrink-0" />
              <Label>Hide</Label>
            </Dropdown.Item>
          </Dropdown.Section>
          {editing.onMoveToSection && otherSections.length > 0 ? (
            <Dropdown.Section>
              <Header>Move to section</Header>
              {otherSections.map((sec) => (
                <Dropdown.Item key={sec.id} id={`move:${sec.id}`} textValue={`Move to ${sec.title}`}>
                  <Label>{sec.title}</Label>
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          ) : null}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
