"use client";

import { domAnimation, LazyMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ParentSize } from "./chart-parent-size";
import { GaugeArcInner } from "./gauge-arc-inner";
import { GaugeLinearInner } from "./gauge-linear-inner";
import type { GaugeInnerProps, GaugeProps } from "./gauge-types";
import { DEFAULT_LINEAR_GAUGE_HEIGHT } from "./notch-gauge-shared";

export type {
  GaugeCenterDiscOptions,
  GaugeDotsOptions,
  GaugeGlowOptions,
  GaugeProgressRingOptions,
  GaugeSectorOptions,
  GaugeZone,
  GaugeZoneDisplay,
} from "./gauge-arc-layers";
export type {
  GaugeNeedleOptions,
  GaugeNeedleVariant,
  GaugeRulerLabelOptions,
  GaugeRulerOptions,
  GaugeRulerPosition,
} from "./gauge-dial";
export type { GaugeArcStyle, GaugeOrientation, GaugeProps } from "./gauge-types";

function GaugeInner(props: GaugeInnerProps) {
  if (props.orientation === "linear") {
    return <GaugeLinearInner {...props} />;
  }
  return <GaugeArcInner {...props} />;
}

/**
 * Official `@bklit/gauge-chart` Gauge component skinned onto HeroUI / Pro-UI tokens.
 */
export function Gauge({
  width: widthProp,
  height: heightProp,
  className,
  aspectClassName = "aspect-[21/16]",
  minWidth,
  orientation = "arc",
  linearHeight,
  value,
  centerValue,
  zones,
  ...gaugeProps
}: GaugeProps) {
  const props = { ...gaugeProps, value, centerValue, zones };
  const isLinear = orientation === "linear";
  const resolvedMinWidth = minWidth ?? (isLinear ? 200 : 300);
  const resolvedLinearHeight = linearHeight ?? DEFAULT_LINEAR_GAUGE_HEIGHT;

  if (isLinear) {
    if (widthProp != null) {
      return (
        <LazyMotion features={domAnimation}>
          <div
            className={cn("relative w-full max-w-full", className)}
            style={{ width: widthProp }}
          >
            <GaugeInner
              height={heightProp ?? resolvedLinearHeight}
              orientation="linear"
              width={widthProp}
              {...props}
            />
          </div>
        </LazyMotion>
      );
    }

    return (
      <LazyMotion features={domAnimation}>
        <div className={cn("relative w-full min-w-0 max-w-full", className)}>
          <div
            className="w-full min-w-0"
            style={{ height: resolvedLinearHeight, minWidth: resolvedMinWidth }}
          >
            <ParentSize debounceTime={10}>
              {({ width }) =>
                width > 0 ? (
                  <GaugeInner
                    height={resolvedLinearHeight}
                    orientation="linear"
                    width={width}
                    {...props}
                  />
                ) : null
              }
            </ParentSize>
          </div>
        </div>
      </LazyMotion>
    );
  }

  if (widthProp != null && heightProp != null) {
    return (
      <LazyMotion features={domAnimation}>
        <div className={cn("relative inline-flex max-w-full", className)}>
          <GaugeInner
            height={heightProp}
            orientation="arc"
            width={widthProp}
            {...props}
          />
        </div>
      </LazyMotion>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div
        className={cn("relative w-full min-w-0 max-w-full", className)}
        style={{ minWidth: resolvedMinWidth }}
      >
        <div className={cn("mx-auto w-full max-w-[560px]", aspectClassName)}>
          <ParentSize debounceTime={10}>
            {({ width, height }) =>
              width > 0 && height > 0 ? (
                <GaugeInner
                  height={height}
                  orientation="arc"
                  width={width}
                  {...props}
                />
              ) : null
            }
          </ParentSize>
        </div>
      </div>
    </LazyMotion>
  );
}

Gauge.displayName = "Gauge";
