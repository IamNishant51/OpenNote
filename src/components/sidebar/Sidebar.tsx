import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronRight, ChevronDown, Plus, Star, Trash2, Search,
  Sidebar as SidebarIcon, FileText, MoreHorizontal, Pencil, Undo2,
  Upload, Download, Sparkles, Table2, LayoutTemplate,
} from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace";
import { useUIStore } from "@/stores/ui";
import { useAIStore } from "@/stores/ai";
import { cn } from "@/lib/utils";
import { useTauriCommands } from "@/hooks/useTauriCommands";
import { PageIcon } from "@/components/shared/PageIcon";
import type { Page } from "@/types";

function PageTreeItem({
  page,
  depth,
  onSelect,
}: {
  page: Page;
  depth: number;
  onSelect: (id: string) => void;
}) {
  const currentPage = useWorkspaceStore(s => s.currentPage);
  const pages = useWorkspaceStore(s => s.pages);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(page.title);
  const menuRef = useRef<HTMLDivElement>(null);
  const { trashPage, toggleFavorite, savePage, restorePage, deletePagePermanently } = useTauriCommands();

  const children = useMemo(
    () => pages.filter((p) => p.parent_id === page.id),
    [pages, page.id],
  );

  const handleRename = useCallback(async () => {
    const title = renameValue.trim() || "Untitled";
    await savePage(page.id, title, page.icon, page.font, page.width, page.is_favorite);
    setRenaming(false);
  }, [renameValue, page.id, savePage]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const isTrash = page.is_trash;

  return (
    <div>
      <div className="group relative flex w-full items-center rounded-sm text-sm transition-colors hover:bg-sidebar-hover"
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {children.length > 0 ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="flex h-4 w-4 items-center justify-center flex-shrink-0"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </span>
          ) : (
            <span className="w-4 flex-shrink-0" />
          )}
          <button
            onClick={() => onSelect(page.id)}
            onContextMenu={(e) => e.preventDefault()}
            className={cn(
              "flex items-center gap-1 flex-1 min-w-0 py-1 text-left",
              currentPage?.id === page.id
                ? "bg-sidebar-active text-ink"
                : "text-sidebar-text",
            )}
          >
            <PageIcon icon={page.icon} size="sm" className="flex-shrink-0" />
            {renaming ? (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setRenaming(false);
                }}
                className="flex-1 min-w-0 bg-transparent border-b border-primary outline-none text-sm px-0 py-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate flex-1">{page.title || "Untitled"}</span>
            )}
          </button>
        </div>
        <span className="hidden group-hover:flex items-center ml-0.5 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-sidebar-hover"
          >
            <MoreHorizontal className="h-3.5 w-3.5 text-ink-faint" />
          </button>
        </span>
        {menuOpen && (
          <div
            ref={menuRef}
            className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-hairline bg-canvas shadow-elevated py-1"
          >
            {isTrash ? (
              <>
                <button
                  onClick={async (e) => { e.stopPropagation(); await restorePage(page.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-sidebar-hover"
                >
                  <Undo2 className="h-3.5 w-3.5 text-ink-muted" />
                  Restore
                </button>
                <button
                  onClick={async (e) => { e.stopPropagation(); await deletePagePermanently(page.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-sidebar-hover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Permanently
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(page.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-sidebar-hover"
                >
                  <Star className={cn("h-3.5 w-3.5", page.is_favorite && "fill-yellow-500 text-yellow-500")} />
                  {page.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
                </button>
                <div className="border-t border-hairline my-1" />
                <button
                  onClick={(e) => { e.stopPropagation(); setRenameValue(page.title); setRenaming(true); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-ink hover:bg-sidebar-hover"
                >
                  <Pencil className="h-3.5 w-3.5 text-ink-muted" />
                  Rename
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); trashPage(page.id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-sidebar-hover"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Move to Trash
                </button>
              </>
            )}
          </div>
        )}
      </div>
      {expanded &&
        children.map((child) => (
          <PageTreeItem
            key={child.id}
            page={child}
            depth={depth + 1}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

function SidebarSection({
  label,
  icon,
  children,
  defaultOpen = true,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink-secondary transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        {icon}
        {label}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

export function Sidebar() {
  const pages = useWorkspaceStore(s => s.pages);
  const currentWorkspace = useWorkspaceStore(s => s.currentWorkspace);
  const sidebarOpen = useWorkspaceStore(s => s.sidebarOpen);
  const trashedPages = useWorkspaceStore(s => s.trashedPages);
  const currentPage = useWorkspaceStore(s => s.currentPage);
  const { setQuickFindOpen, setImportDialogOpen, setExportDialogOpen, setTemplatesGalleryOpen } = useUIStore();
  const { createPage, loadPage, loadTrashedPages, trashPage, toggleFavorite } =
    useTauriCommands();

  const rootPages = pages.filter((p) => !p.parent_id);
  const favoritePages = pages.filter((p) => p.is_favorite && !p.is_trash);

  useEffect(() => {
    if (currentWorkspace?.id) {
      loadTrashedPages(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  const handleCreatePage = async () => {
    if (currentWorkspace) {
      await createPage(currentWorkspace.id);
    }
  };

  const handleCreateDatabase = async () => {
    if (currentWorkspace) {
      await createPage(currentWorkspace.id, undefined, true);
    }
  };

  const handleSelectPage = (id: string) => {
    loadPage(id);
  };

  const handleToggleSidebar = () => {
    useWorkspaceStore.getState().setSidebarOpen(!sidebarOpen);
  };

  if (!sidebarOpen) {
    return (
      <div className="flex h-full w-10 flex-col items-center gap-2 border-r border-hairline bg-sidebar-bg pt-2">
        <button
          onClick={handleToggleSidebar}
          className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted"
        >
          <SidebarIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-60 flex-col border-r border-hairline bg-sidebar-bg">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <PageIcon icon={currentWorkspace?.icon} size="md" />
          <span className="text-sm font-semibold text-ink-secondary">
            {currentWorkspace?.name || "Workspace"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleSidebar}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted"
          >
            <SidebarIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5">
        <button
          onClick={() => setQuickFindOpen(true)}
          className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-ink-muted hover:bg-sidebar-hover transition-colors mb-2"
        >
          <Search className="h-4 w-4" />
          <span>Quick Find</span>
          <span className="ml-auto text-xs text-ink-faint">⌘K</span>
        </button>

        <SidebarSection label="Favorites" icon={<Star className="h-3 w-3" />}>
          {favoritePages.length === 0 && (
            <p className="px-6 py-1 text-xs text-ink-faint">
      No favorites yet
            </p>
          )}
          {favoritePages.map((page) => (
            <PageTreeItem
              key={page.id}
              page={page}
              depth={0}
              onSelect={handleSelectPage}
            />
          ))}
        </SidebarSection>

        <SidebarSection label="Pages" icon={<FileText className="h-3 w-3" />}>
          {rootPages.map((page) => (
            <PageTreeItem
              key={page.id}
              page={page}
              depth={0}
              onSelect={handleSelectPage}
            />
          ))}
          <button
            onClick={handleCreatePage}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-ink-muted hover:bg-sidebar-hover transition-colors"
            style={{ paddingLeft: "28px" }}
          >
            <Plus className="h-4 w-4" />
            <span>New page</span>
          </button>
          <button
            onClick={handleCreateDatabase}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm text-ink-muted hover:bg-sidebar-hover transition-colors"
            style={{ paddingLeft: "28px" }}
          >
            <Table2 className="h-4 w-4" />
            <span>New database</span>
          </button>
        </SidebarSection>

        <SidebarSection label="Trash" icon={<Trash2 className="h-3 w-3" />}>
          {trashedPages.length === 0 && (
            <p className="px-6 py-1 text-xs text-ink-faint">Trash is empty</p>
          )}
          {trashedPages.map((page) => (
            <PageTreeItem
              key={page.id}
              page={page}
              depth={0}
              onSelect={handleSelectPage}
            />
          ))}
        </SidebarSection>
      </div>

      <div className="border-t border-hairline px-2 py-1.5 space-y-0.5">
        <button
          onClick={() => useAIStore.getState().setPanelOpen(!useAIStore.getState().panelOpen)}
          className={cn(
            "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
            useAIStore.getState().panelOpen
              ? "bg-primary/10 text-primary"
              : "text-ink-muted hover:bg-sidebar-hover",
          )}
        >
          <Sparkles className="h-4 w-4" />
          <span>AI</span>
        </button>
        <button
          onClick={() => setTemplatesGalleryOpen(true)}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-ink-muted hover:bg-sidebar-hover transition-colors"
        >
          <LayoutTemplate className="h-4 w-4" />
          <span>Templates</span>
        </button>
        <button
          onClick={() => setImportDialogOpen(true)}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-ink-muted hover:bg-sidebar-hover transition-colors"
        >
          <Upload className="h-4 w-4" />
          <span>Import</span>
        </button>
        <button
          onClick={() => {
            if (currentPage) setExportDialogOpen(true);
          }}
          disabled={!currentPage}
          className={cn(
            "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
            currentPage
              ? "text-ink-muted hover:bg-sidebar-hover"
              : "text-ink-faint cursor-not-allowed",
          )}
        >
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>
    </div>
  );
}
