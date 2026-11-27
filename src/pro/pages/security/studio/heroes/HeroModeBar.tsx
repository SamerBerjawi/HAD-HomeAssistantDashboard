/**
 * Hero 1 · Mode bar (refines round 1's B). Shield, words and the four modes in one bar. Home is
 * a tap; Away, Night and turning an armed alarm off are press-and-hold: the segment fills while
 * held, an early release says "Hold". The code sheet follows when HA asks for one.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { useHold } from '../../../../widgets/shared/useHold';
import { ARM_MODES, isCritical, securityVerdict, type ArmMode, type StudioHome } from '../studioSecurity';
import { MODE_ICON, type DesignProps } from '../designs/parts';
import { FixPills, HeroSurface, ShieldTile, useArm, Words } from './heroKit';

function Segment({ home, mode, arm }: { home: StudioHome; mode: (typeof ARM_MODES)[number]; arm: (m: ArmMode) => void }) {
  const active = home.alarm.state === mode.id;
  const critical = !active && isCritical(home, mode.id);
  const hold = useHold(() => arm(mode.id), 900);
  return (
    <Button
      variant="ghost"
      aria-pressed={active}
      aria-label={critical ? `${mode.label} (press and hold)` : mode.label}
      {...(critical ? hold.pressProps : { onPress: () => !active && arm(mode.id) })}
      className={cn('relative h-11 flex-1 overflow-hidden rounded-full px-2 text-sm', active ? 'bg-[var(--accent)] text-[var(--accent-foreground)] data-[hovered=true]:bg-[var(--accent)]' : 'text-foreground')}
    >
      <span aria-hidden className="absolute inset-y-0 left-0 bg-[color-mix(in_oklab,var(--accent)_35%,transparent)]" style={{ width: `${hold.progress * 100}%` }} />
      <span className="relative inline-flex items-center gap-1.5">
        <HugeiconsIcon icon={MODE_ICON[mode.id]} size={16} />
        {hold.hint ? 'Hold' : mode.label}
      </span>
    </Button>
  );
}

export default function HeroModeBar({ home, width, act }: DesignProps) {
  const v = securityVerdict(home);
  const wide = width >= 900;
  const { arm, sheet } = useArm(home, act);
  return (
    <HeroSurface home={home}>
      <div className={cn('flex gap-6', wide ? 'items-center justify-between' : 'flex-col')}>
        <div className="flex items-center gap-4">
          <ShieldTile v={v} />
          <Words v={v} width={width} />
        </div>
        <div className={cn('flex flex-col gap-1.5', wide && 'w-[460px]')}>
          <div role="group" aria-label="Alarm mode" className="flex gap-1 rounded-full bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] p-1">
            {ARM_MODES.map((m) => (
              <Segment key={m.id} home={home} mode={m} arm={arm} />
            ))}
          </div>
          <p className="px-3 text-xs text-muted">{home.alarm.state === 'disarmed' ? 'Press and hold Away or Night to arm.' : 'Press and hold Off, Away or Night to change.'}</p>
        </div>
      </div>
      <div className="mt-6 empty:hidden">
        <FixPills home={home} act={act} />
      </div>
      {sheet}
    </HeroSurface>
  );
}
