/**
 * The Security hero: Slide (owner pick, round 2, docs/pro-ui/SECURITY.md §4) with the Summary line
 * (round 3). Shield and words on top; under them the modes in one segmented row (HeroUI
 * ToggleButtonGroup, the current one selected). Home arms with a plain tap; a
 * critical change (Away, Night, turning an armed alarm off) opens one wide track under the chips,
 * "slide to arm Away", like the Door locks widget's slide to unlock. The track shows only after a
 * mode is pressed (owner, 2026-11-26); the current mode or × closes it. Compact on phones. With no alarm panel in HA,
 * only the answer shows.
 */
import { useRef, useState, type ComponentType } from 'react';
import { Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowRight01Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { useSlideToConfirm } from '../../widgets/shared/useSlideToConfirm';
import { ARM_MODES, isCritical, securityVerdict, type ArmMode } from '../../lib/securityPage';
import { MODE_ICON, TONE, type DesignProps } from './parts';
import { actionWord, FixPills, HeroSurface, ShieldTile, useArm, Words } from './heroKit';
import { NeedsSummary, type NeedsProps } from './NeedsSummary';

const KNOB = 44;

export default function SecurityHero({ home, width, act, Needs = NeedsSummary }: DesignProps & { Needs?: ComponentType<NeedsProps> }) {
  const v = securityVerdict(home);
  const wide = width >= 900;
  const phone = width < 500;
  const { arm, sheet } = useArm(home, act);
  const [choice, setChoice] = useState<{ for: string; mode: ArmMode } | null>(null);
  // The picked critical mode; it lapses on its own once the alarm state moves on.
  const target = choice?.for === home.alarm.state ? choice.mode : null;
  const current = ARM_MODES.some((m) => m.id === home.alarm.state) ? (home.alarm.state as ArmMode) : null;
  const rail = useRef<HTMLDivElement>(null);
  const slide = useSlideToConfirm({
    onConfirm: () => {
      if (target) arm(target);
    },
    travel: () => (rail.current?.clientWidth ?? 0) - KNOB - 8,
    dir: 1
  });
  const tone = target === 'disarmed' ? TONE.calm : 'var(--accent)';
  const word = target ? actionWord(target).toLowerCase() : '';
  const hasPanel = home.alarm.entityId !== null && home.alarm.modes.length > 1;
  const shown = target ?? current;

  const pick = (id: ArmMode | undefined) => {
    if (!id || id === current) return setChoice(null);
    if (isCritical(home, id)) return setChoice({ for: home.alarm.state, mode: id });
    setChoice(null);
    arm(id);
  };

  return (
    <HeroSurface home={home}>
      <div className={cn('grid', phone ? 'gap-4' : 'gap-5', wide && hasPanel && 'grid-cols-[minmax(0,1fr)_400px] items-center gap-8')}>
        <div className={cn('flex items-center', phone ? 'gap-3' : 'gap-4')}>
          <ShieldTile v={v} size={phone ? 44 : 52} />
          <Words v={v} width={width} />
        </div>

        {hasPanel ? (
          <div className="flex flex-col gap-2">
            <ToggleButtonGroup
              aria-label="Alarm mode"
              size="sm"
              selectionMode="single"
              className="w-full"
              selectedKeys={shown ? new Set([shown]) : new Set<string>()}
              onSelectionChange={(keys) => pick([...keys][0] as ArmMode | undefined)}
            >
              {ARM_MODES.filter((m) => home.alarm.modes.includes(m.id)).map((m) => (
                <ToggleButton key={m.id} id={m.id} aria-label={m.id === current ? `${m.label} (now)` : m.label} className="min-w-0 flex-1 gap-1.5 px-1">
                  <HugeiconsIcon icon={MODE_ICON[m.id]} size={15} className="shrink-0" />
                  <span className="truncate">{m.label}</span>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {target ? (
              <div className="flex items-center gap-1.5">
                <div ref={rail} className="relative h-[52px] min-w-0 flex-1 select-none rounded-full bg-[color-mix(in_oklab,var(--foreground)_7%,transparent)]">
                  <span aria-hidden className="absolute inset-y-0 left-0 rounded-full" style={{ width: `calc(${slide.progress} * (100% - ${KNOB + 8}px) + ${KNOB + 8}px)`, background: `color-mix(in oklab, ${tone} 22%, transparent)` }} />
                  <span className="pointer-events-none absolute inset-0 grid place-items-center pl-10 text-sm font-medium text-muted" style={{ opacity: 1 - slide.progress }}>
                    Slide to {word}
                  </span>
                  <span
                    role="slider"
                    tabIndex={0}
                    aria-label={`Slide to ${word}`}
                    aria-orientation="horizontal"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(slide.progress * 100)}
                    {...slide.moveProps}
                    className="absolute top-1 grid cursor-grab touch-none place-items-center rounded-full text-white shadow-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] active:cursor-grabbing"
                    style={{ width: KNOB, height: KNOB, left: `calc(${slide.progress} * (100% - ${KNOB + 8}px) + 4px)`, background: tone }}
                  >
                    <HugeiconsIcon icon={slide.armed ? MODE_ICON[target] : ArrowRight01Icon} size={18} />
                  </span>
                </div>
                <Button isIconOnly size="sm" variant="ghost" aria-label="Cancel" onPress={() => setChoice(null)} className="size-10 shrink-0 rounded-full">
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className={cn('empty:hidden', phone ? 'mt-3' : 'mt-4')}>
        {Needs ? <Needs home={home} act={act} width={width} /> : <FixPills home={home} act={act} />}
      </div>
      {sheet}
    </HeroSurface>
  );
}
