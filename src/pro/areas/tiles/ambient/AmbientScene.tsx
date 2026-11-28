/**
 * Ambient (D) for scenes: the glass card with the scene's colour glowing from a corner while it
 * holds, a round glowing button wearing the scene's icon (press to run), name and when it last ran.
 */
import { cn } from '@/lib/utils';
import type { SceneTileModel, TileProps } from '../../tileTypes';
import { membersText, sceneHue, sceneIcon, sceneState, useRun } from '../scene/sceneParts';
import { AName, AState, Glass, glowStyle, OrbButton } from './ambientKit';
import { Tick02Icon } from '@hugeicons/core-free-icons';

export function AmbientScene({ e: s, size, act }: TileProps<SceneTileModel>) {
  const { run, done } = useRun(s, act);
  const hue = sceneHue(s);
  const on = s.available && (s.isOn || done);
  const state = done ? 'Done' : sceneState(s);
  const orb = (px: number) => <OrbButton icon={done ? Tick02Icon : sceneIcon(s)} label={`${s.name}: run scene. ${state}`} on={on} color={hue} size={px} isDisabled={!s.available} onPress={run} />;
  const style = on ? glowStyle(hue, 0.8, size === 'xs' ? '10% 50%' : '15% 85%') : undefined;
  const dim = !s.available && 'opacity-60';
  if (size === 'xs') {
    return (
      <Glass label={s.name} style={style} className={cn(dim)}>
        <div className="flex h-full items-center gap-2 px-2.5">
          {orb(34)}
          <div className="min-w-0 flex-1">
            <AName className="line-clamp-1 truncate text-[13px] leading-tight">{s.name}</AName>
            <AState className="mt-0.5 text-[11px] leading-tight">{state}</AState>
          </div>
        </div>
      </Glass>
    );
  }
  if (size === 's' || size === 't') {
    return (
      <Glass label={s.name} style={style} className={cn(dim)}>
        <div className="flex h-full flex-col p-4">
          <div className="min-w-0">
            <AName className={size === 't' ? 'text-[18px]' : 'text-[15px]'}>{s.name}</AName>
            <AState className="text-[12px]">{state}</AState>
          </div>
          <div className={cn('flex justify-center', size === 't' ? 'my-auto' : 'mt-auto')}>{orb(size === 't' ? 76 : 52)}</div>
          {size === 't' ? <AState className="text-center text-[12px]">{membersText(s)}</AState> : null}
        </div>
      </Glass>
    );
  }
  return (
    <Glass label={s.name} style={style} className={cn(dim)}>
      <div className={cn('flex h-full', size === 'w' ? 'items-center gap-4 p-4' : 'flex-col p-5')}>
        {size === 'w' ? orb(64) : null}
        <div className={cn('min-w-0', size === 'l' && 'mt-auto')}>
          <AName className={size === 'l' ? 'text-[26px]' : 'text-[17px]'}>{s.name}</AName>
          <AState className="text-[13px]">{state}</AState>
          <AState className="text-[12px] opacity-50">{membersText(s)}</AState>
        </div>
        {size === 'l' ? <div className="absolute right-5 top-5">{orb(84)}</div> : null}
      </div>
    </Glass>
  );
}
