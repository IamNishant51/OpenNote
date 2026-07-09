import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Table2, Code, X, Loader2, File as FileIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace";
import { useTauriCommands } from "@/hooks/useTauriCommands";
import { parseCSV, csvToTableBlock } from "@/lib/import-export/csv";
import { isTauriRuntime, safeInvoke } from "@/lib/tauri";
import { editorRef } from "@/lib/editorRef";

type ImportFormat = "markdown" | "csv" | "html";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: (pageId: string) => void;
}

const formats: { value: ImportFormat; label: string; icon: React.ReactNode; description: string; extensions: string[] }[] = [
  { value: "markdown", label: "Markdown", icon: <FileText className="h-5 w-5" />, description: "Import .md or .mdx files", extensions: [".md", ".mdx"] },
  { value: "csv", label: "CSV", icon: <Table2 className="h-5 w-5" />, description: "Import .csv as a table", extensions: [".csv"] },
  { value: "html", label: "HTML", icon: <Code className="h-5 w-5" />, description: "Import .html or .htm files", extensions: [".html", ".htm"] },
];

export function ImportDialog({ open, onClose, onImportComplete }: ImportDialogProps) {
  const [format, setFormat] = useState<ImportFormat>("markdown");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentWorkspace } = useWorkspaceStore();
  const { createPage } = useTauriCommands();

  const saveDocumentState = async (pageId: string, blocks: any[]) => {
    const jsonText = JSON.stringify(blocks);
    const encoder = new TextEncoder();
    const bytes = Array.from(encoder.encode(jsonText));
    if (isTauriRuntime()) {
      await safeInvoke("save_document_state", { pageId, blob: bytes });
    } else {
      const state = JSON.parse(localStorage.getItem("opennotes_browser_state") || "{}");
      if (!state.documents) state.documents = {};
      state.documents[pageId] = jsonText;
      localStorage.setItem("opennotes_browser_state", JSON.stringify(state));
    }
  };

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setLoading(true);
    setError(null);

    try {
      const content = await file.text();

      const editor = editorRef.get();
      if (!editor) {
        setError("No editor instance available");
        return;
      }

      let blocks: any[];
      if (format === "csv") {
        const data = parseCSV(content);
        blocks = [csvToTableBlock(data)];
      } else if (format === "html") {
        blocks = editor.tryParseHTMLToBlocks(content);
      } else {
        blocks = editor.tryParseMarkdownToBlocks(content);
      }

      if (blocks?.length) {
        const page = await createPage(currentWorkspace!.id);
        if (page) {
          await saveDocumentState(page.id, blocks);
          onImportComplete(page.id);
        }
      }

      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }, [format, currentWorkspace, createPage, onImportComplete, onClose]);

  const handleFileSelect = async () => {
    const input = fileInputRef.current;
    if (!input || !input.files || input.files.length === 0) return;
    await processFile(input.files[0]);
    input.value = "";
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) await processFile(file);
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-canvas shadow-elevated border border-hairline overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-ink-muted" />
            <h2 className="text-sm font-semibold text-ink">Import</h2>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {formats.map((f) => (
              <button key={f.value} onClick={() => { setFormat(f.value); setFileName(null); setError(null); }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-lg border px-3 py-3 text-sm transition-colors",
                  format === f.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-hairline text-ink-muted hover:border-ink-faint hover:text-ink-secondary",
                )}
              >
                {f.icon}
                <span className="text-xs font-medium">{f.label}</span>
                <span className="text-[10px] text-ink-faint">{f.description}</span>
              </button>
            ))}
          </div>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-colors",
              dragOver ? "border-primary bg-primary/5" : "border-hairline hover:border-ink-faint hover:bg-sidebar-bg",
            )}
          >
            {fileName ? (
              <div className="flex items-center gap-2 text-sm text-ink-secondary">
                <FileIcon className="h-5 w-5 text-primary" />
                <span className="font-medium">{fileName}</span>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-ink-faint" />
                <p className="text-sm text-ink-muted">Drag & drop or click to browse</p>
                <p className="text-xs text-ink-faint">{formats.find((f) => f.value === format)?.extensions.join(", ")}</p>
              </>
            )}
          </div>

          <input ref={fileInputRef} type="file" accept={formats.find((f) => f.value === format)?.extensions.join(",")} onChange={handleFileSelect} className="hidden" />

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button onClick={() => fileInputRef.current?.click()} disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-50"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</> : <><Upload className="h-4 w-4" /> Choose File</>}
          </button>
        </div>
      </div>
    </div>
  );
}
