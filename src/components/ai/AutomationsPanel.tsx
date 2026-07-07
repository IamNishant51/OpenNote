import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Trash2, Zap, Play, Pause, X, Save } from "lucide-react";

interface Automation {
  id: string; name: string; trigger: "time" | "event"; config: any; action: string; enabled: boolean;
}

interface AutomationForm {
  name: string;
  trigger: "time" | "event";
  config: {
    cron?: string;
    event?: string;
  };
  action: string;
  enabled: boolean;
}

interface AutomationsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function AutomationsPanel({ open, onClose }: AutomationsPanelProps) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [editing, setEditing] = useState<Automation | null>(null);
  const [form, setForm] = useState<AutomationForm>({ name: "", trigger: "time", config: {}, action: "", enabled: true });

  useEffect(() => {
    const saved = localStorage.getItem("opennotes_automations");
    if (saved) setAutomations(JSON.parse(saved));
  }, []);

  const saveAutomations = (next: Automation[]) => {
    localStorage.setItem("opennotes_automations", JSON.stringify(next));
    setAutomations(next);
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.action.trim()) return;
    const a: Automation = { id: editing?.id || crypto.randomUUID(), ...form };
    saveAutomations(editing ? automations.map(x => x.id === a.id ? a : x) : [...automations, a]);
    setEditing(null);
    setForm({ name: "", trigger: "time", config: {}, action: "", enabled: true });
  };

  const startEdit = (a: Automation) => { setEditing(a); setForm({ name: a.name, trigger: a.trigger, config: a.config || {}, action: a.action, enabled: a.enabled }); };
  const deleteAuto = (id: string) => { saveAutomations(automations.filter(a => a.id !== id)); };
  const toggleEnabled = (id: string) => { saveAutomations(automations.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)); };

  if (!open) return null;

  return (
    <div className="w-96 border-l border-hairline bg-canvas flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-hairline">
        <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-ink-muted" /><span className="text-sm font-medium">Automations</span></div>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-sidebar-hover text-ink-muted"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {editing ? (
          <div className="p-3 space-y-3 border-b border-hairline">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Automation name" className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm outline-none focus:border-accent" />
            <select value={form.trigger} onChange={e => setForm({...form, trigger: e.target.value as "time" | "event", config: {}})} className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm outline-none focus:border-accent">
              <option value="time">Time-based (cron)</option>
              <option value="event">Event-based</option>
            </select>
            {form.trigger === "time" && (
              <input value={form.config.cron || ""} onChange={e => setForm({...form, config: {...form.config, cron: e.target.value}})} placeholder="Cron expression (e.g. 0 9 * * *)" className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm outline-none focus:border-accent" />
            )}
            {form.trigger === "event" && (
              <select value={form.config.event || ""} onChange={e => setForm({...form, config: {...form.config, event: e.target.value}})} className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm outline-none focus:border-accent">
                <option value="">Select event</option>
                <option value="page_created">Page created</option>
                <option value="page_updated">Page updated</option>
                <option value="database_item_added">Database item added</option>
              </select>
            )}
            <textarea value={form.action} onChange={e => setForm({...form, action: e.target.value})} placeholder="Action (AI prompt, webhook URL, etc.)" rows={3} className="w-full rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm outline-none focus:border-accent resize-none" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.enabled} onChange={e => setForm({...form, enabled: e.target.checked})} className="rounded border-hairline" />
              <span>Enabled</span>
            </label>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setEditing(null); setForm({ name: "", trigger: "time", config: {}, action: "", enabled: true }); }} className="rounded-md px-3 py-1.5 text-sm text-ink-muted hover:bg-sidebar-hover">Cancel</button>
              <button onClick={handleSubmit} className="rounded-md bg-accent px-3 py-1.5 text-sm text-white hover:bg-accent-hover"><Save className="h-3.5 w-3.5 mr-1" />Save</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setEditing(null)} className="w-full p-3 text-left hover:bg-sidebar-hover border-b border-hairline flex items-center gap-2">
            <Plus className="h-4 w-4 text-ink-muted" /><span className="text-sm text-ink-muted">Create automation</span>
          </button>
        )}
        {automations.length === 0 && !editing ? (
          <div className="flex flex-col items-center justify-center h-32 text-ink-muted text-sm gap-2 p-4">
            <Zap className="h-8 w-8" /><p className="text-center">No automations yet</p><p className="text-xs">Automate repetitive tasks with time or event triggers</p>
          </div>
        ) : (
          automations.map(a => (
            <div key={a.id} className="p-3 border-b border-hairline hover:bg-sidebar-hover">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${a.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {a.enabled ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted truncate mt-1">{a.trigger === "time" ? `Cron ${a.config.cron}` : `Event ${a.config.event}`}</p>
                  <p className="text-xs text-ink-lighter mt-1 truncate">{a.action}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleEnabled(a.id)} className={`rounded-md p-1.5 hover:bg-sidebar-hover ${a.enabled ? "text-green-600" : "text-ink-muted"}`} title={a.enabled ? "Pause" : "Resume"}>{a.enabled ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
                  <button onClick={() => startEdit(a)} className="rounded-md p-1.5 hover:bg-sidebar-hover text-ink-muted" title="Edit"><Zap className="h-3.5 w-3.5" /></button>
                  <button onClick={() => deleteAuto(a.id)} className="rounded-md p-1.5 hover:bg-sidebar-hover text-ink-muted" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}