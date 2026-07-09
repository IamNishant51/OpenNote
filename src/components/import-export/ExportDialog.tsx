import { useState, useCallback } from "react";
import { Download, FileText, Table2, Code, X, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace";
import { exportMarkdown } from "@/lib/import-export/markdown";
import { exportHTML } from "@/lib/import-export/html";
import { tableToCSV } from "@/lib/import-export/csv";

type ExportFormat = "markdown" | "csv" | "html";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  getEditorBlocks?: () => Promise<{ markdown: string; html: string } | null>;
}

const formats: { value: ExportFormat; label: string; icon: React.ReactNode; description: string; extension: string; mime: string }[] = [
  { value: "markdown", label: "Markdown", icon: <FileText className="h-5 w-5" />, description: "Plain text with .md formatting", extension: ".md", mime: "text/markdown" },
  { value: "csv", label: "CSV", icon: <Table2 className="h-5 w-5" />, description: "Tabular data as .csv", extension: ".csv", mime: "text/csv" },
  { value: "html", label: "HTML", icon: <Code className="h-5 w-5" />, description: "Full HTML document", extension: ".html", mime: "text/html" },
];

export function ExportDialog({ open, onClose, getEditorBlocks }: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>("markdown");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentPage } = useWorkspaceStore();

  const handleExport = useCallback(async () => {
    if (!currentPage) return;
    setLoading(true);
    setError(null);

    try {
      let content = "";
      let filename = currentPage.title || "untitled";
      const fmt = formats.find((f) => f.value === format)!;

      if (format === "csv") {
        content = tableToCSV(
          ["title", "icon", "created"],
          [[currentPage.title, currentPage.icon, currentPage.created_at]],
        );
      } else if (getEditorBlocks) {
        const blocks = await getEditorBlocks();
        if (!blocks) throw new Error("No editor content available");
        content = format === "markdown" ? blocks.markdown : blocks.html;
      }

      const blob = new Blob([content], { type: `${fmt.mime};charset=utf-8` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}${fmt.extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }, [currentPage, format, getEditorBlocks, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-canvas shadow-elevated border border-hairline overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-ink-muted" />
            <h2 className="text-sm font-semibold text-ink">Export</h2>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-bg border border-hairline px-3 py-2.5">
            <FileText className="h-4 w-4 text-ink-muted flex-shrink-0" />
            <span className="text-sm text-ink-secondary truncate">{currentPage?.title || "Untitled"}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {formats.map((f) => (
              <button key={f.value} onClick={() => setFormat(f.value)}
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

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button onClick={handleExport} disabled={loading || !currentPage}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-50"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Exporting...</> : <><Download className="h-4 w-4" /> Export as {formats.find((f) => f.value === format)?.label}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
