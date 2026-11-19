import { useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert02Icon,
  BatteryLowIcon,
  SecurityCheckIcon,
  SquareLock02Icon,
  WifiDisconnected01Icon
} from '@hugeicons/core-free-icons';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { errorMessageField } from '@/lib/errors';
import type { ResolvedEntity } from '@/types';
import {
  entityName,
  type LowBatteryDevice,
  type OfflineSecurityDevice
} from '../../hooks/useSecurityData';
import { deviceItem, kindRank, type DeviceItem } from '../../lib/securityLogic';
import { BorderBeam } from '../../ui/magicui/BorderBeam';
import { DeviceRow, KIND_ICON } from './DeviceRow';

interface AttentionCardProps {
  hazards: ResolvedEntity[];
  jammedLocks?: ResolvedEntity[];
  openDoors: ResolvedEntity[];
  openWindows: ResolvedEntity[];
  unlockedLocks: ResolvedEntity[];
  lowBatteryDevices?: LowBatteryDevice[];
  offlineDevices?: OfflineSecurityDevice[];
  onError: (m: string | null) => void;
  onSelectDevice?: (item: DeviceItem) => void;
}

/**
 * "Needs attention" (DESIGN.md 7.5): hazards & jammed locks first (with BorderBeam pulse),
 * then unlocked locks and openings; Lock all from two unlocked locks; plus a compact Device health
 * footer for offline sensors and low-battery devices (< 20%).
 */
export function AttentionCard({
  hazards,
  jammedLocks = [],
  openDoors,
  openWindows,
  unlockedLocks,
  lowBatteryDevices = [],
  offlineDevices = [],
  onError,
  onSelectDevice
}: AttentionCardProps) {
  const callHAService = useAutoLayoutStore((s) => s.callHAService);
  const [busy, setBusy] = useState(false);

  const items: DeviceItem[] = [
    ...hazards.map((e) => deviceItem(e, e.attributes?.device_class === 'smoke' ? 'smoke' : 'leak')),
    ...jammedLocks.map((e) => deviceItem(e, 'lock')),
    ...unlockedLocks.map((e) => deviceItem(e, 'lock')),
    ...openDoors.map((e) => deviceItem(e, 'door')),
    ...openWindows.map((e) => deviceItem(e, 'window'))
  ].sort((a, b) => kindRank(a.kind) - kindRank(b.kind));

  const hasCritical = hazards.length > 0 || jammedLocks.length > 0;
  const hasHealthIssues = offlineDevices.length > 0 || lowBatteryDevices.length > 0;

  const lockAll = async () => {
    setBusy(true);
    onError(null);
    try {
      await callHAService('lock', 'lock', {}, { entity_id: unlockedLocks.map((l) => l.entity_id) });
    } catch (e) {
      onError(errorMessageField(e) || 'Could not lock everything');
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0 && !hasHealthIssues) {
    return (
      <section
        aria-label="Needs attention"
        className="pro-surface flex items-center gap-3 px-4 py-3 lg:flex-col lg:justify-center lg:gap-2 lg:p-6 lg:text-center"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-success/15 text-success lg:size-12 lg:rounded-2xl">
          <HugeiconsIcon icon={SecurityCheckIcon} size={20} className="lg:size-6" />
        </span>
        <span className="flex min-w-0 flex-col lg:items-center lg:gap-1">
          <h2 className="text-sm font-semibold lg:text-base">All secure</h2>
          <p className="truncate text-xs text-muted lg:max-w-64 lg:whitespace-normal lg:text-sm">
            Doors and windows closed, locks locked, no hazards.
          </p>
        </span>
      </section>
    );
  }

  return (
    <section
      aria-label="Needs attention"
      className="pro-surface @container relative flex min-w-0 flex-col gap-4 overflow-hidden p-5"
    >
      {hasCritical ? (
        <BorderBeam colorFrom="var(--danger)" colorTo="#fb7185" duration={3.5} borderWidth={2} />
      ) : null}

      <header className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-base font-semibold">
          <HugeiconsIcon
            icon={Alert02Icon}
            size={18}
            className={hasCritical ? 'text-danger' : 'text-warning'}
          />
          Needs attention
          <span className="text-sm font-normal text-muted">
            · {items.length + offlineDevices.length + lowBatteryDevices.length}
          </span>
        </h2>
        {unlockedLocks.length >= 2 && (
          <Button size="sm" variant="primary" isPending={busy} onPress={lockAll}>
            <HugeiconsIcon icon={SquareLock02Icon} size={16} />
            Lock all
          </Button>
        )}
      </header>

      {items.length > 0 ? (
        <ul className="-my-2.5 flex flex-col divide-y divide-separator">
          {items.map((item) => (
            <DeviceRow
              key={item.entity.entity_id}
              item={item}
              secondary="area"
              onError={onError}
              onSelect={onSelectDevice}
            />
          ))}
        </ul>
      ) : null}

      {hasHealthIssues ? (
        <div className="flex flex-col gap-2 border-t border-separator pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Device health
          </span>
          <ul className="-my-2 flex flex-col divide-y divide-separator">
            {offlineDevices.map(({ entity, kind }) => (
              <li key={`off-${entity.entity_id}`} className="flex items-center gap-3 py-2.5">
                <Button
                  variant="ghost"
                  aria-label={`Inspect ${entityName(entity)}`}
                  className="-mx-1.5 flex h-auto min-w-0 flex-1 items-center justify-start gap-3 rounded-xl px-1.5 py-1 hover:bg-default/45"
                  onPress={() => onSelectDevice?.(deviceItem(entity, kind))}
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
                  onPress={() => onSelectDevice?.(deviceItem(entity, kind))}
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
    </section>
  );
}
