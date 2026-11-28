/**
 * Media round 2: the Now Playing panel at the top of A (docs/pro-ui/MEDIA.md §0). Three ways:
 * 1 · Card (round 1's), 2 · Immersive (Apple Music's full player: the artwork's colour floods the
 * panel, white type, Up next swaps in for the artwork), 3 · Band (a compact strip, so the other rooms
 * and the library start higher; Up next as a row of tiles). Each handles TV (wide artwork, the app,
 * no queue), radio (Live, no scrubber) and podcasts the same way it handles music.
 */
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils';
import { clockOf, tintOf, type MediaHome, type Player } from '../../../lib/mediaHome';
import { BlurredArt, Cover, DeviceButton, NowPlayingPanel, NowText, Scrubber, Transport, UpNext, Volume, type DesignProps } from './parts';

export interface HeroProps {
  home: MediaHome;
  p: Player;
  act: DesignProps['act'];
  now: number;
  dark: boolean;
  width: number;
}

const wideArt = (p: Player) => p.kind === 'tv' || p.media?.kind === 'tv' || p.media?.kind === 'movie' || p.media?.kind === 'app';

/** Artwork: square for music, 16:9 for what plays on a TV. */
function Art({ p, size, className }: { p: Player; size: number; className?: string }) {
  if (!wideArt(p)) return <Cover art={p.media?.art} size={size} round="rounded-[18px]" shadow className={cn(p.state === 'paused' && 'scale-[0.92]', 'transition-transform duration-500', className)} label={p.media?.title} />;
  return <Cover art={p.media?.art} round="rounded-[16px]" shadow className={cn('aspect-video w-full', className)} label={p.media?.title} />;
}

/** 1 · Card: round 1's panel (artwork left, controls right, Up next beside it on desktop, under it on phones). */
export function HeroCard({ home, p, act, now, dark, width }: HeroProps) {
  return (
    <div className="flex flex-col gap-5">
      <NowPlayingPanel home={home} p={p} act={act} now={now} dark={dark} width={width} side={width >= 1024 ? <UpNext p={p} act={act} limit={6} /> : undefined} />
      {width < 1024 ? <UpNext p={p} act={act} limit={width < 640 ? 3 : 5} /> : null}
    </div>
  );
}

/**
 * 2 · Immersive (owner's pick, 2026-11-27, with Up next in the player as in Card): Apple Music's
 * full player. The artwork's colour floods the panel (in light and in dark), type is white on it,
 * the artwork breathes (smaller when paused). Up next is part of the player: a column on its right
 * on desktop, under the controls on tablets and phones.
 */
export function HeroImmersive({ home, p, act, now, width }: HeroProps) {
  const wide = width >= 860;
  const side = width >= 1024 && p.queue.length > 0;
  const t = tintOf(p.media?.art, true);
  const bg = t.hue === null ? 'hsl(240 6% 14%)' : `linear-gradient(160deg, hsl(${t.hue} 45% 32%), hsl(${(t.hue + 30) % 360} 50% 16%))`;
  const art = Math.min(side ? 320 : wide ? 380 : width - 56, 440);
  const queue = p.queue.length ? (
    <div className={cn('rounded-[20px] bg-black/20 p-3 backdrop-blur-md', side && 'self-stretch overflow-hidden')}>
      <UpNext p={p} act={act} limit={side ? 6 : width < 640 ? 3 : 4} />
    </div>
  ) : null;
  return (
    <section aria-label={`Now playing in ${p.room ?? p.name}`} className={cn('dark relative isolate flex overflow-hidden rounded-[32px] text-white', wide ? cn('min-h-[440px] items-center p-9', side ? 'gap-9' : 'gap-12') : 'flex-col gap-6 p-6')} style={{ background: bg }}>
      <BlurredArt art={p.media?.art} dark />
      <div className={cn('flex shrink-0 items-center justify-center', wide ? '' : 'self-stretch')} style={{ width: wide ? art : undefined }}>
        <Art p={p} size={art} className={wideArt(p) ? 'w-full' : undefined} />
      </div>
      <div className={cn('flex min-w-0 flex-1 flex-col gap-5', wide && 'max-w-[460px]')}>
        <div>
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-white/60">{p.media?.kind === 'radio' ? 'Live radio' : p.media?.kind === 'podcast' ? 'Podcast' : wideArt(p) ? `On the ${p.room ?? ''} TV`.replace('  ', ' ') : p.media?.album ?? ''}</p>
          <NowText p={p} big className="[&_p:last-child]:text-white/70" />
        </div>
        <Scrubber p={p} act={act} now={now} />
        <div className="[&_.button--primary]:bg-white [&_.button--primary]:text-black">
          <Transport p={p} act={act} size="lg" />
        </div>
        <Volume p={p} act={act} />
        <DeviceButton home={home} p={p} act={act} className="self-start text-white" />
        {!side ? queue : null}
      </div>
      {side ? <div className="flex min-w-[240px] max-w-[300px] flex-1 self-stretch">{queue}</div> : null}
    </section>
  );
}

/**
 * 3 · Band: a compact strip so more of the home shows above the fold. Artwork, the title big, the
 * transport and the speaker in one band; the scrubber and volume under it; Up next as a row of
 * small tiles (tap to play).
 */
export function HeroBand({ home, p, act, now, dark, width }: HeroProps) {
  const phone = width < 640;
  const t = tintOf(p.media?.art, dark);
  const art = phone ? 92 : 148;
  return (
    <section aria-label={`Now playing in ${p.room ?? p.name}`} className="relative isolate flex flex-col gap-4 overflow-hidden rounded-[28px] p-5" style={{ background: t.soft }}>
      <BlurredArt art={p.media?.art} dark={dark} />
      <div className="flex items-center gap-4 sm:gap-6">
        {wideArt(p) ? <Cover art={p.media?.art} round="rounded-[12px]" shadow className="aspect-video" size={undefined} label={p.media?.title} /> : <Cover art={p.media?.art} size={art} round="rounded-[14px]" shadow label={p.media?.title} />}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <NowText p={p} big={!phone} />
          {!phone ? (
            <div className="flex items-center gap-4">
              <Transport p={p} act={act} size="md" />
            </div>
          ) : null}
        </div>
        {!phone ? <DeviceButton home={home} p={p} act={act} className="self-start" /> : null}
      </div>
      {phone ? <Transport p={p} act={act} size="md" /> : null}
      <div className={cn('grid gap-4', phone ? 'grid-cols-1' : 'grid-cols-[2fr_1fr] items-center')}>
        <Scrubber p={p} act={act} now={now} />
        <Volume p={p} act={act} />
      </div>
      {phone ? <DeviceButton home={home} p={p} act={act} className="self-start" /> : null}
      {p.queue.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold">Up next</p>
          <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
            {p.queue.map((tr) => (
              <Button key={tr.id} variant="ghost" onPress={() => act(p.id, { type: 'play-track', track: tr })} className="h-auto w-[132px] shrink-0 flex-col items-start gap-1.5 rounded-xl bg-transparent p-1 text-left font-normal data-[hovered=true]:bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]">
                <Cover art={tr.art} size={124} round="rounded-[10px]" />
                <span className="w-full truncate text-[13px] font-medium">{tr.title}</span>
                <span className="w-full truncate text-[11px] text-muted">
                  {tr.artist} · {clockOf(tr.duration)}
                </span>
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
