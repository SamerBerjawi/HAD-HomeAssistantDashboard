/** Door locks widget (new, 2026-11-20): every `lock` entity, with the owner's chosen design (bolts). */
import { lazy, useMemo } from 'react';
import { DoorLockIcon } from '@hugeicons/core-free-icons';
import { buildLocksModel, buildProLockItem, type ProLocksModel } from '../../lib/overviewLocks';
import { useDomainEntities } from '../shared/entities';
import { defineWidget } from '../types';
import { LOCKS_STATES } from './concepts/states';
import LocksCard from './LocksCard';

function useLocksModel(): ProLocksModel {
  const locks = useDomainEntities('lock');
  return useMemo(() => buildLocksModel(locks.map((l) => buildProLockItem(l))), [locks]);
}

export const locksWidget = defineWidget<ProLocksModel>({
  id: 'locks',
  section: 'security',
  title: 'Door locks',
  icon: DoorLockIcon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: useLocksModel,
  // Owner choice (WIDGET_DESIGN.md, 2026-11-20): concept C, "bolts", with icons and a bolt at Small for one lock.
  Sheet: lazy(() => import('./LocksSheet')),
  designs: [{ id: 'bolts', name: 'Bolts', description: 'Each lock is a deadbolt: tap to lock, hold to unlock', Body: LocksCard }],
  count: (m) => m.unlocked + m.jammed,
  subtitle: (m) => (m.total === 0 ? 'No locks' : m.headline),
  attention: (m) =>
    m.jammed > 0 ? { label: m.headline, tone: 'danger' } : m.lowBattery > 0 ? { label: m.lowBattery === 1 ? 'Lock battery low' : `${m.lowBattery} lock batteries low`, tone: 'warning' } : null,
  fixture: LOCKS_STATES[0].model
});
