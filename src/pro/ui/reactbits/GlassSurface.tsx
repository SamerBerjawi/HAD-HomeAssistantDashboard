/**
 * GlassSurface: React Bits "Glass Surface", trimmed for the HAD pro UI (mobile nav pill only,
 * docs/pro-ui/DESIGN.md section 7.3).
 *
 * Source: https://github.com/DavidHDev/react-bits
 * (src/ts-tailwind/Components/GlassSurface/GlassSurface.tsx). Copyright (c) 2026 David Haz.
 * Licence: MIT + Commons Clause. It may be used as part of this application; the component itself
 * must not be sold, sublicensed or redistributed on its own.
 *
 * Kept as in the original: the SVG displacement-map refraction (Chromium) and the frosted-blur
 * fallback with sheen and rim (Safari/iOS, Firefox, or no SVG backdrop filters), including the
 * shadows, gradients and default values.
 * Removed to fit the repo's 800-line file limit, because HAD does not use them: the WebGL
 * renderer and `backdrop` prop, and custom `shape` tracing.
 * Added: `colorScheme`, so the `light-dark()` tints follow HAD's own theme toggle instead of the
 * browser preference.
 */
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type GlassSurfaceChannel = 'R' | 'G' | 'B';

export interface GlassSurfaceProps {
  children?: ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: GlassSurfaceChannel;
  yChannel?: GlassSurfaceChannel;
  mixBlendMode?: CSSProperties['mixBlendMode'];
  refraction?: boolean;
  /** Resolves the component's `light-dark()` colours. */
  colorScheme?: 'light' | 'dark';
  className?: string;
  style?: CSSProperties;
}

const SVG_SHADOW = [
  '0 0 2px 1px light-dark(color-mix(in oklch, black, transparent 85%), color-mix(in oklch, white, transparent 65%)) inset',
  '0 0 10px 4px light-dark(color-mix(in oklch, black, transparent 90%), color-mix(in oklch, white, transparent 85%)) inset',
  '0px 4px 16px rgba(17, 17, 26, 0.05)',
  '0px 8px 24px rgba(17, 17, 26, 0.05)',
  '0px 16px 56px rgba(17, 17, 26, 0.05)',
  '0px 4px 16px rgba(17, 17, 26, 0.05) inset',
  '0px 8px 24px rgba(17, 17, 26, 0.05) inset',
  '0px 16px 56px rgba(17, 17, 26, 0.05) inset'
].join(', ');

const FALLBACK_SHADOW = [
  'inset 0 1px 0 0 light-dark(hsl(0 0% 100% / 0.85), hsl(0 0% 100% / 0.3))',
  'inset 0 -1px 0 0 light-dark(hsl(0 0% 100% / 0.35), hsl(0 0% 100% / 0.08))',
  '0 0 2px 1px light-dark(color-mix(in oklch, black, transparent 88%), color-mix(in oklch, white, transparent 72%)) inset',
  '0 0 12px 3px light-dark(color-mix(in oklch, white, transparent 72%), color-mix(in oklch, white, transparent 90%)) inset',
  '0px 4px 16px rgba(17, 17, 26, 0.06)',
  '0px 8px 24px rgba(17, 17, 26, 0.06)',
  '0px 16px 56px rgba(17, 17, 26, 0.06)'
].join(', ');

const SHEEN =
  'linear-gradient(135deg, light-dark(hsl(0 0% 100% / 0.42), hsl(0 0% 100% / 0.14)) 0%, transparent 42%, transparent 64%, light-dark(hsl(0 0% 100% / 0.18), hsl(0 0% 100% / 0.05)) 100%)';

const RIM =
  'linear-gradient(150deg, light-dark(hsl(0 0% 100% / 0.7), hsl(0 0% 100% / 0.34)), light-dark(hsl(0 0% 100% / 0.1), hsl(0 0% 100% / 0.03)) 45%, light-dark(hsl(0 0% 100% / 0.08), hsl(0 0% 100% / 0.02)) 60%, light-dark(hsl(0 0% 100% / 0.42), hsl(0 0% 100% / 0.18)))';

const RING = 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)';

export default function GlassSurface({
  children,
  width = 200,
  height = 80,
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  displace = 0,
  backgroundOpacity = 0,
  saturation = 1,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'difference',
  refraction = true,
  colorScheme,
  className = '',
  style = {}
}: GlassSurfaceProps) {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;
  const softId = `soft-${uniqueId}`;

  const [svgSupported, setSvgSupported] = useState(false);
  const [blurSupported, setBlurSupported] = useState(true);
  const [boxSize, setBoxSize] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);

  const generateDisplacementMap = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const actualWidth = rect?.width || 400;
    const actualHeight = rect?.height || 200;
    const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5);

    const svgContent = `
      <svg width="${actualWidth}" height="${actualHeight}" viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
          <filter id="${softId}" filterUnits="userSpaceOnUse" x="0" y="0" width="${actualWidth}" height="${actualHeight}" color-interpolation-filters="sRGB">
            <feGaussianBlur stdDeviation="${blur}" />
          </filter>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" filter="url(#${softId})" />
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  };

  useEffect(() => {
    feImageRef.current?.setAttribute('href', generateDisplacementMap());
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString());
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });
    gaussianBlurRef.current?.setAttribute('stdDeviation', displace.toString());
    // The map is rebuilt whenever the size or any visual input changes, as in the original.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxSize, width, height, borderRadius, borderWidth, brightness, opacity, blur, displace, distortionScale, redOffset, greenOffset, blueOffset, xChannel, yChannel, mixBlendMode]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const resizeObserver = new ResizeObserver(() => setBoxSize(`${element.offsetWidth}x${element.offsetHeight}`));
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const supportsSVGFilters = () => {
      const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      const isFirefox = /Firefox/.test(navigator.userAgent);
      if (isWebkit || isFirefox) return false;
      const div = document.createElement('div');
      div.style.backdropFilter = `url(#${filterId})`;
      return div.style.backdropFilter !== '';
    };
    setSvgSupported(supportsSVGFilters());
    setBlurSupported(CSS.supports('backdrop-filter', 'blur(1px)') || CSS.supports('-webkit-backdrop-filter', 'blur(1px)'));
  }, [filterId]);

  const refractive = svgSupported && refraction;
  const frosted = !refractive;

  const frost = blurSupported
    ? `light-dark(hsl(0 0% 100% / ${0.12 + backgroundOpacity * 0.5}), hsl(0 0% 100% / ${0.04 + backgroundOpacity * 0.3}))`
    : 'light-dark(hsl(0 0% 100% / 0.72), hsl(0 0% 12% / 0.72))';
  const fallbackFilter = `blur(12px) saturate(${saturation * 1.4}) brightness(1.04)`;

  const modeStyle: CSSProperties = refractive
    ? {
        background: `light-dark(hsl(0 0% 100% / ${backgroundOpacity}), hsl(0 0% 0% / ${backgroundOpacity}))`,
        backdropFilter: `url(#${filterId}) saturate(${saturation})`,
        boxShadow: SVG_SHADOW
      }
    : {
        background: frost,
        WebkitBackdropFilter: fallbackFilter,
        backdropFilter: fallbackFilter,
        boxShadow: FALLBACK_SHADOW
      };

  const containerStyle: CSSProperties = {
    ...style,
    ...(colorScheme ? { colorScheme } : null),
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: `${borderRadius}px`,
    ...modeStyle
  };

  return (
    <div
      ref={containerRef}
      data-glass={refractive ? 'refraction' : 'frosted'}
      className={cn('relative flex items-center justify-center overflow-hidden transition-opacity duration-[260ms] ease-out', className)}
      style={containerStyle}
    >
      <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-0" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
            <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" result="dispRed" />
            <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
            <feDisplacementMap ref={greenChannelRef} in="SourceGraphic" in2="map" result="dispGreen" />
            <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
            <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" result="dispBlue" />
            <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>

      {frosted && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: SHEEN }} />}
      {frosted && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] p-[3px]"
          style={{ background: RIM, WebkitMask: RING, WebkitMaskComposite: 'xor', mask: RING, maskComposite: 'exclude' }}
        />
      )}

      <div className="relative z-[1] flex h-full w-full items-center justify-center rounded-[inherit] p-2">{children}</div>
    </div>
  );
}
