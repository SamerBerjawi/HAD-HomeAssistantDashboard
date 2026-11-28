/** What the pro UI shows for the Home Assistant connection (sidebar footer chip). */
export type ConnectionBadgeKind = 'demo' | 'live' | 'connecting' | 'auth_failed' | 'offline';

export interface ConnectionBadge {
  kind: ConnectionBadgeKind;
  label: string;
  color: 'accent' | 'success' | 'warning' | 'danger' | 'default';
  description: string;
}

/** Same rules as the classic sidebar telemetry: demo first, then the WebSocket status. */
export function connectionBadge(isLiveMode: boolean, connectionStatus: string, haCoreVersion?: string | null): ConnectionBadge {
  const version = haCoreVersion ? ` (v${haCoreVersion})` : '';
  if (!isLiveMode) {
    return { kind: 'demo', label: 'Demo', color: 'accent', description: 'Demo mode with sample data' };
  }
  switch (connectionStatus) {
    case 'connected':
      return { kind: 'live', label: 'Live', color: 'success', description: `Connected to Home Assistant${version}` };
    case 'connecting':
      return { kind: 'connecting', label: 'Connecting', color: 'warning', description: 'Connecting to Home Assistant' };
    case 'auth_failed':
      return { kind: 'auth_failed', label: 'Sign-in expired', color: 'danger', description: 'The Home Assistant session expired or the token is invalid' };
    default:
      return { kind: 'offline', label: 'Offline', color: 'default', description: 'Home Assistant is disconnected' };
  }
}
