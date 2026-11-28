/** Shared bits for the batch 2 tiles: thermostat words and colours, a mode menu, comfort bands for readings. */
import { Button, Dropdown } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { ArrowDown01Icon, CloudIcon, DashboardSpeed01Icon, DropletIcon, Leaf01Icon, MinusSignIcon, PlusSignIcon, ThermometerIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { modeOf } from '../../../widgets/thermostat/concepts/ModeMenu';
import type { ClimateTileModel, ReadingTileModel, TileAction } from '../../tileTypes';

export const HEAT = 'hsl(22 95% 56%)';
export const COOL = 'hsl(205 90% 55%)';
export const IDLE = 'hsl(230 8% 58%)';

export const fmtT = (v: number | null, unit = '°') => (v === null ? '—' : `${v.toFixed(1)}${unit}`);

/** The colour of what the thermostat is doing (or set to do). */
export function climateHue(t: ClimateTileModel): string {
  if (!t.available || !t.isOn) return IDLE;
  if (t.action === 'heating' || t.mode === 'heat') return HEAT;
  if (t.action === 'cooling' || t.mode === 'cool') return COOL;
  return modeOf(t.mode).hue ?? IDLE;
}

/** "Heating to 22.0°", "Cooling to 22.0°", "Holding 21.5°", "Off", "Unavailable". */
export function actionText(t: ClimateTileModel): string {
  if (!t.available) return 'Unavailable';
  if (!t.isOn) return 'Off';
  const to = fmtT(t.target, t.unit);
  if (t.action === 'heating') return `Heating to ${to}`;
  if (t.action === 'cooling') return `Cooling to ${to}`;
  if (t.action === 'drying') return 'Drying';
  if (t.action === 'fan') return 'Fan only';
  return t.target !== null ? `Holding ${to}` : modeOf(t.mode).label;
}

export const clampTarget = (t: ClimateTileModel, v: number) => Math.max(t.min, Math.min(t.max, Math.round(v / t.step) * t.step));

export function ModeDropdown({ t, act, className, iconOnly }: { t: ClimateTileModel; act: (a: TileAction) => void; className?: string; iconOnly?: boolean }) {
  const now = modeOf(t.mode);
  if (t.modes.length < 2 || !t.available) return null;
  return (
    <Dropdown>
      <Button
        size="sm"
        variant="secondary"
        isIconOnly={iconOnly}
        data-tile-control=""
        aria-label={`${t.name} mode: ${now.label}. Change the mode`}
        className={cn('h-7 min-w-0 gap-1 rounded-full text-[12px] font-semibold', iconOnly ? 'size-8 p-0' : 'px-2.5', className)}
        style={now.hue ? { color: now.hue } : undefined}
      >
        <HugeiconsIcon icon={now.icon} size={14} />
        {iconOnly ? null : (
          <>
            {now.label}
            <HugeiconsIcon icon={ArrowDown01Icon} size={11} className="opacity-60" />
          </>
        )}
      </Button>
      <Dropdown.Popover placement="bottom" className="min-w-40">
        <Dropdown.Menu aria-label={`${t.name} mode`} selectionMode="single" selectedKeys={new Set([t.mode])} onAction={(k) => act({ type: 'hvac', mode: String(k) })}>
          {t.modes.map((m) => {
            const info = modeOf(m);
            return (
              <Dropdown.Item key={m} id={m} textValue={info.label}>
                <HugeiconsIcon icon={info.icon} size={15} style={info.hue ? { color: info.hue } : undefined} />
                {info.label}
              </Dropdown.Item>
            );
          })}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

/** − or + for the target, one step per press. */
export function StepButton({ t, act, dir, size = 32, className }: { t: ClimateTileModel; act: (a: TileAction) => void; dir: 1 | -1; size?: number; className?: string }) {
  const at = t.target ?? t.current ?? 21;
  const blocked = !t.available || !t.isOn || t.target === null || (dir > 0 ? at >= t.max : at <= t.min);
  return (
    <Button
      isIconOnly
      variant="secondary"
      data-tile-control=""
      aria-label={`${t.name}: ${dir > 0 ? 'raise' : 'lower'} the target`}
      isDisabled={blocked}
      onPress={() => act({ type: 'target', value: clampTarget(t, at + dir * t.step) })}
      className={cn('min-w-0 shrink-0 rounded-full p-0', className)}
      style={{ width: size, height: size }}
    >
      <HugeiconsIcon icon={dir > 0 ? PlusSignIcon : MinusSignIcon} size={Math.round(size * 0.45)} style={{ width: Math.round(size * 0.45), height: Math.round(size * 0.45) }} />
    </Button>
  );
}

/* ── Readings ─────────────────────────────────────────────────────────── */

export const readingIcon = (r: ReadingTileModel): IconSvgElement =>
  r.deviceClass === 'temperature' ? ThermometerIcon : r.deviceClass === 'humidity' ? DropletIcon : r.deviceClass === 'carbon_dioxide' ? CloudIcon : r.deviceClass === 'pm25' ? Leaf01Icon : DashboardSpeed01Icon;

export type ComfortLevel = 'good' | 'ok' | 'bad' | 'none';
export const LEVEL_HUE: Record<ComfortLevel, string> = { good: 'hsl(152 55% 42%)', ok: 'hsl(38 92% 50%)', bad: 'hsl(6 78% 55%)', none: 'hsl(210 70% 58%)' };

interface Band {
  /** The scale a gauge draws. */
  scale: [number, number];
  /** The comfortable range. */
  band: [number, number] | null;
  ideal: string;
  judge: (v: number) => { level: ComfortLevel; word: string; advice: string };
}

const BANDS: Record<string, Band> = {
  temperature: {
    scale: [10, 32],
    band: [19, 24],
    ideal: '19–24°',
    judge: (v) =>
      v < 16 ? { level: 'bad', word: 'Cold', advice: 'Turn the heating up' } : v < 19 ? { level: 'ok', word: 'Cool', advice: 'A little cool for sitting' } : v <= 24 ? { level: 'good', word: 'Comfortable', advice: 'Just right' } : v <= 27 ? { level: 'ok', word: 'Warm', advice: 'Getting warm' } : { level: 'bad', word: 'Hot', advice: 'Cool down or open a window' }
  },
  humidity: {
    scale: [0, 100],
    band: [40, 60],
    ideal: '40–60%',
    judge: (v) =>
      v < 30 ? { level: 'bad', word: 'Very dry', advice: 'Run a humidifier' } : v < 40 ? { level: 'ok', word: 'Dry', advice: 'A humidifier would help' } : v <= 60 ? { level: 'good', word: 'Comfortable', advice: 'Healthy humidity' } : v <= 70 ? { level: 'ok', word: 'Humid', advice: 'Ventilate the room' } : { level: 'bad', word: 'Very humid', advice: 'Run a dehumidifier' }
  },
  carbon_dioxide: {
    scale: [400, 2000],
    band: [400, 800],
    ideal: 'under 800 ppm',
    judge: (v) => (v <= 800 ? { level: 'good', word: 'Fresh', advice: 'Fresh air' } : v <= 1200 ? { level: 'ok', word: 'Okay', advice: 'Air it out soon' } : { level: 'bad', word: 'Stuffy', advice: 'Open a window' })
  },
  pm25: {
    scale: [0, 75],
    band: [0, 12],
    ideal: 'under 12 µg/m³',
    judge: (v) => (v <= 12 ? { level: 'good', word: 'Clean', advice: 'Clean air' } : v <= 35 ? { level: 'ok', word: 'Moderate', advice: 'Consider the purifier' } : { level: 'bad', word: 'Poor', advice: 'Run the air purifier' })
  }
};

export interface Reading {
  value: string;
  /** The value split for display: the number big, the unit small. */
  num: string;
  unit: string;
  level: ComfortLevel;
  word: string;
  advice: string;
  ideal: string;
  scale: [number, number];
  band: [number, number] | null;
  hue: string;
  /** Change over the last hour (history is 24 points over 6 h). */
  delta: number | null;
  lo: number | null;
  hi: number | null;
}

export function readingOf(r: ReadingTileModel): Reading {
  const b = BANDS[r.deviceClass];
  const h = r.history;
  const lo = h.length ? Math.min(...h) : null;
  const hi = h.length ? Math.max(...h) : null;
  const unitText = r.unit === '%' ? '%' : r.unit === '°' ? '°' : ` ${r.unit}`;
  const whole = r.unit === '%' || r.unit === 'ppm';
  const num = r.value === null || !r.available ? '—' : `${whole ? Math.round(r.value) : r.unit === '°' || r.value % 1 ? r.value.toFixed(1) : r.value}`;
  const value = num === '—' ? num : `${num}${unitText}`;
  const j = b && r.value !== null && r.available ? b.judge(r.value) : { level: 'none' as const, word: r.available ? '' : 'Unavailable', advice: '' };
  const delta = r.value !== null && h.length > 5 ? r.value - h[h.length - 5] : null;
  return {
    value,
    num,
    unit: num === '—' ? '' : unitText.trim(),
    ...j,
    ideal: b?.ideal ?? '',
    scale: b?.scale ?? [lo ?? 0, hi ?? 100],
    band: b?.band ?? null,
    hue: LEVEL_HUE[j.level],
    delta,
    lo,
    hi
  };
}

/** A reading's value: number big, unit small and never wrapped onto its own line. */
export function ReadingValue({ info, className }: { info: Reading; className?: string }) {
  const sym = info.unit === '%' || info.unit === '°';
  return (
    <p className={cn('whitespace-nowrap font-semibold leading-none tracking-[-0.03em] tabular-nums', className)}>
      {info.num}
      {info.unit ? <span className={cn('tracking-normal', sym ? '' : 'ml-[0.15em] text-[0.5em] font-medium opacity-70')}>{info.unit}</span> : null}
    </p>
  );
}

/** "↑ 0.4° in 1 h", "Steady". */
export function deltaText(r: ReadingTileModel, d: number | null): string {
  if (d === null) return '';
  const step = r.unit === 'ppm' ? 20 : r.unit === '%' ? 1 : 0.2;
  if (Math.abs(d) < step) return 'Steady';
  const n = r.unit === 'ppm' || r.unit === '%' ? Math.round(Math.abs(d)) : Math.abs(d).toFixed(1);
  return `${d > 0 ? '↑' : '↓'} ${n}${r.unit === '°' ? '°' : r.unit === '%' ? '%' : ` ${r.unit}`} in 1 h`;
}

/** Smooth line through values in a W × H box (Catmull-Rom → Bézier). */
export function smoothPath(values: number[], w: number, h: number, pad = 4, range?: [number, number]): string {
  if (values.length < 2) return '';
  const lo = range ? range[0] : Math.min(...values);
  const hi = range ? range[1] : Math.max(...values);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - pad - ((v - lo) / (hi - lo || 1)) * (h - pad * 2)] as const);
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [pts[i - 1] ?? pts[i], pts[i], pts[i + 1], pts[i + 2] ?? pts[i + 1]];
    d += ` C ${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)} ${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)} ${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
