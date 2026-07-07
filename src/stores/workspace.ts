import { create } from "zustand";
import type { Workspace, Page } from "@/types";

interface WorkspaceStore {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  pages: Page[];
  currentPage: Page | null;
  trashedPages: Page[];
  sidebarOpen: boolean;
  loading: boolean;
  pendingTemplateContent: any[] | null;

  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setPages: (pages: Page[]) => void;
  setCurrentPage: (page: Page | null) => void;
  setTrashedPages: (pages: Page[]) => void;
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  addPage: (page: Page) => void;
  updatePage: (id: string, updates: Partial<Page>) => void;
  removePage: (id: string) => void;
  setPendingTemplateContent: (content: any[] | null) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  pages: [],
  currentPage: null,
  trashedPages: [],
  sidebarOpen: true,
  loading: true,
  pendingTemplateContent: null,

  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
  setPages: (pages) => set({ pages }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTrashedPages: (pages) => set({ trashedPages: pages }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setLoading: (loading) => set({ loading }),
  addPage: (page) => set((state) => ({ pages: [...state.pages, page] })),
  updatePage: (id, updates) =>
    set((state) => ({
      pages: state.pages.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      currentPage:
        state.currentPage?.id === id
            ? { ...state.currentPage, ...updates }
            : state.currentPage,
    })),
  removePage: (id) =>
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== id),
      currentPage: state.currentPage?.id === id ? null : state.currentPage,
    })),
  setPendingTemplateContent: (pendingTemplateContent) => set({ pendingTemplateContent }),
}));
