import { useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  AlarmSmokeIcon,
  BatteryFullIcon,
  BatteryLowIcon,
  BatteryMedium01Icon,
  BlindsIcon,
  Car01Icon,
  CheckmarkCircle02Icon,
  DoorIcon,
  DropletIcon,
  GarageIcon,
  Megaphone01Icon,
  MegaphoneOffIcon,
  Motion01Icon,
  PackageIcon,
  PawPrintIcon,
  SecurityCheckIcon,
  Shield01Icon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  TimeQuarterPassIcon,
  User02Icon,
  WifiDisconnected01Icon
} from '@hugeicons/core-free-icons';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { errorMessageField } from '@/lib/errors';
import { cn } from '@/lib/utils';
import {
  LOW_BATTERY_THRESHOLD,
  type ActivityEvent,
  type DeviceItem,
  type DeviceKind,
  type Tone
} from '../../lib/securityLogic';
import { entityName } from '../../hooks/useSecurityData';
import { HoldToConfirmButton } from './HoldToConfirmButton';
import { TONE_TILE } from './AlarmHero';

export const KIND_ICON: Record<DeviceKind, IconSvgElement> = {
  lock: SquareLock02Icon,
  garage: GarageIcon,
  door: DoorIcon,
  window: BlindsIcon,
  motion: Motion01Icon,
  leak: DropletIcon,
  smoke: AlarmSmokeIcon,
  siren: Megaphone01Icon
};

export const KIND_LABEL: Record<DeviceKind, string> = {
  lock: 'Lock',
  garage: 'Garage / gate',
  door: 'Door',
  window: 'Window',
  motion: 'Motion sensor',
  leak: 'Leak sensor',
  smoke: 'Smoke alarm',
  siren: 'Siren'
};

const CHIP_COLOR: Record<Tone, 'default' | 'success' | 'warning' | 'danger'> = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  danger: 'danger'
};

/** Semantic Hugeicons glyph for a timeline event (unlocked, armed, triggered, person/pet, etc.). */
export function activityEventIcon(e: ActivityEvent): IconSvgElement {
  if (e.detection === 'person') return User02Icon;
  if (e.detection === 'pet' || e.detection === 'animal') return PawPrintIcon;
  if (e.detection === 'vehicle') return Car01Icon;
  if (e.detection === 'package') return PackageIcon;
  if (e.kind === 'alarm') {
    if (e.tone === 'danger') return Alert02Icon;
    if (e.tone === 'success') return SecurityCheckIcon;
    if (e.tone === 'warning') return TimeQuarterPassIcon;
    return Shield01Icon;
  }
  if (e.kind === 'lock') {
    if (e.tone === 'danger') return Alert02Icon;
    if (e.tone === 'warning') return SquareUnlock02Icon;
    return SquareLock02Icon;
  }
  if (e.kind === 'siren') {
    return e.tone === 'default' ? MegaphoneOffIcon : Megaphone01Icon;
  }
  return KIND_ICON[e.kind];
}

const TRANSITION_LABELS = new Set(['Locking…', 'Unlocking…', 'Opening…', 'Closing…']);

/** HeroUI soft Chip with a semantic state icon (icon rule, DESIGN.md 5). */
export function StatusChip({ item, className }: { item: DeviceItem; className?: string }) {
  let icon: IconSvgElement = CheckmarkCircle02Icon;
  if (item.stateLabel === 'Offline') {
    icon = WifiDisconnected01Icon;
  } else if (item.stateLabel === 'Jammed') {
    icon = Alert02Icon;
  } else if (TRANSITION_LABELS.has(item.stateLabel)) {
    icon = TimeQuarterPassIcon;
  } else if (item.kind === 'lock' && item.problem) {
    icon = SquareUnlock02Icon;
  } else if (item.tone === 'warning' || item.tone === 'danger') {
    icon = KIND_ICON[item.kind];
  }
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

/** Tap to close an open garage/gate, press and hold to open. */
export function GarageAction({
  item,
  onError
}: {
  item: DeviceItem;
  onError: (m: string | null) => void;
}) {
  const callHAService = useAutoLayoutStore((s) => s.callHAService);
  const [busy, setBusy] = useState(false);
  const name = entityName(item.entity);
  const run = async (service: 'close_cover' | 'open_cover') => {
    setBusy(true);
    onError(null);
    try {
      await callHAService('cover', service, {}, { entity_id: item.entity.entity_id });
    } catch (e) {
      onError(errorMessageField(e) || `Could not control ${name}`);
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
        aria-label={`Close ${name}`}
        onPress={() => run('close_cover')}
      >
        <HugeiconsIcon icon={GarageIcon} size={16} />
        Close
      </Button>
    );
  }
  return (
    <HoldToConfirmButton
      icon={GarageIcon}
      label="Open"
      ariaLabel={`Open ${name} (press and hold)`}
      isPending={busy}
      onConfirm={() => run('open_cover')}
    />
  );
}

/** Tap to silence a sounding siren, press and hold to test when idle. */
export function SirenAction({
  item,
  onError
}: {
  item: DeviceItem;
  onError: (m: string | null) => void;
}) {
  const callHAService = useAutoLayoutStore((s) => s.callHAService);
  const [busy, setBusy] = useState(false);
  const name = entityName(item.entity);
  const run = async (service: 'turn_off' | 'turn_on') => {
    setBusy(true);
    onError(null);
    try {
      await callHAService('siren', service, {}, { entity_id: item.entity.entity_id });
    } catch (e) {
      onError(errorMessageField(e) || `Could not control ${name}`);
    } finally {
      setBusy(false);
    }
  };
  if (item.entity.state === 'unavailable') return null;
  if (item.problem) {
    return (
      <Button
        size="sm"
        variant="danger"
        isPending={busy}
        aria-label={`Silence ${name}`}
        onPress={() => run('turn_off')}
      >
        <HugeiconsIcon icon={MegaphoneOffIcon} size={16} />
        Silence
      </Button>
    );
  }
  return (
    <HoldToConfirmButton
      icon={Megaphone01Icon}
      label="Test"
      ariaLabel={`Test ${name} (press and hold)`}
      isPending={busy}
      onConfirm={() => run('turn_on')}
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
  const isGarage = item.kind === 'garage';
  const isSiren = item.kind === 'siren';
  const icon = isLock && item.problem ? SquareUnlock02Icon : KIND_ICON[item.kind];
  const sub = secondary === 'type' ? KIND_LABEL[item.kind] : item.entity.area?.name;
  const tileTone = isLock || isGarage || isSiren || item.tone !== 'success' ? item.tone : 'default';
  const hasBattery = typeof batteryPct === 'number' && Number.isFinite(batteryPct);
  const batteryIcon =
    hasBattery && batteryPct < LOW_BATTERY_THRESHOLD
      ? BatteryLowIcon
      : hasBattery && batteryPct < 60
        ? BatteryMedium01Icon
        : BatteryFullIcon;
  const batteryToneClass =
    hasBattery && batteryPct < 10
      ? 'text-danger'
      : hasBattery && batteryPct < LOW_BATTERY_THRESHOLD
        ? 'text-warning'
        : 'text-muted';

  const infoContent = (
    <>
      <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', TONE_TILE[tileTone])}>
        <HugeiconsIcon icon={icon} size={18} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col text-left">
        <span className="truncate text-sm font-medium text-foreground">{entityName(item.entity)}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          {sub ? <span className="truncate">{sub}</span> : null}
          {sub && hasBattery ? <span aria-hidden="true">·</span> : null}
          {hasBattery ? (
            <span className={cn('inline-flex shrink-0 items-center gap-0.5 font-mono', batteryToneClass)}>
              <HugeiconsIcon icon={batteryIcon} size={12} />
              {batteryPct}%
            </span>
          ) : null}
        </span>
      </span>
    </>
  );

  let trailing = <StatusChip item={item} className="shrink-0" />;
  if (isLock && (item.stateLabel === 'Locked' || item.stateLabel === 'Unlocked')) {
    trailing = <LockAction item={item} onError={onError} />;
  } else if (isGarage && (item.stateLabel === 'Open' || item.stateLabel === 'Closed')) {
    trailing = <GarageAction item={item} onError={onError} />;
  } else if (isSiren && (item.stateLabel === 'Sounding' || item.stateLabel === 'Idle')) {
    trailing = <SirenAction item={item} onError={onError} />;
  }

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
      {trailing}
    </li>
  );
}
