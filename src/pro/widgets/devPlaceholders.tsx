/**
 * Dev-only placeholder widgets for the layout engine (rebuild, Phases 2–3). They stand in for
 * widgets not ported yet so sections, sizes and Flow can be tried with a realistic mix. Phase 3
 * replaces them one by one; the dev page drops a placeholder once the registry has its id.
 */
import { CloudIcon, Fan01Icon, FlashIcon, PaintBoardIcon, SolarPanel01Icon, ThermometerIcon } from '@hugeicons/core-free-icons';
import { SIZE_CELLS, SIZE_LABELS } from '../lib/overviewLayout';
import { defineWidget, type WidgetBodyProps, type WidgetDefinition } from './types';

interface PlaceholderModel {
  value: string;
}

function PlaceholderBody({ model, size }: WidgetBodyProps<PlaceholderModel>) {
  return (
    <div className="flex h-full flex-col justify-end gap-1">
      <p className="text-lg font-semibold leading-tight">{model.value}</p>
      <p className="text-xs text-muted">
        Placeholder · {SIZE_LABELS[size]} {SIZE_CELLS[size].w}×{SIZE_CELLS[size].h}
      </p>
    </div>
  );
}

const placeholder = (def: Omit<WidgetDefinition<PlaceholderModel>, 'useModel' | 'Body' | 'fixture'> & { value: string }) => {
  const model = { value: def.value };
  return defineWidget<PlaceholderModel>({ ...def, useModel: () => model, Body: PlaceholderBody, fixture: model });
};

export const DEV_PLACEHOLDERS = [
  placeholder({ id: 'weather', section: 'climate', title: 'Weather', icon: CloudIcon, value: '18° · Partly cloudy', sizes: ['s', 'w', 't', 'l'], defaultSize: 'w' }),
  placeholder({ id: 'thermostat', section: 'climate', title: 'Thermostat', icon: ThermometerIcon, value: 'Heating to 21°', sizes: ['s', 'w'], defaultSize: 's' }),
  placeholder({ id: 'fans', section: 'climate', title: 'Fans', icon: Fan01Icon, value: '2 of 4 on', sizes: ['s', 'w', 't'], defaultSize: 's' }),
  placeholder({ id: 'scenes', section: 'lights', title: 'Scenes', icon: PaintBoardIcon, value: 'Evening active', sizes: ['s', 'w'], defaultSize: 's' }),
  placeholder({ id: 'energy_now', section: 'energy', title: 'Energy now', icon: FlashIcon, value: '1.8 kW from grid', sizes: ['w', 'l'], defaultSize: 'l' }),
  placeholder({ id: 'energy_today', section: 'energy', title: 'Energy today', icon: SolarPanel01Icon, value: '14.2 kWh used', sizes: ['s', 'w', 'l'], defaultSize: 'w' })
];
