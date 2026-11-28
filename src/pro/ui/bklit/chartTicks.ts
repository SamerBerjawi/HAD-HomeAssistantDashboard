/** Axis ticks shared by the pro charts (power sources first, 2026-11-21). */
/** Round axis steps (0.25, 0.5, 1, 2…) covering both ends, as HA's chart does. */
export function niceTicks(min: number, max: number, target = 6): number[] {
  const span = Math.max(1e-6, max - min);
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.abs(v) < step / 1000 ? 0 : Number(v.toFixed(6)));
  return ticks;
}

/** Axis label with as many decimals as the step needs. */
export const tickLabel = (v: number, step: number) => (v === 0 ? '0' : v.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0));
