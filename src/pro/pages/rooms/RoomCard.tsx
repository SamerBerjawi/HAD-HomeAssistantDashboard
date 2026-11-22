/**
 * A room on the Rooms page (Gallery, docs/pro-ui/ROOMS.md §3). The picture (or the room's colour)
 * with the light's glow, temperature (a ring while heating or cooling),
 * scenes and lights buttons, a few words for how the room is, facts (lights, humidity, power,
 * air) and chips. Every extra follows its switch in `RoomsPagePrefs`.
 */
import { Button } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { BulbIcon, StarIcon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';
import type { RoomItem } from '../../lib/roomsPage';
import { roomMood, type AirLevel, type MoodTone } from '../../lib/roomsInsights';
import { actionHue } from '../../widgets/thermostat/concepts/shared';
import { useHaPicture } from '../../widgets/shared/useHaPicture';
import { ClimateChip, GLASS, ScenesMenu } from './RoomCardControls';
import { roomGradient, roomIcon, SIGNAL, temp, type RoomsPagePrefs, type useRoomLights } from './shared';

const WARM = 'hsl(42 100% 68%)';
const AIR_DOT: Record<AirLevel, string> = { good: 'hsl(145 65% 55%)', fair: 'hsl(42 95% 58%)', poor: 'hsl(4 85% 60%)' };
const MOOD: Record<MoodTone, string> = {
  good: 'bg-[hsl(145_60%_40%/0.55)] ring-[hsl(145_70%_70%/0.4)]',
  warn: 'bg-[hsl(14_85%_48%/0.7)] ring-[hsl(14_90%_75%/0.45)]',
  info: 'bg-white/18 ring-white/25'
};

/** Animated bars for "Playing". */
const Equalizer = () => (
  <span aria-hidden className="pro-eq">
    <i />
    <i />
    <i />
  </span>
);

function airText(r: RoomItem): string | null {
  if (r.air.co2 !== null) return `CO₂ ${Math.round(r.air.co2)}`;
  if (r.air.aqi !== null) return `AQI ${Math.round(r.air.aqi)}`;
  if (r.air.pm25 !== null) return `PM2.5 ${Math.round(r.air.pm25)}`;
  return null;
}

interface RoomCardProps {
  r: RoomItem;
  prefs: RoomsPagePrefs;
  lights: ReturnType<typeof useRoomLights>;
  night: boolean;
  onOpen: () => void;
}

export function RoomCard({ r, prefs, lights, night, onOpen }: RoomCardProps) {
  const picture = useHaPicture(r.picture);
  const compact = prefs.cardSize === 'compact';
  const anim = prefs.animations;
  const lit = r.lightsOn > 0;
  const t = r.thermostat;
  const climateOn = prefs.showClimate && t !== null && t.action !== 'off';
  const climateChip = climateOn && !compact;
  const ringHue = climateOn && (t.action === 'heating' || t.action === 'cooling') ? actionHue(t.action) : null;
  const signals = r.signals.filter((s) => s !== 'lights' && !(climateChip && s === 'climate'));
  const glow = (prefs.lightColorGlow && r.lightColor) || WARM;
  const glowStrength = Math.min(1, (0.45 + 0.55 * (r.lightsOn / Math.max(1, r.totalLights))) * (night ? 1.2 : 1));
  const mood = prefs.showMood && !compact ? roomMood({ ...r, thermostatAction: t?.action ?? null }) : null;
  const air = prefs.showAir ? airText(r) : null;
  const facts = [
    lit ? `${r.lightsOn} of ${r.totalLights} lights on` : r.totalLights ? 'Lights off' : null,
    prefs.showFacts && r.humidity !== null ? `${Math.round(r.humidity)}%` : null,
    prefs.showFacts && r.powerWatts > 0 ? `${r.powerWatts} W` : null
  ].filter(Boolean);

  return (
    <li
      className={cn(
        'relative isolate min-w-0 overflow-hidden text-white shadow-[0_1px_2px_rgba(0,0,0,0.08)]',
        compact ? 'aspect-square rounded-[18px]' : 'aspect-[4/5] rounded-[22px] sm:aspect-[4/3]'
      )}
    >
      {/* Background: the picture (dimmer at night unless lit), or the room's colour with its icon. */}
      {picture ? (
        <img
          src={picture}
          alt=""
          className={cn('absolute inset-0 -z-10 size-full object-cover', anim && 'transition-[filter] duration-700', night && (lit ? 'brightness-[0.82]' : 'brightness-[0.55] saturate-[0.8]'))}
        />
      ) : (
        <div className={cn('absolute inset-0 -z-10', anim && 'transition-[filter] duration-700', night && !lit && 'brightness-[0.65]')} style={{ background: roomGradient(r.color) }}>
          <HugeiconsIcon icon={roomIcon(r)} size={compact ? 84 : 120} className="absolute -bottom-5 -right-4 opacity-15" />
        </div>
      )}
      {/* Light from the ceiling in the lights' colour, stronger with more lights on (and at night); fades in and out. */}
      {lit || anim ? (
        <div
          aria-hidden
          className={cn('absolute inset-0 -z-10', anim && 'transition-opacity duration-700')}
          style={{ background: `radial-gradient(90% 70% at 50% -10%, color-mix(in srgb, ${glow} 75%, transparent), transparent 70%)`, opacity: lit ? glowStrength : 0 }}
        />
      ) : null}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/10 to-black/15" />
      {anim && r.occupied ? <div aria-hidden className="pro-room-shimmer absolute inset-0 -z-10" /> : null}

      {/* The whole card opens the room; the buttons sit above it. */}
      <Button variant="ghost" onPress={onOpen} aria-label={`Open ${r.name}`} className="absolute inset-0 z-0 h-full w-full rounded-[inherit] p-0 hover:bg-white/5" />

      <div className={cn('pointer-events-none relative flex h-full flex-col justify-between', compact ? 'p-2.5' : 'p-2.5 sm:p-3')}>
        <div className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            {r.occupied ? (
              <span aria-label="Someone is there" className={cn('size-2 shrink-0 rounded-full bg-[hsl(205_100%_70%)]', anim ? 'pro-room-ping' : 'shadow-[0_0_0_3px_hsl(205_100%_70%/0.3)]')} />
            ) : null}
            <span
              className={cn('font-semibold tabular-nums drop-shadow-sm', compact ? 'text-lg' : 'text-xl sm:text-2xl', ringHue && '-my-0.5 rounded-full px-1.5 ring-2 max-sm:px-1 max-sm:text-lg')}
              style={ringHue ? { ['--tw-ring-color' as string]: ringHue, background: `color-mix(in srgb, ${ringHue} 28%, transparent)` } : undefined}
              aria-label={ringHue && t ? `${temp(r.temperature)}, ${t.action}` : undefined}
            >
              {temp(r.temperature)}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {!compact && prefs.showScenes ? <ScenesMenu r={r} size="size-8 sm:size-9" /> : null}
            {r.totalLights > 0 ? (
              <Button
                isIconOnly
                size="sm"
                variant="ghost"
                onPress={() => lights.toggle(r)}
                aria-label={`${r.name}: lights ${lit ? 'on, turn off' : 'off, turn on'}`}
                style={lit ? { background: `color-mix(in srgb, ${(prefs.lightColorGlow && r.lightColor) || 'hsl(44 100% 70%)'} 80%, white)` } : undefined}
                className={cn(
                  'pointer-events-auto z-10 min-w-0 rounded-full',
                  compact ? 'size-8' : 'size-8 sm:size-9',
                  anim && 'transition-colors duration-500',
                  lit ? 'text-black ring-1 ring-white/40' : GLASS
                )}
              >
                <HugeiconsIcon icon={BulbIcon} size={compact ? 15 : 17} />
              </Button>
            ) : null}
          </span>
        </div>
        <div className="min-w-0">
          {mood ? (
            <span
              className={cn('mb-1 inline-flex h-5 max-w-full items-center whitespace-nowrap rounded-full px-2 text-[11px] font-semibold leading-none ring-1 backdrop-blur-md', MOOD[mood.tone])}
              title={mood.label}
            >
              <span className="truncate">{mood.label}</span>
            </span>
          ) : null}
          <p className={cn('flex items-center gap-1 font-semibold leading-tight drop-shadow-sm', compact ? 'text-sm' : 'text-base')}>
            <span className="truncate">{r.name}</span>
            {r.isFavorite ? <HugeiconsIcon icon={StarIcon} size={13} className="shrink-0 fill-current text-[hsl(44_100%_72%)]" aria-label="Favourite" /> : null}
          </p>
          {compact ? (
            signals.length ? (
              <span className="mt-1 flex gap-1 text-white/90">
                {signals.slice(0, 4).map((s) => (
                  <HugeiconsIcon key={s} icon={SIGNAL[s].icon} size={13} aria-label={SIGNAL[s].label(r)} />
                ))}
              </span>
            ) : null
          ) : (
            <>
              <p className="flex min-w-0 items-center gap-1 text-xs text-white/80">
                <span className="truncate">{facts.length ? facts.join(' · ') : (r.floorName ?? ' ')}</span>
                {air && r.air.level ? (
                  <span className="flex shrink-0 items-center gap-1" aria-label={`Air ${r.air.level}: ${air}`}>
                    <span aria-hidden>·</span>
                    <span aria-hidden className="size-1.5 rounded-full" style={{ background: AIR_DOT[r.air.level] }} />
                    <span aria-hidden>{air}</span>
                  </span>
                ) : null}
              </p>
              {signals.length || climateChip ? (
                <span className="mt-1.5 flex flex-wrap gap-1 max-sm:flex-nowrap max-sm:overflow-hidden max-sm:[&>*:nth-child(n+3)]:hidden">
                  {climateChip ? <ClimateChip r={r} /> : null}
                  {signals.slice(0, climateChip ? 2 : 3).map((s) => (
                    <span key={s} className={cn('inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 text-[11px] font-semibold leading-none', GLASS)}>
                      {s === 'media' && anim ? <Equalizer /> : <HugeiconsIcon icon={SIGNAL[s].icon} size={12} />}
                      {SIGNAL[s].label(r)}
                    </span>
                  ))}
                </span>
              ) : null}
            </>
          )}
        </div>
      </div>
    </li>
  );
}
