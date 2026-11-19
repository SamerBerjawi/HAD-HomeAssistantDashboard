import { lazy } from 'react';
import { BulbIcon } from '@hugeicons/core-free-icons';
import type { ProControlDomainModel } from '../../lib/overviewControls';
import { defineWidget } from '../types';
import { LIGHTS_FIXTURE } from './fixture';
import LightsBody from './LightsBody';
import { useLightsModel } from './useLightsModel';

export const lightsWidget = defineWidget<ProControlDomainModel>({
  id: 'lights',
  section: 'lights',
  title: 'Lighting',
  icon: BulbIcon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: useLightsModel,
  Body: LightsBody,
  Sheet: lazy(() => import('./LightsSheet')),
  subtitle: (m) => (m.totalCount === 0 ? 'No lights' : m.onCount === 0 ? 'All off' : `${m.onCount} of ${m.totalCount} on`),
  fixture: LIGHTS_FIXTURE
});
