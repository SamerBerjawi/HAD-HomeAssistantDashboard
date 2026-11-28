/**
 * Pure multi-user layout scope resolution (Phase 0).
 *
 * Determines whether the current HA user reads/writes the home-shared layout (`config.preferences`
 * and `config.rooms`) or their personal overlay (`config.userLayouts[userId]`), based on the
 * Admin `layoutSharing.shareLayoutsWithUsers` checkbox and the user's personal fork toggle.
 */
import type {
  BreakpointLayoutOverride,
  LayoutBreakpoint,
  LayoutMode,
  OverviewConfig,
  ResponsiveLayoutOverrides,
  UserDashboardConfig,
  UserLayoutOverlay
} from '../types/userConfig';

export type LayoutEditTarget = 'shared' | 'personal';

export interface LayoutUserIdentity {
  id: string;
  name?: string;
  isAdmin: boolean;
}

export interface LayoutScopeState {
  shareEnabled: boolean;
  isAdmin: boolean;
  userId: string | null;
  usingPersonalFork: boolean;
  activeTarget: LayoutEditTarget;
  canEditShared: boolean;
}

export function resolveLayoutScope(
  config: UserDashboardConfig,
  user?: LayoutUserIdentity | null,
  preferredAdminTarget?: LayoutEditTarget
): LayoutScopeState {
  const shareEnabled = config.layoutSharing?.shareLayoutsWithUsers ?? true;
  const isAdmin = Boolean(user?.isAdmin);
  const userId = user?.id || null;
  const userOverlay = userId ? config.userLayouts?.[userId] : undefined;

  if (!userId) {
    return {
      shareEnabled,
      isAdmin,
      userId: null,
      usingPersonalFork: false,
      activeTarget: 'shared',
      canEditShared: isAdmin
    };
  }

  if (!shareEnabled) {
    // Sharing disabled: every user operates on their own independent personal layout
    return {
      shareEnabled: false,
      isAdmin,
      userId,
      usingPersonalFork: true,
      activeTarget: 'personal',
      canEditShared: isAdmin
    };
  }

  // Sharing enabled:
  // - Non-admins follow the shared layout unless they opted into a personal fork (useSharedLayout === false)
  // - Admins default to editing the shared layout unless they explicitly chose 'personal' (or have an active personal fork and asked for personal)
  const hasExplicitPersonalFork = userOverlay?.useSharedLayout === false;
  if (isAdmin) {
    const activeTarget: LayoutEditTarget = preferredAdminTarget ?? (hasExplicitPersonalFork ? 'personal' : 'shared');
    return {
      shareEnabled: true,
      isAdmin: true,
      userId,
      usingPersonalFork: hasExplicitPersonalFork,
      activeTarget,
      canEditShared: true
    };
  }

  return {
    shareEnabled: true,
    isAdmin: false,
    userId,
    usingPersonalFork: hasExplicitPersonalFork,
    activeTarget: hasExplicitPersonalFork ? 'personal' : 'shared',
    canEditShared: false
  };
}

/**
 * Returns the effective layout preferences object (`proOverviewLayout`, `proRooms`, `proAreaLayouts`,
 * `overviewMode`, `roomsMode`, `roomModes`, etc.) for the resolved scope.
 */
export function getEffectiveLayoutPreferences(
  config: UserDashboardConfig,
  scope: LayoutScopeState
): NonNullable<UserDashboardConfig['preferences']> {
  const sharedPrefs = (config.preferences || {}) as NonNullable<UserDashboardConfig['preferences']>;
  const overlay = scope.userId ? config.userLayouts?.[scope.userId] : undefined;

  if (!scope.shareEnabled) {
    // Sharing OFF: user's personal overlay is independent of shared layout keys (falls back to Auto)
    return {
      ...sharedPrefs,
      overviewMode: overlay?.overviewMode ?? 'auto',
      roomsMode: overlay?.roomsMode ?? 'auto',
      roomModes: overlay?.roomModes ?? {},
      proOverviewLayout: overlay?.proOverviewLayout,
      proRooms: overlay?.proRooms,
      proAreaLayouts: overlay?.proAreaLayouts,
      defaultOverviewTab: overlay?.defaultOverviewTab ?? sharedPrefs.defaultOverviewTab,
      roomDefaultViews: overlay?.roomDefaultViews ?? sharedPrefs.roomDefaultViews
    };
  }

  if (scope.activeTarget === 'personal' && overlay) {
    return {
      ...sharedPrefs,
      overviewMode: overlay.overviewMode ?? sharedPrefs.overviewMode,
      roomsMode: overlay.roomsMode ?? sharedPrefs.roomsMode,
      roomModes: overlay.roomModes ?? sharedPrefs.roomModes,
      proOverviewLayout: overlay.proOverviewLayout ?? sharedPrefs.proOverviewLayout,
      proRooms: overlay.proRooms ?? sharedPrefs.proRooms,
      proAreaLayouts: overlay.proAreaLayouts ?? sharedPrefs.proAreaLayouts,
      defaultOverviewTab: overlay.defaultOverviewTab ?? sharedPrefs.defaultOverviewTab,
      roomDefaultViews: overlay.roomDefaultViews ?? sharedPrefs.roomDefaultViews
    };
  }

  return sharedPrefs;
}

/** Returns the effective favorite area IDs for the active scope. */
export function getEffectiveFavoriteAreas(config: UserDashboardConfig, scope: LayoutScopeState): string[] {
  const sharedFavs = config.rooms?.favoriteAreas ?? [];
  if (!scope.userId) return sharedFavs;
  const overlay = config.userLayouts?.[scope.userId];
  if (!scope.shareEnabled || scope.activeTarget === 'personal') {
    return overlay?.favoriteAreas ?? (scope.shareEnabled ? sharedFavs : []);
  }
  return sharedFavs;
}

/**
 * Builds a granular config patch writing layout preference keys either to `preferences` (shared)
 * or to `userLayouts[userId]` (personal fork).
 */
export function buildScopedPreferencesPatch(
  scope: LayoutScopeState,
  prefsPatch: Record<string, unknown>
): Partial<UserDashboardConfig> {
  if ((scope.activeTarget === 'personal' || !scope.canEditShared) && scope.userId) {
    const overlayPatch: Record<string, unknown> = {
      ...prefsPatch
    };
    if (scope.shareEnabled) {
      overlayPatch.useSharedLayout = false;
    }
    return {
      userLayouts: {
        [scope.userId]: overlayPatch as UserLayoutOverlay
      }
    };
  }
  return {
    preferences: prefsPatch as UserDashboardConfig['preferences']
  };
}

/** Builds a granular config patch for the Admin "Share layout with all users" checkbox. */
export function buildToggleSharePatch(enabled: boolean): Partial<UserDashboardConfig> {
  return {
    layoutSharing: {
      shareLayoutsWithUsers: enabled
    }
  };
}

/**
 * Copies the current effective layouts into `userLayouts[userId]` so the user can customize
 * independently without affecting the shared layout.
 */
export function buildForkToPersonalPatch(
  config: UserDashboardConfig,
  scope: LayoutScopeState
): Partial<UserDashboardConfig> {
  if (!scope.userId) return {};
  const effective = getEffectiveLayoutPreferences(config, { ...scope, activeTarget: 'shared' });
  const overlay: UserLayoutOverlay = {
    useSharedLayout: false,
    overviewMode: effective.overviewMode ?? 'auto',
    roomsMode: effective.roomsMode ?? 'auto',
    roomModes: effective.roomModes ? structuredClone(effective.roomModes) : {},
    ...(effective.proOverviewLayout ? { proOverviewLayout: structuredClone(effective.proOverviewLayout) } : {}),
    ...(effective.proRooms ? { proRooms: structuredClone(effective.proRooms) } : {}),
    ...(effective.proAreaLayouts ? { proAreaLayouts: structuredClone(effective.proAreaLayouts) } : {}),
    ...(config.overview ? { classicOverview: structuredClone(config.overview) } : {}),
    ...(config.responsiveLayoutOverrides
      ? { classicResponsiveLayoutOverrides: structuredClone(config.responsiveLayoutOverrides) }
      : {}),
    favoriteAreas: [...(config.rooms?.favoriteAreas ?? [])]
  };
  return {
    userLayouts: {
      [scope.userId]: overlay
    }
  };
}

/**
 * Clears the user's personal layout fork and reverts to following the shared layout.
 * Uses `null` markers so server-side `deepMergeConfig` removes stale forked keys cleanly.
 */
export function buildRevertToSharedPatch(userId: string): Partial<UserDashboardConfig> {
  return {
    userLayouts: {
      [userId]: {
        useSharedLayout: true,
        overviewMode: null as unknown as LayoutMode,
        roomsMode: null as unknown as LayoutMode,
        roomModes: null as unknown as Record<string, LayoutMode>,
        proOverviewLayout: null as unknown as Record<string, unknown>,
        proRooms: null as unknown as Record<string, unknown>,
        proAreaLayouts: null as unknown as Record<string, unknown>,
        classicOverview: null as unknown as OverviewConfig,
        classicResponsiveLayoutOverrides: null as unknown as ResponsiveLayoutOverrides
      }
    }
  };
}

/** Returns effective Classic Overview config (`config.overview` or `userLayouts[uid].classicOverview`). */
export function getEffectiveClassicOverview(
  config: UserDashboardConfig,
  scope: LayoutScopeState
): OverviewConfig {
  const overlay = scope.userId ? config.userLayouts?.[scope.userId] : undefined;
  if (!scope.shareEnabled) {
    return overlay?.classicOverview ?? {};
  }
  if (scope.activeTarget === 'personal' && overlay?.classicOverview) {
    return overlay.classicOverview;
  }
  return config.overview ?? {};
}

/** Returns effective Classic responsive tile overrides for the active user scope. */
export function getEffectiveResponsiveLayoutOverrides(
  config: UserDashboardConfig,
  scope: LayoutScopeState
): ResponsiveLayoutOverrides {
  const overlay = scope.userId ? config.userLayouts?.[scope.userId] : undefined;
  if (!scope.shareEnabled) {
    return overlay?.classicResponsiveLayoutOverrides ?? {};
  }
  if (scope.activeTarget === 'personal' && overlay?.classicResponsiveLayoutOverrides) {
    return overlay.classicResponsiveLayoutOverrides;
  }
  return config.responsiveLayoutOverrides ?? {};
}

/** Builds a scoped patch updating Classic Overview config in shared or personal storage. */
export function buildScopedClassicOverviewPatch(
  scope: LayoutScopeState,
  nextOverview: OverviewConfig
): Partial<UserDashboardConfig> {
  if ((scope.activeTarget === 'personal' || !scope.canEditShared) && scope.userId) {
    return {
      userLayouts: {
        [scope.userId]: {
          ...(scope.shareEnabled ? { useSharedLayout: false } : {}),
          classicOverview: nextOverview
        }
      }
    };
  }
  return { overview: nextOverview };
}

/** Builds a scoped patch updating Classic responsive overrides for one breakpoint. */
export function buildScopedResponsiveOverridesPatch(
  scope: LayoutScopeState,
  breakpoint: LayoutBreakpoint,
  bpMap: Record<string, BreakpointLayoutOverride | null>
): Partial<UserDashboardConfig> {
  if ((scope.activeTarget === 'personal' || !scope.canEditShared) && scope.userId) {
    return {
      userLayouts: {
        [scope.userId]: {
          ...(scope.shareEnabled ? { useSharedLayout: false } : {}),
          classicResponsiveLayoutOverrides: {
            [breakpoint]: bpMap as Record<string, BreakpointLayoutOverride>
          }
        }
      }
    };
  }
  return {
    responsiveLayoutOverrides: {
      [breakpoint]: bpMap as Record<string, BreakpointLayoutOverride>
    }
  };
}
