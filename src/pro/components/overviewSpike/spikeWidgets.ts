/**
 * Dummy widgets for the Phase 0 layout spike (docs/pro-ui/OVERVIEW_REBUILD.md). No HA data.
 * Removed when Phase 1 brings the real registry.
 */
import type { IconSvgElement } from '@hugeicons/react';
import { BulbIcon, CloudIcon, Fan01Icon, FlashIcon, PaintBoardIcon, SolarPanel01Icon, ThermometerIcon } from '@hugeicons/core-free-icons';
import type { LayoutWidgetInfo } from '../../lib/overviewLayout';

export interface SpikeWidget extends LayoutWidgetInfo {
  title: string;
  icon: IconSvgElement;
  subtitle: string;
}

export const SPIKE_WIDGETS: SpikeWidget[] = [
  { id: 'weather', section: 'climate', title: 'Weather', icon: CloudIcon, subtitle: '18° · Partly cloudy', sizes: ['s', 'w', 't', 'l'], defaultSize: 'w' },
  { id: 'thermostat', section: 'climate', title: 'Thermostat', icon: ThermometerIcon, subtitle: 'Heating to 21°', sizes: ['s', 'w'], defaultSize: 's' },
  { id: 'fans', section: 'climate', title: 'Fans', icon: Fan01Icon, subtitle: '2 of 4 on', sizes: ['s', 'w', 't'], defaultSize: 's' },
  { id: 'lights', section: 'lights', title: 'Lighting', icon: BulbIcon, subtitle: '8 of 10 on', sizes: ['s', 'w', 't', 'l'], defaultSize: 'w' },
  { id: 'scenes', section: 'lights', title: 'Scenes', icon: PaintBoardIcon, subtitle: 'Evening active', sizes: ['s', 'w'], defaultSize: 's' },
  { id: 'energy_now', section: 'energy', title: 'Energy now', icon: FlashIcon, subtitle: '1.8 kW from grid', sizes: ['w', 'l'], defaultSize: 'l' },
  { id: 'energy_today', section: 'energy', title: 'Energy today', icon: SolarPanel01Icon, subtitle: '14.2 kWh used', sizes: ['s', 'w', 'l'], defaultSize: 'w' }
];

export const SPIKE_WIDGET_BY_ID = new Map(SPIKE_WIDGETS.map((w) => [w.id, w]));
