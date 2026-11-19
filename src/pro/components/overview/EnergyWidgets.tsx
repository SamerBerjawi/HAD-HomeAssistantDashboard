/**
 * Pro Overview Energy widgets across 1x, 2x, and 2x2 sizes (docs/pro-ui/DESIGN.md 7.6, Option 1 + A):
 * Full 8-widget Home Assistant Energy Suite built onto HeroUI tokens, Hugeicons icons,
 * bklit UI charts (PowerSourcesAreaChart, BidirectionalBarChart, SolarForecastBarChart, SankeyChart,
 * GaugeChart), and Magic UI AnimatedBeam Energy distribution diagram.
 */
import { Badge } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  ArrowUp01Icon,
  BatteryFullIcon,
  Calendar03Icon,
  ChartBarIncreasingIcon,
  FlashIcon,
  Leaf01Icon,
  PlugSocketIcon,
  SolarPanel01Icon,
  Sun01Icon,
  Wallet01Icon,
  WorkflowSquare01Icon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { ProEnergyTone, ProOverviewEnergyModel } from '../../lib/overviewEnergy';
import type { ProWidgetSize } from '../../lib/overviewWidgets';
import { BidirectionalBarChart } from '../../ui/bklit/BidirectionalBarChart';
import { ArcGauge, GridBalanceBar } from '../../ui/bklit/GaugeChart';
import { PowerSourcesAreaChart } from '../../ui/bklit/PowerSourcesAreaChart';
import { SankeyChart } from '../../ui/bklit/SankeyChart';
import { SolarForecastBarChart } from '../../ui/bklit/SolarForecastBarChart';
import { EnergyDistributionDiagram } from './EnergyDistributionDiagram';

export { EnergyGaugesWidgetBody } from './EnergyGaugesWidget';

const BADGE_BASE =
  'static transform-none! min-h-5 min-w-0 shrink-0 rounded-full border-0 px-2 py-0.5 text-[11px] font-semibold inline-flex items-center gap-1';

function EnergyStatusBadge({
  icon,
  label,
  color = 'default'
}: {
  icon: IconSvgElement;
  label: string;
  color?: ProEnergyTone;
}) {
  return (
    <Badge size="sm" variant="soft" color={color} className={BADGE_BASE}>
      <HugeiconsIcon icon={icon} size={11} />
      <Badge.Label>{label}</Badge.Label>
    </Badge>
  );
}

/** 1. Power flow / Energy distribution (diamond flow diagram with Magic UI AnimatedBeam) */
export function PowerFlowWidgetBody({
  model,
  size
}: {
  model: ProOverviewEnergyModel;
  size: ProWidgetSize;
}) {
  const badgeLabel = model.isExporting ? model.gridNetText : `${model.selfSufficiencyPct}% clean`;

  return (
    <div className="relative z-[1] flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex min-w-0 flex-col">
          <span
            className={cn(
              'truncate font-mono font-bold tracking-tight text-foreground',
              size === '2x2' ? 'text-2xl' : 'text-lg @[190px]:text-xl'
            )}
          >
            {model.homeKWText}
          </span>
          <span className="truncate text-[11px] text-muted">{model.gridNetText}</span>
        </div>
        <EnergyStatusBadge
          icon={model.isExporting ? ArrowUp01Icon : Leaf01Icon}
          label={badgeLabel}
          color={model.autarkyTone}
        />
      </div>

      <EnergyDistributionDiagram
        model={model}
        compact={size === '1x'}
        showLowCarbon={size === '2x2'}
      />
    </div>
  );
}

/** 2. Power sources chart (bidirectional stacked areas + dashed Consumption curve) */
export function PowerFlowChartWidgetBody({
  model,
  size
}: {
  model: ProOverviewEnergyModel;
  size: ProWidgetSize;
}) {
  return (
    <div className="relative z-[1] flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex min-w-0 flex-col">
          <span
            className={cn(
              'truncate font-mono font-bold tracking-tight text-foreground',
              size === '2x2' ? 'text-2xl' : 'text-lg @[190px]:text-xl'
            )}
          >
            {model.homeKWText}
          </span>
          <span className="truncate text-[11px] text-muted">
            Peak {model.peakHomeKWText} · {model.periodLabel}
          </span>
        </div>
        <EnergyStatusBadge
          icon={FlashIcon}
          label={size === '1x' ? `${model.selfSufficiencyPct}% clean` : model.gridNetText}
          color={model.autarkyTone}
        />
      </div>

      <PowerSourcesAreaChart
        data={model.powerSourcesSeries}
        height={size === '1x' ? 92 : size === '2x' ? 128 : 176}
        showAxes={size !== '1x'}
        showLegend={size !== '1x'}
        liveWatts={{
          solarKW: model.solarKW,
          gridKW: model.gridKW,
          batteryKW: model.batteryKW,
          homeKW: model.homeKW
        }}
      />
    </div>
  );
}

/** 3. Energy usage & Grid energy balance */
export function EnergyUsageWidgetBody({
  model,
  size
}: {
  model: ProOverviewEnergyModel;
  size: ProWidgetSize;
}) {
  return (
    <div className="relative z-[1] flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex min-w-0 flex-col">
          <span
            className={cn(
              'truncate font-mono font-bold tracking-tight text-foreground',
              size === '2x2' ? 'text-2xl' : 'text-lg @[190px]:text-xl'
            )}
          >
            {model.homeKwhText}
          </span>
          <span className="truncate text-[11px] text-muted">
            {model.solarOffsetPct}% solar offset · {model.dateLabel}
          </span>
        </div>
        <EnergyStatusBadge icon={Wallet01Icon} label={model.netCostText} color="accent" />
      </div>

      <GridBalanceBar
        importKwh={model.gridImportKwh}
        exportKwh={model.gridExportKwh}
        netKwh={model.netGridKwh}
      />

      {size === '2x' ? (
        <div className="grid grid-cols-1 gap-2 @[280px]:grid-cols-2">
          <ArcGauge
            mode="percent"
            value={model.periodAutarkyPct}
            centerText={`${model.periodAutarkyPct}%`}
            label="Self-sufficiency"
            icon={Sun01Icon}
            accentColor={model.periodAutarkyPct >= 50 ? '#10b981' : '#f59e0b'}
            compact
          />
          <ArcGauge
            mode="percent"
            value={model.selfConsumptionPct}
            centerText={`${model.selfConsumptionPct}%`}
            label="Self-consumed solar"
            icon={SolarPanel01Icon}
            accentColor="#10b981"
            compact
          />
        </div>
      ) : null}

      {size === '2x2' ? (
        <BidirectionalBarChart
          data={model.electricitySeries}
          height={154}
          showAxes
          showLegend
        />
      ) : null}
    </div>
  );
}

/** 4. Electricity bidirectional stacked bar chart */
export function EnergyUsageChartWidgetBody({
  model,
  size
}: {
  model: ProOverviewEnergyModel;
  size: ProWidgetSize;
}) {
  return (
    <div className="relative z-[1] flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex min-w-0 flex-col">
          <span
            className={cn(
              'truncate font-mono font-bold tracking-tight text-foreground',
              size === '2x2' ? 'text-2xl' : 'text-lg @[190px]:text-xl'
            )}
          >
            {model.homeKwhText}
          </span>
          <span className="truncate text-[11px] text-muted">
            Import {model.gridImportKwhText} · Return {model.gridExportKwhText}
          </span>
        </div>
        <EnergyStatusBadge
          icon={ChartBarIncreasingIcon}
          label={size === '1x' ? model.netGridKwhText : model.netCostText}
          color={model.netGridKwh < 0 ? 'success' : 'accent'}
        />
      </div>

      <BidirectionalBarChart
        data={model.electricitySeries}
        height={size === '1x' ? 92 : size === '2x' ? 128 : 176}
        showAxes={size !== '1x'}
        showLegend={size !== '1x'}
      />
    </div>
  );
}

/** 5. Solar production & self-consumption dials */
export function SolarProductionWidgetBody({
  model,
  size
}: {
  model: ProOverviewEnergyModel;
  size: ProWidgetSize;
}) {
  const isProducing = model.solarKW > 0.04;

  return (
    <div className="relative z-[1] flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex min-w-0 flex-col">
          <span
            className={cn(
              'truncate font-mono font-bold tracking-tight text-foreground',
              size === '2x2' ? 'text-2xl' : 'text-lg @[190px]:text-xl'
            )}
          >
            {model.solarKwhText}
          </span>
          <span className="truncate text-[11px] text-muted">
            {model.solarForecastKwh !== null
              ? `Target ${model.solarForecastText}`
              : `${model.selfConsumptionPct}% consumed locally`}
          </span>
        </div>
        <EnergyStatusBadge
          icon={Sun01Icon}
          label={isProducing ? `${model.solarKWText} now` : 'Standby'}
          color={isProducing ? 'warning' : 'default'}
        />
      </div>

      {size === '1x' ? (
        <ArcGauge
          mode="percent"
          value={model.selfConsumptionPct}
          centerText={`${model.selfConsumptionPct}%`}
          label="Self-consumed solar"
          icon={SolarPanel01Icon}
          accentColor="#10b981"
          compact
        />
      ) : (
        <div className="grid grid-cols-1 gap-2 @[280px]:grid-cols-2">
          <ArcGauge
            mode="percent"
            value={model.selfConsumptionPct}
            centerText={`${model.selfConsumptionPct}%`}
            label="Self-consumed solar"
            icon={SolarPanel01Icon}
            accentColor="#10b981"
            compact={size === '2x'}
          />
          <ArcGauge
            mode="percent"
            value={model.solarForecastPct}
            centerText={`${model.solarForecastPct}%`}
            label={model.solarForecastKwh !== null ? 'Forecast target' : 'Solar utilization'}
            icon={Calendar03Icon}
            accentColor="#f59e0b"
            compact={size === '2x'}
          />
        </div>
      )}

      {size === '2x2' ? (
        <SolarForecastBarChart data={model.solarForecastSeries} height={144} showAxes />
      ) : null}
    </div>
  );
}

/** 6. Solar production bars + dashed Solar Forecast curve */
export function SolarProductionChartWidgetBody({
  model,
  size
}: {
  model: ProOverviewEnergyModel;
  size: ProWidgetSize;
}) {
  return (
    <div className="relative z-[1] flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex min-w-0 flex-col">
          <span
            className={cn(
              'truncate font-mono font-bold tracking-tight text-foreground',
              size === '2x2' ? 'text-2xl' : 'text-lg @[190px]:text-xl'
            )}
          >
            {model.solarKwhText}
          </span>
          <span className="truncate text-[11px] text-muted">
            {model.solarForecastKwh !== null
              ? `Forecast ${model.solarForecastText} · Dashed estimate`
              : `Exported ${model.gridExportKwhText}`}
          </span>
        </div>
        <EnergyStatusBadge
          icon={SolarPanel01Icon}
          label={
            size === '1x'
              ? model.solarKW > 0.04
                ? model.solarKWText
                : `${model.selfConsumptionPct}% used`
              : `${model.solarForecastPct}% goal`
          }
          color={model.solarKW > 0.04 || model.solarKwh > 0 ? 'warning' : 'default'}
        />
      </div>

      <SolarForecastBarChart
        data={model.solarForecastSeries}
        height={size === '1x' ? 92 : size === '2x' ? 128 : 176}
        showAxes={size !== '1x'}
      />

      {size === '2x2' ? (
        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted">
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon icon={SolarPanel01Icon} size={12} className="text-amber-500" />
            Home <strong className="font-mono text-foreground">{model.solarToHomeKwh.toFixed(1)} kWh</strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon icon={BatteryFullIcon} size={12} className="text-teal-400" />
            Battery <strong className="font-mono text-foreground">{model.solarToBatteryKwh.toFixed(1)} kWh</strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon icon={PlugSocketIcon} size={12} className="text-indigo-400" />
            Export <strong className="font-mono text-foreground">{model.gridExportKwhText}</strong>
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** 7. Energy flow Sankey widget */
export function EnergyFlowWidgetBody({
  model,
  size
}: {
  model: ProOverviewEnergyModel;
  size: ProWidgetSize;
}) {
  const graph = size === '2x2' ? model.energyFlowFull : model.energyFlowCompact;

  return (
    <div className="relative z-[1] flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex min-w-0 flex-col">
          <span
            className={cn(
              'truncate font-mono font-bold tracking-tight text-foreground',
              size === '2x2' ? 'text-2xl' : 'text-lg @[190px]:text-xl'
            )}
          >
            {model.homeKwhText}
          </span>
          <span className="truncate text-[11px] text-muted">
            Sources → Home{size === '2x2' ? ' → Areas' : ''} → Devices
          </span>
        </div>
        <EnergyStatusBadge
          icon={WorkflowSquare01Icon}
          label={`${model.topConsumers.length} tracked`}
          color="accent"
        />
      </div>

      <SankeyChart
        nodes={graph.nodes}
        links={graph.links}
        height={size === '1x' ? 140 : size === '2x' ? 184 : 256}
        compact={size === '1x'}
      />
    </div>
  );
}
