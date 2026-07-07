import { useState, useEffect } from "react";
import { LayoutTemplate, X, Loader2, Plus } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useWorkspaceStore } from "@/stores/workspace";
import { useTauriCommands } from "@/hooks/useTauriCommands";
import { cn } from "@/lib/utils";
import type { Template } from "@/types/comments";

export function TemplatesGallery({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<string>("all");
  const currentWorkspace = useWorkspaceStore(s => s.currentWorkspace);
  const { createPage } = useTauriCommands();

  useEffect(() => {
    if (open && currentWorkspace) {
      setLoading(true);
      invoke<Template[]>("get_templates", { workspaceId: currentWorkspace.id }).then(setTemplates).catch(() => {}).finally(() => setLoading(false));
      invoke("seed_templates", { workspaceId: currentWorkspace.id }).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentWorkspace?.id]);

  const handleUseTemplate = async (template: Template) => {
    if (!currentWorkspace) return;
    try {
      const blocks = JSON.parse(template.content);
      useWorkspaceStore.getState().setPendingTemplateContent(blocks);
    } catch (e) {
      console.error("Failed to parse template content:", e);
    }
    const page = await createPage(currentWorkspace.id);
    if (page) {
      onClose();
    }
  };

  const categories = ["all", ...new Set(templates.map((t) => t.category))];
  const filtered = category === "all" ? templates : templates.filter((t) => t.category === category);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-elevated border border-hairline overflow-hidden max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
          <div className="flex items-center gap-2"><LayoutTemplate className="h-5 w-5 text-ink-muted" /><h2 className="text-sm font-semibold text-ink">Templates</h2></div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex gap-1 px-4 pt-3 pb-2 border-b border-hairline">
          {categories.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={cn("rounded-md px-3 py-1 text-xs font-medium transition-colors", category === cat ? "bg-primary text-white" : "bg-sidebar-bg text-ink-muted hover:text-ink-secondary")}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-ink-muted" /></div> :
            <div className="grid grid-cols-2 gap-3">
              {filtered.map((t) => (
                <button key={t.id} onClick={() => handleUseTemplate(t)}
                  className="rounded-lg border border-hairline p-4 text-left hover:border-ink-faint hover:shadow-soft transition-all group">
                  <div className="text-2xl mb-2">{t.icon}</div>
                  <h3 className="text-sm font-semibold text-ink mb-1">{t.name}</h3>
                  <p className="text-xs text-ink-muted">{t.description}</p>
                </button>
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
}
