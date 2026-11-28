/**
 * The last 24 hours of a thermostat (owner review 2026-11-20, WIDGET_DESIGN.md §8 #13): the room
 * temperature as a soft area line and the target as a dashed step line. Live HA history with
 * attributes; a generated day in demo mode.
 */
import { useEffect, useMemo, useState } from 'react';
import { area as d3Area, curveMonotoneX, curveStepAfter, line as d3Line } from 'd3-shape';
import { haWebSocketService } from '@/services/haWebSocket';
import { climateRange, demoClimateHistory, parseClimateHistory, type ClimatePoint } from '../../lib/climateHistory';
import { useMeasuredWidth } from '../../ui/bklit/useBklitChartBox';
import { SheetSection } from '../shared/sheet/SheetKit';
import type { ProThermostatItem } from '../../lib/overviewThermostat';

const H = 132;
const PAD = { top: 8, bottom: 18, left: 30 };

function useClimateHistory(t: ProThermostatItem) {
  const [points, setPoints] = useState<ClimatePoint[] | null>(null);
  const { entityId, current, target } = t;
  useEffect(() => {
    let live = true;
    if (haWebSocketService.isDemo()) {
      setPoints(demoClimateHistory(current, target));
      return;
    }
    setPoints(null);
    const start = new Date(Date.now() - 24 * 3_600_000).toISOString();
    haWebSocketService
      .sendRequest<unknown>('history/history_during_period', { start_time: start, entity_ids: [entityId], minimal_response: false, no_attributes: false, significant_changes_only: false })
      .then((res) => live && setPoints(parseClimateHistory(res, entityId)))
      .catch(() => live && setPoints([]));
    return () => {
      live = false;
    };
    // Current and target are only the demo's seed; a live chart reloads when the thermostat changes.
  }, [entityId]);
  return points;
}

export function ThermostatHistory({ t }: { t: ProThermostatItem }) {
  const points = useClimateHistory(t);
  // The room line takes the card's air: icy while cooling, ember otherwise.
  const ink = t.action === 'cooling' ? 'hsl(198 85% 60%)' : 'hsl(18 90% 58%)';
  const { ref, width } = useMeasuredWidth();
  const chart = useMemo(() => {
    if (!points || points.length < 2 || width <= 0) return null;
    // Carry the last point to now so the lines reach the right edge.
    const now = Date.now();
    const data = points[points.length - 1].t < now ? [...points, { ...points[points.length - 1], t: now }] : points;
    const t0 = now - 24 * 3_600_000;
    const { lo, hi } = climateRange(data);
    const w = width - PAD.left;
    const x = (p: ClimatePoint) => PAD.left + ((Math.max(p.t, t0) - t0) / (now - t0)) * w;
    const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);
    const room = data.filter((p) => p.room !== null);
    const target = data.filter((p) => p.target !== null);
    return {
      area: d3Area<ClimatePoint>()
        .x(x)
        .y0(H - PAD.bottom)
        .y1((p) => y(p.room as number))
        .curve(curveMonotoneX)(room),
      line: d3Line<ClimatePoint>()
        .x(x)
        .y((p) => y(p.room as number))
        .curve(curveMonotoneX)(room),
      target: d3Line<ClimatePoint>()
        .x(x)
        .y((p) => y(p.target as number))
        .curve(curveStepAfter)(target),
      ticks: [hi, (hi + lo) / 2, lo].map((v) => ({ v, y: y(v) })),
      hours: [24, 18, 12, 6, 0].map((h) => ({ h, x: PAD.left + ((24 - h) / 24) * w }))
    };
  }, [points, width]);

  return (
    <SheetSection title="Last 24 hours" aside={<Legend ink={ink} />} plain>
      <div ref={ref} className="pro-surface rounded-[18px] p-3">
        {points === null ? (
          <div className="h-[132px] animate-pulse rounded-xl bg-default/40" />
        ) : !chart ? (
          <p className="grid h-[132px] place-items-center text-xs text-muted">No history recorded yet</p>
        ) : (
          <svg width={width} height={H} role="img" aria-label={`${t.name}: room temperature and target over the last 24 hours`} className="block overflow-visible">
            <defs>
              <linearGradient id="climate-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={ink} stopOpacity="0.32" />
                <stop offset="100%" stopColor={ink} stopOpacity="0" />
              </linearGradient>
            </defs>
            {chart.ticks.map((k) => (
              <g key={k.v}>
                <line x1={PAD.left} x2={width} y1={k.y} y2={k.y} stroke="currentColor" className="text-muted" strokeOpacity={0.15} />
                <text x={0} y={k.y + 3} className="fill-[var(--muted)] text-[10px] tabular-nums">
                  {`${Math.round(k.v * 10) / 10}°`}
                </text>
              </g>
            ))}
            {chart.hours.map((k) => (
              <text key={k.h} x={k.x} y={H - 4} textAnchor={k.h === 24 ? 'start' : k.h === 0 ? 'end' : 'middle'} className="fill-[var(--muted)] text-[10px]">
                {k.h === 0 ? 'Now' : `-${k.h}h`}
              </text>
            ))}
            {chart.area ? <path d={chart.area} fill="url(#climate-fill)" /> : null}
            {chart.target ? <path d={chart.target} fill="none" stroke="currentColor" className="text-foreground" strokeOpacity={0.55} strokeWidth={1.5} strokeDasharray="4 4" /> : null}
            {chart.line ? <path d={chart.line} fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" /> : null}
          </svg>
        )}
      </div>
    </SheetSection>
  );
}

function Legend({ ink }: { ink: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex items-center gap-1">
        <span className="h-0.5 w-3 rounded" style={{ background: ink }} />
        Room
      </span>
      <span className="flex items-center gap-1">
        <span className="w-3 border-t-[1.5px] border-dashed border-current" />
        Target
      </span>
    </span>
  );
}
