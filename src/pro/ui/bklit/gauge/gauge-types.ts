import type { MotionValue, Transition } from "motion/react";
import type { ReactNode } from "react";
import type { ChartStatFlowFormat } from "./chart-stat-flow";
import type {
  GaugeCenterDiscOptions,
  GaugeDotsOptions,
  GaugeGlowOptions,
  GaugeProgressRingOptions,
  GaugeSectorOptions,
  GaugeZone,
  GaugeZoneDisplay,
} from "./gauge-arc-layers";
import type {
  GaugeNeedleOptions,
  GaugeNeedleVariant,
  GaugeRulerOptions,
} from "./gauge-dial";
import type { GaugeLabelAlign, GaugeLabelPlacement } from "./gauge-label-layout";

export type GaugeArcStyle = "notches" | "solid" | "none";
export type GaugeOrientation = "arc" | "linear";

export interface GaugeProps {
  orientation?: GaugeOrientation;
  value: number;
  totalNotches?: number;
  spacing?: number;
  notchCornerRadius?: number;
  uniformWidth?: boolean;
  startAngle?: number;
  endAngle?: number;
  useGradient?: boolean;
  activeGradient?: readonly [string, string];
  inactiveGradient?: readonly [string, string];
  centerValue?: number;
  defaultLabel?: string;
  prefix?: string;
  suffix?: string;
  formatOptions?: ChartStatFlowFormat;
  labelPlacement?: GaugeLabelPlacement;
  labelAlign?: GaugeLabelAlign;
  inactiveFill?: string;
  activeFill?: string;
  inactiveFillOpacity?: number;
  activeFillOpacity?: number;
  children?: ReactNode;
  className?: string;
  /** Responsive container aspect ratio class for arc mode (default `aspect-[21/16]`). */
  aspectClassName?: string;
  /** Optional custom center Y ratio when using compact semicircle boxes (default `0.5`). */
  arcCenterYRatio?: number;
  width?: number;
  height?: number;
  minWidth?: number;
  notchLengthPercent?: number;
  notchWidthPercent?: number;
  linearHeight?: number;
  ruler?: boolean | GaugeRulerOptions;
  needle?: boolean | GaugeNeedleVariant | GaugeNeedleOptions;
  arcStyle?: GaugeArcStyle;
  arcThickness?: number;
  zones?: readonly GaugeZone[];
  zoneDisplay?: GaugeZoneDisplay;
  sector?: boolean | GaugeSectorOptions;
  progressRing?: boolean | GaugeProgressRingOptions;
  dots?: boolean | GaugeDotsOptions;
  glow?: boolean | GaugeGlowOptions;
  centerDisc?: boolean | GaugeCenterDiscOptions;
  enterTransition?: Transition;
  enterStaggerScale?: number;
  geometryScrubbing?: boolean;
}

export interface GaugeInnerProps extends Omit<GaugeProps, "className" | "minWidth" | "aspectClassName"> {
  width: number;
  height: number;
}

export interface ArcLayout {
  outerRadius: number;
  innerRadius: number;
  notchLength: number;
  solidThickness: number;
  showZoneBand: boolean;
  zoneFill: readonly GaugeZone[] | undefined;
  fullTrackZones: boolean;
  rulerOutside: boolean;
  ringRadius: number;
  zoneBandRadius: number;
  outsideRulerAnchor: number;
  dotsRadius: number;
  needleReach: number;
}

export interface ArcLayerProps {
  cx: number;
  cy: number;
  size: number;
  startAngle: number;
  endAngle: number;
  progress: MotionValue<number>;
  layout: ArcLayout;
  arcStyle: GaugeArcStyle;
  activeFilterId?: string;
  rulerOptions: GaugeRulerOptions | null;
  needleOptions: GaugeNeedleOptions | null;
  ringOptions: GaugeProgressRingOptions | null;
  sectorOptions: GaugeSectorOptions | null;
  dotsOptions: GaugeDotsOptions | null;
  discOptions: GaugeCenterDiscOptions | null;
  zones: readonly GaugeZone[] | undefined;
  solidFill: string;
  fillOpacity: number;
  trackColor: string;
  trackOpacity: number;
}
