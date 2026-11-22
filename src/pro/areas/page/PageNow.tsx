/**
 * Page concept C · "Now first" (batch 6): the page leads with what is happening. The header is one
 * plain sentence ("2 lights on, music playing, window open for 12 min."). "Now" gathers what is on,
 * running or needs a look (alerts first); "Pinned" keeps the owner's favourites on top whatever
 * their state. Everything else folds into one line per section ("Climate · Cooling to 22° · 6"),
 * opened with a tap. A tile that turns off stays under Now until you leave the page, so nothing
 * jumps away under your finger.
 */
import { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowRight01Icon, PinIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { TileModel } from '../tileTypes';
import { SECTION_ORDER, SECTION_TITLE, toggleCollapsed, visibleSections, type RoomLayout } from './roomLayout';
import { isActive, isAlert, roomSentence, sectionSummary } from './roomSummary';
import { RoomGrid } from './RoomGrid';
import { EmptyRoom, HiddenTray, RoomEditBar } from './RoomEditParts';
import type { RoomEditor } from './useRoomEditor';
import { gridEditing, nameOf, RoomNav, SectionHeading, type PageItem, type PageProps } from './pageKit';

/** Everything else starts folded. */
export const foldAll = (l: RoomLayout): RoomLayout => ({ ...l, collapsed: [...SECTION_ORDER] });

/** Car tiles are about one entity: active means that entity is (charging, unlocked, heating). */
export function itemActive(it: PageItem, m: TileModel) {
  if (m.kind !== 'car' || !it.focus) return isActive(m);
  if (!m.available) return false;
  if (it.focus === 'battery' || it.focus === 'charging') return m.charging === 'charging';
  if (it.focus === 'lock') return m.locked === false;
  if (it.focus === 'climate') return m.climateOn === true;
  return false;
}

/** Concept C on its own (the studio); the real page uses its body as the Rail's Now view. */
export default function PageNow({ editor, ...props }: PageProps & { editor: RoomEditor }) {
  const { room, device, model } = props;
  const phone = device === 'phone';
  const all = room.items.map((it) => model(it.key));
  return (
    <div className={cn(phone ? 'px-4 pb-6 pt-3' : 'px-6 pb-8 pt-4')}>
      <header className={cn('flex flex-col gap-1', phone ? 'mb-5' : 'mb-7')}>
        <RoomNav room={room} rooms={props.rooms} onRoom={props.onRoom} onBack={props.onBack} right={room.items.length && phone && !editor.editing ? <RoomEditBar editor={editor} device={device} compact /> : null} />
        <h1 className={cn('font-semibold tracking-[-0.02em]', phone ? 'text-[28px]' : 'text-[34px]')}>{room.name}</h1>
        {room.items.length ? <RoomSentence models={all} phone={phone} /> : null}
        {room.items.length && (!phone || editor.editing) ? <div className="mt-2">{<RoomEditBar editor={editor} device={device} />}</div> : null}
      </header>
      {!room.items.length ? <EmptyRoom room={room.name} href={room.haUrl} /> : null}
      <HiddenTray editor={editor} name={nameOf(props)} />
      <NowBody props={props} editor={editor} />
    </div>
  );
}

/** The room in one sentence, red when something needs a look. */
export function RoomSentence({ models, phone, className }: { models: TileModel[]; phone: boolean; className?: string }) {
  return <p className={cn('max-w-[46ch] leading-snug', phone ? 'text-[17px]' : 'text-[20px]', models.some(isAlert) ? 'text-[hsl(4_82%_54%)]' : 'opacity-80', className)}>{roomSentence(models)}</p>;
}

/** Pinned tiles; editable in edit mode (their order is the pin order). */
export function PinnedSection({ props, editor }: { props: PageProps; editor: RoomEditor }) {
  const l = editor.layout;
  const pinned = l.pinned.filter((k) => !l.hidden.includes(k));
  if (!pinned.length) return null;
  const editing = editor.editing ? gridEditing(editor, nameOf(props), true) : undefined;
  const pinnedEditing = editing && { ...editing, onMoveOnto: (k: string, over: string) => editor.update((x) => ({ ...x, pinned: reorder(x.pinned, k, over) })), onMoveBy: (k: string, dir: -1 | 1) => editor.update((x) => ({ ...x, pinned: step(x.pinned, k, dir) })) };
  return (
    <section aria-label="Pinned" className="mb-6">
      <div className="mb-2 flex items-center gap-1.5 px-1 text-[15px] font-semibold">
        <HugeiconsIcon icon={PinIcon} size={15} className="text-[var(--accent)]" />
        Pinned
      </div>
      <RoomGrid keys={pinned} sizeOf={(k) => l.sizes[k]} renderTile={props.renderTile} editing={pinnedEditing} />
    </section>
  );
}

/**
 * Pinned, Now and Everything else (folded per section). `skip` leaves tiles out that the page shows
 * elsewhere (the Rail's scenes and readings). A tile that turns off stays under Now while this is
 * on screen.
 */
export function NowBody({ props, editor, skip = () => false }: { props: PageProps; editor: RoomEditor; skip?: (key: string) => boolean }) {
  const { room, model, renderTile } = props;
  const l = editor.layout;
  const items = room.items.filter((it) => !skip(it.key));
  const live = items.filter((it) => !l.hidden.includes(it.key) && itemActive(it, model(it.key))).map((it) => it.key);
  const [seen, setSeen] = useState<string[]>(live);
  const liveKey = live.join(',');
  useEffect(() => setSeen((s) => (live.every((k) => s.includes(k)) ? s : [...s, ...live.filter((k) => !s.includes(k))])), [liveKey]);
  const pinned = l.pinned.filter((k) => !l.hidden.includes(k));
  const now = items
    .map((it) => it.key)
    .filter((k) => seen.includes(k) && !pinned.includes(k) && !l.hidden.includes(k))
    .sort((a, b) => Number(isAlert(model(b))) - Number(isAlert(model(a))));
  const taken = new Set([...pinned, ...(editor.editing ? [] : now)]);
  const rest = visibleSections(l)
    .map((s) => ({ ...s, keys: s.keys.filter((k) => !taken.has(k) && !skip(k)) }))
    .filter((s) => s.keys.length);
  const editing = editor.editing ? gridEditing(editor, nameOf(props), true) : undefined;

  return (
    <>
      <PinnedSection props={props} editor={editor} />
      {editor.editing ? (
        <p className="mb-5 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_8%,transparent)] px-4 py-3 text-sm">“Now” fills itself with what is on or needs a look. Pin a tile to keep it on top; set sizes and order below.</p>
      ) : now.length ? (
        <section aria-label="Now" className="mb-7">
          <div className="mb-2 px-1 text-[15px] font-semibold">Now</div>
          <RoomGrid keys={now} sizeOf={(k) => l.sizes[k]} renderTile={renderTile} />
        </section>
      ) : null}

      {rest.length ? (
        <section aria-label={editor.editing ? 'All tiles' : 'Everything else'}>
          {editor.editing ? null : <div className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">Everything else</div>}
          <div className={cn(!editor.editing && 'pro-surface divide-y divide-[color-mix(in_srgb,currentColor_8%,transparent)] overflow-hidden rounded-[22px]')}>
            {rest.map((s, i) => {
              const open = editor.editing || !l.collapsed.includes(s.id);
              const models = s.keys.map(model);
              if (editor.editing) {
                return (
                  <section key={s.id} aria-label={SECTION_TITLE[s.id]} className="mb-6">
                    <SectionHeading id={s.id} title={SECTION_TITLE[s.id]} editor={editor} index={i} count={rest.length} />
                    <RoomGrid keys={s.keys} sizeOf={(k) => l.sizes[k]} renderTile={renderTile} editing={editing} />
                  </section>
                );
              }
              return (
                <div key={s.id}>
                  <Button
                    variant="ghost"
                    aria-expanded={open}
                    onPress={() => editor.commit((x) => toggleCollapsed(x, s.id))}
                    className="flex h-auto w-full items-center justify-start gap-3 rounded-none px-4 py-3.5 text-left"
                  >
                    <span className="text-[15px] font-semibold">{SECTION_TITLE[s.id]}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-normal text-muted">{sectionSummary(s.id, models)}</span>
                    <span className="text-[13px] font-normal tabular-nums text-muted">{s.keys.length}</span>
                    <HugeiconsIcon icon={open ? ArrowDown01Icon : ArrowRight01Icon} size={16} className="shrink-0 opacity-60" />
                  </Button>
                  {open ? <RoomGrid keys={s.keys} sizeOf={(k) => l.sizes[k]} renderTile={renderTile} className="px-3 pb-3" /> : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </>
  );
}

function reorder(list: string[], key: string, over: string) {
  const next = list.filter((k) => k !== key);
  next.splice(list.indexOf(over), 0, key);
  return next;
}
function step(list: string[], key: string, dir: -1 | 1) {
  const i = list.indexOf(key);
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}
