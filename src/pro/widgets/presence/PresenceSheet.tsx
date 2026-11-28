/**
 * People details (sheet kit, WIDGET_DESIGN.md §8). Hero: who is home (green when everyone is,
 * blue when some are out, night when nobody is). A person choice, the map on that person, and
 * every person as a row with where they are, since when and their phone battery.
 */
import { lazy, Suspense, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BatteryCharging01Icon, BatteryFullIcon, BatteryLowIcon, Clock01Icon, Home01Icon, Location01Icon, SmartPhone01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { PersonAvatarBadge } from '../../components/overview/PresenceWidget';
import type { ProOverviewPresenceModel, ProPersonPresenceItem } from '../../lib/overviewPresence';
import { DetailSheet, SheetEmpty, SheetFilter, SheetHero, SheetRow, SheetSection } from '../shared/sheet/SheetKit';
import type { WidgetSheetProps } from '../types';

const LazyPresenceMap = lazy(() => import('../../components/overview/PresenceMap'));
const batteryIcon = (p: ProPersonPresenceItem) => (p.isCharging ? BatteryCharging01Icon : (p.batteryPct ?? 100) < 20 ? BatteryLowIcon : BatteryFullIcon);

export default function PresenceSheet({ model: m, itemId, onClose }: WidgetSheetProps<ProOverviewPresenceModel>) {
  const serverUrl = useAutoLayoutStore((s) => s.serverUrl);
  const [selected, setSelected] = useState<string | null>(itemId ?? m.members[0]?.entityId ?? null);
  const person = m.members.find((p) => p.entityId === selected) ?? m.members[0] ?? null;
  const away = m.members.filter((p) => !p.isHome);
  const hasMap = m.members.some((p) => p.latitude !== undefined && p.longitude !== undefined);
  return (
    <DetailSheet
      title="People details"
      onClose={onClose}
      hero={
        <SheetHero
          icon={UserGroupIcon}
          eyebrow="People"
          tone={m.totalCount === 0 ? 'slate' : m.homeCount === m.totalCount ? 'secure' : m.homeCount === 0 ? 'night' : 'blue'}
          headline={m.totalCount === 0 ? 'No people' : m.homeCount === m.totalCount ? 'Everyone is home' : m.homeCount === 0 ? 'Nobody is home' : `${m.homeCount} of ${m.totalCount} home`}
          sub={away.length > 0 && away.length <= 3 ? away.map((p) => `${p.firstName} · ${p.locationLabel}`).join(', ') : m.subtitleSummary}
          onClose={onClose}
        />
      }
      toolbar={
        m.members.length > 1 && person ? (
          <SheetFilter
            label="Person"
            value={person.entityId}
            onChange={setSelected}
            options={m.members.map((p) => ({ id: p.entityId, label: p.firstName, icon: p.isHome ? Home01Icon : Location01Icon }))}
          />
        ) : null
      }
    >
      {!person ? (
        <SheetEmpty icon={UserGroupIcon} title="No people yet" text="People from Home Assistant (person entities) show up here." />
      ) : (
        <>
          {hasMap ? (
            <SheetSection title="Everyone on the map" aside={person.firstName ? `${person.firstName} highlighted` : undefined} plain>
              <div className="overflow-hidden rounded-[18px]">
                <Suspense fallback={<div className="h-[260px] rounded-[18px] bg-default/50" />}>
                  <LazyPresenceMap variant="sheet" height={260} zoom={14} fitAll members={m.members} activeMemberId={person.entityId} onSelectMember={setSelected} />
                </Suspense>
              </div>
            </SheetSection>
          ) : null}
          <SheetSection title={person.name}>
            <SheetRow
              icon={person.isHome ? Home01Icon : Location01Icon}
              tone={person.isHome ? 'success' : 'active'}
              title={person.statusLabel}
              subtitle={person.locationLabel !== person.statusLabel ? person.locationLabel : undefined}
            />
            {person.lastUpdatedRelative || person.lastUpdatedFormatted ? (
              <SheetRow icon={Clock01Icon} title="Last update" trailing={<span className="text-sm text-muted">{person.lastUpdatedRelative ?? person.lastUpdatedFormatted}</span>} />
            ) : null}
            {person.batteryPct !== undefined ? (
              <SheetRow
                icon={batteryIcon(person)}
                tone={person.batteryTone === 'danger' ? 'danger' : person.batteryTone === 'warning' ? 'warning' : 'default'}
                title={person.deviceName || 'Phone battery'}
                trailing={
                  <span className="text-sm font-medium tabular-nums">
                    {person.batteryPct}%{person.isCharging ? ' · charging' : ''}
                  </span>
                }
              />
            ) : person.deviceName ? (
              <SheetRow icon={SmartPhone01Icon} title={person.deviceName} />
            ) : null}
            {person.osmUrl ? (
              <li className="px-3 py-2.5">
                <a href={person.osmUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] hover:underline">
                  <HugeiconsIcon icon={Location01Icon} size={15} />
                  Open in OpenStreetMap
                </a>
              </li>
            ) : null}
          </SheetSection>
          {m.members.length > 1 ? (
            <SheetSection title="Everyone" aside={`${m.homeCount} home`}>
              {m.members.map((p) => (
                <SheetRow
                  key={p.entityId}
                  media={<PersonAvatarBadge member={p} serverUrl={serverUrl} size="md" />}
                  title={p.name}
                  subtitle={[p.locationLabel, p.lastUpdatedRelative].filter(Boolean).join(' · ')}
                  trailing={
                    p.batteryPct !== undefined ? (
                      <span className="flex items-center gap-1 text-xs tabular-nums text-muted">
                        <HugeiconsIcon icon={batteryIcon(p)} size={14} />
                        {p.batteryPct}%
                      </span>
                    ) : null
                  }
                />
              ))}
            </SheetSection>
          ) : null}
        </>
      )}
    </DetailSheet>
  );
}
