/**
 * Family presence concept B — Expressive & immersive ("portraits"). The people are the card:
 * large overlapping portraits of who is home on a warm surface that gets warmer the fuller the
 * house is; people who are out are smaller, faded, with where they are.
 * Small: the stack of who is home. Wide: portraits + who is out. Tall/Large: bigger portraits.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { UserGroupIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProOverviewPresenceModel } from '../../../lib/overviewPresence';
import { presenceWarmth } from '../../../lib/presencePortraits';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { awayOf, homeOf, PersonButton, placeOf } from './shared';

export default function PresenceConceptB({ model, size, onOpenDetails }: DesignedWidgetProps<ProOverviewPresenceModel>) {
  const home = homeOf(model);
  const away = awayOf(model);
  const big = size === 't' || size === 'l';
  const avatar = cn('rounded-full', size === 'l' ? 'size-16 text-lg' : big ? 'size-14 text-base' : 'size-12 text-base');
  const homeMax = size === 's' ? 3 : size === 'w' ? 4 : size === 't' ? 4 : 6;
  const headline = model.homeCount === model.totalCount ? 'Everyone is home' : model.homeCount === 0 ? 'Nobody is home' : `${model.homeCount} of ${model.totalCount} home`;

  return (
    <WidgetSurface label="Family presence" className="bg-[#fbf5ef] dark:bg-[#1f1a1d]" style={{ backgroundImage: presenceWarmth(model.homeCount, model.totalCount) }}>
      <DetailsButton title="Family presence" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3.5">
        {model.totalCount === 0 ? (
          <div className="mt-auto flex flex-col gap-1 text-foreground/60">
            <HugeiconsIcon icon={UserGroupIcon} size={22} />
            <p className="text-sm font-medium">No people set up</p>
          </div>
        ) : (
          <>
            <p className="pr-8 text-base font-semibold leading-tight">{headline}</p>
            <ul aria-label="At home" className={cn('flex min-w-0', big ? 'flex-wrap gap-2' : '-space-x-3')}>
              {home.slice(0, homeMax).map((m, i) => (
                <li key={m.entityId} className={cn('flex flex-col items-center gap-1', !big && 'rounded-full ring-2 ring-[#fbf5ef] dark:ring-[#1f1a1d]')} style={{ zIndex: 10 - i }}>
                  <PersonButton m={m} avatarClass={avatar} />
                  {big ? <span className="max-w-16 truncate text-xs font-medium">{m.firstName}</span> : null}
                </li>
              ))}
              {home.length === 0 ? <li className="text-sm text-foreground/60">The house is empty</li> : null}
            </ul>
            {size !== 's' && away.length > 0 ? (
              <ul aria-label="Out" className="mt-auto flex flex-wrap gap-1.5">
                {away.slice(0, size === 'l' ? 4 : 3).map((m) => (
                  <li key={m.entityId} className="flex items-center gap-1.5 rounded-full bg-black/5 py-0.5 pl-0.5 pr-2.5 dark:bg-white/10">
                    <PersonButton m={m} avatarClass="size-7 rounded-full text-xs" dim />
                    <span className="text-xs">
                      <span className="font-medium">{m.firstName}</span> <span className="text-foreground/60">· {placeOf(m)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            {size === 's' && away.length > 0 ? <p className="mt-auto truncate text-xs text-foreground/60">{away.length} out</p> : null}
          </>
        )}
      </div>
    </WidgetSurface>
  );
}
