/**
 * Section 5 — Solar production & forecast:
 * A · Sun Arc Horizon (custom SVG semicircular daylight sun-arc + SolarForecastBarChart)
 * B · Forecast Variance Deck (circular yield-vs-forecast ring + variance pill + bar chart)
 * C · Clean Editorial Yield (4-metric top ribbon + full-width chart + self-use/export split bar)
 */
import { Chip } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SolarPanel01Icon, Sun01Icon, SunriseIcon, SunsetIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { SolarForecastBarChart } from '../../../../ui/bklit/SolarForecastBarChart';
import { fmtKwh, fmtPct } from '../energyParts';
import { NoSectionData } from './conceptHelpers';
import type { SectionConceptProps } from './types';

function SunArc({ progressPct, peakText, nowKwText }: { progressPct: number; peakText: string; nowKwText: string }) {
  const pct = Math.max(0, Math.min(100, progressPct));
  const r = 92;
  const cx = 130;
  const cy = 104;
  const angle = Math.PI - (pct / 100) * Math.PI;
  const sunX = cx + r * Math.cos(angle);
  const sunY = cy - r * Math.sin(angle);
  const halfCirc = Math.PI * r;
  const activeLen = (pct / 100) * halfCirc;

  return (
    <svg viewBox="0 0 260 118" className="h-28 w-full max-w-[300px]" role="img" aria-label={`Solar arc at ${pct}% progress`}>
      <defs>
        <radialGradient id="pro-e-sun-glow">
          <stop offset="0%" stopColor="var(--energy-solar)" stopOpacity="0.65" />
          <stop offset="100%" stopColor="var(--energy-solar)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <line x1="20" y1={cy} x2="240" y2={cy} stroke="var(--default)" strokeWidth="1" strokeDasharray="3 3" />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="var(--default)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="var(--energy-solar)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${activeLen} ${halfCirc}`}
      />
      <circle cx={sunX} cy={sunY} r="14" fill="url(#pro-e-sun-glow)" />
      <circle cx={sunX} cy={sunY} r="5.5" fill="var(--energy-solar)" stroke="var(--surface)" strokeWidth="2" />
      <text
        x={cx}
        y={cy - 22}
        textAnchor="middle"
        fontSize="18"
        fontWeight="700"
        fill="var(--foreground)"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {nowKwText}
      </text>
      <text x={cx} y={cy - 7} textAnchor="middle" fontSize="9.5" fill="var(--muted)">
        peak {peakText}
      </text>
    </svg>
  );
}

/** 5A · Sun Arc Horizon */
export function SolarA({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  if (!m.hasSolar) return <NoSectionData icon={SolarPanel01Icon} title="Solar" note="No solar panels configured in Grid only state." />;

  const forecastBase = m.solarForecastKwh && m.solarForecastKwh > 0 ? m.solarForecastKwh : m.solarKwh || 1;
  const yieldProgress = Math.min(100, Math.round((m.solarKwh / forecastBase) * 100));

  return (
    <section
      aria-label="Solar horizon arc"
      className="pro-eb flex flex-col gap-3 p-4"
      style={{ ['--eb-tint' as string]: '245, 168, 56' }}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="grid size-8 place-items-center rounded-xl bg-amber-500/15 text-[var(--energy-solar)]">
            <HugeiconsIcon icon={Sun01Icon} size={17} />
          </span>
          Solar harvest & forecast
        </span>
        <Chip size="sm" variant="soft" color={yieldProgress >= 85 ? 'success' : 'warning'}>
          <HugeiconsIcon icon={SolarPanel01Icon} size={12} />
          <Chip.Label>{yieldProgress}% of forecast</Chip.Label>
        </Chip>
      </header>

      <div className="flex flex-col items-center rounded-2xl bg-[var(--background)]/45 px-3 pt-2 pb-2.5">
        <SunArc progressPct={yieldProgress} peakText={m.peakSolarKWText} nowKwText={m.solarKwhText} />
        <div className="flex w-full max-w-[290px] items-center justify-between text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <HugeiconsIcon icon={SunriseIcon} size={13} className="text-[var(--energy-solar)]" />
            Morning
          </span>
          <span className="tabular-nums font-medium text-foreground">
            {m.selfConsumptionPct}% self-consumed
          </span>
          <span className="flex items-center gap-1">
            Evening
            <HugeiconsIcon icon={SunsetIcon} size={13} className="text-[var(--energy-solar)]" />
          </span>
        </div>
      </div>

      <SolarForecastBarChart data={m.solarForecastSeries} height={compact ? 150 : 175} />
    </section>
  );
}

/** 5B · Forecast Variance Deck */
export function SolarB({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  if (!m.hasSolar) return <NoSectionData icon={SolarPanel01Icon} title="Solar" note="No solar panels configured in Grid only state." />;

  const fc = m.solarForecastKwh ?? m.solarKwh;
  const pct = fc > 0 ? Math.min(130, Math.round((m.solarKwh / fc) * 100)) : 100;
  const diff = m.solarForecastKwh !== null ? m.solarKwh - m.solarForecastKwh : null;
  const r = 36;
  const c = 2 * Math.PI * r;
  const fill = (Math.min(100, pct) / 100) * c;

  return (
    <section aria-label="Solar forecast variance" className="pro-surface @container flex flex-col gap-3 p-4">
      <div className={cn('grid grid-cols-1 gap-4', !compact && '@[470px]:grid-cols-[195px_1fr] @[470px]:items-center')}>
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-default/45 p-3 text-center">
          <svg viewBox="0 0 92 92" className="size-24" role="img" aria-label={`Solar yield ${pct}% of forecast`}>
            <g transform="rotate(-90 46 46)">
              <circle cx="46" cy="46" r={r} fill="none" stroke="var(--default)" strokeWidth="8" />
              <circle
                cx="46"
                cy="46"
                r={r}
                fill="none"
                stroke={pct >= 85 ? 'var(--energy-solar)' : 'var(--warning)'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${fill} ${c}`}
              />
            </g>
            <text
              x="46"
              y="44"
              textAnchor="middle"
              fontSize="15"
              fontWeight="700"
              fill="var(--foreground)"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {pct}%
            </text>
            <text x="46" y="57" textAnchor="middle" fontSize="8" fill="var(--muted)">
              of forecast
            </text>
          </svg>

          <div>
            <p className="text-base font-bold tabular-nums">{m.solarKwhText}</p>
            {diff !== null ? (
              <Chip size="sm" variant="soft" color={diff >= 0 ? 'success' : 'warning'} className="mt-1">
                <Chip.Label>
                  {diff >= 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)} kWh variance
                </Chip.Label>
              </Chip>
            ) : null}
          </div>

          <div className="grid w-full grid-cols-2 gap-1.5 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] pt-2 text-[11px]">
            <div>
              <span className="block text-muted">Peak</span>
              <span className="font-semibold tabular-nums">{m.peakSolarKWText}</span>
            </div>
            <div>
              <span className="block text-muted">Exported</span>
              <span className="font-semibold tabular-nums">{fmtKwh(m.solarToGridKwh)}</span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <header className="flex flex-wrap items-center justify-between gap-1 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-foreground">
              <HugeiconsIcon icon={SolarPanel01Icon} size={15} className="text-[var(--energy-solar)]" />
              Hourly actual vs forecast
            </span>
            <span className="text-muted tabular-nums">Forecast {m.solarForecastText}</span>
          </header>
          <SolarForecastBarChart data={m.solarForecastSeries} height={compact ? 155 : 195} />
        </div>
      </div>
    </section>
  );
}

/** 5C · Clean Editorial Yield */
export function SolarC({ snap, compact }: SectionConceptProps) {
  const m = snap.model;
  if (!m.hasSolar) return <NoSectionData icon={SolarPanel01Icon} title="Solar" note="No solar panels configured in Grid only state." />;

  const localPct = Math.max(0, Math.min(100, m.selfConsumptionPct));
  const exportPct = Math.max(0, 100 - localPct);

  return (
    <section aria-label="Solar editorial yield" className="pro-surface flex flex-col gap-3 p-4">
      <header className="grid grid-cols-4 gap-2 text-xs">
        <div>
          <span className="flex items-center gap-1 text-[11px] text-muted">
            <HugeiconsIcon icon={Sun01Icon} size={12} className="text-[var(--energy-solar)]" />
            Generated
          </span>
          <span className="text-sm font-bold tabular-nums">{m.solarKwhText}</span>
        </div>
        <div>
          <span className="block text-[11px] text-muted">Forecast</span>
          <span className="text-sm font-bold tabular-nums">{m.solarForecastText}</span>
        </div>
        <div>
          <span className="block text-[11px] text-muted">Peak power</span>
          <span className="text-sm font-bold tabular-nums">{m.peakSolarKWText}</span>
        </div>
        <div className="text-right">
          <span className="block text-[11px] text-muted">Exported</span>
          <span className="text-sm font-bold tabular-nums">{fmtKwh(m.solarToGridKwh)}</span>
        </div>
      </header>

      <SolarForecastBarChart data={m.solarForecastSeries} height={compact ? 155 : 180} />

      <div className="flex flex-col gap-1">
        <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-default">
          <span className="h-full bg-[var(--energy-solar)]" style={{ width: `${localPct}%` }} />
          <span className="h-full bg-[var(--energy-export)]" style={{ width: `${exportPct}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-muted tabular-nums">
          <span>Kept at home {fmtPct(localPct)}</span>
          <span>Sent to grid {fmtPct(exportPct)}</span>
        </div>
      </div>
    </section>
  );
}
