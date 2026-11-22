import { lazy } from 'react';
import { Fan01Icon } from '@hugeicons/core-free-icons';
import type { ProFansModel } from '../../lib/overviewAppliances';
import { defineWidget } from '../types';
import FansConceptB from './concepts/FansConceptB';
import { FANS_FIXTURE } from './fixture';
import { useFansModel } from './useFansModel';

export const fansWidget = defineWidget<ProFansModel>({
  id: 'fans',
  section: 'climate',
  title: 'Fans',
  icon: Fan01Icon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 's',
  useModel: useFansModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 2): concept B, "airflow".
  designs: [{ id: 'airflow', name: 'Airflow', description: 'Moving air that speeds up with the fans', Body: FansConceptB }],
  Sheet: lazy(() => import('./FansSheet')),
  count: (m) => m.onCount,
  subtitle: (m) => (m.totalCount === 0 ? 'No fans' : m.onCount === 0 ? 'All off' : `${m.onCount} of ${m.totalCount} running`),
  fixture: FANS_FIXTURE
});
