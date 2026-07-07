import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Search, Loader2, Sparkles } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAIStore } from "@/stores/ai";
import { PageIcon } from "@/components/shared/PageIcon";
import type { Page } from "@/types";

interface AISearchPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AISearchPanel({ open, onClose }: AISearchPanelProps) {
  const { currentWorkspace } = useWorkspaceStore();
  const { providers, selectedProviderId, selectedModelId } = useAIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const selectedProvider = providers.find((provider) => provider.id === selectedProviderId);
  const selectedModel = selectedProvider?.models.find((model) => model.id === selectedModelId);

  const runSearch = useCallback(async () => {
    if (!query.trim() || !currentWorkspace) return;
    setLoading(true);
    try {
      const pages = await invoke<Page[]>("search_pages", { workspaceId: currentWorkspace.id, query: query.trim() });
      setResults(pages);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [query, currentWorkspace]);

  useEffect(() => { runSearch(); }, [runSearch]);

  const handleAiEnhance = async () => {
    if (!selectedProvider || !selectedModel || results.length === 0) return;
    setAiLoading(true);
    try {
      const prompt = `Rank these search results for query "${query}" by relevance. Return JSON array of page IDs in order:\n${results.map((p, i) => `${i}: ${p.id} - ${p.title}`).join("\n")}`;
      const res = await invoke<string>("ai_chat", { providerId: selectedProvider.id, modelId: selectedModel.id, messages: JSON.stringify([{ role: "user", content: prompt }]), temperature: 0.1 });
      const order = JSON.parse(res) as number[];
      const reordered = order.map(i => results[i]).filter(Boolean);
      setResults(reordered);
      setAiEnhanced(true);
    } catch (e) { console.error(e); }
    setAiLoading(false);
  };

  if (!open) return null;

  return (
    <div className="w-96 border-l border-hairline bg-canvas flex flex-col">
      <div className="p-3 border-b border-hairline">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-muted" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search across all pages..."
            className="w-full rounded-md border border-hairline bg-canvas px-8 py-2 text-sm outline-none focus:border-accent"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button onClick={handleAiEnhance} disabled={aiLoading || !selectedProvider || !selectedModel || results.length === 0} className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Re-rank</span>
            {aiLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          </button>
          {aiEnhanced && <span className="text-xs text-green-600">AI ranked</span>}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-ink-muted" /></div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-ink-muted text-sm gap-2">
            <Search className="h-8 w-8" />
            <p>No results found</p>
          </div>
        ) : (
          results.map((page, i) => (
            <button
              key={page.id}
              onClick={() => { /* navigate to page */ }}
              className="w-full px-3 py-2.5 hover:bg-sidebar-hover border-b border-hairline text-left transition-colors"
            >
              <div className="flex items-start gap-2">
                <PageIcon icon={page.icon} size="sm" className="flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{page.title}</p>
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