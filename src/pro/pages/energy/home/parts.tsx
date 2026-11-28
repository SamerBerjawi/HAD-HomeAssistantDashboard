/**
 * Energy Studio (restart, docs/pro-ui/ENERGY.md §0): the blocks every round-1 direction shares.
 * Each direction arranges them differently; the blocks themselves stay one family. Charts are the
 * repo's bklit charts (`src/pro/ui/bklit/`), colours are Home Assistant's energy colours.
 */
import { createContext, useContext, useState, type ComponentType, type ReactNode } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  Analytics01Icon,
  BatteryCharging01Icon,
  ComputerIcon,
  CookingPotIcon,
  DropletIcon,
  ElectricTower01Icon,
  EvChargingIcon,
  Fire02Icon,
  Home01Icon,
  Leaf01Icon,
  Plug01Icon,
  SolarPanel01Icon,
  SunriseIcon,
  SunsetIcon,
  ThermometerIcon,
  CoinsIcon,
  Tv01Icon,
  WashingMachineIcon
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { AreaChart } from '../../../ui/bklit/AreaChart';
import { BarChart } from '../../../ui/bklit/BarChart';
import { PowerSourcesAreaChart, type PowerSourcesDatum } from '../../../ui/bklit/PowerSourcesAreaChart';
import { SolarForecastBarChart } from '../../../ui/bklit/SolarForecastBarChart';
import {
  batteryHoursLeft,
  bestHours,
  clock,
  fmtKwh,
  fmtMoney,
  fmtPower,
  fmtPrice,
  PERIODS,
  rankedDevices,
  type DeviceKind,
  type EnergyHome,
  type Period,
  type PriceLevel,
  type Source
} from '../../../lib/energyHome';

export interface DesignProps {
  home: EnergyHome;
  width: number;
}

/** Home Assistant's energy colours (as in PowerSourcesAreaChart), plus gas and water. */
export const COLOR = { solar: '#ff9800', grid: '#488fc2', export: '#8353d1', battery: '#4db6ac', gas: '#e0703a', water: '#2f9bd6', clean: '#3aa66a' } as const;
export const SOURCE_COLOR: Record<Source, string> = { solar: COLOR.solar, battery: COLOR.battery, grid: COLOR.grid, export: COLOR.export };
export const SOURCE_ICON: Record<Source | 'home', IconSvgElement> = { solar: SolarPanel01Icon, battery: BatteryCharging01Icon, grid: ElectricTower01Icon, export: ElectricTower01Icon, home: Home01Icon };
export const DEVICE_ICON: Record<DeviceKind, IconSvgElement> = { ev: EvChargingIcon, heat: ThermometerIcon, water: DropletIcon, kitchen: CookingPotIcon, laundry: WashingMachineIcon, media: Tv01Icon, office: ComputerIcon, other: Plug01Icon };
export const PRICE_COLOR: Record<PriceLevel, string> = { low: COLOR.clean, normal: 'var(--muted)', high: '#e0533a' };

const hourLabel = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit' });
const minuteLabel = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** A number with its label: the one stat shape on the page. */
export function Stat({ label, value, sub, color, big, small }: { label: string; value: string; sub?: string; color?: string; big?: boolean; small?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-muted">{label}</p>
      <p className={cn('truncate font-light tabular-nums tracking-tight', big ? 'text-3xl' : small ? 'text-[17px] leading-6' : 'text-[17px] leading-6 @[340px]:text-xl')} style={{ color }}>
        {value}
      </p>
      {sub ? <p className="truncate text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

/** A section card: icon, title, an optional note, the content. */
export function Block({ icon, title, note, color, children, className, bare }: { icon: IconSvgElement; title: string; note?: ReactNode; color?: string; children: ReactNode; className?: string; bare?: boolean }) {
  return (
    <section aria-label={title} className={cn('@container flex min-w-0 flex-col gap-4', !bare && 'pro-surface rounded-[26px] p-5', className)}>
      <header className="flex items-baseline gap-2">
        <HugeiconsIcon icon={icon} size={17} className="shrink-0 translate-y-0.5" style={{ color: color ?? 'var(--muted)' }} />
        <h3 className="text-lg font-light">{title}</h3>
        {note ? <span className="ml-auto truncate text-sm text-muted">{note}</span> : null}
      </header>
      {children}
    </section>
  );
}

export function PeriodPicker<P extends Period>({ value, onChange, className, periods }: { value: P; onChange: (p: P) => void; className?: string; periods?: readonly P[] }) {
  return (
    <ToggleButtonGroup aria-label="Period" size="sm" selectionMode="single" disallowEmptySelection className={className} selectedKeys={new Set([value])} onSelectionChange={(k) => onChange([...k][0] as P)}>
      {PERIODS.filter((p) => !periods || periods.includes(p.id as P)).map((p) => (
        <ToggleButton key={p.id} id={p.id} className="px-3">
          {p.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

/** Today for the power chart: 5-minute steps once they load (as HA draws it), else hourly. */
export const dayData = (home: EnergyHome): PowerSourcesDatum[] =>
  home.power?.length
    ? home.power.map((p) => ({ label: minuteLabel(p.at), t: p.at, future: p.future, solar: p.solar, batteryDischarge: p.batteryOut, gridImport: p.gridIn, batteryCharge: p.batteryIn, gridExport: p.gridOut, home: p.home }))
    : home.today.map((h) => ({ label: hourLabel(h.at), t: h.at, future: h.future, solar: h.solar, batteryDischarge: h.batteryOut, gridImport: h.gridIn, batteryCharge: h.batteryIn, gridExport: h.gridOut, home: h.home }));

/** Today as Home Assistant's "Power sources" graph; a week, month or year as used vs solar bars. */
export function UsageChart({ home, period, height = 200 }: { home: EnergyHome; period: Period; height?: number }) {
  if (period === 'day') return <PowerSourcesAreaChart data={dayData(home)} height={height} ariaLabel="Today's power by source" />;
  const slots = home.history[period];
  const solar = home.live.solar !== null;
  return (
    <BarChart
      data={slots.map((s) => ({ label: s.label, value: s.used, secondaryValue: solar ? s.solar : undefined, secondaryLabel: solar ? 'Solar' : undefined }))}
      height={height}
      accentColor={COLOR.grid}
      secondaryColor={COLOR.solar}
      formatValue={(v) => fmtKwh(v)}
      ariaLabel={`Energy used per ${period === 'year' ? 'month' : 'day'}`}
    />
  );
}

/** Used, solar, grid in / out, cost and self-sufficiency for a period. */
export function PeriodTotals({ home, period, width, cols, className }: { home: EnergyHome; period: Period; width: number; cols?: number; className?: string }) {
  const t = home.totals[period];
  const solar = home.live.solar !== null;
  const small = width < 500;
  return (
    <div className={cn('grid gap-y-3', small ? 'gap-x-3' : 'gap-x-6', className)} style={{ gridTemplateColumns: `repeat(${cols ?? (small ? 3 : 5)}, minmax(0, 1fr))` }}>
      <Stat small={small} label="Used" value={fmtKwh(t.used)} />
      {solar ? <Stat small={small} label="Solar" value={fmtKwh(t.solar)} color={COLOR.solar} /> : null}
      <Stat small={small} label="From grid" value={fmtKwh(t.gridIn)} color={COLOR.grid} sub={t.gridOut ? `${fmtKwh(t.gridOut)} sent back` : undefined} />
      <Stat small={small} label="Cost" value={fmtMoney(t.cost, home.currency)} sub={t.exportCredit ? `after ${fmtMoney(t.exportCredit, home.currency)} credit` : undefined} />
      {solar || home.battery ? <Stat small={small} label="Self-sufficient" value={`${t.selfSufficiency}%`} color={COLOR.clean} /> : null}
    </div>
  );
}

/** Sunrise and sunset (sun.sun), with the sun's place on its arc. */
export function SunLine({ home, className }: { home: EnergyHome; className?: string }) {
  if (!home.sun) return null;
  const { up, rising, setting } = home.sun;
  return (
    <p className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted', className)}>
      <span className="inline-flex items-center gap-1.5">
        <HugeiconsIcon icon={SunriseIcon} size={15} style={{ color: COLOR.solar }} />
        {clock(rising)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <HugeiconsIcon icon={SunsetIcon} size={15} style={{ color: COLOR.solar }} />
        {clock(setting)}
      </span>
      <span>{up ? `Sun ${home.sun.elevation}° up` : 'Sun down'}</span>
    </p>
  );
}

export function SolarBlock({ home, bare }: { home: EnergyHome; bare?: boolean }) {
  if (home.live.solar === null) return null;
  const f = home.forecast;
  const made = home.totals.day.solar;
  return (
    <Block icon={SolarPanel01Icon} title="Solar" color={COLOR.solar} note={`${fmtPower(home.live.solar)} now`} bare={bare}>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Made today" value={fmtKwh(made)} color={COLOR.solar} />
        {f ? f.remaining >= 0.1 ? <Stat label="Still expected" value={fmtKwh(f.remaining)} sub={`of ${fmtKwh(f.today)} forecast`} /> : <Stat label="Forecast was" value={fmtKwh(f.today)} sub={`${Math.round((made / Math.max(0.1, f.today)) * 100)}% made`} /> : null}
        {f && f.tomorrow !== null ? <Stat label="Tomorrow" value={fmtKwh(f.tomorrow)} /> : null}
      </div>
      <SolarForecastBarChart data={home.today.filter((h, i) => i >= 5 && i <= 21).map((h) => ({ label: hourLabel(h.at), solar: h.future ? 0 : h.solar, forecast: h.forecast }))} height={140} ariaLabel="Solar today against the forecast" />
      <SunLine home={home} />
    </Block>
  );
}

export function BatteryBlock({ home, bare }: { home: EnergyHome; bare?: boolean }) {
  if (!home.battery || home.live.soc === null || home.live.battery === null) return null;
  const b = home.live.battery;
  const left = batteryHoursLeft(home);
  const state = b > 0.03 ? `Charging ${fmtPower(b)}` : b < -0.03 ? `Powering the home, ${fmtPower(b)}` : 'Idle';
  return (
    <Block icon={BatteryCharging01Icon} title="Battery" color={COLOR.battery} note={state} bare={bare}>
      <div className="flex items-end gap-4">
        <p className="text-5xl font-light tabular-nums tracking-tight" style={{ color: COLOR.battery }}>
          {home.live.soc}%
        </p>
        <div className="mb-1.5 min-w-0 text-sm text-muted">
          <p>{fmtKwh((home.live.soc / 100) * home.battery.capacity)} of {fmtKwh(home.battery.capacity)}</p>
          {left !== null ? <p>About {left < 1 ? `${Math.round(left * 60)} min` : `${left.toFixed(1)} h`} left at this rate</p> : null}
        </div>
      </div>
      <div aria-hidden className="h-2 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_8%,transparent)]">
        <div className="h-full rounded-full" style={{ width: `${home.live.soc}%`, background: COLOR.battery }} />
      </div>
      <AreaChart data={home.today.filter((h) => !h.future && h.soc !== null).map((h) => ({ label: hourLabel(h.at), value: h.soc ?? 0 }))} height={110} accentColor={COLOR.battery} formatValue={(v) => `${Math.round(v)}%`} ariaLabel="Battery charge today" />
      <p className="text-sm text-muted">
        Charged {fmtKwh(home.totals.day.batteryIn)} · gave back {fmtKwh(home.totals.day.batteryOut)} today
      </p>
    </Block>
  );
}

/** Today's prices (or carbon) as 24 cells, the current hour marked. */
export function HourStrip({ home, kind, className }: { home: EnergyHome; kind: 'price' | 'co2'; className?: string }) {
  const vals = home.today.map((h) => h[kind]);
  if (vals.every((v) => v === null)) return null;
  const nums = vals.filter((v): v is number => v !== null);
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  const nowIdx = home.today.findIndex((h) => h.at <= home.now && h.at + 3600_000 > home.now);
  const good = COLOR.clean;
  const bad = kind === 'price' ? '#e0533a' : '#7a5a48';
  return (
    <div className={cn('flex h-3 gap-px', className)} role="img" aria-label={kind === 'price' ? 'Price by hour today' : 'Grid carbon by hour today'}>
      {vals.map((v, i) => {
        const t = v === null || hi === lo ? 0.5 : (v - lo) / (hi - lo);
        return <span key={i} className={cn('flex-1 first:rounded-l-full last:rounded-r-full', i === nowIdx && 'outline outline-2 outline-offset-1 outline-[var(--foreground)]')} style={{ background: `color-mix(in oklab, ${bad} ${Math.round(t * 100)}%, ${good})`, opacity: i < nowIdx ? 0.45 : 1 }} />;
      })}
    </div>
  );
}

export function GridBlock({ home, bare }: { home: EnergyHome; bare?: boolean }) {
  const { price, priceLevel, co2, fossil } = home.grid;
  const { cheapest, cleanest } = bestHours(home);
  const g = home.live.grid ?? 0;
  const t = home.totals.day;
  return (
    <Block icon={ElectricTower01Icon} title="Grid" color={g < 0 ? COLOR.export : COLOR.grid} note={g > 0.03 ? `Drawing ${fmtPower(g)}` : g < -0.03 ? `Sending ${fmtPower(g)}` : 'Balanced'} bare={bare}>
      {price !== null ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <Stat label="Price now" value={fmtPrice(price, home.currency)} color={priceLevel ? PRICE_COLOR[priceLevel] : undefined} />
            {cheapest ? <p className="text-right text-sm text-muted">Cheapest {cheapest.at <= home.now ? 'now' : `at ${clock(cheapest.at)}`}<br />{fmtPrice(cheapest.price ?? 0, home.currency)}</p> : null}
          </div>
          <HourStrip home={home} kind="price" />
        </div>
      ) : null}
      {co2 !== null ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <Stat label="Grid carbon now" value={`${co2} g/kWh`} sub={fossil !== null ? `${fossil}% fossil · Electricity Maps` : undefined} />
            {cleanest ? <p className="text-right text-sm text-muted">Cleanest {cleanest.at <= home.now ? 'now' : `at ${clock(cleanest.at)}`}<br />{cleanest.co2} g/kWh</p> : null}
          </div>
          <HourStrip home={home} kind="co2" />
        </div>
      ) : null}
      <p className="text-sm text-muted">
        Today {fmtKwh(t.gridIn)} in{t.gridOut ? ` · ${fmtKwh(t.gridOut)} sent back` : ''}
      </p>
    </Block>
  );
}

export function DevicesBlock({ home, bare, limit = 6 }: { home: EnergyHome; bare?: boolean; limit?: number }) {
  if (!home.devices.length) return null;
  const { list, untracked } = rankedDevices(home);
  const max = Math.max(untracked, ...list.map((d) => d.today), 0.1);
  const running = list.filter((d) => d.power > 0.03);
  const rows = [...list.slice(0, limit).map((d) => ({ id: d.id, name: d.name, icon: DEVICE_ICON[d.kind], kwh: d.today, power: d.power })), { id: 'rest', name: 'Everything else', icon: Plug01Icon, kwh: untracked, power: 0 }];
  return (
    <Block icon={Plug01Icon} title="Devices" note={running.length ? `${running.length} running now` : 'Nothing big running'} bare={bare}>
      <ul className="flex flex-col gap-3">
        {rows.map((d) => (
          <li key={d.id} className="flex items-center gap-3">
            <HugeiconsIcon icon={d.icon} size={17} className="shrink-0 text-muted" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate">{d.name}</span>
                <span className="shrink-0 tabular-nums text-muted">
                  {d.power > 0.03 ? <span className="mr-2 font-medium text-[var(--accent)]">{fmtPower(d.power)}</span> : null}
                  {fmtKwh(d.kwh)}
                </span>
              </div>
              <div aria-hidden className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]">
                <div className="h-full rounded-full" style={{ width: `${(d.kwh / max) * 100}%`, background: d.id === 'rest' ? 'color-mix(in oklab, var(--foreground) 25%, transparent)' : 'var(--accent)' }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Block>
  );
}

export function CostBlock({ home, bare }: { home: EnergyHome; bare?: boolean }) {
  const d = home.totals.day;
  const m = home.totals.month;
  return (
    <Block icon={CoinsIcon} title="Costs" note="Today" bare={bare}>
      <div className="grid grid-cols-2 gap-4">
        <Stat label="Today" value={fmtMoney(d.cost, home.currency)} big />
        <Stat label="This month" value={fmtMoney(m.cost, home.currency)} sub={`${home.history.month.length} days`} />
        <Stat label="Grid" value={fmtMoney(d.cost + d.exportCredit, home.currency)} color={COLOR.grid} />
        {d.exportCredit ? <Stat label="Export credit" value={fmtMoney(-d.exportCredit, home.currency)} color={COLOR.export} /> : null}
      </div>
    </Block>
  );
}

export function MiniBars({ values, color, height = 40 }: { values: number[]; color: string; height?: number }) {
  const max = Math.max(...values, 0.01);
  return (
    <div aria-hidden className="flex items-end gap-1" style={{ height }}>
      {values.map((v, i) => (
        <span key={i} className="flex-1 rounded-sm" style={{ height: `${Math.max(8, (v / max) * 100)}%`, background: color, opacity: i === values.length - 1 ? 1 : 0.45 }} />
      ))}
    </div>
  );
}

export function UtilitiesBlock({ home, bare }: { home: EnergyHome; bare?: boolean }) {
  const list = [home.gas, home.water].filter((u) => u !== null);
  if (!list.length) return null;
  return (
    <Block icon={Fire02Icon} title={list.length === 2 ? 'Gas & water' : list[0].kind === 'gas' ? 'Gas' : 'Water'} note="Today · last 7 days" bare={bare}>
      <div className={cn('grid gap-5', list.length === 2 && 'grid-cols-2')}>
        {list.map((u) => (
          <div key={u.kind} className="flex min-w-0 flex-col gap-2">
            <Stat label={u.kind === 'gas' ? 'Gas' : 'Water'} value={`${u.today} ${u.unit}`} sub={fmtMoney(u.cost, home.currency)} color={u.kind === 'gas' ? COLOR.gas : COLOR.water} />
            <MiniBars values={u.week} color={u.kind === 'gas' ? COLOR.gas : COLOR.water} />
          </div>
        ))}
      </div>
    </Block>
  );
}

export function ImpactBlock({ home, bare }: { home: EnergyHome; bare?: boolean }) {
  if (!home.impact) return null;
  const i = home.impact;
  return (
    <Block icon={Leaf01Icon} title="Lifetime impact" color={COLOR.clean} bare={bare}>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Made" value={fmtKwh(i.lifetimeKwh)} color={COLOR.solar} />
        <Stat label="CO₂ avoided" value={`${(i.co2AvoidedKg / 1000).toFixed(1)} t`} color={COLOR.clean} />
        <Stat label="Like planting" value={`${i.trees}`} sub="trees" />
      </div>
    </Block>
  );
}

/** Each block by id, so the directions can arrange them. */
export const BLOCKS = [
  { id: 'solar', title: 'Solar', Block: SolarBlock, has: (h: EnergyHome) => h.live.solar !== null },
  { id: 'battery', title: 'Battery', Block: BatteryBlock, has: (h: EnergyHome) => h.battery !== null },
  { id: 'grid', title: 'Grid', Block: GridBlock, has: () => true },
  { id: 'devices', title: 'Devices', Block: DevicesBlock, has: (h: EnergyHome) => h.devices.length > 0 },
  { id: 'costs', title: 'Costs', Block: CostBlock, has: () => true },
  { id: 'utilities', title: 'Gas & water', Block: UtilitiesBlock, has: (h: EnergyHome) => h.gas !== null || h.water !== null },
  { id: 'impact', title: 'Impact', Block: ImpactBlock, has: (h: EnergyHome) => h.impact !== null }
] as const;

/** Week, month and year as used vs solar bars, with their totals. */
export function History({ home, width }: DesignProps) {
  const [period, setPeriod] = useState<Exclude<Period, 'day'>>('week');
  return (
    <section aria-label="History" className="pro-surface flex flex-col gap-4 rounded-[26px] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <HugeiconsIcon icon={Analytics01Icon} size={17} className="translate-y-0.5 text-muted" />
          <h3 className="text-lg font-light">History</h3>
        </div>
        <PeriodPicker value={period} onChange={setPeriod} periods={['week', 'month', 'year'] as const} />
      </div>
      <UsageChart home={home} period={period} height={width >= 900 ? 200 : 160} />
      <PeriodTotals home={home} period={period} width={width} />
    </section>
  );
}


export type BlockComponent = ComponentType<{ home: EnergyHome; bare?: boolean }>;
/** Lets the studio swap how a card's content is drawn (round 5) without touching the layouts. */
export const BlockSkin = createContext<Partial<Record<string, BlockComponent>>>({});

/** A card as the layouts place it: the skin's version when one is set, else the block itself. */
export function SkinnedBlock({ id, Block, home }: { id: string; Block: BlockComponent; home: EnergyHome }) {
  const Skin = useContext(BlockSkin)[id] ?? Block;
  return <Skin home={home} />;
}
