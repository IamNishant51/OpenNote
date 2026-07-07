import type { Page, Workspace } from "@/types";

const STORAGE_KEY = "opennotes_browser_state";

export type BrowserState = {
  workspaces: Workspace[];
  pages: Page[];
  currentWorkspaceId: string | null;
  currentPageId: string | null;
};

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  return crypto.randomUUID();
}

function defaultState(): BrowserState {
  const workspaceId = createId();
  const workspace: Workspace = {
    id: workspaceId,
    name: "My Workspace",
    icon: "",
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  return {
    workspaces: [workspace],
    pages: [],
    currentWorkspaceId: workspaceId,
    currentPageId: null,
  };
}

function normalizePage(page: Page): Page {
  return {
    ...page,
    parent_id: page.parent_id ?? null,
    cover: page.cover ?? "",
    cover_position: page.cover_position ?? 0,
    font: page.font ?? "default",
    width: page.width ?? "default",
    is_favorite: Boolean(page.is_favorite),
    is_trash: Boolean(page.is_trash),
    is_database: Boolean(page.is_database),
  };
}

export function readBrowserState(): BrowserState {
  if (typeof window === "undefined") {
    return defaultState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const state = defaultState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    }

    const parsed = JSON.parse(raw) as Partial<BrowserState>;
    const workspaces = Array.isArray(parsed.workspaces) && parsed.workspaces.length > 0 ? parsed.workspaces : defaultState().workspaces;
    const pages = Array.isArray(parsed.pages) ? parsed.pages.map(normalizePage) : [];
    const currentWorkspaceId = parsed.currentWorkspaceId || workspaces[0]?.id || null;
    const currentPageId = parsed.currentPageId || null;

    return { workspaces, pages, currentWorkspaceId, currentPageId };
  } catch {
    const state = defaultState();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }
}

export function writeBrowserState(state: BrowserState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function ensureBrowserState(): BrowserState {
  const state = readBrowserState();
  if (!state.workspaces.length) {
    return defaultState();
  }
  return state;
}

export function createBrowserPage(workspaceId: string, title: string, isDatabase: boolean, parentId?: string | null): Page {
  const timestamp = nowIso();
  return {
    id: createId(),
    workspace_id: workspaceId,
    parent_id: parentId ?? null,
    title,
    icon: "",
    cover: "",
    cover_position: 0,
    font: "default",
    width: "default",
    is_favorite: false,
    is_trash: false,
    is_database: isDatabase,
    created_at: timestamp,
    updated_at: timestamp,
  };
}
