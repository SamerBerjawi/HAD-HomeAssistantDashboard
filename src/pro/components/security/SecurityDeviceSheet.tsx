import { HugeiconsIcon } from '@hugeicons/react';
import {
  BatteryFullIcon,
  BatteryLowIcon,
  Clock01Icon,
  Location01Icon,
  Shield01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { entityName } from '../../hooks/useSecurityData';
import { timeAgo } from '../../lib/pageSentences';
import {
  LOW_BATTERY_THRESHOLD,
  type ActivityEvent,
  type DeviceItem
} from '../../lib/securityLogic';
import { ProSheet } from '../ProSheet';
import { TONE_TILE } from './AlarmHero';
import { KIND_ICON, KIND_LABEL, LockAction, StatusChip } from './DeviceRow';

interface SecurityDeviceSheetProps {
  item: DeviceItem | null;
  batteryPct?: number;
  events: ActivityEvent[];
  onClose: () => void;
  onError: (m: string | null) => void;
}

/**
 * Device detail ProSheet opened on tapping a security device row (DESIGN.md 7.5):
 * shows state Chip, lock control, area/floor, battery health, entity ID, and 24 h history.
 */
export function SecurityDeviceSheet({
  item,
  batteryPct,
  events,
  onClose,
  onError
}: SecurityDeviceSheetProps) {
  if (!item) return null;

  const entity = item.entity;
  const name = entityName(entity);
  const icon = KIND_ICON[item.kind];
  const entityEvents = events.filter((e) => e.entityId === entity.entity_id).slice(0, 12);
  const isLowBattery = typeof batteryPct === 'number' && batteryPct < LOW_BATTERY_THRESHOLD;
  const changedAt = entity.last_changed
    ? (Date.now() - Date.parse(entity.last_changed)) / 60000
    : null;

  return (
    <ProSheet
      isOpen
      onOpenChange={(open) => !open && onClose()}
      title={name}
      subtitle={KIND_LABEL[item.kind]}
      icon={icon}
      page="security"
      size="md"
    >
      <div className="flex flex-col gap-4">
        <div className="pro-surface flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className={cn('grid size-11 shrink-0 place-items-center rounded-2xl', TONE_TILE[item.tone])}>
              <HugeiconsIcon icon={icon} size={22} />
            </span>
            <div className="flex flex-col gap-1">
              <StatusChip item={item} />
              {changedAt !== null && !Number.isNaN(changedAt) ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted">
                  <HugeiconsIcon icon={Clock01Icon} size={12} />
                  Updated {timeAgo(changedAt)}
                </span>
              ) : null}
            </div>
          </div>

          {item.kind === 'lock' &&
          (item.stateLabel === 'Locked' || item.stateLabel === 'Unlocked') ? (
            <LockAction item={item} onError={onError} />
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="pro-surface flex flex-col gap-1 p-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
              <HugeiconsIcon icon={Location01Icon} size={12} />
              Location
            </span>
            <span className="truncate text-sm font-semibold text-foreground">
              {entity.area?.name || 'Unassigned'}
            </span>
            {entity.floor?.name ? (
              <span className="truncate text-xs text-muted">{entity.floor.name}</span>
            ) : null}
          </div>

          <div className="pro-surface flex flex-col gap-1 p-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
              <HugeiconsIcon icon={isLowBattery ? BatteryLowIcon : BatteryFullIcon} size={12} />
              Battery
            </span>
            <span
              className={cn(
                'font-mono text-sm font-semibold',
                isLowBattery ? 'text-warning' : 'text-foreground'
              )}
            >
              {typeof batteryPct === 'number' ? `${batteryPct}%` : 'Mains / N/A'}
            </span>
            {isLowBattery ? (
              <span className="text-xs text-warning">Low battery</span>
            ) : null}
          </div>
        </div>

        <div className="pro-surface flex flex-col gap-2.5 p-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <HugeiconsIcon icon={Clock01Icon} size={14} className="text-[var(--accent)]" />
            24 h history
          </span>
          {entityEvents.length === 0 ? (
            <p className="inline-flex items-center gap-2 text-xs text-muted">
              <HugeiconsIcon icon={Shield01Icon} size={14} />
              No recorded state changes in the past 24 hours.
            </p>
          ) : (
            <ol className="flex flex-col gap-2.5">
              {entityEvents.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate font-medium text-foreground">{e.text}</span>
                  <time
                    dateTime={new Date(e.when).toISOString()}
                    className="shrink-0 text-muted"
                    title={new Date(e.when).toLocaleString()}
                  >
                    {timeAgo((Date.now() - e.when) / 60000)}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </div>

        <p className="truncate px-1 font-mono text-[11px] text-muted">{entity.entity_id}</p>
      </div>
    </ProSheet>
  );
}
