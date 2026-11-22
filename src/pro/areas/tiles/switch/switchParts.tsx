/** Shared bits for the switch tiles: the icon for what it powers, its words, a frameless sparkline. */
import type { IconSvgElement } from '@hugeicons/react';
import { PlugSocketIcon, ToggleOffIcon, ToggleOnIcon, FlashIcon } from '@hugeicons/core-free-icons';
import { forText, type SwitchTileModel } from '../../tileTypes';

export function switchIcon(e: SwitchTileModel): IconSvgElement {
  if (e.role === 'plug') return PlugSocketIcon;
  if (e.role === 'helper') return e.isOn ? ToggleOnIcon : ToggleOffIcon;
  return FlashIcon;
}

export const watts = (w: number | null) => (w === null ? '' : w >= 1000 ? `${(w / 1000).toFixed(1)} kW` : `${w < 10 ? w.toFixed(1) : Math.round(w)} W`);

/** "On · 12 W", "On for 2h", "Off", "Unavailable". */
export function switchState(e: SwitchTileModel): string {
  if (!e.available) return 'Unavailable';
  if (!e.isOn) return 'Off';
  if (e.powerW !== null) return `On · ${watts(e.powerW)}`;
  const f = forText(e.lastChanged);
  return f ? `On ${f}` : 'On';
}

export function Sparkline({ values, width, height, color }: { values: number[]; width: number; height: number; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - 2 - (v / max) * (height - 6)] as const);
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const id = `spark-${Math.round(width)}-${Math.round(height)}-${values.length}`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden className="block overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`${line} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
