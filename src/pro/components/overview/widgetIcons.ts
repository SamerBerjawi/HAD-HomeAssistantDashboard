import type { IconSvgElement } from '@hugeicons/react';
import {
  BlindsIcon,
  BulbIcon,
  ChartHistogramIcon,
  DashboardSpeed01Icon,
  DashboardSquare01Icon,
  Door01Icon,
  DropletIcon,
  Fan01Icon,
  FireIcon,
  FlashIcon,
  MusicNote01Icon,
  Robot01Icon,
  Shield01Icon,
  SolarPanel01Icon,
  SunCloud02Icon,
  ToggleOnIcon,
  UserGroupIcon,
  Video01Icon,
  WalkingIcon,
  WorkflowSquare01Icon
} from '@hugeicons/core-free-icons';

const WIDGET_ICONS: Record<string, IconSvgElement> = {
  weather: SunCloud02Icon,
  weather_hourly: SunCloud02Icon,
  users: UserGroupIcon,
  lights: BulbIcon,
  switches: ToggleOnIcon,
  vacuums: Robot01Icon,
  fans: Fan01Icon,
  media: MusicNote01Icon,
  alarm: Shield01Icon,
  cameras: Video01Icon,
  power_flow: FlashIcon,
  power_flow_chart: FlashIcon,
  energy_usage: ChartHistogramIcon,
  energy_usage_chart: ChartHistogramIcon,
  solar_production: SolarPanel01Icon,
  solar_production_chart: SolarPanel01Icon,
  energy_gauges: DashboardSpeed01Icon,
  energy_flow: WorkflowSquare01Icon,
  doors: Door01Icon,
  windows: BlindsIcon,
  motion: WalkingIcon,
  leak: DropletIcon,
  smoke: FireIcon
};

export function widgetIcon(widgetId: string): IconSvgElement {
  if (widgetId.startsWith('camera:')) return Video01Icon;
  return WIDGET_ICONS[widgetId] ?? DashboardSquare01Icon;
}
