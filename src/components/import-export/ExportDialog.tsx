import { useState, useCallback } from "react";
import { Download, FileText, Table2, Code, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace";
import { exportMarkdown } from "@/lib/import-export/markdown";
import { exportHTML } from "@/lib/import-export/html";
import { tableToCSV } from "@/lib/import-export/csv";

type ExportFormat = "markdown" | "csv" | "html";

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  getEditorBlocks?: () => Promise<{
    markdown: string;
    html: string;
  } | null>;
}

const formats: { value: ExportFormat; label: string; icon: React.ReactNode; extension: string; mime: string }[] = [
  { value: "markdown", label: "Markdown", icon: <FileText className="h-5 w-5" />, extension: ".md", mime: "text/markdown" },
  { value: "csv", label: "CSV", icon: <Table2 className="h-5 w-5" />, extension: ".csv", mime: "text/csv" },
  { value: "html", label: "HTML", icon: <Code className="h-5 w-5" />, extension: ".html", mime: "text/html" },
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
      const ext = formats.find((f) => f.value === format)?.extension || ".md";

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

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}${ext}`;
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
            <Download className="h-5 w-5 text-ink-muted" />
            <h2 className="text-sm font-semibold text-ink">Export</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-xs text-ink-muted mb-2">
            Exporting: <span className="font-medium text-ink-secondary">{currentPage?.title || "Untitled"}</span>
          </p>

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

          {error && (
            <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={loading || !currentPage}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-active disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export as {formats.find((f) => f.value === format)?.label}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
