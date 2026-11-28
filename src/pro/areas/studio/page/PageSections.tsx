/**
 * Page concept A · "Sections" (batch 6): a slim header (the way back, previous / next room, the
 * name, the room's facts, Customize), then the tiles in sections by kind, in a fixed order you can
 * change. Each section heading says where it stands ("3 of 6 on", "Window open") and offers the
 * one thing worth doing to all of it (Lights: All off). Sections collapse.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { SECTION_TITLE, toggleCollapsed, visibleSections } from '../../page/roomLayout';
import { sectionSummary } from '../../page/roomSummary';
import { RoomGrid } from '../../page/RoomGrid';
import { EmptyRoom, HiddenTray, RoomEditBar } from '../../page/RoomEditParts';
import { useRoomEditor } from '../../page/useRoomEditor';
import { Facts, gridEditing, nameOf, lightsOff, RoomNav, SectionHeading, type PageProps } from '../../page/pageKit';

export default function PageSections(props: PageProps) {
  const { room, device, model, renderTile } = props;
  const editor = useRoomEditor(room.items, device);
  const l = editor.layout;
  const sections = visibleSections(l);
  const all = room.items.map((it) => model(it.key));
  const phone = device === 'phone';
  return (
    <div className={cn(phone ? 'px-4 pb-6 pt-3' : 'px-6 pb-8 pt-4')}>
      <header className={cn('flex flex-col', phone ? 'mb-5 gap-1' : 'mb-7 gap-1.5')}>
        <RoomNav room={room} rooms={props.rooms} onRoom={props.onRoom} />
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className={cn('font-semibold tracking-[-0.02em]', phone ? 'text-[28px]' : 'text-[34px]')}>{room.name}</h1>
            <Facts models={all} className="mt-1" />
          </div>
          {room.items.length ? <RoomEditBar editor={editor} device={device} compact={phone && !editor.editing} /> : null}
        </div>
      </header>
      {!room.items.length ? <EmptyRoom room={room.name} /> : null}
      <HiddenTray editor={editor} name={nameOf(props)} />
      {sections.map((s, i) => {
        const models = s.keys.map(model);
        const collapsed = l.collapsed.includes(s.id) && !editor.editing;
        const anyOn = s.id === 'lights' && models.some((m) => m.isOn && m.available);
        return (
          <section key={s.id} aria-label={SECTION_TITLE[s.id]} className="mb-6">
            <SectionHeading
              id={s.id}
              title={SECTION_TITLE[s.id]}
              summary={sectionSummary(s.id, models)}
              editor={editor}
              index={i}
              count={sections.length}
              action={
                <span className="flex items-center gap-1">
                  {anyOn ? (
                    <Button size="sm" variant="secondary" onPress={() => lightsOff(props, s.keys)} className="h-8 rounded-full px-3 text-xs">
                      All off
                    </Button>
                  ) : null}
                  <Button isIconOnly size="sm" variant="ghost" aria-label={`${collapsed ? 'Show' : 'Fold'} ${SECTION_TITLE[s.id]}`} aria-expanded={!collapsed} onPress={() => editor.commit((x) => toggleCollapsed(x, s.id))} className="size-8 min-w-0 rounded-full">
                    <HugeiconsIcon icon={collapsed ? ArrowRight01Icon : ArrowDown01Icon} size={16} />
                  </Button>
                </span>
              }
            />
            {collapsed ? null : <RoomGrid keys={s.keys} sizeOf={(k) => l.sizes[k]} renderTile={renderTile} editing={editor.editing ? gridEditing(editor, nameOf(props)) : undefined} />}
          </section>
        );
      })}
    </div>
  );
}
