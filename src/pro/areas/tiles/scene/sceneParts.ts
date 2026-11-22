/** Shared bits for the scene tiles: icon, colour, words, and a short "done" flash after running. */
import { useEffect, useRef, useState } from 'react';
import type { IconSvgElement } from '@hugeicons/react';
import { Book02Icon, Film01Icon, MagicWand01Icon, Moon02Icon, Restaurant01Icon, Sofa01Icon, Sun03Icon } from '@hugeicons/core-free-icons';
import { agoText, type SceneTileModel, type TileAction } from '../../tileTypes';

const ICON: Record<NonNullable<SceneTileModel['look']>, IconSvgElement> = {
  movie: Film01Icon,
  relax: Sofa01Icon,
  bright: Sun03Icon,
  night: Moon02Icon,
  dinner: Restaurant01Icon,
  reading: Book02Icon
};

export const sceneIcon = (s: SceneTileModel): IconSvgElement => (s.look ? ICON[s.look] : MagicWand01Icon);

/** The scene's own colour (its first light colour), else violet. Night is deep blue, Bright amber (its whites would vanish). */
export const sceneHue = (s: SceneTileModel) => (s.look === 'night' ? 'hsl(245 55% 62%)' : s.look === 'bright' ? 'hsl(42 92% 52%)' : (s.palette[0] ?? 'hsl(268 70% 62%)'));

/** "Active", "Last run 3h ago", "Never run", "Unavailable". */
export function sceneState(s: SceneTileModel): string {
  if (!s.available) return 'Unavailable';
  if (s.isOn) return 'Active';
  return s.lastActivated ? `Last run ${agoText(s.lastActivated).toLowerCase()}` : 'Never run';
}

export const membersText = (s: SceneTileModel) => `Sets ${s.members} ${s.members === 1 ? 'device' : 'devices'}`;

/** Run the scene and show "Done" for a moment (HA gives no other feedback for scenes). */
export function useRun(s: SceneTileModel, act: (a: TileAction) => void) {
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const run = () => {
    if (!s.available) return;
    act({ type: 'activate' });
    setDone(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setDone(false), 1600);
  };
  return { run, done };
}
