import { useCallback, useMemo } from 'react';
import { buildFansOverviewModel, type ProFansModel } from '../../lib/overviewAppliances';
import type { ResolvedEntity } from '@/types';
import { useDomainEntities, usePickedEntities } from '../shared/entities';

const PAIRED_DOMAINS = ['sensor', 'number'] as const;

/** Fans plus only the sensors paired with them (same test as fanClassification's pairing). */
export function useFansModel(): ProFansModel {
  const fans = useDomainEntities('fan');
  const isPaired = useCallback(
    (e: ResolvedEntity) =>
      fans.some(
        (fan) =>
          e.entity_id.includes(fan.entity_id.replace('fan.', '')) ||
          (Boolean(fan.area?.area_id) && e.area?.area_id === fan.area?.area_id && e.attributes?.device_class === 'temperature')
      ),
    [fans]
  );
  const paired = usePickedEntities(PAIRED_DOMAINS, isPaired);
  return useMemo(() => buildFansOverviewModel(fans, [...fans, ...paired]), [fans, paired]);
}
