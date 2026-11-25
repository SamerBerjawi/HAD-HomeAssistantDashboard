/**
 * Page concept B · "Rail" (batch 6), and with `views` the owner's "B + C" (2026-11-21): the same
 * frame with a switch between two views of the room, All (the sections) and Now (C's body: what is
 * on or needs a look, pinned tiles, everything else folded). One layout serves both.
 *
 * Rail: the room's own things leave the grid. Tablet and desktop: a
 * sticky rail on the left holds the room (picture, name, facts), its scenes and its readings as
 * X-small tiles, and an index of the sections; the grid on the right is only what you control and
 * watch. Phone: the rail becomes the header (readings as a line of values, scenes in a row you
 * swipe) and the section index a bar of chips that sticks to the top while you scroll.
 */
import { useRef, useState, type ReactNode } from 'react';
import { Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Home01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ReadingTileModel } from '../tileTypes';
import { SECTION_TITLE, visibleSections, type SectionId } from './roomLayout';
import { sectionSummary } from './roomSummary';
import { RoomGrid } from './RoomGrid';
import { EmptyRoom, HiddenTray, RoomEditBar } from './RoomEditParts';
import type { RoomEditor } from './useRoomEditor';
import { Facts, gridEditing, nameOf, lightsOff, RoomNav, SectionHeading, type PageProps } from './pageKit';
import { itemActive, NowBody, PinnedSection, RoomSentence } from './PageNow';

export type RoomView = 'all' | 'now';

interface RailProps extends PageProps {
  editor: RoomEditor;
  /** B + C: the All / Now switch. */
  views?: boolean;
  /** The view, when the caller remembers it (the real page: per screen); else kept here. */
  view?: RoomView;
  onView?: (v: RoomView) => void;
  /** Its own side padding (the studio's stage); the real page sits in the app's padded main. */
  inset?: boolean;
  /** More to set while customizing (the real page: each car's picture). */
  editExtras?: ReactNode;
  /** Top-of-page panel shown while editing (deprecated when bottom ProEditBar handles editing). */
  editPanel?: ReactNode;
  /** Hide inline RoomEditBar when the page mounts the bottom ProEditBar in edit mode. */
  hideEditBar?: boolean;
}

export default function PageRail({ views = false, editor, view: viewProp, onView, inset = true, editExtras, editPanel, hideEditBar = false, ...props }: RailProps) {
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
  const sections = visibleSections(l)
    .map((s) => ({ ...s, keys: s.keys.filter((k) => !isRail(k)) }))
    .filter((s) => s.keys.length);
  const scenes = room.items.filter((it) => model(it.key).kind === 'scene' && !l.hidden.includes(it.key)).map((it) => it.key);
  const readings = room.items.filter((it) => model(it.key).kind === 'reading' && !l.hidden.includes(it.key)).map((it) => it.key);
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
          <span>{SECTION_TITLE[s.id]}</span>
          {phone ? null : <span className="text-xs font-normal text-muted">{sectionSummary(s.id, s.keys.map(model)) || s.keys.length}</span>}
        </Button>
      ))}
    </nav>
  ) : null;
  // Its own container: the columns follow the grid's width, not the page's (the rail takes some).
  const grid = (
    <div className="@container min-w-0 flex-1">
      {!room.items.length ? <EmptyRoom room={room.name} href={room.haUrl} /> : null}
      {room.items.length && !sections.length ? <p className="px-1 py-6 text-sm text-muted">Only readings here: they're all on the {phone ? 'top' : 'left'}.</p> : null}
      {editor.editing && editPanel ? <div className="mb-4">{editPanel}</div> : null}
      <HiddenTray editor={editor} name={nameOf(props)} />
      {editor.editing && editExtras ? <div className="mb-5">{editExtras}</div> : null}
      {views && editor.editing ? <PinnedSection props={props} editor={editor} /> : null}
      {sections.map((s, i) => {
        const models = s.keys.map(model);
        const anyOn = s.id === 'lights' && models.some((m) => m.isOn && m.available);
        return (
          <section key={s.id} data-section={s.id} aria-label={SECTION_TITLE[s.id]} className={cn('mb-6', phone ? 'scroll-mt-14' : 'scroll-mt-4')}>
            <SectionHeading
              id={s.id}
              title={SECTION_TITLE[s.id]}
              summary={sectionSummary(s.id, models)}
              editor={editor}
              index={i}
              count={sections.length}
              action={
                anyOn ? (
                  <Button size="sm" variant="secondary" onPress={() => lightsOff(props, s.keys)} className="h-8 rounded-full px-3 text-xs">
                    All off
                  </Button>
                ) : undefined
              }
            />
            <RoomGrid keys={s.keys} sizeOf={(k) => l.sizes[k]} renderTile={renderTile} editing={editor.editing ? gridEditing(editor, nameOf(props), views) : undefined} />
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
