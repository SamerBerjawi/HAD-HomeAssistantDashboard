/**
 * Lights and Switches details (sheet kit, WIDGET_DESIGN.md §8). Hero: how many are on (amber
 * when any light is on), brightness and power, All on / All off. Filter All / On / Off, search
 * for long lists, rooms as grouped lists; each row has its switch, and a light that is on and
 * dims gets its brightness slider under it.
 */
import { useMemo, useState } from 'react';
import { BulbIcon, FlashIcon, MoonIcon, PlugSocketIcon, Sun01Icon, ToggleOffIcon, ToggleOnIcon } from '@hugeicons/core-free-icons';
import type { ProControlDomainModel, ProControlItem } from '../../lib/overviewControls';
import { DetailSheet, groupBy, HeroButton, matches, SEARCH_FROM, SheetEmpty, SheetFilter, SheetHero, SheetRow, SheetSearch, SheetSection, SheetSlider } from '../shared/sheet/SheetKit';
import type { WidgetSheetProps } from '../types';
import { ToggleSwitch } from './ControlParts';
import { useControlActions } from './useControlActions';

type Filter = 'all' | 'on' | 'off';

export default function ControlSheet({ model: m, onClose }: WidgetSheetProps<ProControlDomainModel>) {
  const a = useControlActions(m);
  const lights = m.domain === 'lights';
  const noun = lights ? 'lights' : 'switches';
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const shown = useMemo(() => m.items.filter((i) => (filter === 'all' || (filter === 'on') === i.isOn) && matches(query, i.name, i.roomName)), [m.items, filter, query]);
  const rooms = groupBy(shown, (i) => i.roomName, ['Other']);
  const figures = [
    lights && m.avgBrightnessPct !== null && m.onCount > 0 ? `${m.avgBrightnessPct}% average brightness` : null,
    m.totalPowerWatts > 0 ? `${Math.round(m.totalPowerWatts)} W` : null
  ].filter(Boolean);

  const row = (i: ProControlItem) => (
    <SheetRow
      key={i.entityId}
      icon={lights ? BulbIcon : i.isOn ? ToggleOnIcon : ToggleOffIcon}
      tone={i.isOn ? (lights ? 'warning' : 'active') : 'default'}
      title={i.shortName}
      subtitle={[i.isOn ? (i.brightnessPct !== null && lights ? `On · ${i.brightnessPct}%` : 'On') : 'Off', i.powerWatts ? `${Math.round(i.powerWatts)} W` : null].filter(Boolean).join(' · ')}
      trailing={<ToggleSwitch isSelected={i.isOn} onChange={() => a.toggleItem(i)} label={`${i.name} ${i.isOn ? 'on' : 'off'}`} tone={lights ? 'warning' : 'accent'} />}
    >
      {lights && i.isOn && i.supportsBrightness ? (
        <SheetSlider value={i.brightnessPct ?? 100} min={1} label={`${i.name} brightness`} icon={Sun01Icon} warm onCommit={(v) => a.setBrightness(i.entityId, v)} />
      ) : null}
    </SheetRow>
  );

  return (
    <DetailSheet
      title={lights ? 'Lights details' : 'Switches details'}
      onClose={onClose}
      hero={
        <SheetHero
          icon={lights ? BulbIcon : PlugSocketIcon}
          eyebrow={lights ? 'Lights' : 'Switches'}
          tone={m.onCount > 0 ? (lights ? 'amber' : 'blue') : 'slate'}
          headline={m.totalCount === 0 ? `No ${noun}` : m.onCount === 0 ? 'All off' : m.onCount === m.totalCount ? 'All on' : `${m.onCount} of ${m.totalCount} on`}
          sub={figures.length ? figures.join(' · ') : m.totalCount > 0 ? `${m.totalCount} ${noun} in ${new Set(m.items.map((i) => i.roomName)).size} rooms` : undefined}
          onClose={onClose}
          actions={
            m.totalCount > 0 ? (
              <>
                <HeroButton icon={FlashIcon} solid={m.onCount === 0} isDisabled={m.onCount === m.totalCount} onPress={() => void a.toggleAll(true)}>
                  All on
                </HeroButton>
                <HeroButton icon={lights ? MoonIcon : ToggleOffIcon} solid={m.onCount > 0} isDisabled={m.onCount === 0} onPress={() => void a.toggleAll(false)}>
                  All off
                </HeroButton>
              </>
            ) : null
          }
        />
      }
      toolbar={
        m.totalCount > 0 ? (
          <>
            <SheetFilter<Filter>
              label={`Show ${noun}`}
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'all', label: 'All', count: m.totalCount },
                { id: 'on', label: 'On', count: m.onCount },
                { id: 'off', label: 'Off', count: m.totalCount - m.onCount }
              ]}
            />
            {m.totalCount >= SEARCH_FROM ? <SheetSearch value={query} onChange={setQuery} placeholder={`Search ${noun} or rooms`} label={`Search ${noun}`} /> : null}
          </>
        ) : null
      }
    >
      {m.totalCount === 0 ? (
        <SheetEmpty icon={lights ? BulbIcon : PlugSocketIcon} title={`No ${noun} yet`} text={`${lights ? 'Lights' : 'Switches'} from Home Assistant show up here.`} />
      ) : rooms.length === 0 ? (
        <SheetEmpty icon={lights ? BulbIcon : PlugSocketIcon} title={`No ${noun} match`} text="Try another filter or search." />
      ) : (
        rooms.map((g) => (
          <SheetSection key={g.key} title={g.key} aside={`${g.items.filter((i) => i.isOn).length} of ${g.items.length} on`}>
            {g.items.map(row)}
          </SheetSection>
        ))
      )}
    </DetailSheet>
  );
}
