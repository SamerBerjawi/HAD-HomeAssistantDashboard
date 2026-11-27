/** Round 3 alternatives (docs/pro-ui/SECURITY.md §5); the chosen Summary line lives in `pages/security/NeedsSummary.tsx`. */
import { useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { AlarmSmokeIcon, ArrowDown01Icon, DoorOpenIcon, SquareLock02Icon, SquareUnlock02Icon, VideoOffIcon, VolumeOffIcon, BatteryLowIcon, Alert02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { hasUnlocked, securityIssues, type Issue, type StudioHome } from '../studioSecurity';
import { TONE, type DesignProps } from '../designs/parts';

import { KIND_ICON, LockAll, lockFixes, others, Silence, type NeedsProps } from '../../NeedsSummary';
export { NeedsSummary, type NeedsProps } from '../../NeedsSummary';

/** A · Quiet list: hairline rows, text and a small text action, three at most, then "N more". */
export function NeedsList({ home, act }: NeedsProps) {
  const list = others(home);
  const [open, setOpen] = useState(false);
  if (!list.length) return <Silence home={home} act={act} />;
  const shown = open ? list : list.slice(0, 3);
  return (
    <div className="flex flex-col gap-3">
      <Silence home={home} act={act} />
      <ul aria-label="Needs you" className="flex flex-col">
        {shown.map((i) => (
          <li key={i.id} className="flex min-h-11 items-center gap-2.5 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] first:border-t-0">
            <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: TONE[i.tone] }} />
            <span className="min-w-0 flex-1 truncate text-sm">{i.text}</span>
            {i.fix ? (
              <Button size="sm" variant="ghost" className="h-8 px-2 text-sm font-semibold text-[var(--accent)]" onPress={() => i.fix && act(i.fix.action)}>
                {i.fix.label}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {list.length > 3 || lockFixes(list).length > 1 ? (
        <div className="flex items-center gap-2">
          {list.length > 3 ? (
            <Button size="sm" variant="ghost" className="h-9 gap-1 px-2 text-sm text-muted" onPress={() => setOpen(!open)}>
              {open ? 'Show less' : `${list.length - 3} more`}
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} className={cn('transition-transform', open && 'rotate-180')} />
            </Button>
          ) : null}
          <LockAll home={home} act={act} list={list} className="ml-auto" />
        </div>
      ) : null}
    </div>
  );
}

/** C · Slim strip: one line of small icon chips that scrolls sideways; tapping a chip with a fix applies it. */
export function NeedsStrip({ home, act }: NeedsProps) {
  const list = others(home);
  if (!list.length) return <Silence home={home} act={act} />;
  return (
    <div className="flex flex-col gap-3">
      <Silence home={home} act={act} />
      <div className="-mx-6 flex gap-1.5 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:-mx-8 sm:px-8">
        <LockAll home={home} act={act} list={list} className="h-8 shrink-0 text-xs" />
        {list.map((i) =>
          i.fix ? (
            <Button key={i.id} size="sm" variant="ghost" aria-label={`${i.text}: ${i.fix.label}`} onPress={() => i.fix && act(i.fix.action)} className="h-8 shrink-0 gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] px-3 text-xs">
              <HugeiconsIcon icon={KIND_ICON(i)} size={14} style={{ color: TONE[i.tone] }} />
              {i.text.replace(/ is /, ' ')}
              <span className="font-semibold text-[var(--accent)]">· {i.fix.label}</span>
            </Button>
          ) : (
            <span key={i.id} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] px-3 text-xs">
              <HugeiconsIcon icon={KIND_ICON(i)} size={14} style={{ color: TONE[i.tone] }} />
              {i.text.replace(/ is /, ' ')}
            </span>
          )
        )}
      </div>
    </div>
  );
}
