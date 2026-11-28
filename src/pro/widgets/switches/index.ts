import { lazy, useMemo } from 'react';
import { PlugSocketIcon } from '@hugeicons/core-free-icons';
import { buildControlDomainModel, type ProControlDomainModel } from '../../lib/overviewControls';
import { useDomainEntities } from '../shared/entities';
import { defineWidget } from '../types';
import { SWITCHES_FIXTURE } from './fixture';
import SwitchesConceptB from './concepts/SwitchesConceptB';

function useSwitchesModel(): ProControlDomainModel {
  const switches = useDomainEntities('switch');
  return useMemo(() => buildControlDomainModel('switches', switches), [switches]);
}

export const switchesWidget = defineWidget<ProControlDomainModel>({
  id: 'switches',
  section: 'switches',
  title: 'Switches',
  icon: PlugSocketIcon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: useSwitchesModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 2): concept B, "plug board".
  designs: [{ id: 'board', name: 'Plug board', description: 'Rocker tiles that light up and show watts', Body: SwitchesConceptB }],
  Sheet: lazy(() => import('./SwitchesSheet')),
  count: (m) => m.onCount,
  subtitle: (m) => (m.totalCount === 0 ? 'No switches' : m.onCount === 0 ? 'All off' : `${m.onCount} of ${m.totalCount} on`),
  fixture: SWITCHES_FIXTURE
});
