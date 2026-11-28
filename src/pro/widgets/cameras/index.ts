import { lazy } from 'react';
import { Video01Icon } from '@hugeicons/core-free-icons';
import type { ProOverviewCamerasModel } from '../../lib/overviewSecurity';
import { defineWidget } from '../types';
import CamerasConceptA from './concepts/CamerasConceptA';
import { CAMERAS_FIXTURE } from './fixture';
import { useCamerasModel } from './useCamerasModel';

export const camerasWidget = defineWidget<ProOverviewCamerasModel>({
  id: 'cameras',
  section: 'cameras',
  title: 'Cameras',
  icon: Video01Icon,
  sizes: ['s', 'w', 'l'],
  defaultSize: 'w',
  useModel: useCamerasModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 3): concept A, "framed".
  designs: [{ id: 'framed', name: 'Framed', description: 'The picture with a caption below', Body: CamerasConceptA }],
  Sheet: lazy(() => import('./CamerasSheet')),
  subtitle: (m) => (m.totalCount === 0 ? undefined : m.subtitleText),
  fixture: CAMERAS_FIXTURE
});
