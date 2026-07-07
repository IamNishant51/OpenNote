import { create } from "zustand";

interface UIStore {
  darkMode: boolean;
  quickFindOpen: boolean;
  importDialogOpen: boolean;
  exportDialogOpen: boolean;
  templatesGalleryOpen: boolean;
  commentsPanelOpen: boolean;
  versionHistoryOpen: boolean;
  backlinksOpen: boolean;
  tocOpen: boolean;
  aiSearchOpen: boolean;
  agentsOpen: boolean;
  automationsOpen: boolean;

  toggleDarkMode: () => void;
  setQuickFindOpen: (open: boolean) => void;
  setImportDialogOpen: (open: boolean) => void;
  setExportDialogOpen: (open: boolean) => void;
  setTemplatesGalleryOpen: (open: boolean) => void;
  setCommentsPanelOpen: (open: boolean) => void;
  setVersionHistoryOpen: (open: boolean) => void;
  setBacklinksOpen: (open: boolean) => void;
  setTocOpen: (open: boolean) => void;
  setAiSearchOpen: (open: boolean) => void;
  setAgentsOpen: (open: boolean) => void;
  setAutomationsOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
  quickFindOpen: false,
  importDialogOpen: false,
  exportDialogOpen: false,
  templatesGalleryOpen: false,
  commentsPanelOpen: false,
  versionHistoryOpen: false,
  backlinksOpen: false,
  tocOpen: false,
  aiSearchOpen: false,
  agentsOpen: false,
  automationsOpen: false,

  toggleDarkMode: () =>
    set((state) => {
      const next = !state.darkMode;
      document.documentElement.classList.toggle("dark", next);
      return { darkMode: next };
    }),
  setQuickFindOpen: (open) => set({ quickFindOpen: open }),
  setImportDialogOpen: (open) => set({ importDialogOpen: open }),
  setExportDialogOpen: (open) => set({ exportDialogOpen: open }),
  setTemplatesGalleryOpen: (open) => set({ templatesGalleryOpen: open }),
  setCommentsPanelOpen: (open) => set({ commentsPanelOpen: open }),
  setVersionHistoryOpen: (open) => set({ versionHistoryOpen: open }),
  setBacklinksOpen: (open) => set({ backlinksOpen: open }),
  setTocOpen: (open) => set({ tocOpen: open }),
  setAiSearchOpen: (open) => set({ aiSearchOpen: open }),
  setAgentsOpen: (open) => set({ agentsOpen: open }),
  setAutomationsOpen: (open) => set({ automationsOpen: open }),
}));
