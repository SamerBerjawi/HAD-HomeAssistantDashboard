/**
 * The three Energy widgets (rebuild, Phase 3e) replace the old eight; designs chosen in Phase 4. They read one shared model
 * (`energyStore`), published by `EnergyDataBridge`.
 */
import { lazy } from 'react';
import { FlashIcon, SolarPanel01Icon, WorkflowSquare01Icon } from '@hugeicons/core-free-icons';
import type { ProOverviewEnergyModel } from '../../lib/overviewEnergy';
import { defineWidget } from '../types';
import EnergyFlowCard from './EnergyFlowCard';
import EnergyNowCard from './EnergyNowCard';
import { useEnergyModel } from './energyStore';
import EnergyTodayCard from './EnergyTodayCard';
import { ENERGY_FIXTURE } from './fixture';

export const energyNowWidget = defineWidget<ProOverviewEnergyModel>({
  id: 'energy_now',
  section: 'energy',
  title: 'Energy now',
  icon: FlashIcon,
  sizes: ['s', 'w', 'l'],
  defaultSize: 'l',
  useModel: useEnergyModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 4): concept A's layout on concept B's colours.
  designs: [{ id: 'glow', name: 'Glow', description: 'Home draw and sources on the colour of what powers the home', Body: EnergyNowCard }],
  Sheet: lazy(() => import('./EnergySheet').then((m) => ({ default: m.EnergyNowSheet }))),
  subtitle: (m) => (m.hasSolar && m.solarKW > 0.04 ? `Solar ${m.solarKWText}` : m.gridNetText),
  fixture: ENERGY_FIXTURE
});

export const energyTodayWidget = defineWidget<ProOverviewEnergyModel>({
  id: 'energy_today',
  section: 'energy',
  title: 'Energy today',
  icon: SolarPanel01Icon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: useEnergyModel,
  // Owner choice (Phase 4): A's labels and consumption with C's self-powered gauge and in/out bars.
  designs: [{ id: 'balance', name: 'Balance', description: 'Used today, how self-powered, where energy came from and went', Body: EnergyTodayCard }],
  Sheet: lazy(() => import('./EnergySheet').then((m) => ({ default: m.EnergyTodaySheet }))),
  subtitle: (m) => m.periodLabel,
  fixture: ENERGY_FIXTURE
});

export const energyFlowWidget = defineWidget<ProOverviewEnergyModel>({
  id: 'energy_flow',
  section: 'energy',
  title: 'Energy flow',
  icon: WorkflowSquare01Icon,
  sizes: ['l'],
  defaultSize: 'l',
  useModel: useEnergyModel,
  // Owner choice (Phase 4): concept A, the Sankey.
  designs: [{ id: 'sankey', name: 'Sankey', description: 'Sources to home to areas to devices', Body: EnergyFlowCard }],
  Sheet: lazy(() => import('./EnergySheet').then((m) => ({ default: m.EnergyFlowSheet }))),
  subtitle: (m) => m.periodLabel,
  fixture: ENERGY_FIXTURE
});
