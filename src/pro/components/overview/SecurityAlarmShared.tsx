/**
 * Shared Alarm mode controls, PIN/confirmation dialogs, and Lock action row reused across the
 * Security alarm Overview widget and AlarmDetailSheet (docs/pro-ui/DESIGN.md 7.6).
 */
import { useRef, useState } from 'react';
import { AlertDialog, Badge, Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  BlindsIcon,
  DoorIcon,
  Home01Icon,
  Logout03Icon,
  Moon02Icon,
  PowerIcon,
  SecurityCheckIcon,
  Shield01Icon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  TimeQuarterPassIcon
} from '@hugeicons/core-free-icons';
import { errorMessageField } from '@/lib/errors';
import { cn } from '@/lib/utils';
import type { ProOverviewAlarmLockItem, ProOverviewAlarmModel } from '../../lib/overviewSecurity';
import type { AlarmModeId, Tone } from '../../lib/securityLogic';
import { AlarmCodeSheet } from '../security/AlarmCodeSheet';
import { HoldToConfirmButton } from '../security/HoldToConfirmButton';

export const PRO_ALARM_MODE_ICON: Record<AlarmModeId, IconSvgElement> = {
  disarmed: PowerIcon,
  armed_home: Home01Icon,
  armed_away: Logout03Icon,
  armed_night: Moon02Icon
};

export const PRO_ALARM_TONE_TILE: Record<Tone, string> = {
  default: 'bg-default text-foreground',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger'
};

export function alarmStateIcon(state: string): IconSvgElement {
  if (state === 'triggered') return Alert02Icon;
  if (state === 'arming' || state === 'pending' || state === 'disarming') return TimeQuarterPassIcon;
  if (state.startsWith('armed')) return SecurityCheckIcon;
  return Shield01Icon;
}

export function useAlarmModeController(
  model: ProOverviewAlarmModel,
  onExecuteMode: (entityId: string, mode: AlarmModeId, code?: string) => Promise<void>
) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmMode, setConfirmMode] = useState<AlarmModeId | null>(null);
  const [codeMode, setCodeMode] = useState<AlarmModeId | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const confirmOpenedAt = useRef(0);

  const send = async (mode: AlarmModeId, code?: string) => {
    if (!model.panel) return;
    setBusy(true);
    setError(null);
    try {
      await onExecuteMode(model.panel.entity_id, mode, code);
      setCodeMode(null);
    } catch (e) {
      const msg = errorMessageField(e) || 'Home Assistant rejected the alarm change';
      if (code) setCodeError(msg);
      else setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const proceed = (mode: AlarmModeId) => {
    if (model.needsCodeFor(mode)) {
      setCodeError(null);
      setCodeMode(mode);
    } else {
      void send(mode);
    }
  };

  const selectMode = (mode: AlarmModeId) => {
    if (!model.panel || mode === model.state) return;
    if (model.shouldConfirmArming(mode)) {
      confirmOpenedAt.current = performance.now();
      setConfirmMode(mode);
    } else {
      proceed(mode);
    }
  };

  const confirmArmAnyway = () => {
    if (performance.now() - confirmOpenedAt.current < 400 || !confirmMode) return;
    const mode = confirmMode;
    setConfirmMode(null);
    proceed(mode);
  };

  const cancelConfirm = () => setConfirmMode(null);
  const cancelCode = () => setCodeMode(null);
  const submitCode = (code: string) => {
    if (codeMode) void send(codeMode, code);
  };

  return {
    busy,
    error,
    confirmMode,
    codeMode,
    codeError,
    selectMode,
    confirmArmAnyway,
    cancelConfirm,
    cancelCode,
    submitCode
  };
}

export function ProAlarmModeSegmented({
  model,
  busy,
  onSelectMode,
  compact = false
}: {
  model: ProOverviewAlarmModel;
  busy: boolean;
  onSelectMode: (mode: AlarmModeId) => void;
  compact?: boolean;
}) {
  return (
    <div data-card-click="ignore" onPointerDown={(e) => e.stopPropagation()}>
      <ToggleButtonGroup
        aria-label="Alarm mode"
        size={compact ? 'sm' : 'md'}
        selectionMode="single"
        disallowEmptySelection
        fullWidth
        isDisabled={busy || !model.panel || model.state === 'unavailable'}
        selectedKeys={model.currentMode ? new Set([model.currentMode]) : new Set()}
        onSelectionChange={(keys) => {
          const next = [...keys][0] as AlarmModeId | undefined;
          if (next) onSelectMode(next);
        }}
      >
        {model.modes.map((m) => (
          <ToggleButton
            key={m.id}
            id={m.id}
            aria-label={m.id === 'disarmed' ? 'Disarm' : `Arm ${m.label}`}
            className={cn(
              'min-w-0 gap-1.5',
              compact ? 'h-9 px-2 text-xs' : 'h-auto flex-col py-2 text-xs sm:h-10 sm:flex-row sm:px-3 sm:py-0 sm:text-sm'
            )}
          >
            <HugeiconsIcon icon={PRO_ALARM_MODE_ICON[m.id]} size={compact ? 15 : 17} />
            <span>{m.label}</span>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

export function ProAlarmDialogs({
  model,
  confirmMode,
  codeMode,
  codeError,
  onConfirmArmAnyway,
  onCancelConfirm,
  onCancelCode,
  onSubmitCode
}: {
  model: ProOverviewAlarmModel;
  confirmMode: AlarmModeId | null;
  codeMode: AlarmModeId | null;
  codeError: string | null;
  onConfirmArmAnyway: () => void;
  onCancelConfirm: () => void;
  onCancelCode: () => void;
  onSubmitCode: (code: string) => void;
}) {
  const modeLabel = (id: AlarmModeId | null) =>
    id === 'disarmed' ? 'disarm' : `arm ${model.modes.find((m) => m.id === id)?.label ?? ''}`;

  return (
    <div data-card-click="ignore" onPointerDown={(e) => e.stopPropagation()}>
      <AlertDialog.Backdrop
        isOpen={confirmMode !== null}
        onOpenChange={(open) => {
          if (!open) onCancelConfirm();
        }}
      >
        <AlertDialog.Container size="sm">
          <AlertDialog.Dialog className="pro" data-page="security">
            <AlertDialog.Header>
              <AlertDialog.Icon status="warning" />
              <AlertDialog.Heading>
                {model.openingsCount === 1
                  ? '1 opening is open'
                  : `${model.openingsCount} openings are open`}
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <ul className="flex flex-col gap-1.5">
                {model.openings.map((o) => (
                  <li key={o.entity_id} className="flex items-center gap-2 text-sm">
                    <HugeiconsIcon
                      icon={o.attributes?.device_class === 'window' ? BlindsIcon : DoorIcon}
                      size={16}
                      className="text-warning"
                    />
                    <span>{o.name || o.entity_id}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-muted">
                Arm {model.modes.find((m) => m.id === confirmMode)?.label} anyway?
              </p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="tertiary" onPress={onCancelConfirm}>
                Cancel
              </Button>
              <Button variant="primary" onPress={onConfirmArmAnyway}>
                <HugeiconsIcon icon={SecurityCheckIcon} size={16} />
                Arm anyway
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>

      <AlarmCodeSheet
        isOpen={codeMode !== null}
        actionLabel={modeLabel(codeMode)}
        numeric={model.codeIsNumeric}
        error={codeError}
        onCancel={onCancelCode}
        onSubmit={onSubmitCode}
      />
    </div>
  );
}

export function ProAlarmLockRow({
  lock,
  onSetLockState
}: {
  lock: ProOverviewAlarmLockItem;
  onSetLockState: (entityId: string, service: 'lock' | 'unlock') => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  const run = async (service: 'lock' | 'unlock') => {
    setBusy(true);
    try {
      await onSetLockState(lock.entityId, service);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="flex items-center justify-between gap-2.5 rounded-xl bg-default/45 px-3 py-2"
      data-card-click="ignore"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-lg',
            lock.isJammed
              ? 'bg-danger/15 text-danger'
              : lock.isUnlocked
                ? 'bg-warning/15 text-warning'
                : 'bg-success/15 text-success'
          )}
        >
          <HugeiconsIcon
            icon={lock.isUnlocked ? SquareUnlock02Icon : SquareLock02Icon}
            size={15}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-foreground">{lock.shortName}</p>
          <p className="truncate text-[11px] text-muted">{lock.roomName}</p>
        </div>
      </div>

      {lock.isOffline || lock.isJammed ? (
        <Badge
          size="sm"
          variant="soft"
          color={lock.badgeTone}
          className="static transform-none! min-h-5 min-w-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
        >
          <Badge.Label>{lock.stateLabel}</Badge.Label>
        </Badge>
      ) : lock.isUnlocked ? (
        <Button
          size="sm"
          variant="primary"
          isPending={busy}
          aria-label={`Lock ${lock.name}`}
          onPress={() => void run('lock')}
        >
          <HugeiconsIcon icon={SquareLock02Icon} size={14} />
          Lock
        </Button>
      ) : (
        <HoldToConfirmButton
          icon={SquareUnlock02Icon}
          label="Unlock"
          ariaLabel={`Unlock ${lock.name} (press and hold)`}
          isPending={busy}
          onConfirm={() => void run('unlock')}
        />
      )}
    </div>
  );
}
