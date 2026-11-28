/**
 * Doors & windows, Safety and Motion details (sheet kit, WIDGET_DESIGN.md §8): one sheet for the
 * three sensor groups. Hero: the headline in the group's state colour (red for leak or smoke,
 * amber for anything open, blue for motion, green when all is clear). Filter: All, the active
 * ones, and each kind in the group; rooms as grouped lists with the state and since when. The kind
 * in the URL opens that filter (`?sheet=openings&id=windows`). Read only: sensors have no controls.
 * Owner review (2026-11-20): every row says when it last triggered, rooms and rows most recent first.
 */
import { useMemo, useState } from 'react';
import { SENSOR_DOMAIN_ICON } from '../../components/overview/SensorOpeningWidgets';
import type { ProOverviewSensorDomain, ProOverviewSensorItem } from '../../lib/overviewSecurity';
import { roomsByRecent, sensorWhen } from '../../lib/sensorTimes';
import { DetailSheet, groupBy, matches, SEARCH_FROM, SheetEmpty, SheetFilter, SheetHero, SheetRow, SheetSearch, SheetSection, type HeroTone } from '../shared/sheet/SheetKit';
import type { WidgetSheetProps } from '../types';
import { domainShortLabel, SENSOR_GROUP_DOMAINS, type SensorGroupModel } from './sensorGroup';

const TITLE = { openings: 'Doors & windows', safety: 'Leak & smoke', motion: 'Motion' } as const;
const ACTIVE = { openings: 'Open', safety: 'Detected', motion: 'Motion' } as const;

export default function SensorGroupSheet({ model: m, itemId, onClose }: WidgetSheetProps<SensorGroupModel>) {
  const domains = SENSOR_GROUP_DOMAINS[m.kind];
  const [filter, setFilter] = useState<string>(domains.includes(itemId as ProOverviewSensorDomain) ? (itemId as string) : 'all');
  const [query, setQuery] = useState('');
  const shown = useMemo(() => m.items.filter((i) => (filter === 'all' || (filter === 'active' ? i.isActive : i.domain === filter)) && matches(query, i.name, i.roomName)), [m.items, filter, query]);
  // Rooms and rows by most recent activity (owner review 2026-11-20), active ones first.
  const rooms = roomsByRecent(groupBy(shown, (i) => i.roomName, ['Other']));
  const tone: HeroTone = m.totalCount === 0 ? 'slate' : m.isCritical ? 'danger' : m.activeCount > 0 ? (m.kind === 'motion' ? 'blue' : 'warning') : 'secure';
  const row = (i: ProOverviewSensorItem) => (
    <SheetRow
      key={i.entityId}
      icon={SENSOR_DOMAIN_ICON[i.domain]}
      tone={i.isOffline ? 'default' : i.isActive ? (i.domain === 'leak' || i.domain === 'smoke' ? 'danger' : m.kind === 'motion' ? 'active' : 'warning') : 'success'}
      title={i.shortName}
      subtitle={sensorWhen(i)}
    />
  );
  return (
    <DetailSheet
      title={`${TITLE[m.kind]} details`}
      onClose={onClose}
      hero={<SheetHero icon={SENSOR_DOMAIN_ICON[domains[0]]} eyebrow={TITLE[m.kind]} tone={tone} headline={m.totalCount === 0 ? 'No sensors' : m.headlineText} sub={m.detailText} onClose={onClose} />}
      toolbar={
        m.totalCount > 0 ? (
          <>
            <SheetFilter
              label={`Show ${TITLE[m.kind].toLowerCase()}`}
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'all', label: 'All', count: m.totalCount },
                { id: 'active', label: ACTIVE[m.kind], count: m.activeCount },
                ...(domains.length > 1 ? domains.map((d) => ({ id: d, label: domainShortLabel(d), icon: SENSOR_DOMAIN_ICON[d], count: m.items.filter((i) => i.domain === d).length })) : [])
              ]}
            />
            {m.totalCount >= SEARCH_FROM ? <SheetSearch value={query} onChange={setQuery} placeholder="Search sensors or rooms" label="Search sensors" /> : null}
          </>
        ) : null
      }
    >
      {m.totalCount === 0 ? (
        <SheetEmpty icon={SENSOR_DOMAIN_ICON[domains[0]]} title="No sensors yet" text="Binary sensors from Home Assistant show up here." />
      ) : rooms.length === 0 ? (
        <SheetEmpty icon={SENSOR_DOMAIN_ICON[domains[0]]} title={filter === 'active' ? 'All clear' : 'No sensors match'} text={filter === 'active' ? 'Nothing is active right now.' : undefined} />
      ) : (
        rooms.map((g) => (
          <SheetSection key={g.key} title={g.key} aside={g.items.some((i) => i.isActive) ? `${g.items.filter((i) => i.isActive).length} ${ACTIVE[m.kind].toLowerCase()}` : undefined}>
            {g.items.map(row)}
          </SheetSection>
        ))
      )}
    </DetailSheet>
  );
}
