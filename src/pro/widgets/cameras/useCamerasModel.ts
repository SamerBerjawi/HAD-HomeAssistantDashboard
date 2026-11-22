import { useMemo } from 'react';
import { useUserConfig } from '@/contexts/ConfigContext';
import { getConfiguredRtspCameras } from '@/lib/cameraSources';
import { buildOverviewCamerasModel, type ProOverviewCamerasModel } from '../../lib/overviewSecurity';
import { useAllDomainEntities, useDomainEntities } from '../shared/entities';

/** Cameras that have a configured stream source, with motion from paired binary sensors. */
export function useCamerasModel(): ProOverviewCamerasModel {
  const { config } = useUserConfig();
  const sources = config.cameras?.sources;
  const haCameras = useAllDomainEntities('camera');
  const sensors = useDomainEntities('binary_sensor');
  return useMemo(() => buildOverviewCamerasModel({ cameras: getConfiguredRtspCameras(sources, haCameras), binarySensors: sensors }), [sources, haCameras, sensors]);
}

/** The model with another featured camera (the body and sheet pick one locally). */
export function withFeatured(model: ProOverviewCamerasModel, entityId: string | null): ProOverviewCamerasModel {
  const pick = entityId ? model.cameras.find((c) => c.entityId === entityId) : undefined;
  return pick && pick !== model.featuredCamera ? { ...model, featuredCamera: pick } : model;
}
