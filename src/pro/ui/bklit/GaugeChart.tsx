/**
 * Pro-UI GaugeChart & GridBalanceBar: official `@bklit/gauge-chart` (`Gauge`)
 * skinned onto HeroUI semantic tokens and flat borderless `.pro-surface` placement
 * (no nested card wrappers).
 */
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { PlugSocketIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { Gauge } from './gauge/gauge';

interface ArcGaugeProps {
  mode?: 'percent' | 'bipolar';
  /** Percentage 0–100 when `mode="percent"`, or signed ratio -1..+1 when `mode="bipolar"`. */
  value: number;
  centerText: string;
  label: string;
  icon: IconSvgElement;
  accentColor?: string;
  compact?: boolean;
  className?: string;
}

const BIPOLAR_ZONES = [
  { from: 0, to: 50, color: 'var(--energy-export)' },
  { from: 50, to: 100, color: 'var(--accent)' }
] as const;

export function ArcGauge({
  mode = 'percent',
  value,
  centerText,
  label,
  icon,
  accentColor = 'var(--success)',
  compact = false,
  className
}: ArcGaugeProps) {
  const clampedPct = Math.max(0, Math.min(100, value));
  const clampedRatio = Math.max(-1, Math.min(1, value));
  const bipolarValue = (clampedRatio + 1) * 50;

  const kwhMatch = /^(.*?\d)\s*(kWh|MWh|Wh)$/i.exec(centerText.trim());

  return (
    <div
      role="img"
      aria-label={`${label}: ${centerText}`}
      className={cn(
        'flex min-w-0 flex-col items-center justify-between gap-1 py-1 text-center',
        className
      )}
    >
      <div
        className={cn(
          'relative flex w-full flex-col items-center',
          compact ? 'max-w-[144px]' : 'max-w-[172px]'
        )}
      >
        {mode === 'bipolar' ? (
          <Gauge
            orientation="arc"
            value={bipolarValue}
            startAngle={180}
            endAngle={360}
            arcStyle="solid"
            arcThickness={0.09}
            arcCenterYRatio={0.86}
            aspectClassName="aspect-[2.05/1]"
            zones={BIPOLAR_ZONES}
            zoneDisplay="track"
            needle={{
              variant: 'polygon',
              color: 'var(--foreground)',
              width: 5,
              length: 0.3,
              tip: 'outer'
            }}
            ruler={{
              position: 'inside',
              ticks: 16,
              majorEvery: 8,
              majorLength: 0.032,
              minorLength: 0.016,
              gap: 0.02
            }}
            minWidth={0}
          />
        ) : (
          <Gauge
            orientation="arc"
            value={clampedPct}
            startAngle={180}
            endAngle={360}
            arcStyle="solid"
            arcThickness={0.09}
            arcCenterYRatio={0.86}
            aspectClassName="aspect-[2.05/1]"
            activeFill={accentColor}
            inactiveFill="var(--default)"
            inactiveFillOpacity={0.85}
            ruler={{
              position: 'inside',
              ticks: 16,
              majorEvery: 4,
              majorLength: 0.032,
              minorLength: 0.016,
              gap: 0.02
            }}
            minWidth={0}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-1 flex flex-col items-center justify-end">
          {kwhMatch ? (
            <>
              <span
                className={cn(
                  'font-mono font-bold tracking-tight text-foreground tabular-nums leading-none',
                  compact ? 'text-xs @[140px]:text-sm' : 'text-sm @[150px]:text-base'
                )}
              >
                {kwhMatch[1]}
              </span>
              <span className="mt-0.5 font-mono text-[9px] font-medium leading-none text-muted">
                {kwhMatch[2]}
              </span>
            </>
          ) : (
            <span
              className={cn(
                'font-mono font-bold tracking-tight text-foreground tabular-nums leading-none',
                compact ? 'text-xs @[140px]:text-sm' : 'text-sm @[150px]:text-base'
              )}
            >
              {centerText}
            </span>
          )}
        </div>
      </div>

      <span className="inline-flex max-w-full items-center justify-center gap-1 text-[11px] leading-tight font-medium text-muted">
        <HugeiconsIcon
          icon={icon}
          size={12}
          className="shrink-0"
          style={{ color: mode === 'bipolar' ? 'var(--accent)' : accentColor }}
        />
        <span className="truncate">{label}</span>
      </span>
    </div>
  );
}

interface GridBalanceBarProps {
  importKwh: number;
  exportKwh: number;
  netKwh: number;
  className?: string;
}

export function GridBalanceBar({ importKwh, exportKwh, netKwh, className }: GridBalanceBarProps) {
  const maxSide = Math.max(0.5, importKwh, exportKwh);
  const exportPct = Math.min(100, Math.round((exportKwh / maxSide) * 100));
  const importPct = Math.min(100, Math.round((importKwh / maxSide) * 100));

  return (
    <div className={cn('flex flex-col gap-2 py-0.5', className)}>
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <span className="pro-soft grid size-5 place-items-center rounded-lg">
            <HugeiconsIcon icon={PlugSocketIcon} size={12} />
          </span>
          Grid energy balance
        </span>
        <span className="font-mono text-[11px] font-semibold">
          <span className="text-[var(--accent)]">{importKwh.toFixed(1)}</span>
          <span className="mx-1 text-muted">-</span>
          <span className="text-[var(--energy-export)]">{exportKwh.toFixed(1)}</span>
          <span className="mx-1 text-muted">=</span>
          <span className={netKwh < 0 ? 'text-success' : 'text-foreground'}>
            {netKwh.toFixed(1)} kWh
          </span>
        </span>
      </div>

      <div className="relative flex h-2.5 w-full items-center overflow-hidden rounded-full bg-default/65">
        <div className="flex h-full w-1/2 justify-end border-r border-foreground/45">
          {exportPct > 0 ? (
            <div
              className="h-full rounded-l-full bg-[var(--energy-export)] transition-all duration-300"
              style={{ width: `${exportPct}%` }}
            />
          ) : null}
        </div>
        <div className="flex h-full w-1/2 justify-start">
          {importPct > 0 ? (
            <div
              className="h-full rounded-r-full bg-[var(--accent)]/85 transition-all duration-300"
              style={{ width: `${importPct}%` }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
