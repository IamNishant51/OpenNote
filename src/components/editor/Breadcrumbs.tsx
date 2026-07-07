import { useWorkspaceStore } from "@/stores/workspace";
import { useTauriCommands } from "@/hooks/useTauriCommands";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs() {
  const currentPage = useWorkspaceStore(s => s.currentPage);
  const pages = useWorkspaceStore(s => s.pages);
  const currentWorkspace = useWorkspaceStore(s => s.currentWorkspace);
  const { loadPage } = useTauriCommands();

  if (!currentPage) return null;

  const path = [];
  let current = currentPage;
  while (current.parent_id) {
    const parent = pages.find((p) => p.id === current.parent_id);
    if (!parent) break;
    path.unshift(parent);
    current = parent;
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-ink-muted mb-4 overflow-x-auto whitespace-nowrap">
      <span className="font-semibold text-ink-secondary">{currentWorkspace?.name || "Workspace"}</span>
      {path.map((page) => (
        <div key={page.id} className="flex items-center gap-1.5">
          <ChevronRight className="h-3 w-3 text-ink-faint" />
          <button
            onClick={() => loadPage(page.id)}
            className="hover:text-ink hover:underline cursor-pointer flex items-center gap-1"
          >
            {page.icon && <span>{page.icon}</span>}
            <span>{page.title || "Untitled"}</span>
          </button>
        </div>
      ))}
      <ChevronRight className="h-3 w-3 text-ink-faint" />
      <span className="font-semibold text-ink truncate flex items-center gap-1">
        {currentPage.icon && <span>{currentPage.icon}</span>}
        <span>{currentPage.title || "Untitled"}</span>
      </span>
    </div>
  );
}
