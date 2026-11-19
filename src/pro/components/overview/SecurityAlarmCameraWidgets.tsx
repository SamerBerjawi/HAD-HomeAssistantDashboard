/**
 * Pro Overview Security Alarm & Cameras widget card bodies across 1x, 2x, and 2x2 sizes
 * (docs/pro-ui/DESIGN.md 7.6, Option 2): calm .pro-surface HeroUI cards with state-tinted
 * alarm status, Magic UI BorderBeam when triggered, inline mode controls, HoldToConfirmButton lock
 * rows, and ProCameraPlayer snapshots/streams.
 */
import { useRef, useState } from 'react';
import { Badge, Button, ScrollShadow } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert02Icon,
  Camera01Icon,
  Clock01Icon,
  FullScreenIcon,
  Home01Icon,
  Location01Icon,
  Motion01Icon,
  PowerIcon,
  SecurityCheckIcon,
  Shield01Icon,
  ShieldUserIcon,
  SquareLock02Icon,
  Video01Icon,
  VideoOffIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { captureAndDownloadSnapshot } from '@/services/cameraIntegrationService';
import type { ProOverviewAlarmModel, ProOverviewCamerasModel } from '../../lib/overviewSecurity';
import type { AlarmModeId } from '../../lib/securityLogic';
import type { ProWidgetSize } from '../../lib/overviewWidgets';
import { BorderBeam } from '../../ui/magicui/BorderBeam';
import type { CameraStreamStatus } from '../../hooks/useWebRtcCamera';
import { ProCameraPlayer, type ProCameraPlayerHandle } from '../security/ProCameraPlayer';
import {
  alarmStateIcon,
  PRO_ALARM_TONE_TILE,
  ProAlarmDialogs,
  ProAlarmLockRow,
  ProAlarmModeSegmented,
  useAlarmModeController
} from './SecurityAlarmShared';

interface SecurityAlarmWidgetBodyProps {
  model: ProOverviewAlarmModel;
  size: ProWidgetSize;
  onExecuteMode: (entityId: string, mode: AlarmModeId, code?: string) => Promise<void>;
  onSetLockState: (entityId: string, service: 'lock' | 'unlock') => Promise<void>;
  onLockAll: () => Promise<void>;
  onOpenOpenings: () => void;
}

export function SecurityAlarmWidgetBody({
  model,
  size,
  onExecuteMode,
  onSetLockState,
  onLockAll,
  onOpenOpenings
}: SecurityAlarmWidgetBodyProps) {
  const controller = useAlarmModeController(model, onExecuteMode);
  const StateIcon = alarmStateIcon(model.state);

  if (!model.panel) {
    return (
      <div className="relative z-[1] flex items-center gap-2 rounded-xl bg-default/40 p-3 text-xs text-muted">
        <HugeiconsIcon icon={Shield01Icon} size={16} className="shrink-0" />
        <span>No alarm control panel configured</span>
      </div>
    );
  }

  const quickTarget: AlarmModeId =
    model.isArmed || model.isTriggered ? 'disarmed' : 'armed_home';
  const quickLabel = quickTarget === 'disarmed' ? 'Disarm' : 'Arm home';
  const QuickIcon = quickTarget === 'disarmed' ? PowerIcon : SecurityCheckIcon;

  return (
    <>
      {model.isTriggered ? <BorderBeam colorFrom="var(--danger)" colorTo="var(--warning)" /> : null}

      <div className="relative z-[1] flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className={cn(
                'grid size-10 shrink-0 place-items-center rounded-xl',
                PRO_ALARM_TONE_TILE[model.tone],
                model.isTriggered && 'animate-pulse'
              )}
            >
              <HugeiconsIcon icon={StateIcon} size={20} />
            </span>

            <div className="min-w-0">
              <p className="truncate text-base font-bold tracking-tight text-foreground">
                {model.stateLabel}
              </p>
              <p className="truncate text-xs text-muted">{model.panelName}</p>
            </div>
          </div>

          {size !== '1x' ? (
            <Badge
              size="sm"
              variant="soft"
              color={model.tone}
              className="static transform-none! min-h-5 min-w-0 shrink-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
            >
              <HugeiconsIcon icon={StateIcon} size={11} />
              <Badge.Label>{model.stateLabel}</Badge.Label>
            </Badge>
          ) : null}
        </div>

        {(model.changedBy || model.changedAgoText || model.openingsCount > 0) ? (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted">
            {model.changedBy ? (
              <span className="inline-flex items-center gap-1">
                <HugeiconsIcon icon={ShieldUserIcon} size={12} />
                {model.changedBy}
              </span>
            ) : null}
            {model.changedAgoText ? (
              <span className="inline-flex items-center gap-1">
                <HugeiconsIcon icon={Clock01Icon} size={12} />
                {model.changedAgoText}
              </span>
            ) : null}
            {model.openingsCount > 0 ? (
              <div data-card-click="ignore" onPointerDown={(e) => e.stopPropagation()}>
                <Button size="sm" variant="tertiary" className="h-6 px-2 text-[11px]" onPress={onOpenOpenings}>
                  <HugeiconsIcon icon={Alert02Icon} size={12} className="text-warning" />
                  <span>{model.openingsCount} open</span>
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {controller.error ? (
          <p role="alert" className="text-xs font-medium text-danger">
            {controller.error}
          </p>
        ) : null}

        {size === '1x' ? (
          <div
            className="flex items-center justify-between gap-2 pt-0.5"
            data-card-click="ignore"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant={model.isTriggered ? 'danger' : model.isArmed ? 'secondary' : 'primary'}
              isPending={controller.busy}
              className="flex-1"
              onPress={() => controller.selectMode(quickTarget)}
            >
              <HugeiconsIcon icon={QuickIcon} size={14} />
              {quickLabel}
            </Button>
            {model.unlockedLocksCount > 0 ? (
              <Button size="sm" variant="tertiary" onPress={() => void onLockAll()}>
                <HugeiconsIcon icon={SquareLock02Icon} size={13} />
                Lock ({model.unlockedLocksCount})
              </Button>
            ) : null}
          </div>
        ) : (
          <ProAlarmModeSegmented
            model={model}
            busy={controller.busy}
            onSelectMode={controller.selectMode}
            compact={size === '2x'}
          />
        )}

        {size === '2x2' && model.locks.length > 0 ? (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <HugeiconsIcon icon={SquareLock02Icon} size={13} className="text-[var(--accent)]" />
                Door locks ({model.locks.length})
              </span>
              {model.unlockedLocksCount > 0 ? (
                <div data-card-click="ignore" onPointerDown={(e) => e.stopPropagation()}>
                  <Button size="sm" variant="primary" onPress={() => void onLockAll()}>
                    <HugeiconsIcon icon={SquareLock02Icon} size={13} />
                    Lock all ({model.unlockedLocksCount})
                  </Button>
                </div>
              ) : (
                <span className="text-[11px] font-medium text-success">All locked</span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-1.5 @md:grid-cols-2">
              {model.locks.slice(0, 4).map((lock) => (
                <ProAlarmLockRow
                  key={lock.entityId}
                  lock={lock}
                  onSetLockState={onSetLockState}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <ProAlarmDialogs
        model={model}
        confirmMode={controller.confirmMode}
        codeMode={controller.codeMode}
        codeError={controller.codeError}
        onConfirmArmAnyway={controller.confirmArmAnyway}
        onCancelConfirm={controller.cancelConfirm}
        onCancelCode={controller.cancelCode}
        onSubmitCode={controller.submitCode}
      />
    </>
  );
}

interface CamerasWidgetBodyProps {
  model: ProOverviewCamerasModel;
  size: ProWidgetSize;
  serverUrl: string;
  onSelectCamera: (entityId: string) => void;
}

export function CamerasWidgetBody({
  model,
  size,
  serverUrl,
  onSelectCamera
}: CamerasWidgetBodyProps) {
  const playerRef = useRef<ProCameraPlayerHandle>(null);
  const [streamStatus, setStreamStatus] = useState<CameraStreamStatus>('idle');
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const featured = model.featuredCamera;

  if (!featured) {
    return (
      <div className="relative z-[1] flex items-center gap-2 rounded-xl bg-default/40 p-3 text-xs text-muted">
        <HugeiconsIcon icon={Video01Icon} size={16} className="shrink-0" />
        <span>{model.subtitleText}</span>
      </div>
    );
  }

  const handleSnapshot = async () => {
    setSnapshotError(null);
    const ok = await captureAndDownloadSnapshot(
      playerRef.current?.video ?? null,
      featured.entity,
      serverUrl
    );
    if (!ok) setSnapshotError('No live frame ready to save yet');
  };

  return (
    <div className="relative z-[1] flex flex-col gap-2.5">
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <ProCameraPlayer
          key={`${featured.entityId}-${size}`}
          ref={playerRef}
          camera={featured.entity}
          live={size === '2x2'}
          onStatus={setStreamStatus}
          className="absolute inset-0 size-full"
        />
        {featured.isOffline ? (
          <div className="absolute inset-0 grid place-items-center bg-black/55 text-white/75">
            <HugeiconsIcon icon={VideoOffIcon} size={26} />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{featured.name}</p>
          <p className="inline-flex max-w-full items-center gap-1 truncate text-xs text-muted">
            <HugeiconsIcon icon={Home01Icon} size={11} className="shrink-0" />
            <span className="truncate">{featured.roomName}</span>
            {featured.lastMotionText ? <span>· {featured.lastMotionText}</span> : null}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Badge
            size="sm"
            variant="soft"
            color={featured.isOffline ? 'danger' : featured.hasMotion ? 'warning' : 'success'}
            className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
          >
            <HugeiconsIcon
              icon={featured.isOffline ? VideoOffIcon : featured.hasMotion ? Motion01Icon : Video01Icon}
              size={11}
            />
            <Badge.Label>
              {featured.isOffline
                ? 'Offline'
                : featured.hasMotion
                  ? 'Motion'
                  : size === '2x2' && streamStatus === 'live'
                    ? 'Live'
                    : 'Ready'}
            </Badge.Label>
          </Badge>

          {size === '2x2' ? (
            <div
              className="flex items-center gap-1"
              data-card-click="ignore"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                aria-label={`Save snapshot from ${featured.name}`}
                isDisabled={streamStatus !== 'live'}
                onPress={() => void handleSnapshot()}
              >
                <HugeiconsIcon icon={Camera01Icon} size={14} />
              </Button>
              <Button
                isIconOnly
                size="sm"
                variant="tertiary"
                aria-label={`Fullscreen ${featured.name}`}
                onPress={() => playerRef.current?.enterFullscreen()}
              >
                <HugeiconsIcon icon={FullScreenIcon} size={14} />
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {snapshotError ? <p className="text-xs text-warning">{snapshotError}</p> : null}

      {size !== '1x' && model.cameras.length > 1 ? (
        <ScrollShadow
          orientation="horizontal"
          hideScrollBar
          className="flex items-center gap-1.5 pb-0.5"
          data-card-click="ignore"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {model.cameras.map((cam) => {
            const selected = cam.entityId === featured.entityId;
            return (
              <Button
                key={cam.entityId}
                size="sm"
                variant={selected ? 'primary' : 'tertiary'}
                className="shrink-0 whitespace-nowrap"
                onPress={() => onSelectCamera(cam.entityId)}
              >
                <HugeiconsIcon icon={cam.hasMotion ? Motion01Icon : Location01Icon} size={12} />
                <span>{cam.name}</span>
              </Button>
            );
          })}
        </ScrollShadow>
      ) : null}
    </div>
  );
}
