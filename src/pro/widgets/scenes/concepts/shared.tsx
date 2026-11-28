/** Scenes pieces the concepts share: activation and the colour of each mood. */
import { useMemo } from 'react';
import type { ProSceneItem, SceneMood } from '../../../lib/overviewScenes';
import { useServiceCall } from '../../shared/useServiceCall';

export function useSceneActions() {
  const { call, setOptimistic } = useServiceCall();
  return useMemo(
    () => ({
      activate: (s: ProSceneItem) => {
        // A scene's state is its last activation time.
        setOptimistic(s.entityId, new Date().toISOString());
        void call('scene', 'turn_on', {}, s.entityId);
      }
    }),
    [call, setOptimistic]
  );
}

/** Two colours per mood (D1: colour from content). */
export const MOOD_COLORS: Record<SceneMood, [string, string]> = {
  cinema: ['hsl(265 70% 52%)', 'hsl(230 60% 26%)'],
  focus: ['hsl(200 90% 72%)', 'hsl(215 70% 50%)'],
  dining: ['hsl(35 95% 58%)', 'hsl(350 65% 48%)'],
  night: ['hsl(230 40% 30%)', 'hsl(240 35% 12%)'],
  party: ['hsl(320 85% 58%)', 'hsl(25 95% 55%)'],
  morning: ['hsl(45 100% 70%)', 'hsl(20 90% 62%)'],
  relax: ['hsl(20 85% 60%)', 'hsl(300 35% 40%)'],
  other: ['hsl(215 20% 55%)', 'hsl(225 20% 35%)']
};

export const moodGradient = (mood: SceneMood, angle = 140) => `linear-gradient(${angle}deg, ${MOOD_COLORS[mood][0]}, ${MOOD_COLORS[mood][1]})`;

/** "12 min ago", "3 h ago", "yesterday". */
export function since(ms: number | null, now = Date.now()): string {
  if (ms === null) return 'Never used';
  const min = Math.round((now - ms) / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return h < 48 ? 'Yesterday' : `${Math.round(h / 24)} days ago`;
}
