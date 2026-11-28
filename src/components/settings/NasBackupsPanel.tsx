/**
 * Classic UI NAS Rolling Snapshots & Rollback panel (Phase 4):
 * Admin-only panel listing `.bak` and timestamped snapshots from `/api/config/backups`
 * and triggering atomic server-side restore via `POST /api/config/backups/:filename/restore`.
 */
import { useCallback, useEffect, useState } from 'react';
import { Button as AriaButton } from 'react-aria-components';
import { ArrowCounterClockwise, HardDrives, Warning } from '@phosphor-icons/react';
import { useUserConfig } from '../../contexts/ConfigContext';
import { getAuthHeadersAsync } from '../../services/configStorageService';
import { cn } from '../../lib/utils';
import { glass } from '../../lib/glass';
import DialogShell from '../ui/DialogShell';

interface BackupEntry {
  filename: string;
  kind: 'latest_bak' | 'snapshot';
  updatedAt: string;
  sizeBytes: number;
  serverVersion: number | null;
}

export default function NasBackupsPanel() {
  const { isSyncingRemote, currentUser, refreshConfig } = useUserConfig();
  const canManage = isSyncingRemote && Boolean(currentUser?.isAdmin);

  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<BackupEntry | null>(null);
  const [restoring, setRestoring] = useState(false);

  const loadBackups = useCallback(async () => {
    if (!canManage) return;
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeadersAsync();
      const res = await fetch('/api/config/backups', { headers });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { backups?: BackupEntry[] };
      setBackups(Array.isArray(data.backups) ? data.backups : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load NAS snapshots');
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    void loadBackups();
  }, [loadBackups]);

  if (!canManage) return null;

  const handleConfirmRestore = async () => {
    if (!confirmTarget) return;
    setRestoring(true);
    setError(null);
    try {
      const headers = await getAuthHeadersAsync();
      const res = await fetch(`/api/config/backups/${encodeURIComponent(confirmTarget.filename)}/restore`, {
        method: 'POST',
        headers
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      await refreshConfig?.();
      setStatus(`Restored "${confirmTarget.filename}" for all devices.`);
      setConfirmTarget(null);
      await loadBackups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <HardDrives size={14} weight="duotone" className="text-amber-500" />
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            NAS Server Rolling Snapshots (Admin)
          </span>
        </div>
        <AriaButton
          onPress={() => void loadBackups()}
          isDisabled={loading}
          className="rounded-lg px-2 py-1 text-[11px] font-bold text-sky-600 hover:bg-sky-500/10 dark:text-sky-400 cursor-pointer"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </AriaButton>
      </div>

      {status ? (
        <div className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
          {status}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {backups.length === 0 && !loading ? (
        <div className="p-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-dashed border-slate-300 dark:border-white/10 text-center text-xs text-slate-400">
          No NAS snapshots found yet.
        </div>
      ) : (
        <div className="space-y-1.5 max-h-56 overflow-y-auto touch-scroll-container pr-0.5">
          {backups.map((b) => (
            <div key={b.filename} className={cn(glass.field, 'p-2.5 rounded-xl flex items-center justify-between gap-2 shadow-xs')}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white truncate">
                  <span className="truncate">{b.kind === 'latest_bak' ? 'Latest pre-save (.bak)' : b.filename}</span>
                  {b.serverVersion !== null ? (
                    <span className="rounded-full bg-slate-500/15 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                      v{b.serverVersion}
                    </span>
                  ) : null}
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  {new Date(b.updatedAt).toLocaleString()} · {(b.sizeBytes / 1024).toFixed(1)} KB
                </div>
              </div>
              <AriaButton
                onPress={() => setConfirmTarget(b)}
                className="inline-flex h-7 items-center gap-1 rounded-lg bg-sky-500/15 px-2.5 text-[11px] font-bold text-sky-700 hover:bg-sky-500/25 dark:text-sky-300 cursor-pointer shrink-0"
              >
                <ArrowCounterClockwise size={12} weight="bold" />
                Restore
              </AriaButton>
            </div>
          ))}
        </div>
      )}

      {confirmTarget ? (
        <DialogShell
          label="Confirm NAS snapshot restore"
          onClose={() => !restoring && setConfirmTarget(null)}
          overlayClassName="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 p-5 shadow-2xl space-y-3.5 text-center"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
            <Warning size={24} weight="duotone" />
          </div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">Restore NAS Snapshot?</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Restore <span className="font-mono font-semibold">{confirmTarget.filename}</span> for all devices? Current config is saved to <span className="font-mono">.bak</span> first.
          </p>
          <div className="flex justify-center gap-2.5 pt-1">
            <AriaButton
              isDisabled={restoring}
              onPress={() => setConfirmTarget(null)}
              className="h-9 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </AriaButton>
            <AriaButton
              isDisabled={restoring}
              onPress={() => void handleConfirmRestore()}
              className="h-9 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md cursor-pointer"
            >
              {restoring ? 'Restoring…' : 'Confirm Restore'}
            </AriaButton>
          </div>
        </DialogShell>
      ) : null}
    </div>
  );
}
