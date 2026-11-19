import { useMemo } from 'react';
import { buildControlDomainModel, type ProControlDomainModel } from '../../lib/overviewControls';
import { useDomainEntities } from '../shared/entities';

/** Lights model from the `light` domain only. */
export function useLightsModel(): ProControlDomainModel {
  const lights = useDomainEntities('light');
  return useMemo(() => buildControlDomainModel('lights', lights), [lights]);
}
