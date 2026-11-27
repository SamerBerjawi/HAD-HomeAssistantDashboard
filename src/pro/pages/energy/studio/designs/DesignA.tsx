/**
 * Energy round 1 · A · Flow (docs/pro-ui/ENERGY.md §0). Live power as a small diagram: solar on
 * top, grid and battery either side, the home in the middle, a moving beam on every line that
 * carries power now. Today's totals beside it on wide screens. Then the usage chart with its
 * period, then every section as a card in a grid (one column on phones).
 */
import { useRef, useState, type RefObject } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { AnimatedBeam } from '../../../../ui/magicui/AnimatedBeam';
import { energyVerdict, fmtPower, liveFlows, type Period } from '../../../../lib/energyHome';
import { BLOCKS, COLOR, PeriodPicker, PeriodTotals, SOURCE_ICON, UsageChart, type DesignProps } from './parts';

function Node({ nodeRef, icon, label, value, color, sub, big }: { nodeRef: RefObject<HTMLDivElement | null>; icon: typeof SOURCE_ICON.home; label: string; value: string; color: string; sub?: string; big?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div ref={nodeRef} className={cn('z-10 grid place-items-center rounded-full bg-[var(--surface)] ring-2', big ? 'size-20' : 'size-14')} style={{ color, ['--tw-ring-color' as string]: `color-mix(in oklab, ${color} 45%, transparent)` }}>
        <HugeiconsIcon icon={icon} size={big ? 30 : 22} />
      </div>
      <p className="text-xs text-muted">{label}</p>
      <p className={cn('font-light tabular-nums leading-none', big ? 'text-2xl' : 'text-lg')}>{value}</p>
      {sub ? <p className="text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

function FlowDiagram({ home }: DesignProps) {
  const box = useRef<HTMLDivElement>(null);
  const solar = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const bat = useRef<HTMLDivElement>(null);
  const house = useRef<HTMLDivElement>(null);
  const { live } = home;
  const f = liveFlows(live);
  const g = live.grid ?? 0;
  const beams: { from: RefObject<HTMLDivElement | null>; to: RefObject<HTMLDivElement | null>; on: boolean; color: string; curve: number }[] = [
    { from: solar, to: house, on: f.solarToHome > 0.03, color: COLOR.solar, curve: 0 },
    { from: solar, to: bat, on: f.solarToBattery > 0.03, color: COLOR.solar, curve: -30 },
    { from: solar, to: grid, on: f.solarToGrid > 0.03, color: COLOR.export, curve: 30 },
    { from: grid, to: house, on: f.gridToHome > 0.03, color: COLOR.grid, curve: 0 },
    { from: bat, to: house, on: f.batteryToHome > 0.03, color: COLOR.battery, curve: 0 },
    { from: grid, to: bat, on: f.gridToBattery > 0.03, color: COLOR.grid, curve: 40 }
  ];
  return (
    <div ref={box} className="relative grid grid-cols-3 grid-rows-[auto_auto] items-center gap-y-6 py-2">
      {live.solar !== null ? (
        <div className="col-start-2">
          <Node nodeRef={solar} icon={SOURCE_ICON.solar} label="Solar" value={fmtPower(live.solar)} color={COLOR.solar} />
        </div>
      ) : (
        <div className="col-start-2 row-start-1 h-0" />
      )}
      <div className="col-start-1 row-start-2">
        <Node nodeRef={grid} icon={SOURCE_ICON.grid} label={g < -0.03 ? 'Sending to grid' : 'Grid'} value={fmtPower(g)} color={g < -0.03 ? COLOR.export : COLOR.grid} sub={home.grid.price !== null ? `${home.currency}${home.grid.price.toFixed(2)}/kWh` : undefined} />
      </div>
      <div className="col-start-2 row-start-2">
        <Node nodeRef={house} icon={SOURCE_ICON.home} label="Home" value={fmtPower(live.home)} color="var(--foreground)" big />
      </div>
      {live.battery !== null ? (
        <div className="col-start-3 row-start-2">
          <Node nodeRef={bat} icon={SOURCE_ICON.battery} label={live.battery > 0.03 ? 'Charging' : live.battery < -0.03 ? 'Battery' : 'Battery idle'} value={`${live.soc}%`} color={COLOR.battery} sub={Math.abs(live.battery) > 0.03 ? fmtPower(live.battery) : undefined} />
        </div>
      ) : null}
      {beams.map((b, i) => (b.on ? <AnimatedBeam key={i} containerRef={box} fromRef={b.from} toRef={b.to} curvature={b.curve} gradientStartColor={b.color} gradientStopColor={b.color} pathColor={b.color} pathOpacity={0.25} pathWidth={3} duration={2.4} /> : null))}
    </div>
  );
}

export default function DesignA({ home, width }: DesignProps) {
  const [period, setPeriod] = useState<Period>('day');
  const wide = width >= 900;
  const cols = width < 640 ? 1 : width < 1000 ? 2 : 3;
  const v = energyVerdict(home);
  const blocks = BLOCKS.filter((b) => b.has(home));
  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Right now" className={cn('pro-surface grid gap-6 rounded-[28px] p-5 sm:p-6', wide && 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center')}>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted">Right now</p>
          <h2 className={cn('font-light tracking-tight', width < 500 ? 'text-2xl' : 'text-3xl')}>{v.title}</h2>
          <p className="text-sm text-muted">{v.detail}</p>
          {wide ? <PeriodTotals home={home} period="day" width={width} cols={3} className="mt-6" /> : null}
        </div>
        <FlowDiagram home={home} width={width} />
        {!wide ? <PeriodTotals home={home} period="day" width={width} /> : null}
      </section>

      <section aria-label="Usage" className="pro-surface flex flex-col gap-4 rounded-[26px] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-light">Usage</h3>
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
        <UsageChart home={home} period={period} height={wide ? 240 : 190} />
        {period !== 'day' ? <PeriodTotals home={home} period={period} width={width} /> : null}
      </section>

      <div className="grid items-start gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {blocks.map(({ id, Block }) => (
          <Block key={id} home={home} />
        ))}
      </div>
    </div>
  );
}
