import { useState, useRef } from "react";
import { Upload, FileText, Table2, Code, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace";
import { useTauriCommands } from "@/hooks/useTauriCommands";
import { parseCSV, csvToTableBlock } from "@/lib/import-export/csv";

type ImportFormat = "markdown" | "csv" | "html";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImportComplete: (pageId: string) => void;
}

const formats: { value: ImportFormat; label: string; icon: React.ReactNode; extensions: string[] }[] = [
  { value: "markdown", label: "Markdown", icon: <FileText className="h-5 w-5" />, extensions: [".md", ".mdx"] },
  { value: "csv", label: "CSV", icon: <Table2 className="h-5 w-5" />, extensions: [".csv"] },
  { value: "html", label: "HTML", icon: <Code className="h-5 w-5" />, extensions: [".html", ".htm"] },
];

export function ImportDialog({ open, onClose, onImportComplete }: ImportDialogProps) {
  const [format, setFormat] = useState<ImportFormat>("markdown");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentWorkspace } = useWorkspaceStore();
  const { createPage } = useTauriCommands();

  const handleFileSelect = async () => {
    const input = fileInputRef.current;
    if (!input || !input.files || input.files.length === 0) return;

    const file = input.files[0];
    setLoading(true);
    setError(null);

    try {
      const content = await file.text();

      if (format === "csv") {
        const data = parseCSV(content);
        const block = csvToTableBlock(data);
        const page = await createPage(currentWorkspace!.id);
        if (page) {
          onImportComplete(page.id);
        }
      } else {
        const page = await createPage(currentWorkspace!.id);
        if (page) {
          onImportComplete(page.id);
        }
      }

      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setLoading(false);
      input.value = "";
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-elevated border border-hairline overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-ink-muted" />
            <h2 className="text-sm font-semibold text-ink">Import</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-ink-muted mb-3">Select file format:</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {formats.map((f) => (
              <button
                key={f.value}
                onClick={() => setFormat(f.value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition-colors",
                  format === f.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-hairline text-ink-muted hover:border-ink-faint hover:text-ink-secondary",
                )}
              >
                {f.icon}
                <span className="text-xs">{f.label}</span>
              </button>
            ))}
          </div>

          <p className="text-xs text-ink-faint mb-4">
            Supported extensions: {formats.find((f) => f.value === format)?.extensions.join(", ") || ""}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={formats.find((f) => f.value === format)?.extensions.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />

          {error && (
            <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Choose File
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
