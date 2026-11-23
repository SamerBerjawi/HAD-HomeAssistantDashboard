/**
 * Section 6 — Battery SoC & throughput:
 * A · Living Cell Cutaway (tactile 10-cell battery level visual + smooth SoC AreaChart)
 * B · Charge Cycle Dial + Timeline (ArcGauge live SoC + min/max range SoC curve)
 * C · Charge vs Discharge Mirror (bidirectional bar flow showing when battery stored vs released kWh)
 */
import { Chip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, ArrowUp01Icon, BatteryCharging01Icon, BatteryFullIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { batteryState } from '../../../../widgets/energy/EnergyBattery';
import { AreaChart } from '../../../../ui/bklit/AreaChart';
import { BidirectionalBarChart } from '../../../../ui/bklit/BidirectionalBarChart';
import { ArcGauge } from '../../../../ui/bklit/GaugeChart';
import { fmtKwh } from '../energyParts';
import { NoSectionData } from './conceptHelpers';
import type { SectionConceptProps } from './types';

/** 6A · Living Cell Cutaway */
export function BatteryA({ snap, compact }: SectionConceptProps) {
  const bat = snap.batterySummary;
  const bState = batteryState(snap.model);
  if (!bat || !bState) {
    return <NoSectionData icon={BatteryFullIcon} title="Battery" note="No home battery configured in Grid only state." />;
  }

  const areaData = snap.batterySeries.map((p) => ({
    label: p.label,
    value: p.socPct,
    secondary: `+${p.chargeKwh.toFixed(1)} / -${p.dischargeKwh.toFixed(1)} kWh`
  }));
  const litCells = Math.round(bat.nowPct / 10);

  return (
    <section
      aria-label="Living battery cell cutaway"
      className="pro-eb flex flex-col gap-3.5 p-4"
      style={{ ['--eb-tint' as string]: '45, 190, 165' }}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-xl bg-teal-500/15 text-[var(--energy-battery)]">
            <HugeiconsIcon icon={bState.mode === 'charging' ? BatteryCharging01Icon : BatteryFullIcon} size={17} />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Home battery</h3>
            <p className="text-xs text-muted">{bState.note}</p>
          </div>
        </div>
        <Chip size="sm" variant="soft" color={bat.nowPct < 20 ? 'warning' : 'success'}>
          <Chip.Label className="font-bold tabular-nums">{bat.nowPct}% SoC</Chip.Label>
        </Chip>
      </header>

      {/* 10-cell battery cutaway */}
      <div className="flex items-center gap-1.5" role="img" aria-label={`Battery charge level ${bat.nowPct} percent`}>
        <div className="grid flex-1 grid-cols-10 gap-1 rounded-2xl bg-[var(--background)]/55 p-1.5 ring-1 ring-black/5 dark:ring-white/10">
          {Array.from({ length: 10 }, (_, idx) => {
            const active = idx < litCells;
            const edge = idx === litCells - 1;
            return (
              <span
                key={idx}
                className={cn(
                  'h-6 rounded-md transition-colors',
                  active ? (bat.nowPct < 20 ? 'bg-[var(--warning)]' : 'bg-[var(--energy-battery)]') : 'bg-default/65',
                  edge && bState.mode !== 'idle' && 'animate-pulse'
                )}
              />
            );
          })}
        </div>
        <span className="h-5 w-1.5 rounded-r-md bg-muted/40" aria-hidden />
      </div>

      <AreaChart
        data={areaData}
        height={compact ? 130 : 150}
        accentColor="var(--energy-battery)"
        formatValue={(v) => `${Math.round(v)}%`}
        ariaLabel="Battery state of charge timeline"
      />

      <div className="grid grid-cols-3 gap-2 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] pt-2.5 text-xs">
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="shrink-0 text-success" />
          <div>
            <span className="block text-[11px] text-muted">Charged</span>
            <span className="font-semibold tabular-nums">{fmtKwh(bat.chargedKwh)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <HugeiconsIcon icon={ArrowUp01Icon} size={14} className="shrink-0 text-[var(--energy-battery)]" />
          <div>
            <span className="block text-[11px] text-muted">Discharged</span>
            <span className="font-semibold tabular-nums">{fmtKwh(bat.dischargedKwh)}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="block text-[11px] text-muted">Period swing</span>
          <span className="font-semibold tabular-nums">
            {bat.minPct}–{bat.maxPct}%
          </span>
        </div>
      </div>
    </section>
  );
}

/** 6B · Charge Cycle Dial + Timeline */
export function BatteryB({ snap, compact }: SectionConceptProps) {
  const bat = snap.batterySummary;
  const bState = batteryState(snap.model);
  if (!bat || !bState) {
    return <NoSectionData icon={BatteryFullIcon} title="Battery" note="No home battery configured in Grid only state." />;
  }

  const areaData = snap.batterySeries.map((p) => ({
    label: p.label,
    value: p.socPct
  }));

  return (
    <section aria-label="Battery dial and charge history" className="pro-surface @container flex flex-col gap-3 p-4">
      <div className={cn('grid grid-cols-1 gap-4', !compact && '@[470px]:grid-cols-[190px_1fr] @[470px]:items-center')}>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-default/45 p-3">
          <ArcGauge
            mode="percent"
            value={bat.nowPct}
            centerText={`${bat.nowPct}%`}
            label={bState.note}
            icon={bState.mode === 'charging' ? BatteryCharging01Icon : BatteryFullIcon}
            accentColor="var(--energy-battery)"
            className="w-full"
          />
          <p className="text-[11px] text-muted tabular-nums">
            +{fmtKwh(bat.chargedKwh)} / -{fmtKwh(bat.dischargedKwh)} · {bat.cyclesEst.toFixed(1)} cyc
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <header className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-semibold">
              <HugeiconsIcon icon={BatteryFullIcon} size={14} className="text-[var(--energy-battery)]" />
              Charge trajectory
            </span>
            <div className="flex items-center gap-1.5">
              <Chip size="sm" variant="soft" color="default">
                <Chip.Label className="tabular-nums">Low {bat.minPct}%</Chip.Label>
              </Chip>
              <Chip size="sm" variant="soft" color="success">
                <Chip.Label className="tabular-nums">High {bat.maxPct}%</Chip.Label>
              </Chip>
            </div>
          </header>
          <AreaChart
            data={areaData}
            height={compact ? 140 : 165}
            accentColor="var(--energy-battery)"
            formatValue={(v) => `${Math.round(v)}%`}
            ariaLabel="Battery charge curve"
          />
        </div>
      </div>
    </section>
  );
}

/** 6C · Charge vs Discharge Mirror */
export function BatteryC({ snap, compact }: SectionConceptProps) {
  const bat = snap.batterySummary;
  const bState = batteryState(snap.model);
  if (!bat || !bState) {
    return <NoSectionData icon={BatteryFullIcon} title="Battery" note="No home battery configured in Grid only state." />;
  }

  const mirrorData = snap.batterySeries.map((p) => ({
    label: p.label,
    solar: 0,
    batteryDischarge: p.dischargeKwh,
    gridImport: 0,
    batteryCharge: p.chargeKwh,
    gridExport: 0
  }));

  return (
    <section aria-label="Battery charge and discharge mirror" className="pro-surface flex flex-col gap-3 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={BatteryCharging01Icon} size={17} className="text-[var(--energy-battery)]" />
          <div>
            <h3 className="text-sm font-semibold">Battery activity mirror</h3>
            <p className="text-xs text-muted tabular-nums">
              Released {fmtKwh(bat.dischargedKwh)} above · Stored {fmtKwh(bat.chargedKwh)} below
            </p>
          </div>
        </div>
        <span className="font-mono text-xs font-semibold tabular-nums text-[var(--energy-battery)]">
          {bat.nowPct}% NOW · ~{bat.cyclesEst.toFixed(1)} CYCLES
        </span>
      </header>

      <div className="flex items-center gap-2 text-[11px] text-muted">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-default">
          <span
            className="block h-full rounded-full bg-[var(--energy-battery)]"
            style={{ width: `${bat.nowPct}%` }}
          />
        </span>
        <span className="tabular-nums">Range {bat.minPct}–{bat.maxPct}%</span>
      </div>

      <BidirectionalBarChart
        data={mirrorData}
        height={compact ? 160 : 185}
        showLegend={false}
        ariaLabel="Battery discharge above zero and charge below zero"
      />
    </section>
  );
}
