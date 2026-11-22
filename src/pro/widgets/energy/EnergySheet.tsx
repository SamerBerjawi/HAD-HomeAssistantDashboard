/**
 * Energy details (sheet kit, WIDGET_DESIGN.md §8), one sheet for the three energy widgets, each
 * opening on its own view (`?sheet=energy_today&id=solar_production` picks another). Hero: what the
 * home uses now (Now) or over the period, coloured by where it comes from (amber on sun, green
 * when sending power back, blue from the grid). Views: Now, Usage, Solar, Flow, Balance; a period
 * choice (day, week, month) for all but Now; four figures, the view's chart, the biggest users.
 * The period goes back to today when the sheet closes: the cards always show today (owner, 2026-11-19).
 */
import { useEffect, useState } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowRight01Icon,
  ArrowUp01Icon,
  BatteryFullIcon,
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
import { EnergyDistributionDiagram } from '../../components/overview/EnergyDistributionDiagram';
import { EnergyGaugesWidgetBody } from '../../components/overview/EnergyGaugesWidget';
import type { ProOverviewEnergyModel, ProOverviewEnergyView } from '../../lib/overviewEnergy';
import { BidirectionalBarChart } from '../../ui/bklit/BidirectionalBarChart';
import { PowerSourcesAreaChart } from '../../ui/bklit/PowerSourcesAreaChart';
import { SankeyChart } from '../../ui/bklit/SankeyChart';
import { SolarForecastBarChart } from '../../ui/bklit/SolarForecastBarChart';
import { openTab } from '../shared/navigate';
import { DetailSheet, SheetFilter, SheetHero, SheetRow, SheetSection, SheetTile, SheetTiles, type HeroTone } from '../shared/sheet/SheetKit';
import type { WidgetSheetProps } from '../types';
import { useEnergyStore } from './energyStore';

const VIEWS = [
  { id: 'power_flow', label: 'Now', icon: FlashIcon },
  { id: 'energy_usage', label: 'Usage', icon: ChartBarIncreasingIcon },
  { id: 'solar_production', label: 'Solar', icon: SolarPanel01Icon },
  { id: 'energy_flow', label: 'Flow', icon: WorkflowSquare01Icon },
  { id: 'energy_gauges', label: 'Balance', icon: DashboardSpeed01Icon }
] as const satisfies readonly { id: ProOverviewEnergyView; label: string; icon: unknown }[];

type PeriodKey = 'today' | 'week' | 'month';
const periodKey = (p: EnergyHistoryPeriod): PeriodKey => (p === 'week' || p === '7d' ? 'week' : p === 'month' ? 'month' : 'today');

function EnergySheet({ model: m, itemId, onClose, start }: WidgetSheetProps<ProOverviewEnergyModel> & { start: ProOverviewEnergyView }) {
  const [view, setView] = useState<ProOverviewEnergyView>(VIEWS.find((v) => v.id === itemId)?.id ?? start);
  const setPeriod = useEnergyStore((s) => s.setPeriod);
  useEffect(() => () => useEnergyStore.getState().setPeriod('today'), []);
  const live = view === 'power_flow';
  const tone: HeroTone = live ? (m.solarKW > 0.04 ? 'amber' : m.isExporting ? 'secure' : 'blue') : m.solarKwh > 0 ? 'amber' : 'blue';

  return (
    <DetailSheet
      title="Energy details"
      onClose={onClose}
      hero={
        <SheetHero
          icon={FlashIcon}
          eyebrow={live ? 'Energy now' : `Energy · ${m.dateLabel}`}
          tone={tone}
          headline={live ? `Home uses ${m.homeKWText}` : `${m.homeKwhText} used`}
          sub={live ? [`${m.selfSufficiencyPct}% from clean sources`, m.gridNetText].filter(Boolean).join(' · ') : [`${m.periodAutarkyPct}% self-powered`, `net ${m.netCostText}`].join(' · ')}
          onClose={onClose}
        />
      }
      toolbar={
        <>
          <SheetFilter<ProOverviewEnergyView> label="Energy view" value={view} onChange={setView} options={VIEWS.map((v) => ({ id: v.id, label: v.label, icon: v.icon }))} />
          {!live ? (
            <SheetFilter<PeriodKey>
              label="Period"
              value={periodKey(m.period)}
              onChange={(p) => setPeriod(p as EnergyHistoryPeriod)}
              options={[
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'Week' },
                { id: 'month', label: 'Month' }
              ]}
            />
          ) : null}
        </>
      }
    >
      <SheetTiles>
        <SheetTile icon={Home01Icon} label="Home" value={live ? m.homeKWText : m.homeKwhText} note={live ? `${m.selfSufficiencyPct}% clean` : `${m.periodAutarkyPct}% self-powered`} />
        <SheetTile
          icon={SolarPanel01Icon}
          tone={m.solarKW > 0.04 || m.solarKwh > 0 ? 'warning' : 'default'}
          label="Solar"
          value={live ? m.solarKWText : m.solarKwhText}
          note={live ? (m.solarKW > 0.04 ? 'Producing' : 'Idle') : `${m.selfConsumptionPct}% used at home`}
        />
        <SheetTile
          icon={m.isExporting ? ArrowUp01Icon : PlugSocketIcon}
          tone={m.isExporting || m.netGridKwh < 0 ? 'success' : 'active'}
          label="Grid"
          value={live ? m.gridNetText.replace(/^(Exporting|Importing)\s+/, '') : m.netGridKwhText.replace(' net', '')}
          note={live ? (m.isExporting ? 'Sending back' : 'Drawing') : `${m.gridExportKwhText} sent back`}
        />
        {live && m.hasBattery ? (
          <SheetTile
            icon={BatteryFullIcon}
            tone={m.batterySoC !== null && m.batterySoC < 20 ? 'warning' : 'success'}
            label="Battery"
            value={m.batterySoC !== null ? `${m.batterySoC}%` : m.batteryKWText}
            note={m.batteryStatusLabel}
          />
        ) : (
          <SheetTile icon={Wallet01Icon} tone={m.netCost <= 0 ? 'success' : 'default'} label="Net cost" value={m.netCostText} note={`${m.gridImportKwhText} bought`} />
        )}
      </SheetTiles>

      <SheetSection title={live ? 'Where power comes from' : undefined} plain>
        <div className="pro-surface flex flex-col gap-3 rounded-[18px] p-3.5">
          {view === 'power_flow' ? (
            <>
              <EnergyDistributionDiagram model={m} showLowCarbon />
              <PowerSourcesAreaChart data={m.powerSourcesSeries} height={186} showAxes showLegend liveWatts={{ solarKW: m.solarKW, gridKW: m.gridKW, batteryKW: m.batteryKW, homeKW: m.homeKW }} />
            </>
          ) : view === 'energy_usage' ? (
            <BidirectionalBarChart data={m.electricitySeries} height={216} showAxes showLegend />
          ) : view === 'solar_production' ? (
            <SolarForecastBarChart data={m.solarForecastSeries} height={216} showAxes />
          ) : view === 'energy_flow' ? (
            <SankeyChart nodes={m.energyFlowFull.nodes} links={m.energyFlowFull.links} height={280} />
          ) : (
            <EnergyGaugesWidgetBody model={m} size="2x2" />
          )}
        </div>
      </SheetSection>

      <SheetSection title="Biggest users" aside={`${m.homeKwhText} in all`}>
        {m.topConsumers.length === 0 ? (
          <SheetRow icon={PlugSocketIcon} title="No device meters" subtitle="Devices with an energy sensor show up here." />
        ) : (
          m.topConsumers.map((d) => (
            <SheetRow key={d.id} icon={FlashIcon} tone="active" title={d.name} trailing={<span className="text-sm font-medium tabular-nums">{d.kwhText}</span>}>
              <div className="flex items-center gap-2">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-default/70">
                  <span className="block h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, Math.max(4, d.sharePct))}%` }} />
                </span>
                <span className="w-9 text-right text-xs tabular-nums text-muted">{d.sharePct}%</span>
              </div>
            </SheetRow>
          ))
        )}
      </SheetSection>

      <Button
        size="sm"
        variant="secondary"
        className="self-center"
        // Going to another page drops the sheet with the Overview; Back returns to it.
        onPress={() => openTab('energy')}
      >
        Open the Energy page
        <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
      </Button>
    </DetailSheet>
  );
}

export const EnergyNowSheet = (p: WidgetSheetProps<ProOverviewEnergyModel>) => <EnergySheet {...p} start="power_flow" />;
export const EnergyTodaySheet = (p: WidgetSheetProps<ProOverviewEnergyModel>) => <EnergySheet {...p} start="energy_usage" />;
export const EnergyFlowSheet = (p: WidgetSheetProps<ProOverviewEnergyModel>) => <EnergySheet {...p} start="energy_flow" />;
