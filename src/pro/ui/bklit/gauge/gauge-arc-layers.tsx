"use client";

import type { MotionValue } from "motion/react";
import { useId, useRef } from "react";
import { clamp01, useMotionValueApply } from "./gauge-dial";

const MIN_SWEEP = 0.01;
const MAX_SWEEP = 359.99;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return [cx + Math.cos(rad) * r, cy + Math.sin(rad) * r] as const;
}

export function arcStrokePath(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number
): string {
  const sweep = Math.min(MAX_SWEEP, a1 - a0);
  if (sweep < MIN_SWEEP || r <= 0) {
    return "";
  }
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a0 + sweep);
  const large = sweep > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

export function annularSectorPath(
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  a0: number,
  a1: number
): string {
  const sweep = Math.min(MAX_SWEEP, a1 - a0);
  if (sweep < MIN_SWEEP) {
    return "";
  }
  const end = a0 + sweep;
  const large = sweep > 180 ? 1 : 0;
  const [ox0, oy0] = polar(cx, cy, r1, a0);
  const [ox1, oy1] = polar(cx, cy, r1, end);
  if (r0 <= 0.5) {
    return `M ${cx} ${cy} L ${ox0} ${oy0} A ${r1} ${r1} 0 ${large} 1 ${ox1} ${oy1} Z`;
  }
  const [ix1, iy1] = polar(cx, cy, r0, end);
  const [ix0, iy0] = polar(cx, cy, r0, a0);
  return `M ${ox0} ${oy0} A ${r1} ${r1} 0 ${large} 1 ${ox1} ${oy1} L ${ix1} ${iy1} A ${r0} ${r0} 0 ${large} 0 ${ix0} ${iy0} Z`;
}

export interface GaugeZone {
  from: number;
  to: number;
  color: string;
}

export type GaugeZoneDisplay = "band" | "fill" | "both" | "track";

export function zoneColorAt(
  zones: readonly GaugeZone[] | undefined,
  t: number
): string | undefined {
  if (!zones) {
    return;
  }
  const pct = t * 100;
  for (let i = zones.length - 1; i >= 0; i--) {
    const z = zones[i];
    if (z && pct >= z.from && pct <= z.to) {
      return z.color;
    }
  }
}

export const ZONE_BAND_WIDTH = 0.014;

export function GaugeZoneBands({
  cx,
  cy,
  radius,
  size,
  startAngle,
  endAngle,
  zones,
  opacity = 0.9,
}: {
  cx: number;
  cy: number;
  radius: number;
  size: number;
  startAngle: number;
  endAngle: number;
  zones: readonly GaugeZone[];
  opacity?: number;
}) {
  const sweep = endAngle - startAngle;
  return (
    <g>
      {zones.map((z) => (
        <path
          d={arcStrokePath(
            cx,
            cy,
            radius,
            startAngle + clamp01(z.from / 100) * sweep,
            startAngle + clamp01(z.to / 100) * sweep
          )}
          fill="none"
          key={`${z.from}-${z.to}-${z.color}`}
          stroke={z.color}
          strokeOpacity={opacity}
          strokeWidth={size * ZONE_BAND_WIDTH}
        />
      ))}
    </g>
  );
}

export function GaugeSolidArc({
  cx,
  cy,
  radius,
  thickness,
  startAngle,
  endAngle,
  progress,
  trackColor,
  trackOpacity,
  fill,
  fillOpacity,
  zones,
  fullTrackZones = false,
  glowFilterId,
}: {
  cx: number;
  cy: number;
  radius: number;
  thickness: number;
  startAngle: number;
  endAngle: number;
  progress: MotionValue<number>;
  trackColor: string;
  trackOpacity: number;
  fill: string;
  fillOpacity: number;
  zones?: readonly GaugeZone[];
  fullTrackZones?: boolean;
  glowFilterId?: string;
}) {
  const sweep = endAngle - startAngle;
  const fillRef = useRef<SVGPathElement>(null);
  const zoneRefs = useRef<(SVGPathElement | null)[]>([]);

  const fillD = (p: number) =>
    arcStrokePath(cx, cy, radius, startAngle, startAngle + p * sweep);
  const zoneD = (z: GaugeZone, p: number) => {
    const from = clamp01(z.from / 100);
    const to = fullTrackZones ? clamp01(z.to / 100) : Math.min(clamp01(z.to / 100), p);
    return to > from
      ? arcStrokePath(
          cx,
          cy,
          radius,
          startAngle + from * sweep,
          startAngle + to * sweep
        )
      : "";
  };

  useMotionValueApply(progress, (p) => {
    fillRef.current?.setAttribute("d", fillD(p));
    zones?.forEach((z, i) => {
      zoneRefs.current[i]?.setAttribute("d", zoneD(z, p));
    });
  });

  const p0 = progress.get();
  return (
    <g>
      <path
        d={arcStrokePath(cx, cy, radius, startAngle, endAngle)}
        fill="none"
        stroke={trackColor}
        strokeLinecap="round"
        strokeOpacity={trackOpacity}
        strokeWidth={thickness}
      />
      <g filter={glowFilterId ? `url(#${glowFilterId})` : undefined}>
        {!fullTrackZones ? (
          <path
            d={fillD(p0)}
            fill="none"
            ref={fillRef}
            stroke={fill}
            strokeLinecap="round"
            strokeOpacity={fillOpacity}
            strokeWidth={thickness}
          />
        ) : null}
        {zones?.map((z, i) => (
          <path
            d={zoneD(z, p0)}
            fill="none"
            key={`${z.from}-${z.to}-${z.color}`}
            ref={(el) => {
              zoneRefs.current[i] = el;
            }}
            stroke={z.color}
            strokeLinecap={i === 0 || i === zones.length - 1 ? "round" : "butt"}
            strokeOpacity={fillOpacity}
            strokeWidth={thickness}
          />
        ))}
      </g>
    </g>
  );
}

export interface GaugeSectorOptions {
  gradient?: "conic" | "radial" | "none";
  color?: string;
  opacity?: number;
  innerRadius?: number;
}

export function resolveSectorOptions(
  sector: boolean | GaugeSectorOptions | undefined
): GaugeSectorOptions | null {
  if (!sector) {
    return null;
  }
  return sector === true ? {} : sector;
}

export function GaugeSector({
  cx,
  cy,
  radius,
  startAngle,
  endAngle,
  progress,
  options,
}: {
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  progress: MotionValue<number>;
  options: GaugeSectorOptions;
}) {
  const {
    gradient = "conic",
    color = "var(--chart-1)",
    opacity = 0.85,
    innerRadius = 0,
  } = options;
  const gradientId = `gauge-sector-${useId().replace(/:/g, "")}`;
  const ref = useRef<SVGPathElement>(null);
  const r0 = radius * clamp01(innerRadius);
  const sweep = endAngle - startAngle;
  const d = (p: number) =>
    annularSectorPath(cx, cy, r0, radius, startAngle, startAngle + p * sweep);

  useMotionValueApply(progress, (p) => {
    ref.current?.setAttribute("d", d(p));
  });

  const isRadial = gradient === "radial";
  return (
    <g>
      {isRadial ? (
        <defs>
          <radialGradient
            cx={cx}
            cy={cy}
            gradientUnits="userSpaceOnUse"
            id={gradientId}
            r={radius}
          >
            <stop offset="0%" stopColor={color} stopOpacity={0} />
            <stop
              offset={`${Math.round((r0 / radius) * 100)}%`}
              stopColor={color}
              stopOpacity={0.04}
            />
            <stop offset="100%" stopColor={color} stopOpacity={opacity} />
          </radialGradient>
        </defs>
      ) : null}
      <path
        d={d(progress.get())}
        fill={isRadial ? `url(#${gradientId})` : color}
        fillOpacity={isRadial ? 1 : opacity}
        ref={ref}
      />
    </g>
  );
}

export function GaugeConicSector({
  cx,
  cy,
  radius,
  startAngle,
  endAngle,
  progress,
  options,
}: {
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
  progress: MotionValue<number>;
  options: GaugeSectorOptions;
}) {
  const { color = "var(--chart-1)", opacity = 0.85, innerRadius = 0 } = options;
  const ref = useRef<HTMLDivElement>(null);
  const r0 = radius * clamp01(innerRadius);
  const sweep = endAngle - startAngle;

  const style = (p: number) => {
    const deg = p * sweep;
    const path = annularSectorPath(
      cx,
      cy,
      r0,
      radius,
      startAngle,
      startAngle + deg
    );
    return {
      background: `conic-gradient(from ${startAngle + 90}deg at ${cx}px ${cy}px, transparent 0deg, ${color} ${Math.max(deg, 0.01)}deg, transparent ${Math.max(deg, 0.01)}deg)`,
      clipPath: path ? `path("${path}")` : "inset(50%)",
    };
  };

  useMotionValueApply(progress, (p) => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const next = style(p);
    el.style.background = next.background;
    el.style.clipPath = next.clipPath;
  });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      ref={ref}
      style={{ ...style(progress.get()), opacity }}
    />
  );
}

export interface GaugeProgressRingOptions {
  color?: string;
  trackColor?: string;
  trackOpacity?: number;
  width?: number;
  gap?: number;
}

export function resolveProgressRingOptions(
  ring: boolean | GaugeProgressRingOptions | undefined
): GaugeProgressRingOptions | null {
  if (!ring) {
    return null;
  }
  return ring === true ? {} : ring;
}

export function progressRingExtent(
  options: GaugeProgressRingOptions,
  size: number
) {
  return size * ((options.gap ?? 0.022) + (options.width ?? 0.01));
}

export function GaugeProgressRing({
  cx,
  cy,
  radius,
  size,
  startAngle,
  endAngle,
  progress,
  options,
  glowFilterId,
}: {
  cx: number;
  cy: number;
  radius: number;
  size: number;
  startAngle: number;
  endAngle: number;
  progress: MotionValue<number>;
  options: GaugeProgressRingOptions;
  glowFilterId?: string;
}) {
  const {
    color = "var(--chart-1)",
    trackColor = "var(--muted)",
    trackOpacity = 0.35,
    width = 0.01,
  } = options;
  const activeRef = useRef<SVGPathElement>(null);
  const restRef = useRef<SVGPathElement>(null);
  const sweep = endAngle - startAngle;
  const at = (p: number) => startAngle + p * sweep;

  useMotionValueApply(progress, (p) => {
    activeRef.current?.setAttribute(
      "d",
      arcStrokePath(cx, cy, radius, startAngle, at(p))
    );
    restRef.current?.setAttribute(
      "d",
      arcStrokePath(cx, cy, radius, at(p), endAngle)
    );
  });

  const p0 = progress.get();
  const strokeWidth = Math.max(1, size * width);
  return (
    <g>
      <path
        d={arcStrokePath(cx, cy, radius, at(p0), endAngle)}
        fill="none"
        ref={restRef}
        stroke={trackColor}
        strokeOpacity={trackOpacity}
        strokeWidth={strokeWidth}
      />
      <path
        d={arcStrokePath(cx, cy, radius, startAngle, at(p0))}
        fill="none"
        filter={glowFilterId ? `url(#${glowFilterId})` : undefined}
        ref={activeRef}
        stroke={color}
        strokeWidth={strokeWidth}
      />
    </g>
  );
}

export interface GaugeDotsOptions {
  rings?: number;
  spacing?: number;
  radius?: number;
  color?: string;
  dimOpacity?: number;
  litOpacity?: number;
  fadeInward?: boolean;
}

export function resolveDotsOptions(
  dots: boolean | GaugeDotsOptions | undefined
): GaugeDotsOptions | null {
  if (!dots) {
    return null;
  }
  return dots === true ? {} : dots;
}

export function GaugeDots({
  cx,
  cy,
  outerRadius,
  size,
  startAngle,
  endAngle,
  progress,
  options,
}: {
  cx: number;
  cy: number;
  outerRadius: number;
  size: number;
  startAngle: number;
  endAngle: number;
  progress: MotionValue<number>;
  options: GaugeDotsOptions;
}) {
  const {
    rings = 5,
    spacing = 0.03,
    radius = 1.6,
    color = "var(--chart-1)",
    dimOpacity = 0.12,
    litOpacity = 0.9,
    fadeInward = true,
  } = options;
  const step = Math.max(4, size * spacing);
  const sweep = endAngle - startAngle;
  const sweepRad = (sweep * Math.PI) / 180;
  const ringCount = Math.max(1, Math.round(rings));

  const dots: { x: number; y: number; t: number; weight: number }[] = [];
  for (let k = 0; k < ringCount; k++) {
    const r = outerRadius - k * step;
    if (r <= step) {
      break;
    }
    const count = Math.max(2, Math.round((sweepRad * r) / step));
    const weight = fadeInward ? 1 - (k / ringCount) * 0.6 : 1;
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const [x, y] = polar(cx, cy, r, startAngle + t * sweep);
      dots.push({ x, y, t, weight });
    }
  }

  const refs = useRef<(SVGCircleElement | null)[]>([]);
  const opacityAt = (p: number, t: number, weight: number) => {
    const lit = clamp01((p - t) * 60 + 1);
    return (dimOpacity + (litOpacity - dimOpacity) * lit) * weight;
  };

  useMotionValueApply(progress, (p) => {
    dots.forEach((dot, i) => {
      refs.current[i]?.setAttribute(
        "fill-opacity",
        String(opacityAt(p, dot.t, dot.weight))
      );
    });
  });

  const p0 = progress.get();
  return (
    <g>
      {dots.map((dot, i) => (
        <circle
          cx={dot.x}
          cy={dot.y}
          fill={color}
          fillOpacity={opacityAt(p0, dot.t, dot.weight)}
          key={i}
          r={radius}
          ref={(el) => {
            refs.current[i] = el;
          }}
        />
      ))}
    </g>
  );
}

export interface GaugeCenterDiscOptions {
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeOpacity?: number;
  strokeWidth?: number;
}

export function resolveCenterDiscOptions(
  disc: boolean | GaugeCenterDiscOptions | undefined
): GaugeCenterDiscOptions | null {
  if (!disc) {
    return null;
  }
  return disc === true ? {} : disc;
}

export function GaugeCenterDisc({
  cx,
  cy,
  size,
  options,
}: {
  cx: number;
  cy: number;
  size: number;
  options: GaugeCenterDiscOptions;
}) {
  const {
    radius = 0.19,
    fill = "var(--surface)",
    stroke = "var(--foreground)",
    strokeOpacity = 0.75,
    strokeWidth = 3,
  } = options;
  return (
    <circle
      cx={cx}
      cy={cy}
      fill={fill}
      r={size * radius}
      stroke={stroke}
      strokeOpacity={strokeOpacity}
      strokeWidth={strokeWidth}
    />
  );
}

export interface GaugeGlowOptions {
  blur?: number;
  intensity?: number;
}

export function resolveGlowOptions(
  glow: boolean | GaugeGlowOptions | undefined
): GaugeGlowOptions | null {
  if (!glow) {
    return null;
  }
  return glow === true ? {} : glow;
}

export function GaugeGlowFilter({
  id,
  options,
}: {
  id: string;
  options: GaugeGlowOptions;
}) {
  const { blur = 6, intensity = 0.8 } = options;
  return (
    <filter height="200%" id={id} width="200%" x="-50%" y="-50%">
      <feGaussianBlur in="SourceGraphic" result="blur" stdDeviation={blur} />
      <feComponentTransfer in="blur" result="glow">
        <feFuncA slope={intensity} type="linear" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}
