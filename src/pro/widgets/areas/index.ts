/** Areas widget (WIDGET_DESIGN.md Phase 3, new): favourite areas one tap away, every area by floor. */
import { lazy } from 'react';
import { DashboardSquare01Icon } from '@hugeicons/core-free-icons';
import { useUserConfig } from '@/contexts/ConfigContext';
import { useLayoutScope } from '../../hooks/useLayoutScope';
import { buildAreasModel, type ProAreasModel } from '../../lib/overviewAreas';
import { useDerivedModel } from '../shared/entities';
import { defineWidget } from '../types';
import AreasCard from './AreasCard';
import { AREAS_STATES } from './concepts/states';

const EMPTY: string[] = [];

function useAreasModel(): ProAreasModel {
  const { config } = useUserConfig();
  const { effectiveFavorites } = useLayoutScope();
  // Favourites follow active layout scope; structural ordering/visibility/overrides follow shared Rooms settings.
  const favorites = effectiveFavorites;
  const r = config.rooms;
  const hidden = r?.hiddenAreas ?? EMPTY;
  const hiddenFloors = r?.hiddenFloors ?? EMPTY;
  const floorOrder = r?.floorOrder ?? EMPTY;
  const areaOrder = r?.areaOrder ?? EMPTY;
  const overrides = r?.areaOverrides;
  return useDerivedModel(
    (s) => buildAreasModel(s.resolvedAreas, s.floors, favorites, hidden, { floorOrder, hiddenFloors, areaOrder, overrides }),
    (m) => JSON.stringify(m)
  );
}

export const areasWidget = defineWidget<ProAreasModel>({
  id: 'areas',
  section: 'rooms',
  title: 'Areas',
  icon: DashboardSquare01Icon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: useAreasModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 3): A's layout with B's pill buttons and lights button.
  Sheet: lazy(() => import('./AreasSheet')),
  designs: [{ id: 'rooms', name: 'Rooms', description: 'Favourite rooms with their lights', Body: AreasCard }],
  subtitle: (m) => (m.totalCount === 0 ? 'No areas' : `${m.totalCount} areas`),
  fixture: AREAS_STATES[0].model
});
