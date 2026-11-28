import { describe, expect, it } from 'vitest';
import { DEFAULT_USER_CONFIG, type UserDashboardConfig } from '@/types/userConfig';
import {
  buildForkToPersonalPatch,
  buildRevertToSharedPatch,
  buildScopedClassicOverviewPatch,
  buildScopedPreferencesPatch,
  buildScopedResponsiveOverridesPatch,
  buildToggleSharePatch,
  getEffectiveClassicOverview,
  getEffectiveFavoriteAreas,
  getEffectiveLayoutPreferences,
  getEffectiveResponsiveLayoutOverrides,
  resolveLayoutScope
} from '@/services/layoutScope';
import { mergeConfig } from '@/services/configMerge';

const baseConfig = (extra: Partial<UserDashboardConfig> = {}): UserDashboardConfig =>
  mergeConfig(DEFAULT_USER_CONFIG, extra);

describe('layoutScope', () => {
  const admin = { id: 'admin_1', name: 'Admin', isAdmin: true };
  const member = { id: 'user_2', name: 'Alice', isAdmin: false };

  it('follows shared layout by default when sharing is enabled', () => {
    const cfg = baseConfig({
      layoutSharing: { shareLayoutsWithUsers: true },
      preferences: { ...DEFAULT_USER_CONFIG.preferences, overviewMode: 'custom', proOverviewLayout: { version: 1, phone: { sectionOrder: ['lights'] } } },
      rooms: { ...DEFAULT_USER_CONFIG.rooms, favoriteAreas: ['kitchen'] }
    });

    const memberScope = resolveLayoutScope(cfg, member);
    expect(memberScope).toMatchObject({
      shareEnabled: true,
      isAdmin: false,
      usingPersonalFork: false,
      activeTarget: 'shared',
      canEditShared: false
    });
    expect(getEffectiveLayoutPreferences(cfg, memberScope).overviewMode).toBe('custom');
    expect(getEffectiveFavoriteAreas(cfg, memberScope)).toEqual(['kitchen']);
  });

  it('allows non-admins to fork to a personal layout and revert back to shared', () => {
    const cfg = baseConfig({
      layoutSharing: { shareLayoutsWithUsers: true },
      preferences: { ...DEFAULT_USER_CONFIG.preferences, overviewMode: 'custom', proOverviewLayout: { version: 1, phone: { sectionOrder: ['lights'] } } },
      rooms: { ...DEFAULT_USER_CONFIG.rooms, favoriteAreas: ['living'] }
    });

    const scope = resolveLayoutScope(cfg, member);
    const forkPatch = buildForkToPersonalPatch(cfg, scope);
    const forkedCfg = mergeConfig(cfg, forkPatch);

    const forkedScope = resolveLayoutScope(forkedCfg, member);
    expect(forkedScope.usingPersonalFork).toBe(true);
    expect(forkedScope.activeTarget).toBe('personal');
    expect(getEffectiveFavoriteAreas(forkedCfg, forkedScope)).toEqual(['living']);

    const revertPatch = buildRevertToSharedPatch(member.id);
    const revertedCfg = mergeConfig(forkedCfg, revertPatch);
    const revertedScope = resolveLayoutScope(revertedCfg, member);
    expect(revertedScope.usingPersonalFork).toBe(false);
    expect(revertedScope.activeTarget).toBe('shared');
    expect(revertedCfg.userLayouts?.[member.id]?.proOverviewLayout).toBeUndefined();
  });

  it('routes non-admin preference writes into userLayouts instead of shared preferences', () => {
    const cfg = baseConfig({ layoutSharing: { shareLayoutsWithUsers: true } });
    const scope = resolveLayoutScope(cfg, member);
    const patch = buildScopedPreferencesPatch(scope, { overviewMode: 'custom' });
    expect(patch.preferences).toBeUndefined();
    expect(patch.userLayouts?.[member.id]).toEqual({ useSharedLayout: false, overviewMode: 'custom' });
  });

  it('gives each user an independent Auto layout when sharing is turned off', () => {
    const cfg = mergeConfig(
      baseConfig({
        preferences: { ...DEFAULT_USER_CONFIG.preferences, overviewMode: 'custom', proOverviewLayout: { version: 1, phone: { sectionOrder: ['lights'] } } }
      }),
      buildToggleSharePatch(false)
    );
    const memberScope = resolveLayoutScope(cfg, member);
    expect(memberScope.shareEnabled).toBe(false);
    expect(memberScope.activeTarget).toBe('personal');
    const eff = getEffectiveLayoutPreferences(cfg, memberScope);
    expect(eff.overviewMode).toBe('auto');
    expect(eff.proOverviewLayout).toBeUndefined();

    const adminScope = resolveLayoutScope(cfg, admin);
    expect(adminScope.activeTarget).toBe('personal');
  });

  it('scopes Classic overview & responsive overrides, forks cleanly, and reverts with null markers', () => {
    const cfg = baseConfig({
      layoutSharing: { shareLayoutsWithUsers: true },
      overview: { tileOrder: ['lights', 'weather'], hiddenTiles: [], tileSizes: {} },
      responsiveLayoutOverrides: { mobile: { 'light.a': { colSpan: 4, order: 0 } }, laptop: {}, desktop: {} }
    });

    const memberScope = resolveLayoutScope(cfg, member);
    expect(getEffectiveClassicOverview(cfg, memberScope).tileOrder).toEqual(['lights', 'weather']);
    expect(getEffectiveResponsiveLayoutOverrides(cfg, memberScope).mobile).toEqual({ 'light.a': { colSpan: 4, order: 0 } });

    const personalPatch = buildScopedClassicOverviewPatch(memberScope, { tileOrder: ['weather', 'lights'] });
    expect(personalPatch.overview).toBeUndefined();
    expect(personalPatch.userLayouts?.[member.id]?.classicOverview).toEqual({ tileOrder: ['weather', 'lights'] });

    const forkPatch = buildForkToPersonalPatch(cfg, memberScope);
    const forked = mergeConfig(cfg, forkPatch);
    expect(forked.userLayouts?.[member.id]?.classicOverview?.tileOrder).toEqual(['lights', 'weather']);

    const bpPatch = buildScopedResponsiveOverridesPatch(resolveLayoutScope(forked, member), 'mobile', {
      'light.a': { colSpan: 2, order: 1 }
    });
    const updatedFork = mergeConfig(forked, bpPatch);
    expect(getEffectiveResponsiveLayoutOverrides(updatedFork, resolveLayoutScope(updatedFork, member)).mobile?.['light.a']).toEqual({ colSpan: 2, order: 1 });

    const reverted = mergeConfig(updatedFork, buildRevertToSharedPatch(member.id));
    expect(reverted.userLayouts?.[member.id]?.classicOverview).toBeUndefined();
    expect(reverted.userLayouts?.[member.id]?.classicResponsiveLayoutOverrides).toBeUndefined();
  });
});
