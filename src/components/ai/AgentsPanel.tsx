import { useState, useEffect } from "react";
import { Plus, Trash2, Settings, Bot, X, Save } from "lucide-react";
import { useAIStore } from "@/stores/ai";
import type { CustomAgent } from "@/types/ai";

interface AgentsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AgentsPanel({ open, onClose }: AgentsPanelProps) {
  const setCustomAgents = useAIStore((state) => state.setCustomAgents);
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [editing, setEditing] = useState<CustomAgent | null>(null);
  const [form, setForm] = useState({ name: "", description: "", systemPrompt: "", model: "", temperature: 0.7 });

  useEffect(() => {
    const saved = localStorage.getItem("opennotes_custom_agents");
    if (saved) { setAgents(JSON.parse(saved)); setCustomAgents(JSON.parse(saved)); }
  }, [setCustomAgents]);

  const saveAgents = (next: CustomAgent[]) => {
    localStorage.setItem("opennotes_custom_agents", JSON.stringify(next));
    setAgents(next);
    setCustomAgents(next);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.systemPrompt.trim()) return;
    const agent: CustomAgent = {
      id: editing?.id || crypto.randomUUID(),
      ...form,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    saveAgents(editing ? agents.map(a => a.id === agent.id ? agent : a) : [...agents, agent]);
    setEditing(null);
    setForm({ name: "", description: "", systemPrompt: "", model: "", temperature: 0.7 });
  };

  const startEdit = (a: CustomAgent) => {
    setEditing(a);
    setForm({
      name: a.name,
      description: a.description,
      systemPrompt: a.systemPrompt,
      model: a.model ?? a.modelId ?? "",
      temperature: a.temperature ?? 0.7,
    });
  };
  const deleteAgent = (id: string) => { saveAgents(agents.filter(a => a.id !== id)); };

  if (!open) return null;

  return (
    <div className="w-96 border-l border-hairline bg-canvas flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-hairline">
        <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-ink-muted" /><span className="text-sm font-medium">Custom AI Agents</span></div>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-sidebar-hover text-ink-muted"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {editing ? (
          <div className="p-3 space-y-3 border-b border-hairline">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Agent name" className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm outline-none focus:border-accent" />
            <input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm outline-none focus:border-accent" />
            <textarea value={form.systemPrompt} onChange={e => setForm({...form, systemPrompt: e.target.value})} placeholder="System prompt..." rows={4} className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm outline-none focus:border-accent resize-none" />
            <div className="flex gap-2">
              <input value={form.model} onChange={e => setForm({...form, model: e.target.value})} placeholder="Model (optional)" className="flex-1 rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm outline-none focus:border-accent" />
              <input type="number" step="0.1" min="0" max="2" value={form.temperature} onChange={e => setForm({...form, temperature: parseFloat(e.target.value)})} className="w-20 rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm outline-none focus:border-accent" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setEditing(null); setForm({ name: "", description: "", systemPrompt: "", model: "", temperature: 0.7 }); }} className="rounded-md px-3 py-1.5 text-sm text-ink-muted hover:bg-sidebar-hover">Cancel</button>
              <button onClick={handleSubmit} className="rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover"><Save className="h-3.5 w-3.5 mr-1" />Save</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditing(null)} className="w-full p-3 text-left hover:bg-sidebar-hover border-b border-hairline flex items-center gap-2">
            <Plus className="h-4 w-4 text-ink-muted" /><span className="text-sm text-ink-muted">Create new agent</span>
          </button>
        )}
        {agents.length === 0 && !editing ? (
          <div className="flex flex-col items-center justify-center h-32 text-ink-muted text-sm gap-2 p-4">
            <Bot className="h-8 w-8" /><p className="text-center">No custom agents yet</p><p className="text-xs">Create agents with custom prompts for specialized tasks</p>
          </div>
        ) : (
          agents.map(a => (
            <div key={a.id} className="p-3 border-b border-hairline hover:bg-sidebar-hover">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{a.name}</p>
                  <p className="text-xs text-ink-muted truncate">{a.description || "No description"}</p>
                  <p className="text-xs text-ink-lighter mt-1">{a.model || "Default model"} · temp: {a.temperature}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(a)} className="rounded-md p-1.5 hover:bg-sidebar-hover text-ink-muted" title="Edit"><Settings className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteAgent(a.id)} className="rounded-md p-1.5 hover:bg-sidebar-hover text-ink-muted" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}