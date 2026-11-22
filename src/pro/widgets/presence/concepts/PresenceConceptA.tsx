/**
 * Family presence concept A — Refined & minimal. Neutral surface; how many are home is the
 * headline and everyone is a quiet line with where they are. Small: count + who is out.
 * Wide: count + names. Tall: a row per person with avatar. Large: two columns with last seen.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { UserGroupIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProOverviewPresenceModel, ProPersonPresenceItem } from '../../../lib/overviewPresence';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { awayOf, PersonButton, placeOf } from './shared';

function Headline({ model, big }: { model: ProOverviewPresenceModel; big?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={cn('font-extralight leading-none tracking-tighter tabular-nums', big ? 'text-[60px]' : 'text-[48px]')}>
        {model.homeCount}
        <span className="ml-1 text-base font-normal tracking-normal text-muted">/{model.totalCount}</span>
      </p>
      <p className="mt-1 text-sm font-medium">{model.homeCount === model.totalCount ? 'Everyone home' : model.homeCount === 0 ? 'Nobody home' : 'at home'}</p>
    </div>
  );
}

function Line({ m }: { m: ProPersonPresenceItem }) {
  return (
    <li className="flex min-w-0 items-center gap-2 py-1 text-xs">
      <span className={cn('size-1.5 shrink-0 rounded-full', m.isHome ? 'bg-success' : m.isInKnownZone ? 'bg-[var(--accent)]' : 'bg-muted')} />
      <span className="min-w-0 flex-1 truncate font-medium">{m.firstName}</span>
      <span className="truncate text-muted">{placeOf(m)}</span>
    </li>
  );
}

export default function PresenceConceptA({ model, size, onOpenDetails }: DesignedWidgetProps<ProOverviewPresenceModel>) {
  const away = awayOf(model);
  return (
    <WidgetSurface label="Family presence" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Family presence" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col p-3.5">
        {model.totalCount === 0 ? (
          <div className="mt-auto flex flex-col gap-1 text-muted">
            <HugeiconsIcon icon={UserGroupIcon} size={22} />
            <p className="text-sm font-medium">No people set up</p>
          </div>
        ) : null}

        {model.totalCount > 0 && size === 's' ? (
          <div className="flex h-full flex-col justify-between">
            <Headline model={model} />
            <p className="truncate text-xs text-muted">{away.length === 0 ? 'All in' : `${away.map((m) => m.firstName).join(', ')} out`}</p>
          </div>
        ) : null}

        {model.totalCount > 0 && size === 'w' ? (
          <div className="flex h-full min-w-0 gap-4">
            <div className="flex flex-col justify-end">
              <Headline model={model} />
            </div>
            <ul aria-label="People" className="mt-7 flex min-w-0 flex-1 flex-col justify-end divide-y divide-[var(--separator,rgba(127,127,127,0.18))]">
              {model.members.slice(0, 4).map((m) => (
                <Line key={m.entityId} m={m} />
              ))}
            </ul>
          </div>
        ) : null}

        {model.totalCount > 0 && (size === 't' || size === 'l') ? (
          <div className="flex h-full min-h-0 flex-col gap-2">
            <Headline model={model} big={size === 'l'} />
            <ul aria-label="People" className={cn('mt-auto', size === 'l' ? 'grid grid-cols-2 gap-x-4 gap-y-1.5' : 'flex flex-col gap-1')}>
              {model.members.slice(0, size === 'l' ? 6 : 4).map((m) => (
                <li key={m.entityId} className="flex min-w-0 items-center gap-2">
                  <PersonButton m={m} avatarClass="size-8" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{m.firstName}</span>
                    <span className="block truncate text-xs text-muted">{size === 'l' && m.lastUpdatedRelative ? `${placeOf(m)} · ${m.lastUpdatedRelative}` : placeOf(m)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
