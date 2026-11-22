import { lazy } from 'react';
import { DoorIcon } from '@hugeicons/core-free-icons';
import { sensorFixture } from '../sensors/fixture';
import OpeningsConceptB from './concepts/OpeningsConceptB';
import type { SensorGroupModel } from '../sensors/sensorGroup';
import { useOpeningsModel } from '../sensors/useSensorGroupModel';
import { defineWidget } from '../types';

/** Doors and windows in one widget (replaces the old `doors` and `windows`). */
export const openingsWidget = defineWidget<SensorGroupModel>({
  id: 'openings',
  section: 'openings',
  title: 'Doors & windows',
  icon: DoorIcon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: useOpeningsModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 3): concept B, "draught".
  designs: [{ id: 'draught', name: 'Draught', description: 'Calm when shut, amber when open', Body: OpeningsConceptB }],
  Sheet: lazy(() => import('../sensors/SensorGroupSheet')),
  count: (m) => m.activeCount,
  subtitle: (m) => (m.totalCount === 0 ? undefined : m.activeCount > 0 ? `${m.activeCount} of ${m.totalCount} open` : 'All closed'),
  attention: (m) => (m.activeCount > 0 ? { label: m.activeCount === 1 ? `${m.items[0].shortName} open` : `${m.activeCount} open`, tone: 'warning' } : null),
  fixture: sensorFixture('openings')
});
