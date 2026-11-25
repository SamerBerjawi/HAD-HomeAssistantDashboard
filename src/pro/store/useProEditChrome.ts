/**
 * Tracks whether any Pro page is currently in Edit Mode so global mobile chrome
 * (`ProMobileNav`) yields the bottom thumb zone to `ProEditBar`.
 */
import { create } from 'zustand';

export type ProEditingPage = 'overview' | 'rooms' | 'room';

interface ProEditChromeState {
  editingPage: ProEditingPage | null;
  setEditingPage: (page: ProEditingPage | null) => void;
}

export const useProEditChrome = create<ProEditChromeState>((set) => ({
  editingPage: null,
  setEditingPage: (editingPage) => set((prev) => (prev.editingPage === editingPage ? prev : { editingPage }))
}));
