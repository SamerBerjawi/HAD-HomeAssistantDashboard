/**
 * Page concept B · "Rail" (batch 6 + Phase 0 + Phase 2.3/2.4 custom sections & editable Rail).
 */
import { useRef, useState, type ReactNode } from 'react';
import { Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Home01Icon,
  PencilEdit01Icon,
  PlusSignIcon,
  ViewIcon,
  ViewOffSlashIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { evaluateVisibility, type VisibilityDevice } from '../../lib/visibilityRules';
import type { ReadingTileModel } from '../tileTypes';
import {
  applyRailOrder,
  deleteRoomSection,
  editableRoomSections,
  hide,
  isCustomRoomSection,
  reorderRailList,
  roomSectionTitle,
  show,
  visibleSections,
  type SectionId
} from './roomLayout';
import { sectionSummary } from './roomSummary';
import { RoomGrid } from './RoomGrid';
import { EmptyRoom, HiddenTray, RoomEditBar } from './RoomEditParts';
import type { RoomEditor } from './useRoomEditor';
import { Facts, gridEditing, nameOf, lightsOff, RoomNav, SectionHeading, type PageProps } from './pageKit';
import { itemActive, NowBody, PinnedSection, RoomSentence } from './PageNow';

export type RoomView = 'all' | 'now';

interface RailProps extends PageProps {
  editor: RoomEditor;
  views?: boolean;
  view?: RoomView;
  onView?: (v: RoomView) => void;
  inset?: boolean;
  editExtras?: ReactNode;
  editPanel?: ReactNode;
  hideEditBar?: boolean;
  onEditTile?: (key: string) => void;
  onOpenEntities?: () => void;
  onAddSection?: () => void;
  onRenameSection?: (id: SectionId) => void;
  onEditSectionVisibility?: (id: SectionId) => void;
  onEditTileVisibility?: (key: string) => void;
  visibilityCtx?: {
    entities: Record<string, { state?: string } | undefined>;
    device: VisibilityDevice;
    user: { id: string; isAdmin: boolean } | null;
  };
}

export default function PageRail({
  views = false,
  editor,
  view: viewProp,
  onView,
  inset = true,
  editExtras,
  editPanel,
  hideEditBar = false,
  onEditTile,
  onOpenEntities,
  onAddSection,
  onRenameSection,
  onEditSectionVisibility,
  onEditTileVisibility,
  visibilityCtx,
  ...props
}: RailProps) {
  const { room, device, model, renderTile } = props;
  const [ownView, setOwnView] = useState<RoomView>('all');
  const view = viewProp ?? ownView;
  const setView = (v: RoomView) => (onView ? onView(v) : setOwnView(v));
  const showNow = views && view === 'now' && !editor.editing;
  const l = editor.layout;
  const root = useRef<HTMLDivElement>(null);
  const phone = device === 'phone';
  const all = room.items.map((it) => model(it.key));
  const isRail = (k: string) => {
    const m = model(k);
    return m.kind === 'scene' || m.kind === 'reading';
  };

  const itemByKey = new Map(room.items.map((it) => [it.key, it]));
  const keyIsActive = (k: string) => {
    const it = itemByKey.get(k);
    return it ? itemActive(it, model(k)) : false;
  };

  const baseList = editor.editing ? editableRoomSections(l) : visibleSections(l);
  const sections = baseList
    .map((s) => {
      let keys = s.keys.filter((k) => !isRail(k));
      if (!editor.editing && visibilityCtx && l.cardRules) {
        keys = keys.filter((k) =>
          evaluateVisibility(l.cardRules?.[k], {
            ...visibilityCtx,
            isActive: keyIsActive(k)
          })
        );
      }
      return { ...s, keys };
    })
    .filter((s) => {
      if (editor.editing) return s.keys.length > 0 || isCustomRoomSection(l, s.id);
      if (s.keys.length === 0) return false;
      if (visibilityCtx && l.sectionRules?.[s.id]) {
        return evaluateVisibility(l.sectionRules[s.id], {
          ...visibilityCtx,
          isActive: s.keys.some(keyIsActive)
        });
      }
      return true;
    });

  const sectionChoices = sections.map((s) => ({ id: s.id, title: roomSectionTitle(l, s.id) }));

  const rawSceneKeys = room.items.filter((it) => model(it.key).kind === 'scene').map((it) => it.key);
  const rawReadingKeys = room.items.filter((it) => model(it.key).kind === 'reading').map((it) => it.key);
  const orderedAllScenes = applyRailOrder(rawSceneKeys, l.railScenesOrder);
  const orderedAllReadings = applyRailOrder(rawReadingKeys, l.railReadingsOrder);
  const scenes = orderedAllScenes.filter((k) => !l.hidden.includes(k));
  const readings = orderedAllReadings.filter((k) => !l.hidden.includes(k));

  const nowCount = room.items.filter((it) => !isRail(it.key) && !l.hidden.includes(it.key) && itemActive(it, model(it.key))).length;
  const switcher =
    views && room.items.length && !editor.editing ? (
      <ToggleButtonGroup aria-label="View" size="sm" selectionMode="single" disallowEmptySelection selectedKeys={new Set([view])} onSelectionChange={(k) => setView([...k][0] as RoomView)} className="shrink-0">
        <ToggleButton id="all" className="text-xs">
          All
        </ToggleButton>
        <ToggleButton id="now" className="text-xs">
          Now{nowCount ? ` · ${nowCount}` : ''}
        </ToggleButton>
      </ToggleButtonGroup>
    ) : null;
  const jump = (id: SectionId) => root.current?.querySelector(`[data-section="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const picture = (
    <div aria-hidden className={cn('grid place-items-center overflow-hidden rounded-[22px] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent)]', phone ? 'h-24' : 'aspect-[4/3]')} style={room.photo ? { backgroundImage: room.photo, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
      {room.photo ? null : <HugeiconsIcon icon={Home01Icon} size={28} />}
    </div>
  );
  const index = sections.length > 1 && !showNow ? (
    <nav aria-label="Sections" className={cn(phone ? 'flex gap-1.5 overflow-x-auto [scrollbar-width:none]' : 'flex flex-col gap-0.5')}>
      {sections.map((s) => (
        <Button key={s.id} size="sm" variant={phone ? 'secondary' : 'ghost'} onPress={() => jump(s.id)} className={cn(phone ? 'h-8 shrink-0 rounded-full px-3 text-xs' : 'h-9 justify-between rounded-xl px-3 text-[13px]')}>
          <span>{roomSectionTitle(l, s.id)}</span>
          {phone ? null : <span className="text-xs font-normal text-muted">{sectionSummary(s.id, s.keys.map(model)) || s.keys.length}</span>}
        </Button>
      ))}
    </nav>
  ) : null;

  const tileLabel = nameOf(props);

  const editRailCard = editor.editing && (orderedAllScenes.length > 0 || orderedAllReadings.length > 0) ? (
    <section aria-label="Scenes and readings in rail" className="pro-surface mb-5 flex flex-col gap-3 rounded-2xl p-3">
      {orderedAllScenes.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-muted">Scenes order &amp; visibility</p>
          {orderedAllScenes.map((k, idx) => {
            const isHidden = l.hidden.includes(k);
            return (
              <div key={k} className="flex items-center gap-1.5 rounded-xl bg-default/40 px-2.5 py-1.5 text-xs">
                <span className={cn('min-w-0 flex-1 truncate font-medium', isHidden && 'text-muted line-through')}>{tileLabel(k)}</span>
                <Button isIconOnly size="sm" variant="ghost" isDisabled={idx === 0} aria-label={`Move ${tileLabel(k)} up`} onPress={() => editor.update((x) => ({ ...x, railScenesOrder: reorderRailList(rawSceneKeys, x.railScenesOrder, k, -1) }))} className="size-7 min-w-0">
                  <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
                </Button>
                <Button isIconOnly size="sm" variant="ghost" isDisabled={idx === orderedAllScenes.length - 1} aria-label={`Move ${tileLabel(k)} down`} onPress={() => editor.update((x) => ({ ...x, railScenesOrder: reorderRailList(rawSceneKeys, x.railScenesOrder, k, 1) }))} className="size-7 min-w-0">
                  <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                </Button>
                {onEditTile ? (
                  <Button isIconOnly size="sm" variant="ghost" aria-label={`Edit ${tileLabel(k)}`} onPress={() => onEditTile(k)} className="size-7 min-w-0">
                    <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                  </Button>
                ) : null}
                <Button isIconOnly size="sm" variant="ghost" aria-label={isHidden ? `Show ${tileLabel(k)}` : `Hide ${tileLabel(k)}`} onPress={() => editor.update((x) => (isHidden ? show(x, k) : hide(x, k)))} className="size-7 min-w-0">
                  <HugeiconsIcon icon={isHidden ? ViewIcon : ViewOffSlashIcon} size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}
      {orderedAllReadings.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-muted">Readings order &amp; visibility</p>
          {orderedAllReadings.map((k, idx) => {
            const isHidden = l.hidden.includes(k);
            return (
              <div key={k} className="flex items-center gap-1.5 rounded-xl bg-default/40 px-2.5 py-1.5 text-xs">
                <span className={cn('min-w-0 flex-1 truncate font-medium', isHidden && 'text-muted line-through')}>{tileLabel(k)}</span>
                <Button isIconOnly size="sm" variant="ghost" isDisabled={idx === 0} aria-label={`Move ${tileLabel(k)} up`} onPress={() => editor.update((x) => ({ ...x, railReadingsOrder: reorderRailList(rawReadingKeys, x.railReadingsOrder, k, -1) }))} className="size-7 min-w-0">
                  <HugeiconsIcon icon={ArrowUp01Icon} size={14} />
                </Button>
                <Button isIconOnly size="sm" variant="ghost" isDisabled={idx === orderedAllReadings.length - 1} aria-label={`Move ${tileLabel(k)} down`} onPress={() => editor.update((x) => ({ ...x, railReadingsOrder: reorderRailList(rawReadingKeys, x.railReadingsOrder, k, 1) }))} className="size-7 min-w-0">
                  <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                </Button>
                {onEditTile ? (
                  <Button isIconOnly size="sm" variant="ghost" aria-label={`Edit ${tileLabel(k)}`} onPress={() => onEditTile(k)} className="size-7 min-w-0">
                    <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
                  </Button>
                ) : null}
                <Button isIconOnly size="sm" variant="ghost" aria-label={isHidden ? `Show ${tileLabel(k)}` : `Hide ${tileLabel(k)}`} onPress={() => editor.update((x) => (isHidden ? show(x, k) : hide(x, k)))} className="size-7 min-w-0">
                  <HugeiconsIcon icon={isHidden ? ViewIcon : ViewOffSlashIcon} size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  ) : null;

  // Its own container: the columns follow the grid's width, not the page's (the rail takes some).
  const grid = (
    <div className="@container min-w-0 flex-1">
      {!room.items.length ? <EmptyRoom room={room.name} href={room.haUrl} /> : null}
      {room.items.length && !sections.length && !editor.editing ? <p className="px-1 py-6 text-sm text-muted">Only readings here: they're all on the {phone ? 'top' : 'left'}.</p> : null}
      {editor.editing && editPanel ? <div className="mb-4">{editPanel}</div> : null}
      {editor.editing && (onAddSection || onOpenEntities) ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {onAddSection ? (
            <Button size="sm" variant="secondary" onPress={onAddSection} className="h-8 gap-1.5 rounded-full px-3 text-xs">
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
              New section
            </Button>
          ) : null}
          {onOpenEntities ? (
            <Button size="sm" variant="secondary" onPress={onOpenEntities} className="h-8 gap-1.5 rounded-full px-3 text-xs">
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
              Add / manage entities
            </Button>
          ) : null}
        </div>
      ) : null}
      <HiddenTray editor={editor} name={tileLabel} />
      {editor.editing && editExtras ? <div className="mb-5">{editExtras}</div> : null}
      {editRailCard}
      {views && editor.editing ? <PinnedSection props={props} editor={editor} /> : null}
      {sections.map((s, i) => {
        const models = s.keys.map(model);
        const anyOn = s.id === 'lights' && models.some((m) => m.isOn && m.available);
        const secTitle = roomSectionTitle(l, s.id);
        const customSec = isCustomRoomSection(l, s.id);
        return (
          <section key={s.id} data-section={s.id} aria-label={secTitle} className={cn('mb-6', phone ? 'scroll-mt-14' : 'scroll-mt-4')}>
            <SectionHeading
              id={s.id}
              title={secTitle}
              summary={sectionSummary(s.id, models)}
              editor={editor}
              index={i}
              count={sections.length}
              isCustom={customSec}
              hasVisibilityRules={Boolean(l.sectionRules?.[s.id]?.length)}
              onEditVisibility={onEditSectionVisibility ? () => onEditSectionVisibility(s.id) : undefined}
              onRename={customSec && onRenameSection ? () => onRenameSection(s.id) : undefined}
              onDelete={customSec ? () => editor.update((x) => deleteRoomSection(x, s.id, room.items)) : undefined}
              action={
                anyOn ? (
                  <Button size="sm" variant="secondary" onPress={() => lightsOff(props, s.keys)} className="h-8 rounded-full px-3 text-xs">
                    All off
                  </Button>
                ) : undefined
              }
            />
            {s.keys.length === 0 && editor.editing ? (
              <div className="flex min-h-20 items-center justify-center rounded-2xl border border-dashed border-[color-mix(in_srgb,currentColor_18%,transparent)] p-4 text-center text-xs text-muted">
                Empty section — open any tile’s “⋯” menu and choose Move to section.
              </div>
            ) : (
              <RoomGrid
                keys={s.keys}
                sizeOf={(k) => l.sizes[k]}
                renderTile={renderTile}
                editing={
                  editor.editing
                    ? gridEditing(editor, tileLabel, views, {
                        items: room.items,
                        sections: sectionChoices,
                        currentSection: s.id,
                        onEditTile,
                        hasVisibilityRules: (k) => Boolean(l.cardRules?.[k]?.length),
                        onEditVisibility: onEditTileVisibility
                      })
                    : undefined
                }
              />
            )}
          </section>
        );
      })}
    </div>
  );

  const now = (
    <div className="@container min-w-0 flex-1">
      <RoomSentence models={all} phone={phone} className="mb-5 px-1" />
      <NowBody props={props} editor={editor} skip={isRail} />
    </div>
  );
  const content = showNow ? now : grid;

  if (phone) {
    const values = readings.map(model).filter((m): m is ReadingTileModel => m.kind === 'reading' && m.available && m.value !== null);
    return (
      <div ref={root} className={cn(inset ? 'px-4 pb-6 pt-3' : 'pb-6')}>
        <RoomNav room={room} rooms={props.rooms} onRoom={props.onRoom} onBack={props.onBack} right={room.items.length && !hideEditBar ? <RoomEditBar editor={editor} device={device} compact={!editor.editing} /> : null} />
        <header className="mb-4 mt-1 flex items-center gap-3">
          <div className="w-24 shrink-0">{picture}</div>
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.02em]">{room.name}</h1>
            {values.length ? (
              <p className="mt-1 flex flex-wrap gap-x-3 text-sm tabular-nums text-muted">
                {values.map((v) => (
                  <span key={v.entityId}>
                    {v.unit === '%' || v.unit === '°C' ? Math.round(v.value! * 10) / 10 : Math.round(v.value!)}
                    {v.unit === '°C' ? '°' : ` ${v.unit}`.replace(' %', '%')}
                  </span>
                ))}
              </p>
            ) : (
              <Facts models={all} className="mt-1" />
            )}
          </div>
        </header>
        {editor.editing && room.items.length && !hideEditBar ? <div className="mb-3">{<RoomEditBar editor={editor} device={device} />}</div> : null}
        {scenes.length ? (
          <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" style={{ height: 76 }}>
            {scenes.map((k) => (
              <div key={k} className="h-[68px] w-[150px] shrink-0">
                {renderTile(k, 'xs')}
              </div>
            ))}
          </div>
        ) : null}
        {index || switcher ? (
          <div className="sticky top-0 z-10 -mx-4 mb-3 flex items-center gap-2 bg-[var(--background)]/85 px-4 py-2 backdrop-blur-md">
            {switcher}
            {index ? <div className="min-w-0 flex-1">{index}</div> : null}
          </div>
        ) : null}
        {content}
      </div>
    );
  }

  return (
    <div ref={root} className={cn('flex items-start gap-6', inset ? 'px-6 pb-8 pt-4' : 'pb-8')}>
      <aside aria-label={room.name} className="sticky top-4 flex max-h-[calc(100vh-2rem)] w-[248px] shrink-0 flex-col gap-4 overflow-y-auto [scrollbar-width:thin] [&>*]:shrink-0">
        <RoomNav room={room} rooms={props.rooms} onRoom={props.onRoom} onBack={props.onBack} />
        {picture}
        <div>
          <h1 className="text-[30px] font-semibold leading-tight tracking-[-0.02em]">{room.name}</h1>
          <Facts models={all} className="mt-1.5" />
        </div>
        {room.items.length && !hideEditBar ? <RoomEditBar editor={editor} device={device} /> : null}
        {scenes.length ? <RailGroup title="Scenes" keys={scenes} renderTile={renderTile} /> : null}
        {readings.length ? <RailGroup title="Readings" keys={readings} renderTile={renderTile} /> : null}
        {index ? (
          <div>
            <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-muted">On this page</p>
            {index}
          </div>
        ) : null}
      </aside>
      {views ? (
        <div className="flex min-w-0 flex-1 flex-col">
          {switcher ? <div className="mb-4">{switcher}</div> : null}
          {content}
        </div>
      ) : (
        grid
      )}
    </div>
  );
}

function RailGroup({ title, keys, renderTile }: { title: string; keys: string[]; renderTile: PageProps['renderTile'] }) {
  return (
    <section aria-label={title}>
      <p className="mb-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      <ul className="grid grid-cols-1 gap-2" style={{ gridAutoRows: '68px' }}>
        {keys.map((k) => (
          <li key={k} className="min-w-0">
            {renderTile(k, 'xs')}
          </li>
        ))}
      </ul>
    </section>
  );
}
