/**
 * Vacuums Detail Sheet for pro Overview (docs/pro-ui/DESIGN.md 7.6, Option A): ProSheet (Drawer on
 * phones, Modal lg on desktop) with fleet summary banner, room-grouped vacuum cards, semantic status
 * & battery Badges, battery bar, suction mode ToggleButtonGroup, and Clean/Pause/Dock/Locate buttons.
 */
import { Badge, Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CleanIcon,
  FastWindIcon,
  Home01Icon,
  Location01Icon,
  PauseIcon,
  PlayIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProVacuumsModel } from '../../lib/overviewAppliances';
import { ProSheet } from '../ProSheet';
import { vacuumBatteryIcon } from './FansVacuumWidgets';

interface VacuumsDetailSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  model: ProVacuumsModel;
  onAction: (entityId: string, action: 'start' | 'pause' | 'return_to_base' | 'locate') => void;
  onChangeSuction: (entityId: string, speed: string) => void;
}

export function VacuumsDetailSheet({
  isOpen,
  onOpenChange,
  model,
  onAction,
  onChangeSuction
}: VacuumsDetailSheetProps) {
  return (
    <ProSheet
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title="Robot Vacuums"
      subtitle={model.subtitleText}
      icon={CleanIcon}
      page="overview"
      size="lg"
    >
      <div className="flex flex-col gap-3.5 pb-2">
        <div className="pro-surface flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <span className="pro-soft grid size-10 shrink-0 place-items-center rounded-xl">
              <HugeiconsIcon icon={CleanIcon} size={20} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {model.cleaningCount > 0
                  ? `${model.cleaningCount} robot${model.cleaningCount === 1 ? '' : 's'} actively cleaning`
                  : `${model.totalCount} robot${model.totalCount === 1 ? '' : 's'} docked & ready`}
              </p>
              <p className="text-xs text-muted">{model.subtitleText}</p>
            </div>
          </div>

          <Badge
            size="sm"
            variant="soft"
            color={model.badgeTone}
            className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2.5 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
          >
            <HugeiconsIcon icon={CleanIcon} size={11} />
            <Badge.Label>{model.badgeText}</Badge.Label>
          </Badge>
        </div>

        {model.items.length === 0 ? (
          <div className="pro-surface flex flex-col items-center gap-2 p-6 text-center">
            <HugeiconsIcon icon={CleanIcon} size={22} className="text-muted" />
            <p className="text-sm font-semibold text-foreground">No vacuums connected</p>
            <p className="text-xs text-muted">Connect a Home Assistant vacuum entity to manage it here.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {model.items.map((vac) => {
              const BatteryIcon = vacuumBatteryIcon(vac);
              const canPause = vac.isCleaning;

              return (
                <section
                  key={vac.entityId}
                  aria-label={vac.name}
                  className="pro-surface flex flex-col gap-3 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{vac.name}</p>
                      <p className="mt-0.5 inline-flex max-w-full items-center gap-1.5 truncate text-xs text-muted">
                        <HugeiconsIcon icon={Home01Icon} size={12} className="shrink-0 text-[var(--accent)]" />
                        <span className="truncate">{vac.statusLabel}</span>
                        <span>· {vac.roomName}</span>
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <Badge
                        size="sm"
                        variant="soft"
                        color={vac.badgeTone}
                        className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
                      >
                        <HugeiconsIcon icon={CleanIcon} size={11} />
                        <Badge.Label>{vac.badgeText}</Badge.Label>
                      </Badge>
                      {vac.batteryPct !== null ? (
                        <Badge
                          size="sm"
                          variant="soft"
                          color={vac.batteryTone}
                          className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
                        >
                          <HugeiconsIcon icon={BatteryIcon} size={11} />
                          <Badge.Label className="font-mono">{vac.batteryPct}%</Badge.Label>
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  {vac.batteryPct !== null ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] text-muted">
                        <span>Battery level</span>
                        <span className="font-mono font-semibold text-foreground">
                          {vac.batteryPct}%{vac.batteryCharging ? ' · Charging' : ''}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-default">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
                            vac.batteryTone === 'danger'
                              ? 'bg-danger'
                              : vac.batteryTone === 'warning'
                                ? 'bg-warning'
                                : 'bg-success'
                          )}
                          style={{ width: `${vac.batteryPct}%` }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {(vac.cleanedAreaM2 !== undefined || vac.cleaningTimeMinutes !== undefined) ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-default/50 px-3 py-2">
                        <p className="text-[11px] text-muted">Cleaned area</p>
                        <p className="font-mono text-xs font-semibold text-foreground">
                          {vac.cleanedAreaM2 !== undefined ? `${vac.cleanedAreaM2} m²` : '—'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-default/50 px-3 py-2">
                        <p className="text-[11px] text-muted">Session time</p>
                        <p className="font-mono text-xs font-semibold text-foreground">
                          {vac.cleaningTimeMinutes !== undefined ? `${vac.cleaningTimeMinutes} min` : '—'}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {vac.fanSpeedList.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-muted">Suction power</span>
                      <ToggleButtonGroup
                        aria-label={`Suction mode for ${vac.name}`}
                        size="sm"
                        isDetached
                        selectionMode="single"
                        disallowEmptySelection
                        selectedKeys={new Set([vac.fanSpeed || vac.fanSpeedList[0]])}
                        onSelectionChange={(keys) => {
                          const next = [...keys][0];
                          if (next) onChangeSuction(vac.entityId, String(next));
                        }}
                        className="flex-wrap"
                      >
                        {vac.fanSpeedList.slice(0, 4).map((speed) => (
                          <ToggleButton key={speed} id={speed} className="gap-1.5 px-2.5 text-xs">
                            <HugeiconsIcon icon={FastWindIcon} size={12} />
                            {speed}
                          </ToggleButton>
                        ))}
                      </ToggleButtonGroup>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant={canPause ? 'secondary' : 'primary'}
                      onPress={() => onAction(vac.entityId, canPause ? 'pause' : 'start')}
                    >
                      <HugeiconsIcon icon={canPause ? PauseIcon : PlayIcon} size={14} />
                      {canPause ? 'Pause' : 'Start cleaning'}
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      isDisabled={vac.isDocked || vac.isReturning}
                      onPress={() => onAction(vac.entityId, 'return_to_base')}
                    >
                      <HugeiconsIcon icon={Home01Icon} size={14} />
                      Return to dock
                    </Button>
                    <Button size="sm" variant="tertiary" onPress={() => onAction(vac.entityId, 'locate')}>
                      <HugeiconsIcon icon={Location01Icon} size={14} />
                      Locate
                    </Button>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </ProSheet>
  );
}
