import { useState } from 'react';
import { Button, Chip } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Alert02Icon,
  ArrowUpRight01Icon,
  BatteryLowIcon,
  DoorIcon,
  Shield01Icon,
  SquareLock02Icon,
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
import { deviceItem, kindRank, type DeviceItem, type Tone } from '../../lib/securityLogic';
import { BorderBeam } from '../../ui/magicui/BorderBeam';
import { ProSheet } from '../ProSheet';
import { DeviceRow, GarageAction, KIND_ICON, LockAction, SirenAction } from './DeviceRow';

type RadarZoneId = 'locks' | 'entries' | 'hazards' | 'health';

const TONE_COLOR: Record<Tone, string> = {
  default: 'var(--accent)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)'
};

interface AttentionCardProps {
  totalLocks?: number;
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

/**
 * Needs Attention — Concept B · Perimeter Radar Matrix (DESIGN.md 7.5, SECURITY.md §3):
 * 2×2 visual zone status grid (Locks, Entries, Hazards, Health) lighting up green/orange/red
 * with click-to-inspect inline drilldown, bulk Lock all / Secure home action, and full ProSheet.
 */
export function AttentionCard({
  totalLocks,
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
  const [selectedZone, setSelectedZone] = useState<RadarZoneId | null>(null);

  const lockIssues: DeviceItem[] = [
    ...jammedLocks.map((e) => deviceItem(e, 'lock')),
    ...unlockedLocks.map((e) => deviceItem(e, 'lock'))
  ];
  const entryIssues: DeviceItem[] = [
    ...openGarages.map((e) => deviceItem(e, 'garage')),
    ...openDoors.map((e) => deviceItem(e, 'door')),
    ...openWindows.map((e) => deviceItem(e, 'window'))
  ];
  const hazardIssues: DeviceItem[] = [
    ...hazards.map((e) => deviceItem(e, e.attributes?.device_class === 'smoke' ? 'smoke' : 'leak')),
    ...activeSirens.map((e) => deviceItem(e, 'siren'))
  ];

  const items: DeviceItem[] = [...hazardIssues, ...lockIssues, ...entryIssues].sort(
    (a, b) => kindRank(a.kind) - kindRank(b.kind)
  );

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

  const lockCount = totalLocks ?? lockIssues.length;
  const zones: {
    id: RadarZoneId;
    title: string;
    icon: IconSvgElement;
    tone: Tone;
    summary: string;
    count: number;
  }[] = [
    {
      id: 'locks',
      title: 'Locks',
      icon: SquareLock02Icon,
      tone: jammedLocks.length > 0 ? 'danger' : unlockedLocks.length > 0 ? 'warning' : 'success',
      summary:
        jammedLocks.length > 0
          ? `${jammedLocks.length} jammed`
          : unlockedLocks.length > 0
            ? `${unlockedLocks.length} unlocked`
            : lockCount > 0
              ? `${lockCount}/${lockCount} locked`
              : 'All locked',
      count: lockIssues.length
    },
    {
      id: 'entries',
      title: 'Entries',
      icon: DoorIcon,
      tone: entryIssues.length > 0 ? 'warning' : 'success',
      summary: entryIssues.length > 0 ? `${entryIssues.length} open` : 'All closed',
      count: entryIssues.length
    },
    {
      id: 'hazards',
      title: 'Hazards',
      icon: Alert02Icon,
      tone: hazardIssues.length > 0 ? 'danger' : 'success',
      summary: hazardIssues.length > 0 ? `${hazardIssues.length} active` : 'All clear',
      count: hazardIssues.length
    },
    {
      id: 'health',
      title: 'Health',
      icon: offlineDevices.length > 0 ? WifiDisconnected01Icon : BatteryLowIcon,
      tone: offlineDevices.length > 0 ? 'danger' : lowBatteryDevices.length > 0 ? 'warning' : 'success',
      summary: healthCount > 0 ? `${healthCount} alert` : '100% online',
      count: healthCount
    }
  ];

  const activeZone =
    zones.find((z) => z.id === selectedZone && z.count > 0) ?? zones.find((z) => z.count > 0) ?? null;

  const sheetTitle = securityCount > 0 ? 'Needs attention' : 'Device health';
  const sheetSubtitle =
    securityCount > 0
      ? healthCount > 0
        ? `${securityCount} security · ${healthSummary}`
        : `${securityCount} security ${securityCount === 1 ? 'item' : 'items'} require review`
      : healthSummary;

  const drilldownItems: DeviceItem[] =
    activeZone?.id === 'locks'
      ? lockIssues
      : activeZone?.id === 'entries'
        ? entryIssues
        : activeZone?.id === 'hazards'
          ? hazardIssues
          : [];

  return (
    <>
      <section
        aria-label="Needs attention"
        className="pro-surface relative flex h-full min-w-0 flex-col justify-between gap-3 overflow-hidden p-4 sm:p-5"
      >
        {hasCritical ? (
          <BorderBeam colorFrom="var(--danger)" colorTo="#fb7185" duration={3.5} borderWidth={2} />
        ) : null}

        <header className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold">
            <HugeiconsIcon
              icon={securityCount > 0 ? Alert02Icon : Shield01Icon}
              size={16}
              className={
                hasCritical
                  ? 'text-danger'
                  : securityCount > 0
                    ? 'text-warning'
                    : 'text-[var(--accent)]'
              }
            />
            Perimeter readiness
          </h2>

          <div className="flex items-center gap-1.5">
            {securableCount >= 1 ? (
              <Button
                size="sm"
                variant="primary"
                isPending={busy}
                onPress={() => void secureHome()}
                className="h-7 gap-1 rounded-full px-2.5 text-xs"
              >
                <HugeiconsIcon icon={SquareLock02Icon} size={13} />
                {secureLabel}
              </Button>
            ) : (
              <Chip size="sm" variant="soft" color={securityCount + healthCount === 0 ? 'success' : 'warning'}>
                <Chip.Label>{securityCount + healthCount === 0 ? 'Sealed' : `${securityCount + healthCount} active`}</Chip.Label>
              </Chip>
            )}

            {securityCount + healthCount > 0 ? (
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                aria-label="Review all items needing attention"
                className="size-7 min-w-0 text-muted"
                onPress={() => setSheetOpen(true)}
              >
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={15} />
              </Button>
            ) : null}
          </div>
        </header>

        <div className="grid grid-cols-2 gap-2">
          {zones.map((z) => {
            const isSelected = activeZone?.id === z.id && z.count > 0;
            return (
              <Button
                key={z.id}
                fullWidth
                variant="tertiary"
                onPress={() => setSelectedZone(z.id)}
                className={cn(
                  'flex h-auto flex-col items-start gap-1.5 rounded-2xl p-3 text-left',
                  isSelected && 'ring-2 ring-[var(--accent)]'
                )}
                style={{
                  background: `color-mix(in oklab, ${TONE_COLOR[z.tone]} 12%, var(--surface))`
                }}
              >
                <div className="flex w-full items-center justify-between">
                  <HugeiconsIcon icon={z.icon} size={16} style={{ color: TONE_COLOR[z.tone] }} />
                  <span className="size-2 rounded-full" style={{ background: TONE_COLOR[z.tone] }} />
                </div>
                <div className="min-w-0 w-full">
                  <span className="block truncate text-xs font-semibold text-foreground">{z.title}</span>
                  <span className="block truncate text-[11px] text-muted">{z.summary}</span>
                </div>
              </Button>
            );
          })}
        </div>

        {activeZone && activeZone.count > 0 ? (
          <div className="flex flex-col gap-1.5 rounded-xl bg-default/45 p-2.5 text-xs">
            {activeZone.id === 'health' ? (
              <>
                {offlineDevices.slice(0, 2).map(({ entity, kind }) => (
                  <div key={`off-${entity.entity_id}`} className="flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => handleInspect(deviceItem(entity, kind))}
                      className="h-auto min-w-0 flex-1 justify-start px-1 py-0.5 text-left text-xs font-medium"
                    >
                      <span className="truncate">{entityName(entity)}</span>
                    </Button>
                    <Chip size="sm" variant="soft" color="danger">
                      <Chip.Label>Offline</Chip.Label>
                    </Chip>
                  </div>
                ))}
                {lowBatteryDevices.slice(0, 2).map(({ entity, kind, batteryPct }) => (
                  <div key={`bat-${entity.entity_id}`} className="flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onPress={() => handleInspect(deviceItem(entity, kind))}
                      className="h-auto min-w-0 flex-1 justify-start px-1 py-0.5 text-left text-xs font-medium"
                    >
                      <span className="truncate">{entityName(entity)}</span>
                    </Button>
                    <Chip size="sm" variant="soft" color="warning">
                      <Chip.Label className="font-mono">{batteryPct}%</Chip.Label>
                    </Chip>
                  </div>
                ))}
              </>
            ) : (
              drilldownItems.slice(0, 3).map((item) => (
                <div key={item.entity.entity_id} className="flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => handleInspect(item)}
                    className="h-auto min-w-0 flex-1 justify-start px-1 py-0.5 text-left text-xs"
                  >
                    <span className="truncate font-medium text-foreground">{entityName(item.entity)}</span>
                    <span className="ml-1 shrink-0 text-muted">· {item.stateLabel}</span>
                  </Button>
                  {item.kind === 'lock' ? (
                    <LockAction item={item} onError={onError} />
                  ) : item.kind === 'garage' ? (
                    <GarageAction item={item} onError={onError} />
                  ) : item.kind === 'siren' ? (
                    <SirenAction item={item} onError={onError} />
                  ) : null}
                </div>
              ))
            )}

            {securityCount + healthCount > 3 ? (
              <Button
                size="sm"
                variant="ghost"
                onPress={() => setSheetOpen(true)}
                className="mt-0.5 h-7 self-start px-1 text-[11px] text-muted"
              >
                Review all ({securityCount + healthCount})
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} />
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>

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
              <Button size="sm" variant="primary" isPending={busy} onPress={() => void secureHome()}>
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
                        <span className="truncate text-sm font-medium text-foreground">{entityName(entity)}</span>
                        {entity.area?.name ? <span className="truncate text-xs text-muted">{entity.area.name}</span> : null}
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
                        <span className="truncate text-sm font-medium text-foreground">{entityName(entity)}</span>
                        {entity.area?.name ? <span className="truncate text-xs text-muted">{entity.area.name}</span> : null}
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
    </>
  );
}
