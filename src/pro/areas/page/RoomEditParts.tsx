/**
 * The Area page's edit controls (batch 6), worded like the Overview's: Customize, then Hidden /
 * Reset / Cancel / Save; a tray to bring hidden tiles back; and the page when a room is empty.
 */
import type { ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { DashboardSquareEditIcon, LinkSquare02Icon, PlusSignIcon, ViewIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { AnyDevice } from './roomLayout';
import type { RoomEditor } from './useRoomEditor';

const DEVICE_NAMES: Record<AnyDevice, string> = {
  phone: 'Phone layout',
  tablet: 'Tablet layout',
  desktop: 'Desktop layout',
  wide: 'Tablet & desktop layout'
};

export function RoomEditBar({ editor, device, compact }: { editor: RoomEditor; device: AnyDevice; compact?: boolean }) {
  if (!editor.editing) {
    return (
      <Button size="sm" variant="tertiary" onPress={editor.begin} isIconOnly={compact} aria-label="Customize this room" className={compact ? 'size-9 min-w-0 rounded-full' : ''}>
        <HugeiconsIcon icon={DashboardSquareEditIcon} size={16} />
        {compact ? null : 'Customize'}
      </Button>
    );
  }
  return (
    <div role="toolbar" aria-label="Customize this room" className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs text-muted">{DEVICE_NAMES[device]}</span>
      <Button size="sm" variant="ghost" onPress={editor.reset}>
        Reset
      </Button>
      <Button size="sm" variant="ghost" onPress={editor.cancel}>
        Cancel
      </Button>
      <Button size="sm" variant="primary" onPress={editor.save} isDisabled={!editor.dirty}>
        Save
      </Button>
    </div>
  );
}

/** While editing: the hidden tiles, each one tap from coming back. */
export function HiddenTray({ editor, name }: { editor: RoomEditor; name: (key: string) => string }) {
  if (!editor.editing || !editor.layout.hidden.length) return null;
  return (
    <section aria-label="Hidden tiles" className="mb-5 rounded-2xl border border-dashed border-[color-mix(in_srgb,currentColor_18%,transparent)] p-3">
      <p className="mb-2 px-1 text-[13px] font-semibold text-muted">Hidden ({editor.layout.hidden.length})</p>
      <div className="flex flex-wrap gap-2">
        {editor.layout.hidden.map((k) => (
          <Button key={k} size="sm" variant="secondary" onPress={() => editor.update((l) => ({ ...l, hidden: l.hidden.filter((x) => x !== k) }))} aria-label={`Show ${name(k)} again`} className="gap-1.5">
            <HugeiconsIcon icon={ViewIcon} size={14} />
            {name(k)}
          </Button>
        ))}
      </div>
    </section>
  );
}

/** No devices in the room: say why and where to fix it (areas are set in Home Assistant). */
export function EmptyRoom({ room, href, tone = 'card', children }: { room: string; href?: string | null; tone?: 'card' | 'plain'; children?: ReactNode }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', tone === 'card' && 'pro-surface rounded-[26px]')}>
      <span aria-hidden className="grid size-14 place-items-center rounded-full bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]">
        <HugeiconsIcon icon={PlusSignIcon} size={24} />
      </span>
      <div>
        <p className="text-[17px] font-semibold">Nothing in {room} yet</p>
        <p className="mx-auto mt-1 max-w-[34ch] text-sm text-muted">Assign devices to this area in Home Assistant and they appear here, sorted by kind.</p>
      </div>
      {href !== null ? (
        <Button size="sm" variant="secondary" className="gap-1.5" onPress={() => href && window.open(href, '_blank', 'noopener,noreferrer')}>
          <HugeiconsIcon icon={LinkSquare02Icon} size={15} />
          Open the area in Home Assistant
        </Button>
      ) : null}
      {children}
    </div>
  );
}
