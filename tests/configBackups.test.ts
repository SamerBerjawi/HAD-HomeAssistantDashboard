import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createConfigStore } from '../server/services/configStore';
import type { ServerConfig } from '../server/lib/configTypes';

const tempDirs: string[] = [];

function makeTempConfigDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'had-config-backups-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop()!;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('configStore backup listing & snapshot reading (Phase 3.2)', () => {
  it('lists .bak and rolling snapshots with serverVersion and sizeBytes, rejecting path traversal', async () => {
    const dir = makeTempConfigDir();
    const store = createConfigStore({ configDir: dir });

    const v1 = { version: 1, preferences: { themeMode: 'dark' } } as unknown as ServerConfig;
    const v2 = { version: 1, preferences: { themeMode: 'light' } } as unknown as ServerConfig;

    await store.writeConfigFileAtomic(store.configFilePath, JSON.stringify({ serverVersion: 1, config: v1 }, null, 2));
    await store.writeConfigFileAtomic(store.configFilePath, JSON.stringify({ serverVersion: 2, config: v2 }, null, 2));

    const list = await store.listConfigBackups();
    expect(list.some((b) => b.filename === 'dashboard-config.json.bak' && b.kind === 'latest_bak' && b.serverVersion === 1)).toBe(true);
    expect(list.some((b) => b.kind === 'snapshot' && b.serverVersion === 1 && b.sizeBytes > 0)).toBe(true);

    const bak = await store.readConfigBackup('dashboard-config.json.bak');
    expect(bak?.serverVersion).toBe(1);
    expect((bak?.config.preferences as Record<string, unknown>)?.themeMode).toBe('dark');

    // Snapshot file lookup works too
    const snap = list.find((b) => b.kind === 'snapshot')!;
    const loadedSnap = await store.readConfigBackup(snap.filename);
    expect(loadedSnap?.serverVersion).toBe(1);

    // Reject path traversal & unapproved filenames
    expect(await store.readConfigBackup('../dashboard-config.json')).toBeNull();
    expect(await store.readConfigBackup('backups/' + snap.filename)).toBeNull();
    expect(await store.readConfigBackup('evil.json')).toBeNull();
    expect(await store.readConfigBackup('dashboard-config-../../etc/passwd.json')).toBeNull();
  });
});
