"use client";

import {
  type MotionValue,
  m,
  type Transition,
  useReducedMotion,
} from "motion/react";
import { type ReactNode, useId, useMemo, useRef } from "react";
import { defaultChartStatFlowFormat } from "./chart-stat-flow";
import {
  GaugeCenterDisc,
  type GaugeCenterDiscOptions,
  GaugeConicSector,
  GaugeDots,
  GaugeGlowFilter,
  type GaugeGlowOptions,
  GaugeProgressRing,
  type GaugeProgressRingOptions,
  GaugeSector,
  type GaugeSectorOptions,
  GaugeSolidArc,
  type GaugeZone,
  GaugeZoneBands,
  type GaugeZoneDisplay,
  progressRingExtent,
  resolveCenterDiscOptions,
  resolveDotsOptions,
  resolveGlowOptions,
  resolveProgressRingOptions,
  resolveSectorOptions,
  ZONE_BAND_WIDTH,
  zoneColorAt,
} from "./gauge-arc-layers";
import {
  clamp01,
  DEFAULT_GAUGE_SWEEP_TRANSITION,
  GAUGE_TRACK_ENTER_TRANSITION,
  GaugeNeedle,
  type GaugeNeedleOptions,
  GaugeRuler,
  type GaugeRulerOptions,
  resolveNeedleOptions,
  resolveRulerOptions,
  rulerOutsideExtent,
  useGaugeSweep,
  useMotionValueApply,
} from "./gauge-dial";
import { GaugeLabelLayout, GaugeLabelShell } from "./gauge-label-layout";
import type {
  ArcLayerProps,
  ArcLayout,
  GaugeArcStyle,
  GaugeInnerProps,
} from "./gauge-types";
import {
  type ComputedNotch,
  collectGaugeDefsElements,
  createNotchPath,
  DEFAULT_ACTIVE_FILL_OPACITY,
  DEFAULT_ACTIVE_GRADIENT,
  DEFAULT_INACTIVE_FILL_OPACITY,
  interpolateGaugeHex,
  resolveGaugeActiveFill,
  resolveGaugeBgFill,
} from "./notch-gauge-shared";
import { PieCenterShell } from "./pie-center-shell";

const FILL_ENTER_DELAY = 0.12;

export function GaugeNotchSvg({
  notches,
  width,
  height,
  notchCornerRadius,
  cornerDepth,
  geometryScrubbing,
  fillProgress,
  trackEnter,
  defsChildren,
  useThemePaletteGradient,
  themeActiveGradientId,
  resolvedInactiveFillOpacity,
  resolvedActiveFillOpacity,
  resolveBgFill,
  resolveActiveFill,
  overlay,
  underlay,
  extraDefs,
  activeFilterId,
}: {
  notches: ComputedNotch[];
  width: number;
  height: number;
  notchCornerRadius: number;
  cornerDepth: number;
  geometryScrubbing: boolean;
  fillProgress: MotionValue<number>;
  trackEnter: boolean;
  defsChildren: ReactNode[];
  useThemePaletteGradient: boolean;
  themeActiveGradientId: string;
  resolvedInactiveFillOpacity: number;
  resolvedActiveFillOpacity: number;
  resolveBgFill: (index: number) => string;
  resolveActiveFill: (notch: ComputedNotch) => string;
  overlay?: ReactNode;
  underlay?: ReactNode;
  extraDefs?: ReactNode;
  activeFilterId?: string;
}) {
  const activeRefs = useRef<(SVGPathElement | null)[]>([]);
  const litAt = (progress: number, index: number) =>
    clamp01(progress - index) * resolvedActiveFillOpacity;

  useMotionValueApply(fillProgress, (progress) => {
    for (const notch of notches) {
      activeRefs.current[notch.index]?.setAttribute(
        "fill-opacity",
        String(litAt(progress, notch.index))
      );
    }
  });

  const paths = notches.map((notch) => ({
    notch,
    d: createNotchPath(notch.points, notchCornerRadius, cornerDepth),
  }));
  const initialProgress = fillProgress.get();
  const animateTrack = trackEnter && !geometryScrubbing;

  return (
    <svg
      aria-hidden="true"
      className="relative block w-full overflow-visible"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
    >
      {defsChildren.length > 0 || useThemePaletteGradient || extraDefs ? (
        <defs>
          {extraDefs}
          {useThemePaletteGradient ? (
            <linearGradient
              id={themeActiveGradientId}
              x1="0%"
              x2="100%"
              y1="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="var(--chart-1)" />
              <stop offset="100%" stopColor="var(--chart-5)" />
            </linearGradient>
          ) : null}
          {defsChildren}
        </defs>
      ) : null}
      {underlay}
      <m.g
        animate={{ opacity: 1 }}
        initial={animateTrack ? { opacity: 0 } : false}
        transition={GAUGE_TRACK_ENTER_TRANSITION}
      >
        {paths.map(({ notch, d }) => (
          <path
            d={d}
            fill={resolveBgFill(notch.index)}
            fillOpacity={resolvedInactiveFillOpacity}
            key={`bg-${notch.index}`}
          />
        ))}
      </m.g>
      <g filter={activeFilterId ? `url(#${activeFilterId})` : undefined}>
        {paths.map(({ notch, d }) => (
          <path
            d={d}
            fill={resolveActiveFill(notch)}
            fillOpacity={litAt(initialProgress, notch.index)}
            key={`active-${notch.index}`}
            ref={(el) => {
              activeRefs.current[notch.index] = el;
            }}
          />
        ))}
      </g>
      {overlay ? (
        <m.g
          animate={{ opacity: 1 }}
          initial={animateTrack ? { opacity: 0 } : false}
          transition={GAUGE_TRACK_ENTER_TRANSITION}
        >
          {overlay}
        </m.g>
      ) : null}
    </svg>
  );
}

export function useGaugeFillState(props: GaugeInnerProps) {
  const {
    useGradient = false,
    activeGradient,
    inactiveGradient,
    inactiveFill,
    activeFill,
    inactiveFillOpacity,
    activeFillOpacity,
    children,
    totalNotches = 40,
  } = props;

  const themeActiveGradientId = `gauge-theme-active-${useId().replace(/:/g, "")}`;
  const defsChildren = useMemo(
    () => collectGaugeDefsElements(children),
    [children]
  );

  const hasCustomInactive =
    inactiveFill !== undefined && inactiveFill.length > 0;
  const hasCustomActive = activeFill !== undefined && activeFill.length > 0;

  const activeGrad0 = activeGradient?.[0] ?? DEFAULT_ACTIVE_GRADIENT[0];
  const activeGrad1 = activeGradient?.[1] ?? DEFAULT_ACTIVE_GRADIENT[1];
  const inactiveGrad0 = inactiveGradient?.[0] ?? activeGrad0;
  const inactiveGrad1 = inactiveGradient?.[1] ?? activeGrad1;
  const useThemePaletteGradient = useGradient && activeGradient === undefined;

  return {
    themeActiveGradientId,
    defsChildren,
    hasCustomInactive,
    hasCustomActive,
    activeGrad0,
    activeGrad1,
    inactiveGrad0,
    inactiveGrad1,
    useThemePaletteGradient,
    solidGradientStops: useThemePaletteGradient
      ? (["var(--chart-1)", "var(--chart-5)"] as const)
      : ([activeGrad0, activeGrad1] as const),
    resolvedActiveFillOpacity: activeFillOpacity ?? DEFAULT_ACTIVE_FILL_OPACITY,
    resolvedInactiveFillOpacity:
      inactiveFillOpacity ?? DEFAULT_INACTIVE_FILL_OPACITY,
    totalNotches,
  };
}

export function useGaugeMotion({
  value,
  activeNotches,
  enterTransition,
  enterStaggerScale = 1,
  geometryScrubbing = false,
}: {
  value: number;
  activeNotches: number;
  enterTransition?: Transition;
  enterStaggerScale?: number;
  geometryScrubbing?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const instant = Boolean(prefersReducedMotion) || geometryScrubbing;
  const transition = enterTransition ?? DEFAULT_GAUGE_SWEEP_TRANSITION;
  const stagger = Math.max(0.25, Math.min(2.5, enterStaggerScale));
  const enterDelay = FILL_ENTER_DELAY * stagger;
  const fillProgress = useGaugeSweep({
    target: activeNotches,
    transition,
    enterDelay,
    instant,
  });
  const valueProgress = useGaugeSweep({
    target: clamp01(value / 100),
    transition,
    enterDelay,
    instant,
  });
  return { fillProgress, valueProgress, trackEnter: !instant };
}

export function computeArcLayout({
  size,
  rulerOptions,
  ringOptions,
  zones,
  zoneDisplay,
  notchLengthPercent,
  arcStyle,
  arcThickness,
  needleTip,
}: {
  size: number;
  rulerOptions: GaugeRulerOptions | null;
  ringOptions: GaugeProgressRingOptions | null;
  zones: readonly GaugeZone[] | undefined;
  zoneDisplay: GaugeZoneDisplay;
  notchLengthPercent: number;
  arcStyle: GaugeArcStyle;
  arcThickness: number;
  needleTip: GaugeNeedleOptions["tip"];
}): ArcLayout {
  const rulerOutside = rulerOptions?.position === "outside";
  const hasZones = zones != null && zones.length > 0;
  const fullTrackZones = hasZones && zoneDisplay === "track";
  const showZoneBand = hasZones && zoneDisplay !== "fill" && zoneDisplay !== "track";
  const zoneFill = hasZones && zoneDisplay !== "band" ? zones : undefined;

  const zoneBandExtent = showZoneBand ? size * (0.02 + ZONE_BAND_WIDTH) : 0;
  const ringExtent = ringOptions ? progressRingExtent(ringOptions, size) : 0;
  const rulerExtent =
    rulerOutside && rulerOptions ? rulerOutsideExtent(rulerOptions, size) : 0;
  const outsideReserve = ringExtent + zoneBandExtent + rulerExtent;
  const outerRadius =
    (outsideReserve > 0 ? size * 0.47 : size * 0.42) - outsideReserve;

  const depthFactor = Math.min(100, Math.max(5, notchLengthPercent)) / 100;
  const notchLength = (outerRadius / 3) * depthFactor;
  const solidThickness = size * arcThickness;
  const trackDepth: Record<GaugeArcStyle, number> = {
    notches: notchLength,
    solid: solidThickness,
    none: 0,
  };
  const innerRadius = outerRadius - trackDepth[arcStyle];

  const ringWidth = size * (ringOptions?.width ?? 0.01);
  const insideRulerDepth =
    rulerOptions && !rulerOutside
      ? size *
        ((rulerOptions.gap ?? 0.028) +
          (rulerOptions.majorLength ?? 0.05) +
          0.02)
      : 0;
  const needleReach: Record<NonNullable<GaugeNeedleOptions["tip"]>, number> = {
    inner: innerRadius - size * 0.014,
    outer: outerRadius,
    edge: outerRadius + outsideReserve,
  };

  return {
    outerRadius,
    innerRadius,
    notchLength,
    solidThickness,
    showZoneBand,
    zoneFill,
    fullTrackZones,
    rulerOutside,
    ringRadius:
      outerRadius + size * (ringOptions?.gap ?? 0.022) + ringWidth / 2,
    zoneBandRadius:
      outerRadius + ringExtent + size * (0.02 + ZONE_BAND_WIDTH / 2),
    outsideRulerAnchor: outerRadius + ringExtent + zoneBandExtent,
    dotsRadius: innerRadius - size * 0.03 - insideRulerDepth,
    needleReach: needleReach[needleTip ?? "inner"],
  };
}

export function ArcUnderlay(props: ArcLayerProps) {
  const { cx, cy, size, startAngle, endAngle, progress, layout } = props;
  const shared = { cx, cy, startAngle, endAngle, progress };
  return (
    <>
      {props.sectorOptions ? (
        <GaugeSector
          {...shared}
          options={props.sectorOptions}
          radius={layout.outerRadius}
        />
      ) : null}
      {props.dotsOptions ? (
        <GaugeDots
          {...shared}
          options={props.dotsOptions}
          outerRadius={layout.dotsRadius}
          size={size}
        />
      ) : null}
      {props.arcStyle === "solid" ? (
        <GaugeSolidArc
          {...shared}
          fill={props.solidFill}
          fillOpacity={props.fillOpacity}
          fullTrackZones={layout.fullTrackZones}
          glowFilterId={props.activeFilterId}
          radius={layout.outerRadius - layout.solidThickness / 2}
          thickness={layout.solidThickness}
          trackColor={props.trackColor}
          trackOpacity={props.trackOpacity}
          zones={layout.zoneFill}
        />
      ) : null}
    </>
  );
}

export function ArcOverlay(props: ArcLayerProps) {
  const { cx, cy, size, startAngle, endAngle, progress, layout } = props;
  const shared = { cx, cy, startAngle, endAngle, progress };
  return (
    <>
      {props.ringOptions ? (
        <GaugeProgressRing
          {...shared}
          glowFilterId={props.activeFilterId}
          options={props.ringOptions}
          radius={layout.ringRadius}
          size={size}
        />
      ) : null}
      {layout.showZoneBand && props.zones ? (
        <GaugeZoneBands
          cx={cx}
          cy={cy}
          endAngle={endAngle}
          radius={layout.zoneBandRadius}
          size={size}
          startAngle={startAngle}
          zones={props.zones}
        />
      ) : null}
      {props.rulerOptions ? (
        <GaugeRuler
          {...shared}
          anchorRadius={
            layout.rulerOutside ? layout.outsideRulerAnchor : layout.innerRadius
          }
          options={props.rulerOptions}
          size={size}
        />
      ) : null}
      {props.needleOptions ? (
        <GaugeNeedle
          {...shared}
          options={props.needleOptions}
          reach={layout.needleReach}
        />
      ) : null}
      {props.discOptions ? (
        <GaugeCenterDisc
          cx={cx}
          cy={cy}
          options={props.discOptions}
          size={size}
        />
      ) : null}
    </>
  );
}

export function ArcDefs({
  cx,
  cy,
  radius,
  glowId,
  glowOptions,
  solidGradientId,
  stops,
}: {
  cx: number;
  cy: number;
  radius: number;
  glowId: string;
  glowOptions: GaugeGlowOptions | null;
  solidGradientId?: string;
  stops: readonly [string, string];
}) {
  return (
    <>
      {glowOptions ? (
        <GaugeGlowFilter id={glowId} options={glowOptions} />
      ) : null}
      {solidGradientId ? (
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={solidGradientId}
          x1={cx - radius}
          x2={cx + radius}
          y1={cy}
          y2={cy}
        >
          <stop offset="0%" stopColor={stops[0]} />
          <stop offset="100%" stopColor={stops[1]} />
        </linearGradient>
      ) : null}
    </>
  );
}

export function fitSectorToDisc(
  sector: GaugeSectorOptions | null,
  disc: GaugeCenterDiscOptions | null,
  size: number,
  outerRadius: number
): GaugeSectorOptions | null {
  if (!(sector && disc) || outerRadius <= 0) {
    return sector;
  }
  const discEdge = size * (disc.radius ?? 0.19) + (disc.strokeWidth ?? 3) / 2;
  return {
    ...sector,
    innerRadius: Math.max(sector.innerRadius ?? 0, discEdge / outerRadius),
  };
}

