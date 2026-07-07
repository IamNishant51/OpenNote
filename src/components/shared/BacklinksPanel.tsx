import { ArrowLeft, X, Loader2 } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace";
import { useTauriCommands } from "@/hooks/useTauriCommands";
import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import * as Y from "yjs";
import { PageIcon } from "@/components/shared/PageIcon";
import type { Page } from "@/types";

export function BacklinksPanel({ pageId, open, onClose }: { pageId: string; open: boolean; onClose: () => void }) {
  const { pages } = useWorkspaceStore();
  const { loadPage } = useTauriCommands();
  const [backlinks, setBacklinks] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !pageId) return;

    const findBacklinks = async () => {
      setLoading(true);
      try {
        const results: Page[] = [];
        const otherPages = pages.filter((p) => p.id !== pageId && !p.is_trash);

        for (const p of otherPages) {
          try {
            const stateArray = await invoke<number[] | null>("get_document_state", { pageId: p.id });
            if (stateArray && stateArray.length > 0) {
              const doc = new Y.Doc();
              Y.applyUpdate(doc, new Uint8Array(stateArray));
              const xml = doc.getXmlFragment("blocknote").toString();
              if (xml.includes(pageId)) {
                results.push(p);
              }
            }
          } catch (err) {
            console.error(`Failed to scan page ${p.id} for backlinks:`, err);
          }
        }
        setBacklinks(results);
      } catch (e) {
        console.error("Failed to find backlinks:", e);
      } finally {
        setLoading(false);
      }
    };

    findBacklinks();
  }, [open, pageId, pages]);

  if (!open) return null;

  return (
    <div className="flex h-full w-56 flex-col border-l border-hairline bg-canvas">
      <div className="flex items-center justify-between px-3 py-2 border-b border-hairline">
        <div className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4 text-ink-muted" />
          <span className="text-sm font-semibold text-ink">Backlinks</span>
        </div>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-ink-muted" />
          </div>
        ) : backlinks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 p-4">
            <ArrowLeft className="h-8 w-8 text-ink-faint" />
            <p className="text-sm text-ink-muted">No backlinks</p>
          </div>
        ) : (
          backlinks.map((p) => (
            <button key={p.id} onClick={() => { loadPage(p.id); onClose(); }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink-secondary hover:bg-sidebar-hover transition-colors">
              <PageIcon icon={p.icon} size="sm" className="flex-shrink-0" />
              <span className="truncate">{p.title || "Untitled"}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
