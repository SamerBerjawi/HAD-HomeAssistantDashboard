/** Scenes widget (Overview rebuild, Phase 2 of the widget designs): scene entities. */
import { lazy, useMemo } from 'react';
import { PaintBoardIcon } from '@hugeicons/core-free-icons';
import { buildScenesModel, type ProScenesModel } from '../../lib/overviewScenes';
import { useDomainEntities } from '../shared/entities';
import { defineWidget } from '../types';
import ScenesConceptC from './concepts/ScenesConceptC';
import { SCENES_STATES } from './concepts/states';

function useScenesModel(): ProScenesModel {
  const scenes = useDomainEntities('scene');
  // "Current" is judged when the scenes change (an activation changes the scene's state).
  return useMemo(() => buildScenesModel(scenes), [scenes]);
}

export const scenesWidget = defineWidget<ProScenesModel>({
  id: 'scenes',
  section: 'lights',
  title: 'Scenes',
  icon: PaintBoardIcon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: useScenesModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 2): concept C, "palette".
  Sheet: lazy(() => import('./ScenesSheet')),
  designs: [{ id: 'palette', name: 'Palette', description: 'Colour swatches tinted by the active mood', Body: ScenesConceptC }],
  subtitle: (m) => (m.totalCount === 0 ? 'No scenes' : (m.current?.name ?? `${m.totalCount} scenes`)),
  fixture: SCENES_STATES[0].model
});
