import { lazy } from 'react';
import { Motion01Icon } from '@hugeicons/core-free-icons';
import { sensorFixture } from '../sensors/fixture';
import MotionConceptC from './concepts/MotionConceptC';
import type { SensorGroupModel } from '../sensors/sensorGroup';
import { useMotionModel } from '../sensors/useSensorGroupModel';
import { defineWidget } from '../types';

export const motionWidget = defineWidget<SensorGroupModel>({
  id: 'motion',
  section: 'security',
  title: 'Motion',
  icon: Motion01Icon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 's',
  useModel: useMotionModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 3): concept C, "the last hour", with room names at Small.
  designs: [{ id: 'timeline', name: 'Last hour', description: 'A lane per room over the last hour', Body: MotionConceptC }],
  Sheet: lazy(() => import('../sensors/SensorGroupSheet')),
  count: (m) => m.activeCount,
  subtitle: (m) => (m.totalCount === 0 ? undefined : m.activeCount > 0 ? `${m.activeCount} of ${m.totalCount} zones` : `${m.totalCount} zones clear`),
  fixture: sensorFixture('motion')
});
