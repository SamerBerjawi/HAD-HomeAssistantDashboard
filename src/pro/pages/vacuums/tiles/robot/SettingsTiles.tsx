/**
 * Vacuum tiles · batch 3 · Settings (docs/pro-ui/VACUUM_TILES.md): the robot's own switches
 * (carpet boost, obstacle avoidance, resume cleaning…), whatever its integration offers.
 * A · Toggles: a row per setting with a switch, the Room page's switch rows.
 * B · Pills: each setting a pill that lights up when on; tap to flip.
 * C · Summary: "3 of 4 on" with a segment per setting; the rows on Large.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Layers01Icon, RepeatIcon, Settings02Icon, Shield01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { TileFrame, TileName, TileState } from '../../../../areas/tileKit';
import type { Cleaner } from '../../../../lib/vacuums/cleaner';
import { CH, IconChip, XsRow, type CleanerTileProps } from '../cleanerTileKit';

type Setting = Cleaner['settings'][number];

/** Strip the device name integrations prefix ("X60 Carpet boost" → "Carpet boost"). */
const label = (c: Cleaner, s: Setting) => s.name.replace(new RegExp(`^${c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i'), '') || s.name;
const iconOf = (s: Setting): IconSvgElement => (/carpet/i.test(s.name) ? Layers01Icon : /obstacle|avoid/i.test(s.name) ? Shield01Icon : /resume/i.test(s.name) ? RepeatIcon : /custom/i.test(s.name) ? SparklesIcon : Settings02Icon);
const off = (c: Cleaner) => c.activity === 'offline' || !c.actions.includes('setting');

function NoSettings({ size }: { size: CleanerTileProps['size'] }) {
  if (size === 'xs') return <XsRow label="Settings" visual={<IconChip icon={Settings02Icon} px={36} />} word="Settings" detail="None reported" />;
  return (
    <TileFrame label="Settings" className="pro-surface">
      <div className="flex h-full flex-col p-4">
        <IconChip icon={Settings02Icon} px={36} />
        <p className="mt-auto text-[15px] font-semibold">Settings</p>
        <TileState>The robot shares no settings with Home Assistant</TileState>
      </div>
    </TileFrame>
  );
}

function summary(c: Cleaner) {
  const on = c.settings.filter((s) => s.on);
  return { word: `${on.length} of ${c.settings.length} on`, detail: c.settings.filter((s) => !s.on).map((s) => `${label(c, s)} off`).join(' · ') || 'Everything on' };
}

// ---------------------------------------------------------------------------------------------
// A · Toggles
// ---------------------------------------------------------------------------------------------

function Toggle({ c, s, act, compact }: { c: Cleaner; s: Setting; act: CleanerTileProps['act']; compact?: boolean }) {
  return (
    <Button
      variant="ghost"
      data-tile-control=""
      aria-pressed={s.on}
      aria-label={label(c, s)}
      isDisabled={off(c)}
      onPress={() => act({ type: 'setting', id: s.id, on: !s.on })}
      className={cn('w-full min-w-0 shrink-0 justify-start gap-2.5 rounded-[12px] px-1.5 font-medium', compact ? 'h-8 text-[12px]' : 'h-10 text-[13px]')}
    >
      {compact ? null : <IconChip icon={iconOf(s)} hue={CH.on} on={s.on} px={28} />}
      <span className="min-w-0 flex-1 truncate text-left">{label(c, s)}</span>
      <span className="relative h-5 w-9 shrink-0 rounded-full transition-colors" style={{ background: s.on ? CH.on : 'color-mix(in srgb, currentColor 18%, transparent)' }}>
        <span className={cn('absolute top-0.5 size-4 rounded-full bg-white shadow transition-[left]', s.on ? 'left-[18px]' : 'left-0.5')} />
      </span>
    </Button>
  );
}

export function SettingsToggles({ c, size, act }: CleanerTileProps) {
  if (!c.settings.length) return <NoSettings size={size} />;
  const sm = summary(c);
  if (size === 'xs') return <XsRow label="Settings" visual={<IconChip icon={Settings02Icon} hue={CH.on} px={36} />} word={sm.word} detail={sm.detail} />;
  const max = size === 'l' ? 7 : size === 'w' ? 4 : 3;
  return (
    <TileFrame label="Settings" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-4' : 'p-2.5')}>
        {size === 'l' ? <TileName className="mb-2 px-1.5 text-[17px]">Settings</TileName> : null}
        <div className={cn('grid min-h-0 gap-0.5 overflow-hidden', size === 'w' && 'grid-cols-2 gap-x-2')}>
          {c.settings.slice(0, max).map((s) => (
            <Toggle key={s.id} c={c} s={s} act={act} compact={size !== 'l'} />
          ))}
        </div>
        {c.settings.length > max ? <TileState className="mt-auto px-1.5 text-[11px]">+{c.settings.length - max} more on Large</TileState> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// B · Pills
// ---------------------------------------------------------------------------------------------

function Pill({ c, s, act, look }: { c: Cleaner; s: Setting; act: CleanerTileProps['act']; look: 'icon' | 'pill' | 'big' }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      isIconOnly={look === 'icon'}
      data-tile-control=""
      aria-pressed={s.on}
      aria-label={label(c, s)}
      isDisabled={off(c)}
      onPress={() => act({ type: 'setting', id: s.id, on: !s.on })}
      className={cn('min-w-0 gap-1.5 rounded-full font-semibold transition-colors', look === 'icon' ? 'size-10 p-0' : look === 'big' ? 'h-10 px-4 text-[13px]' : 'h-8 px-3 text-[12px]', !s.on && 'bg-[color-mix(in_srgb,currentColor_7%,transparent)] opacity-70')}
      style={s.on ? { background: `color-mix(in srgb, ${CH.on} 18%, transparent)`, color: CH.on, boxShadow: `0 0 12px -4px ${CH.on}` } : undefined}
    >
      <HugeiconsIcon icon={iconOf(s)} size={look === 'icon' ? 18 : 14} />
      {look === 'icon' ? null : <span className="truncate">{label(c, s)}</span>}
    </Button>
  );
}

export function SettingsPills({ c, size, act }: CleanerTileProps) {
  if (!c.settings.length) return <NoSettings size={size} />;
  const sm = summary(c);
  if (size === 'xs')
    return (
      <XsRow
        label="Settings"
        visual={
          <span className="flex -space-x-1.5">
            {c.settings.slice(0, 3).map((s) => (
              <IconChip key={s.id} icon={iconOf(s)} hue={CH.on} on={s.on} px={24} className="ring-2 ring-[var(--surface)]" />
            ))}
          </span>
        }
        word={sm.word}
        detail={sm.detail}
      />
    );
  return (
    <TileFrame label="Settings" className="pro-surface">
      <div className={cn('flex h-full flex-col', size === 'l' ? 'p-5' : 'p-3.5')}>
        {size === 's' ? null : <TileName className={size === 'l' ? 'text-[17px]' : undefined}>{size === 'l' ? 'Settings' : sm.word}</TileName>}
        <div className={cn('flex min-h-0 flex-wrap content-start overflow-hidden', size === 's' ? 'gap-2' : 'gap-1.5', size === 'l' ? 'my-auto' : size === 'w' && 'mt-auto')}>
          {c.settings.map((s) => (
            <Pill key={s.id} c={c} s={s} act={act} look={size === 's' ? 'icon' : size === 'l' ? 'big' : 'pill'} />
          ))}
        </div>
        {size === 's' ? (
          <>
            <p className="mt-auto truncate text-[15px] font-semibold">{sm.word}</p>
            <TileState className="text-[12px]">{sm.detail}</TileState>
          </>
        ) : null}
        {size === 'l' ? <TileState className="text-[12px]">{sm.detail} · tap to switch</TileState> : null}
      </div>
    </TileFrame>
  );
}

// ---------------------------------------------------------------------------------------------
// C · Summary
// ---------------------------------------------------------------------------------------------

function Segments({ c, h = 8 }: { c: Cleaner; h?: number }) {
  return (
    <div className="flex w-full gap-1" role="img" aria-label={summary(c).word}>
      {c.settings.map((s) => (
        <span key={s.id} className="min-w-0 flex-1 rounded-full" style={{ height: h, background: s.on ? CH.on : 'color-mix(in srgb, currentColor 12%, transparent)' }} />
      ))}
    </div>
  );
}

export function SettingsSummary({ c, size, act }: CleanerTileProps) {
  if (!c.settings.length) return <NoSettings size={size} />;
  const sm = summary(c);
  if (size === 'xs') return <XsRow label="Settings" visual={<IconChip icon={Settings02Icon} hue={CH.on} px={36} />} word={sm.word} detail={sm.detail} />;
  if (size !== 'l')
    return (
      <TileFrame label="Settings" className="pro-surface">
        <div className="flex h-full flex-col p-3.5">
          <IconChip icon={Settings02Icon} hue={CH.on} px={32} />
          <p className="mt-auto text-[20px] font-semibold tracking-[-0.02em]">{sm.word}</p>
          <TileState className="text-[12px]">{sm.detail}</TileState>
          <div className="mt-2">
            <Segments c={c} h={size === 'w' ? 8 : 6} />
          </div>
        </div>
      </TileFrame>
    );
  return (
    <TileFrame label="Settings" className="pro-surface">
      <div className="flex h-full flex-col p-4">
        <p className="px-1.5 text-[24px] font-semibold tracking-[-0.02em]">{sm.word}</p>
        <div className="mt-2 px-1.5">
          <Segments c={c} />
        </div>
        {/* Every setting, scrolling when there are more than fit (integrations can offer dozens). */}
        <div className="-mx-1 mt-3 min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 [mask-image:linear-gradient(to_bottom,transparent,black_8px,black_calc(100%-16px),transparent)]" data-tile-control="">
          <div className="flex flex-col gap-0.5 py-1">
            {c.settings.map((s) => (
              <Toggle key={s.id} c={c} s={s} act={act} />
            ))}
          </div>
        </div>
      </div>
    </TileFrame>
  );
}
