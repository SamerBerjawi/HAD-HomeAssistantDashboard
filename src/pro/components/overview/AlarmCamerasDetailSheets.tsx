/**
 * Alarm & Cameras Detail Sheets for pro Overview (docs/pro-ui/DESIGN.md 7.6, Option A):
 * ProSheet (Drawer on phones, Modal lg on desktop) reusing ProCameraPlayer, HoldToConfirmButton,
 * AlarmCodeSheet, and shared ProAlarmModeSegmented / ProAlarmLockRow.
 */
import { useRef, useState } from 'react';
import { Badge, Button, ListBox, Select } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert02Icon,
  BlindsIcon,
  Camera01Icon,
  Clock01Icon,
  DoorIcon,
  FullScreenIcon,
  Home01Icon,
  Motion01Icon,
  Shield01Icon,
  ShieldUserIcon,
  SquareLock02Icon,
  Video01Icon,
  VideoOffIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { captureAndDownloadSnapshot } from '@/services/cameraIntegrationService';
import type { ProOverviewAlarmModel, ProOverviewCamerasModel } from '../../lib/overviewSecurity';
import { alarmStateLabel, type AlarmModeId } from '../../lib/securityLogic';
import { BorderBeam } from '../../ui/magicui/BorderBeam';
import type { CameraStreamStatus } from '../../hooks/useWebRtcCamera';
import { ProCameraPlayer, type ProCameraPlayerHandle } from '../security/ProCameraPlayer';
import { ProSheet } from '../ProSheet';
import {
  alarmStateIcon,
  PRO_ALARM_TONE_TILE,
  ProAlarmDialogs,
  ProAlarmLockRow,
  ProAlarmModeSegmented,
  useAlarmModeController
} from './SecurityAlarmShared';

interface AlarmDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  model: ProOverviewAlarmModel;
  onSelectPanel: (entityId: string) => void;
  onExecuteMode: (entityId: string, mode: AlarmModeId, code?: string) => Promise<void>;
  onSetLockState: (entityId: string, service: 'lock' | 'unlock') => Promise<void>;
  onLockAll: () => Promise<void>;
  onInspectOpenings: () => void;
}

export function AlarmDetailSheet({
  isOpen,
  onOpenChange,
  model,
  onSelectPanel,
  onExecuteMode,
  onSetLockState,
  onLockAll,
  onInspectOpenings
}: AlarmDetailSheetProps) {
  const controller = useAlarmModeController(model, onExecuteMode);
  const StateIcon = alarmStateIcon(model.state);

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Security & Alarm"
      subtitle={model.panel ? `${model.panelName} · ${model.stateLabel}` : 'No alarm panel found'}
      icon={StateIcon}
      page="overview"
      size="lg"
    >
      <div className="flex flex-col gap-3.5 pb-2">
        {model.panels.length > 1 && model.panel ? (
          <div className="pro-surface flex flex-col gap-1.5 p-3.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
              <HugeiconsIcon icon={Shield01Icon} size={14} className="text-[var(--accent)]" />
              Alarm control panel
            </span>
            <Select
              aria-label="Alarm control panel"
              selectedKey={model.panel.entity_id}
              onSelectionChange={(key) => {
                if (key) onSelectPanel(String(key));
              }}
            >
              <Select.Trigger className="h-9 min-h-9 gap-2 px-3 text-xs">
                <HugeiconsIcon icon={Shield01Icon} size={14} className="shrink-0 text-muted" />
                <Select.Value className="flex min-w-0 flex-1 items-center justify-between gap-2 pr-6">
                  {({ selectedText }) => (
                    <span className="truncate font-medium text-foreground">
                      {selectedText || model.panelName}
                    </span>
                  )}
                </Select.Value>
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover className="pro" data-page="overview">
                <ListBox>
                  {model.panels.map((p) => {
                    const label = (p.name || p.entity_id).replace(/Homz/gi, 'HAD');
                    return (
                      <ListBox.Item key={p.entity_id} id={p.entity_id} textValue={label}>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate font-medium">{label}</span>
                          <span className="text-xs text-muted">{alarmStateLabel(p.state)}</span>
                        </span>
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    );
                  })}
                </ListBox>
              </Select.Popover>
            </Select>
          </div>
        ) : null}

        {model.panel ? (
          <section
            aria-label="Alarm panel controls"
            className="pro-surface relative flex flex-col gap-4 overflow-hidden p-4 sm:p-5"
          >
            {model.isTriggered ? <BorderBeam colorFrom="#ef4444" colorTo="#f97316" /> : null}

            <div className="relative z-[1] flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    'grid size-13 shrink-0 place-items-center rounded-2xl',
                    PRO_ALARM_TONE_TILE[model.tone],
                    model.isTriggered && 'animate-pulse'
                  )}
                >
                  <HugeiconsIcon icon={StateIcon} size={26} />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-foreground">{model.stateLabel}</h3>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted">
                    <span>{model.panelName}</span>
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
                  </div>
                </div>
              </div>

              <Badge
                size="sm"
                variant="soft"
                color={model.tone}
                className="static transform-none! min-h-5 min-w-0 shrink-0 rounded-full border-0 px-2.5 py-0.5 text-[11px] font-semibold"
              >
                <Badge.Label>
                  {model.isTriggered
                    ? 'Alert'
                    : model.isArmed
                      ? 'Armed'
                      : model.isTransitioning
                        ? 'Pending'
                        : 'Off'}
                </Badge.Label>
              </Badge>
            </div>

            {controller.error ? (
              <p role="alert" className="relative z-[1] text-xs font-medium text-danger">
                {controller.error}
              </p>
            ) : null}

            <div className="relative z-[1]">
              <ProAlarmModeSegmented
                model={model}
                busy={controller.busy}
                onSelectMode={controller.selectMode}
              />
            </div>
          </section>
        ) : null}

        {model.openingsCount > 0 ? (
          <section aria-label="Open entries" className="pro-surface flex flex-col gap-2.5 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                <HugeiconsIcon icon={Alert02Icon} size={15} className="text-warning" />
                Open before arming ({model.openingsCount})
              </span>
              <Button size="sm" variant="tertiary" onPress={onInspectOpenings}>
                Inspect sensors
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {model.openings.map((o) => (
                <div
                  key={o.entity_id}
                  className="flex items-center gap-2 rounded-xl bg-warning/10 px-3 py-2 text-xs font-medium text-foreground"
                >
                  <HugeiconsIcon
                    icon={o.attributes?.device_class === 'window' ? BlindsIcon : DoorIcon}
                    size={14}
                    className="shrink-0 text-warning"
                  />
                  <span className="truncate">{o.name || o.entity_id}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {model.locks.length > 0 ? (
          <section aria-label="Door locks" className="pro-surface flex flex-col gap-2.5 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground">
                <HugeiconsIcon icon={SquareLock02Icon} size={15} className="text-[var(--accent)]" />
                Door locks ({model.locks.length})
              </span>
              {model.unlockedLocksCount > 0 ? (
                <Button size="sm" variant="primary" onPress={() => void onLockAll()}>
                  <HugeiconsIcon icon={SquareLock02Icon} size={13} />
                  Lock all ({model.unlockedLocksCount})
                </Button>
              ) : (
                <Badge
                  size="sm"
                  variant="soft"
                  color="success"
                  className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
                >
                  <Badge.Label>All locked</Badge.Label>
                </Badge>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              {model.locks.map((lock) => (
                <ProAlarmLockRow
                  key={lock.entityId}
                  lock={lock}
                  onSetLockState={onSetLockState}
                />
              ))}
            </div>
          </section>
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
    </ProSheet>
  );
}

interface CamerasDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  model: ProOverviewCamerasModel;
  serverUrl: string;
  onSelectCamera: (entityId: string) => void;
}

export function CamerasDetailSheet({
  isOpen,
  onOpenChange,
  model,
  serverUrl,
  onSelectCamera
}: CamerasDetailSheetProps) {
  const playerRef = useRef<ProCameraPlayerHandle>(null);
  const [streamStatus, setStreamStatus] = useState<CameraStreamStatus>('idle');
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const featured = model.featuredCamera;

  const handleSnapshot = async () => {
    if (!featured) return;
    setSnapshotError(null);
    const ok = await captureAndDownloadSnapshot(
      playerRef.current?.video ?? null,
      featured.entity,
      serverUrl
    );
    if (!ok) setSnapshotError(`No live frame from ${featured.name} ready to save yet`);
  };

  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Cameras"
      subtitle={model.subtitleText}
      icon={Video01Icon}
      page="overview"
      size="lg"
    >
      <div className="flex flex-col gap-4 pb-2">
        {!featured ? (
          <div className="pro-surface flex flex-col items-center gap-2 p-6 text-center">
            <HugeiconsIcon icon={Video01Icon} size={22} className="text-muted" />
            <p className="text-sm font-semibold text-foreground">No surveillance cameras configured</p>
            <p className="text-xs text-muted">
              Add RTSP / go2rtc camera sources in Settings to view live streams and snapshots.
            </p>
          </div>
        ) : (
          <>
            <section aria-label={featured.name} className="pro-surface flex flex-col gap-3 p-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
                <ProCameraPlayer
                  key={featured.entityId}
                  ref={playerRef}
                  camera={featured.entity}
                  live={isOpen}
                  onStatus={setStreamStatus}
                  className="absolute inset-0 size-full"
                />
                {featured.isOffline ? (
                  <div className="absolute inset-0 grid place-items-center bg-black/55 text-white/75">
                    <HugeiconsIcon icon={VideoOffIcon} size={32} />
                  </div>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-foreground">{featured.name}</h3>
                  <p className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <HugeiconsIcon icon={Home01Icon} size={12} />
                    <span>{featured.roomName}</span>
                    {featured.lastMotionText ? <span>· {featured.lastMotionText}</span> : null}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge
                    size="sm"
                    variant="soft"
                    color={featured.isOffline ? 'danger' : featured.hasMotion ? 'warning' : 'success'}
                    className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2.5 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
                  >
                    <HugeiconsIcon
                      icon={
                        featured.isOffline
                          ? VideoOffIcon
                          : featured.hasMotion
                            ? Motion01Icon
                            : Video01Icon
                      }
                      size={11}
                    />
                    <Badge.Label>
                      {featured.isOffline
                        ? 'Offline'
                        : featured.hasMotion
                          ? 'Motion'
                          : streamStatus === 'live'
                            ? 'Live'
                            : 'Snapshot'}
                    </Badge.Label>
                  </Badge>

                  <Button
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    aria-label="Save snapshot"
                    isDisabled={streamStatus !== 'live'}
                    onPress={() => void handleSnapshot()}
                  >
                    <HugeiconsIcon icon={Camera01Icon} size={15} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="tertiary"
                    aria-label="Fullscreen camera"
                    onPress={() => playerRef.current?.enterFullscreen()}
                  >
                    <HugeiconsIcon icon={FullScreenIcon} size={15} />
                  </Button>
                </div>
              </div>

              {snapshotError ? <p className="text-xs text-warning">{snapshotError}</p> : null}
            </section>

            {model.cameras.length > 1 ? (
              <div className="flex flex-col gap-2">
                <p className="px-0.5 text-xs font-semibold text-muted">
                  All cameras ({model.totalCount})
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {model.cameras.map((cam) => {
                    const selected = cam.entityId === featured.entityId;
                    return (
                      <Button
                        key={cam.entityId}
                        variant={selected ? 'secondary' : 'tertiary'}
                        className={cn(
                          'h-auto flex-col items-stretch gap-2 rounded-2xl p-2.5 text-left',
                          selected && 'ring-1 ring-[var(--accent)]'
                        )}
                        onPress={() => onSelectCamera(cam.entityId)}
                      >
                        <span className="relative block aspect-video w-full overflow-hidden rounded-xl bg-black">
                          <ProCameraPlayer
                            camera={cam.entity}
                            live={false}
                            className="pointer-events-none absolute inset-0 size-full"
                          />
                        </span>
                        <span className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-xs font-semibold text-foreground">
                            {cam.name}
                          </span>
                          <Badge
                            size="sm"
                            variant="soft"
                            color={cam.isOffline ? 'danger' : cam.hasMotion ? 'warning' : 'default'}
                            className="static transform-none! min-h-4.5 min-w-0 shrink-0 rounded-full border-0 px-1.5 py-0 text-[10px] font-semibold"
                          >
                            <Badge.Label>
                              {cam.isOffline ? 'Offline' : cam.hasMotion ? 'Motion' : cam.roomName}
                            </Badge.Label>
                          </Badge>
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </ProSheet>
  );
}
