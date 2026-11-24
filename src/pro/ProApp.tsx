import { lazy, Suspense, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useUserConfig } from '@/contexts/ConfigContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAutoLayoutStore } from '@/store/useAutoLayoutStore';
import { alertService } from '@/services/alertService';
import { hasAnyKey } from '@/services/appShell';
import { useAppTheme } from '@/hooks/app/useAppTheme';
import { useActiveTab } from '@/hooks/app/useActiveTab';
import { useStartupState } from '@/hooks/app/useStartupState';
import { useShellOverlays } from '@/hooks/app/useShellOverlays';
import FullScreenLoadingPage from '@/components/ui/FullScreenLoadingPage';
import ProShell from './components/ProShell';
import ProOverview from './pages/ProOverview';
import ProSecurity from './pages/ProSecurity';
import ProRooms from './pages/ProRooms';
import ProEnergy from './pages/ProEnergy';
import ProToaster from './components/toasts/ProToaster';

// Design Studio Hub + per-page studios (dev builds only, never bundled in production).
const StudioHub = import.meta.env.DEV ? lazy(() => import('./studio/StudioHub')) : null;
const WidgetStudio = import.meta.env.DEV ? lazy(() => import('./studio/WidgetStudio')) : null;
const AreaStudio = import.meta.env.DEV ? lazy(() => import('./areas/studio/AreaStudio')) : null;
const RoomsStudio = import.meta.env.DEV ? lazy(() => import('./pages/rooms/studio/RoomsStudio')) : null;
const EnergyStudio = import.meta.env.DEV ? lazy(() => import('./pages/energy/studio/EnergyStudio')) : null;
const SecurityStudio = import.meta.env.DEV ? lazy(() => import('./pages/security/studio/SecurityStudio')) : null;

const ProSignIn = lazy(() => import('./components/ProSignIn'));
const ProNotificationCenter = lazy(() => import('./components/notifications/ProNotificationCenter'));
const ProEmergencyAlert = lazy(() => import('./components/toasts/ProEmergencyAlert'));

/** Entry for the pro design language: same providers, stores and startup flow as the classic App. */
export default function ProApp() {
  const { config, updateConfig } = useUserConfig();
  const { darkMode, handleToggleDarkMode } = useAppTheme(config, updateConfig);
  const { activeTab, setActiveTab } = useActiveTab(config);
  const { authState, enterDemoMode, isInitializing: isAuthInitializing } = useAuth();
  const overlays = useShellOverlays();

  const { init, isLiveMode, connectionStatus, connectionError, serverUrl } = useAutoLayoutStore(
    useShallow((s) => ({
      init: s.init,
      isLiveMode: s.isLiveMode,
      connectionStatus: s.connectionStatus,
      connectionError: s.connectionError,
      serverUrl: s.serverUrl
    }))
  );
  const hasResolvedEntities = useAutoLayoutStore((s) => hasAnyKey(s.resolvedEntities));
  const snapshotStatus = useAutoLayoutStore((s) => s.snapshotStatus);
  const showingCachedSnapshot = useAutoLayoutStore((s) => s.showingCachedSnapshot);

  useEffect(() => {
    init();
    alertService.initialize();
  }, [init]);

  const startup = useStartupState({
    authState,
    isAuthInitializing,
    connectionStatus,
    hasResolvedEntities,
    showingCachedSnapshot,
    isLiveMode,
    addToast: overlays.addToast
  });

  // Studios render fixtures only, outside the shell, so each preview can own its theme.
  if (import.meta.env.DEV) {
    const studioParams = new URLSearchParams(window.location.search);
    if (studioParams.has('studio')) {
      const studioId = studioParams.get('studio');
      if (studioId === 'areas' && AreaStudio) {
        return (
          <Suspense fallback={null}>
            <AreaStudio />
          </Suspense>
        );
      }
      if (studioId === 'rooms' && RoomsStudio) {
        return (
          <Suspense fallback={null}>
            <RoomsStudio />
          </Suspense>
        );
      }
      if (studioId === 'energy' && EnergyStudio) {
        return (
          <Suspense fallback={null}>
            <EnergyStudio />
          </Suspense>
        );
      }
      if (studioId === 'security' && SecurityStudio) {
        return (
          <Suspense fallback={null}>
            <SecurityStudio />
          </Suspense>
        );
      }
      if (studioId === 'widgets' && WidgetStudio) {
        return (
          <Suspense fallback={null}>
            <WidgetStudio />
          </Suspense>
        );
      }
      if (StudioHub) {
        return (
          <Suspense fallback={null}>
            <StudioHub />
          </Suspense>
        );
      }
    }
  }

  if (startup.isAppLoading && snapshotStatus === 'pending') {
    return <div className="fixed inset-0 bg-background" aria-busy="true" />;
  }

  if (startup.isAppLoading) {
    return (
      <FullScreenLoadingPage
        progress={startup.loadingProgress}
        serverUrl={serverUrl || authState.haUrl}
        connectionStatus={connectionStatus}
        connectionError={connectionError}
        onEnterDemoMode={() => {
          enterDemoMode();
          useAutoLayoutStore.getState().reloadDemoData();
        }}
        onContinue={() => startup.setHasStartupTimeoutElapsed(true)}
        onRetry={startup.handleManualRefresh}
        isRetrying={startup.isManualRefreshing}
        darkMode={darkMode}
        onToggleTheme={() => handleToggleDarkMode()}
      />
    );
  }

  return (
    <>
      <ProShell page={activeTab} darkMode={darkMode} onNavigate={setActiveTab} onToggleTheme={() => handleToggleDarkMode()} onOpenNotifications={overlays.handleOpenNotifications}>
        {activeTab === 'overview' ? (
          <ProOverview />
        ) : activeTab === 'security' ? (
          <ProSecurity />
        ) : activeTab === 'rooms' ? (
          <ProRooms />
        ) : activeTab === 'energy' ? (
          <ProEnergy />
        ) : (
          <div className="pro-surface p-8 flex flex-col gap-2">
            <p className="text-muted">This page has not been rebuilt in the pro design yet. Security and Overview are in progress.</p>
          </div>
        )}
      </ProShell>

      {overlays.hasOpenedAuth && (
        <Suspense fallback={null}>
          <ProSignIn darkMode={darkMode} onDemo={() => useAutoLayoutStore.getState().reloadDemoData()} />
        </Suspense>
      )}
      {overlays.hasOpenedNotifications && (
        <Suspense fallback={null}>
          <ProNotificationCenter isOpen={overlays.isNotificationOpen} onClose={overlays.handleCloseNotifications} page={activeTab} />
        </Suspense>
      )}
      <ProToaster shellToasts={overlays.toasts} onDismissShellToast={overlays.dismissToast} page={activeTab} />
      {overlays.hasCriticalAlert && (
        <Suspense fallback={null}>
          <ProEmergencyAlert onOpenSecurity={() => setActiveTab('security')} />
        </Suspense>
      )}
    </>
  );
}
