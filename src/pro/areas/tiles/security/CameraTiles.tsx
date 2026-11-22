/**
 * Camera, batch 4 concepts.
 * - A · "Window": the view fills the tile edge to edge; a Live pill or the snapshot's age on it,
 *   the name and last motion on a scrim. Tap to switch between live and the snapshot.
 * - B · "Timeline": the view on top, the last six hours of motion as ticks underneath ("9 motions
 *   in 6 h"), so you see how busy the room has been without opening recordings.
 * - C · "Private": words first ("Quiet · motion 52m ago"); the view stays blurred until you press
 *   Show, then blurs again after 15 seconds. For cameras inside the home, seen by guests.
 */
import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { EyeIcon, VideoOffIcon, ViewOffSlashIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../tileKit';
import { agoText, type CameraTileModel, type TileProps } from '../../tileTypes';
import { ALARM, EventStrip, SEEN } from './securityParts';

const motionText = (e: CameraTileModel) => (!e.available ? 'Offline' : e.lastMotion ? `Motion ${agoText(e.lastMotion).toLowerCase()}` : 'No motion');
const recent = (e: CameraTileModel) => !!e.lastMotion && Date.now() - e.lastMotion < 10 * 60_000;

function Pill({ e, className }: { e: CameraTileModel; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-md', className)}>
      <span className={cn('size-1.5 rounded-full', e.live ? 'animate-pulse' : 'opacity-70')} style={{ background: e.live ? ALARM : 'white' }} />
      {e.live ? 'Live' : 'Snapshot'}
    </span>
  );
}

function Offline({ compact }: { compact?: boolean }) {
  return (
    <div className="grid h-full w-full place-items-center bg-[color-mix(in_srgb,currentColor_6%,transparent)]">
      <span className="flex items-center gap-1.5 text-[12px] font-medium opacity-60">
        <HugeiconsIcon icon={VideoOffIcon} size={16} />
        {compact ? null : 'Offline'}
      </span>
    </div>
  );
}

/** Tap target over the picture: live ↔ snapshot (the room page will open the full view instead). */
function SwitchView({ e, act }: { e: CameraTileModel; act: TileProps<CameraTileModel>['act'] }) {
  return (
    <Button
      variant="ghost"
      aria-label={`${e.name}: ${e.live ? 'show the snapshot' : 'go live'}`}
      isDisabled={!e.available}
      onPress={() => act({ type: 'toggle' })}
      className="absolute inset-0 h-full w-full min-w-0 rounded-none p-0 data-[hovered=true]:bg-transparent data-[pressed=true]:bg-black/10"
    />
  );
}

export function CameraWindow({ e, size, act }: TileProps<CameraTileModel>) {
  const scrim = 'pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35),transparent_35%,transparent_55%,rgba(0,0,0,0.7))]';
  const big = size === 'l' || size === 't';
  return (
    <TileFrame label={e.name} className={cn('bg-black text-white', !e.available && 'pro-surface bg-transparent text-current')}>
      {e.available ? <div aria-hidden className="absolute inset-0" style={{ background: e.picture ?? undefined }} /> : <Offline compact={size === 'xs'} />}
      {e.available ? <div className={scrim} /> : null}
      {e.available ? <SwitchView e={e} act={act} /> : null}
      <div className={cn('pointer-events-none absolute inset-0 flex flex-col', size === 'xs' ? 'justify-center px-3' : big ? 'p-4' : 'p-3')}>
        {size === 'xs' ? (
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold leading-tight">{e.name}</p>
              <p className="truncate text-[12px] opacity-80">{motionText(e)}</p>
            </div>
            {e.available ? <Pill e={e} /> : null}
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">{e.available ? <Pill e={e} /> : <span />}</div>
            <div className="mt-auto min-w-0">
              <p className={cn('font-semibold leading-tight', big ? 'line-clamp-2 text-[17px]' : 'truncate text-[14px]')}>{e.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] opacity-85">
                {recent(e) ? <span className="size-1.5 shrink-0 rounded-full" style={{ background: SEEN }} /> : null}
                {motionText(e)}
              </p>
            </div>
          </>
        )}
      </div>
    </TileFrame>
  );
}

export function CameraTimeline({ e, size, act }: TileProps<CameraTileModel>) {
  const count = e.events.length;
  const summary = !e.available ? 'Offline' : count ? `${count} motion${count === 1 ? '' : 's'} in 6 h` : 'Quiet for 6 h';
  const view = (cls: string) => (
    <div className={cn('relative overflow-hidden bg-black/20', cls)}>
      {e.available ? <div aria-hidden className="absolute inset-0" style={{ background: e.picture ?? undefined }} /> : <Offline compact />}
      {e.available ? <SwitchView e={e} act={act} /> : null}
      {e.available && size !== 'xs' ? <Pill e={e} className="pointer-events-none absolute left-2 top-2" /> : null}
    </div>
  );
  if (size === 'xs') {
    return (
      <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
        <div className="flex h-full items-center gap-2.5 pl-1.5 pr-3">
          {view('h-[56px] w-[64px] shrink-0 rounded-[14px]')}
          <div className="min-w-0 flex-1">
            <TileName className="line-clamp-1 truncate text-[14px]">{e.name}</TileName>
            <EventStrip times={e.events} hue={SEEN} className="mt-1 [&>div]:h-3.5" />
          </div>
        </div>
      </TileFrame>
    );
  }
  const strip = <EventStrip times={e.events} hue={SEEN} labels={size === 'l' || size === 't'} />;
  if (size === 'w' || size === 'l') {
    return (
      <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
        <div className={cn('flex h-full', size === 'l' ? 'flex-col gap-3 p-3' : 'gap-3 p-2')}>
          {view(size === 'l' ? 'min-h-0 flex-1 rounded-[18px]' : 'w-[52%] shrink-0 rounded-[18px]')}
          <div className={cn('flex min-w-0 flex-col', size === 'l' ? 'px-1.5 pb-1' : 'flex-1 py-1.5 pr-1.5')}>
            <div className={cn('flex min-w-0', size === 'l' ? 'items-baseline gap-3' : 'flex-col')}>
              <TileName className={size === 'l' ? 'line-clamp-1' : 'line-clamp-2'}>{e.name}</TileName>
              <TileState className="text-[12px]">{motionText(e)}</TileState>
            </div>
            <p className={cn('text-[12px] font-medium opacity-70', size === 'l' ? 'mt-1' : 'mt-auto')}>{summary}</p>
            <div className="mt-1.5">{strip}</div>
          </div>
        </div>
      </TileFrame>
    );
  }
  return (
    <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
      <div className="flex h-full flex-col p-2">
        {view(cn('w-full rounded-[18px]', size === 't' ? 'aspect-[4/3]' : 'min-h-0 flex-1'))}
        <div className={cn('flex min-w-0 flex-col px-1.5', size === 't' ? 'flex-1 pt-3' : 'pt-1.5')}>
          <TileName className={cn(size === 's' ? 'line-clamp-1 text-[13px]' : 'line-clamp-2')}>{e.name}</TileName>
          {size === 't' ? <TileState className="text-[12px]">{motionText(e)}</TileState> : null}
          {size === 't' ? <p className="mt-auto text-[12px] font-medium opacity-70">{summary}</p> : null}
          <div className={size === 't' ? 'mt-1.5' : 'mt-1 pb-0.5'}>{size === 't' ? strip : <EventStrip times={e.events} hue={SEEN} className="[&>div]:h-3" />}</div>
        </div>
      </div>
    </TileFrame>
  );
}

export function CameraPrivate({ e, size }: TileProps<CameraTileModel>) {
  const [shown, setShown] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const reveal = () => {
    setShown((v) => !v);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShown(false), 15_000);
  };
  const quiet = !recent(e);
  const word = !e.available ? 'Offline' : quiet ? 'Quiet' : 'Motion';
  const hue = !e.available ? undefined : quiet ? undefined : SEEN;
  const detail = !e.available ? 'Camera not reachable' : e.lastMotion ? `${quiet ? 'Last motion' : 'Seen'} ${agoText(e.lastMotion).toLowerCase()}` : 'No motion yet';
  const show = e.available ? (
    <Button
      size="sm"
      variant="secondary"
      data-tile-control=""
      aria-label={`${e.name}: ${shown ? 'blur the view' : 'show the view for 15 seconds'}`}
      aria-pressed={shown}
      onPress={reveal}
      className="relative z-10 h-7 min-w-0 gap-1 rounded-full bg-white/80 px-2.5 text-[12px] font-semibold text-[hsl(240_20%_14%)] backdrop-blur-md dark:bg-black/50 dark:text-white"
    >
      <HugeiconsIcon icon={shown ? ViewOffSlashIcon : EyeIcon} size={14} />
      {size === 'xs' || size === 's' || size === 't' ? null : shown ? 'Hide' : 'Show'}
    </Button>
  ) : null;
  return (
    <TileFrame label={e.name} className={cn('pro-surface', !e.available && 'opacity-60')}>
      {e.available ? (
        <div aria-hidden className={cn('absolute inset-0 transition-[filter,opacity,transform] duration-500', shown ? 'opacity-100' : 'scale-110 opacity-50 blur-xl saturate-50')} style={{ background: e.picture ?? undefined }} />
      ) : null}
      {e.available && !shown ? <div aria-hidden className="absolute inset-0 bg-[var(--surface)]/40" /> : null}
      <div className={cn('relative flex h-full', size === 'xs' ? 'items-center gap-2 px-3.5' : 'flex-col', size === 'l' ? 'p-5' : size !== 'xs' && 'p-3.5', shown && 'text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]')}>
        <div className="min-w-0 flex-1">
          {size === 'xs' ? (
            <>
              <p className="truncate text-[15px] font-semibold leading-tight" style={{ color: shown ? undefined : hue }}>
                {word}
              </p>
              <TileState className="text-[12px]">{e.name}</TileState>
            </>
          ) : (
            <TileName className="line-clamp-2">{e.name}</TileName>
          )}
        </div>
        {size === 'xs' ? show : null}
        {size !== 'xs' ? (
          <div className="mt-auto flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <p className={cn('font-semibold leading-none tracking-[-0.02em]', size === 'l' ? 'text-[34px]' : size === 's' ? 'text-[22px]' : 'text-[26px]')} style={{ color: shown ? undefined : hue }}>
                {word}
              </p>
              <p className="mt-1 truncate text-[12px] opacity-75">{detail}</p>
            </div>
            {show}
          </div>
        ) : null}
      </div>
    </TileFrame>
  );
}
