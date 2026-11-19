"use client";

import { useId, useMemo } from "react";
import { defaultChartStatFlowFormat } from "./chart-stat-flow";
import { GaugeConicSector } from "./gauge-arc-layers";
import { resolveNeedleOptions, resolveRulerOptions } from "./gauge-dial";
import { resolveCenterDiscOptions, resolveDotsOptions, resolveGlowOptions, resolveProgressRingOptions, resolveSectorOptions, zoneColorAt } from "./gauge-arc-layers";
import type { ArcLayerProps, GaugeInnerProps } from "./gauge-types";
import { type ComputedNotch, interpolateGaugeHex, resolveGaugeActiveFill, resolveGaugeBgFill } from "./notch-gauge-shared";
import { PieCenterShell } from "./pie-center-shell";
import { ArcDefs, ArcOverlay, ArcUnderlay, computeArcLayout, fitSectorToDisc, GaugeNotchSvg, useGaugeFillState, useGaugeMotion } from "./gauge-shared-ui";

export function GaugeArcInner(props: GaugeInnerProps) {
  const {
    value,
    totalNotches = 40,
    spacing = 25,
    notchCornerRadius = 0,
    uniformWidth = false,
    width,
    height,
    arcCenterYRatio,
    startAngle = 135,
    endAngle = 405,
    useGradient = false,
    centerValue,
    defaultLabel = "Total",
    prefix,
    suffix,
    formatOptions = defaultChartStatFlowFormat,
    inactiveFill,
    activeFill,
    notchLengthPercent = 100,
    enterTransition,
    enterStaggerScale = 1,
    geometryScrubbing = false,
    ruler,
    needle,
    arcStyle = "notches",
    arcThickness = 0.035,
    zones,
    zoneDisplay = "band",
    sector,
    progressRing,
    dots,
    glow,
    centerDisc,
  } = props;

  const fillState = useGaugeFillState(props);

  const centerX = width / 2;
  const centerY =
    arcCenterYRatio !== undefined ? height * arcCenterYRatio : height / 2;
  const size =
    arcCenterYRatio !== undefined
      ? Math.min(width, (centerY - 4) / 0.44)
      : Math.min(width, height);

  const rulerOptions = resolveRulerOptions(ruler);
  const needleOptions = resolveNeedleOptions(needle);
  const ringOptions = resolveProgressRingOptions(progressRing);
  const dotsOptions = resolveDotsOptions(dots);
  const glowOptions = resolveGlowOptions(glow);
  const discOptions = resolveCenterDiscOptions(centerDisc);
  const layout = computeArcLayout({
    size,
    rulerOptions,
    ringOptions,
    zones,
    zoneDisplay,
    notchLengthPercent,
    arcStyle,
    arcThickness,
    needleTip: needleOptions?.tip,
  });
  const { outerRadius, innerRadius, notchLength } = layout;
  const sectorOptions = fitSectorToDisc(
    resolveSectorOptions(sector),
    discOptions,
    size,
    outerRadius
  );

  const glowId = `gauge-glow-${useId().replace(/:/g, "")}`;
  const solidGradientId = `${glowId}-solid`;
  const activeFilterId = glowOptions ? glowId : undefined;

  const activeNotches =
    arcStyle === "notches" ? Math.round((value / 100) * totalNotches) : 0;
  const motion = useGaugeMotion({
    value,
    activeNotches,
    enterTransition,
    enterStaggerScale,
    geometryScrubbing,
  });
  const totalAngle = endAngle - startAngle;
  const availableAngle = totalAngle * (1 - spacing / 100);
  const notchAngle = totalNotches > 0 ? availableAngle / totalNotches : 0;
  const gapDen = totalNotches - 1 > 0 ? totalNotches - 1 : 1;
  const gapAngle = (totalAngle * (spacing / 100)) / gapDen;

  const notchCount = arcStyle === "notches" ? totalNotches : 0;
  const notches = useMemo(() => {
    return Array.from({ length: notchCount }, (_, i) => {
      const angle = startAngle + i * (notchAngle + gapAngle) + notchAngle / 2;
      const radians = (angle * Math.PI) / 180;
      const arcNotchWidth = notchAngle * 0.8;
      const halfWidth = (arcNotchWidth * Math.PI) / 180 / 2;

      const x1 = centerX + Math.cos(radians - halfWidth) * outerRadius;
      const y1 = centerY + Math.sin(radians - halfWidth) * outerRadius;
      const x2 = centerX + Math.cos(radians + halfWidth) * outerRadius;
      const y2 = centerY + Math.sin(radians + halfWidth) * outerRadius;

      let x3: number;
      let y3: number;
      let x4: number;
      let y4: number;

      if (uniformWidth) {
        const perpX = Math.cos(radians);
        const perpY = Math.sin(radians);
        x3 = x2 - perpX * notchLength;
        y3 = y2 - perpY * notchLength;
        x4 = x1 - perpX * notchLength;
        y4 = y1 - perpY * notchLength;
      } else {
        x3 = centerX + Math.cos(radians + halfWidth) * innerRadius;
        y3 = centerY + Math.sin(radians + halfWidth) * innerRadius;
        x4 = centerX + Math.cos(radians - halfWidth) * innerRadius;
        y4 = centerY + Math.sin(radians - halfWidth) * innerRadius;
      }

      const denom = totalNotches > 1 ? totalNotches - 1 : 1;
      const gradientColor =
        useGradient && !fillState.useThemePaletteGradient
          ? interpolateGaugeHex(
              fillState.activeGrad0,
              fillState.activeGrad1,
              i / denom
            )
          : "var(--chart-1)";

      return {
        index: i,
        points: { x1, y1, x2, y2, x3, y3, x4, y4 },
        isActive: i < activeNotches,
        gradientColor,
        xCenter: centerX,
        yCenter: centerY,
      };
    });
  }, [
    notchCount,
    totalNotches,
    notchAngle,
    gapAngle,
    centerX,
    centerY,
    outerRadius,
    innerRadius,
    activeNotches,
    startAngle,
    uniformWidth,
    notchLength,
    useGradient,
    fillState.useThemePaletteGradient,
    fillState.activeGrad0,
    fillState.activeGrad1,
  ]);

  const resolveBgFill = (notchIndex: number) =>
    resolveGaugeBgFill({
      notchIndex,
      totalNotches,
      hasCustomInactive: fillState.hasCustomInactive,
      inactiveFill,
      useThemePaletteGradient: fillState.useThemePaletteGradient,
      useGradient,
      inactiveGrad0: fillState.inactiveGrad0,
      inactiveGrad1: fillState.inactiveGrad1,
      arcTrackFill: "var(--border)",
      linearTrackFill: "var(--chart-background)",
      linearMode: false,
    });

  const resolveActiveFill = (notch: ComputedNotch) =>
    zoneColorAt(
      layout.zoneFill,
      (notch.index + 0.5) / Math.max(1, totalNotches)
    ) ??
    resolveGaugeActiveFill({
      notch,
      hasCustomActive: fillState.hasCustomActive,
      activeFill,
      useThemePaletteGradient: fillState.useThemePaletteGradient,
      themeActiveGradientId: fillState.themeActiveGradientId,
      useGradient,
      activeFillSolid: "var(--chart-1)",
    });

  const solidUsesGradient = useGradient && !fillState.hasCustomActive;
  const solidGradientFill = solidUsesGradient
    ? `url(#${solidGradientId})`
    : "var(--chart-1)";
  const solidFill =
    (fillState.hasCustomActive && activeFill) || solidGradientFill;
  const showCenter = centerValue != null;
  const isConic = (sectorOptions?.gradient ?? "conic") === "conic";
  const conicSectorOptions = isConic ? sectorOptions : null;

  const layerProps: ArcLayerProps = {
    cx: centerX,
    cy: centerY,
    size,
    startAngle,
    endAngle,
    progress: motion.valueProgress,
    layout,
    arcStyle,
    activeFilterId,
    rulerOptions,
    needleOptions,
    ringOptions,
    sectorOptions: isConic ? null : sectorOptions,
    dotsOptions,
    discOptions,
    zones,
    solidFill,
    fillOpacity: fillState.resolvedActiveFillOpacity,
    trackColor:
      fillState.hasCustomInactive && inactiveFill
        ? inactiveFill
        : "var(--border)",
    trackOpacity: fillState.resolvedInactiveFillOpacity,
  };

  const extraDefs =
    glowOptions || solidUsesGradient ? (
      <ArcDefs
        cx={centerX}
        cy={centerY}
        glowId={glowId}
        glowOptions={glowOptions}
        radius={outerRadius}
        solidGradientId={solidUsesGradient ? solidGradientId : undefined}
        stops={fillState.solidGradientStops}
      />
    ) : null;

  return (
    <div className="relative w-full" style={{ height, width }}>
      {conicSectorOptions ? (
        <GaugeConicSector
          cx={centerX}
          cy={centerY}
          endAngle={endAngle}
          options={conicSectorOptions}
          progress={motion.valueProgress}
          radius={outerRadius}
          startAngle={startAngle}
        />
      ) : null}
      <GaugeNotchSvg
        activeFilterId={activeFilterId}
        cornerDepth={notchLength}
        defsChildren={fillState.defsChildren}
        extraDefs={extraDefs}
        fillProgress={motion.fillProgress}
        geometryScrubbing={geometryScrubbing}
        height={height}
        notchCornerRadius={notchCornerRadius}
        notches={notches}
        overlay={<ArcOverlay {...layerProps} />}
        resolveActiveFill={resolveActiveFill}
        resolveBgFill={resolveBgFill}
        resolvedActiveFillOpacity={fillState.resolvedActiveFillOpacity}
        resolvedInactiveFillOpacity={fillState.resolvedInactiveFillOpacity}
        themeActiveGradientId={fillState.themeActiveGradientId}
        trackEnter={motion.trackEnter}
        underlay={<ArcUnderlay {...layerProps} />}
        useThemePaletteGradient={fillState.useThemePaletteGradient}
        width={width}
      />
      {showCenter ? (
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
          style={{ paddingTop: size * 0.08 }}
        >
          <PieCenterShell
            centerValue={centerValue}
            contextSize={size}
            defaultLabel={defaultLabel}
            formatOptions={formatOptions}
            innerRadiusPx={Math.max(size * 0.2, 52)}
            prefix={prefix}
            suffix={suffix}
          />
        </div>
      ) : null}
    </div>
  );
}
