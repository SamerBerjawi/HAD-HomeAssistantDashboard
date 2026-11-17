import { StrictMode } from 'react';
import { MotionConfig } from 'motion/react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import '@fontsource-variable/jetbrains-mono/wght.css';
import '@/index.css';
import './pro.css';
import ProApp from './ProApp';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { EntityPopupProvider } from '@/contexts/EntityPopupContext';
import { EditModeProvider } from '@/contexts/EditModeContext';
import RootErrorBoundary from '@/components/RootErrorBoundary';

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global] Unhandled promise rejection:', event.reason);
});
window.addEventListener('error', (event) => {
  console.error('[Global] Uncaught error:', event.error || event.message);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AuthProvider>
          <ConfigProvider>
            <EditModeProvider>
              <EntityPopupProvider>
                <ProApp />
              </EntityPopupProvider>
            </EditModeProvider>
          </ConfigProvider>
        </AuthProvider>
      </MotionConfig>
    </RootErrorBoundary>
  </StrictMode>,
);
