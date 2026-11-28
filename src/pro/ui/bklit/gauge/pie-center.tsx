"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  chartCenterContainerClassName,
  chartCenterLabelClassName,
  chartCenterValueClassName,
} from "./chart-center-typography";
import {
  ChartStatFlow,
  type ChartStatFlowFormat,
  defaultChartStatFlowFormat,
} from "./chart-stat-flow";
import { usePieHover, usePieStable } from "./pie-context";

export interface PieCenterProps {
  defaultLabel?: string;
  formatOptions?: ChartStatFlowFormat;
  children?: (props: {
    value: number;
    label: string;
    isHovered: boolean;
    data: { label: string; value: number; color?: string; fill?: string };
  }) => ReactNode;
  className?: string;
  valueClassName?: string;
  labelClassName?: string;
  prefix?: string;
  suffix?: string;
  valueDisplay?: "value" | "percent";
}

export function PieCenter({
  defaultLabel = "Total",
  formatOptions = defaultChartStatFlowFormat,
  children,
  className = "",
  valueClassName = chartCenterValueClassName,
  labelClassName = chartCenterLabelClassName,
  prefix,
  suffix: suffixProp,
  valueDisplay = "value",
}: PieCenterProps) {
  const { data, totalValue, innerRadius, geometryScrubbing } = usePieStable();
  const { hoveredIndex } = usePieHover();

  const effectiveHoveredIndex = geometryScrubbing ? null : hoveredIndex;
  const hoveredData =
    effectiveHoveredIndex === null ? null : data[effectiveHoveredIndex];
  const percentMode = valueDisplay === "percent";
  const suffix = suffixProp ?? (percentMode ? "%" : undefined);
  const rawValue = hoveredData ? hoveredData.value : totalValue;
  const share = totalValue > 0 ? (rawValue / totalValue) * 100 : 0;
  const displayValue = percentMode ? Math.round(share) : rawValue;
  const displayLabel = hoveredData ? hoveredData.label : defaultLabel;

  const centerSize = innerRadius * 2 - 16;

  if (innerRadius <= 0) {
    return null;
  }

  if (children) {
    return (
      <div
        className={cn(
          chartCenterContainerClassName,
          "flex items-center justify-center",
          className
        )}
        style={{ width: centerSize, height: centerSize }}
      >
        {children({
          value: displayValue,
          label: displayLabel,
          isHovered: Boolean(hoveredData),
          data: hoveredData ?? { label: defaultLabel, value: totalValue },
        })}
      </div>
    );
  }

  return (
    <div
      className={cn(
        chartCenterContainerClassName,
        "flex flex-col items-center justify-center text-center",
        className
      )}
      style={{ width: centerSize, height: centerSize }}
    >
      <ChartStatFlow
        formatOptions={formatOptions}
        label={displayLabel}
        labelClassName={labelClassName}
        prefix={prefix}
        suffix={suffix}
        value={displayValue}
        valueClassName={valueClassName}
      />
    </div>
  );
}

PieCenter.displayName = "PieCenter";

export default PieCenter;
