import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import { safeInvoke } from "@/lib/tauri";
import { isTauriRuntime } from "@/lib/tauri";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAIStore } from "@/stores/ai";
import { useTauriCommands } from "@/hooks/useTauriCommands";
import { createProviderModel } from "@/lib/ai/provider-registry";
import { generateText } from "ai";
import { PageIcon } from "@/components/shared/PageIcon";
import type { Page } from "@/types";

interface AISearchPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AISearchPanel({ open, onClose }: AISearchPanelProps) {
  const { currentWorkspace } = useWorkspaceStore();
  const { providers, selectedProviderId, selectedModelId } = useAIStore();
  const { loadPage } = useTauriCommands();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const allPagesRef = useRef<Page[]>([]);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);
  const selectedModel = selectedProvider?.models.find((m) => m.id === selectedModelId);

  const runSearch = useCallback(async () => {
    if (!query.trim() || !currentWorkspace) {
      setResults([]);
      return;
    }
    setLoading(true);
    setAiEnhanced(false);
    try {
      if (isTauriRuntime()) {
        const pages = await safeInvoke<Page[]>("search_pages", { workspaceId: currentWorkspace.id, query: query.trim() }, []);
        setResults(pages ?? []);
        allPagesRef.current = pages ?? [];
      } else {
        const state = JSON.parse(localStorage.getItem("opennotes_browser_state") || "{}");
        const pages: Page[] = (state.pages || []).filter((p: Page) =>
          !p.is_trash && p.title.toLowerCase().includes(query.toLowerCase())
        );
        setResults(pages);
        allPagesRef.current = pages;
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query, currentWorkspace]);

  useEffect(() => { if (open) runSearch(); else setQuery(""); }, [open, runSearch]);

  const handleAiEnhance = async () => {
    if (!selectedProvider || !selectedModel || results.length === 0) return;
    setAiLoading(true);
    try {
      const model = await createProviderModel(selectedProvider, selectedModelId!);
      if (!model) return;

      const prompt = `Rank these search results for query "${query}" by relevance. Return ONLY a JSON array of numbers representing the original indices in order of relevance (most relevant first). Example: [2, 0, 1]

Results:
${results.map((p, i) => `${i}: ${p.title}`).join("\n")}`;

      const res = await (generateText as any)({ model, system: "You are a search relevance ranker. Return only valid JSON.", prompt });
      const text = res.text || res.steps?.[0]?.text || "";
      const order = JSON.parse(text) as number[];
      if (Array.isArray(order)) {
        const reordered = order.map(i => allPagesRef.current[i]).filter(Boolean);
        if (reordered.length > 0) setResults(reordered);
      }
      setAiEnhanced(true);
    } catch (e) { console.error("AI rerank failed:", e); }
    setAiLoading(false);
  };

  const handleNavigate = (id: string) => {
    loadPage(id);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="w-96 border-l border-hairline bg-canvas flex flex-col">
      <div className="p-3 border-b border-hairline">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search across all pages..."
            className="w-full rounded-lg border border-hairline bg-canvas-soft px-8 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-primary transition-colors"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={handleAiEnhance}
            disabled={aiLoading || !selectedProvider || !selectedModel || results.length === 0}
            className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Re-rank</span>
            {aiLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </button>
          {aiEnhanced && <span className="text-xs text-accent-green">AI ranked</span>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-ink-muted" /></div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-ink-muted text-sm gap-2">
            <Search className="h-8 w-8" />
            <p>{query ? "No results found" : "Type to search"}</p>
          </div>
        ) : (
          results.map((page) => (
            <button
              key={page.id}
              onClick={() => handleNavigate(page.id)}
              className="w-full px-3 py-2.5 hover:bg-sidebar-hover border-b border-hairline text-left transition-colors"
            >
              <div className="flex items-start gap-2">
                <PageIcon icon={page.icon} size="sm" className="flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink truncate">{page.title || "Untitled"}</p>
                  <p className="text-xs text-ink-muted truncate">{page.updated_at}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}