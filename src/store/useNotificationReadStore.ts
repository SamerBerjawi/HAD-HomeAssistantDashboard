/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Per-device read state for the notification center. Home Assistant has no read/unread concept
 * for updates, repairs or sensor alerts, so this lives locally (localStorage), keyed by
 * `readKeyOf(item)` from services/notifications/inbox.ts.
 */

import { create } from 'zustand';

const STORAGE_KEY = 'had.notifications.read.v1';
/** Bounded so the stored list can't grow forever; oldest keys drop first. */
export const MAX_READ_KEYS = 500;

function load(): string[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

function save(keys: string[]): void {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // Storage full or blocked: read state stays in memory for this session.
  }
}

/** Appends keys (deduped, most recent last) and trims to MAX_READ_KEYS. Pure. */
export function appendReadKeys(existing: readonly string[], add: readonly string[]): string[] {
  const set = new Set(existing);
  let changed = false;
  for (const k of add) {
    if (set.has(k)) continue;
    set.add(k);
    changed = true;
  }
  if (!changed) return existing as string[];
  const all = Array.from(set);
  return all.length > MAX_READ_KEYS ? all.slice(all.length - MAX_READ_KEYS) : all;
}

interface NotificationReadState {
  readKeys: ReadonlySet<string>;
  markRead: (keys: readonly string[]) => void;
}

let ordered = load();

export const useNotificationReadStore = create<NotificationReadState>((set) => ({
  readKeys: new Set(ordered),
  markRead: (keys) => {
    const next = appendReadKeys(ordered, keys);
    if (next === ordered) return;
    ordered = next;
    save(ordered);
    set({ readKeys: new Set(ordered) });
  }
}));
