/**
 * Security cameras: Stage + filmstrip (owner pick, round 4, docs/pro-ui/SECURITY.md §6). One big
 * view (latest event first), its name and what it saw under it, a strip of every camera to switch,
 * full screen with previous / next. No text on the video. `View` draws a camera: the live page
 * passes the WebRTC player, the studio a drawn still. On desktop the cameras take two thirds of the
 * width and Today sits in the last third, clipped to the cameras' height and scrolling.
 */
import { useState, type ComponentType } from 'react';
import { Button, Modal } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, FullScreenIcon, VideoOffIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { SEEN } from '../../areas/tiles/security/securityParts';
import type { SecurityCamera, SecurityHome } from '../../lib/securityPage';
import { TodayList, todayBesideCameras } from './SecurityDevices';
import { ago, CameraView, cameraLine, DETECTION, recentMotion, type DesignProps } from './parts';

export interface CameraViewProps {
  c: SecurityCamera;
  /** Stream it (the big view, full screen) or show the snapshot (thumbnails). */
  live: boolean;
  radius: string;
  className?: string;
}

/** The studio's drawn still; the live page passes its WebRTC player instead. */
export function StillView({ c, radius, className }: CameraViewProps) {
  return <CameraView c={c} radius={radius} className={className} />;
}

export type CamerasProps = Pick<DesignProps, 'home' | 'width'> & { View?: ComponentType<CameraViewProps> };

/** Online cameras, the one with the freshest event first. */
export function byRecent(home: SecurityHome): SecurityCamera[] {
  return [...home.cameras].sort((a, b) => Number(b.available) - Number(a.available) || (b.lastMotion ?? 0) - (a.lastMotion ?? 0));
}

export function Detection({ c, className }: { c: SecurityCamera; className?: string }) {
  if (!c.available) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-sm text-muted', className)}>
        <HugeiconsIcon icon={VideoOffIcon} size={15} />
        Offline
      </span>
    );
  }
  const d = c.detection ? DETECTION[c.detection] : null;
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5 text-sm text-muted', className)}>
      {d ? <HugeiconsIcon icon={d.icon} size={15} style={{ color: recentMotion(c) ? SEEN : undefined }} /> : null}
      <span className="truncate">{cameraLine(c)}</span>
    </span>
  );
}

export function FullscreenButton({ onPress, name }: { onPress: () => void; name: string }) {
  return (
    <Button isIconOnly size="sm" variant="ghost" aria-label={`Full screen: ${name}`} onPress={onPress} className="shrink-0">
      <HugeiconsIcon icon={FullScreenIcon} size={18} />
    </Button>
  );
}

/** Full-screen view: the camera, its line, previous / next through every camera. */
export function Fullscreen({ list, index, onIndex, View = StillView }: { list: SecurityCamera[]; index: number | null; onIndex: (i: number | null) => void; View?: ComponentType<CameraViewProps> }) {
  const c = index === null ? null : list[index];
  const step = (d: number) => index !== null && onIndex((index + d + list.length) % list.length);
  return (
    <Modal.Backdrop isOpen={c !== null} onOpenChange={(open) => !open && onIndex(null)}>
      <Modal.Container size="full">
        <Modal.Dialog aria-label={c ? c.name : 'Camera'} className="pro dark bg-black text-white" data-page="security">
          <Modal.CloseTrigger />
          {c ? (
            <Modal.Body className="flex h-full flex-col justify-center gap-4 p-4">
              <View c={c} live radius="rounded-xl" className="max-h-[78vh]" />
              <div className="flex items-center gap-3">
                <Button isIconOnly variant="ghost" aria-label="Previous camera" onPress={() => step(-1)}>
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                </Button>
                <div className="min-w-0 flex-1 text-center">
                  <p className="truncate text-base font-semibold">{c.name}</p>
                  <Detection c={c} className="justify-center" />
                </div>
                <Button isIconOnly variant="ghost" aria-label="Next camera" onPress={() => step(1)}>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
                </Button>
              </div>
            </Modal.Body>
          ) : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/** A · Stage + filmstrip: one big view, its line under it, a strip of every camera to switch. */
export function CamerasStage({ home, width, View = StillView }: CamerasProps) {
  if (!todayBesideCameras(home, width)) return <Stage home={home} width={width} View={View} />;
  const gap = 24;
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" style={{ gap }}>
      <Stage home={home} width={((width - gap) * 2) / 3} View={View} />
      {/* The cameras set the row's height; Today fills it and scrolls. */}
      <div className="relative min-h-0">
        <div className="absolute inset-0">
          <TodayList home={home} limit={100} fill />
        </div>
      </div>
    </div>
  );
}

function Stage({ home, width, View = StillView }: CamerasProps) {
  const list = byRecent(home);
  const [id, setId] = useState<string | null>(null);
  const [full, setFull] = useState<number | null>(null);
  const cur = list.find((c) => c.entityId === id) ?? list[0];
  const thumb = width >= 600 ? 140 : 112;
  return (
    <section aria-label="Cameras" className="flex min-w-0 flex-col gap-3">
      <View c={cur} live={full === null} radius="rounded-[26px]" />
      <div className="flex items-center gap-3 px-1">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold">{cur.name}</p>
          <Detection c={cur} />
        </div>
        <FullscreenButton name={cur.name} onPress={() => setFull(list.indexOf(cur))} />
      </div>
      <div role="list" aria-label="Choose a camera" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        {list.map((c) => (
          <div key={c.entityId} role="listitem" className="shrink-0" style={{ width: thumb }}>
            <Button variant="ghost" aria-label={`Show ${c.name}`} aria-pressed={c === cur} onPress={() => setId(c.entityId)} className="h-auto w-full min-w-0 flex-col items-stretch gap-1 p-0 data-[hovered=true]:bg-transparent">
              <span className={cn('block rounded-2xl ring-2 ring-offset-2 ring-offset-[var(--background)]', c === cur ? 'ring-[var(--accent)]' : 'ring-transparent')}>
                <View c={c} live={false} radius="rounded-2xl" />
              </span>
              <span className="flex items-center gap-1 truncate px-0.5 text-left text-xs font-medium">
                {recentMotion(c) ? <span aria-label="Motion now" className="size-1.5 shrink-0 rounded-full" style={{ background: SEEN }} /> : null}
                {c.name}
              </span>
            </Button>
          </div>
        ))}
      </div>
      <Fullscreen list={list} index={full} onIndex={setFull} View={View} />
    </section>
  );
}

