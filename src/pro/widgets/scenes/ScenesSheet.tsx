/**
 * Scenes details (sheet kit, WIDGET_DESIGN.md §8; new). Hero in the active scene's mood colours:
 * what is on and since when. Then every scene by room as a swatch row with Activate; search for
 * long lists.
 */
import { useMemo, useState } from 'react';
import { Button } from '@heroui/react';
import { PaintBoardIcon } from '@hugeicons/core-free-icons';
import type { ProSceneItem, ProScenesModel } from '../../lib/overviewScenes';
import { DetailSheet, groupBy, matches, SEARCH_FROM, SheetEmpty, SheetHero, SheetRow, SheetSearch, SheetSection } from '../shared/sheet/SheetKit';
import type { WidgetSheetProps } from '../types';
import { moodGradient, since, useSceneActions } from './concepts/shared';

export default function ScenesSheet({ model: m, onClose }: WidgetSheetProps<ProScenesModel>) {
  const a = useSceneActions();
  const [query, setQuery] = useState('');
  const shown = useMemo(() => m.items.filter((s) => matches(query, s.name, s.roomName)), [m.items, query]);
  const rooms = groupBy(shown, (s) => s.roomName || 'Whole home', ['Whole home']);
  const row = (s: ProSceneItem) => {
    const active = m.current?.entityId === s.entityId;
    return (
      <SheetRow
        key={s.entityId}
        media={<span aria-hidden className="size-9 shrink-0 rounded-xl shadow-sm" style={{ background: moodGradient(s.mood) }} />}
        title={s.shortName}
        subtitle={active ? `Active · ${since(s.lastActivated)}` : since(s.lastActivated)}
        trailing={
          <Button
            size="sm"
            variant={active ? 'tertiary' : 'secondary'}
            onPress={() => a.activate(s)}
            aria-label={`${active ? 'Run again' : 'Activate'} ${s.name}`}
            className="h-8 rounded-full px-3 text-xs font-semibold"
          >
            {active ? 'Run again' : 'Activate'}
          </Button>
        }
      />
    );
  };
  return (
    <DetailSheet
      title="Scenes details"
      onClose={onClose}
      hero={
        <SheetHero
          icon={PaintBoardIcon}
          eyebrow="Scenes"
          background={m.current ? moodGradient(m.current.mood, 150) : undefined}
          tone="violet"
          headline={m.current ? m.current.name : m.totalCount === 0 ? 'No scenes' : 'No scene active'}
          sub={m.current ? `Activated ${since(m.current.lastActivated).toLowerCase()}` : m.totalCount > 0 ? `${m.totalCount} scenes to choose from` : undefined}
          onClose={onClose}
        />
      }
      toolbar={m.totalCount >= SEARCH_FROM ? <SheetSearch value={query} onChange={setQuery} placeholder="Search scenes or rooms" label="Search scenes" /> : null}
    >
      {m.totalCount === 0 ? (
        <SheetEmpty icon={PaintBoardIcon} title="No scenes yet" text="Scenes from Home Assistant show up here." />
      ) : rooms.length === 0 ? (
        <SheetEmpty icon={PaintBoardIcon} title="No scenes match" />
      ) : (
        rooms.map((g) => (
          <SheetSection key={g.key} title={g.key}>
            {g.items.map(row)}
          </SheetSection>
        ))
      )}
    </DetailSheet>
  );
}
