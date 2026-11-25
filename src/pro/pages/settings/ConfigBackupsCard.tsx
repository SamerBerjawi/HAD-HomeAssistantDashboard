/**
 * Config Backups & NAS Rolling Snapshot Rollback card for Pro Settings (Phase 3.2).
 */
import { useCallback, useEffect, useState } from 'react';
import { Button, Modal } from '@heroui/react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Download01Icon, HardDriveIcon, RefreshIcon, RotateLeft01Icon, Upload01Icon } from '@hugeicons/core-free-icons';
import { FileTrigger } from 'react-aria-components';
import { useUserConfig } from '@/contexts/ConfigContext';
import { getAuthHeadersAsync } from '@/services/configStorageService';

interface BackupEntry {
  filename: string;
  kind: 'latest_bak' | 'snapshot';
  updatedAt: string;
  sizeBytes: number;
  serverVersion: number | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return iso;
  }
}

export function ConfigBackupsCard() {
  const { isSyncingRemote, currentUser, exportConfigJson, importConfigJson, refreshConfig } = useUserConfig();
  const canManageServerBackups = isSyncingRemote && Boolean(currentUser?.isAdmin);

  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<BackupEntry | null>(null);
  const [restoring, setRestoring] = useState(false);

  const loadBackups = useCallback(async () => {
    if (!canManageServerBackups) return;
    setLoadingList(true);
    setListError(null);
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
      setListError(err instanceof Error ? err.message : 'Could not load NAS snapshots');
    } finally {
      setLoadingList(false);
    }
  }, [canManageServerBackups]);

  useEffect(() => {
    void loadBackups();
  }, [loadBackups]);

  const handleDownloadJson = () => {
    const json = exportConfigJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `homz-dashboard-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatusMessage('Downloaded JSON backup.');
  };

  const handleImportJson = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const ok = await importConfigJson(text);
      setStatusMessage(ok ? `Imported "${file.name}".` : 'Import failed: invalid dashboard config JSON.');
      if (ok && canManageServerBackups) {
        void loadBackups();
      }
    } catch {
      setStatusMessage('Import failed: could not read selected file.');
    }
  };

  const handleConfirmRestore = async () => {
    if (!confirmTarget) return;
    setRestoring(true);
    setListError(null);
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
      setStatusMessage(`Restored snapshot "${confirmTarget.filename}". All connected devices will sync automatically.`);
      setConfirmTarget(null);
      await loadBackups();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Failed to restore snapshot');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <section aria-label="Backups and restore" className="pro-surface flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="pro-soft grid size-9 shrink-0 place-items-center rounded-xl">
            <HugeiconsIcon icon={HardDriveIcon} size={18} />
          </span>
          <div>
            <h2 className="text-base font-semibold leading-tight">Backups &amp; Recovery</h2>
            <p className="mt-0.5 text-xs text-muted">
              Export or import dashboard JSON, or roll back NAS storage to a previous automatic snapshot.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" onPress={handleDownloadJson} className="gap-1.5 text-xs">
            <HugeiconsIcon icon={Download01Icon} size={14} />
            Export JSON
          </Button>
          <FileTrigger
            acceptedFileTypes={['.json', 'application/json']}
            onSelect={(files) => void handleImportJson(files)}
          >
            <Button size="sm" variant="secondary" className="gap-1.5 text-xs">
              <HugeiconsIcon icon={Upload01Icon} size={14} />
              Import JSON
            </Button>
          </FileTrigger>
        </div>
      </div>

      {statusMessage ? (
        <p className="rounded-xl bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] px-3 py-2 text-xs text-[var(--accent)]">
          {statusMessage}
        </p>
      ) : null}

      {canManageServerBackups ? (
        <div className="flex flex-col gap-2.5 border-t border-[color-mix(in_srgb,currentColor_10%,transparent)] pt-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">NAS Rolling Snapshots</h3>
              <p className="text-xs text-muted">Admins can restore any saved checkpoint for all connected devices.</p>
            </div>
            <Button size="sm" variant="ghost" isDisabled={loadingList} onPress={() => void loadBackups()} className="gap-1.5 text-xs">
              <HugeiconsIcon icon={RefreshIcon} size={14} />
              {loadingList ? 'Loading…' : 'Refresh'}
            </Button>
          </div>

          {listError ? <p className="text-xs text-danger">{listError}</p> : null}

          {backups.length === 0 && !loadingList ? (
            <p className="rounded-xl bg-default/40 px-3 py-2.5 text-xs text-muted">
              No NAS backup snapshots found yet. Snapshots are created automatically when saving changes.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {backups.map((b) => (
                <div
                  key={b.filename}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-default/40 px-3 py-2 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">
                        {b.kind === 'latest_bak' ? 'Latest pre-save (.bak)' : b.filename}
                      </span>
                      {b.serverVersion !== null ? (
                        <span className="rounded-full bg-default/70 px-2 py-0.5 text-[10px] font-medium text-muted">
                          v{b.serverVersion}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {formatTimestamp(b.updatedAt)} · {formatBytes(b.sizeBytes)}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" onPress={() => setConfirmTarget(b)} className="h-7 gap-1 px-2.5 text-xs">
                    <HugeiconsIcon icon={RotateLeft01Icon} size={13} />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      <Modal.Backdrop isOpen={Boolean(confirmTarget)} onOpenChange={(open) => !open && !restoring && setConfirmTarget(null)}>
        <Modal.Container size="sm">
          <Modal.Dialog aria-label="Confirm snapshot restore" className="pro" data-page="settings">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Restore snapshot?</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="flex flex-col gap-4 pb-4">
              <p className="text-sm text-muted">
                Replace the active server configuration with <span className="font-medium text-foreground">{confirmTarget?.filename}</span>? Your current state will be preserved in <span className="font-mono text-xs">.bak</span> first.
              </p>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" isDisabled={restoring} onPress={() => setConfirmTarget(null)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" isDisabled={restoring} onPress={() => void handleConfirmRestore()}>
                  {restoring ? 'Restoring…' : 'Restore snapshot'}
                </Button>
              </div>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </section>
  );
}
