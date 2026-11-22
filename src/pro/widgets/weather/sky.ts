/**
 * Weather colour (WIDGET_DESIGN.md D1: colour from content). The sky follows the condition and
 * the time of day; temperature has its own scale (cold blue → mild green → warm amber → hot red).
 * Pure functions, no React.
 */

export type SkyKind = 'clear' | 'partly' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'fog';

export function skyKind(condition: string): SkyKind {
  const c = condition.toLowerCase();
  if (c.includes('lightning') || c.includes('thunder')) return 'storm';
  if (c.includes('snow') || c.includes('sleet') || c.includes('hail')) return 'snow';
  if (c.includes('rain') || c.includes('pouring')) return 'rain';
  if (c.includes('fog')) return 'fog';
  if (c.includes('partly')) return 'partly';
  if (c.includes('cloud')) return 'cloudy';
  return 'clear';
}

/** Top and bottom of the sky gradient. Night skies are deep blue; day skies are lighter. */
const DAY: Record<SkyKind, [string, string]> = {
  clear: ['#3b8fe8', '#8cc8f5'],
  partly: ['#3a82d8', '#7fb6ea'],
  cloudy: ['#6b7d93', '#a7b4c4'],
  rain: ['#46596f', '#7c8ea3'],
  storm: ['#2f3446', '#5a5f78'],
  // Darker than a real snow sky so white type stays readable (2026-11-20).
  snow: ['#6d86a8', '#a7b8cd'],
  fog: ['#8e98a3', '#c3c9cf']
};
const NIGHT: Record<SkyKind, [string, string]> = {
  clear: ['#0b1736', '#26386b'],
  partly: ['#121d3a', '#2f3d63'],
  cloudy: ['#1b2230', '#38404f'],
  rain: ['#161d2a', '#323c4d'],
  storm: ['#120f22', '#2c2742'],
  snow: ['#26324a', '#4c5a75'],
  fog: ['#22272e', '#454c55']
};

export function skyGradient(condition: string, isNight: boolean): string {
  const [top, bottom] = (isNight ? NIGHT : DAY)[skyKind(condition)];
  return `linear-gradient(165deg, ${top} 0%, ${bottom} 100%)`;
}

/** Degrees Celsius from a reading in the model's unit. */
export const toCelsius = (t: number, unit: string) => (unit.includes('F') ? ((t - 32) * 5) / 9 : t);

/** Temperature colour: hue 215 (−10 °C and below) through 150, 45, to 5 (35 °C and above). */
export function tempHue(celsius: number): number {
  const stops: [number, number][] = [
    [-10, 215],
    [5, 195],
    [14, 150],
    [22, 45],
    [30, 20],
    [35, 5]
  ];
  if (celsius <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [t1, h1] = stops[i];
    const [t0, h0] = stops[i - 1];
    if (celsius <= t1) return h0 + ((celsius - t0) / (t1 - t0)) * (h1 - h0);
  }
  return stops[stops.length - 1][1];
}

/** HSL colour for a temperature; `lightness` lets text and fills share the same hue. */
export const tempColor = (celsius: number, lightness = 55, saturation = 72) => `hsl(${Math.round(tempHue(celsius))} ${saturation}% ${lightness}%)`;
