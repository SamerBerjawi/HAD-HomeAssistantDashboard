import { lazy } from 'react';
import { UserGroupIcon } from '@hugeicons/core-free-icons';
import type { ProOverviewPresenceModel } from '../../lib/overviewPresence';
import { defineWidget } from '../types';
import { PRESENCE_FIXTURE } from './fixture';
import PresenceConceptB from './concepts/PresenceConceptB';
import { usePresenceModel } from './usePresenceModel';

// Keeps the old id ('users') so saved layouts and the migration carry over.
export const presenceWidget = defineWidget<ProOverviewPresenceModel>({
  id: 'users',
  section: 'people',
  title: 'Family presence',
  icon: UserGroupIcon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: usePresenceModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 1): concept B, "portraits".
  designs: [{ id: 'portraits', name: 'Portraits', description: 'Faces of who is home', Body: PresenceConceptB }],
  Sheet: lazy(() => import('./PresenceSheet')),
  count: (m) => m.homeCount,
  subtitle: (m) => (m.totalCount === 0 ? undefined : `${m.homeCount} of ${m.totalCount} home`),
  fixture: PRESENCE_FIXTURE
});
