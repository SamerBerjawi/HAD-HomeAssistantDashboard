/**
 * The Security hero's parts (docs/pro-ui/SECURITY.md §4): B's state-lit surface, the words, the
 * code step, and round 2's fix pills (studio only). Shared by the live hero and the studio's hero
 * concepts.
 */
import { useState, type ReactNode } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SquareLock02Icon, VolumeOffIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { AlarmCodeSheet } from '../../components/security/AlarmCodeSheet';
import { ARM_MODES, hasUnlocked, needsCode, securityIssues, securityVerdict, type ArmMode, type SecurityHome, type Verdict } from '../../lib/securityPage';
import { TONE, toneIcon, type DesignProps } from './parts';

export const modeLabel = (m: ArmMode) => ARM_MODES.find((x) => x.id === m)?.label ?? m;
export const actionWord = (m: ArmMode) => (m === 'disarmed' ? 'Turn off' : `Arm ${modeLabel(m)}`);

/** Change the mode, asking for the code first when HA would. */
export function useArm(home: SecurityHome, act: DesignProps['act']) {
  const [pending, setPending] = useState<ArmMode | null>(null);
  const arm = (mode: ArmMode) => {
    if (needsCode(home, mode)) setPending(mode);
    else act({ type: 'arm', mode });
  };
  const sheet = (
    <AlarmCodeSheet
      isOpen={pending !== null}
      actionLabel={pending === 'disarmed' ? 'turn the alarm off' : `arm ${pending ? modeLabel(pending) : ''}`}
      numeric={home.alarm.codeNumeric}
      onCancel={() => setPending(null)}
      onSubmit={(code) => {
        // Home Assistant checks the code; a wrong one comes back as an error toast.
        if (pending) act({ type: 'arm', mode: pending, code });
        setPending(null);
      }}
    />
  );
  return { arm, sheet };
}

export function heroBackground(tone: string) {
  return `radial-gradient(120% 140% at 0% 0%, color-mix(in oklab, ${tone} 30%, transparent), transparent 60%), radial-gradient(80% 120% at 100% 100%, color-mix(in oklab, var(--accent) 18%, transparent), transparent 70%), var(--surface)`;
}

export function ShieldTile({ v, size = 64 }: { v: Verdict; size?: number }) {
  const tone = TONE[v.tone];
  return (
    <span className="grid shrink-0 place-items-center shadow-[0_10px_30px_-10px_currentColor]" style={{ width: size, height: size, borderRadius: Math.round(size * 0.34), background: tone, color: tone }}>
      <HugeiconsIcon icon={toneIcon(v.tone)} size={Math.round(size * 0.47)} className="text-white" />
    </span>
  );
}

export function Words({ v, width, className }: { v: Verdict; width: number; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <h2 className={cn('font-light tracking-tight', width < 500 ? 'text-[22px] leading-7' : 'text-[30px] leading-9')}>{v.title}</h2>
      <p className={cn('mt-0.5 text-muted', width < 500 ? 'text-[13px]' : 'text-sm')}>{v.detail}</p>
    </div>
  );
}

/** Each fix as a quiet pill; Silence leads when the siren sounds. */
export function FixPills({ home, act }: Pick<DesignProps, 'home' | 'act'>) {
  const issues = securityIssues(home);
  if (!(issues.length > 1 || issues[0]?.fix)) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {issues.map((i) =>
        i.id === 'alarm' && i.fix ? (
          <Button key={i.id} variant="danger" className="h-10 gap-1.5 rounded-full" onPress={() => i.fix && act(i.fix.action)}>
            <HugeiconsIcon icon={VolumeOffIcon} size={16} />
            Silence siren
          </Button>
        ) : (
          <span key={i.id} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[color-mix(in_oklab,var(--foreground)_6%,transparent)] py-1 pl-3.5 pr-1.5 text-sm">
            <span aria-hidden className="size-2 rounded-full" style={{ background: TONE[i.tone] }} />
            {i.text}
            {i.fix ? (
              <Button size="sm" variant="primary" className="ml-1 h-8 rounded-full px-3" onPress={() => i.fix && act(i.fix.action)}>
                {i.fix.label}
              </Button>
            ) : (
              <span className="w-1.5" />
            )}
          </span>
        )
      )}
      {issues.filter((i) => i.fix?.action.type === 'device').length > 1 && hasUnlocked(home) ? (
        <Button variant="secondary" className="h-10 gap-1.5 rounded-full" onPress={() => act({ type: 'lockAll' })}>
          <HugeiconsIcon icon={SquareLock02Icon} size={16} />
          Lock all
        </Button>
      ) : null}
    </div>
  );
}

/** B's lit surface. */
export function HeroSurface({ home, children, className }: { home: SecurityHome; children: ReactNode; className?: string }) {
  const v = securityVerdict(home);
  return (
    <section aria-label="Security status" className={cn('relative isolate overflow-hidden rounded-[28px] p-4 sm:p-6', className)} style={{ background: heroBackground(TONE[v.tone]) }}>
      {children}
    </section>
  );
}
