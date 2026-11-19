import { useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  AlarmSmokeIcon,
  Alert02Icon,
  ArrowUpRight01Icon,
  BatteryLowIcon,
  DoorIcon,
  GarageIcon,
  Megaphone01Icon,
  SecurityCheckIcon,
  SquareLock02Icon,
  SquareUnlock02Icon,
  WifiDisconnected01Icon
} from '@hugeicons/core-free-icons';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { errorMessageField } from '@/lib/errors';
import { cn } from '@/lib/utils';
import type { ResolvedEntity } from '@/types';
import {
  entityName,
  type LowBatteryDevice,
  type OfflineSecurityDevice
} from '../../hooks/useSecurityData';
import { deviceItem, kindRank, type DeviceItem } from '../../lib/securityLogic';
import { BorderBeam } from '../../ui/magicui/BorderBeam';
import { ProSheet } from '../ProSheet';
import { DeviceRow, KIND_ICON } from './DeviceRow';

interface AttentionCardProps {
  hazards: ResolvedEntity[];
  activeSirens?: ResolvedEntity[];
  jammedLocks?: ResolvedEntity[];
  openDoors: ResolvedEntity[];
  openWindows: ResolvedEntity[];
  openGarages?: ResolvedEntity[];
  unlockedLocks: ResolvedEntity[];
  deviceBatteryByEntityId?: Record<string, number>;
  lowBatteryDevices?: LowBatteryDevice[];
  offlineDevices?: OfflineSecurityDevice[];
  onError: (m: string | null) => void;
  onSelectDevice?: (item: DeviceItem) => void;
}

interface SummaryChipItem {
  id: string;
  label: string;
  color: 'danger' | 'warning';
  icon: IconSvgElement;
}

/**
 * Compact "Needs attention" summary card (DESIGN.md 7.5): keeps active security alerts distinct
 * from background Device health (offline / low battery) so offline sensors never masquerade as
 * active break-in alerts, while opening the full interactive list inside a ProSheet.
 */
export function AttentionCard({
  hazards,
  activeSirens = [],
  jammedLocks = [],
  openDoors,
  openWindows,
  openGarages = [],
  unlockedLocks,
  deviceBatteryByEntityId = {},
  lowBatteryDevices = [],
  offlineDevices = [],
  onError,
  onSelectDevice
}: AttentionCardProps) {
  const callHAService = useAutoLayoutStore((s) => s.callHAService);
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const items: DeviceItem[] = [
    ...hazards.map((e) => deviceItem(e, e.attributes?.device_class === 'smoke' ? 'smoke' : 'leak')),
    ...activeSirens.map((e) => deviceItem(e, 'siren')),
    ...jammedLocks.map((e) => deviceItem(e, 'lock')),
    ...unlockedLocks.map((e) => deviceItem(e, 'lock')),
    ...openGarages.map((e) => deviceItem(e, 'garage')),
    ...openDoors.map((e) => deviceItem(e, 'door')),
    ...openWindows.map((e) => deviceItem(e, 'window'))
  ].sort((a, b) => kindRank(a.kind) - kindRank(b.kind));

  const securityCount = items.length;
  const healthCount = offlineDevices.length + lowBatteryDevices.length;
  const hasCritical = hazards.length > 0 || jammedLocks.length > 0 || activeSirens.length > 0;
  const hasHealthIssues = healthCount > 0;
  const securableCount = unlockedLocks.length + openGarages.length;
  const hasBothLockAndGarage = unlockedLocks.length > 0 && openGarages.length > 0;

  const secureLabel = hasBothLockAndGarage
    ? 'Secure home'
    : openGarages.length >= 2 && unlockedLocks.length === 0
      ? 'Close all'
      : 'Lock all';

  const healthParts: string[] = [];
  if (offlineDevices.length > 0) healthParts.push(`${offlineDevices.length} offline`);
  if (lowBatteryDevices.length > 0) healthParts.push(`${lowBatteryDevices.length} low battery`);
  const healthSummary = healthParts.join(' · ');

  const secureHome = async () => {
    setBusy(true);
    onError(null);
    try {
      const jobs: Promise<unknown>[] = [];
      if (unlockedLocks.length > 0) {
        jobs.push(
          callHAService('lock', 'lock', {}, { entity_id: unlockedLocks.map((l) => l.entity_id) })
        );
      }
      if (openGarages.length > 0) {
        jobs.push(
          callHAService(
            'cover',
            'close_cover',
            {},
            { entity_id: openGarages.map((g) => g.entity_id) }
          )
        );
      }
      await Promise.all(jobs);
    } catch (e) {
      onError(errorMessageField(e) || 'Could not secure all entries');
    } finally {
      setBusy(false);
    }
  };

  const handleInspect = (item: DeviceItem) => {
    setSheetOpen(false);
    onSelectDevice?.(item);
  };

  const sheetTitle = securityCount > 0 ? 'Needs attention' : 'Device health';
  const sheetSubtitle =
    securityCount > 0
      ? healthCount > 0
        ? `${securityCount} security · ${healthSummary}`
        : securityCount === 1
          ? '1 security item requires review'
          : `${securityCount} security items require review`
      : healthSummary;

  const sheet = (
    <ProSheet
      isOpen={sheetOpen}
      onOpenChange={setSheetOpen}
      title={sheetTitle}
      subtitle={sheetSubtitle}
      icon={securityCount > 0 ? Alert02Icon : WifiDisconnected01Icon}
      page="security"
      size="md"
    >
      <div className="flex flex-col gap-4">
        {securableCount >= 2 ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted">
              {securableCount} entries can be secured automatically.
            </span>
            <Button
              size="sm"
              variant="primary"
              isPending={busy}
              onPress={() => void secureHome()}
            >
              <HugeiconsIcon icon={SquareLock02Icon} size={15} />
              {secureLabel}
            </Button>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="pro-surface px-4 py-1.5">
            <ul className="flex flex-col divide-y divide-separator">
              {items.map((item) => (
                <DeviceRow
                  key={item.entity.entity_id}
                  item={item}
                  secondary="area"
                  batteryPct={deviceBatteryByEntityId[item.entity.entity_id]}
                  onError={onError}
                  onSelect={handleInspect}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {hasHealthIssues ? (
          <div className="pro-surface flex flex-col gap-2 px-4 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Device health · {healthCount}
            </span>
            <ul className="-my-1.5 flex flex-col divide-y divide-separator">
              {offlineDevices.map(({ entity, kind }) => (
                <li key={`off-${entity.entity_id}`} className="flex items-center gap-3 py-2.5">
                  <Button
                    variant="ghost"
                    aria-label={`Inspect ${entityName(entity)}`}
                    className="-mx-1.5 flex h-auto min-w-0 flex-1 items-center justify-start gap-3 rounded-xl px-1.5 py-1 hover:bg-default/45"
                    onPress={() => handleInspect(deviceItem(entity, kind))}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-danger/15 text-danger">
                      <HugeiconsIcon icon={KIND_ICON[kind]} size={18} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col text-left">
                      <span className="truncate text-sm font-medium text-foreground">
                        {entityName(entity)}
                      </span>
                      {entity.area?.name ? (
                        <span className="truncate text-xs text-muted">{entity.area.name}</span>
                      ) : null}
                    </span>
                  </Button>
                  <Chip size="sm" variant="soft" color="danger" className="shrink-0">
                    <HugeiconsIcon icon={WifiDisconnected01Icon} size={12} />
                    Offline
                  </Chip>
                </li>
              ))}
              {lowBatteryDevices.map(({ entity, kind, batteryPct }) => (
                <li key={`batt-${entity.entity_id}`} className="flex items-center gap-3 py-2.5">
                  <Button
                    variant="ghost"
                    aria-label={`Inspect ${entityName(entity)}`}
                    className="-mx-1.5 flex h-auto min-w-0 flex-1 items-center justify-start gap-3 rounded-xl px-1.5 py-1 hover:bg-default/45"
                    onPress={() => handleInspect(deviceItem(entity, kind))}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning">
                      <HugeiconsIcon icon={KIND_ICON[kind]} size={18} />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col text-left">
                      <span className="truncate text-sm font-medium text-foreground">
                        {entityName(entity)}
                      </span>
                      {entity.area?.name ? (
                        <span className="truncate text-xs text-muted">{entity.area.name}</span>
                      ) : null}
                    </span>
                  </Button>
                  <Chip size="sm" variant="soft" color="warning" className="shrink-0 font-mono">
                    <HugeiconsIcon icon={BatteryLowIcon} size={12} />
                    {batteryPct}%
                  </Chip>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </ProSheet>
  );

  // Calm "All secure" state whenever there are no active security alerts.
  // Any offline or low-battery devices appear as an understated Device health footer button.
  if (securityCount === 0) {
    return (
      <>
        <section
          aria-label="Needs attention"
          className="pro-surface flex flex-col justify-between gap-3 px-4 py-3 lg:p-5"
        >
          <div className="flex items-center gap-3 lg:flex-1 lg:flex-col lg:justify-center lg:gap-2 lg:text-center">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-success/15 text-success lg:size-12 lg:rounded-2xl">
              <HugeiconsIcon icon={SecurityCheckIcon} size={20} className="lg:size-6" />
            </span>
            <span className="flex min-w-0 flex-col lg:items-center lg:gap-1">
              <h2 className="text-sm font-semibold lg:text-base">All secure</h2>
              <p className="truncate text-xs text-muted lg:max-w-64 lg:whitespace-normal lg:text-sm">
                Doors and windows closed, locks locked, no hazards.
              </p>
            </span>
          </div>

          {hasHealthIssues ? (
            <Button
              size="sm"
              variant="tertiary"
              className="w-full justify-between px-3 text-xs text-muted"
              onPress={() => setSheetOpen(true)}
            >
              <span className="inline-flex min-w-0 items-center gap-1.5 truncate">
                <HugeiconsIcon
                  icon={offlineDevices.length > 0 ? WifiDisconnected01Icon : BatteryLowIcon}
                  size={14}
                  className="shrink-0 text-muted"
                />
                <span className="truncate font-medium text-foreground">Device health</span>
                <span className="truncate text-muted">· {healthSummary}</span>
              </span>
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} className="shrink-0" />
            </Button>
          ) : null}
        </section>
        {sheet}
      </>
    );
  }

  const summaryChips: SummaryChipItem[] = [];
  if (hazards.length > 0) {
    summaryChips.push({
      id: 'hazards',
      label: hazards.length === 1 ? '1 hazard' : `${hazards.length} hazards`,
      color: 'danger',
      icon: AlarmSmokeIcon
    });
  }
  if (activeSirens.length > 0) {
    summaryChips.push({
      id: 'sirens',
      label: activeSirens.length === 1 ? '1 siren' : `${activeSirens.length} sirens`,
      color: 'danger',
      icon: Megaphone01Icon
    });
  }
  if (jammedLocks.length > 0) {
    summaryChips.push({
      id: 'jammed',
      label: jammedLocks.length === 1 ? '1 jammed' : `${jammedLocks.length} jammed`,
      color: 'danger',
      icon: SquareUnlock02Icon
    });
  }
  if (unlockedLocks.length > 0) {
    summaryChips.push({
      id: 'locks',
      label: unlockedLocks.length === 1 ? '1 unlocked' : `${unlockedLocks.length} unlocked`,
      color: 'warning',
      icon: SquareUnlock02Icon
    });
  }
  if (openGarages.length > 0) {
    summaryChips.push({
      id: 'garages',
      label: openGarages.length === 1 ? '1 garage open' : `${openGarages.length} garages open`,
      color: 'warning',
      icon: GarageIcon
    });
  }
  const openEntryCount = openDoors.length + openWindows.length;
  if (openEntryCount > 0) {
    summaryChips.push({
      id: 'openings',
      label: openEntryCount === 1 ? '1 open' : `${openEntryCount} open`,
      color: 'warning',
      icon: DoorIcon
    });
  }

  return (
    <>
      <section
        aria-label="Needs attention"
        className="pro-surface relative flex min-w-0 flex-col justify-between gap-4 overflow-hidden p-5"
      >
        {hasCritical ? (
          <BorderBeam colorFrom="var(--danger)" colorTo="#fb7185" duration={3.5} borderWidth={2} />
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className={cn(
                'grid size-12 shrink-0 place-items-center rounded-2xl',
                hasCritical ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning'
              )}
            >
              <HugeiconsIcon icon={Alert02Icon} size={24} />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="font-mono text-2xl font-bold leading-tight tracking-tight text-foreground">
                {securityCount}
              </span>
              <h2 className="truncate text-sm font-semibold text-foreground">
                {securityCount === 1 ? 'Item needs attention' : 'Items need attention'}
              </h2>
            </div>
          </div>

          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label="Review all items needing attention"
            className="shrink-0 text-muted"
            onPress={() => setSheetOpen(true)}
          >
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={17} />
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {summaryChips.map((chip) => (
              <Chip key={chip.id} size="sm" variant="soft" color={chip.color}>
                <HugeiconsIcon icon={chip.icon} size={12} />
                {chip.label}
              </Chip>
            ))}
          </div>

          {hasHealthIssues ? (
            <p className="inline-flex items-center gap-1.5 text-xs text-muted">
              <HugeiconsIcon
                icon={offlineDevices.length > 0 ? WifiDisconnected01Icon : BatteryLowIcon}
                size={13}
                className="shrink-0"
              />
              <span className="truncate">Device health · {healthSummary}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="tertiary"
            className="flex-1"
            onPress={() => setSheetOpen(true)}
          >
            <HugeiconsIcon icon={Alert02Icon} size={15} />
            Review {securityCount === 1 && !hasHealthIssues ? 'item' : 'all'}
          </Button>
          {securableCount >= 2 ? (
            <Button
              size="sm"
              variant="primary"
              isPending={busy}
              onPress={() => void secureHome()}
            >
              <HugeiconsIcon icon={SquareLock02Icon} size={15} />
              {secureLabel}
            </Button>
          ) : null}
        </div>
      </section>
      {sheet}
    </>
  );
}
