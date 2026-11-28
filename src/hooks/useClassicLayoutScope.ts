/**
 * Classic UI React hook wrapping `layoutScope.ts`.
 * Avoids any dependency on `src/pro/` or HeroUI so Classic bundle budgets stay clean.
 */
import { useCallback, useMemo, useState } from 'react';
import { useUserConfig } from '@/contexts/ConfigContext';
import type { BreakpointLayoutOverride, LayoutBreakpoint, OverviewConfig } from '@/types/userConfig';
import {
  buildForkToPersonalPatch,
  buildRevertToSharedPatch,
  buildScopedClassicOverviewPatch,
  buildScopedResponsiveOverridesPatch,
  buildToggleSharePatch,
  getEffectiveClassicOverview,
  getEffectiveFavoriteAreas,
  getEffectiveResponsiveLayoutOverrides,
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

export interface ClassicLayoutScopeApi {
  scope: LayoutScopeState;
  effectiveClassicOverview: OverviewConfig;
  effectiveResponsiveOverrides: ReturnType<typeof getEffectiveResponsiveLayoutOverrides>;
  effectiveFavorites: string[];
  setAdminTarget: (target: LayoutEditTarget) => void;
  toggleShareEnabled: (enabled: boolean) => Promise<void>;
  forkToPersonal: () => Promise<void>;
  revertToShared: () => Promise<void>;
  saveClassicOverview: (nextOverview: OverviewConfig, flush?: boolean) => Promise<void>;
  saveResponsiveOverrides: (
    breakpoint: LayoutBreakpoint,
    bpMap: Record<string, BreakpointLayoutOverride | null>,
    flush?: boolean
  ) => Promise<void>;
}

export function useClassicLayoutScope(): ClassicLayoutScopeApi {
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

  const effectiveClassicOverview = useMemo(
    () => getEffectiveClassicOverview(config, scope),
    [config, scope]
  );

  const effectiveResponsiveOverrides = useMemo(
    () => getEffectiveResponsiveLayoutOverrides(config, scope),
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

  const saveClassicOverview = useCallback(
    async (nextOverview: OverviewConfig, flush = false) => {
      await updateConfig(buildScopedClassicOverviewPatch(scope, nextOverview));
      if (flush) await flushPendingSave();
    },
    [scope, updateConfig, flushPendingSave]
  );

  const saveResponsiveOverrides = useCallback(
    async (
      breakpoint: LayoutBreakpoint,
      bpMap: Record<string, BreakpointLayoutOverride | null>,
      flush = false
    ) => {
      await updateConfig(buildScopedResponsiveOverridesPatch(scope, breakpoint, bpMap));
      if (flush) await flushPendingSave();
    },
    [scope, updateConfig, flushPendingSave]
  );

  return {
    scope,
    effectiveClassicOverview,
    effectiveResponsiveOverrides,
    effectiveFavorites,
    setAdminTarget,
    toggleShareEnabled,
    forkToPersonal,
    revertToShared,
    saveClassicOverview,
    saveResponsiveOverrides
  };
}
