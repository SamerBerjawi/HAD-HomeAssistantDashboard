import { lazy } from 'react';
import { BulbIcon } from '@hugeicons/core-free-icons';
import type { ProControlDomainModel } from '../../lib/overviewControls';
import { defineWidget } from '../types';
import { LIGHTS_FIXTURE } from './fixture';
import LightsConceptB from './concepts/LightsConceptB';
import { useLightsModel } from './useLightsModel';

export const lightsWidget = defineWidget<ProControlDomainModel>({
  id: 'lights',
  section: 'lights',
  title: 'Lighting',
  icon: BulbIcon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: useLightsModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 1): concept B, "glow", with a denser Wide.
  designs: [{ id: 'glow', name: 'Glow', description: 'The card glows with the lights that are on', Body: LightsConceptB }],
  Sheet: lazy(() => import('./LightsSheet')),
  count: (m) => m.onCount,
  subtitle: (m) => (m.totalCount === 0 ? 'No lights' : m.onCount === 0 ? 'All off' : `${m.onCount} of ${m.totalCount} on`),
  fixture: LIGHTS_FIXTURE
});
