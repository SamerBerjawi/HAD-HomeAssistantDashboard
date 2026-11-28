/**
 * Hero 2 · Orb. The shield becomes one big glowing button in the state's colour. It offers the
 * obvious next step (off when armed, Away when nobody is home, else Home): press and hold it, a
 * ring fills, the mode changes. Small chips under it pick another mode for the orb.
 */
import { useState } from 'react';
import { Button, ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';
import { useHold } from '../../../../widgets/shared/useHold';
import { ARM_MODES, securityVerdict, suggestedMode, type ArmMode } from '../studioSecurity';
import { MODE_ICON, TONE, toneIcon, type DesignProps } from '../designs/parts';
import { actionWord, FixPills, HeroSurface, useArm, Words } from './heroKit';

const R = 46;
const C = 2 * Math.PI * R;

export default function HeroOrb({ home, width, act }: DesignProps) {
  const v = securityVerdict(home);
  const wide = width >= 900;
  const tone = TONE[v.tone];
  const { arm, sheet } = useArm(home, act);
  // The orb's target resets to the suggestion whenever the alarm changes.
  const [choice, setChoice] = useState<{ for: string; mode: ArmMode } | null>(null);
  const target = choice?.for === home.alarm.state ? choice.mode : suggestedMode(home);
  const hold = useHold(() => arm(target), 1000);
  const size = width < 500 ? 132 : 156;
  const others = ARM_MODES.filter((m) => m.id !== home.alarm.state);

  return (
    <HeroSurface home={home}>
      <div className={cn('flex gap-6', wide ? 'items-center' : 'flex-col items-center text-center')}>
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="ghost"
            aria-label={`${actionWord(target)} (press and hold)`}
            {...hold.pressProps}
            className="relative h-auto min-w-0 rounded-full p-0 data-[hovered=true]:bg-transparent"
            style={{ width: size, height: size }}
          >
            <span aria-hidden className="absolute inset-3 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, color-mix(in oklab, ${tone} 70%, white), ${tone})`, boxShadow: `0 18px 50px -12px ${tone}` }} />
            <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
              <circle cx="50" cy="50" r={R} fill="none" stroke="color-mix(in oklab, var(--foreground) 10%, transparent)" strokeWidth="3" />
              <circle cx="50" cy="50" r={R} fill="none" stroke={tone} strokeWidth="3.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - hold.progress)} />
            </svg>
            <span className="relative flex flex-col items-center gap-1 text-white">
              <HugeiconsIcon icon={hold.progress > 0 ? MODE_ICON[target] : toneIcon(v.tone)} size={Math.round(size * 0.3)} style={{ width: Math.round(size * 0.3), height: Math.round(size * 0.3) }} />
            </span>
          </Button>
          <span className="text-sm font-medium">{hold.hint ? 'Keep holding' : `Hold to ${actionWord(target).toLowerCase()}`}</span>
        </div>

        <div className={cn('flex min-w-0 flex-col gap-4', wide ? 'flex-1' : 'items-center')}>
          <Words v={v} width={width} />
          <ToggleButtonGroup
            aria-label="Mode for the orb"
            size="sm"
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([target])}
            onSelectionChange={(k) => {
              const m = [...k][0] as ArmMode | undefined;
              if (m) setChoice({ for: home.alarm.state, mode: m });
            }}
            className="flex-wrap"
          >
            {others.map((m) => (
              <ToggleButton key={m.id} id={m.id} className="gap-1.5">
                <HugeiconsIcon icon={MODE_ICON[m.id]} size={14} />
                {m.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <div className={cn(!wide && 'flex justify-center')}>
            <FixPills home={home} act={act} />
          </div>
        </div>
      </div>
      {sheet}
    </HeroSurface>
  );
}
