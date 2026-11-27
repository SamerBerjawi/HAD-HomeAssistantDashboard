/**
 * Design A · Quiet column (refined). The answer is plain type on the page, not a card: a tone dot,
 * a few words, one line, and the four modes. Only when something is wrong does a short list of
 * fixes appear under it. Cameras follow as a calm grid with the name below each view. Below the
 * cameras: devices as quiet rows by kind, and today's activity, side by side on wide screens.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { SquareLock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { LockTileModel } from '../../../../areas/tileTypes';
import { hasUnlocked, securityIssues, securityVerdict, type StudioDevice } from '../studioSecurity';
import { ago, CameraView, cameraLine, clock, EVENT_ICON, ModePicker, TONE, toneIcon, type DesignProps } from './parts';

const GROUPS: { id: StudioDevice['kind']; title: string }[] = [
  { id: 'lock', title: 'Locks' },
  { id: 'opening', title: 'Doors & windows' },
  { id: 'motion', title: 'Motion' },
  { id: 'safety', title: 'Smoke & water' }
];

function deviceState(d: StudioDevice): { text: string; warn: boolean } {
  if (!d.available) return { text: 'Offline', warn: true };
  switch (d.kind) {
    case 'lock': {
      const s = (d as LockTileModel).state;
      return { text: s === 'locked' ? 'Locked' : s === 'jammed' ? 'Jammed' : 'Unlocked', warn: s !== 'locked' };
    }
    case 'opening':
      return { text: d.isOn ? `Open ${ago(d.lastChanged).replace(' ago', '')}` : 'Closed', warn: d.isOn };
    case 'motion':
      return { text: d.isOn ? 'Motion now' : `Quiet · ${ago(d.lastChanged).toLowerCase()}`, warn: false };
    case 'safety':
      return { text: d.isOn ? (d.deviceClass === 'moisture' ? 'Water!' : 'Smoke!') : 'Clear', warn: d.isOn };
    case 'cover':
      return { text: d.isOn ? 'Open' : 'Closed', warn: d.isOn };
    case 'siren':
      return { text: d.isOn ? 'Sounding' : 'Quiet', warn: d.isOn };
  }
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted">{children}</h3>;
}

export default function DesignA({ home, width, act }: DesignProps) {
  const issues = securityIssues(home);
  const v = securityVerdict(home, issues);
  const wide = width >= 900;
  const camCols = width < 560 ? 1 : width < 900 ? 2 : 3;

  return (
    <div className="flex flex-col gap-10">
      {/* 1 · The answer */}
      <section aria-label="Security status" className={cn('flex flex-col gap-5', wide && 'max-w-[720px]')}>
        <div className="flex items-start gap-3">
          <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in oklab, ${TONE[v.tone]} 16%, transparent)`, color: TONE[v.tone] }}>
            <HugeiconsIcon icon={toneIcon(v.tone)} size={20} />
          </span>
          <div className="min-w-0">
            <h2 className={cn('font-semibold tracking-tight', width < 500 ? 'text-[26px] leading-8' : 'text-[34px] leading-10')}>{v.title}</h2>
            <p className="mt-1 text-[15px] text-muted">{v.detail}</p>
          </div>
        </div>

        {issues.length > 1 || (issues.length === 1 && issues[0].fix) ? (
          <ul aria-label="Needs you" className="flex flex-col">
            {issues.map((i) => (
              <li key={i.id} className="flex min-h-12 items-center gap-3 border-t border-[color-mix(in_oklab,var(--foreground)_8%,transparent)] py-1.5">
                <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: TONE[i.tone] }} />
                <span className="min-w-0 flex-1 truncate text-[15px]">{i.text}</span>
                {i.area ? <span className="hidden shrink-0 text-sm text-muted sm:inline">{i.area}</span> : null}
                {i.fix ? (
                  <Button size="sm" variant="secondary" onPress={() => i.fix && act(i.fix.action)}>
                    {i.fix.label}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <ModePicker home={home} act={act} className="max-w-[520px]" />
          {hasUnlocked(home) && issues.filter((i) => i.fix?.action.type === 'device').length > 1 ? (
            <Button variant="tertiary" className="gap-1.5" onPress={() => act({ type: 'lockAll' })}>
              <HugeiconsIcon icon={SquareLock02Icon} size={16} />
              Lock all
            </Button>
          ) : null}
        </div>
      </section>

      {/* 2 · Cameras */}
      <section aria-label="Cameras" className="flex flex-col gap-3">
        <SectionTitle>Cameras</SectionTitle>
        <div className="grid gap-x-4 gap-y-5" style={{ gridTemplateColumns: `repeat(${camCols}, minmax(0, 1fr))` }}>
          {home.cameras.map((c) => (
            <figure key={c.entityId} className="flex min-w-0 flex-col gap-2">
              <CameraView c={c} />
              <figcaption className="flex items-baseline justify-between gap-2 px-0.5">
                <span className="truncate text-[15px] font-medium">{c.name}</span>
                <span className="shrink-0 text-[13px] text-muted">{cameraLine(c)}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* 3 · Devices and today */}
      <div className={cn('grid gap-10', wide && 'grid-cols-[minmax(0,3fr)_minmax(0,2fr)]')}>
        <section aria-label="Devices" className="flex flex-col gap-6">
          {GROUPS.map((g) => {
            const list = home.devices.filter((d) => d.kind === g.id);
            if (!list.length) return null;
            return (
              <div key={g.id} className="flex flex-col gap-1">
                <SectionTitle>{g.title}</SectionTitle>
                <ul className="flex flex-col">
                  {list.map((d) => {
                    const s = deviceState(d);
                    const isLock = d.kind === 'lock';
                    const lockState = isLock ? (d as LockTileModel).state : null;
                    return (
                      <li key={d.entityId} className="flex min-h-12 items-center gap-3 border-b border-[color-mix(in_oklab,var(--foreground)_7%,transparent)] py-1">
                        <span className="min-w-0 flex-1 truncate text-[15px]">{d.name}</span>
                        <span className="shrink-0 text-sm text-muted">{d.area}</span>
                        <span className="w-28 shrink-0 text-right text-sm font-medium" style={{ color: s.warn ? TONE.warning : undefined }}>
                          {s.text}
                        </span>
                        {isLock && d.available && lockState !== 'jammed' ? (
                          <Button size="sm" variant="ghost" className="w-20 shrink-0" onPress={() => act({ type: 'device', id: d.entityId, action: { type: 'lock', cmd: lockState === 'locked' ? 'unlock' : 'lock' } })}>
                            {lockState === 'locked' ? 'Unlock' : 'Lock'}
                          </Button>
                        ) : isLock ? (
                          <span className="w-20 shrink-0" />
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </section>

        <section aria-label="Today" className="flex flex-col gap-1">
          <SectionTitle>Today</SectionTitle>
          <ol className="flex flex-col">
            {home.events.slice(0, 8).map((e) => (
              <li key={e.id} className="flex min-h-11 items-center gap-3 py-1">
                <span className="w-12 shrink-0 text-[13px] tabular-nums text-muted">{clock(e.at)}</span>
                <HugeiconsIcon icon={EVENT_ICON[e.kind]} size={16} className="shrink-0" style={{ color: e.tone === 'calm' ? 'var(--muted)' : TONE[e.tone] }} />
                <span className="min-w-0 flex-1 text-[15px]">{e.text}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
