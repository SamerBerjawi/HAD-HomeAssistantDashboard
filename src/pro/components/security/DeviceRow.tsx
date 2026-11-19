import { useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  AlarmSmokeIcon,
  BatteryLowIcon,
  BlindsIcon,
  CheckmarkCircle02Icon,
  DoorIcon,
  DropletIcon,
  Motion01Icon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  WifiDisconnected01Icon
} from '@hugeicons/core-free-icons';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { errorMessageField } from '@/lib/errors';
import { cn } from '@/lib/utils';
import {
  LOW_BATTERY_THRESHOLD,
  type DeviceItem,
  type DeviceKind,
  type Tone
} from '../../lib/securityLogic';
import { entityName } from '../../hooks/useSecurityData';
import { HoldToConfirmButton } from './HoldToConfirmButton';
import { TONE_TILE } from './AlarmHero';

export const KIND_ICON: Record<DeviceKind, IconSvgElement> = {
  lock: SquareLock02Icon,
  door: DoorIcon,
  window: BlindsIcon,
  motion: Motion01Icon,
  leak: DropletIcon,
  smoke: AlarmSmokeIcon
};

export const KIND_LABEL: Record<DeviceKind, string> = {
  lock: 'Lock',
  door: 'Door',
  window: 'Window',
  motion: 'Motion sensor',
  leak: 'Leak sensor',
  smoke: 'Smoke alarm'
};

const CHIP_COLOR: Record<Tone, 'default' | 'success' | 'warning' | 'danger'> = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  danger: 'danger'
};

/** HeroUI soft Chip with a state icon (icon rule, DESIGN.md 5). */
export function StatusChip({ item, className }: { item: DeviceItem; className?: string }) {
  const icon =
    item.stateLabel === 'Offline'
      ? WifiDisconnected01Icon
      : item.tone === 'warning' || item.tone === 'danger'
        ? Alert02Icon
        : CheckmarkCircle02Icon;
  return (
    <Chip size="sm" variant="soft" color={CHIP_COLOR[item.tone]} className={className}>
      <HugeiconsIcon icon={icon} size={12} />
      {item.stateLabel}
    </Chip>
  );
}

/** Tap to lock, press and hold to unlock (DESIGN.md 7.5). */
export function LockAction({
  item,
  onError
}: {
  item: DeviceItem;
  onError: (m: string | null) => void;
}) {
  const callHAService = useAutoLayoutStore((s) => s.callHAService);
  const [busy, setBusy] = useState(false);
  const name = entityName(item.entity);
  const run = async (service: 'lock' | 'unlock') => {
    setBusy(true);
    onError(null);
    try {
      await callHAService('lock', service, {}, { entity_id: item.entity.entity_id });
    } catch (e) {
      onError(errorMessageField(e) || `Could not ${service} ${name}`);
    } finally {
      setBusy(false);
    }
  };
  if (item.entity.state === 'unavailable') return null;
  if (item.problem) {
    return (
      <Button
        size="sm"
        variant="primary"
        isPending={busy}
        aria-label={`Lock ${name}`}
        onPress={() => run('lock')}
      >
        <HugeiconsIcon icon={SquareLock02Icon} size={16} />
        Lock
      </Button>
    );
  }
  return (
    <HoldToConfirmButton
      icon={SquareUnlock02Icon}
      label="Unlock"
      ariaLabel={`Unlock ${name} (press and hold)`}
      isPending={busy}
      onConfirm={() => run('unlock')}
    />
  );
}

interface DeviceRowProps {
  item: DeviceItem;
  /** Second line: area (by type) or device type (by room). */
  secondary: 'area' | 'type';
  batteryPct?: number;
  onError: (m: string | null) => void;
  onSelect?: (item: DeviceItem) => void;
}

export function DeviceRow({ item, secondary, batteryPct, onError, onSelect }: DeviceRowProps) {
  const isLock = item.kind === 'lock';
  const icon = isLock && item.problem ? SquareUnlock02Icon : KIND_ICON[item.kind];
  const sub = secondary === 'type' ? KIND_LABEL[item.kind] : item.entity.area?.name;
  const tileTone = isLock || item.tone !== 'success' ? item.tone : 'default';
  const isLowBattery = typeof batteryPct === 'number' && batteryPct < LOW_BATTERY_THRESHOLD;

  const infoContent = (
    <>
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', TONE_TILE[tileTone])}>
        <HugeiconsIcon icon={icon} size={18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="truncate text-sm font-medium text-foreground">{entityName(item.entity)}</span>
        <span className="flex items-center gap-2 text-xs text-muted">
          {sub ? <span className="truncate">{sub}</span> : null}
          {isLowBattery ? (
            <span className="inline-flex shrink-0 items-center gap-0.5 font-mono text-warning">
              <HugeiconsIcon icon={BatteryLowIcon} size={12} />
              {batteryPct}%
            </span>
          ) : null}
        </span>
      </span>
    </>
  );

  return (
    <li className="flex items-center gap-3 py-2.5">
      {onSelect ? (
        <Button
          variant="ghost"
          aria-label={`Inspect ${entityName(item.entity)}`}
          className="-mx-1.5 flex h-auto min-w-0 flex-1 items-center justify-start gap-3 rounded-xl px-1.5 py-1 hover:bg-default/45"
          onPress={() => onSelect(item)}
        >
          {infoContent}
        </Button>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{infoContent}</div>
      )}
      {isLock ? (
        item.stateLabel === 'Locked' || item.stateLabel === 'Unlocked' ? (
          <LockAction item={item} onError={onError} />
        ) : (
          <StatusChip item={item} className="shrink-0" />
        )
      ) : (
        <StatusChip item={item} className="shrink-0" />
      )}
    </li>
  );
}
