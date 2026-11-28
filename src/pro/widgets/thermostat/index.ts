/** Thermostat widget (Overview rebuild, Phase 2 of the widget designs): climate entities. */
import { lazy, useMemo } from 'react';
import { ThermometerIcon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { buildThermostatModel, chosenThermostatId, type ProThermostatModel } from '../../lib/overviewThermostat';
import { useDomainEntities } from '../shared/entities';
import { defineWidget } from '../types';
import ThermostatCard from './ThermostatCard';
import { THERMOSTAT_STATES } from './concepts/states';

function useThermostatModel(): ProThermostatModel {
  const climates = useDomainEntities('climate');
  const { config } = useUserConfig();
  const chosen = chosenThermostatId(config.preferences);
  return useMemo(() => buildThermostatModel(climates, chosen), [climates, chosen]);
}

export const thermostatWidget = defineWidget<ProThermostatModel>({
  id: 'thermostat',
  section: 'climate',
  title: 'Thermostat',
  icon: ThermometerIcon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 's',
  useModel: useThermostatModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 2): concept B, "climate"; choose the thermostat on the card (2026-11-20).
  Sheet: lazy(() => import('./ThermostatSheet')),
  designs: [{ id: 'climate', name: 'Climate', description: 'The card is warm while heating, icy while cooling', Body: ThermostatCard }],
  count: (m) => m.activeCount,
  subtitle: (m) => (m.totalCount === 0 ? 'No thermostats' : m.activeCount === 0 ? 'Idle' : `${m.activeCount} of ${m.totalCount} active`),
  fixture: THERMOSTAT_STATES[0].model
});
