/**
 * Family presence concept C — Innovative ("house and orbit"). A small house holds everyone at
 * home; people who are out circle it, closer when they are at a known place (work, school),
 * further when simply away. Small: the house with its count and dots for who is out. Wide: the
 * scene + who is out. Tall: scene over a list. Large: scene + everyone with last seen.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { UserGroupIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProOverviewPresenceModel } from '../../../lib/overviewPresence';
import { useBoxSize } from '../../shared/useBoxSize';
import { DetailsButton, WidgetSurface, type DesignedWidgetProps } from '../../shared/WidgetSurface';
import { awayOf, homeOf, PersonButton, placeOf } from './shared';

const HOUSE = 'polygon(50% 0%, 100% 38%, 100% 100%, 0% 100%, 0% 38%)';

function Orbit({ model, minimal }: { model: ProOverviewPresenceModel; minimal?: boolean }) {
  const box = useBoxSize<HTMLDivElement>({ width: 120, height: 120 });
  const d = Math.max(60, Math.min(box.width, box.height));
  const home = homeOf(model);
  const away = awayOf(model);
  const house = d * 0.48;
  const av = Math.max(20, Math.round(d * 0.17));
  const near = d * 0.36;
  const far = d * 0.44;
  return (
    <div ref={box.ref} className="grid size-full place-items-center">
      <div className="relative" style={{ width: d, height: d }}>
        {/* Orbits */}
        <span aria-hidden className="absolute rounded-full border border-dashed border-[var(--separator,rgba(127,127,127,0.3))]" style={{ inset: d / 2 - near }} />
        <span aria-hidden className="absolute rounded-full border border-dashed border-[var(--separator,rgba(127,127,127,0.2))]" style={{ inset: d / 2 - far }} />
        {/* House */}
        <div
          className="absolute flex flex-wrap content-end items-end justify-center gap-0.5 bg-[color-mix(in_oklab,var(--success)_18%,var(--surface))] p-1 pb-1.5"
          style={{ width: house, height: house * 0.92, left: (d - house) / 2, top: (d - house * 0.92) / 2 + d * 0.02, clipPath: HOUSE }}
        >
          {minimal || home.length > 4 ? (
            <span className="w-full text-center font-semibold tabular-nums" style={{ fontSize: house * 0.32 }}>
              {model.homeCount}
            </span>
          ) : (
            home.map((m) => (
              <span key={m.entityId} className="block" style={{ width: av, height: av, ['--av' as string]: `${av}px` }}>
                <PersonButton m={m} avatarClass="size-[var(--av)] text-[10px]" />
              </span>
            ))
          )}
        </div>
        {/* Out */}
        {away.map((m, i) => {
          const r = m.isInKnownZone ? near : far;
          const a = (-90 + 50 + (i * 300) / Math.max(1, away.length)) * (Math.PI / 180);
          const x = d / 2 + r * Math.cos(a);
          const y = d / 2 + r * Math.sin(a);
          return minimal ? (
            <span
              key={m.entityId}
              aria-hidden
              className={cn('absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full', m.isInKnownZone ? 'bg-[var(--accent)]' : 'bg-muted')}
              style={{ left: x, top: y }}
            />
          ) : (
            <span key={m.entityId} className="absolute block -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y, width: av, height: av, ['--av' as string]: `${av}px` }}>
              <PersonButton m={m} avatarClass="size-[var(--av)] text-[10px]" />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default function PresenceConceptC({ model, size, onOpenDetails }: DesignedWidgetProps<ProOverviewPresenceModel>) {
  const away = awayOf(model);
  return (
    <WidgetSurface label="Family presence" className="bg-[var(--surface)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <DetailsButton title="Family presence" onPress={onOpenDetails} />
      <div className="flex h-full min-h-0 flex-col gap-2 p-3">
        {model.totalCount === 0 ? (
          <div className="mt-auto flex flex-col gap-1 p-0.5 text-muted">
            <HugeiconsIcon icon={UserGroupIcon} size={22} />
            <p className="text-sm font-medium">No people set up</p>
          </div>
        ) : null}

        {model.totalCount > 0 && size === 's' ? <Orbit model={model} minimal /> : null}

        {model.totalCount > 0 && size === 'w' ? (
          <div className="flex h-full min-w-0 gap-3">
            <div className="aspect-square h-full">
              <Orbit model={model} />
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-end gap-1 pr-6">
              <p className="text-sm font-semibold">{model.homeCount} home</p>
              {away.length === 0 ? <p className="text-xs text-muted">Nobody is out</p> : null}
              {away.slice(0, 3).map((m) => (
                <p key={m.entityId} className="truncate text-xs">
                  {m.firstName} <span className="text-muted">· {placeOf(m)}</span>
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {model.totalCount > 0 && (size === 't' || size === 'l') ? (
          <div className={cn('flex h-full min-h-0 gap-3', size === 't' && 'flex-col')}>
            <div className={size === 't' ? 'aspect-square w-full' : 'aspect-square h-full max-w-[56%] shrink-0'}>
              <Orbit model={model} />
            </div>
            <ul aria-label="People" className={cn('flex min-w-0 flex-col gap-1', size === 'l' ? 'flex-1 justify-end pr-6' : 'mt-auto')}>
              {model.members.slice(0, size === 'l' ? 6 : 3).map((m) => (
                <li key={m.entityId} className="flex min-w-0 items-center gap-2 text-xs">
                  <span className={cn('size-1.5 shrink-0 rounded-full', m.isHome ? 'bg-success' : m.isInKnownZone ? 'bg-[var(--accent)]' : 'bg-muted')} />
                  <span className="shrink-0 font-medium">{m.firstName}</span>
                  <span className="ml-auto min-w-0 truncate text-muted">{size === 'l' && m.lastUpdatedRelative && !m.isHome ? `${placeOf(m)} · ${m.lastUpdatedRelative}` : placeOf(m)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </WidgetSurface>
  );
}
