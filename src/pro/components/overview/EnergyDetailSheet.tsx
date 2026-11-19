/**
 * Energy Detail Sheet for pro Overview (docs/pro-ui/DESIGN.md 7.6, Option 1 + Option A revision):
 * ProSheet (Drawer on phones <768 px, Modal size="lg" from 768 px up) with view switcher
 * (Distribution & power, Electricity, Solar & forecast, Energy flow, Gauges & balance),
 * Day/Week/Month period ToggleButtonGroup, 4-source KPIs, HA-aligned bklit/Magic UI charts,
 * top tracked consumers, and link to Full Energy Analytics (/energy).
 */
import { Badge, Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Analytics01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpRight01Icon,
  BatteryFullIcon,
  Calendar03Icon,
  ChartBarIncreasingIcon,
  DashboardSpeed01Icon,
  FlashIcon,
  Home01Icon,
  PlugSocketIcon,
  SolarPanel01Icon,
  Wallet01Icon,
  WorkflowSquare01Icon
} from '@hugeicons/core-free-icons';
import type { EnergyHistoryPeriod } from '@/services/haEnergyStatistics';
import { cn } from '@/lib/utils';
import type {
  ProEnergyTone,
  ProOverviewEnergyModel,
  ProOverviewEnergyView
} from '../../lib/overviewEnergy';
import { BidirectionalBarChart } from '../../ui/bklit/BidirectionalBarChart';
import { PowerSourcesAreaChart } from '../../ui/bklit/PowerSourcesAreaChart';
import { SankeyChart } from '../../ui/bklit/SankeyChart';
import { SolarForecastBarChart } from '../../ui/bklit/SolarForecastBarChart';
import { ProSheet } from '../ProSheet';
import { EnergyDistributionDiagram } from './EnergyDistributionDiagram';
import { EnergyGaugesWidgetBody } from './EnergyGaugesWidget';

interface EnergyDetailSheetProps {
  activeView: ProOverviewEnergyView | null;
  onSelectView: (view: ProOverviewEnergyView | null) => void;
  period: EnergyHistoryPeriod;
  onSelectPeriod: (period: EnergyHistoryPeriod) => void;
  model: ProOverviewEnergyModel;
}

const VIEW_META: Record<
  ProOverviewEnergyView,
  { title: string; subtitle: string; icon: IconSvgElement }
> = {
  power_flow: {
    title: 'Energy distribution & power',
    subtitle: 'Real-time source diamond and bidirectional power flow',
    icon: FlashIcon
  },
  energy_usage: {
    title: 'Electricity & grid balance',
    subtitle: 'Stacked hourly/period consumption vs battery and grid return',
    icon: ChartBarIncreasingIcon
  },
  solar_production: {
    title: 'Solar production & forecast',
    subtitle: 'PV generation bars against hourly forecast curve',
    icon: SolarPanel01Icon
  },
  energy_flow: {
    title: 'Energy flow',
    subtitle: 'Sankey breakdown from supply through home areas to devices',
    icon: WorkflowSquare01Icon
  },
  energy_gauges: {
    title: 'Grid balance & gauges',
    subtitle: 'Grid exchange balance, autarky, and self-consumption efficiency',
    icon: DashboardSpeed01Icon
  }
};

const TONE_TEXT: Record<ProEnergyTone, string> = {
  default: 'text-muted',
  accent: 'text-[var(--accent)]',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger'
};

const PERIOD_KEY = (period: EnergyHistoryPeriod): 'day' | 'week' | 'month' => {
  if (period === 'week' || period === '7d') return 'week';
  if (period === 'month') return 'month';
  return 'day';
};

function KpiCard({
  icon,
  label,
  value,
  badgeLabel,
  tone = 'default'
}: {
  icon: IconSvgElement;
  label: string;
  value: string;
  badgeLabel: string;
  tone?: ProEnergyTone;
}) {
  return (
    <div className="pro-surface flex min-w-0 flex-col justify-between gap-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted">
          <HugeiconsIcon icon={icon} size={14} className={cn('shrink-0', TONE_TEXT[tone])} />
          <span className="truncate">{label}</span>
        </span>
        <Badge
          size="sm"
          variant="soft"
          color={tone}
          className="static transform-none! inline-flex min-h-5 min-w-0 shrink-0 items-center gap-1 rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold"
        >
          <HugeiconsIcon icon={icon} size={10} />
          <Badge.Label>{badgeLabel}</Badge.Label>
        </Badge>
      </div>
      <span className="truncate font-mono text-lg font-bold tracking-tight text-foreground">
        {value}
      </span>
    </div>
  );
}

export function EnergyDetailSheet({
  activeView,
  onSelectView,
  period,
  onSelectPeriod,
  model
}: EnergyDetailSheetProps) {
  const view = activeView ?? 'power_flow';
  const meta = VIEW_META[view];
  const currentPeriodKey = PERIOD_KEY(period);

  const handleOpenFullEnergy = () => {
    onSelectView(null);
    window.history.pushState({ tab: 'energy' }, '', '/energy');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <ProSheet
      isOpen={activeView !== null}
      onOpenChange={(open) => {
        if (!open) onSelectView(null);
      }}
      title={meta.title}
      subtitle={`${model.dateLabel} · ${meta.subtitle}`}
      icon={meta.icon}
      page="overview"
      size="lg"
    >
      <div className="flex flex-col gap-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ToggleButtonGroup
            aria-label="Energy sheet view"
            size="sm"
            isDetached
            selectionMode="single"
            disallowEmptySelection
            className="max-w-full flex-wrap gap-y-1.5"
            selectedKeys={new Set([view])}
            onSelectionChange={(keys) => {
              const next = [...keys][0] as ProOverviewEnergyView | undefined;
              if (next) onSelectView(next);
            }}
          >
            <ToggleButton id="power_flow" className="gap-1.5 whitespace-nowrap">
              <HugeiconsIcon icon={FlashIcon} size={14} />
              Power
            </ToggleButton>
            <ToggleButton id="energy_usage" className="gap-1.5 whitespace-nowrap">
              <HugeiconsIcon icon={ChartBarIncreasingIcon} size={14} />
              Electricity
            </ToggleButton>
            <ToggleButton id="solar_production" className="gap-1.5 whitespace-nowrap">
              <HugeiconsIcon icon={SolarPanel01Icon} size={14} />
              Solar
            </ToggleButton>
            <ToggleButton id="energy_flow" className="gap-1.5 whitespace-nowrap">
              <HugeiconsIcon icon={WorkflowSquare01Icon} size={14} />
              Flow
            </ToggleButton>
            <ToggleButton id="energy_gauges" className="gap-1.5 whitespace-nowrap">
              <HugeiconsIcon icon={DashboardSpeed01Icon} size={14} />
              Gauges
            </ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            aria-label="Energy history period"
            size="sm"
            isDetached
            selectionMode="single"
            disallowEmptySelection
            className="max-w-full flex-wrap gap-y-1.5"
            selectedKeys={new Set([currentPeriodKey])}
            onSelectionChange={(keys) => {
              const next = [...keys][0] as 'day' | 'week' | 'month' | undefined;
              if (next) onSelectPeriod(next);
            }}
          >
            <ToggleButton id="day" className="gap-1 whitespace-nowrap">
              <HugeiconsIcon icon={Calendar03Icon} size={13} />
              Day
            </ToggleButton>
            <ToggleButton id="week" className="gap-1 whitespace-nowrap">
              <HugeiconsIcon icon={Calendar03Icon} size={13} />
              Week
            </ToggleButton>
            <ToggleButton id="month" className="gap-1 whitespace-nowrap">
              <HugeiconsIcon icon={Calendar03Icon} size={13} />
              Month
            </ToggleButton>
          </ToggleButtonGroup>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <KpiCard
            icon={Home01Icon}
            label="Home load"
            value={view === 'power_flow' ? model.homeKWText : model.homeKwhText}
            badgeLabel={view === 'power_flow' ? `${model.selfSufficiencyPct}% clean` : `${model.periodAutarkyPct}% autarky`}
            tone={model.autarkyTone}
          />
          <KpiCard
            icon={SolarPanel01Icon}
            label="Solar yield"
            value={view === 'power_flow' ? model.solarKWText : model.solarKwhText}
            badgeLabel={
              view === 'power_flow'
                ? model.solarKW > 0.04
                  ? 'Producing'
                  : 'Idle'
                : `${model.selfConsumptionPct}% local`
            }
            tone={model.solarKwh > 0 || model.solarKW > 0.04 ? 'warning' : 'default'}
          />
          <KpiCard
            icon={model.isExporting ? ArrowUp01Icon : PlugSocketIcon}
            label={view === 'power_flow' ? 'Grid live' : 'Grid net'}
            value={
              view === 'power_flow'
                ? model.gridNetText.replace(/^(Exporting|Importing)\s+/, '')
                : model.netGridKwhText.replace(' net', '')
            }
            badgeLabel={
              view === 'power_flow'
                ? model.isExporting
                  ? 'Exporting'
                  : 'Importing'
                : `${model.gridExportKwhText} out`
            }
            tone={model.isExporting || model.netGridKwh < 0 ? 'success' : 'accent'}
          />
          {view === 'power_flow' && model.hasBattery ? (
            <KpiCard
              icon={BatteryFullIcon}
              label="Battery"
              value={model.batterySoC !== null ? `${model.batterySoC}%` : model.batteryKWText}
              badgeLabel={model.batteryStatusLabel}
              tone={model.batterySoC !== null && model.batterySoC < 20 ? 'warning' : 'success'}
            />
          ) : (
            <KpiCard
              icon={Wallet01Icon}
              label="Net cost"
              value={model.netCostText}
              badgeLabel={`${model.gridImportKwhText} in`}
              tone={model.netCost <= 0 ? 'success' : 'default'}
            />
          )}
        </div>

        {view === 'power_flow' ? (
          <div className="flex flex-col gap-3">
            <div className="pro-surface p-3.5">
              <EnergyDistributionDiagram model={model} showLowCarbon />
            </div>
            <div className="pro-surface p-3.5">
              <PowerSourcesAreaChart
                data={model.powerSourcesSeries}
                height={186}
                showAxes
                showLegend
                liveWatts={{
                  solarKW: model.solarKW,
                  gridKW: model.gridKW,
                  batteryKW: model.batteryKW,
                  homeKW: model.homeKW
                }}
              />
            </div>
          </div>
        ) : null}

        {view === 'energy_usage' ? (
          <div className="pro-surface p-3.5">
            <BidirectionalBarChart
              data={model.electricitySeries}
              height={216}
              showAxes
              showLegend
            />
          </div>
        ) : null}

        {view === 'solar_production' ? (
          <div className="pro-surface p-3.5">
            <SolarForecastBarChart
              data={model.solarForecastSeries}
              height={216}
              showAxes
            />
          </div>
        ) : null}

        {view === 'energy_flow' ? (
          <div className="pro-surface p-3.5">
            <SankeyChart
              nodes={model.energyFlowFull.nodes}
              links={model.energyFlowFull.links}
              height={280}
            />
          </div>
        ) : null}

        {view === 'energy_gauges' ? (
          <div className="pro-surface p-3.5">
            <EnergyGaugesWidgetBody model={model} size="2x2" />
          </div>
        ) : null}

        <div className="pro-surface flex flex-col gap-2.5 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} className="text-[var(--accent)]" />
              Top tracked consumers
            </span>
            <span className="font-mono text-[11px] text-muted">{model.homeKwhText} total</span>
          </div>

          {model.topConsumers.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-default/40 px-3 py-2.5 text-xs text-muted">
              <HugeiconsIcon icon={PlugSocketIcon} size={15} className="shrink-0" />
              <span>No individual device consumption sensors configured for this period.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {model.topConsumers.map((device) => (
                <div key={device.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="inline-flex min-w-0 items-center gap-1.5 font-medium text-foreground">
                      <HugeiconsIcon icon={FlashIcon} size={13} className="shrink-0 text-[var(--accent)]" />
                      <span className="truncate">{device.name}</span>
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="font-mono font-semibold text-foreground">{device.kwhText}</span>
                      <Badge
                        size="sm"
                        variant="soft"
                        color="default"
                        className="static transform-none! inline-flex min-h-4 min-w-0 items-center gap-0.5 rounded-full border-0 px-1.5 py-0 text-[10px] font-mono"
                      >
                        <HugeiconsIcon icon={FlashIcon} size={9} />
                        <Badge.Label>{device.sharePct}%</Badge.Label>
                      </Badge>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-default/60">
                    <div
                      className="h-full rounded-full bg-[var(--accent)] transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(4, device.sharePct))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <HugeiconsIcon icon={Calendar03Icon} size={14} />
            Showing {model.dateLabel}
          </span>
          <Button size="sm" variant="secondary" onPress={handleOpenFullEnergy}>
            <HugeiconsIcon icon={Analytics01Icon} size={15} />
            Full Energy Analytics
            <HugeiconsIcon icon={ArrowUpRight01Icon} size={14} />
          </Button>
        </div>
      </div>
    </ProSheet>
  );
}
