import { lazy } from 'react';
import { Shield01Icon } from '@hugeicons/core-free-icons';
import type { ProOverviewAlarmModel } from '../../lib/overviewSecurity';
import { defineWidget } from '../types';
import AlarmCard from './AlarmCard';
import { ALARM_FIXTURE } from './fixture';
import { useAlarmModel } from './useAlarmModel';

export const alarmWidget = defineWidget<ProOverviewAlarmModel>({
  id: 'alarm',
  section: 'security',
  title: 'Alarm',
  icon: Shield01Icon,
  sizes: ['s', 'w', 't', 'l'],
  defaultSize: 'w',
  useModel: useAlarmModel,
  // Owner choice (WIDGET_DESIGN.md, Phase 3): B's layout with C's mode track and A's lock colours.
  designs: [{ id: 'shield', name: 'Shield', description: 'The card is the alarm state', Body: AlarmCard }],
  Sheet: lazy(() => import('./AlarmSheet')),
  subtitle: (m) => (m.panel ? m.panelName : undefined),
  attention: (m) => (m.isTriggered ? { label: 'Alarm triggered', tone: 'danger' } : m.isTransitioning ? { label: `Alarm ${m.stateLabel.toLowerCase()}`, tone: 'warning' } : null),
  fixture: ALARM_FIXTURE
});
