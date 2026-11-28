/**
 * Vacuum tiles · batch 1 · Care (docs/pro-ui/VACUUM_TILES.md): the wearing parts (brushes, filter,
 * sensors, wheel, mop pad) and when each is due.
 * A · Rings: the parts as nested rings, the soonest outside (an activity-ring stack); the lowest
 *     named in the middle.
 * B · Wear: a bar per part, soonest first, with the hours left (the Dreame and Roborock
 *     maintenance lists, glanceable).
 * C · Next up: only the next part due, big, with a countdown and Reset after replacing it; the
 *     rest as a quiet line.
 * Due at 10% or less (red), soon at 25% or less (amber), else green.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { BrushCleaningIcon, CheckmarkCircle02Icon, FilterIcon, RefreshIcon, Wrench01Icon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { hoursText, partsBySoonest, wearTone, type WearPart } from '../../../../lib/vacuums/cleaner';
import { Big, CH, ChoreButton, IconChip, wash, XsRow, type CleanerTileProps } from '../cleanerTileKit';

const hueOf = (p: WearPart) => {
  const t = wearTone(p);
  return t === 'due' ? CH.bad : t === 'soon' ? CH.watch : t === 'ok' ? CH.ok : CH.idle;
};
const iconOf = (p: WearPart): IconSvgElement => (p.id === 'filter' ? FilterIcon : p.id === 'main' || p.id === 'side' ? BrushCleaningIcon : Wrench01Icon);
const leftText = (p: WearPart) => (p.percent === 0 ? 'Replace now' : p.hoursLeft !== null ? `${hoursText(p.hoursLeft)} left` : p.percent !== null ? `${p.percent}% left` : '—');

function verdict(c: CleanerTileProps['c']) {
  const parts = partsBySoonest(c);
  const due = parts.filter((p) => wearTone(p) === 'due');
  const soon = parts.filter((p) => wearTone(p) === 'soon');
  if (!parts.length) return { word: 'No parts reported', detail: '', hue: CH.idle, parts };
  if (due.length) return { word: due.length === 1 ? `${due[0].name} due` : `${due.length} parts due`, detail: due.length === 1 ? leftText(due[0]) : due.map((p) => p.name).join(' · '), hue: CH.bad, parts };
  if (soon.length) return { word: soon.length === 1 ? `${soon[0].name} soon` : `${soon.length} parts soon`, detail: soon.length === 1 ? leftText(soon[0]) : soon.map((p) => p.name).join(' · '), hue: CH.watch, parts };
  return { word: 'All parts good', detail: `Next: ${parts[0].name.toLowerCase()} · ${leftText(parts[0])}`, hue: CH.ok, parts };
}

function ResetButton({ c, p, act }: { c: CleanerTileProps['c']; p: WearPart; act: CleanerTileProps['act'] }) {
  if (!p.canReset || !c.actions.includes('reset') || wearTone(p) === 'ok') return null;
  return <ChoreButton icon={RefreshIcon} label="Replaced, reset" hue={hueOf(p)} onPress={() => act({ type: 'reset', part: p.id })} />;
}

// ---------------------------------------------------------------------------------------------
// A · Rings
// ---------------------------------------------------------------------------------------------

function Rings({ parts, px, max }: { parts: WearPart[]; px: number; max: number }) {
  const shown = parts.slice(0, max);
  const stroke = Math.max(4, Math.round(px / (shown.length * 2 + 3)));
  const gap = Math.max(2, Math.round(stroke * 0.35));
  return (
    <svg aria-hidden width={px} height={px} className="shrink-0 -rotate-90">
      {shown.map((p, i) => {
        const r = px / 2 - stroke / 2 - i * (stroke + gap);
        if (r <= stroke) return null;
        const len = 2 * Math.PI * r;
        const share = Math.max(0.02, (p.percent ?? 0) / 100);
        const hue = hueOf(p);
        return (
          <g key={p.id}>
            <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke={hue} strokeOpacity={0.14} strokeWidth={stroke} />
            <circle cx={px / 2} cy={px / 2} r={r} fill="none" stroke={hue} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${len * share} ${len}`} style={{ transition: 'stroke-dasharray 500ms ease' }} />
          </g>
        );
      })}
    </svg>
  );
}

export function CareRings({ c, size, act }: CleanerTileProps) {
  const v = verdict(c);
  const first = v.parts[0];
  if (size === 'xs') return <XsRow label="Care" visual={<Rings parts={v.parts} px={44} max={3} />} word={v.word} hue={v.hue} detail={v.detail} />;
  if (size === 's')
    return (
      <TileFrame label="Care" className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <Rings parts={v.parts} px={68} max={3} />
          <p className="mt-auto truncate text-[15px] font-semibold" style={{ color: v.hue }}>
            {v.word}
          </p>
          <TileState>{v.detail}</TileState>
        </div>
      </TileFrame>
    );
  const legend = (max: number) => (
    <ul className="flex min-w-0 flex-col gap-1">
      {v.parts.slice(0, max).map((p) => (
        <li key={p.id} className="flex items-center gap-2 text-[12px]">
          <span className="size-2 shrink-0 rounded-full" style={{ background: hueOf(p) }} />
          <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
          <span className="tabular-nums opacity-70">{p.percent ?? '—'}%</span>
        </li>
      ))}
    </ul>
  );
  if (size === 'w')
    return (
      <TileFrame label="Care" className="pro-surface">
        <div className="flex h-full items-center gap-4 p-4">
          <Rings parts={v.parts} px={116} max={4} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold" style={{ color: v.hue }}>
              {v.word}
            </p>
            <div className="mt-1.5">{legend(4)}</div>
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Care" className="pro-surface">
      <div className="flex h-full flex-col p-5">
        <TileName className="text-[17px]">Care</TileName>
        <div className="relative my-2 grid flex-1 place-items-center">
          <Rings parts={v.parts} px={150} max={5} />
          {first ? (
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <Big n={first.percent ?? '—'} unit="%" className="text-[26px]" style={{ color: hueOf(first) }} />
                <p className="text-[11px] opacity-60">{first.name}</p>
              </div>
            </div>
          ) : null}
        </div>
        {legend(5)}
        {first ? <div className="mt-2 empty:hidden"><ResetButton c={c} p={first} act={act} /></div> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Wear
// ---------------------------------------------------------------------------------------------

function Bar({ p, thick = 6 }: { p: WearPart; thick?: number }) {
  return (
    <span className="block w-full overflow-hidden rounded-full bg-[color-mix(in_srgb,currentColor_8%,transparent)]" style={{ height: thick }}>
      <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(2, p.percent ?? 0)}%`, background: hueOf(p) }} />
    </span>
  );
}

export function CareWear({ c, size, act }: CleanerTileProps) {
  const v = verdict(c);
  if (size === 'xs') return <XsRow label="Care" visual={<IconChip icon={v.parts[0] ? iconOf(v.parts[0]) : Wrench01Icon} hue={v.hue} px={34} />} word={v.word} hue={v.hue} detail={v.detail} />;
  const rows = (max: number, detail: boolean) => (
    <ul className="flex flex-col gap-2">
      {v.parts.slice(0, max).map((p) => (
        <li key={p.id} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2 text-[12px]">
            <span className="flex min-w-0 items-center gap-1.5 truncate font-medium">
              {detail ? <HugeiconsIcon icon={iconOf(p)} size={13} style={{ color: hueOf(p) }} /> : null}
              {p.name}
            </span>
            <span className="shrink-0 tabular-nums" style={{ color: wearTone(p) === 'ok' ? undefined : hueOf(p), opacity: wearTone(p) === 'ok' ? 0.65 : 1 }}>
              {detail ? leftText(p) : `${p.percent ?? '—'}%`}
            </span>
          </div>
          <Bar p={p} thick={detail ? 7 : 5} />
        </li>
      ))}
    </ul>
  );
  if (size === 's')
    return (
      <TileFrame label="Care" className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <p className="truncate text-[14px] font-semibold" style={{ color: v.hue }}>
            {v.word}
          </p>
          <div className="mt-auto">{rows(3, false)}</div>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label="Care" className="pro-surface">
        <div className="flex h-full gap-4 p-4">
          <div className="flex w-[34%] min-w-0 flex-col">
            <TileName>Care</TileName>
            <p className="line-clamp-2 text-[15px] font-semibold leading-tight" style={{ color: v.hue }}>
              {v.word}
            </p>
          </div>
          <div className="min-w-0 flex-1 self-center">{rows(3, true)}</div>
        </div>
      </TileFrame>
    );
  const first = v.parts[0];
  return (
    <TileFrame label="Care" className="pro-surface">
      <div className="flex h-full flex-col p-5">
        <TileName className="text-[17px]">Care</TileName>
        <p className="mb-3 truncate text-[18px] font-semibold" style={{ color: v.hue }}>
          {v.word}
        </p>
        <div className="flex-1">{rows(6, true)}</div>
        {first ? <div className="mt-2 empty:hidden"><ResetButton c={c} p={first} act={act} /></div> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Next up
// ---------------------------------------------------------------------------------------------

export function CareNext({ c, size, act }: CleanerTileProps) {
  const v = verdict(c);
  const p = v.parts[0];
  if (!p) return <XsRow label="Care" visual={<IconChip icon={Wrench01Icon} px={34} />} word="No parts reported" />;
  const hue = hueOf(p);
  const good = wearTone(p) === 'ok';
  const when = p.percent === 0 ? 'Now' : p.hoursLeft !== null ? hoursText(p.hoursLeft) : `${p.percent}%`;
  const rest = v.parts.slice(1);
  const bg = good ? undefined : wash(hue, 10);
  if (size === 'xs') return <XsRow label="Care" style={bg} visual={<IconChip icon={good ? CheckmarkCircle02Icon : iconOf(p)} hue={hue} px={34} />} word={good ? 'All parts good' : `${p.name} · ${when}`} hue={hue} detail={good ? `Next: ${p.name.toLowerCase()} in ${when}` : leftText(p)} />;
  if (size === 's')
    return (
      <TileFrame label="Care" className="pro-surface" style={bg}>
        <div className="flex h-full flex-col p-3.5">
          <IconChip icon={iconOf(p)} hue={hue} />
          <p className="mt-auto text-[12px] font-medium opacity-60">{good ? 'Next to replace' : 'Replace'}</p>
          <TileName>{p.name}</TileName>
          <p className="text-[13px] font-semibold tabular-nums" style={{ color: hue }}>
            {p.percent === 0 ? 'Now' : `in ${when}`}
          </p>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Care" className="pro-surface" style={bg}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <IconChip icon={iconOf(p)} hue={hue} px={size === 'l' ? 40 : 32} />
            <div className="min-w-0">
              <p className="text-[12px] font-medium opacity-60">{good ? 'Next to replace' : 'Replace'}</p>
              <TileName className={size === 'l' ? 'text-[18px]' : undefined}>{p.name}</TileName>
            </div>
          </div>
          {size === 'w' ? <Big n={when} className="text-[30px]" style={{ color: hue }} /> : null}
        </div>
        {size === 'l' ? (
          <div className="my-auto text-center">
            <Big n={when} className="text-[56px]" style={{ color: hue }} />
            <p className="mt-1 text-[13px] opacity-60">{p.percent !== null ? `${p.percent}% of its life left` : ''}</p>
          </div>
        ) : null}
        <p className="mt-auto truncate text-[12px] opacity-70">
          {rest.length ? `Then ${rest.slice(0, size === 'l' ? 4 : 2).map((x) => `${x.name.toLowerCase()} ${x.hoursLeft !== null ? hoursText(x.hoursLeft) : `${x.percent ?? '—'}%`}`).join(' · ')}` : ''}
        </p>
        <div className="mt-2 empty:hidden">
          <ResetButton c={c} p={p} act={act} />
        </div>
      </div>
    </TileFrame>
  );
}
