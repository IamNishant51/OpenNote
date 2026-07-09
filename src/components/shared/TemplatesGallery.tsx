import { useState, useEffect, useRef } from "react";
import { LayoutTemplate, X, Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useWorkspaceStore } from "@/stores/workspace";
import { useTauriCommands } from "@/hooks/useTauriCommands";
import { cn } from "@/lib/utils";
import { isTauriRuntime } from "@/lib/tauri";
import type { Template } from "@/types/comments";

const FALLBACK_TEMPLATES: Template[] = [
  { id: "1", workspace_id: "", name: "Meeting Notes", icon: "📝", description: "Document meeting agenda, notes, and action items", category: "Business", content: JSON.stringify([{type:"heading",content:"Meeting Notes",props:{level:1}},{type:"paragraph",content:"Date: "},{type:"heading",content:"Attendees",props:{level:2}},{type:"paragraph",content:""},{type:"heading",content:"Agenda",props:{level:2}},{type:"bullet_list",children:[{type:"list_item",content:""}]},{type:"heading",content:"Notes",props:{level:2}},{type:"paragraph",content:""},{type:"heading",content:"Action Items",props:{level:2}},{type:"to_do",content:""}]), created_at: "" },
  { id: "2", workspace_id: "", name: "Project Plan", icon: "🚀", description: "Plan and track project milestones and tasks", category: "Business", content: JSON.stringify([{type:"heading",content:"Project Plan",props:{level:1}},{type:"paragraph",content:"Project: "},{type:"heading",content:"Goals",props:{level:2}},{type:"paragraph",content:""},{type:"heading",content:"Timeline",props:{level:2}},{type:"paragraph",content:""},{type:"heading",content:"Tasks",props:{level:2}},{type:"to_do",content:"Task 1"},{type:"to_do",content:"Task 2"}]), created_at: "" },
  { id: "3", workspace_id: "", name: "Weekly Review", icon: "📊", description: "Review your week and plan ahead", category: "Personal", content: JSON.stringify([{type:"heading",content:"Weekly Review",props:{level:1}},{type:"paragraph",content:"Week of: "},{type:"heading",content:"Wins",props:{level:2}},{type:"paragraph",content:""},{type:"heading",content:"Challenges",props:{level:2}},{type:"paragraph",content:""},{type:"heading",content:"Next Week",props:{level:2}},{type:"paragraph",content:""}]), created_at: "" },
  { id: "4", workspace_id: "", name: "Brain Dump", icon: "🧠", description: "Capture all your thoughts and ideas", category: "Personal", content: JSON.stringify([{type:"heading",content:"Brain Dump",props:{level:1}},{type:"paragraph",content:"Anything on your mind:"},{type:"bullet_list",children:[{type:"list_item",content:""}]}]), created_at: "" },
];

let cachedTemplates: Template[] | null = null;
let seededWorkspaces = new Set<string>();

export function TemplatesGallery({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [templates, setTemplates] = useState<Template[]>(cachedTemplates ?? FALLBACK_TEMPLATES);
  const [loading, setLoading] = useState(!cachedTemplates);
  const [category, setCategory] = useState<string>("all");
  const currentWorkspace = useWorkspaceStore(s => s.currentWorkspace);
  const { createPage } = useTauriCommands();
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!open || !currentWorkspace || templates.length > 0) return;
    if (loadingRef.current) return;
    loadingRef.current = true;

    setLoading(true);
    (async () => {
      try {
        if (isTauriRuntime()) {
          if (!seededWorkspaces.has(currentWorkspace.id)) {
            await invoke("seed_templates", { workspaceId: currentWorkspace.id });
            seededWorkspaces.add(currentWorkspace.id);
          }
          const result = await invoke<Template[]>("get_templates", { workspaceId: currentWorkspace.id });
          cachedTemplates = result;
          setTemplates(result);
        } else {
          cachedTemplates = FALLBACK_TEMPLATES;
          setTemplates(FALLBACK_TEMPLATES);
        }
      } catch { /* ignore */ } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    })();
  }, [open, currentWorkspace?.id]);

  const handleUseTemplate = async (template: Template) => {
    if (!currentWorkspace) return;
    try {
      const blocks = JSON.parse(template.content);
      useWorkspaceStore.getState().setPendingTemplateContent(blocks);
    } catch { /* ignore */ }
    const page = await createPage(currentWorkspace.id);
    if (page) onClose();
  };

  const categories = ["all", ...new Set(templates.map((t) => t.category))];
  const filtered = category === "all" ? templates : templates.filter((t) => t.category === category);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-xl bg-canvas shadow-elevated border border-hairline overflow-hidden max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
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
