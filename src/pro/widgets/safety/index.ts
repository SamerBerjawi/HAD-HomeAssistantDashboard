import { lazy } from 'react';
import { FireIcon } from '@hugeicons/core-free-icons';
import { sensorFixture } from '../sensors/fixture';
import SafetyConceptB from './concepts/SafetyConceptB';
import type { SensorGroupModel } from '../sensors/sensorGroup';
import { useSafetyModel } from '../sensors/useSensorGroupModel';
import { defineWidget } from '../types';

/** Water leaks and smoke in one widget (replaces the old `leak` and `smoke`). */
export const safetyWidget = defineWidget<SensorGroupModel>({
  id: 'safety',
  section: 'security',
  title: 'Safety',
  icon: FireIcon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 's',
  useModel: useSafetyModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 3): concept B, "calm / alarm".
  designs: [{ id: 'calm', name: 'Calm', description: 'Calm card, red when something is detected', Body: SafetyConceptB }],
  Sheet: lazy(() => import('../sensors/SensorGroupSheet')),
  count: (m) => m.activeCount,
  subtitle: (m) => (m.totalCount === 0 ? undefined : m.activeCount > 0 ? `${m.badgeText} detected` : 'Leak & smoke'),
  attention: (m) => (m.activeCount > 0 ? { label: `${m.badgeText} detected`, tone: 'danger' } : null),
  fixture: sensorFixture('safety')
});
