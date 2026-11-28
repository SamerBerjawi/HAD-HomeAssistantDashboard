/**
 * Fans details (sheet kit, WIDGET_DESIGN.md §8). Hero: how many run (teal while any does), average
 * speed, All on / All off. Filter All / Running / Off; rooms as grouped lists; a running fan gets
 * its speed slider and, when it has them, oscillate, direction and preset modes under its row.
 */
import { useMemo, useState } from 'react';
import { Button, ToggleButton } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDataTransferHorizontalIcon, Fan01Icon, FlashIcon, MoonIcon, RepeatIcon } from '@hugeicons/core-free-icons';
import type { ProFanItem, ProFansModel } from '../../lib/overviewAppliances';
import { ToggleSwitch } from '../controls/ControlParts';
import { DetailSheet, groupBy, HeroButton, matches, SEARCH_FROM, SheetEmpty, SheetFilter, SheetHero, SheetRow, SheetSearch, SheetSection, SheetSlider } from '../shared/sheet/SheetKit';
import type { WidgetSheetProps } from '../types';
import { useFanActions } from './useFanActions';

type Filter = 'all' | 'on' | 'off';
const CHIP = 'h-8 gap-1.5 rounded-full px-3 text-xs';

export default function FansSheet({ model: m, onClose }: WidgetSheetProps<ProFansModel>) {
  const a = useFanActions(m);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const shown = useMemo(() => m.items.filter((f) => (filter === 'all' || (filter === 'on') === f.isOn) && matches(query, f.name, f.roomName)), [m.items, filter, query]);
  const rooms = groupBy(shown, (f) => f.roomName, ['Other']);

  const row = (f: ProFanItem) => (
    <SheetRow
      key={f.entityId}
      icon={Fan01Icon}
      tone={f.isOn ? 'active' : 'default'}
      title={f.shortName}
      subtitle={f.isOn ? [f.supportsSpeed ? `${f.percentage}%` : 'On', f.oscillating ? 'oscillating' : null, f.presetMode].filter(Boolean).join(' · ') : 'Off'}
      trailing={<ToggleSwitch isSelected={f.isOn} onChange={() => a.toggleFan(f)} label={`${f.name} ${f.isOn ? 'on' : 'off'}`} />}
    >
      {f.isOn && (f.supportsSpeed || f.supportsOscillation || f.supportsDirection || f.presetModes.length > 0) ? (
        <div className="flex flex-col gap-2">
          {f.supportsSpeed ? <SheetSlider value={f.percentage} min={1} label={`${f.name} speed`} icon={Fan01Icon} onCommit={(v) => a.setSpeed(f.entityId, v)} /> : null}
          <div className="flex flex-wrap gap-1.5">
            {f.supportsOscillation ? (
              <ToggleButton size="sm" isSelected={f.oscillating} onChange={() => a.toggleOscillate(f)} className={CHIP}>
                <HugeiconsIcon icon={RepeatIcon} size={14} />
                Oscillate
              </ToggleButton>
            ) : null}
            {f.supportsDirection ? (
              <Button size="sm" variant="tertiary" onPress={() => a.toggleDirection(f)} className={CHIP} aria-label={`${f.name} direction: ${f.direction ?? 'forward'}. Reverse`}>
                <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={14} />
                {f.direction === 'reverse' ? 'Reverse' : 'Forward'}
              </Button>
            ) : null}
            {f.presetModes.map((p) => (
              <ToggleButton key={p} size="sm" isSelected={f.presetMode === p} onChange={() => a.setPreset(f.entityId, p)} className={CHIP}>
                {p}
              </ToggleButton>
            ))}
          </div>
        </div>
      ) : null}
    </SheetRow>
  );

  return (
    <DetailSheet
      title="Fans details"
      onClose={onClose}
      hero={
        <SheetHero
          icon={Fan01Icon}
          eyebrow="Fans"
          tone={m.onCount > 0 ? 'teal' : 'slate'}
          headline={m.totalCount === 0 ? 'No fans' : m.onCount === 0 ? 'All off' : `${m.onCount} of ${m.totalCount} running`}
          sub={
            [m.avgSpeedPct !== null && m.onCount > 0 ? `${m.avgSpeedPct}% average speed` : null, m.oscillatingCount > 0 ? `${m.oscillatingCount} oscillating` : null].filter(Boolean).join(' · ') ||
            undefined
          }
          onClose={onClose}
          actions={
            m.totalCount > 0 ? (
              <>
                <HeroButton icon={FlashIcon} solid={m.onCount === 0} isDisabled={m.onCount === m.totalCount} onPress={() => void a.toggleAll(true)}>
                  All on
                </HeroButton>
                <HeroButton icon={MoonIcon} solid={m.onCount > 0} isDisabled={m.onCount === 0} onPress={() => void a.toggleAll(false)}>
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
              label="Show fans"
              value={filter}
              onChange={setFilter}
              options={[
                { id: 'all', label: 'All', count: m.totalCount },
                { id: 'on', label: 'Running', count: m.onCount },
                { id: 'off', label: 'Off', count: m.totalCount - m.onCount }
              ]}
            />
            {m.totalCount >= SEARCH_FROM ? <SheetSearch value={query} onChange={setQuery} placeholder="Search fans or rooms" label="Search fans" /> : null}
          </>
        ) : null
      }
    >
      {m.totalCount === 0 ? (
        <SheetEmpty icon={Fan01Icon} title="No fans yet" text="Fans from Home Assistant show up here." />
      ) : rooms.length === 0 ? (
        <SheetEmpty icon={Fan01Icon} title="No fans match" text="Try another filter." />
      ) : (
        rooms.map((g) => (
          <SheetSection key={g.key} title={g.key} aside={`${g.items.filter((f) => f.isOn).length} of ${g.items.length} running`}>
            {g.items.map(row)}
          </SheetSection>
        ))
      )}
    </DetailSheet>
  );
}
