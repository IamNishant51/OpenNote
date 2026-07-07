import { useState, useEffect } from "react";
import { History, X, Clock, Loader2, Plus, ArrowLeftRight } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { editorRef } from "@/lib/editorRef";
import type { PageVersion } from "@/types/comments";

export function VersionHistory({ pageId, open, onClose }: { pageId: string; open: boolean; onClose: () => void }) {
  const [versions, setVersions] = useState<PageVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await invoke<PageVersion[]>("get_page_versions", { pageId });
      setVersions(res);
    } catch (e) {
      console.error("Failed to fetch versions:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && pageId) {
      fetchVersions();
    }
  }, [open, pageId]);

  const handleSaveVersion = async () => {
    const activeEditor = editorRef.get();
    if (!activeEditor) return;
    const title = versionName.trim() || `Version ${new Date().toLocaleString()}`;
    setSaving(true);
    try {
      const snapshot = JSON.stringify(activeEditor.document);
      const newVer = await invoke<PageVersion>("create_page_version", { pageId, title, snapshot });
      setVersions([newVer, ...versions]);
      setVersionName("");
    } catch (e) {
      console.error("Failed to save version:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreVersion = async (v: PageVersion) => {
    const activeEditor = editorRef.get();
    if (!activeEditor) return;
    const confirmRestore = window.confirm(`Are you sure you want to restore "${v.title}"?`);
    if (!confirmRestore) return;
    try {
      const blocks = JSON.parse(v.snapshot);
      activeEditor.replaceBlocks(activeEditor.document, blocks);
      alert(`Restored to "${v.title}" successfully!`);
    } catch (e) {
      console.error("Failed to parse version snapshot:", e);
      alert("Failed to restore version: invalid snapshot format.");
    }
  };

  if (!open) return null;

  return (
    <div className="flex h-full w-64 flex-col border-l border-hairline bg-canvas">
      <div className="flex items-center justify-between px-3 py-2 border-b border-hairline">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-ink-muted" />
          <span className="text-sm font-semibold text-ink">Version History</span>
        </div>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <div className="border-b border-hairline p-3 space-y-2">
        <div className="flex gap-2">
          <input
            value={versionName}
            onChange={(e) => setVersionName(e.target.value)}
            placeholder="Version name (optional)..."
            className="flex-1 rounded-md border border-hairline bg-canvas-soft px-2.5 py-1.5 text-xs text-ink outline-none placeholder:text-ink-faint"
            onKeyDown={(e) => e.key === "Enter" && handleSaveVersion()}
          />
          <button
            onClick={handleSaveVersion}
            disabled={saving}
            className="flex h-7 px-2 items-center justify-center gap-1 rounded-md bg-primary text-white text-xs hover:bg-primary-active disabled:opacity-40 cursor-pointer"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
          </div>
        ) : (
          versions.map((v) => (
            <div
              key={v.id}
              onClick={() => handleRestoreVersion(v)}
              className="group rounded-lg border border-hairline p-3 hover:bg-sidebar-hover cursor-pointer transition-colors relative"
            >
              <div className="flex items-start justify-between">
                <p className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">{v.title}</p>
                <span title="Restore this version" className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1.5">
                  <ArrowLeftRight className="h-3.5 w-3.5 text-ink-faint" />
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-ink-faint">
                <Clock className="h-3 w-3" />
                {v.created_at}
              </div>
            </div>
          ))
        )}
        {!loading && versions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
            <History className="h-8 w-8 text-ink-faint" />
            <p className="text-sm text-ink-muted">No versions saved yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
