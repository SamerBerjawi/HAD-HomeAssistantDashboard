/**
 * Energy round 5: what goes inside the cards (docs/pro-ui/ENERGY.md §0). Each card's content is
 * described once (`cardSpec`: a headline number, a plain sentence, two or three numbers, a chart),
 * and three styles draw the same description, so the comparison is about style, not data.
 * History keeps its own form (period switch + bars) in every style.
 */
import type { ReactNode } from 'react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { BatteryCharging01Icon, CoinsIcon, Fire02Icon, Leaf01Icon, Plug01Icon, SolarPanel01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { AreaChart } from '../../../ui/bklit/AreaChart';
import { BarChart } from '../../../ui/bklit/BarChart';
import { SolarForecastBarChart } from '../../../ui/bklit/SolarForecastBarChart';
import { batteryHoursLeft, fmtKwh, fmtMoney, fmtPower, rankedDevices, type EnergyHome } from '../../../lib/energyHome';
import { COLOR, DEVICE_ICON, MiniBars, type BlockComponent } from './parts';

interface CardStat {
  label: string;
  value: string;
  color?: string;
}

export interface CardSpec {
  icon: IconSvgElement;
  color: string;
  title: string;
  /** Right of the title: what it is doing now. */
  note?: string;
  hero: { value: string; label: string; color?: string };
  /** The card in one or two plain sentences. */
  sentence: string;
  stats: CardStat[];
  /** The card's chart at a given height (null: none). */
  chart: ((height: number) => ReactNode) | null;
  /** The "chart" is a list (Devices): it follows the numbers instead of sitting at the card's foot. */
  list?: boolean;
}

const hour = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit' });
const dur = (h: number) => (h < 1 ? `${Math.round(h * 60)} min` : `${h.toFixed(1)} h`);

function DeviceBars({ home, height }: { home: EnergyHome; height: number }) {
  const { list, untracked } = rankedDevices(home);
  const n = Math.max(6, Math.floor(height / 30));
  const rows = [...list.slice(0, n - 1).map((d) => ({ id: d.id, name: d.name, icon: DEVICE_ICON[d.kind], kwh: d.today, power: d.power })), { id: 'rest', name: 'Everything else', icon: Plug01Icon, kwh: untracked, power: 0 }];
  const max = Math.max(...rows.map((r) => r.kwh), 0.1);
  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((d) => (
        <li key={d.id} className="flex items-center gap-2.5">
          <HugeiconsIcon icon={d.icon} size={15} className="shrink-0 text-muted" />
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
  );
}

export function cardSpec(home: EnergyHome, id: string): CardSpec | null {
  const d = home.totals.day;
  const cur = home.currency;
  if (id === 'solar' && home.live.solar !== null) {
    const f = home.forecast;
    const peak = Math.max(...home.today.filter((h) => !h.future).map((h) => h.solar), 0);
    const pct = f && f.today ? Math.round((d.solar / f.today) * 100) : null;
    return {
      icon: SolarPanel01Icon,
      color: COLOR.solar,
      title: 'Solar',
      note: `${fmtPower(home.live.solar)} now`,
      hero: { value: fmtKwh(d.solar), label: 'made today', color: COLOR.solar },
      sentence: [pct !== null ? `${fmtKwh(d.solar)} so far, ${pct}% of today’s forecast.` : `${fmtKwh(d.solar)} so far.`, f && f.remaining >= 0.1 ? `About ${fmtKwh(f.remaining)} more before sunset.` : f && f.tomorrow !== null ? `${fmtKwh(f.tomorrow)} expected tomorrow.` : ''].join(' ').trim(),
      stats: [
        ...(f ? [{ label: f.remaining >= 0.1 ? 'Still expected' : 'Forecast was', value: fmtKwh(f.remaining >= 0.1 ? f.remaining : f.today) }, ...(f.tomorrow !== null ? [{ label: 'Tomorrow', value: fmtKwh(f.tomorrow) }] : [])] : []),
        { label: 'Best hour', value: fmtKwh(peak) }
      ],
      chart: (h) => <SolarForecastBarChart data={home.today.filter((x, i) => i >= 5 && i <= 21).map((x) => ({ label: hour(x.at), solar: x.future ? 0 : x.solar, forecast: x.forecast }))} height={h} ariaLabel="Solar today against the forecast" />
    };
  }
  if (id === 'battery' && home.battery && home.live.soc !== null) {
    const b = home.live.battery ?? 0;
    const left = batteryHoursLeft(home);
    const full = b > 0.03 ? (((100 - home.live.soc) / 100) * home.battery.capacity) / b : null;
    return {
      icon: BatteryCharging01Icon,
      color: COLOR.battery,
      title: 'Battery',
      note: b > 0.03 ? `Charging ${fmtPower(b)}` : b < -0.03 ? `Giving ${fmtPower(b)}` : 'Idle',
      hero: { value: `${home.live.soc}%`, label: `${fmtKwh((home.live.soc / 100) * home.battery.capacity)} of ${fmtKwh(home.battery.capacity)}`, color: COLOR.battery },
      sentence: b > 0.03 ? `Charging at ${fmtPower(b)}, full in about ${dur(full ?? 0)}.` : left !== null ? `Powering the home at ${fmtPower(b)}, about ${dur(left)} left at this rate.` : `Idle at ${home.live.soc}%.`,
      stats: [
        { label: 'Charged today', value: fmtKwh(d.batteryIn) },
        { label: 'Gave back', value: fmtKwh(d.batteryOut) }
      ],
      chart: (h) => <AreaChart data={home.today.filter((x) => !x.future && x.soc !== null).map((x) => ({ label: hour(x.at), value: x.soc ?? 0 }))} height={h} accentColor={COLOR.battery} formatValue={(v) => `${Math.round(v)}%`} ariaLabel="Battery charge today" />
    };
  }
  if (id === 'devices' && home.devices.length) {
    const { list, untracked } = rankedDevices(home);
    const running = list.filter((x) => x.power > 0.03);
    const top = list[0];
    return {
      icon: Plug01Icon,
      color: 'var(--accent)',
      title: 'Devices',
      note: running.length ? `${running.length} running now` : 'Nothing big running',
      hero: { value: fmtKwh(top.today), label: `${top.name}, the most today` },
      sentence: `${running.length ? `${running.length} running now, ${fmtPower(running.reduce((a, x) => a + x.power, 0))} together. ` : ''}${top.name} used the most today.`,
      stats: [
        { label: 'Tracked', value: fmtKwh(list.reduce((a, x) => a + x.today, 0)) },
        { label: 'Everything else', value: fmtKwh(untracked) }
      ],
      chart: (h) => <DeviceBars home={home} height={h} />,
      list: true
    };
  }
  if (id === 'costs') {
    const hourly = home.today.filter((x) => !x.future).map((x) => ({ label: hour(x.at), value: Math.max(0, x.gridIn * (x.price ?? 0.21) - x.gridOut * 0.08) }));
    return {
      icon: CoinsIcon,
      color: 'var(--foreground)',
      title: 'Costs',
      note: 'Today',
      hero: { value: fmtMoney(d.cost, cur), label: d.exportCredit ? `after ${fmtMoney(d.exportCredit, cur)} export credit` : 'today' },
      sentence: `${fmtMoney(d.cost, cur)} today${d.exportCredit ? ` after ${fmtMoney(d.exportCredit, cur)} of export credit` : ''}. ${fmtMoney(home.totals.month.cost, cur)} so far this month.`,
      stats: [
        { label: 'Grid', value: fmtMoney(d.cost + d.exportCredit, cur), color: COLOR.grid },
        ...(d.exportCredit ? [{ label: 'Export credit', value: fmtMoney(-d.exportCredit, cur), color: COLOR.export }] : []),
        { label: 'This month', value: fmtMoney(home.totals.month.cost, cur) }
      ],
      chart: (h) => <BarChart data={hourly} height={h} accentColor={COLOR.grid} formatValue={(v) => fmtMoney(v, cur)} ariaLabel="Cost by hour today" />
    };
  }
  if (id === 'utilities' && (home.gas || home.water)) {
    const g = home.gas;
    const w = home.water;
    const main = g ?? w!;
    const avg = main.week.reduce((a, x) => a + x, 0) / main.week.length;
    const vs = main.today / avg;
    return {
      icon: Fire02Icon,
      color: g ? COLOR.gas : COLOR.water,
      title: g && w ? 'Gas & water' : g ? 'Gas' : 'Water',
      note: 'Today',
      hero: { value: `${main.today} ${main.unit}`, label: `${main.kind}, ${fmtMoney(main.cost, cur)}`, color: g ? COLOR.gas : COLOR.water },
      sentence: `${[g ? `${g.today} m³ of gas (${fmtMoney(g.cost, cur)})` : null, w ? `${w.today} m³ of water (${fmtMoney(w.cost, cur)})` : null].filter(Boolean).join(' and ')} today, ${vs < 0.9 ? 'less than' : vs > 1.1 ? 'more than' : 'about'} a usual day this week.`,
      stats: ([g && w ? { label: 'Water', value: `${w.today} m³`, color: COLOR.water } : null, { label: 'Week', value: `${main.week.reduce((a, x) => a + x, 0).toFixed(1)} m³ ${main.kind}` }, { label: 'Cost today', value: fmtMoney((g?.cost ?? 0) + (w?.cost ?? 0), cur) }] as (CardStat | null)[]).filter((x): x is CardStat => x !== null),
      chart: (h) => (
        <div className={cn('grid gap-4', g && w && 'grid-cols-2')}>
          {[g, w].filter((u) => u !== null).map((u) => (
            <div key={u.kind} className="flex flex-col gap-1">
              <MiniBars values={u.week} color={u.kind === 'gas' ? COLOR.gas : COLOR.water} height={Math.max(32, h - 18)} />
              <span className="text-[11px] text-muted">{u.kind === 'gas' ? 'Gas' : 'Water'}, last 7 days</span>
            </div>
          ))}
        </div>
      )
    };
  }
  if (id === 'impact' && home.impact) {
    const i = home.impact;
    return {
      icon: Leaf01Icon,
      color: COLOR.clean,
      title: 'Lifetime impact',
      hero: { value: `${(i.co2AvoidedKg / 1000).toFixed(1)} t`, label: 'CO₂ avoided', color: COLOR.clean },
      sentence: `Since the panels went up they made ${fmtKwh(i.lifetimeKwh)}, avoiding ${(i.co2AvoidedKg / 1000).toFixed(1)} t of CO₂: like planting ${i.trees} trees.`,
      stats: [
        { label: 'Made', value: fmtKwh(i.lifetimeKwh), color: COLOR.solar },
        { label: 'Like planting', value: `${i.trees} trees` }
      ],
      chart: null
    };
  }
  return null;
}

function Head({ s }: { s: CardSpec }) {
  return (
    <header className="flex items-baseline gap-2">
      <HugeiconsIcon icon={s.icon} size={17} className="shrink-0 translate-y-0.5" style={{ color: s.color }} />
      <h3 className="text-lg font-light">{s.title}</h3>
      {s.note ? <span className="ml-auto truncate text-sm text-muted">{s.note}</span> : null}
    </header>
  );
}

const Card = ({ title, children }: { title: string; children: ReactNode }) => (
  <section aria-label={title} className="@container pro-surface flex min-w-0 flex-col gap-4 rounded-[26px] p-5">
    {children}
  </section>
);

/** A · Headline: one big number and its label, two or three small numbers, a short chart at the bottom. */
function HeadlineCard({ s }: { s: CardSpec }) {
  return (
    <Card title={s.title}>
      <Head s={s} />
      <div>
        <p className="text-[34px] font-light leading-10 tracking-tight tabular-nums" style={{ color: s.hero.color }}>
          {s.hero.value}
        </p>
        <p className="truncate text-sm text-muted">{s.hero.label}</p>
      </div>
      {s.stats.length ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${s.stats.length}, minmax(0, 1fr))` }}>
          {s.stats.map((x) => (
            <div key={x.label} className="min-w-0">
              <p className="truncate text-xs text-muted">{x.label}</p>
              <p className="truncate text-[15px] tabular-nums" style={{ color: x.color }}>
                {x.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {s.chart ? <div className={cn(!s.list && 'mt-auto')}>{s.chart(96)}</div> : null}
    </Card>
  );
}

/** B · Chart first: the chart leads, tall; the numbers follow as one quiet row, the headline first. */
function ChartCard({ s }: { s: CardSpec }) {
  const row = [{ label: s.hero.label, value: s.hero.value, color: s.hero.color }, ...s.stats];
  return (
    <Card title={s.title}>
      <Head s={s} />
      {s.chart ? s.chart(160) : <p className="text-[34px] font-light leading-10 tracking-tight tabular-nums" style={{ color: s.hero.color }}>{s.hero.value}</p>}
      <div className="mt-auto flex flex-wrap gap-x-5 gap-y-2 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] pt-3">
        {(s.chart ? row : s.stats).map((x) => (
          <div key={x.label} className="min-w-0">
            <p className="text-[15px] tabular-nums" style={{ color: x.color }}>
              {x.value}
            </p>
            <p className="max-w-40 truncate text-xs text-muted">{x.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** C · Sentence: the card says what matters in words, then a small chart, then the numbers as hairline rows. */
function SentenceCard({ s }: { s: CardSpec }) {
  return (
    <Card title={s.title}>
      <Head s={s} />
      <p className="text-[19px] font-light leading-7">{s.sentence}</p>
      {s.chart ? s.chart(84) : null}
      <dl className="mt-auto flex flex-col">
        {s.stats.map((x) => (
          <div key={x.label} className="flex items-baseline justify-between gap-3 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] py-2 text-sm">
            <dt className="text-muted">{x.label}</dt>
            <dd className="tabular-nums" style={{ color: x.color }}>
              {x.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

const IDS = ['solar', 'battery', 'devices', 'costs', 'utilities', 'impact'] as const;

function skin(Draw: ComponentTypeOf): Partial<Record<string, BlockComponent>> {
  return Object.fromEntries(
    IDS.map((id) => [
      id,
      function Skinned({ home }: { home: EnergyHome }) {
        const s = cardSpec(home, id);
        return s ? <Draw s={s} /> : null;
      }
    ])
  );
}
type ComponentTypeOf = (p: { s: CardSpec }) => ReactNode;

export const SKIN_HEADLINE = skin(HeadlineCard);
export const SKIN_CHART = skin(ChartCard);
export const SKIN_SENTENCE = skin(SentenceCard);
