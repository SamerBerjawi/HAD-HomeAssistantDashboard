/**
 * Details sheet kit (WIDGET_DESIGN.md §8, agent's calls 2026-11-20, for the owner's review).
 * Every widget's details sheet is built from these parts, so they all read the same way:
 *
 * 1. `DetailSheet`: a right-side Drawer (36 rem) from 768 px up, bottom Drawer on phones; the body scrolls.
 * 2. `SheetHero`: a coloured band that matches the card: what it is, the state in words or one big
 *    number, one summary line, and the one or two actions that matter most (glass buttons).
 * 3. Optional toolbar: `SheetFilter` (segmented) and `SheetSearch` (long lists only).
 * 4. `SheetSection` + `SheetRow`: inset grouped lists (by room or floor), the control on the right.
 * 5. `SheetEmpty` for nothing to show. Hold-to-confirm for anything that opens the house.
 */
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Button, Drawer, SearchField, Slider, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '../../../hooks/useMediaQuery';

/** Hero colours: saturated, so white text reads in light and dark mode alike. */
export const HERO = {
  amber: 'linear-gradient(150deg, hsl(40 95% 54%), hsl(22 85% 44%))',
  warning: 'linear-gradient(150deg, hsl(36 92% 50%), hsl(18 80% 38%))',
  danger: 'linear-gradient(150deg, hsl(0 75% 52%), hsl(350 70% 33%))',
  secure: 'linear-gradient(150deg, hsl(152 48% 38%), hsl(168 55% 22%))',
  teal: 'linear-gradient(150deg, hsl(175 55% 42%), hsl(200 50% 27%))',
  blue: 'linear-gradient(150deg, hsl(208 85% 52%), hsl(226 70% 33%))',
  violet: 'linear-gradient(150deg, hsl(265 60% 56%), hsl(245 50% 31%))',
  rose: 'linear-gradient(150deg, hsl(340 65% 55%), hsl(300 40% 32%))',
  slate: 'linear-gradient(150deg, hsl(218 16% 44%), hsl(225 18% 24%))',
  night: 'linear-gradient(150deg, hsl(230 30% 24%), hsl(240 35% 12%))'
} as const;
export type HeroTone = keyof typeof HERO;

interface DetailSheetProps {
  page?: "media" | "overview";
  /** The sheet's name for screen readers ("Lights details"). */
  title: string;
  onClose: () => void;
  hero: ReactNode;
  /** Filters and search, under the hero. */
  toolbar?: ReactNode;
  children?: ReactNode;
}

export function DetailSheet({ page = "overview", title, onClose, hero, toolbar, children }: DetailSheetProps) {
  const desktop = useMediaQuery('(min-width: 768px)');
  const onOpenChange = (open: boolean) => {
    if (!open) onClose();
  };
  const body = (
    <div className="flex flex-col gap-4">
      {hero}
      {toolbar ? <div className="flex flex-col gap-2.5">{toolbar}</div> : null}
      {children}
    </div>
  );
  // Owner review (2026-11-20, §8 #1): a side panel from the right on desktop, like Notifications.
  if (desktop) {
    return (
      <Drawer.Backdrop isOpen onOpenChange={onOpenChange}>
        <Drawer.Content placement="right">
          <Drawer.Dialog aria-label={title} className="pro flex h-full w-[36rem] max-w-[100vw] flex-col bg-background" data-page={page}>
            <Drawer.Body className="min-h-0 flex-1 overflow-y-auto p-3 pb-5">{body}</Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    );
  }
  return (
    <Drawer.Backdrop isOpen onOpenChange={onOpenChange}>
      <Drawer.Content placement="bottom">
        <Drawer.Dialog aria-label={title} className="pro max-h-[92dvh] pb-[max(16px,env(safe-area-inset-bottom))]" data-page={page}>
          <Drawer.Handle />
          <Drawer.Body className="overflow-y-auto px-3 pt-1">{body}</Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

interface SheetHeroProps {
  icon: IconSvgElement;
  /** What this is ("Lights", "Living Room thermostat"). */
  eyebrow: ReactNode;
  /** The state in words or one big number. */
  headline: ReactNode;
  sub?: ReactNode;
  tone?: HeroTone;
  /** A custom background (the card's own gradient); wins over `tone`. */
  background?: string;
  /** Glass buttons, bottom left. */
  actions?: ReactNode;
  /** Right-hand side: a dial, a picture, a big figure. */
  aside?: ReactNode;
  /** Extra content under the summary (chips, a bar). */
  children?: ReactNode;
  onClose: () => void;
  className?: string;
  style?: CSSProperties;
}

export function SheetHero({ icon, eyebrow, headline, sub, tone = 'slate', background, actions, aside, children, onClose, className, style }: SheetHeroProps) {
  return (
    <section
      aria-label="Summary"
      className={cn('relative overflow-hidden rounded-[22px] p-4 text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)] sm:p-5', className)}
      style={{ background: background ?? HERO[tone], ...style }}
    >
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Close"
        onPress={onClose}
        className="pro-touch-44 absolute right-2.5 top-2.5 z-10 size-8 min-w-0 rounded-full text-white/85 hover:bg-white/15 hover:text-white"
      >
        <HugeiconsIcon icon={Cancel01Icon} size={16} />
      </Button>
      <div className="relative flex min-w-0 gap-4 [text-shadow:0_1px_8px_rgba(0,0,0,0.15)]">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex min-w-0 items-center gap-1.5 pr-9 text-xs font-medium text-white/85">
            <HugeiconsIcon icon={icon} size={14} className="shrink-0" />
            <span className="truncate">{eyebrow}</span>
          </p>
          <h2 className="break-words text-2xl font-semibold leading-tight sm:text-[28px]">{headline}</h2>
          {sub ? <p className="break-words text-sm text-white/85">{sub}</p> : null}
          {children}
          {actions ? <div className="mt-2 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        {aside ? <div className="flex shrink-0 items-end pt-6">{aside}</div> : null}
      </div>
    </section>
  );
}

/** A glass button for the hero. */
export function HeroButton({
  icon,
  children,
  onPress,
  isDisabled,
  isPending,
  solid,
  ariaLabel
}: {
  icon?: IconSvgElement;
  children: ReactNode;
  onPress: () => void;
  isDisabled?: boolean;
  isPending?: boolean;
  solid?: boolean;
  ariaLabel?: string;
}) {
  return (
    <Button
      size="sm"
      variant="ghost"
      onPress={onPress}
      isDisabled={isDisabled}
      isPending={isPending}
      aria-label={ariaLabel}
      className={cn(
        'h-9 gap-1.5 rounded-full px-3.5 text-xs font-semibold',
        solid ? 'bg-white text-[hsl(225_30%_20%)] shadow-sm hover:bg-white/90' : 'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25'
      )}
    >
      {icon ? <HugeiconsIcon icon={icon} size={15} /> : null}
      {children}
    </Button>
  );
}

/** Classes for a `HoldButton` that sits in the hero (glass). */
export const HERO_HOLD = 'h-9 rounded-full px-3.5 text-xs font-semibold bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25';

/** A titled, inset grouped list. `plain` drops the list surface (for grids and charts). */
export function SheetSection({ title, aside, children, plain = false, className }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; plain?: boolean; className?: string }) {
  return (
    <section aria-label={typeof title === 'string' ? title : undefined} className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {title || aside ? (
        <header className="flex min-h-6 items-center justify-between gap-2 px-1">
          {title ? <h3 className="truncate text-xs font-semibold text-muted">{title}</h3> : <span />}
          {aside ? <span className="shrink-0 text-xs text-muted">{aside}</span> : null}
        </header>
      ) : null}
      {plain ? children : <ul className="pro-surface flex flex-col divide-y divide-[var(--separator,rgba(127,127,127,0.16))] overflow-hidden rounded-[18px]">{children}</ul>}
    </section>
  );
}

type RowTone = 'default' | 'active' | 'warning' | 'danger' | 'success';
const ROW_TILE: Record<RowTone, string> = {
  default: 'bg-default text-muted',
  active: 'bg-[color-mix(in_oklab,var(--accent)_16%,transparent)] text-[var(--accent)]',
  warning: 'bg-[hsl(42_100%_92%)] text-[hsl(30_80%_35%)] dark:bg-[hsl(38_55%_20%)] dark:text-[hsl(42_100%_70%)]',
  danger: 'bg-[hsl(0_100%_95%)] text-danger dark:bg-[hsl(0_55%_20%)]',
  success: 'bg-[hsl(150_60%_92%)] text-[hsl(152_55%_30%)] dark:bg-[hsl(152_40%_18%)] dark:text-[hsl(150_60%_65%)]'
};

interface SheetRowProps {
  icon?: IconSvgElement;
  /** A picture instead of the icon tile (avatar, cover). */
  media?: ReactNode;
  tone?: RowTone;
  title: ReactNode;
  subtitle?: ReactNode;
  /** The control or value on the right. */
  trailing?: ReactNode;
  /** More controls under the row (a slider). */
  children?: ReactNode;
  className?: string;
}

export function SheetRow({ icon, media, tone = 'default', title, subtitle, trailing, children, className }: SheetRowProps) {
  return (
    <li className={cn('flex min-w-0 flex-col gap-2 px-3 py-2.5', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {media ??
          (icon ? (
            <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', ROW_TILE[tone])}>
              <HugeiconsIcon icon={icon} size={17} />
            </span>
          ) : null)}
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-medium leading-tight">{title}</p>
          {subtitle ? (
            <p
              className={cn('mt-0.5 break-words text-xs leading-tight', tone === 'danger' ? 'text-danger' : tone === 'warning' ? 'text-[hsl(30_80%_35%)] dark:text-[hsl(42_100%_70%)]' : 'text-muted')}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {trailing ? <div className="flex shrink-0 items-center gap-1.5">{trailing}</div> : null}
      </div>
      {children ? <div className="pl-12">{children}</div> : null}
    </li>
  );
}

export function SheetEmpty({ icon, title, text }: { icon: IconSvgElement; title: string; text?: string }) {
  return (
    <div className="pro-surface flex flex-col items-center gap-1.5 rounded-[18px] px-6 py-8 text-center">
      <HugeiconsIcon icon={icon} size={22} className="text-muted" />
      <p className="text-sm font-semibold">{title}</p>
      {text ? <p className="max-w-xs text-xs text-muted">{text}</p> : null}
    </div>
  );
}

export interface FilterOption<T extends string> {
  id: T;
  label: string;
  count?: number;
  icon?: IconSvgElement;
}

/** Segmented filter (HeroUI ToggleButtonGroup); scrolls sideways when it doesn't fit. */
export function SheetFilter<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly FilterOption<T>[]; onChange: (id: T) => void }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none]">
      <ToggleButtonGroup
        aria-label={label}
        size="sm"
        isDetached
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={new Set([value])}
        onSelectionChange={(keys) => {
          const next = [...keys][0];
          if (next !== undefined) onChange(String(next) as T);
        }}
        className="w-max"
      >
        {options.map((o) => (
          <ToggleButton key={o.id} id={o.id} className="gap-1.5 whitespace-nowrap">
            {o.icon ? <HugeiconsIcon icon={o.icon} size={14} /> : null}
            {o.label}
            {o.count !== undefined ? <span className="tabular-nums opacity-70">{o.count}</span> : null}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

export function SheetSearch({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <SearchField value={value} onChange={onChange} fullWidth variant="secondary" aria-label={label}>
      <SearchField.Group>
        <SearchField.SearchIcon>
          <HugeiconsIcon icon={Search01Icon} size={16} />
        </SearchField.SearchIcon>
        <SearchField.Input placeholder={placeholder} />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}

/** Lists longer than this get a search field. */
export { SEARCH_FROM, groupBy, matches } from '../../../lib/sheetLists';

/** A slider that sends its value when let go (one service call per drag), with the value shown. */
export function SheetSlider({
  value,
  min = 0,
  max = 100,
  step = 1,
  label,
  icon,
  format = (v) => `${v}%`,
  onCommit,
  isDisabled,
  warm = false
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  icon?: IconSvgElement;
  format?: (v: number) => string;
  onCommit: (v: number) => void;
  isDisabled?: boolean;
  /** Amber fill (lights). */
  warm?: boolean;
}) {
  const [drag, setDrag] = useState<number | null>(null);
  const shown = drag ?? value;
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {icon ? <HugeiconsIcon icon={icon} size={14} className="shrink-0 text-muted" /> : null}
      <Slider
        aria-label={label}
        minValue={min}
        maxValue={max}
        step={step}
        value={shown}
        isDisabled={isDisabled}
        onChange={(v) => setDrag(Array.isArray(v) ? v[0] : v)}
        onChangeEnd={(v) => {
          setDrag(null);
          onCommit(Array.isArray(v) ? v[0] : v);
        }}
        className={cn('min-w-0 flex-1', warm && '[--accent:var(--warning)]')}
      >
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
      <span className="w-11 shrink-0 text-right text-xs font-medium tabular-nums text-muted">{format(shown)}</span>
    </div>
  );
}

/** A small figure tile (label, value, a note) for a grid of readings. */
export function SheetTile({ icon, label, value, note, tone = 'default' }: { icon: IconSvgElement; label: string; value: string; note?: string; tone?: RowTone }) {
  return (
    <li className="pro-surface flex min-w-0 flex-col gap-1 rounded-2xl p-3">
      <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
        <span className={cn('grid size-5 shrink-0 place-items-center rounded-md', ROW_TILE[tone])}>
          <HugeiconsIcon icon={icon} size={12} />
        </span>
        <span className="truncate">{label}</span>
      </span>
      <span className="truncate text-lg font-semibold tabular-nums">{value}</span>
      {note ? <span className="truncate text-xs text-muted">{note}</span> : null}
    </li>
  );
}

export function SheetTiles({ children }: { children: ReactNode }) {
  return <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">{children}</ul>;
}
