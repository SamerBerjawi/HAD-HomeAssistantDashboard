/**
 * Design C · Perimeter line (innovative). The answer is one line of words beside a "perimeter":
 * one short bar per device and camera, grouped by kind, coloured by state, so the whole house
 * reads at a glance and one wrong bar stands out. Modes sit on the same surface. Cameras follow as
 * an even wall. Everything else lives in three tabs below the cameras: Needs you, Devices, Activity.
 */
import { useState } from 'react';
import { Button, Tabs } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Alert02Icon, Clock01Icon, GridViewIcon, SquareLock02Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import { CALM } from '../../../../areas/tiles/security/securityParts';
import type { LockTileModel } from '../../../../areas/tileTypes';
import { hasUnlocked, securityIssues, securityVerdict, type StudioCamera, type StudioDevice, type Tone } from '../studioSecurity';
import { ago, CameraView, cameraLine, clock, EVENT_ICON, ModePicker, TONE, type DesignProps } from './parts';

type Bar = { id: string; name: string; tone: Tone | 'offline' };

function barTone(d: StudioDevice | StudioCamera): Bar['tone'] {
  if (!d.available) return 'offline';
  if (d.kind === 'lock') return (d as LockTileModel).state === 'locked' ? 'calm' : (d as LockTileModel).state === 'jammed' ? 'danger' : 'warning';
  if (d.kind === 'opening') return d.isOn ? 'warning' : 'calm';
  if (d.kind === 'safety' || d.kind === 'siren') return d.isOn ? 'danger' : 'calm';
  if (d.kind === 'cover') return d.isOn ? 'warning' : 'calm';
  return 'calm';
}

const KINDS: { id: (StudioDevice | StudioCamera)['kind']; label: string }[] = [
  { id: 'lock', label: 'Locks' },
  { id: 'opening', label: 'Openings' },
  { id: 'motion', label: 'Motion' },
  { id: 'safety', label: 'Safety' },
  { id: 'camera', label: 'Cameras' }
];

function Perimeter({ all }: { all: (StudioDevice | StudioCamera)[] }) {
  return (
    <div role="list" aria-label="Every device" className="flex flex-wrap gap-x-5 gap-y-3">
      {KINDS.map((k) => {
        const list = all.filter((d) => d.kind === k.id);
        if (!list.length) return null;
        return (
          <div key={k.id} role="listitem" className="flex flex-col gap-1.5">
            <div className="flex gap-1">
              {list.map((d) => {
                const t = barTone(d);
                return <span key={d.entityId} title={d.name} className={cn('h-6 w-2.5 rounded-full', t === 'offline' && 'opacity-40')} style={{ background: t === 'offline' ? CALM : TONE[t] }} />;
              })}
            </div>
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">{k.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function deviceWord(d: StudioDevice) {
  if (!d.available) return 'Offline';
  if (d.kind === 'lock') return (d as LockTileModel).state === 'locked' ? 'Locked' : (d as LockTileModel).state === 'jammed' ? 'Jammed' : 'Unlocked';
  if (d.kind === 'opening') return d.isOn ? 'Open' : 'Closed';
  if (d.kind === 'motion') return d.isOn ? 'Motion' : ago(d.lastChanged);
  return d.isOn ? 'Alert' : 'Clear';
}

export default function DesignC({ home, width, act }: DesignProps) {
  const issues = securityIssues(home);
  const v = securityVerdict(home, issues);
  const wide = width >= 900;
  const camCols = width < 560 ? 2 : width < 1000 ? 3 : 5;
  const [tab, setTab] = useState<string>(issues.length ? 'needs' : 'devices');

  return (
    <div className="flex flex-col gap-6">
      {/* 1 · The answer */}
      <section aria-label="Security status" className="pro-surface flex flex-col gap-5 rounded-[26px] p-5">
        <div className={cn('flex gap-5', wide ? 'items-end justify-between' : 'flex-col')}>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[13px] font-medium" style={{ color: TONE[v.tone] }}>
              <span aria-hidden className="size-2 rounded-full" style={{ background: TONE[v.tone] }} />
              {v.detail}
            </p>
            <h2 className={cn('mt-1 font-semibold tracking-tight', width < 500 ? 'text-2xl' : 'text-3xl')}>{v.title}</h2>
          </div>
          <Perimeter all={[...home.devices, ...home.cameras]} />
        </div>
        <ModePicker home={home} act={act} className={wide ? 'max-w-[560px]' : ''} />
      </section>

      {/* 2 · Camera wall */}
      <section aria-label="Cameras" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${camCols}, minmax(0, 1fr))` }}>
        {home.cameras.map((c) => (
          <figure key={c.entityId} className="flex min-w-0 flex-col gap-1">
            <CameraView c={c} radius="rounded-xl" />
            <figcaption className="truncate px-0.5 text-xs">
              <span className="font-medium">{c.name}</span> <span className="text-muted">· {cameraLine(c)}</span>
            </figcaption>
          </figure>
        ))}
      </section>

      {/* 3 · Everything else, in tabs */}
      <Tabs selectedKey={tab} onSelectionChange={(k) => setTab(String(k))}>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Security details" className={cn(wide ? 'w-fit' : 'w-full')}>
            <Tabs.Tab id="needs" className={cn("flex-1 gap-1.5 whitespace-nowrap", !wide && "gap-1 px-2 text-[13px]")}>
              <HugeiconsIcon icon={Alert02Icon} size={16} />
              Needs you{issues.length ? ` · ${issues.length}` : ''}
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="devices" className={cn("flex-1 gap-1.5 whitespace-nowrap", !wide && "gap-1 px-2 text-[13px]")}>
              <HugeiconsIcon icon={GridViewIcon} size={16} />
              Devices
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="activity" className={cn("flex-1 gap-1.5 whitespace-nowrap", !wide && "gap-1 px-2 text-[13px]")}>
              <HugeiconsIcon icon={Clock01Icon} size={16} />
              Activity
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="needs" className="px-0 pt-4">
          {issues.length ? (
            <div className="flex flex-col gap-2">
              {issues.map((i) => (
                <div key={i.id} className="pro-surface flex min-h-14 items-center gap-3 rounded-2xl px-4 py-2">
                  <span aria-hidden className="h-8 w-1 shrink-0 rounded-full" style={{ background: TONE[i.tone] }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{i.text}</p>
                    {i.area ? <p className="text-xs text-muted">{i.area}</p> : null}
                  </div>
                  {i.fix ? (
                    <Button size="sm" variant="secondary" onPress={() => i.fix && act(i.fix.action)}>
                      {i.fix.label}
                    </Button>
                  ) : null}
                </div>
              ))}
              {hasUnlocked(home) && issues.filter((i) => i.fix?.action.type === 'device').length > 1 ? (
                <Button variant="tertiary" className="gap-1.5 self-start" onPress={() => act({ type: 'lockAll' })}>
                  <HugeiconsIcon icon={SquareLock02Icon} size={16} />
                  Lock all
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-muted">Nothing needs you.</p>
          )}
        </Tabs.Panel>

        <Tabs.Panel id="devices" className="px-0 pt-4">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${width < 560 ? 1 : width < 1000 ? 2 : 3}, minmax(0, 1fr))` }}>
            {home.devices.map((d) => {
              const t = barTone(d);
              const lockState = d.kind === 'lock' ? (d as LockTileModel).state : null;
              return (
                <div key={d.entityId} className="pro-surface flex min-h-14 items-center gap-3 rounded-2xl px-4 py-2">
                  <span aria-hidden className={cn('h-8 w-1 shrink-0 rounded-full', t === 'offline' && 'opacity-40')} style={{ background: t === 'offline' ? CALM : TONE[t] }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{d.name}</p>
                    <p className="text-xs text-muted">
                      {d.area} · {deviceWord(d)}
                    </p>
                  </div>
                  {lockState && d.available && lockState !== 'jammed' ? (
                    <Button size="sm" variant="ghost" onPress={() => act({ type: 'device', id: d.entityId, action: { type: 'lock', cmd: lockState === 'locked' ? 'unlock' : 'lock' } })}>
                      {lockState === 'locked' ? 'Unlock' : 'Lock'}
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Tabs.Panel>

        <Tabs.Panel id="activity" className="px-0 pt-4">
          <ol className="flex flex-col gap-1">
            {home.events.map((e) => (
              <li key={e.id} className="flex min-h-11 items-center gap-3">
                <span className="w-12 shrink-0 font-mono text-xs tabular-nums text-muted">{clock(e.at)}</span>
                <HugeiconsIcon icon={EVENT_ICON[e.kind]} size={16} style={{ color: e.tone === 'calm' ? 'var(--muted)' : TONE[e.tone] }} />
                <span className="text-sm">{e.text}</span>
              </li>
            ))}
          </ol>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
