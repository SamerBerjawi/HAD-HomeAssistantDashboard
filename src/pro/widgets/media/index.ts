import { lazy } from 'react';
import { MusicNote03Icon } from '@hugeicons/core-free-icons';
import type { ProMediaOverviewModel } from '../../lib/overviewMedia';
import { defineWidget } from '../types';
import { MEDIA_FIXTURE } from './fixture';
import MediaCard from './MediaCard';
import { useMediaModel } from './useMediaModel';

export const mediaWidget = defineWidget<ProMediaOverviewModel>({
  id: 'media',
  section: 'media',
  title: 'Media',
  icon: MusicNote03Icon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: useMediaModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 1): a mix of concepts A, B and C (see MediaCard).
  designs: [{ id: 'cover', name: 'Cover', description: 'The cover on its own colours', Body: MediaCard }],
  Sheet: lazy(() => import('./MediaSheet')),
  count: (m) => m.playingCount,
  subtitle: (m) => (m.totalCount === 0 ? undefined : m.playingCount > 0 ? `${m.playingCount} playing` : m.subtitleText),
  fixture: MEDIA_FIXTURE
});
