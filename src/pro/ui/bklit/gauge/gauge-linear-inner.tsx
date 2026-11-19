"use client";

import { useMemo } from "react";
import { defaultChartStatFlowFormat } from "./chart-stat-flow";
import { GaugeLabelLayout, GaugeLabelShell } from "./gauge-label-layout";
import type { GaugeInnerProps } from "./gauge-types";
import { type ComputedNotch, interpolateGaugeHex, resolveGaugeActiveFill, resolveGaugeBgFill } from "./notch-gauge-shared";
import { GaugeNotchSvg, useGaugeFillState, useGaugeMotion } from "./gauge-shared-ui";

export function GaugeLinearInner(props: GaugeInnerProps) {
  const {
    value,
    totalNotches = 40,
    spacing = 25,
    notchCornerRadius = 0,
    uniformWidth = true,
    width,
    height,
    useGradient = false,
    centerValue,
    defaultLabel = "Total",
    prefix,
    suffix,
    formatOptions = defaultChartStatFlowFormat,
    labelPlacement = "top",
    labelAlign = "start",
    inactiveFill,
    activeFill,
    notchLengthPercent = 100,
    notchWidthPercent = 80,
    enterTransition,
    enterStaggerScale = 1,
    geometryScrubbing = false,
  } = props;

  const fillState = useGaugeFillState(props);

  const centerY = height / 2;
  const depthFactor = Math.min(100, Math.max(5, notchLengthPercent)) / 100;
  const outerOffset = (height / 2) * depthFactor;
  const taperRatio = 28 / 42;
  const innerOffset = uniformWidth ? outerOffset : outerOffset * taperRatio;
  const notchDepth = uniformWidth ? outerOffset * 2 : outerOffset - innerOffset;
  const cornerVerticalDepth = uniformWidth ? notchDepth : outerOffset * 2;
  const widthFactor = Math.min(100, Math.max(10, notchWidthPercent)) / 100;

  const activeNotches = Math.round((value / 100) * totalNotches);
  const motion = useGaugeMotion({
    value,
    activeNotches,
    enterTransition,
    enterStaggerScale,
    geometryScrubbing,
  });
  const availableWidth = width * (1 - spacing / 100);
  const slotWidth = totalNotches > 0 ? availableWidth / totalNotches : 0;
  const gapDen = totalNotches - 1 > 0 ? totalNotches - 1 : 1;
  const gapWidth = (width * (spacing / 100)) / gapDen;

  const notches = useMemo(() => {
    return Array.from({ length: totalNotches }, (_, i) => {
      const xCenter = i * (slotWidth + gapWidth) + slotWidth / 2;
      const halfWidth = (slotWidth * widthFactor) / 2;

      let x1: number;
      let y1: number;
      let x2: number;
      let y2: number;
      let x3: number;
      let y3: number;
      let x4: number;
      let y4: number;

      if (uniformWidth) {
        const halfHeight = notchDepth / 2;
        x1 = xCenter - halfWidth;
        y1 = centerY - halfHeight;
        x2 = xCenter + halfWidth;
        y2 = centerY - halfHeight;
        x3 = xCenter + halfWidth;
        y3 = centerY + halfHeight;
        x4 = xCenter - halfWidth;
        y4 = centerY + halfHeight;
      } else {
        x1 = xCenter - halfWidth;
        y1 = centerY - outerOffset;
        x2 = xCenter + halfWidth;
        y2 = centerY - outerOffset;
        const innerHalfWidth = halfWidth * (innerOffset / outerOffset);
        x3 = xCenter + innerHalfWidth;
        y3 = centerY + outerOffset;
        x4 = xCenter - innerHalfWidth;
        y4 = centerY + outerOffset;
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
        xCenter,
        yCenter: centerY,
      };
    });
  }, [
    totalNotches,
    slotWidth,
    gapWidth,
    centerY,
    outerOffset,
    innerOffset,
    activeNotches,
    uniformWidth,
    notchDepth,
    widthFactor,
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
      linearMode: true,
    });

  const resolveActiveFill = (notch: ComputedNotch) =>
    resolveGaugeActiveFill({
      notch,
      hasCustomActive: fillState.hasCustomActive,
      activeFill,
      useThemePaletteGradient: fillState.useThemePaletteGradient,
      themeActiveGradientId: fillState.themeActiveGradientId,
      useGradient,
      activeFillSolid: "var(--chart-1)",
    });

  const label =
    centerValue == null ? null : (
      <GaugeLabelShell
        align={labelAlign}
        centerValue={centerValue}
        defaultLabel={defaultLabel}
        formatOptions={formatOptions}
        prefix={prefix}
        suffix={suffix}
      />
    );

  const track = (
    <div className="relative w-full" style={{ height, width }}>
      <GaugeNotchSvg
        cornerDepth={cornerVerticalDepth}
        defsChildren={fillState.defsChildren}
        fillProgress={motion.fillProgress}
        geometryScrubbing={geometryScrubbing}
        height={height}
        notchCornerRadius={notchCornerRadius}
        notches={notches}
        resolveActiveFill={resolveActiveFill}
        resolveBgFill={resolveBgFill}
        resolvedActiveFillOpacity={fillState.resolvedActiveFillOpacity}
        resolvedInactiveFillOpacity={fillState.resolvedInactiveFillOpacity}
        themeActiveGradientId={fillState.themeActiveGradientId}
        trackEnter={motion.trackEnter}
        useThemePaletteGradient={fillState.useThemePaletteGradient}
        width={width}
      />
    </div>
  );

  return (
    <GaugeLabelLayout
      align={labelAlign}
      label={label}
      placement={labelPlacement}
    >
      {track}
    </GaugeLabelLayout>
  );
}
