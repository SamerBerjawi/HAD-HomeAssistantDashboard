/**
 * Vacuum tiles · batch 1 · Station (docs/pro-ui/VACUUM_TILES.md): the self-wash base's supplies
 * and what it is doing (washing, drying, emptying), with its chores.
 * A · Tanks: the station's tanks side by side as glass columns (clean water blue, dirty water
 *     brown, detergent violet, dust bag grey), each filled to its state; an empty slot is dashed.
 * B · Cutaway: the station drawn from the front, the robot parked in it; a part that needs you
 *     glows amber and is named beside it; steam while drying, bubbles while washing.
 * C · To-do: the verdict first ("Station ready" or the chores, worst first); Wash, Dry, Empty
 *     buttons when the integration offers them.
 * The integrations report states (installed, low, full), not litres, so the fills are symbolic.
 */
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, CheckmarkCircle02Icon, Delete02Icon, DropletIcon, Sun03Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import { chores, type Supply } from '../../../../lib/vacuums/cleaner';
import { CH, ChoreButton, IconChip, RobotTop, wash, XsRow, type CleanerTileProps } from '../cleanerTileKit';

const TANKS: Supply['id'][] = ['clean', 'dirty', 'detergent', 'dust'];
const SHORT: Record<string, string> = { clean: 'Clean', dirty: 'Dirty', detergent: 'Soap', dust: 'Bag' };

/** How full to draw a supply (0–1) and its colour. Dirty water and the bag are good when low. */
function fill(s: Supply): { level: number; hue: string; warn: boolean } {
  const base = s.id === 'clean' || s.id === 'hot' ? CH.water : s.id === 'dirty' ? CH.dirty : s.id === 'detergent' ? CH.soap : CH.idle;
  const fills = s.id === 'dirty' || s.id === 'dust';
  switch (s.state) {
    case 'missing':
      return { level: 0, hue: CH.watch, warn: true };
    case 'full':
      return { level: 0.95, hue: CH.watch, warn: true };
    case 'low':
      return { level: 0.14, hue: CH.watch, warn: true };
    case 'off':
      return { level: 0, hue: CH.idle, warn: false };
    default:
      return { level: fills ? 0.28 : 0.78, hue: base, warn: false };
  }
}

/** The station's work in words, or the verdict. */
function stationWords(c: CleanerTileProps['c']) {
  const todo = chores(c);
  const doing = c.activity === 'washing' ? 'Washing the mop' : c.activity === 'drying' ? 'Drying the mop' : c.activity === 'emptying' ? 'Emptying the bin' : null;
  if (!c.station) return { word: 'No station', detail: 'This robot reports no station', hue: CH.idle, todo };
  if (todo.length) return { word: todo.length === 1 ? todo[0].todo : `${todo.length} things to do`, detail: doing ?? todo.map((t) => t.supply.name).join(' · '), hue: CH.watch, todo };
  if (doing) return { word: doing, detail: c.station.doing ?? '', hue: CH.on, todo };
  return { word: 'Station ready', detail: 'Water, detergent and bag are fine', hue: CH.ok, todo };
}

function ChoreButtons({ c, act, className }: CleanerTileProps & { className?: string }) {
  const busyHere = c.activity === 'washing' || c.activity === 'drying' || c.activity === 'emptying';
  const away = c.activity === 'cleaning' || c.activity === 'returning' || c.activity === 'paused';
  const b = [
    c.actions.includes('wash') ? <ChoreButton key="w" icon={DropletIcon} label="Wash" hue={CH.water} isDisabled={away || busyHere} onPress={() => act({ type: 'wash' })} /> : null,
    c.actions.includes('dry') ? <ChoreButton key="d" icon={Sun03Icon} label="Dry" hue={CH.heat} isDisabled={away || busyHere} onPress={() => act({ type: 'dry' })} /> : null,
    c.actions.includes('empty') ? <ChoreButton key="e" icon={Delete02Icon} label="Empty" hue={CH.idle} isDisabled={away || busyHere} onPress={() => act({ type: 'empty' })} /> : null
  ].filter(Boolean);
  return b.length ? <div className={cn('flex flex-wrap gap-1.5', className)}>{b}</div> : null;
}

// ---------------------------------------------------------------------------------------------
// A · Tanks
// ---------------------------------------------------------------------------------------------

function Tank({ s, h, label }: { s: Supply; h: number; label?: boolean }) {
  const f = fill(s);
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-1" role="img" aria-label={`${s.name}: ${s.raw}`}>
      <div
        className={cn('relative w-full overflow-hidden rounded-[10px]', s.state === 'missing' ? 'border-2 border-dashed' : 'bg-[color-mix(in_srgb,currentColor_6%,transparent)] ring-1 ring-inset ring-black/5 dark:ring-white/10')}
        style={{ height: h, borderColor: s.state === 'missing' ? CH.watch : undefined }}
      >
        <div className="absolute inset-x-0 bottom-0 transition-[height] duration-500" style={{ height: `${f.level * 100}%`, background: `linear-gradient(180deg, color-mix(in srgb, ${f.hue} 55%, transparent), color-mix(in srgb, ${f.hue} 85%, transparent))` }}>
          <span className="absolute inset-x-0 top-0 h-px bg-white/50" />
        </div>
        {f.warn ? (
          <span className="absolute inset-x-0 top-1 grid place-items-center" style={{ color: CH.watch }}>
            <HugeiconsIcon icon={Alert02Icon} size={13} />
          </span>
        ) : null}
      </div>
      {label ? <span className="max-w-full truncate text-[11px] font-medium" style={{ color: f.warn ? CH.watch : undefined, opacity: f.warn ? 1 : 0.65 }}>{SHORT[s.id] ?? s.name}</span> : null}
    </div>
  );
}

const tanksOf = (c: CleanerTileProps['c']) => TANKS.map((id) => c.station?.supplies.find((s) => s.id === id)).filter((s): s is Supply => !!s);

export function StationTanks(p: CleanerTileProps) {
  const { c, size } = p;
  const w = stationWords(c);
  const tanks = tanksOf(c);
  const mini = (h: number, labels?: boolean, gap = 'gap-1.5') => (
    <div className={cn('flex w-full items-end', gap)}>
      {tanks.map((s) => (
        <Tank key={s.id} s={s} h={h} label={labels} />
      ))}
    </div>
  );
  if (size === 'xs') return <XsRow label="Station" visual={<div className="w-16 shrink-0">{mini(38, false, 'gap-1')}</div>} word={w.word} hue={w.hue} detail={w.detail} />;
  if (size === 's')
    return (
      <TileFrame label="Station" className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          {mini(64)}
          <p className="mt-auto truncate text-[15px] font-semibold" style={{ color: w.hue }}>
            {w.word}
          </p>
          <TileState>{w.detail}</TileState>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label="Station" className="pro-surface">
        <div className="flex h-full gap-4 p-4">
          <div className="flex w-[44%] min-w-0 flex-col">
            <TileName>Station</TileName>
            <p className="line-clamp-2 text-[17px] font-semibold leading-tight" style={{ color: w.hue }}>
              {w.word}
            </p>
            <TileState>{w.detail}</TileState>
            <ChoreButtons {...p} className="mt-auto" />
          </div>
          <div className="flex min-w-0 flex-1 items-end">{mini(92, true)}</div>
        </div>
      </TileFrame>
    );
  const extras = c.station?.supplies.filter((s) => !TANKS.includes(s.id)) ?? [];
  return (
    <TileFrame label="Station" className="pro-surface">
      <div className="flex h-full flex-col p-5">
        <TileName className="text-[17px]">Station</TileName>
        <p className="text-[22px] font-semibold leading-tight" style={{ color: w.hue }}>
          {w.word}
        </p>
        <TileState>{w.detail}</TileState>
        <div className="my-auto pt-3">{mini(124, true, 'gap-2.5')}</div>
        <div className="mb-3 mt-3 flex flex-wrap gap-1.5">
          {extras.map((s) => (
            <span key={s.id} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold" style={{ background: `color-mix(in srgb, ${s.state === 'ok' ? CH.ok : s.state === 'off' ? CH.idle : CH.watch} 14%, transparent)`, color: s.state === 'ok' ? CH.ok : s.state === 'off' ? CH.idle : CH.watch }}>
              <HugeiconsIcon icon={s.state === 'ok' ? CheckmarkCircle02Icon : Alert02Icon} size={12} />
              {s.name} · {s.raw}
            </span>
          ))}
        </div>
        <ChoreButtons {...p} />
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Cutaway
// ---------------------------------------------------------------------------------------------

/** The station from the front: two tanks on top, the bag behind a door, the robot in its bay. */
export function Station({ c, px, callouts }: { c: CleanerTileProps['c']; px: number; callouts?: boolean }) {
  const sup = (id: Supply['id']) => c.station?.supplies.find((s) => s.id === id);
  const part = (id: Supply['id']) => {
    const s = sup(id);
    return s ? fill(s) : { level: 0, hue: CH.idle, warn: false };
  };
  const clean = part('clean');
  const dirty = part('dirty');
  const bag = part('dust');
  const home = !['cleaning', 'returning', 'paused', 'error'].includes(c.activity);
  const w = px * 0.62;
  const glow = (warn: boolean) => (warn ? { boxShadow: `0 0 0 2px ${CH.watch}, 0 0 14px color-mix(in srgb, ${CH.watch} 60%, transparent)` } : undefined);
  return (
    <div aria-hidden className="relative shrink-0" style={{ width: callouts ? px * 1.5 : w, height: px }}>
      <div className="absolute left-0 top-0 rounded-[14px] bg-[linear-gradient(170deg,hsl(0_0%_99%),hsl(220_10%_88%))] shadow-[0_8px_18px_-10px_rgba(0,0,0,0.45)] ring-1 ring-black/5 dark:bg-[linear-gradient(170deg,hsl(225_8%_32%),hsl(225_10%_18%))] dark:ring-white/10" style={{ width: w, height: px }}>
        {/* tanks */}
        <div className="absolute inset-x-[9%] top-[6%] flex gap-[6%]" style={{ height: '34%' }}>
          {[clean, dirty].map((t, i) => (
            <div key={i} className="relative flex-1 overflow-hidden rounded-[6px] bg-black/5 dark:bg-white/5" style={glow(t.warn)}>
              <div className="absolute inset-x-0 bottom-0" style={{ height: `${t.level * 100}%`, background: `color-mix(in srgb, ${t.hue} 70%, transparent)` }} />
            </div>
          ))}
        </div>
        {/* bag door */}
        <div className="absolute inset-x-[9%] top-[44%] rounded-[5px] bg-black/[0.06] dark:bg-white/[0.06]" style={{ height: '14%', ...glow(bag.warn) }} />
        {/* bay */}
        <div className="absolute inset-x-[6%] bottom-[5%] top-[62%] overflow-hidden rounded-[10px] bg-black/10 dark:bg-black/40">
          {c.activity === 'washing'
            ? [0, 1, 2, 3].map((i) => <span key={i} className="absolute bottom-1 size-1.5 rounded-full bg-[hsl(205_85%_70%)] motion-safe:animate-bounce" style={{ left: `${18 + i * 20}%`, animationDelay: `${i * 0.15}s` }} />)
            : null}
          {c.activity === 'drying' ? [0, 1, 2].map((i) => <span key={i} className="absolute top-0 h-3 w-1 rounded-full bg-white/40 motion-safe:animate-pulse" style={{ left: `${25 + i * 25}%`, animationDelay: `${i * 0.3}s` }} />) : null}
          {home ? <RobotTop px={w * 0.5} hue={CH.ok} working={c.activity === 'washing' || c.activity === 'drying'} className="absolute bottom-[-30%] left-1/2 -translate-x-1/2" /> : null}
        </div>
      </div>
      {callouts ? (
        <ul className="absolute right-0 top-0 flex h-full flex-col justify-around text-[11px] font-medium" style={{ width: px * 0.82 }}>
          {[
            { name: 'Clean water', t: clean, s: sup('clean') },
            { name: 'Dirty water', t: dirty, s: sup('dirty') },
            { name: 'Dust bag', t: bag, s: sup('dust') }
          ].map((x) => (
            <li key={x.name} className="flex items-center gap-1.5" style={{ color: x.t.warn ? CH.watch : undefined }}>
              <span className="h-px w-3 bg-current opacity-50" />
              <span className="truncate">{x.s ? (x.t.warn ? (chores(c).find((k) => k.supply.id === x.s?.id)?.todo ?? x.s.raw) : x.name) : `${x.name} —`}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function StationCutaway(p: CleanerTileProps) {
  const { c, size } = p;
  const w = stationWords(c);
  const bg = w.todo.length ? wash(CH.watch, 10) : undefined;
  if (size === 'xs') return <XsRow label="Station" style={bg} visual={<Station c={c} px={50} />} word={w.word} hue={w.hue} detail={w.detail} />;
  if (size === 's')
    return (
      <TileFrame label="Station" className="pro-surface" style={bg}>
        <div className="flex h-full gap-3 p-3.5">
          <Station c={c} px={118} />
          <div className="flex min-w-0 flex-1 flex-col justify-end">
            <p className="line-clamp-3 text-[14px] font-semibold leading-tight" style={{ color: w.hue }}>
              {w.word}
            </p>
          </div>
        </div>
      </TileFrame>
    );
  if (size === 'w')
    return (
      <TileFrame label="Station" className="pro-surface" style={bg}>
        <div className="flex h-full gap-4 p-4">
          <Station c={c} px={116} callouts />
          <div className="flex min-w-0 flex-1 flex-col">
            <TileName>Station</TileName>
            <p className="line-clamp-2 text-[16px] font-semibold leading-tight" style={{ color: w.hue }}>
              {w.word}
            </p>
            <ChoreButtons {...p} className="mt-auto" />
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Station" className="pro-surface" style={bg}>
      <div className="flex h-full flex-col p-5">
        <TileName className="text-[17px]">Station</TileName>
        <p className="text-[20px] font-semibold leading-tight" style={{ color: w.hue }}>
          {w.word}
        </p>
        <TileState>{w.detail}</TileState>
        <div className="grid flex-1 place-items-center">
          <Station c={c} px={170} callouts />
        </div>
        <ChoreButtons {...p} />
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · To-do
// ---------------------------------------------------------------------------------------------

export function StationTodo(p: CleanerTileProps) {
  const { c, size } = p;
  const w = stationWords(c);
  const ready = !w.todo.length;
  const icon = ready ? CheckmarkCircle02Icon : Alert02Icon;
  if (size === 'xs') return <XsRow label="Station" visual={<IconChip icon={icon} hue={w.hue} px={34} />} word={w.word} hue={w.hue} detail={w.detail} />;
  const list = (max: number) => (
    <ul className="flex flex-col gap-1.5">
      {w.todo.slice(0, max).map((t) => (
        <li key={t.supply.id} className="flex items-center gap-2 text-[13px] font-medium">
          <span className="grid size-5 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${CH.watch} 18%, transparent)`, color: CH.watch }}>
            <HugeiconsIcon icon={t.supply.id === 'clean' || t.supply.id === 'dirty' ? DropletIcon : t.supply.id === 'dust' ? Delete02Icon : Alert02Icon} size={11} />
          </span>
          <span className="truncate">{t.todo}</span>
        </li>
      ))}
      {w.todo.length > max ? <li className="text-[12px] opacity-60">+{w.todo.length - max} more</li> : null}
    </ul>
  );
  if (size === 's')
    return (
      <TileFrame label="Station" className="pro-surface" style={ready ? undefined : wash(CH.watch, 10)}>
        <div className="flex h-full flex-col p-3.5">
          <IconChip icon={icon} hue={w.hue} />
          <p className="mt-auto line-clamp-2 text-[15px] font-semibold leading-tight" style={{ color: w.hue }}>
            {ready ? w.word : w.todo[0].todo}
          </p>
          <TileState>{ready ? w.detail : w.todo.length > 1 ? `+${w.todo.length - 1} more` : 'Station'}</TileState>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Station" className="pro-surface" style={ready ? undefined : wash(CH.watch, 10)}>
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-4')}>
        <div className="flex items-center gap-2.5">
          <IconChip icon={icon} hue={w.hue} px={size === 'l' ? 36 : 30} />
          <div className="min-w-0">
            <TileName className={size === 'l' ? 'text-[17px]' : undefined}>Station</TileName>
            <p className="truncate text-[16px] font-semibold leading-tight" style={{ color: w.hue }}>
              {ready ? w.word : w.todo.length === 1 ? 'One thing to do' : w.word}
            </p>
          </div>
        </div>
        <div className="mt-3 min-h-0 flex-1">{ready ? <TileState>{c.station?.doing ?? w.detail}</TileState> : list(size === 'l' ? 6 : 2)}</div>
        <ChoreButtons {...p} />
      </div>
    </TileFrame>
  );
}
