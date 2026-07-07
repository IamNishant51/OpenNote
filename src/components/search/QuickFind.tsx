import { useState, useEffect, useRef } from "react";
import { Search, FileText, Trash2 } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace";
import { useUIStore } from "@/stores/ui";
import { useTauriCommands } from "@/hooks/useTauriCommands";
import { PageIcon } from "@/components/shared/PageIcon";

export function QuickFind() {
  const quickFindOpen = useUIStore(s => s.quickFindOpen);
  const setQuickFindOpen = useUIStore(s => s.setQuickFindOpen);
  const pages = useWorkspaceStore(s => s.pages);
  const { loadPage, createPage } = useTauriCommands();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Store quickFindOpen in a ref so the keydown handler always has the latest value
  // without needing to be in the effect deps (which caused re-registration on every toggle)
  const quickFindOpenRef = useRef(quickFindOpen);
  quickFindOpenRef.current = quickFindOpen;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setQuickFindOpen(!quickFindOpenRef.current);
      }
      if (e.key === "Escape" && quickFindOpenRef.current) {
        setQuickFindOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ← Register once; use ref for latest quickFindOpen value

  useEffect(() => {
    if (quickFindOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [quickFindOpen]);

  const filtered = pages.filter(
    (p) =>
      !p.is_trash &&
      p.title.toLowerCase().includes(query.toLowerCase()),
  );

  const handleSelect = (id: string) => {
    loadPage(id);
    setQuickFindOpen(false);
  };

  if (!quickFindOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30"
      onClick={() => setQuickFindOpen(false)}
    >
      <div
        className="w-full max-w-[640px] rounded-xl bg-white shadow-elevated border border-hairline overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
          <Search className="h-5 w-5 text-ink-muted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages..."
            className="flex-1 border-none bg-transparent text-body text-ink outline-none placeholder:text-ink-faint"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-sm text-ink-muted text-center">
              {query ? "No pages found" : "Type to search pages"}
            </p>
          ) : (
            filtered.map((page) => (
              <button
                key={page.id}
                onClick={() => handleSelect(page.id)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-secondary hover:bg-sidebar-hover transition-colors"
              >
                <PageIcon icon={page.icon} size="sm" className="flex-shrink-0" />
                <span className="truncate flex-1 text-left">
                  {page.title || "Untitled"}
                </span>
              </button>
            ))
          )}
        </div>
        {query && (
          <button
            onClick={() => {
              if (useWorkspaceStore.getState().currentWorkspace) {
                createPage(useWorkspaceStore.getState().currentWorkspace!.id);
                setQuickFindOpen(false);
              }
            }}
            className="flex w-full items-center gap-3 border-t border-hairline px-4 py-2.5 text-sm text-ink-muted hover:bg-sidebar-hover transition-colors"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary text-xs font-medium">
              +
            </span>
            <span>
              Create page "<strong>{query}</strong>"
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
