/** Round 4 alternatives (docs/pro-ui/SECURITY.md §6); the chosen Stage + filmstrip lives in `pages/security/CameraStage.tsx`. */
import { useState } from 'react';
import { Button, Modal } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, FullScreenIcon, VideoOffIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { SEEN } from '../../../../areas/tiles/security/securityParts';
import type { StudioCamera, StudioHome } from '../studioSecurity';
import { ago, CameraView, cameraLine, DETECTION, recentMotion, type DesignProps } from '../designs/parts';
import { byRecent, Detection, Fullscreen, FullscreenButton, type CamerasProps } from '../../CameraStage';
export { CamerasStage, byRecent, type CamerasProps } from '../../CameraStage';

/** B · Even wall: every camera the same size, the most recent first, names and lines under. */
export function CamerasWall({ home, width }: CamerasProps) {
  const list = byRecent(home);
  const online = list.filter((c) => c.available);
  const offline = list.filter((c) => !c.available);
  const [full, setFull] = useState<number | null>(null);
  const cols = width < 560 ? 2 : width < 1000 ? 3 : 3;
  return (
    <section aria-label="Cameras" className="flex flex-col gap-3">
      <div className="grid gap-x-3 gap-y-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {online.map((c, i) => (
          <figure key={c.entityId} className={cn('flex min-w-0 flex-col gap-1.5', i === 0 && cols === 2 && 'col-span-2')}>
            <Button variant="ghost" aria-label={`Full screen: ${c.name}`} onPress={() => setFull(list.indexOf(c))} className="h-auto w-full min-w-0 p-0 data-[hovered=true]:bg-transparent">
              <CameraView c={c} radius="rounded-[22px]" />
            </Button>
            <figcaption className="min-w-0 px-0.5">
              <p className="truncate text-sm font-semibold">{c.name}</p>
              <Detection c={c} className="text-xs" />
            </figcaption>
          </figure>
        ))}
      </div>
      {offline.length ? (
        <p className="flex items-center gap-1.5 px-0.5 text-sm text-muted">
          <HugeiconsIcon icon={VideoOffIcon} size={15} />
          {offline.map((c) => c.name).join(', ')} {offline.length === 1 ? 'camera is' : 'cameras are'} offline
        </p>
      ) : null}
      <Fullscreen list={list} index={full} onIndex={setFull} />
    </section>
  );
}

/** C · Motion first: the latest event is the big view; a short "Recent" list beside or under it switches; the quiet cameras sit in a small row. */
export function CamerasMotion({ home, width }: CamerasProps) {
  const list = byRecent(home);
  const recent = list.filter((c) => c.available && c.lastMotion && Date.now() - c.lastMotion < 3 * 3600_000).slice(0, 4);
  const [id, setId] = useState<string | null>(null);
  const [full, setFull] = useState<number | null>(null);
  const cur = list.find((c) => c.entityId === id) ?? list[0];
  const wide = width >= 900;
  const quiet = list.filter((c) => !recent.includes(c));
  return (
    <section aria-label="Cameras" className={cn('grid gap-4', wide && 'grid-cols-[minmax(0,2fr)_minmax(0,1fr)]')}>
      <div className="flex min-w-0 flex-col gap-2">
        <CameraView c={cur} radius="rounded-[26px]" />
        <div className="flex items-center gap-3 px-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">{cur.name}</p>
            <Detection c={cur} />
          </div>
          <FullscreenButton name={cur.name} onPress={() => setFull(list.indexOf(cur))} />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-3">
        <h3 className="px-1 text-sm font-semibold text-muted">Recent</h3>
        <ul className="flex flex-col gap-1">
          {recent.map((c) => (
            <li key={c.entityId}>
              <Button variant="ghost" aria-pressed={c === cur} onPress={() => setId(c.entityId)} className={cn('h-auto w-full min-w-0 justify-start gap-3 rounded-2xl p-1.5 text-left', c === cur && 'bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)]')}>
                <span className="w-20 shrink-0">
                  <CameraView c={c} radius="rounded-xl" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{c.detection ? DETECTION[c.detection].label : 'Motion'} · {c.name}</span>
                  <span className="block text-xs text-muted">{ago(c.lastMotion)}</span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
        {quiet.length ? (
          <div className="flex flex-col gap-1.5">
            <h3 className="px-1 text-sm font-semibold text-muted">Quiet</h3>
            <div className="flex gap-2 overflow-x-auto px-1 [scrollbar-width:none]">
              {quiet.map((c) => (
                <Button key={c.entityId} variant="ghost" aria-label={`Show ${c.name}`} onPress={() => setId(c.entityId)} className="h-auto w-24 shrink-0 flex-col items-stretch gap-1 p-0 data-[hovered=true]:bg-transparent">
                  <CameraView c={c} radius="rounded-xl" />
                  <span className="truncate text-left text-[11px] text-muted">{c.name}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <Fullscreen list={list} index={full} onIndex={setFull} />
    </section>
  );
}
