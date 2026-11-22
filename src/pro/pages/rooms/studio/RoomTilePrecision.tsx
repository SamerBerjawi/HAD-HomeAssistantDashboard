/**
 * Rooms studio, Design C · "Precision ambient" (docs/pro-ui/ROOMS.md §5). Studio only until the
 * owner approves it. Architectural and dense: a dark neutral surface with a hairline border, the
 * ambient colour only as a fine light line along the top edge and a faint corner wash. A header row
 * (icon, name, a small state code), a medium reading, then a labelled data row (humidity, lights,
 * power, devices) and square actions in the bottom corner. Compact tiles are single dense lines.
 */
import { memo } from 'react';
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { StarIcon } from '@hugeicons/core-free-icons';
import type { RoomItem } from '../../../lib/roomsPage';
import { RoomQuickActions } from '../RoomQuickActions';
import { roomIcon } from '../shared';
import { sameTile, tileFacts, type RoomTileProps } from '../tileParts';

/** A short state code: what the room is doing, in one word. */
function stateCode(r: RoomItem): string {
  if (r.openContacts > 0) return 'Open';
  if (r.mediaPlaying > 0) return 'Media';
  if (r.thermostat?.action === 'heating') return 'Heat';
  if (r.thermostat?.action === 'cooling') return 'Cool';
  if (r.lightsOn > 0) return 'Lit';
  if (r.fansOn > 0) return 'Air';
  return 'Idle';
}

function RoomTilePrecisionImpl({ r, size, prefs, actions, onOpen }: RoomTileProps) {
  const f = tileFacts(r, prefs, size);
  const compact = size === 'compact';
  const expanded = size === 'expanded';
  const shown = actions.slice(0, compact ? 0 : expanded ? 3 : 2);
  const code = stateCode(r);
  const stats = [
    r.humidity !== null && prefs.metric !== 'humidity' ? { k: 'Hum', v: `${Math.round(r.humidity)}%` } : null,
    r.temperature !== null && prefs.metric === 'humidity' ? { k: 'Temp', v: `${Number(r.temperature.toFixed(1))}°` } : null,
    r.totalLights > 0 ? { k: 'Lights', v: `${r.lightsOn}/${r.totalLights}` } : null,
    expanded && r.powerWatts > 0 ? { k: 'Power', v: `${r.powerWatts} W` } : null,
    { k: 'Dev', v: String(r.deviceCount) }
  ]
    .filter((x): x is { k: string; v: string } => x !== null)
    .slice(0, expanded ? 4 : 2);

  return (
    <div role="listitem" className="pro-rp h-full min-w-0" data-size={size} data-level={f.ambient.level} style={f.ambientStyle}>
      <Button variant="ghost" onPress={() => onOpen(r.areaId)} aria-label={`Open ${r.name}${f.summary ? `: ${f.summary}` : ''}`} className="pro-rp-open absolute inset-0 z-0 h-full w-full min-w-0 rounded-[inherit] p-0" />
      {compact ? (
        <div className="pointer-events-none relative flex h-full min-w-0 items-center gap-2.5 px-3.5">
          <HugeiconsIcon icon={roomIcon(r)} size={16} className="pro-rp-ico shrink-0" />
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold" title={r.name}>
            {r.name}
          </span>
          <span className="pro-rp-num shrink-0 text-[15px] font-medium tabular-nums">{f.big ?? '—'}</span>
          <span className="pro-rp-code shrink-0" data-code={code}>
            {code}
          </span>
        </div>
      ) : (
        <div className="pro-rp-body pointer-events-none relative h-full">
          <div className="pro-rp-grid" data-size={size}>
            <p className="pro-rp-head flex min-w-0 items-center gap-2 text-[14px] font-semibold" title={r.name}>
              <HugeiconsIcon icon={roomIcon(r)} size={16} className="pro-rp-ico shrink-0" />
              <span className="truncate">{r.name}</span>
              {r.isFavorite ? <HugeiconsIcon icon={StarIcon} size={11} className="pro-rp-sub shrink-0 fill-current" aria-label="Favourite" /> : null}
            </p>
            <span className="pro-rp-code pro-rp-codepos" data-code={code}>
              {code}
            </span>
            <p className="pro-rp-temp pro-rp-num font-medium tracking-tight tabular-nums">{f.big ?? <span className="pro-rp-sub text-lg">{f.word}</span>}</p>
            {expanded && f.extras.length ? <p className="pro-rp-extra pro-rp-sub truncate text-[12px]">{f.extras.join(' · ')}</p> : null}
            <dl className="pro-rp-stats flex min-w-0 gap-4">
              {stats.map((s) => (
                <div key={s.k} className="flex min-w-0 flex-col">
                  <dt className="pro-rp-label">{s.k}</dt>
                  <dd className="pro-rp-num whitespace-nowrap text-[13px] font-medium tabular-nums">{s.v}</dd>
                </div>
              ))}
            </dl>
            <RoomQuickActions r={r} actions={shown} useLightColor={prefs.lightColorGlow} look="c" className="pro-rp-acts gap-1.5" />
          </div>
        </div>
      )}
    </div>
  );
}

export const RoomTilePrecision = memo(RoomTilePrecisionImpl, sameTile);
