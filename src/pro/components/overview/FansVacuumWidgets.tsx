/**
 * Pro Overview Fans & Airflow and Vacuums widget card bodies across 1x, 2x, and 2x2 sizes
 * (docs/pro-ui/DESIGN.md 7.6, Option 3: calm .pro-surface HeroUI Switch, Slider, Button, Badge,
 * and ToggleButtonGroup).
 */
import { useState } from 'react';
import { Badge, Button, Slider, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowUpRight01Icon,
  BatteryCharging01Icon,
  BatteryFullIcon,
  BatteryLowIcon,
  BatteryMediumIcon,
  CleanIcon,
  FastWindIcon,
  Home01Icon,
  Location01Icon,
  PauseIcon,
  PlayIcon,
  RotateClockwiseIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProFanItem, ProFansModel, ProVacuumItem, ProVacuumsModel } from '../../lib/overviewAppliances';
import type { ProWidgetSize } from '../../lib/overviewWidgets';
import { ProControlSwitch } from './ControlWidgets';

export function ProFanSpeedSlider({
  value,
  isDisabled = false,
  onCommit,
  ariaLabel
}: {
  value: number;
  isDisabled?: boolean;
  onCommit: (nextPct: number) => void;
  ariaLabel: string;
}) {
  const [draggingValue, setDraggingValue] = useState<number | null>(null);
  const current = draggingValue ?? value;

  return (
    <div
      className="flex items-center gap-2"
      data-card-click="ignore"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <HugeiconsIcon icon={FastWindIcon} size={13} className="shrink-0 text-[var(--accent)]" />
      <Slider
        aria-label={ariaLabel}
        minValue={1}
        maxValue={100}
        step={1}
        value={Math.max(1, current)}
        isDisabled={isDisabled}
        onChange={(next) => setDraggingValue(Array.isArray(next) ? next[0] : next)}
        onChangeEnd={(next) => {
          const finalVal = Array.isArray(next) ? next[0] : next;
          setDraggingValue(null);
          onCommit(finalVal);
        }}
        className="min-w-0 flex-1"
      >
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
      <span className="w-8 shrink-0 text-right font-mono text-[11px] font-semibold text-foreground">
        {Math.round(current)}%
      </span>
    </div>
  );
}

interface FansWidgetBodyProps {
  model: ProFansModel;
  size: ProWidgetSize;
  onToggleFan: (fan: ProFanItem) => void;
  onToggleBatch: (forceOn: boolean) => void;
  onChangeSpeed: (entityId: string, pct: number) => void;
  onToggleOscillate: (fan: ProFanItem) => void;
  onOpenSheet: () => void;
}

export function FansWidgetBody({
  model,
  size,
  onToggleFan,
  onToggleBatch,
  onChangeSpeed,
  onToggleOscillate,
  onOpenSheet
}: FansWidgetBodyProps) {
  const [onlyRunning, setOnlyRunning] = useState(false);
  const batchTargetOn = model.onCount === 0;

  if (model.totalCount === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-default/40 p-3 text-xs text-muted">
        <HugeiconsIcon icon={FastWindIcon} size={16} className="shrink-0" />
        <span>{model.subtitleText}</span>
      </div>
    );
  }

  if (size === '1x') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {model.onCount}
            </span>
            <span className="whitespace-nowrap font-mono text-xs font-medium text-muted">
              / {model.totalCount} on
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Badge
              size="sm"
              variant="soft"
              color={model.badgeTone}
              className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
            >
              <HugeiconsIcon icon={FastWindIcon} size={11} />
              <Badge.Label className="font-mono">{model.badgeText}</Badge.Label>
            </Badge>
            <ProControlSwitch
              isSelected={model.onCount > 0}
              onChange={() => onToggleBatch(batchTargetOn)}
              ariaLabel={model.onCount > 0 ? 'Turn all fans off' : 'Turn all fans on'}
            />
          </div>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-default">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
            style={{ width: `${model.onRatioPct}%` }}
          />
        </div>

        <p className="truncate text-xs text-muted">{model.subtitleText}</p>
      </div>
    );
  }

  if (size === '2x') {
    const preview = model.items.slice(0, 3);
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {model.onCount} / {model.totalCount}
            </span>
            <span className="text-xs text-muted">running</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              size="sm"
              variant="soft"
              color={model.badgeTone}
              className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
            >
              <HugeiconsIcon icon={FastWindIcon} size={11} />
              <Badge.Label className="font-mono">{model.badgeText}</Badge.Label>
            </Badge>
            <ProControlSwitch
              isSelected={model.onCount > 0}
              onChange={() => onToggleBatch(batchTargetOn)}
              ariaLabel={model.onCount > 0 ? 'Turn all fans off' : 'Turn all fans on'}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 @md:grid-cols-3">
          {preview.map((fan) => (
            <div
              key={fan.entityId}
              className={cn(
                'flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 transition-colors',
                fan.isOn ? 'bg-[var(--pro-accent-soft)]' : 'bg-default/50'
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{fan.shortName}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted">
                  <HugeiconsIcon icon={Home01Icon} size={10} className="shrink-0" />
                  <span className="truncate">{fan.roomName}</span>
                  {fan.isOn ? (
                    <span className="shrink-0 font-mono font-semibold text-[var(--accent)]">
                      {fan.percentage}%
                    </span>
                  ) : null}
                </div>
              </div>
              <ProControlSwitch
                isSelected={fan.isOn}
                onChange={() => onToggleFan(fan)}
                ariaLabel={`Toggle ${fan.name}`}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const visiblePool = onlyRunning ? model.onItems : model.items;
  const visibleItems = visiblePool.slice(0, 6);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
            {model.onCount} / {model.totalCount}
          </span>
          <Badge
            size="sm"
            variant="soft"
            color={model.badgeTone}
            className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
          >
            <HugeiconsIcon icon={FastWindIcon} size={11} />
            <Badge.Label className="font-mono">{model.badgeText}</Badge.Label>
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <ToggleButtonGroup
            aria-label="Filter fans"
            size="sm"
            isDetached
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([onlyRunning ? 'on' : 'all'])}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next) setOnlyRunning(next === 'on');
            }}
          >
            <ToggleButton id="all" className="gap-1 px-2 text-xs">
              <HugeiconsIcon icon={FastWindIcon} size={12} />
              All
            </ToggleButton>
            <ToggleButton id="on" className="gap-1 px-2 text-xs">
              <HugeiconsIcon icon={RotateClockwiseIcon} size={12} />
              On ({model.onCount})
            </ToggleButton>
          </ToggleButtonGroup>

          <ProControlSwitch
            isSelected={model.onCount > 0}
            onChange={() => onToggleBatch(batchTargetOn)}
            ariaLabel={model.onCount > 0 ? 'Turn all fans off' : 'Turn all fans on'}
          />
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-xl bg-default/40 p-4 text-center text-xs text-muted">
          No fans actively running right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 @md:grid-cols-2">
          {visibleItems.map((fan) => (
            <div
              key={fan.entityId}
              className={cn(
                'flex flex-col gap-2 rounded-xl p-2.5 transition-colors',
                fan.isOn ? 'bg-[var(--pro-accent-soft)]' : 'bg-default/50'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{fan.shortName}</p>
                  <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-muted">
                    <HugeiconsIcon icon={Home01Icon} size={10} className="shrink-0" />
                    <span className="truncate">{fan.roomName}</span>
                    {fan.presetMode ? (
                      <span className="shrink-0 font-medium text-foreground/75">· {fan.presetMode}</span>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {fan.supportsOscillation ? (
                    <Button
                      isIconOnly
                      size="sm"
                      variant={fan.oscillating ? 'primary' : 'tertiary'}
                      aria-label={`Toggle oscillation for ${fan.name}`}
                      className="size-6 min-w-6"
                      onPress={() => onToggleOscillate(fan)}
                    >
                      <HugeiconsIcon icon={RotateClockwiseIcon} size={12} />
                    </Button>
                  ) : null}
                  <ProControlSwitch
                    isSelected={fan.isOn}
                    onChange={() => onToggleFan(fan)}
                    ariaLabel={`Toggle ${fan.name}`}
                  />
                </div>
              </div>

              {fan.supportsSpeed && fan.isOn ? (
                <ProFanSpeedSlider
                  value={fan.percentage}
                  onCommit={(pct) => onChangeSpeed(fan.entityId, pct)}
                  ariaLabel={`${fan.name} speed`}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-0.5">
        <span className="text-xs text-muted">
          {model.totalCount > visibleItems.length
            ? `Showing ${visibleItems.length} of ${model.totalCount} fans`
            : `${model.oscillatingCount} oscillating`}
        </span>
        <Button size="sm" variant="tertiary" onPress={onOpenSheet}>
          All {model.totalCount} fans
          <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} />
        </Button>
      </div>
    </div>
  );
}

export function vacuumBatteryIcon(vac: ProVacuumItem) {
  if (vac.batteryCharging) return BatteryCharging01Icon;
  if (vac.batteryPct !== null && vac.batteryPct < 25) return BatteryLowIcon;
  if (vac.batteryPct !== null && vac.batteryPct < 65) return BatteryMediumIcon;
  return BatteryFullIcon;
}

interface VacuumsWidgetBodyProps {
  model: ProVacuumsModel;
  size: ProWidgetSize;
  onAction: (entityId: string, action: 'start' | 'pause' | 'return_to_base' | 'locate') => void;
  onChangeSuction: (entityId: string, speed: string) => void;
  onOpenSheet: () => void;
}

export function VacuumsWidgetBody({
  model,
  size,
  onAction,
  onChangeSuction,
  onOpenSheet
}: VacuumsWidgetBodyProps) {
  const primary = model.primaryVacuum;

  if (!primary) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-default/40 p-3 text-xs text-muted">
        <HugeiconsIcon icon={CleanIcon} size={16} className="shrink-0" />
        <span>{model.subtitleText}</span>
      </div>
    );
  }

  const BatteryIcon = vacuumBatteryIcon(primary);
  const canPause = primary.isCleaning;

  if (size === '1x') {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Badge
            size="sm"
            variant="soft"
            color={primary.badgeTone}
            className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
          >
            <HugeiconsIcon icon={CleanIcon} size={11} />
            <Badge.Label>{primary.badgeText}</Badge.Label>
          </Badge>

          {primary.batteryPct !== null ? (
            <Badge
              size="sm"
              variant="soft"
              color={primary.batteryTone}
              className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
            >
              <HugeiconsIcon icon={BatteryIcon} size={11} />
              <Badge.Label className="font-mono">{primary.batteryPct}%</Badge.Label>
            </Badge>
          ) : null}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{primary.name}</p>
          <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-muted">
            <HugeiconsIcon icon={Home01Icon} size={11} className="shrink-0" />
            <span className="truncate">{primary.statusLabel}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={canPause ? 'secondary' : 'primary'}
            className="flex-1"
            onPress={() => onAction(primary.entityId, canPause ? 'pause' : 'start')}
          >
            <HugeiconsIcon icon={canPause ? PauseIcon : PlayIcon} size={13} />
            {canPause ? 'Pause' : 'Clean'}
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            isDisabled={primary.isDocked || primary.isReturning}
            onPress={() => onAction(primary.entityId, 'return_to_base')}
          >
            <HugeiconsIcon icon={Home01Icon} size={13} />
            Dock
          </Button>
        </div>
      </div>
    );
  }

  if (size === '2x') {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">{primary.name}</p>
            <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-muted">
              <HugeiconsIcon icon={Home01Icon} size={11} className="shrink-0" />
              <span className="truncate">{primary.statusLabel}</span>
              {primary.fanSpeed ? <span>· {primary.fanSpeed}</span> : null}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Badge
              size="sm"
              variant="soft"
              color={primary.badgeTone}
              className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
            >
              <HugeiconsIcon icon={CleanIcon} size={11} />
              <Badge.Label>{primary.badgeText}</Badge.Label>
            </Badge>
            {primary.batteryPct !== null ? (
              <Badge
                size="sm"
                variant="soft"
                color={primary.batteryTone}
                className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
              >
                <HugeiconsIcon icon={BatteryIcon} size={11} />
                <Badge.Label className="font-mono">{primary.batteryPct}%</Badge.Label>
              </Badge>
            ) : null}
          </div>
        </div>

        {primary.batteryPct !== null ? (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-default">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                primary.batteryTone === 'danger'
                  ? 'bg-danger'
                  : primary.batteryTone === 'warning'
                    ? 'bg-warning'
                    : 'bg-success'
              )}
              style={{ width: `${primary.batteryPct}%` }}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={canPause ? 'secondary' : 'primary'}
            onPress={() => onAction(primary.entityId, canPause ? 'pause' : 'start')}
          >
            <HugeiconsIcon icon={canPause ? PauseIcon : PlayIcon} size={13} />
            {canPause ? 'Pause' : 'Clean'}
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            isDisabled={primary.isDocked || primary.isReturning}
            onPress={() => onAction(primary.entityId, 'return_to_base')}
          >
            <HugeiconsIcon icon={Home01Icon} size={13} />
            Dock
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            onPress={() => onAction(primary.entityId, 'locate')}
          >
            <HugeiconsIcon icon={Location01Icon} size={13} />
            Locate
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-foreground">{primary.name}</p>
          <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-muted">
            <HugeiconsIcon icon={Home01Icon} size={11} className="shrink-0" />
            <span className="truncate">{primary.statusLabel}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Badge
            size="sm"
            variant="soft"
            color={primary.badgeTone}
            className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
          >
            <HugeiconsIcon icon={CleanIcon} size={11} />
            <Badge.Label>{primary.badgeText}</Badge.Label>
          </Badge>
          {primary.batteryPct !== null ? (
            <Badge
              size="sm"
              variant="soft"
              color={primary.batteryTone}
              className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
            >
              <HugeiconsIcon icon={BatteryIcon} size={11} />
              <Badge.Label className="font-mono">{primary.batteryPct}%</Badge.Label>
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-default/50 px-2.5 py-2">
          <p className="text-[10px] text-muted">Zone</p>
          <p className="truncate text-xs font-semibold text-foreground">{primary.currentRoom}</p>
        </div>
        <div className="rounded-xl bg-default/50 px-2.5 py-2">
          <p className="text-[10px] text-muted">Suction</p>
          <p className="truncate text-xs font-semibold text-foreground">{primary.fanSpeed || 'Balanced'}</p>
        </div>
        <div className="rounded-xl bg-default/50 px-2.5 py-2">
          <p className="text-[10px] text-muted">Battery</p>
          <p className="font-mono text-xs font-semibold text-foreground">
            {primary.batteryPct !== null ? `${primary.batteryPct}%` : '—'}
          </p>
        </div>
      </div>

      {primary.fanSpeedList.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium text-muted">Suction mode</span>
          <ToggleButtonGroup
            aria-label={`Suction mode for ${primary.name}`}
            size="sm"
            isDetached
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([primary.fanSpeed || primary.fanSpeedList[0]])}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next) onChangeSuction(primary.entityId, String(next));
            }}
            className="flex-wrap"
          >
            {primary.fanSpeedList.slice(0, 4).map((speed) => (
              <ToggleButton key={speed} id={speed} className="gap-1 px-2.5 text-xs">
                <HugeiconsIcon icon={FastWindIcon} size={11} />
                {speed}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={canPause ? 'secondary' : 'primary'}
            onPress={() => onAction(primary.entityId, canPause ? 'pause' : 'start')}
          >
            <HugeiconsIcon icon={canPause ? PauseIcon : PlayIcon} size={13} />
            {canPause ? 'Pause' : 'Clean'}
          </Button>
          <Button
            size="sm"
            variant="tertiary"
            isDisabled={primary.isDocked || primary.isReturning}
            onPress={() => onAction(primary.entityId, 'return_to_base')}
          >
            <HugeiconsIcon icon={Home01Icon} size={13} />
            Return
          </Button>
          <Button size="sm" variant="tertiary" onPress={() => onAction(primary.entityId, 'locate')}>
            <HugeiconsIcon icon={Location01Icon} size={13} />
            Locate
          </Button>
        </div>

        {model.totalCount > 1 ? (
          <Button size="sm" variant="tertiary" onPress={onOpenSheet}>
            All ({model.totalCount})
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
