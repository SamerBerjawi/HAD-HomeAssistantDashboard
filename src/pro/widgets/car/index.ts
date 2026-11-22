/**
 * Car widget (new, 2026-11-20): the car the Mobility page reads (`deriveCarMetrics`, any EV
 * integration it understands), as one clear state. Owner's design: A's layout on B's colours.
 */
import { lazy } from 'react';
import { Car01Icon } from '@hugeicons/core-free-icons';
import type { ProCarModel } from '../../lib/overviewCar';
import { defineWidget } from '../types';
import CarCard from './CarCard';
import { useCarModel } from './useCarModel';
import { CAR_STATES } from './concepts/states';

export const carWidget = defineWidget<ProCarModel>({
  id: 'car',
  section: 'people',
  title: 'Car',
  icon: Car01Icon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: useCarModel,
  // Owner choice (WIDGET_DESIGN.md, 2026-11-20): concept A's layout on concept B's colours, hold-to-start climate at every size.
  Sheet: lazy(() => import('./CarSheet')),
  designs: [{ id: 'status', name: 'Status', description: 'The car state in words, coloured by what it is doing', Body: CarCard }],
  subtitle: (m) => (m.hasCar ? `${m.modeLabel}${m.socPct !== null ? ` · ${m.socPct}%` : ''}` : 'No car'),
  attention: (m) => {
    const danger = m.alerts.find((a) => a.tone === 'danger');
    return danger ? { label: danger.text, tone: 'danger' } : null;
  },
  fixture: CAR_STATES[1].model
});
