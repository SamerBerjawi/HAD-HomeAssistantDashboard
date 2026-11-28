/**
 * React hook wrapping `layoutScope.ts` for Pro pages.
 * Gives Overview, Rooms, and RoomPage consistent access to:
 *  - Admin "Share layout with all users" toggle
 *  - Shared vs. Personal layout target
 *  - Non-admin "Customize my own" fork & "Revert to shared"
 */
import { useCallback, useMemo, useState } from 'react';
import { useUserConfig } from '@/contexts/ConfigContext';
import {
  buildForkToPersonalPatch,
  buildRevertToSharedPatch,
  buildScopedPreferencesPatch,
  buildToggleSharePatch,
  getEffectiveFavoriteAreas,
  getEffectiveLayoutPreferences,
  resolveLayoutScope,
  type LayoutEditTarget,
  type LayoutScopeState
} from '@/services/layoutScope';

const ADMIN_TARGET_KEY = 'had.pro.adminEditTarget';

function readAdminTarget(): LayoutEditTarget {
  try {
    return window.localStorage.getItem(ADMIN_TARGET_KEY) === 'personal' ? 'personal' : 'shared';
  } catch {
    return 'shared';
  }
}

export interface UseLayoutScopeResult {
  scope: LayoutScopeState;
  effectivePrefs: ReturnType<typeof getEffectiveLayoutPreferences>;
  effectiveFavorites: string[];
  setAdminTarget: (target: LayoutEditTarget) => void;
  toggleShareEnabled: (enabled: boolean) => Promise<void>;
  forkToPersonal: () => Promise<void>;
  revertToShared: () => Promise<void>;
  saveScopedPrefs: (prefsPatch: Record<string, unknown>, flush?: boolean) => Promise<void>;
}

export function useLayoutScope(): UseLayoutScopeResult {
  const { config, currentUser, updateConfig, flushPendingSave } = useUserConfig();
  const [adminTarget, setAdminTargetState] = useState<LayoutEditTarget>(readAdminTarget);

  const setAdminTarget = useCallback((target: LayoutEditTarget) => {
    try {
      window.localStorage.setItem(ADMIN_TARGET_KEY, target);
    } catch {}
    setAdminTargetState(target);
  }, []);

  const scope = useMemo(
    () => resolveLayoutScope(config, currentUser, adminTarget),
    [config, currentUser, adminTarget]
  );

  const effectivePrefs = useMemo(
    () => getEffectiveLayoutPreferences(config, scope),
    [config, scope]
  );

  const effectiveFavorites = useMemo(
    () => getEffectiveFavoriteAreas(config, scope),
    [config, scope]
  );

  const toggleShareEnabled = useCallback(
    async (enabled: boolean) => {
      await updateConfig(buildToggleSharePatch(enabled));
      await flushPendingSave();
    },
    [updateConfig, flushPendingSave]
  );

  const forkToPersonal = useCallback(async () => {
    const patch = buildForkToPersonalPatch(config, scope);
    if (Object.keys(patch).length === 0) return;
    await updateConfig(patch);
    await flushPendingSave();
  }, [config, scope, updateConfig, flushPendingSave]);

  const revertToShared = useCallback(async () => {
    if (!scope.userId) return;
    await updateConfig(buildRevertToSharedPatch(scope.userId));
    await flushPendingSave();
    if (scope.isAdmin) setAdminTarget('shared');
  }, [scope.userId, scope.isAdmin, updateConfig, flushPendingSave, setAdminTarget]);

  const saveScopedPrefs = useCallback(
    async (prefsPatch: Record<string, unknown>, flush = false) => {
      await updateConfig(buildScopedPreferencesPatch(scope, prefsPatch));
      if (flush) await flushPendingSave();
    },
    [scope, updateConfig, flushPendingSave]
  );

  return {
    scope,
    effectivePrefs,
    effectiveFavorites,
    setAdminTarget,
    toggleShareEnabled,
    forkToPersonal,
    revertToShared,
    saveScopedPrefs
  };
}
