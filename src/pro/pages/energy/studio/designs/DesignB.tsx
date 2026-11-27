/**
 * Energy round 1 · B · Ambient (docs/pro-ui/ENERGY.md §0). Built like the Security page you
 * approved: a soft hero lit by where the power comes from now (sun orange, battery teal, grid blue,
 * export violet), the answer in a few words, one "power river" bar that splits the home's draw by
 * source, and a line of facts (sun, price, grid carbon). Then the usage chart, then every other
 * section in tabs, the same on phone and desktop.
 */
import { useState } from 'react';
import { Tabs } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ChartLineData01Icon, Leaf01Icon, SunriseIcon, SunsetIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { clock, energyVerdict, fmtPower, fmtPrice, homeMix, liveFlows, type EnergyHome, type Period } from '../../../../lib/energyHome';
import { BLOCKS, COLOR, PeriodPicker, PeriodTotals, PRICE_COLOR, SOURCE_COLOR, SOURCE_ICON, UsageChart, type DesignProps } from './parts';

function heroBackground(tone: string) {
  return `radial-gradient(120% 140% at 0% 0%, color-mix(in oklab, ${tone} 30%, transparent), transparent 60%), radial-gradient(80% 120% at 100% 100%, color-mix(in oklab, var(--accent) 16%, transparent), transparent 70%), var(--surface)`;
}

/** The home's draw by source, and (after a gap) where the surplus goes. */
export function PowerRiver({ home }: { home: EnergyHome }) {
  const f = liveFlows(home.live);
  const mix = homeMix(home.live);
  const into = [
    { id: 'solar', kw: f.solarToHome, color: COLOR.solar, label: 'Sun' },
    { id: 'battery', kw: f.batteryToHome, color: COLOR.battery, label: 'Battery' },
    { id: 'grid', kw: f.gridToHome, color: COLOR.grid, label: 'Grid' }
  ].filter((x) => x.kw > 0.02);
  const out = [
    { id: 'charge', kw: f.solarToBattery + f.gridToBattery, color: COLOR.battery, label: 'To battery' },
    { id: 'export', kw: f.solarToGrid + f.batteryToGrid, color: COLOR.export, label: 'To grid' }
  ].filter((x) => x.kw > 0.02);
  const total = [...into, ...out].reduce((a, x) => a + x.kw, 0) || 1;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-3 gap-1">
        {into.map((x) => (
          <span key={x.id} className="rounded-full" style={{ flex: x.kw / total, background: x.color }} />
        ))}
        {out.length ? <span aria-hidden className="w-2" /> : null}
        {out.map((x) => (
          <span key={x.id} className="rounded-full" style={{ flex: x.kw / total, background: `repeating-linear-gradient(135deg, ${x.color} 0 5px, color-mix(in oklab, ${x.color} 55%, transparent) 5px 9px)` }} />
        ))}
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {into.map((x) => (
          <span key={x.id} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: x.color }} />
            {x.label} {mix[x.id as 'solar' | 'battery' | 'grid']}%
          </span>
        ))}
        {out.map((x) => (
          <span key={x.id} className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ background: x.color }} />
            {x.label} {fmtPower(x.kw)}
          </span>
        ))}
      </p>
    </div>
  );
}

function Facts({ home }: { home: EnergyHome }) {
  const { price, priceLevel, co2 } = home.grid;
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
      {home.sun ? (
        <span className="inline-flex items-center gap-1.5 text-muted">
          <HugeiconsIcon icon={home.sun.up ? SunsetIcon : SunriseIcon} size={15} style={{ color: COLOR.solar }} />
          {home.sun.up ? `Sets ${clock(home.sun.setting)}` : `Rises ${clock(home.sun.rising)}`}
        </span>
      ) : null}
      {price !== null ? (
        <span className="inline-flex items-center gap-1.5 text-muted">
          <span className="size-2 rounded-full" style={{ background: priceLevel ? PRICE_COLOR[priceLevel] : 'var(--muted)' }} />
          {fmtPrice(price, home.currency)}
          {priceLevel === 'low' ? ' · cheap' : priceLevel === 'high' ? ' · expensive' : ''}
        </span>
      ) : null}
      {co2 !== null ? (
        <span className="inline-flex items-center gap-1.5 text-muted">
          <HugeiconsIcon icon={Leaf01Icon} size={15} style={{ color: COLOR.clean }} />
          {co2} g CO₂/kWh
        </span>
      ) : null}
      {home.forecast && home.forecast.remaining >= 0.1 ? <span className="text-muted">{home.forecast.remaining.toFixed(1)} kWh more sun expected</span> : null}
    </p>
  );
}

export function AmbientHero({ home, width }: DesignProps) {
  const v = energyVerdict(home);
  const phone = width < 500;
  const tone = SOURCE_COLOR[v.source];
  return (
    <section aria-label="Right now" className="relative isolate flex flex-col gap-4 overflow-hidden rounded-[28px] p-4 sm:p-6" style={{ background: heroBackground(tone) }}>
      <div className={cn('flex items-center', phone ? 'gap-3' : 'gap-4')}>
        <span className="grid shrink-0 place-items-center text-white shadow-[0_10px_30px_-10px_currentColor]" style={{ width: phone ? 44 : 52, height: phone ? 44 : 52, borderRadius: phone ? 15 : 18, background: tone, color: tone }}>
          <HugeiconsIcon icon={SOURCE_ICON[v.source]} size={phone ? 21 : 25} className="text-white" />
        </span>
        <div className="min-w-0">
          <h2 className={cn('font-light tracking-tight', phone ? 'text-[22px] leading-7' : 'text-[30px] leading-9')}>{v.title}</h2>
          <p className={cn('mt-0.5 text-muted', phone ? 'text-[13px]' : 'text-sm')}>{v.detail}</p>
        </div>
      </div>
      <PowerRiver home={home} />
      <Facts home={home} />
    </section>
  );
}

export default function DesignB({ home, width }: DesignProps) {
  const [period, setPeriod] = useState<Period>('day');
  const blocks = BLOCKS.filter((b) => b.has(home));
  const [tab, setTab] = useState<string>(blocks[0].id);
  const wide = width >= 900;
  return (
    <div className="flex flex-col gap-6">
      <AmbientHero home={home} width={width} />

      <section aria-label="Usage" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-baseline gap-2.5">
            <HugeiconsIcon icon={ChartLineData01Icon} size={17} className="translate-y-0.5 text-muted" />
            <h3 className="text-lg font-light">Usage</h3>
          </div>
          <PeriodPicker value={period} onChange={setPeriod} />
        </div>
        <UsageChart home={home} period={period} height={wide ? 260 : 190} />
        <PeriodTotals home={home} period={period} width={width} className="px-1" />
      </section>

      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))}>
        <Tabs.ListContainer className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none]">
          <Tabs.List aria-label="Energy sections" className="w-max">
            {blocks.map((b) => (
              <Tabs.Tab key={b.id} id={b.id} className="whitespace-nowrap px-3">
                {b.title}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
        {blocks.map(({ id, Block }) => (
          <Tabs.Panel key={id} id={id} className="px-0 pt-4">
            <div className={cn(wide && 'max-w-[720px]')}>
              <Block home={home} />
            </div>
          </Tabs.Panel>
        ))}
      </Tabs>
    </div>
  );
}
