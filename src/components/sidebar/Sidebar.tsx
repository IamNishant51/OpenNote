import { useMemo, useState, useEffect } from "react";
import {
  ChevronRight, ChevronDown, Plus, Star, Trash2, Search,
  Sidebar as SidebarIcon, FileText, MoreHorizontal,
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
  const children = useMemo(
    () => pages.filter((p) => p.parent_id === page.id),
    [pages, page.id],
  );

  return (
    <div>
      <button
        onClick={() => onSelect(page.id)}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "group flex w-full items-center gap-1 rounded-sm px-2 py-1 text-sm transition-colors",
          "hover:bg-sidebar-hover",
          currentPage?.id === page.id
            ? "bg-sidebar-active text-ink"
            : "text-sidebar-text",
        )}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {children.length > 0 ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="flex h-4 w-4 items-center justify-center"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
        ) : (
          <span className="w-4" />
        )}
        <PageIcon icon={page.icon} size="sm" className="flex-shrink-0" />
        <span className="truncate flex-1 text-left">{page.title || "Untitled"}</span>
        <span className="hidden group-hover:flex items-center ml-auto">
          <MoreHorizontal className="h-3.5 w-3.5 text-ink-faint" />
        </span>
      </button>
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
