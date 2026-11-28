import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Alert, Button, Description, FieldError, Form, InputGroup, Label, Spinner, Tabs, TextField } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Alert02Icon,
  Cancel01Icon,
  Home01Icon,
  InformationCircleIcon,
  Key01Icon,
  Link01Icon,
  Login03Icon,
  SmartPhone01Icon,
  SparklesIcon,
  ViewIcon,
  ViewOffIcon
} from '@hugeicons/core-free-icons';
import { useAuth } from '@/contexts/AuthContext';
import { isStandalonePWA, validateHaUrl } from '@/services/haAuth';
import { cn } from '@/lib/utils';
import { AuthCard } from '../ui/boardui/AuthCard';

type Method = 'oauth' | 'llat';

interface ProSignInProps {
  darkMode: boolean;
  /** Called after demo mode is entered, so the store can load the demo data. */
  onDemo: () => void;
}

const DEFAULT_URL = 'http://homeassistant.local:8123';

function initialUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_URL;
  return localStorage.getItem('ha_server_url') || localStorage.getItem('had_last_ha_url') || DEFAULT_URL;
}

function Notice({ status, icon, title, children }: { status: 'danger' | 'warning' | 'accent'; icon: typeof Alert02Icon; title: string; children?: ReactNode }) {
  return (
    <Alert status={status}>
      <Alert.Indicator>
        <HugeiconsIcon icon={icon} size={18} />
      </Alert.Indicator>
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        {children ? <Alert.Description>{children}</Alert.Description> : null}
      </Alert.Content>
    </Alert>
  );
}

/**
 * Pro sign-in page (docs/pro-ui/DESIGN.md, section 7.1): the BoardUI Auth Card shell with HeroUI
 * controls. Same behaviour as the classic AuthModal: Home Assistant URL, OAuth2 or long-lived
 * token, demo mode, and it cannot be dismissed until the user is signed in or in demo mode.
 */
export default function ProSignIn({ darkMode, onDemo }: ProSignInProps) {
  const { authState, isAuthModalOpen, closeAuthModal, loginOAuth, loginLLAT, enterDemoMode, error, clearError } = useAuth();

  const isPWA = typeof window !== 'undefined' && isStandalonePWA();
  // Installed PWAs default to the token: OAuth has to leave the app window there.
  const [method, setMethod] = useState<Method>(isPWA ? 'llat' : 'oauth');
  const [haUrl, setHaUrl] = useState<string>(initialUrl);
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canClose = authState.isAuthenticated || authState.isDemo;

  // A server-configured HASS_URL wins over a stale saved value: it is the only instance the server accepts.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/public-config')
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (!cancelled && cfg && typeof cfg.haUrl === 'string' && cfg.haUrl) setHaUrl(cfg.haUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuthModalOpen || !canClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isAuthModalOpen, canClose, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const trimmedUrl = haUrl.trim().toLowerCase();
  const isMixedContent = typeof window !== 'undefined' && window.location.protocol === 'https:' && trimmedUrl.startsWith('http://');
  const isIpTarget = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?/i.test(haUrl.trim());
  const bannerError = submitError || error;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();
    setSubmitError(null);
    const invalidUrl = validateHaUrl(haUrl);
    setUrlError(invalidUrl);
    if (invalidUrl) return;

    if (method === 'oauth') {
      loginOAuth(haUrl);
      return;
    }

    if (!token.trim()) {
      setTokenError('Enter your long-lived access token.');
      return;
    }
    setTokenError(null);
    setIsSubmitting(true);
    const result = await loginLLAT(haUrl, token);
    setIsSubmitting(false);
    if (!result.success && result.error) setSubmitError(result.error);
  };

  const handleDemo = () => {
    enterDemoMode();
    onDemo();
  };

  const logo = (
    <div className="flex items-center gap-3">
      <span className="pro-accent grid size-11 place-items-center rounded-xl">
        <HugeiconsIcon icon={Home01Icon} size={22} />
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-bold tracking-tight text-foreground">HAD</span>
        <span className="text-xs text-muted">Home Assistant Dashboard</span>
      </div>
    </div>
  );

  return (
    <div
      className={cn('pro fixed inset-0 z-50 overflow-y-auto', darkMode && 'dark')}
      data-page="overview"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pro-sign-in-title"
    >
      {canClose && (
        <Button
          isIconOnly
          variant="ghost"
          aria-label="Close"
          className="absolute right-4 top-[max(16px,env(safe-area-inset-top))]"
          onPress={closeAuthModal}
        >
          <HugeiconsIcon icon={Cancel01Icon} size={20} />
        </Button>
      )}

      <div className="flex min-h-full items-center justify-center px-4 py-[max(24px,env(safe-area-inset-top))]">
        <AuthCard
          logo={logo}
          title={<span id="pro-sign-in-title">Welcome home</span>}
          description="Sign in with your Home Assistant to continue."
          alternatives={
            <Button variant="secondary" fullWidth onPress={handleDemo}>
              <HugeiconsIcon icon={SparklesIcon} size={18} />
              Explore the demo
            </Button>
          }
          footnote="Demo mode uses sample data stored only in this browser."
        >
          <Form className="flex flex-col gap-4" onSubmit={handleSubmit} validationBehavior="aria">
            {bannerError && <Notice status="danger" icon={Alert02Icon} title="Sign-in failed">{bannerError}</Notice>}

            <Tabs
              selectedKey={method}
              onSelectionChange={(key) => {
                setMethod(key as Method);
                setSubmitError(null);
                clearError();
              }}
            >
              <Tabs.ListContainer>
                <Tabs.List aria-label="Sign-in method" className="w-full">
                  <Tabs.Tab id="oauth" className="flex-1 gap-1.5 whitespace-nowrap">
                    <HugeiconsIcon icon={Login03Icon} size={16} />
                    OAuth2
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="llat" className="flex-1 gap-1.5 whitespace-nowrap">
                    <HugeiconsIcon icon={Key01Icon} size={16} />
                    Access token
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>

              <TextField
                className="mt-4"
                name="haUrl"
                type="url"
                isInvalid={!!urlError}
                value={haUrl}
                onChange={(v) => {
                  setHaUrl(v);
                  setUrlError(null);
                }}
              >
                <Label>Home Assistant URL</Label>
                <InputGroup fullWidth variant="secondary">
                  <InputGroup.Prefix>
                    <HugeiconsIcon icon={Link01Icon} size={16} />
                  </InputGroup.Prefix>
                  <InputGroup.Input placeholder={DEFAULT_URL} autoComplete="url" inputMode="url" spellCheck={false} />
                </InputGroup>
                {urlError ? (
                  <FieldError>{urlError}</FieldError>
                ) : (
                  <Description>Your local address or your Nabu Casa URL.</Description>
                )}
              </TextField>

              {isMixedContent && (
                <div className="mt-4">
                  <Notice status="warning" icon={Alert02Icon} title="Use an https:// address">
                    This dashboard runs on HTTPS, so the browser blocks an http:// Home Assistant. Use your HTTPS
                    address (Nabu Casa or DuckDNS) or the access token.
                  </Notice>
                </div>
              )}

              <Tabs.Panel id="oauth" className="flex flex-col gap-4 px-0 pb-0 pt-4">
                {isIpTarget && (
                  <Notice status="accent" icon={InformationCircleIcon} title="OAuth2 needs a hostname">
                    Home Assistant sign-in does not accept a raw IP address. Use a hostname such as
                    homeassistant.local, or switch to Access token.
                  </Notice>
                )}
                {isPWA && (
                  <Notice status="accent" icon={SmartPhone01Icon} title="Opens in a browser window">
                    In the installed app, sign-in opens Home Assistant in a separate window and returns here when done.
                  </Notice>
                )}
                <Button type="submit" variant="primary" fullWidth>
                  <HugeiconsIcon icon={Login03Icon} size={18} />
                  Sign in with Home Assistant
                </Button>
              </Tabs.Panel>

              <Tabs.Panel id="llat" className="flex flex-col gap-4 px-0 pb-0 pt-4">
                <TextField
                  name="token"
                  isInvalid={!!tokenError}
                  value={token}
                  onChange={(v) => {
                    setToken(v);
                    setTokenError(null);
                  }}
                >
                  <Label>Long-lived access token</Label>
                  <InputGroup fullWidth variant="secondary">
                    <InputGroup.Prefix>
                      <HugeiconsIcon icon={Key01Icon} size={16} />
                    </InputGroup.Prefix>
                    <InputGroup.Input
                      type={showToken ? 'text' : 'password'}
                      placeholder="eyJhbGciOiJIUzI1NiIs…"
                      autoComplete="off"
                      spellCheck={false}
                      className="font-mono"
                    />
                    <InputGroup.Suffix>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        aria-label={showToken ? 'Hide token' : 'Show token'}
                        onPress={() => setShowToken((s) => !s)}
                      >
                        <HugeiconsIcon icon={showToken ? ViewOffIcon : ViewIcon} size={16} />
                      </Button>
                    </InputGroup.Suffix>
                  </InputGroup>
                  {tokenError ? (
                    <FieldError>{tokenError}</FieldError>
                  ) : (
                    <Description>In Home Assistant: Profile, Security, Long-lived access tokens, Create token.</Description>
                  )}
                </TextField>
                <Button type="submit" variant="primary" fullWidth isPending={isSubmitting}>
                  {isSubmitting ? <Spinner size="sm" color="current" /> : <HugeiconsIcon icon={Key01Icon} size={18} />}
                  {isSubmitting ? 'Connecting…' : 'Connect with token'}
                </Button>
              </Tabs.Panel>
            </Tabs>
          </Form>
        </AuthCard>
      </div>
    </div>
  );
}
