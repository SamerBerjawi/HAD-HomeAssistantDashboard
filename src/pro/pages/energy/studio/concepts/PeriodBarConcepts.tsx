/**
 * Section 2 — Period bar:
 * A · Capsule Dock (Kokonut SmoothTab + pill date stepper + compact action tray)
 * B · Editorial Timeline Header (bold date headline + circular steppers + YoY Switch)
 * C · Compact Instrument Rail (tight single-row telemetry bar with 1D/1W/1M/1Y shortcuts)
 */
import { Button, Chip, Switch, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Calendar01Icon,
  Calendar03Icon,
  GitCompareIcon,
  RefreshIcon,
  SlidersHorizontalIcon
} from '@hugeicons/core-free-icons';
import { SmoothTab } from '../../../../ui/kokonutui/SmoothTab';
import type { StudioPeriod } from '../../../../lib/energyPage';
import { CUSTOM_PRESETS, PERIOD_OPTIONS, TipIconBtn } from './conceptHelpers';
import type { SectionConceptProps } from './types';

function CustomPresetRow({ actions, activePreset }: Pick<SectionConceptProps['actions'], 'onCustomPreset' | 'activePreset'> & { actions: SectionConceptProps['actions'] }) {
  if (!actions.onCustomPreset) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      <span className="text-[11px] font-medium text-muted">Quick range:</span>
      {CUSTOM_PRESETS.map((p) => (
        <Button
          key={p.id}
          size="sm"
          variant={activePreset === p.id ? 'primary' : 'tertiary'}
          onPress={() => actions.onCustomPreset?.(p.id)}
          className="h-7 rounded-full px-2.5 text-[11px]"
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}

/** 2A · Capsule Dock */
export function PeriodBarA({ snap, actions, compact }: SectionConceptProps) {
  const items = PERIOD_OPTIONS.map((o) => ({
    id: o.id,
    title: compact ? o.short : o.label,
    icon: o.icon
  }));

  return (
    <section aria-label="Period capsule dock" className="pro-surface flex flex-col gap-3 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <SmoothTab
            items={items}
            value={snap.period}
            onChange={(id) => actions.onPeriod(id as StudioPeriod)}
            label="Time period"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="sm"
            variant={snap.compareEnabled ? 'primary' : 'secondary'}
            onPress={actions.onToggleCompare}
            className="gap-1.5 rounded-full text-xs"
          >
            <HugeiconsIcon icon={GitCompareIcon} size={14} />
            {snap.compareEnabled ? `vs ${snap.compareYear}` : 'Compare'}
          </Button>
          {snap.compareEnabled ? (
            <Button
              size="sm"
              variant="tertiary"
              onPress={() => {
                const idx = snap.availableYears.indexOf(snap.compareYear);
                const next = snap.availableYears[(idx + 1) % snap.availableYears.length] ?? 2025;
                actions.onCompareYear(next);
              }}
              className="gap-1 rounded-full text-xs tabular-nums"
              aria-label="Cycle comparison year"
            >
              <HugeiconsIcon icon={Calendar03Icon} size={13} />
              {snap.compareYear}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="tertiary"
            onPress={actions.onOpenCustomize}
            className="gap-1.5 rounded-full text-xs"
          >
            <HugeiconsIcon icon={SlidersHorizontalIcon} size={14} />
            {compact ? null : 'Customise'}
          </Button>
          <TipIconBtn
            label="Refresh statistics"
            onPress={actions.onRefresh}
            icon={RefreshIcon}
            variant="tertiary"
            className="rounded-full"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-default/70 p-1">
          <TipIconBtn
            label="Previous period"
            onPress={() => actions.onShiftDate(-1)}
            icon={ArrowLeft01Icon}
            variant="ghost"
            className="size-8 min-w-0 rounded-full"
          />
          <span className="flex items-center gap-1.5 px-2 text-xs font-semibold tabular-nums">
            <HugeiconsIcon icon={Calendar01Icon} size={14} className="text-[var(--accent)]" />
            {snap.dateLabel}
          </span>
          <TipIconBtn
            label="Next period"
            isDisabled={snap.isAtFutureLimit}
            onPress={() => actions.onShiftDate(1)}
            icon={ArrowRight01Icon}
            variant="ghost"
            className="size-8 min-w-0 rounded-full"
          />
        </div>

        {snap.compareEnabled ? (
          <Chip size="sm" variant="soft" color="accent">
            <HugeiconsIcon icon={GitCompareIcon} size={12} />
            <Chip.Label>
              {actions.isCompareLoading ? 'Loading YoY…' : `Comparing ${snap.compareYear}`}
            </Chip.Label>
          </Chip>
        ) : null}
      </div>

      {snap.period === 'custom' ? <CustomPresetRow actions={actions} activePreset={actions.activePreset} /> : null}
    </section>
  );
}

/** 2B · Editorial Timeline Header */
export function PeriodBarB({ snap, actions, compact }: SectionConceptProps) {
  return (
    <section aria-label="Period timeline header" className="pro-surface flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <TipIconBtn
              label="Previous period"
              onPress={() => actions.onShiftDate(-1)}
              icon={ArrowLeft01Icon}
              variant="tertiary"
              className="size-9 min-w-0 rounded-full"
            />
            <TipIconBtn
              label="Next period"
              isDisabled={snap.isAtFutureLimit}
              onPress={() => actions.onShiftDate(1)}
              icon={ArrowRight01Icon}
              variant="tertiary"
              className="size-9 min-w-0 rounded-full"
            />
          </div>
          <div className="min-w-0">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-muted">
              Viewing window
            </span>
            <span className="flex items-center gap-1.5 text-base font-bold tracking-tight tabular-nums">
              <HugeiconsIcon icon={Calendar01Icon} size={16} className="text-[var(--accent)]" />
              {snap.dateLabel}
            </span>
          </div>
        </div>

        <ToggleButtonGroup
          aria-label="Period"
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          className="flex-wrap"
          selectedKeys={new Set([snap.period])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as StudioPeriod | undefined;
            if (next) actions.onPeriod(next);
          }}
        >
          {PERIOD_OPTIONS.map((o) => (
            <ToggleButton key={o.id} id={o.id} className="gap-1.5 text-xs">
              <HugeiconsIcon icon={o.icon} size={13} />
              {compact ? o.short : o.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] pt-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <Switch size="sm" isSelected={snap.compareEnabled} onChange={actions.onToggleCompare}>
            <Switch.Content className="flex items-center gap-2">
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <HugeiconsIcon icon={GitCompareIcon} size={14} className="text-[var(--accent)]" />
                Compare with {snap.compareYear}
              </span>
            </Switch.Content>
          </Switch>

          {snap.compareEnabled ? (
            <div className="flex items-center gap-1">
              {snap.availableYears.map((y) => (
                <Button
                  key={y}
                  size="sm"
                  variant={y === snap.compareYear ? 'primary' : 'tertiary'}
                  onPress={() => actions.onCompareYear(y)}
                  className="h-7 min-w-0 rounded-full px-2.5 text-[11px] tabular-nums"
                >
                  {y}
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="tertiary" onPress={actions.onOpenCustomize} className="gap-1.5 text-xs">
            <HugeiconsIcon icon={SlidersHorizontalIcon} size={14} />
            Customise
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={actions.onRefresh}
            isDisabled={actions.isFetching}
            className="gap-1.5 text-xs"
          >
            <HugeiconsIcon icon={RefreshIcon} size={14} className={actions.isFetching ? 'animate-spin' : ''} />
            {compact ? null : 'Refresh'}
          </Button>
        </div>
      </div>

      {snap.period === 'custom' ? <CustomPresetRow actions={actions} activePreset={actions.activePreset} /> : null}
    </section>
  );
}

/** 2C · Compact Instrument Rail */
export function PeriodBarC({ snap, actions }: SectionConceptProps) {
  return (
    <section aria-label="Period command rail" className="pro-surface flex flex-col gap-2 px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ToggleButtonGroup
          aria-label="Period"
          size="sm"
          selectionMode="single"
          disallowEmptySelection
          className="flex-wrap"
          selectedKeys={new Set([snap.period])}
          onSelectionChange={(keys) => {
            const next = [...keys][0] as StudioPeriod | undefined;
            if (next) actions.onPeriod(next);
          }}
        >
          {PERIOD_OPTIONS.map((o) => (
            <ToggleButton key={o.id} id={o.id} className="gap-1 font-mono text-[11px]">
              <HugeiconsIcon icon={o.icon} size={12} />
              {o.short}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <div className="flex items-center gap-1 rounded-lg bg-default/65 px-1.5 py-0.5">
          <TipIconBtn label="Previous period" onPress={() => actions.onShiftDate(-1)} icon={ArrowLeft01Icon} />
          <span className="flex items-center gap-1 px-1 font-mono text-xs font-semibold tabular-nums">
            <HugeiconsIcon icon={Calendar01Icon} size={13} className="text-[var(--accent)]" />
            {snap.dateLabel}
          </span>
          <TipIconBtn
            label="Next period"
            isDisabled={snap.isAtFutureLimit}
            onPress={() => actions.onShiftDate(1)}
            icon={ArrowRight01Icon}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={snap.compareEnabled ? 'primary' : 'tertiary'}
            onPress={actions.onToggleCompare}
            className="gap-1 font-mono text-[11px]"
          >
            <HugeiconsIcon icon={GitCompareIcon} size={13} />
            {snap.compareEnabled ? `YoY:${snap.compareYear}` : 'YoY'}
          </Button>
          <TipIconBtn label="Customise sections" onPress={actions.onOpenCustomize} icon={SlidersHorizontalIcon} variant="tertiary" />
          <TipIconBtn label="Refresh energy statistics" onPress={actions.onRefresh} icon={RefreshIcon} variant="tertiary" />
        </div>
      </div>

      {snap.period === 'custom' ? <CustomPresetRow actions={actions} activePreset={actions.activePreset} /> : null}
    </section>
  );
}
