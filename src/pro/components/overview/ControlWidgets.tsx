/**
 * Pro Overview Lighting & Switches widget card bodies across 1x, 2x, and 2x2 sizes
 * (docs/pro-ui/DESIGN.md 7.6, Option 3: HeroUI Switch, Slider, Badge, and warm-amber Lighting tint).
 */
import { useState } from 'react';
import { Badge, Button, Slider, Switch, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowUpRight01Icon,
  BulbIcon,
  FlashIcon,
  Home01Icon,
  Sun01Icon,
  ToggleOnIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProControlDomainModel, ProControlItem } from '../../lib/overviewControls';
import type { ProWidgetSize } from '../../lib/overviewWidgets';

export function ProControlSwitch({
  isSelected,
  onChange,
  ariaLabel,
  warmTone = false
}: {
  isSelected: boolean;
  onChange: (nextSelected: boolean) => void;
  ariaLabel: string;
  warmTone?: boolean;
}) {
  return (
    <div
      className="shrink-0"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Switch
        size="sm"
        isSelected={isSelected}
        onChange={onChange}
        aria-label={ariaLabel}
        className={cn(warmTone && '[--accent:var(--warning)]')}
      >
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      </Switch>
    </div>
  );
}

export function ProBrightnessSlider({
  value,
  onCommit,
  ariaLabel
}: {
  value: number;
  onCommit: (nextPct: number) => void;
  ariaLabel: string;
}) {
  const [draggingValue, setDraggingValue] = useState<number | null>(null);
  const current = draggingValue ?? value;

  return (
    <div
      className="flex items-center gap-2.5"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <HugeiconsIcon icon={Sun01Icon} size={13} className="shrink-0 text-warning" />
      <Slider
        aria-label={ariaLabel}
        minValue={1}
        maxValue={100}
        step={1}
        value={current}
        onChange={(next) => setDraggingValue(Array.isArray(next) ? next[0] : next)}
        onChangeEnd={(next) => {
          const finalVal = Array.isArray(next) ? next[0] : next;
          setDraggingValue(null);
          onCommit(finalVal);
        }}
        className="min-w-0 flex-1 [--accent:var(--warning)]"
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

interface ControlWidgetBodyProps {
  model: ProControlDomainModel;
  size: ProWidgetSize;
  onToggleItem: (item: ProControlItem) => void;
  onToggleBatch: (forceOn: boolean) => void;
  onChangeBrightness?: (entityId: string, pct: number) => void;
  onOpenSheet: () => void;
}

function ControlDomainWidgetBody({
  model,
  size,
  onToggleItem,
  onToggleBatch,
  onChangeBrightness,
  onOpenSheet
}: ControlWidgetBodyProps) {
  const [onlyOn, setOnlyOn] = useState(false);
  const isLights = model.domain === 'lights';
  const batchTargetOn = model.onCount === 0;
  const BadgeIcon = isLights ? (model.onCount > 0 ? Sun01Icon : BulbIcon) : ToggleOnIcon;

  if (model.totalCount === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-default/40 p-3 text-xs text-muted">
        <HugeiconsIcon icon={isLights ? BulbIcon : ToggleOnIcon} size={16} className="shrink-0" />
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
              <HugeiconsIcon icon={BadgeIcon} size={11} />
              <Badge.Label className="font-mono">{model.badgeText}</Badge.Label>
            </Badge>
            <ProControlSwitch
              isSelected={model.onCount > 0}
              onChange={() => onToggleBatch(batchTargetOn)}
              ariaLabel={model.onCount > 0 ? `Turn all ${model.domain} off` : `Turn all ${model.domain} on`}
              warmTone={isLights}
            />
          </div>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-default">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isLights ? 'bg-warning' : 'bg-[var(--accent)]'
            )}
            style={{ width: `${model.onRatioPct}%` }}
          />
        </div>

        <p className="truncate text-xs text-muted">{model.subtitleText}</p>
      </div>
    );
  }

  if (size === '2x') {
    const previewItems = model.items.slice(0, 3);
    return (
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
              {model.onCount} / {model.totalCount}
            </span>
            <span className="text-xs text-muted">active</span>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              size="sm"
              variant="soft"
              color={model.badgeTone}
              className="static transform-none! min-h-5 min-w-0 gap-1 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold [&_svg]:size-3!"
            >
              <HugeiconsIcon icon={BadgeIcon} size={11} />
              <Badge.Label className="font-mono">{model.badgeText}</Badge.Label>
            </Badge>
            <ProControlSwitch
              isSelected={model.onCount > 0}
              onChange={() => onToggleBatch(batchTargetOn)}
              ariaLabel={model.onCount > 0 ? `Turn all ${model.domain} off` : `Turn all ${model.domain} on`}
              warmTone={isLights}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 @md:grid-cols-3">
          {previewItems.map((item) => (
            <div
              key={item.entityId}
              className={cn(
                'flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 transition-colors',
                item.isOn ? (isLights ? 'bg-warning/12' : 'bg-[var(--pro-accent-soft)]') : 'bg-default/50'
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{item.shortName}</p>
                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted">
                  <HugeiconsIcon icon={Home01Icon} size={10} className="shrink-0" />
                  <span className="truncate">{item.roomName}</span>
                  {item.isOn && item.brightnessPct !== null ? (
                    <span className="shrink-0 font-mono font-semibold text-warning">{item.brightnessPct}%</span>
                  ) : item.isOn && item.powerWatts !== undefined && item.powerWatts > 0 ? (
                    <span className="inline-flex shrink-0 items-center gap-0.5 font-mono text-[var(--accent)]">
                      <HugeiconsIcon icon={FlashIcon} size={10} />
                      {item.powerWatts}W
                    </span>
                  ) : null}
                </div>
              </div>

              <ProControlSwitch
                isSelected={item.isOn}
                onChange={() => onToggleItem(item)}
                ariaLabel={`Toggle ${item.name}`}
                warmTone={isLights}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2x2 Large layout with All / On filter, inline switches, and inline brightness Sliders
  const visiblePool = onlyOn ? model.onItems : model.items;
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
            <HugeiconsIcon icon={BadgeIcon} size={11} />
            <Badge.Label className="font-mono">{model.badgeText}</Badge.Label>
          </Badge>
        </div>

        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <ToggleButtonGroup
            aria-label={`Filter ${model.domain}`}
            size="sm"
            isDetached
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([onlyOn ? 'on' : 'all'])}
            onSelectionChange={(keys) => {
              const next = [...keys][0];
              if (next) setOnlyOn(next === 'on');
            }}
          >
            <ToggleButton id="all" className="gap-1 px-2 text-xs">
              <HugeiconsIcon icon={isLights ? BulbIcon : ToggleOnIcon} size={12} />
              All
            </ToggleButton>
            <ToggleButton id="on" className="gap-1 px-2 text-xs">
              <HugeiconsIcon icon={isLights ? Sun01Icon : FlashIcon} size={12} />
              On ({model.onCount})
            </ToggleButton>
          </ToggleButtonGroup>

          <ProControlSwitch
            isSelected={model.onCount > 0}
            onChange={() => onToggleBatch(batchTargetOn)}
            ariaLabel={model.onCount > 0 ? `Turn all ${model.domain} off` : `Turn all ${model.domain} on`}
            warmTone={isLights}
          />
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <div className="rounded-xl bg-default/40 p-4 text-center text-xs text-muted">
          No active {model.domain} right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 @md:grid-cols-2">
          {visibleItems.map((item) => (
            <div
              key={item.entityId}
              className={cn(
                'flex flex-col gap-2 rounded-xl p-2.5 transition-colors',
                item.isOn ? (isLights ? 'bg-warning/12' : 'bg-[var(--pro-accent-soft)]') : 'bg-default/50'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">{item.shortName}</p>
                  <p className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-[11px] text-muted">
                    <HugeiconsIcon icon={Home01Icon} size={10} className="shrink-0" />
                    <span className="truncate">{item.roomName}</span>
                    {!isLights && item.isOn && item.powerWatts !== undefined && item.powerWatts > 0 ? (
                      <span className="font-mono font-semibold text-[var(--accent)]">· {item.powerWatts}W</span>
                    ) : null}
                  </p>
                </div>

                <ProControlSwitch
                  isSelected={item.isOn}
                  onChange={() => onToggleItem(item)}
                  ariaLabel={`Toggle ${item.name}`}
                  warmTone={isLights}
                />
              </div>

              {isLights && item.isOn && item.supportsBrightness && onChangeBrightness ? (
                <ProBrightnessSlider
                  value={item.brightnessPct ?? 80}
                  onCommit={(pct) => onChangeBrightness(item.entityId, pct)}
                  ariaLabel={`${item.name} brightness`}
                />
              ) : null}
            </div>
          ))}
        </div>
      )}

      {visiblePool.length > 6 ? (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="tertiary" className="gap-1.5 text-xs" onPress={onOpenSheet}>
            Manage all {model.totalCount} {model.domain}
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={13} />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function LightingWidgetBody(props: ControlWidgetBodyProps) {
  return <ControlDomainWidgetBody {...props} />;
}

export function SwitchesWidgetBody(props: Omit<ControlWidgetBodyProps, 'onChangeBrightness'>) {
  return <ControlDomainWidgetBody {...props} />;
}
