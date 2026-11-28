/**
 * Design B · Ambient (expressive, the Area page family). The answer is a soft hero lit by the
 * state's colour: a large shield, the words, the modes, and each fix as a quiet pill. Cameras
 * follow as Area camera tiles: one featured, the rest beside it. Below the cameras, every security
 * device is its chosen Area tile (Lock · Status, Door · Day, Motion · Ticks, Leak · Device), with
 * the day's activity in a side column on wide screens and under the tiles on phones.
 */
import { useState, type ComponentType } from 'react';
import HeroSlide from '../heroes/HeroSlide';
import { NeedsSummary } from '../heroes/needsStyles';
import { CamerasStage, type CamerasProps } from '../cameras/CameraConcepts';
import { DevicesTabs, SecurityTile } from '../devices/DeviceConcepts';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SquareLock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { ChosenTile } from '../../../../areas/tiles/chosenTiles';
import type { TileAction, TileSize } from '../../../../areas/tileTypes';
import { hasUnlocked, securityIssues, securityVerdict } from '../studioSecurity';
import { ago, clock, DETECTION, EVENT_ICON, ModePicker, TONE, toneIcon, type DesignProps } from './parts';

const GAP = 12;
const ROW = 148;

/** The owner's hero (rounds 2 and 3): Slide with the Summary line. */
export function SettledHero(p: DesignProps) {
  return <HeroSlide {...p} Needs={NeedsSummary} />;
}

export default function DesignB({ home, width, act, Hero = SettledHero, roundOneHero = false, Cameras = CamerasStage, Devices = DevicesTabs }: DesignProps & { Devices?: ComponentType<DesignProps>; Hero?: ComponentType<DesignProps>; roundOneHero?: boolean; Cameras?: ComponentType<CamerasProps> }) {
  const issues = securityIssues(home);
  const v = securityVerdict(home, issues);
  const wide = width >= 900;
  // Device tiles share the row with the 340 px Today column on wide screens.
  const devWidth = wide ? width - 340 - 24 : width;
  const cols = devWidth < 600 ? 2 : devWidth < 1000 ? 4 : 6;
  const cell = (devWidth - GAP * (cols - 1)) / cols;
  const [featuredId, setFeatured] = useState<string | null>(null);
  const featured = home.cameras.find((c) => c.entityId === featuredId) ?? home.cameras.find((c) => c.detection) ?? home.cameras[0];
  const others = home.cameras.filter((c) => c !== featured);
  const tone = TONE[v.tone];
  const tileAct = (id: string) => (a: TileAction) => act({ type: 'device', id, action: a });
  const box = (size: TileSize) => ({ width: size === 'w' || size === 'l' ? cell * 2 + GAP : cell, height: size === 't' || size === 'l' ? ROW * 2 + GAP : ROW });

  return (
    <div className="flex flex-col gap-6">
      {/* 1 · The answer (round 2 swaps in a hero concept) */}
      {!roundOneHero ? (
        <Hero home={home} width={width} act={act} />
      ) : (
        <>
      {/* 1 · The answer */}
      <section
        aria-label="Security status"
        className="relative isolate overflow-hidden rounded-[32px] p-6 sm:p-8"
        style={{ background: `radial-gradient(120% 140% at 0% 0%, color-mix(in oklab, ${tone} 30%, transparent), transparent 60%), radial-gradient(80% 120% at 100% 100%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 70%), var(--surface)` }}
      >
        <div className={cn('flex gap-6', wide ? 'items-center justify-between' : 'flex-col')}>
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-[22px] text-white shadow-[0_10px_30px_-10px_currentColor]" style={{ background: tone, color: tone }}>
              <HugeiconsIcon icon={toneIcon(v.tone)} size={30} className="text-white" />
            </span>
            <div className="min-w-0">
              <h2 className={cn('font-light tracking-tight', width < 500 ? 'text-[28px] leading-8' : 'text-[40px] leading-[44px]')}>{v.title}</h2>
              <p className="mt-1 text-[15px] text-muted">{v.detail}</p>
            </div>
          </div>
          <ModePicker home={home} act={act} size="lg" className={cn(wide ? 'max-w-[460px]' : '')} />
        </div>

        {issues.length > 1 || issues[0]?.fix ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {issues.map((i) => (
              <span key={i.id} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] py-1 pl-3.5 pr-1.5 text-sm">
                <span aria-hidden className="size-2 rounded-full" style={{ background: TONE[i.tone] }} />
                {i.text}
                {i.fix ? (
                  <Button size="sm" variant="primary" className="ml-1 h-8 rounded-full px-3" onPress={() => i.fix && act(i.fix.action)}>
                    {i.fix.label}
                  </Button>
                ) : (
                  <span className="w-1.5" />
                )}
              </span>
            ))}
            {issues.filter((i) => i.fix?.action.type === 'device').length > 1 && hasUnlocked(home) ? (
              <Button variant="secondary" className="h-10 gap-1.5 rounded-full" onPress={() => act({ type: 'lockAll' })}>
                <HugeiconsIcon icon={SquareLock02Icon} size={16} />
                Lock all
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>

        </>
      )}

      {/* 2 · Cameras (round 4 swaps in a concept) */}
      {!roundOneHero ? (
        <Cameras home={home} width={width} />
      ) : (
        <>
      {/* 2 · Cameras: one featured, the rest beside or under it */}
      <section aria-label="Cameras" className={cn('grid gap-3', wide && 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)]')}>
        <div className="flex min-w-0 flex-col gap-2">
          <div className="aspect-video w-full">
            <ChosenTile e={featured} size="l" act={tileAct(featured.entityId)} />
          </div>
          {featured.detection ? (
            <span className="flex items-center gap-1.5 px-1 text-sm text-muted">
              <HugeiconsIcon icon={DETECTION[featured.detection].icon} size={15} />
              {DETECTION[featured.detection].label} seen {ago(featured.lastMotion).toLowerCase()} · {featured.name}
            </span>
          ) : null}
        </div>
        <div className={cn('grid gap-3', wide ? 'grid-cols-2 content-start' : 'grid-cols-2')}>
          {others.map((c) => (
            /* Tapping a small camera features it (its tile's own tap target calls act). */
            <div key={c.entityId} className="aspect-video w-full min-w-0">
              <ChosenTile e={c} size="w" act={() => setFeatured(c.entityId)} />
            </div>
          ))}
        </div>
      </section>

        </>
      )}

      {/* 3 · Devices and Today (round 5 swaps in a concept) */}
      {!roundOneHero ? (
        <Devices home={home} width={width} act={act} />
      ) : (
        <>
      {/* 3 · Devices as Area tiles, activity alongside */}
      <div className={cn('flex gap-6', wide ? 'flex-row items-start' : 'flex-col')}>
        <section aria-label="Devices" className="flex min-w-0 flex-1 flex-wrap gap-3">
          {home.devices.map((d) => {
            const size: TileSize = d.kind === 'lock' ? 's' : d.kind === 'opening' && d.isOn ? 'w' : 's';
            return (
              <div key={d.entityId} style={wide ? box(size) : { width: size === 'w' ? '100%' : `calc(50% - ${GAP / 2}px)`, height: ROW }}>
                <SecurityTile d={d} size={size} act={act} />
              </div>
            );
          })}
        </section>

        <section aria-label="Activity" className={cn('pro-surface flex flex-col gap-1 rounded-[26px] p-5', wide && 'w-[340px] shrink-0')}>
          <h3 className="mb-2 text-lg font-light">Today</h3>
          <ol className="relative flex flex-col gap-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-[color-mix(in_oklab,var(--foreground)_10%,transparent)]">
            {home.events.slice(0, 7).map((e) => (
              <li key={e.id} className="relative flex items-start gap-3">
                <span className="z-10 grid size-8 shrink-0 place-items-center rounded-full bg-[var(--surface)] ring-1 ring-[color-mix(in_oklab,var(--foreground)_10%,transparent)]" style={{ color: e.tone === 'calm' ? 'var(--muted)' : TONE[e.tone] }}>
                  <HugeiconsIcon icon={EVENT_ICON[e.kind]} size={15} />
                </span>
                <div className="min-w-0 pt-1">
                  <p className="text-sm leading-5">{e.text}</p>
                  <p className="text-xs text-muted tabular-nums">{clock(e.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
        </>
      )}
    </div>
  );
}
