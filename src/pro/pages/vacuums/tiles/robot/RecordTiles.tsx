/**
 * Vacuum tiles · batch 3 · History and Lifetime (docs/pro-ui/VACUUM_TILES.md).
 * History (recent runs from the integration's cleaning history):
 *   A · Calendar: the last weeks as day squares, a run filled teal by its area, an interrupted one amber.
 *   B · Bars: a bar per run, newest right, the last run big.
 *   C · Log: the runs as rows (day, time, area, minutes, done or stopped).
 * Lifetime (totals since the first clean):
 *   A · Odometer: the total area in rolling digit wheels, like a car's odometer.
 *   B · Homes: "your home, 75 times": the total over a usual whole-home run, as little houses.
 *   C · Numbers: area, time, runs and since, plainly.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Calendar03Icon, CheckmarkCircle02Icon, Home01Icon, RulerIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { minutesText, type Cleaner } from '../../../../lib/vacuums/cleaner';
import { Big, CH, clockText, dayText, IconChip, typicalRun, XsRow, type CleanerTileProps } from '../cleanerTileKit';

type Run = Cleaner['history'][number];
const DAY = 86_400_000;
const runText = (h: Run) => [h.areaM2 !== null ? `${h.areaM2} m²` : null, h.minutes !== null ? minutesText(h.minutes) : null].filter(Boolean).join(' · ');
const runHue = (h: Run) => (h.done ? CH.on : CH.watch);

/** How many runs in the last 7 days, and the last run, for the words every concept leads with. */
function recent(c: Cleaner, now: number) {
  const week = c.history.filter((h) => now - h.at < 7 * DAY);
  const last = c.history[0] ?? null;
  return { week, last, word: week.length ? `${week.length} run${week.length === 1 ? '' : 's'} this week` : last ? 'None this week' : 'No runs yet', detail: last ? `Last: ${dayText(last.at, now)} · ${runText(last)}` : 'No history reported' };
}

function Empty({ size, label, icon, text }: { size: CleanerTileProps['size']; label: string; icon: typeof Home01Icon; text: string }) {
  if (size === 'xs') return <XsRow label={label} visual={<IconChip icon={icon} px={36} />} word={label} detail={text} />;
  return (
    <TileFrame label={label} className="pro-surface">
      <div className="flex h-full flex-col p-4">
        <IconChip icon={icon} px={36} />
        <p className="mt-auto text-[15px] font-semibold">{label}</p>
        <TileState>{text}</TileState>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// History · A · Calendar
// ---------------------------------------------------------------------------------------------

function Days({ c, now, weeks, cell }: { c: Cleaner; now: number; weeks: number; cell: number }) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  // Columns are weeks ending this week; rows Monday to Sunday.
  const dow = (today.getDay() + 6) % 7;
  const start = today.getTime() - (weeks * 7 - 7 + dow) * DAY;
  const top = Math.max(1, ...c.history.map((h) => h.areaM2 ?? 0));
  return (
    <div className="grid w-max shrink-0 grid-flow-col gap-1" style={{ gridTemplateRows: `repeat(7, ${cell}px)` }} role="img" aria-label={`${c.history.length} runs in the last ${weeks} weeks`}>
      {Array.from({ length: weeks * 7 }, (_, i) => {
        const day = start + i * DAY;
        const runs = c.history.filter((h) => h.at >= day && h.at < day + DAY);
        const area = runs.reduce((s, h) => s + (h.areaM2 ?? 0), 0);
        const stopped = runs.length > 0 && runs.every((h) => !h.done);
        const future = day > today.getTime();
        const hue = stopped ? CH.watch : CH.on;
        return (
          <span
            key={day}
            className={cn('rounded-[4px]', future && 'opacity-0', day === today.getTime() && 'ring-1 ring-current ring-offset-1 ring-offset-transparent')}
            style={{ width: cell, height: cell, background: runs.length ? `color-mix(in srgb, ${hue} ${35 + Math.round((area / top) * 65)}%, transparent)` : 'color-mix(in srgb, currentColor 7%, transparent)' }}
          />
        );
      })}
    </div>
  );
}

export function HistoryCalendar({ c, size, now }: CleanerTileProps) {
  if (!c.history.length) return <Empty size={size} label="History" icon={Calendar03Icon} text="The robot keeps no history here" />;
  const r = recent(c, now);
  if (size === 'xs') return <XsRow label="History" visual={<Days c={c} now={now} weeks={2} cell={6} />} word={r.word} detail={r.detail} />;
  if (size === 's')
    return (
      <TileFrame label="History" className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <Days c={c} now={now} weeks={4} cell={9} />
          <p className="mt-auto truncate text-[15px] font-semibold">{r.word}</p>
          <TileState className="text-[12px]">{r.last ? `${dayText(r.last.at, now)} · ${runText(r.last)}` : ''}</TileState>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label="History" className="pro-surface">
        <div className="flex h-full items-center gap-4 p-4">
          <Days c={c} now={now} weeks={6} cell={13} />
          <div className="min-w-0 flex-1">
            <TileName>{r.word}</TileName>
            <TileState className="text-[12px]">{r.detail}</TileState>
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="History" className="pro-surface">
      <div className="flex h-full flex-col p-5">
        <TileName className="text-[17px]">{r.word}</TileName>
        <TileState className="text-[12px]">{r.detail}</TileState>
        <div className="my-auto flex justify-center pt-2">
          <Days c={c} now={now} weeks={8} cell={20} />
        </div>
        <div className="flex gap-3 text-[11px] opacity-70">
          <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-[3px]" style={{ background: CH.on }} />Cleaned</span>
          <span className="inline-flex items-center gap-1"><span className="size-2.5 rounded-[3px]" style={{ background: CH.watch }} />Stopped early</span>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// History · B · Bars
// ---------------------------------------------------------------------------------------------

function RunBars({ c, max, h, gap = 4 }: { c: Cleaner; max: number; h: number; gap?: number }) {
  const runs = c.history.slice(0, max).reverse();
  const top = Math.max(1, ...runs.map((x) => x.areaM2 ?? 0));
  return (
    <div className="flex w-full items-end" style={{ height: h, gap }} role="img" aria-label={`Last ${runs.length} runs`}>
      {runs.map((x, i) => (
        <span key={x.at} className="min-w-0 flex-1 rounded-t-[5px] rounded-b-[2px] transition-[height] duration-500" style={{ height: `${Math.max(6, ((x.areaM2 ?? 0) / top) * 100)}%`, background: runHue(x), opacity: i === runs.length - 1 ? 1 : 0.55 }} />
      ))}
    </div>
  );
}

export function HistoryBars({ c, size, now }: CleanerTileProps) {
  if (!c.history.length) return <Empty size={size} label="History" icon={Calendar03Icon} text="The robot keeps no history here" />;
  const r = recent(c, now);
  const last = r.last!;
  if (size === 'xs')
    return <XsRow label="History" visual={<span className="w-10"><RunBars c={c} max={5} h={28} gap={2} /></span>} word={r.word} detail={r.detail} />;
  if (size === 's')
    return (
      <TileFrame label="History" className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <RunBars c={c} max={7} h={48} />
          <Big n={last.areaM2 ?? '—'} unit="m²" className="mt-auto text-[26px]" />
          <TileState className="text-[12px]">{dayText(last.at, now)} · {minutesText(last.minutes)}</TileState>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label="History" className="pro-surface">
        <div className="flex h-full gap-4 p-4">
          <div className="flex min-w-0 flex-col">
            <TileState className="text-[12px]">Last run · {dayText(last.at, now)}</TileState>
            <Big n={last.areaM2 ?? '—'} unit="m²" className="mt-1 text-[32px]" />
            <TileState className="mt-auto text-[12px]">{r.word}</TileState>
          </div>
          <div className="flex min-w-0 flex-1 items-end">
            <RunBars c={c} max={10} h={96} />
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="History" className="pro-surface">
      <div className="flex h-full flex-col p-5">
        <TileState className="text-[12px]">Last run · {dayText(last.at, now)} {clockText(last.at)}</TileState>
        <Big n={last.areaM2 ?? '—'} unit="m²" className="mt-1 text-[40px]" />
        <TileState className="text-[13px]">{minutesText(last.minutes)}{last.done ? '' : ' · stopped early'}</TileState>
        <div className="mt-auto">
          <RunBars c={c} max={14} h={110} />
          <div className="mt-2 flex justify-between text-[11px] opacity-60">
            <span>{dayText(c.history[Math.min(13, c.history.length - 1)].at, now)}</span>
            <span>{r.word}</span>
          </div>
        </div>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// History · C · Log
// ---------------------------------------------------------------------------------------------

function LogRow({ h, now }: { h: Run; now: number }) {
  return (
    <li className="flex min-w-0 items-center gap-2 text-[12px]">
      <HugeiconsIcon icon={h.done ? CheckmarkCircle02Icon : Alert02Icon} size={14} style={{ color: runHue(h) }} className="shrink-0" />
      <span className="w-[42%] shrink-0 truncate font-medium">{dayText(h.at, now)} · {clockText(h.at)}</span>
      <span className="min-w-0 flex-1 truncate text-right tabular-nums opacity-70">{runText(h)}</span>
    </li>
  );
}

export function HistoryLog({ c, size, now }: CleanerTileProps) {
  if (!c.history.length) return <Empty size={size} label="History" icon={Calendar03Icon} text="The robot keeps no history here" />;
  const r = recent(c, now);
  if (size === 'xs') return <XsRow label="History" visual={<IconChip icon={Calendar03Icon} hue={CH.on} px={36} />} word={r.word} detail={r.detail} />;
  const max = size === 'l' ? 8 : size === 'w' ? 3 : 2;
  return (
    <TileFrame label="History" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-3.5')}>
        <TileName className={size === 'l' ? 'text-[17px]' : undefined}>{r.word}</TileName>
        <ul className="mt-auto flex flex-col gap-1.5">
          {c.history.slice(0, max).map((h) => (
            <LogRow key={h.at} h={h} now={now} />
          ))}
        </ul>
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// Lifetime
// ---------------------------------------------------------------------------------------------

const sinceText = (at: number | null) => (at ? new Date(at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : null);

function life(c: Cleaner) {
  const l = c.lifetime;
  const typical = typicalRun(c);
  const homes = l?.areaM2 && typical ? Math.round(l.areaM2 / typical) : null;
  const facts = [l?.count != null ? `${l.count} runs` : null, l?.minutes != null ? minutesText(l.minutes).replace(/ \d+ min$/, '') : null, sinceText(l?.since ?? null) ? `since ${sinceText(l!.since)}` : null].filter(Boolean) as string[];
  return { l, homes, typical, facts };
}

/** Digit wheels: each digit in its own drum, the last one turning while the robot cleans. */
function Odometer({ value, digitPx, rolling }: { value: number; digitPx: number; rolling: boolean }) {
  const digits = String(Math.round(value)).padStart(5, '0').split('');
  return (
    <span className="inline-flex items-center gap-[3px]" role="img" aria-label={`${Math.round(value)} square metres`}>
      {digits.map((d, i) => (
        <span
          key={i}
          className={cn('relative grid place-items-center overflow-hidden rounded-[6px] font-semibold tabular-nums shadow-[inset_0_2px_4px_rgba(0,0,0,0.18)]', i < digits.length - String(Math.round(value)).length ? 'opacity-35' : '')}
          style={{ width: digitPx * 0.72, height: digitPx * 1.2, fontSize: digitPx, background: 'linear-gradient(180deg, color-mix(in srgb, currentColor 14%, transparent), color-mix(in srgb, currentColor 4%, transparent) 50%, color-mix(in srgb, currentColor 14%, transparent))' }}
        >
          <span className={cn(rolling && i === digits.length - 1 && 'motion-safe:animate-pulse')}>{d}</span>
        </span>
      ))}
      <span className="ml-1 font-medium opacity-60" style={{ fontSize: digitPx * 0.5 }}>
        m²
      </span>
    </span>
  );
}

export function LifetimeOdometer({ c, size }: CleanerTileProps) {
  const { l, facts } = life(c);
  if (!l?.areaM2) return <Empty size={size} label="Lifetime" icon={RulerIcon} text="The robot reports no totals" />;
  const rolling = c.activity === 'cleaning';
  if (size === 'xs') return <XsRow label="Lifetime" visual={<IconChip icon={RulerIcon} hue={CH.on} px={36} />} word={`${l.areaM2.toLocaleString()} m²`} detail={facts.join(' · ')} />;
  const px = size === 'l' ? 46 : size === 'w' ? 26 : 17;
  return (
    <TileFrame label="Lifetime" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4', size === 'l' && 'items-center text-center')}>
        <TileName className={size === 'l' ? 'self-start text-[17px]' : undefined}>Cleaned so far</TileName>
        <div className={cn('my-auto', size === 's' && 'pt-2')}>
          <Odometer value={l.areaM2} digitPx={px} rolling={rolling} />
        </div>
        <TileState className="text-[12px]">{facts.join(' · ')}</TileState>
      </div>
    </TileFrame>
  );
}

/** One little house per whole-home clean, up to `max`, then "+n". */
function Houses({ n, max, px }: { n: number; max: number; px: number }) {
  return (
    <div className="flex flex-wrap content-start gap-[3px]" role="img" aria-label={`${n} whole-home cleans`}>
      {Array.from({ length: Math.min(n, max) }, (_, i) => (
        <HugeiconsIcon key={i} icon={Home01Icon} size={px} style={{ color: CH.on, opacity: 0.45 + 0.55 * ((i + 1) / Math.min(n, max)) }} />
      ))}
      {n > max ? <span className="self-center text-[11px] font-semibold opacity-70">+{n - max}</span> : null}
    </div>
  );
}

export function LifetimeHomes({ c, size }: CleanerTileProps) {
  const { l, homes, typical, facts } = life(c);
  if (!l?.areaM2) return <Empty size={size} label="Lifetime" icon={RulerIcon} text="The robot reports no totals" />;
  const word = homes ? `Your home, ${homes}×` : `${l.areaM2.toLocaleString()} m²`;
  const detail = homes && typical ? `${l.areaM2.toLocaleString()} m² · a home is about ${Math.round(typical)} m²` : facts.join(' · ');
  if (size === 'xs') return <XsRow label="Lifetime" visual={<IconChip icon={Home01Icon} hue={CH.on} px={36} />} word={homes ? `${homes}× home` : word} detail={`${l.areaM2.toLocaleString()} m² so far`} />;
  if (size === 's')
    return (
      <TileFrame label="Lifetime" className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          {homes ? <Houses n={homes} max={18} px={14} /> : null}
          <p className="mt-auto truncate text-[15px] font-semibold">{word}</p>
          <TileState className="text-[12px]">{facts[0] ?? ''}</TileState>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label="Lifetime" className="pro-surface">
        <div className="flex h-full gap-4 p-4">
          <div className="flex w-[42%] shrink-0 flex-col">
            <TileName>{word}</TileName>
            <TileState className="mt-auto text-[12px]">{facts.join(' · ')}</TileState>
          </div>
          {homes ? <div className="min-w-0 flex-1 overflow-hidden"><Houses n={homes} max={36} px={16} /></div> : null}
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Lifetime" className="pro-surface">
      <div className="flex h-full flex-col p-5">
        <TileState className="text-[12px]">Cleaned so far</TileState>
        <p className="text-[24px] font-semibold leading-tight tracking-[-0.02em]">{word}</p>
        <TileState className="text-[12px]">{detail}</TileState>
        {homes ? <div className="my-3 min-h-0 flex-1 overflow-hidden"><Houses n={homes} max={84} px={18} /></div> : null}
        <TileState className="mt-auto text-[12px]">{facts.join(' · ')}</TileState>
      </div>
    </TileFrame>
  );
}

export function LifetimeNumbers({ c, size }: CleanerTileProps) {
  const { l } = life(c);
  if (!l?.areaM2) return <Empty size={size} label="Lifetime" icon={RulerIcon} text="The robot reports no totals" />;
  const stats = [
    { k: 'Area', v: `${l.areaM2.toLocaleString()} m²` },
    { k: 'Time', v: l.minutes != null ? minutesText(l.minutes).replace(/ \d+ min$/, '') : '—' },
    { k: 'Runs', v: l.count != null ? String(l.count) : '—' },
    { k: 'Since', v: sinceText(l.since) ?? '—' }
  ];
  if (size === 'xs') return <XsRow label="Lifetime" visual={<IconChip icon={RulerIcon} px={36} />} word={stats[0].v} detail={`${stats[2].v} runs · ${stats[1].v}`} />;
  const shown = size === 's' ? stats.slice(0, 2) : stats;
  return (
    <TileFrame label="Lifetime" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-3.5')}>
        <TileName className={size === 'l' ? 'text-[17px]' : undefined}>Lifetime</TileName>
        <dl className={cn('mt-auto grid gap-x-3 gap-y-2', size === 's' ? 'grid-cols-1' : size === 'w' ? 'grid-cols-4' : 'grid-cols-2')}>
          {shown.map((s) => (
            <div key={s.k} className="min-w-0">
              <dt className="text-[11px] opacity-60">{s.k}</dt>
              <dd className={cn('truncate font-semibold tabular-nums', size === 'l' ? 'text-[22px]' : 'text-[15px]')}>{s.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </TileFrame>
  );
}
