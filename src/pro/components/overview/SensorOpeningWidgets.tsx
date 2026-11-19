/**
 * Pro Overview Openings & Safety Sensor widget card body (`doors`, `windows`, `motion`, `leak`,
 * `smoke`) across 1x, 2x, and 2x2 sizes (docs/pro-ui/DESIGN.md 7.6, Option 2): calm .pro-surface
 * HeroUI cards with green/orange/red status semantics and Magic UI BorderBeam on active water leak
 * or smoke hazards.
 */
import { useState } from 'react';
import { Badge, Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  AlarmSmokeIcon,
  Alert02Icon,
  ArrowUpRight01Icon,
  BlindsIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  DoorIcon,
  DropletIcon,
  Home01Icon,
  Motion01Icon,
  WifiDisconnected01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type {
  ProOverviewSensorDomain,
  ProOverviewSensorDomainModel,
  ProOverviewSensorItem
} from '../../lib/overviewSecurity';
import type { ProWidgetSize } from '../../lib/overviewWidgets';
import { BorderBeam } from '../../ui/magicui/BorderBeam';

export const SENSOR_DOMAIN_ICON: Record<ProOverviewSensorDomain, IconSvgElement> = {
  doors: DoorIcon,
  windows: BlindsIcon,
  motion: Motion01Icon,
  leak: DropletIcon,
  smoke: AlarmSmokeIcon
};

export function sensorStateBadgeIcon(item: ProOverviewSensorItem): IconSvgElement {
  if (item.isOffline) return WifiDisconnected01Icon;
  if (item.isActive) return Alert02Icon;
  return CheckmarkCircle02Icon;
}

interface SensorDomainWidgetBodyProps {
  model: ProOverviewSensorDomainModel;
  size: ProWidgetSize;
  onOpenSheet: (domain: ProOverviewSensorDomain) => void;
}

export function SensorDomainWidgetBody({
  model,
  size,
  onOpenSheet
}: SensorDomainWidgetBodyProps) {
  const [onlyActive, setOnlyActive] = useState(false);
  const DomainIcon = SENSOR_DOMAIN_ICON[model.domain];
  const HeaderBadgeIcon =
    model.isCriticalHazard || model.hasWarning ? Alert02Icon : CheckmarkCircle02Icon;

  if (model.totalCount === 0) {
    return (
      <div className="relative z-[1] flex items-center justify-between gap-2 rounded-xl bg-default/40 p-3">
        <span className="inline-flex items-center gap-2 text-xs text-muted">
          <HugeiconsIcon icon={DomainIcon} size={15} className="shrink-0" />
          <span>{model.subtitleText}</span>
        </span>
        <Badge
          size="sm"
          variant="soft"
          color="success"
          className="static transform-none! min-h-5 min-w-0 shrink-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold"
        >
          <Badge.Label>{model.badgeText}</Badge.Label>
        </Badge>
      </div>
    );
  }

  if (size === '1x') {
    return (
      <>
        {model.isCriticalHazard ? <BorderBeam colorFrom="#ef4444" colorTo="#f97316" /> : null}

        <div className="relative z-[1] flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-mono text-xl font-bold tracking-tight text-foreground">
              {model.headlineText}
            </p>
            <Badge
              size="sm"
              variant="soft"
              color={model.badgeTone}
              className="static transform-none! min-h-5 min-w-0 shrink-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
            >
              <HugeiconsIcon icon={HeaderBadgeIcon} size={11} />
              <Badge.Label>{model.badgeText}</Badge.Label>
            </Badge>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-default">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                model.isCriticalHazard
                  ? 'bg-danger'
                  : model.hasWarning
                    ? 'bg-warning'
                    : 'bg-success'
              )}
              style={{ width: `${model.activeCount > 0 ? Math.max(12, model.activeRatioPct) : 100}%` }}
            />
          </div>

          <p className="truncate text-xs text-muted">{model.subtitleText}</p>
        </div>
      </>
    );
  }

  if (size === '2x') {
    const preview = model.items.slice(0, 3);
    return (
      <>
        {model.isCriticalHazard ? <BorderBeam colorFrom="#ef4444" colorTo="#f97316" /> : null}

        <div className="relative z-[1] flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xl font-bold tracking-tight text-foreground">
                {model.headlineText}
              </span>
              <span className="text-xs text-muted">
                {model.totalCount} {model.totalCount === 1 ? 'sensor' : 'sensors'}
              </span>
            </div>

            <Badge
              size="sm"
              variant="soft"
              color={model.badgeTone}
              className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
            >
              <HugeiconsIcon icon={HeaderBadgeIcon} size={11} />
              <Badge.Label>{model.badgeText}</Badge.Label>
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2 @md:grid-cols-3">
            {preview.map((item) => {
              const StateIcon = sensorStateBadgeIcon(item);
              return (
                <div
                  key={item.entityId}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl px-2.5 py-2',
                    item.badgeTone === 'danger'
                      ? 'bg-danger/12'
                      : item.badgeTone === 'warning'
                        ? 'bg-warning/12'
                        : 'bg-default/50'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{item.shortName}</p>
                    <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[10px] text-muted">
                      <HugeiconsIcon icon={Home01Icon} size={10} className="shrink-0" />
                      <span className="truncate">{item.roomName}</span>
                    </p>
                  </div>

                  <Badge
                    size="sm"
                    variant="soft"
                    color={item.badgeTone}
                    className="static transform-none! min-h-4.5 min-w-0 shrink-0 gap-1 rounded-full border-0 px-1.5 py-0 text-[10px] font-semibold [&_svg]:size-2.5!"
                  >
                    <HugeiconsIcon icon={StateIcon} size={10} />
                    <Badge.Label>{item.stateLabel}</Badge.Label>
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  const visiblePool = onlyActive ? model.activeItems : model.items;
  const visibleItems = visiblePool.slice(0, 6);

  return (
    <>
      {model.isCriticalHazard ? <BorderBeam colorFrom="#ef4444" colorTo="#f97316" /> : null}

      <div className="relative z-[1] flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl font-bold tracking-tight text-foreground">
              {model.headlineText}
            </span>
            <Badge
              size="sm"
              variant="soft"
              color={model.badgeTone}
              className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
            >
              <HugeiconsIcon icon={HeaderBadgeIcon} size={11} />
              <Badge.Label>{model.badgeText}</Badge.Label>
            </Badge>
          </div>

          <div onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
            <ToggleButtonGroup
              aria-label={`Filter ${model.title}`}
              size="sm"
              isDetached
              selectionMode="single"
              disallowEmptySelection
              selectedKeys={new Set([onlyActive ? 'active' : 'all'])}
              onSelectionChange={(keys) => {
                const next = [...keys][0];
                if (next) setOnlyActive(next === 'active');
              }}
            >
              <ToggleButton id="all" className="gap-1 px-2 text-xs">
                <HugeiconsIcon icon={DomainIcon} size={12} />
                All ({model.totalCount})
              </ToggleButton>
              <ToggleButton id="active" className="gap-1 px-2 text-xs">
                <HugeiconsIcon icon={Alert02Icon} size={12} />
                Active ({model.activeCount})
              </ToggleButton>
            </ToggleButtonGroup>
          </div>
        </div>

        {visibleItems.length === 0 ? (
          <div className="rounded-xl bg-default/40 p-4 text-center text-xs text-muted">
            All sensors in {model.title.toLowerCase()} are clear right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 @md:grid-cols-2">
            {visibleItems.map((item) => {
              const StateIcon = sensorStateBadgeIcon(item);
              return (
                <div
                  key={item.entityId}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl px-3 py-2',
                    item.badgeTone === 'danger'
                      ? 'bg-danger/12'
                      : item.badgeTone === 'warning'
                        ? 'bg-warning/12'
                        : 'bg-default/50'
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-foreground">{item.name}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <HugeiconsIcon icon={Home01Icon} size={10} />
                        {item.roomName}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <HugeiconsIcon icon={Clock01Icon} size={10} />
                        {item.lastChangedText}
                      </span>
                    </p>
                  </div>

                  <Badge
                    size="sm"
                    variant="soft"
                    color={item.badgeTone}
                    className="static transform-none! min-h-5 min-w-0 shrink-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold [&_svg]:size-2.5!"
                  >
                    <HugeiconsIcon icon={StateIcon} size={10} />
                    <Badge.Label>{item.stateLabel}</Badge.Label>
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        <div
          className="mt-auto flex items-center justify-between pt-0.5"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-muted">
            {model.totalCount > visibleItems.length
              ? `Showing ${visibleItems.length} of ${model.totalCount} sensors`
              : `${model.totalCount} monitored`}
          </span>
          <Button size="sm" variant="tertiary" onPress={() => onOpenSheet(model.domain)}>
            Inspect all
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} />
          </Button>
        </div>
      </div>
    </>
  );
}
