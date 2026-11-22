import { lazy } from 'react';
import { CleanIcon } from '@hugeicons/core-free-icons';
import type { ProVacuumsModel } from '../../lib/overviewAppliances';
import { defineWidget } from '../types';
import { VACUUMS_FIXTURE } from './fixture';
import { useVacuumsModel } from './useVacuumsModel';
import VacuumsConceptB from './concepts/VacuumsConceptB';

/** Below this, a vacuum away from its dock gets an attention pill. */
export const LOW_VACUUM_BATTERY = 20;

export const vacuumsWidget = defineWidget<ProVacuumsModel>({
  id: 'vacuums',
  section: 'vacuums',
  title: 'Vacuums',
  icon: CleanIcon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: useVacuumsModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 1): concept B, "floor", with a battery icon.
  designs: [{ id: 'floor', name: 'Floor', description: 'The robot on its floor', Body: VacuumsConceptB }],
  Sheet: lazy(() => import('./VacuumsSheet')),
  count: (m) => m.cleaningCount,
  subtitle: (m) => (m.totalCount === 0 ? undefined : m.subtitleText),
  attention: (m) => {
    const broken = m.items.find((v) => v.isError);
    if (broken) return { label: `${broken.name}: ${broken.badgeText}`, tone: 'warning' };
    const low = m.items.find((v) => v.batteryPct !== null && v.batteryPct < LOW_VACUUM_BATTERY && !v.batteryCharging && !v.isDocked);
    return low ? { label: `${low.name} battery ${low.batteryPct}%`, tone: 'warning' } : null;
  },
  fixture: VACUUMS_FIXTURE
});
