/**
 * What needs you, inside the Security hero: the Summary line (owner pick, round 3,
 * docs/pro-ui/SECURITY.md §5). One line of counts with icons ("2 unlocked · 2 open"), one main fix
 * (Lock all, or the single fix), tap for the list. "Silence siren" stays a full button: it is the
 * one fix that must never hide.
 */
import { useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { AlarmSmokeIcon, ArrowDown01Icon, DoorOpenIcon, SquareLock02Icon, SquareUnlock02Icon, VideoOffIcon, VolumeOffIcon, BatteryLowIcon, Alert02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { hasUnlocked, securityIssues, type Issue, type SecurityHome } from '../../lib/securityPage';
import { TONE, type DesignProps } from './parts';

export type NeedsProps = Pick<DesignProps, 'home' | 'act' | 'width'>;

export const others = (home: SecurityHome) => securityIssues(home).filter((i) => i.id !== 'alarm');
export const lockFixes = (list: Issue[]) => list.filter((i) => i.fix?.action.type === 'device');

export function Silence({ home, act }: Pick<NeedsProps, 'home' | 'act'>) {
  const alarm = securityIssues(home).find((i) => i.id === 'alarm' && i.fix);
  if (!alarm?.fix) return null;
  const fix = alarm.fix;
  return (
    <Button variant="danger" className="h-11 gap-1.5 rounded-full" onPress={() => act(fix.action)}>
      <HugeiconsIcon icon={VolumeOffIcon} size={16} />
      Silence siren
    </Button>
  );
}

export function LockAll({ home, act, list, className }: Pick<NeedsProps, 'home' | 'act'> & { list: Issue[]; className?: string }) {
  if (lockFixes(list).length < 2 || !hasUnlocked(home)) return null;
  return (
    <Button size="sm" variant="primary" className={cn('h-9 gap-1.5 rounded-full', className)} onPress={() => act({ type: 'lockAll' })}>
      <HugeiconsIcon icon={SquareLock02Icon} size={15} />
      Lock all
    </Button>
  );
}

export const KIND_ICON = (i: Issue): IconSvgElement => (i.text.endsWith('unlocked') || i.text.endsWith('jammed') ? SquareUnlock02Icon : i.text.endsWith(' open') ? DoorOpenIcon : i.text.includes('offline') ? VideoOffIcon : i.text.includes('battery') ? BatteryLowIcon : i.tone === 'danger' ? AlarmSmokeIcon : Alert02Icon);

export function counts(list: Issue[]) {
  const n = (f: (i: Issue) => boolean) => list.filter(f).length;
  return [
    { n: n((i) => i.tone === 'danger'), word: 'alert', icon: AlarmSmokeIcon },
    { n: n((i) => i.text.endsWith('unlocked')), word: 'unlocked', icon: SquareUnlock02Icon },
    { n: n((i) => i.text.endsWith(' open')), word: 'open', icon: DoorOpenIcon },
    { n: n((i) => i.text.includes('offline')), word: 'offline', icon: VideoOffIcon },
    { n: n((i) => i.text.includes('battery')), word: 'low battery', icon: BatteryLowIcon }
  ].filter((c) => c.n > 0);
}

/** B · Summary line: counts with icons in one line ("2 unlocked · 2 open"), one main fix, details on demand. */
export function NeedsSummary({ home, act }: NeedsProps) {
  const list = others(home);
  const [open, setOpen] = useState(false);
  if (!list.length) return <Silence home={home} act={act} />;
  const single = list.length === 1 ? list[0] : null;
  return (
    <div className="flex flex-col gap-3">
      <Silence home={home} act={act} />
      <div className="flex items-center gap-2">
        <Button variant="ghost" aria-expanded={open} onPress={() => setOpen(!open)} className="-ml-2 h-9 min-w-0 shrink justify-start gap-2.5 overflow-hidden px-2 text-sm">
          {counts(list).map((c) => (
            <span key={c.word} className="inline-flex shrink-0 items-center gap-1">
              <HugeiconsIcon icon={c.icon} size={15} className="text-muted" />
              <span className="font-semibold tabular-nums">{c.n}</span>
              <span className="text-muted">{c.word}</span>
            </span>
          ))}
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} className={cn('shrink-0 text-muted transition-transform', open && 'rotate-180')} />
        </Button>
        {single?.fix ? (
          <Button size="sm" variant="primary" className="ml-auto h-9 shrink-0 rounded-full" onPress={() => single.fix && act(single.fix.action)}>
            {single.fix.label}
          </Button>
        ) : (
          <LockAll home={home} act={act} list={list} className="ml-auto shrink-0" />
        )}
      </div>
      {open ? (
        <ul aria-label="Needs you" className="flex flex-col">
          {list.map((i) => (
            <li key={i.id} className="flex min-h-10 items-center gap-2.5">
              <HugeiconsIcon icon={KIND_ICON(i)} size={15} style={{ color: TONE[i.tone] }} />
              <span className="min-w-0 flex-1 truncate text-sm">{i.text}</span>
              {i.fix ? (
                <Button size="sm" variant="ghost" className="h-8 px-2 text-sm font-semibold text-[var(--accent)]" onPress={() => i.fix && act(i.fix.action)}>
                  {i.fix.label}
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

