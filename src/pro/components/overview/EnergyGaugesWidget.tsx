/**
 * HA "Grid energy balance" + 4 semicircular ArcGauge cards widget (energy_gauges)
 * across 1x, 2x, 2x2 sizes (reused in widgets/energy/EnergySheet).
 */
import {
  Leaf01Icon,
  PlugSocketIcon,
  SolarPanel01Icon,
  Sun01Icon
} from '@hugeicons/core-free-icons';
import type { ProOverviewEnergyModel } from '../../lib/overviewEnergy';
import type { ProWidgetSize } from '../../lib/overviewWidgets';
import { ArcGauge, GridBalanceBar } from '../../ui/bklit/GaugeChart';

export function EnergyGaugesWidgetBody({
  model,
  size
}: {
  model: ProOverviewEnergyModel;
  size: ProWidgetSize;
}) {
  const netDisplay =
    Math.abs(model.netGridKwh) >= 10
      ? `${model.netGridKwh.toFixed(1)} kWh`
      : `${model.netGridKwh.toFixed(2)} kWh`;

  return (
    <div className="relative z-[1] flex flex-col gap-2.5">
      <GridBalanceBar
        importKwh={model.gridImportKwh}
        exportKwh={model.gridExportKwh}
        netKwh={model.netGridKwh}
      />

      {size === '1x' ? (
        <div className="grid grid-cols-1 gap-2 @[200px]:grid-cols-2">
          <ArcGauge
            mode="bipolar"
            value={model.netGridRatio}
            centerText={netDisplay}
            label="Net grid"
            icon={PlugSocketIcon}
            compact
          />
          <ArcGauge
            mode="percent"
            value={model.periodAutarkyPct}
            centerText={`${model.periodAutarkyPct}%`}
            label="Self-sufficiency"
            icon={Sun01Icon}
            accentColor="var(--energy-solar)"
            compact
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <ArcGauge
            mode="bipolar"
            value={model.netGridRatio}
            centerText={netDisplay}
            label="Net grid import"
            icon={PlugSocketIcon}
            compact={size === '2x'}
          />
          <ArcGauge
            mode="percent"
            value={model.selfConsumptionPct}
            centerText={`${model.selfConsumptionPct}%`}
            label="Solar self-use"
            icon={SolarPanel01Icon}
            accentColor="var(--success)"
            compact={size === '2x'}
          />
          <ArcGauge
            mode="percent"
            value={model.periodAutarkyPct}
            centerText={`${model.periodAutarkyPct}%`}
            label="Self-sufficiency"
            icon={Sun01Icon}
            accentColor={model.periodAutarkyPct >= 50 ? 'var(--success)' : 'var(--energy-solar)'}
            compact={size === '2x'}
          />
          <ArcGauge
            mode="percent"
            value={model.solarForecastKwh !== null ? model.solarForecastPct : model.distribution.lowCarbonPct}
            centerText={`${model.solarForecastKwh !== null ? model.solarForecastPct : model.distribution.lowCarbonPct}%`}
            label={model.solarForecastKwh !== null ? 'Solar forecast goal' : 'Clean solar share'}
            icon={Leaf01Icon}
            accentColor="var(--success)"
            compact={size === '2x'}
          />
        </div>
      )}
    </div>
  );
}
