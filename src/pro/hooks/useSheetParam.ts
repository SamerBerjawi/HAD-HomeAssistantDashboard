/**
 * The open Overview sheet lives in the URL (rebuild, Phase 1): `?sheet=lights`,
 * `?sheet=cameras&id=camera.porch`. Opening pushes history, so the back button closes it and
 * notifications can link straight to a sheet. Only one sheet can be open.
 */
import { create } from 'zustand';

export interface SheetParam {
  sheet: string | null;
  itemId: string | null;
}

function read(): SheetParam {
  const params = new URLSearchParams(window.location.search);
  return { sheet: params.get('sheet'), itemId: params.get('id') };
}

/** Builds the URL for a sheet (for links from notifications and toasts). */
export function sheetHref(sheet: string, itemId?: string, base: string = window.location.href): string {
  const url = new URL(base);
  url.searchParams.set('sheet', sheet);
  if (itemId) url.searchParams.set('id', itemId);
  else url.searchParams.delete('id');
  return `${url.pathname}${url.search}${url.hash}`;
}

interface SheetStore extends SheetParam {
  open: (sheet: string, itemId?: string) => void;
  close: () => void;
}

// One shared copy: every component sees the same open sheet (pushState fires no event).
const useSheetStore = create<SheetStore>((set) => ({
  ...(typeof window === 'undefined' ? { sheet: null, itemId: null } : read()),
  open: (sheet, itemId) => {
    const opened = Boolean(read().sheet);
    const href = sheetHref(sheet, itemId);
    // Switching from one sheet to another replaces the entry, so Back still returns to the page.
    if (opened) window.history.replaceState({ ...window.history.state, proSheet: true }, '', href);
    else window.history.pushState({ ...window.history.state, proSheet: true }, '', href);
    set({ sheet, itemId: itemId ?? null });
  },
  close: () => {
    if (!read().sheet) return;
    if ((window.history.state as { proSheet?: boolean } | null)?.proSheet) {
      // We pushed it: going back keeps history and the phone back button in step.
      window.history.back();
      return;
    }
    // Arrived on a sheet link directly: drop the params instead of leaving the app.
    const url = new URL(window.location.href);
    url.searchParams.delete('sheet');
    url.searchParams.delete('id');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
    set({ sheet: null, itemId: null });
  }
}));

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => useSheetStore.setState(read()));
}

export function useSheetParam(): SheetStore {
  return useSheetStore();
}
