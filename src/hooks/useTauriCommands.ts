import { useCallback } from "react";
import { useWorkspaceStore } from "@/stores/workspace";
import { createBrowserPage, ensureBrowserState, readBrowserState, writeBrowserState } from "@/lib/browser-state";
import { isTauriRuntime, safeInvoke } from "@/lib/tauri";
import type { Page, Workspace } from "@/types";

export function useTauriCommands() {
  // Use getState() so this hook doesn't reactively subscribe to the store.
  // The setters returned by getState() are stable and don't change.
  const {
    setWorkspaces,
    setPages,
    setTrashedPages,
    setCurrentWorkspace,
    setCurrentPage,
    addPage,
    updatePage,
    removePage,
    setLoading,
  } = useWorkspaceStore.getState();

  const syncBrowserStores = useCallback(() => {
    const browserState = ensureBrowserState();
    const visiblePages = browserState.pages.filter((page) => !page.is_trash);
    const trashedPages = browserState.pages.filter((page) => page.is_trash);
    const currentWorkspace = browserState.workspaces.find((workspace) => workspace.id === browserState.currentWorkspaceId) ?? browserState.workspaces[0] ?? null;
    const currentPage = browserState.pages.find((page) => page.id === browserState.currentPageId && !page.is_trash) ?? visiblePages[0] ?? null;

    setWorkspaces(browserState.workspaces);
    setPages(visiblePages);
    setTrashedPages(trashedPages);
    setCurrentWorkspace(currentWorkspace);
    setCurrentPage(currentPage);
    setLoading(false);

    return browserState;
  }, [setCurrentPage, setCurrentWorkspace, setLoading, setPages, setTrashedPages, setWorkspaces]);

  const loadWorkspaces = useCallback(async () => {
    if (!isTauriRuntime()) {
      syncBrowserStores();
      return;
    }
    try {
      const workspaces = (await safeInvoke<Workspace[]>("get_workspaces", undefined, [])) ?? [];
      setWorkspaces(workspaces);
      if (workspaces.length > 0) {
        setCurrentWorkspace(workspaces[0]);
      }
    } catch (e) {
      console.error("Failed to load workspaces:", e);
    } finally {
      setLoading(false);
    }
  }, [setWorkspaces, setCurrentWorkspace]);

  const loadPages = useCallback(
    async (workspaceId: string) => {
      if (!isTauriRuntime()) {
        const browserState = syncBrowserStores();
        const pages = browserState.pages.filter((page) => page.workspace_id === workspaceId && !page.is_trash);
        setPages(pages);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const pages = (await safeInvoke<Page[]>("get_pages", {
          workspaceId,
        }, [])) ?? [];
        setPages(pages);
      } catch (e) {
        console.error("Failed to load pages:", e);
      } finally {
        setLoading(false);
      }
    },
    [setPages, setLoading],
  );

  const createPage = useCallback(
    async (workspaceId: string, parentId?: string, isDatabase?: boolean) => {
      if (!isTauriRuntime()) {
        const browserState = readBrowserState();
        const activeWorkspaceId = browserState.workspaces.some((workspace) => workspace.id === workspaceId)
          ? workspaceId
          : browserState.workspaces[0]?.id ?? workspaceId;
        const page = createBrowserPage(activeWorkspaceId, "Untitled", Boolean(isDatabase), parentId ?? null);
        const nextPages = [...browserState.pages, page];
        writeBrowserState({
          ...browserState,
          currentWorkspaceId: activeWorkspaceId,
          currentPageId: page.id,
          pages: nextPages,
        });
        setPages(nextPages.filter((item) => !item.is_trash));
        setTrashedPages(nextPages.filter((item) => item.is_trash));
        setCurrentWorkspace(browserState.workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? browserState.workspaces[0] ?? null);
        setCurrentPage(page);
        return page;
      }
      try {
        const page = await safeInvoke<Page>("create_page", {
          workspaceId,
          parentId: parentId || null,
          title: "Untitled",
          isDatabase: isDatabase || false,
        }, null as Page | null);
        if (!page) return null;
        addPage(page);
        setCurrentPage(page);
        return page;
      } catch (e) {
        console.error("Failed to create page:", e);
        return null;
      }
    },
    [addPage, setCurrentPage],
  );

  const loadPage = useCallback(
    async (id: string) => {
      if (!isTauriRuntime()) {
        const browserState = readBrowserState();
        const page = browserState.pages.find((item) => item.id === id) ?? null;
        setCurrentPage(page);
        writeBrowserState({ ...browserState, currentPageId: page?.id ?? null });
        return page;
      }
      try {
        const page = await safeInvoke<Page | null>("get_page", { id }, null);
        if (!page) return null;
        setCurrentPage(page);
        return page;
      } catch (e) {
        console.error("Failed to load page:", e);
        return null;
      }
    },
    [setCurrentPage],
  );

  const savePage = useCallback(
    async (
      id: string,
      title: string,
      icon: string,
      font: "default" | "serif" | "mono",
      width: "default" | "full",
      isFavorite: boolean,
    ) => {
      if (!isTauriRuntime()) {
        const browserState = readBrowserState();
        const nextPages = browserState.pages.map((page) => (
          page.id === id
            ? {
                ...page,
                title,
                icon,
                font,
                width,
                is_favorite: isFavorite,
                updated_at: new Date().toISOString(),
              }
            : page
        ));
        writeBrowserState({
          ...browserState,
          pages: nextPages,
          currentPageId: browserState.currentPageId === id ? id : browserState.currentPageId,
        });
        updatePage(id, { title, icon, font, width, is_favorite: isFavorite });
        return;
      }
      try {
        await safeInvoke("update_page", {
          id,
          title,
          icon,
          font,
          width,
          isFavorite,
        });
        updatePage(id, { title, icon, font, width, is_favorite: isFavorite });
      } catch (e) {
        console.error("Failed to save page:", e);
      }
    },
    [updatePage],
  );

  const toggleFavorite = useCallback(
    async (id: string) => {
      if (!isTauriRuntime()) {
        const browserState = readBrowserState();
        const target = browserState.pages.find((page) => page.id === id);
        const isFav = !(target?.is_favorite ?? false);
        const nextPages = browserState.pages.map((page) => (page.id === id ? { ...page, is_favorite: isFav, updated_at: new Date().toISOString() } : page));
        writeBrowserState({ ...browserState, pages: nextPages });
        updatePage(id, { is_favorite: isFav });
        return isFav;
      }
      try {
        const isFav = (await safeInvoke<boolean>("toggle_favorite", { id }, false)) ?? false;
        updatePage(id, { is_favorite: isFav });
        return isFav;
      } catch (e) {
        console.error("Failed to toggle favorite:", e);
      }
    },
    [updatePage],
  );

  const trashPage = useCallback(
    async (id: string) => {
      if (!isTauriRuntime()) {
        const browserState = readBrowserState();
        const nextPages = browserState.pages.map((page) => (page.id === id ? { ...page, is_trash: true, updated_at: new Date().toISOString() } : page));
        writeBrowserState({ ...browserState, pages: nextPages, currentPageId: browserState.currentPageId === id ? null : browserState.currentPageId });
        removePage(id);
        return;
      }
      try {
        await safeInvoke("trash_page", { id });
        removePage(id);
      } catch (e) {
        console.error("Failed to trash page:", e);
      }
    },
    [removePage],
  );

  const restorePage = useCallback(
    async (id: string) => {
      if (!isTauriRuntime()) {
        const browserState = readBrowserState();
        const nextPages = browserState.pages.map((page) => (page.id === id ? { ...page, is_trash: false, updated_at: new Date().toISOString() } : page));
        writeBrowserState({ ...browserState, pages: nextPages });
        setPages(nextPages.filter((page) => !page.is_trash));
        setTrashedPages(nextPages.filter((page) => page.is_trash));
        return;
      }
      try {
        await safeInvoke("restore_page", { id });
      } catch (e) {
        console.error("Failed to restore page:", e);
      }
    },
    [],
  );

  const loadTrashedPages = useCallback(
    async (workspaceId: string) => {
      if (!isTauriRuntime()) {
        const browserState = readBrowserState();
        setTrashedPages(browserState.pages.filter((page) => page.workspace_id === workspaceId && page.is_trash));
        return;
      }
      try {
        const pages = (await safeInvoke<Page[]>("get_trashed_pages", {
          workspaceId,
        }, [])) ?? [];
        setTrashedPages(pages);
      } catch (e) {
        console.error("Failed to load trashed pages:", e);
      }
    },
    [setTrashedPages],
  );

  const deletePagePermanently = useCallback(async (id: string) => {
    if (!isTauriRuntime()) {
      const browserState = readBrowserState();
      const nextPages = browserState.pages.filter((page) => page.id !== id);
      writeBrowserState({
        ...browserState,
        pages: nextPages,
        currentPageId: browserState.currentPageId === id ? null : browserState.currentPageId,
      });
      removePage(id);
      return;
    }
    try {
      await safeInvoke("delete_page_permanently", { id });
    } catch (e) {
      console.error("Failed to delete page:", e);
    }
  }, []);

  return {
    loadWorkspaces,
    loadPages,
    createPage,
    loadPage,
    savePage,
    toggleFavorite,
    trashPage,
    restorePage,
    loadTrashedPages,
    deletePagePermanently,
  };
}
