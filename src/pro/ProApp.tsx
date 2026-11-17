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
import ProSecurity from './pages/ProSecurity';

const AuthModal = lazy(() => import('@/components/auth/AuthModal'));
const NotificationDrawer = lazy(() => import('@/components/notifications/NotificationDrawer'));

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
      <ProShell
        page={activeTab}
        darkMode={darkMode}
        onNavigate={setActiveTab}
        onToggleTheme={() => handleToggleDarkMode()}
        onOpenNotifications={overlays.handleOpenNotifications}
      >
        {activeTab === 'security' ? (
          <ProSecurity />
        ) : (
          <div className="pro-surface p-8 flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight capitalize">{activeTab}</h1>
            <p className="text-muted">This page has not been rebuilt in the pro design yet. Security is the pilot.</p>
          </div>
        )}
      </ProShell>

      {overlays.hasOpenedAuth && (
        <Suspense fallback={null}>
          <AuthModal darkMode={darkMode} />
        </Suspense>
      )}
      {overlays.hasOpenedNotifications && (
        <Suspense fallback={null}>
          <NotificationDrawer isOpen={overlays.isNotificationOpen} onClose={overlays.handleCloseNotifications} darkMode={darkMode} />
        </Suspense>
      )}
    </>
  );
}
