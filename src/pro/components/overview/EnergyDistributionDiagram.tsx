/**
 * Pro-UI Energy Distribution diagram: retains Home Assistant's node-flow topology
 * (Low-carbon, Solar, Grid, Battery, Home) adapted onto calm borderless HeroUI mini-cards,
 * Hugeicons soft icon tiles, and Magic UI AnimatedBeam connectors.
 */
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUp01Icon,
  BatteryFullIcon,
  Home01Icon,
  Leaf01Icon,
  PlugSocketIcon,
  SolarPanel01Icon
} from '@hugeicons/core-free-icons';
import { useRef, type ReactNode, type RefObject } from 'react';
import { cn } from '@/lib/utils';
import type { ProOverviewEnergyModel } from '../../lib/overviewEnergy';
import { formatPower } from '../../lib/pageSentences';
import { AnimatedBeam } from '../../ui/magicui/AnimatedBeam';

interface EnergyDistributionDiagramProps {
  model: ProOverviewEnergyModel;
  compact?: boolean;
  showLowCarbon?: boolean;
  className?: string;
}

function FlowNodeCard({
  nodeRef,
  icon,
  iconToneClass,
  label,
  children
}: {
  nodeRef: RefObject<HTMLDivElement | null>;
  icon: IconSvgElement;
  iconToneClass: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      ref={nodeRef}
      className="z-[1] flex w-full max-w-[126px] flex-col gap-1 rounded-2xl bg-default/55 px-2.5 py-2 text-left shadow-2xs backdrop-blur-xs"
    >
      <div className="flex items-center gap-1.5">
        <span className={cn('grid size-5 shrink-0 place-items-center rounded-lg', iconToneClass)}>
          <HugeiconsIcon icon={icon} size={12} />
        </span>
        <span className="truncate text-[10px] font-semibold text-muted">{label}</span>
      </div>
      {children}
    </div>
  );
}

function CompactFlowPill({
  nodeRef,
  icon,
  iconToneClass,
  valueText,
  barSplit
}: {
  nodeRef: RefObject<HTMLDivElement | null>;
  icon: IconSvgElement;
  iconToneClass: string;
  valueText: string;
  barSplit?: { solarPct: number; batPct: number; gridPct: number };
}) {
  return (
    <div
      ref={nodeRef}
      className="z-[1] inline-flex flex-col gap-1 rounded-xl bg-default/60 px-2 py-1.5 shadow-2xs backdrop-blur-xs"
    >
      <div className="flex items-center gap-1.5">
        <span className={cn('grid size-5 shrink-0 place-items-center rounded-lg', iconToneClass)}>
          <HugeiconsIcon icon={icon} size={11} />
        </span>
        <span className="whitespace-nowrap font-mono text-[11px] font-bold text-foreground">
          {valueText}
        </span>
      </div>
      {barSplit ? (
        <div className="flex h-1 w-full overflow-hidden rounded-full bg-default/70">
          {barSplit.solarPct > 0 ? (
            <div className="h-full bg-warning" style={{ width: `${barSplit.solarPct}%` }} />
          ) : null}
          {barSplit.batPct > 0 ? (
            <div className="h-full bg-success" style={{ width: `${barSplit.batPct}%` }} />
          ) : null}
          {barSplit.gridPct > 0 ? (
            <div className="h-full bg-[var(--accent)]" style={{ width: `${barSplit.gridPct}%` }} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function EnergyDistributionDiagram({
  model,
  compact = false,
  showLowCarbon = false,
  className
}: EnergyDistributionDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lowCarbonRef = useRef<HTMLDivElement>(null);
  const solarRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);
  const batteryRef = useRef<HTMLDivElement>(null);

  const d = model.distribution;

  const beams = (
    <>
      {showLowCarbon ? (
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={lowCarbonRef}
          toRef={gridRef}
          pathWidth={1.5}
          pathOpacity={0.22}
          gradientStartColor="var(--success)"
          gradientStopColor="var(--accent)"
          active={d.lowCarbonPct > 0}
          duration={3.4}
        />
      ) : null}

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={solarRef}
        toRef={homeRef}
        routing="orthogonal"
        pathWidth={d.hasSolarToHome ? 2.25 : 1.25}
        pathOpacity={0.22}
        gradientStartColor="var(--energy-solar)"
        gradientStopColor="var(--warning)"
        active={d.hasSolarToHome}
        duration={2.5}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={solarRef}
        toRef={gridRef}
        routing="orthogonal"
        pathWidth={d.hasSolarToGrid ? 2 : 1.25}
        pathOpacity={0.2}
        gradientStartColor="var(--energy-solar)"
        gradientStopColor="var(--energy-export)"
        active={d.hasSolarToGrid}
        duration={2.6}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={solarRef}
        toRef={batteryRef}
        curvature={0}
        pathWidth={d.hasSolarToBattery ? 2 : 1.25}
        pathOpacity={0.2}
        gradientStartColor="var(--energy-solar)"
        gradientStopColor="var(--success)"
        active={d.hasSolarToBattery}
        duration={2.7}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={gridRef}
        toRef={homeRef}
        curvature={0}
        pathWidth={d.hasGridToHome ? 2.25 : 1.25}
        pathOpacity={0.22}
        gradientStartColor="var(--accent)"
        gradientStopColor="var(--energy-grid)"
        active={d.hasGridToHome}
        duration={2.4}
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={batteryRef}
        toRef={homeRef}
        routing="orthogonal"
        pathWidth={d.hasBatteryToHome ? 2.25 : 1.25}
        pathOpacity={0.22}
        gradientStartColor="var(--success)"
        gradientStopColor="var(--success)"
        active={d.hasBatteryToHome}
        duration={2.5}
      />
      {d.hasGridToBattery ? (
        <AnimatedBeam
          containerRef={containerRef}
          fromRef={gridRef}
          toRef={batteryRef}
          routing="orthogonal"
          pathWidth={1.75}
          pathOpacity={0.2}
          gradientStartColor="var(--accent)"
          gradientStopColor="var(--success)"
          active
          duration={3}
        />
      ) : null}
    </>
  );

  if (compact) {
    const gridShort = model.isExporting
      ? `-${formatPower(model.gridExportKW)}`
      : formatPower(model.gridImportKW);
    return (
      <div
        ref={containerRef}
        className={cn(
          'relative flex min-h-[164px] flex-col justify-between gap-2.5 py-1',
          className
        )}
      >
        {beams}
        <div className="flex justify-center">
          <CompactFlowPill
            nodeRef={solarRef}
            icon={SolarPanel01Icon}
            iconToneClass="bg-warning/15 text-warning"
            valueText={formatPower(model.solarKW)}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <CompactFlowPill
            nodeRef={gridRef}
            icon={PlugSocketIcon}
            iconToneClass="pro-soft"
            valueText={gridShort}
          />
          <CompactFlowPill
            nodeRef={homeRef}
            icon={Home01Icon}
            iconToneClass="pro-soft"
            valueText={formatPower(model.homeKW)}
            barSplit={{
              solarPct: d.homeRingSolarPct,
              batPct: d.homeRingBatPct,
              gridPct: d.homeRingGridPct
            }}
          />
        </div>
        <div className="flex justify-center">
          <CompactFlowPill
            nodeRef={batteryRef}
            icon={BatteryFullIcon}
            iconToneClass="bg-success/15 text-success"
            valueText={model.batterySoC !== null ? `${model.batterySoC}%` : model.batteryKWText}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative grid min-h-[252px] grid-cols-3 grid-rows-3 place-items-center gap-2.5 py-1',
        className
      )}
    >
      {beams}

      {/* Row 1 Col 1: Optional Clean / Low-carbon node */}
      <div className="z-[1] flex w-full justify-center">
        {showLowCarbon ? (
          <FlowNodeCard
            nodeRef={lowCarbonRef}
            icon={Leaf01Icon}
            iconToneClass="bg-success/15 text-success"
            label="Clean"
          >
            <span className="truncate font-mono text-xs font-bold text-foreground">
              {d.lowCarbonKwh.toFixed(1)} kWh
            </span>
          </FlowNodeCard>
        ) : null}
      </div>

      {/* Row 1 Col 2: Solar */}
      <FlowNodeCard
        nodeRef={solarRef}
        icon={SolarPanel01Icon}
        iconToneClass="bg-warning/15 text-warning"
        label="Solar"
      >
        <span className="truncate font-mono text-xs font-bold text-foreground">
          {model.solarKwh > 0.05 ? `${model.solarKwh.toFixed(1)} kWh` : formatPower(model.solarKW)}
        </span>
      </FlowNodeCard>

      {/* Row 1 Col 3 */}
      <div />

      {/* Row 2 Col 1: Grid */}
      <FlowNodeCard
        nodeRef={gridRef}
        icon={PlugSocketIcon}
        iconToneClass="pro-soft"
        label="Grid"
      >
        <div className="flex flex-col gap-0.5 font-mono text-[10px] leading-tight">
          <span className="inline-flex items-center gap-0.5 text-[var(--accent)]">
            <HugeiconsIcon icon={ArrowRight01Icon} size={9} />
            {`${model.gridImportKwh.toFixed(1)} kWh`}
          </span>
          <span className="inline-flex items-center gap-0.5 text-muted">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={9} />
            {`${model.gridExportKwh.toFixed(1)} kWh`}
          </span>
        </div>
      </FlowNodeCard>

      {/* Row 2 Col 2: center junction */}
      <div />

      {/* Row 2 Col 3: Home + proportional supply strip */}
      <FlowNodeCard
        nodeRef={homeRef}
        icon={Home01Icon}
        iconToneClass="pro-soft"
        label="Home"
      >
        <span className="truncate font-mono text-xs font-bold text-foreground">
          {model.homeKwh > 0.05 ? `${model.homeKwh.toFixed(1)} kWh` : formatPower(model.homeKW)}
        </span>
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-default/70">
          {d.homeRingSolarPct > 0 ? (
            <div className="h-full bg-warning" style={{ width: `${d.homeRingSolarPct}%` }} />
          ) : null}
          {d.homeRingBatPct > 0 ? (
            <div className="h-full bg-success" style={{ width: `${d.homeRingBatPct}%` }} />
          ) : null}
          {d.homeRingGridPct > 0 ? (
            <div className="h-full bg-[var(--accent)]" style={{ width: `${d.homeRingGridPct}%` }} />
          ) : null}
        </div>
      </FlowNodeCard>

      {/* Row 3 Col 1 */}
      <div />

      {/* Row 3 Col 2: Battery */}
      <FlowNodeCard
        nodeRef={batteryRef}
        icon={BatteryFullIcon}
        iconToneClass="bg-success/15 text-success"
        label={model.batterySoC !== null ? `Bat ${model.batterySoC}%` : 'Battery'}
      >
        <div className="flex flex-col gap-0.5 font-mono text-[10px] leading-tight">
          <span className="inline-flex items-center gap-0.5 text-success">
            <HugeiconsIcon icon={ArrowUp01Icon} size={9} />
            {model.batteryDischargeKwh.toFixed(1)} kWh
          </span>
          <span className="inline-flex items-center gap-0.5 text-muted">
            <HugeiconsIcon icon={ArrowDown01Icon} size={9} />
            {model.batteryChargeKwh.toFixed(1)} kWh
          </span>
        </div>
      </FlowNodeCard>

      {/* Row 3 Col 3 */}
      <div />
    </div>
  );
}
