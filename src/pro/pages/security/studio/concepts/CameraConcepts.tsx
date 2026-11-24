/**
 * Section 3 — Cameras (strictly zero text overlaid on video — captions sit below frames per DESIGN.md 7.5):
 * A · Theater Stage + Filmstrip (16:9 featured camera + caption controls below + thumbnail strip)
 * B · Multi-Cam Surveillance Wall (2-col simultaneous wall with zone filter + 1-tap spotlight)
 * C · Motion-First Event Reel (split live viewport + AI detection switcher rail)
 */
import { useState } from 'react';
import { Button, Chip, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert02Icon,
  Camera01Icon,
  FullScreenIcon,
  GridViewIcon,
  Location01Icon,
  Motion01Icon,
  Video01Icon,
  VideoOffIcon,
  VolumeHighIcon,
  VolumeOffIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { StudioCamera } from '../studioSecurity';
import { AI_META, MockCameraViewport, TipIconBtn } from './securityHelpers';
import type { SecurityConceptProps } from './types';

function CameraStatusChip({ cam }: { cam: StudioCamera }) {
  if (cam.status === 'offline') {
    return (
      <Chip size="sm" variant="soft" color="danger">
        <HugeiconsIcon icon={VideoOffIcon} size={11} />
        <Chip.Label>Offline</Chip.Label>
      </Chip>
    );
  }
  if (cam.motion) {
    return (
      <Chip size="sm" variant="soft" color="warning">
        <HugeiconsIcon icon={Motion01Icon} size={11} />
        <Chip.Label>Motion</Chip.Label>
      </Chip>
    );
  }
  if (cam.status === 'snapshot') {
    return (
      <Chip size="sm" variant="soft" color="warning">
        <HugeiconsIcon icon={Camera01Icon} size={11} />
        <Chip.Label>Snapshot</Chip.Label>
      </Chip>
    );
  }
  return (
    <Chip size="sm" variant="soft" color="success">
      <HugeiconsIcon icon={Video01Icon} size={11} />
      <Chip.Label>Live</Chip.Label>
    </Chip>
  );
}

/** 3A · Theater Stage + Filmstrip */
export function CamerasA({ snap, dispatch, compact }: SecurityConceptProps) {
  const [fullscreenNote, setFullscreenNote] = useState(false);
  const featured = snap.cameras.find((c) => c.id === snap.featuredCameraId) ?? snap.cameras[0];
  if (!featured) return null;
  const otherMotion = snap.cameras.find((c) => c.id !== featured.id && c.motion);

  return (
    <section aria-label="Featured camera stage" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={Camera01Icon} size={16} className="text-[var(--accent)]" />
          Cameras ({snap.cameras.length})
        </span>
        {otherMotion ? (
          <Button
            size="sm"
            variant="secondary"
            onPress={() => dispatch({ type: 'selectCamera', cameraId: otherMotion.id })}
            className="h-7 gap-1.5 rounded-full px-2.5 text-xs"
          >
            <HugeiconsIcon icon={Motion01Icon} size={13} className="text-warning" />
            Motion on {otherMotion.name}
          </Button>
        ) : null}
      </header>

      <MockCameraViewport cam={featured} aspect="video" />

      {/* Caption bar strictly below the video frame */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{featured.name}</span>
          <span className="flex items-center gap-1 text-xs text-muted">
            <HugeiconsIcon icon={Location01Icon} size={12} />
            {featured.area}
          </span>
          <CameraStatusChip cam={featured} />
          {featured.aiDetections.map((ai) => (
            <Chip key={ai} size="sm" variant="soft" color="warning">
              <HugeiconsIcon icon={AI_META[ai].icon} size={11} />
              <Chip.Label>{AI_META[ai].label}</Chip.Label>
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <TipIconBtn
            label={featured.muted ? 'Unmute audio' : 'Mute audio'}
            icon={featured.muted ? VolumeOffIcon : VolumeHighIcon}
            onPress={() => dispatch({ type: 'toggleCameraMute', cameraId: featured.id })}
          />
          <TipIconBtn
            label={fullscreenNote ? 'Exit full screen preview' : 'Open full screen'}
            icon={FullScreenIcon}
            onPress={() => setFullscreenNote((v) => !v)}
          />
        </div>
      </div>

      {fullscreenNote ? (
        <p className="rounded-xl bg-default/55 px-3 py-1.5 text-xs text-muted">
          Studio preview: in production this opens native fullscreen with swipe prev/next.
        </p>
      ) : null}

      {/* Horizontal filmstrip */}
      <div className={cn('grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-4')}>
        {snap.cameras.map((cam) => {
          const active = cam.id === featured.id;
          return (
            <Button
              key={cam.id}
              variant="ghost"
              onPress={() => dispatch({ type: 'selectCamera', cameraId: cam.id })}
              className={cn(
                'flex h-auto flex-col items-stretch gap-1.5 rounded-xl p-1.5 text-left',
                active ? 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]' : 'bg-default/40'
              )}
            >
              <MockCameraViewport cam={cam} aspect="thumb" />
              <div className="flex items-center justify-between gap-1 px-0.5">
                <span className="truncate text-[11px] font-semibold text-foreground">{cam.name}</span>
                <span
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    cam.status === 'offline' ? 'bg-danger' : cam.motion ? 'bg-warning' : 'bg-success'
                  )}
                />
              </div>
            </Button>
          );
        })}
      </div>
    </section>
  );
}

/** 3B · Multi-Cam Surveillance Wall */
export function CamerasB({ snap, dispatch, compact }: SecurityConceptProps) {
  const [zone, setZone] = useState<'all' | 'Exterior' | 'Interior'>('all');
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const shown = zone === 'all' ? snap.cameras : snap.cameras.filter((c) => c.zone === zone);

  return (
    <section aria-label="Multi-camera surveillance wall" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={GridViewIcon} size={16} className="text-[var(--accent)]" />
          Camera wall
        </span>
        <ToggleButtonGroup
          aria-label="Camera zone"
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={new Set([zone])}
          onSelectionChange={(keys) => {
            const z = [...keys][0] as 'all' | 'Exterior' | 'Interior' | undefined;
            if (z) setZone(z);
          }}
        >
          <ToggleButton id="all" className="text-xs">All ({snap.cameras.length})</ToggleButton>
          <ToggleButton id="Exterior" className="text-xs">Exterior</ToggleButton>
          <ToggleButton id="Interior" className="text-xs">Interior</ToggleButton>
        </ToggleButtonGroup>
      </header>

      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-2')}>
        {shown.map((cam) => {
          const isSpot = spotlightId === cam.id;
          return (
            <article
              key={cam.id}
              className={cn(
                'flex flex-col gap-2 rounded-2xl bg-default/40 p-2.5',
                isSpot && !compact && 'col-span-2'
              )}
            >
              <MockCameraViewport cam={cam} aspect="video" />
              <div className="flex flex-wrap items-center justify-between gap-1.5 px-0.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-xs font-semibold">{cam.name}</span>
                  <CameraStatusChip cam={cam} />
                </div>
                <div className="flex items-center gap-1">
                  {cam.aiDetections.map((ai) => (
                    <Chip key={ai} size="sm" variant="soft" color="warning">
                      <HugeiconsIcon icon={AI_META[ai].icon} size={11} />
                      <Chip.Label>{AI_META[ai].label}</Chip.Label>
                    </Chip>
                  ))}
                  <TipIconBtn
                    label={isSpot ? 'Restore grid size' : 'Expand camera'}
                    icon={FullScreenIcon}
                    variant="ghost"
                    onPress={() => {
                      setSpotlightId(isSpot ? null : cam.id);
                      dispatch({ type: 'selectCamera', cameraId: cam.id });
                    }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** 3C · Motion-First Event Reel */
export function CamerasC({ snap, dispatch, compact }: SecurityConceptProps) {
  const featured = snap.cameras.find((c) => c.id === snap.featuredCameraId) ?? snap.cameras[0];
  if (!featured) return null;

  return (
    <section aria-label="Camera live view and event reel" className="pro-surface @container flex flex-col gap-3 p-4">
      <header className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <HugeiconsIcon icon={Video01Icon} size={16} className="text-[var(--accent)]" />
          Live view & detections
        </span>
        <span className="text-xs text-muted">{featured.lastEvent}</span>
      </header>

      <div className={cn('grid grid-cols-1 gap-3', !compact && '@[600px]:grid-cols-[1.45fr_1fr]')}>
        <div className="flex flex-col gap-2">
          <MockCameraViewport cam={featured} aspect="video" />
          <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">{featured.name}</span>
              <CameraStatusChip cam={featured} />
            </div>
            <div className="flex items-center gap-1.5">
              {featured.aiDetections.map((ai) => (
                <Chip key={ai} size="sm" variant="soft" color="warning">
                  <HugeiconsIcon icon={AI_META[ai].icon} size={11} />
                  <Chip.Label>{AI_META[ai].label}</Chip.Label>
                </Chip>
              ))}
              <TipIconBtn
                label={featured.muted ? 'Unmute audio' : 'Mute audio'}
                icon={featured.muted ? VolumeOffIcon : VolumeHighIcon}
                onPress={() => dispatch({ type: 'toggleCameraMute', cameraId: featured.id })}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {snap.cameras.map((cam) => {
            const active = cam.id === featured.id;
            return (
              <Button
                key={cam.id}
                variant="tertiary"
                onPress={() => dispatch({ type: 'selectCamera', cameraId: cam.id })}
                className={cn(
                  'flex h-auto items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left',
                  active && 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon
                      icon={cam.status === 'offline' ? Alert02Icon : cam.motion ? Motion01Icon : Video01Icon}
                      size={14}
                      className={
                        cam.status === 'offline'
                          ? 'text-danger'
                          : cam.motion
                            ? 'text-warning'
                            : 'text-success'
                      }
                    />
                    <span className="truncate text-xs font-semibold text-foreground">{cam.name}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-muted">{cam.lastEvent}</p>
                </div>
                <span className="shrink-0 text-[10px] font-medium text-muted tabular-nums">
                  {cam.lastEventAgo}
                </span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
