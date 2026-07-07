import { useState, useEffect, useRef } from "react";
import { List, X } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace";
import { editorRef } from "@/lib/editorRef";
import { cn } from "@/lib/utils";

interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContentsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const currentPage = useWorkspaceStore(s => s.currentPage);
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  useEffect(() => {
    const activeEditor = editorRef.get();
    if (!open || !activeEditor) return;

    const extractHeadings = () => {
      const items: HeadingItem[] = [];
      const traverseBlocks = (blocks: any[]) => {
        for (const block of blocks) {
          if (block.type === "heading") {
            const level = block.props?.level || 1;
            let text = "";
            if (Array.isArray(block.content)) {
              text = block.content.map((c: any) => c.text || "").join("");
            } else if (typeof block.content === "string") {
              text = block.content;
            }
            items.push({ id: block.id, text: text || "Untitled Heading", level });
          }
          if (block.children && block.children.length > 0) traverseBlocks(block.children);
        }
      };
      traverseBlocks(activeEditor.document);
      setHeadings(items);
    };

    extractHeadings();
    const unsubscribe = activeEditor.onChange(() => extractHeadings());
    return () => { unsubscribe(); };
  }, [open, currentPage]);

  if (!open) return null;

  const handleScrollToHeading = (id: string) => {
    const element = document.querySelector(`[data-id="${id}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="flex h-full w-60 flex-col border-l border-hairline bg-canvas">
      <div className="flex items-center justify-between px-3 py-2 border-b border-hairline">
        <div className="flex items-center gap-2">
          <List className="h-4 w-4 text-ink-muted" />
          <span className="text-sm font-semibold text-ink">Table of Contents</span>
        </div>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted cursor-pointer">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {headings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
            <List className="h-8 w-8 text-ink-faint" />
            <p className="text-sm text-ink-muted">No headings on this page</p>
          </div>
        ) : (
          headings.map((heading) => (
            <button
              key={heading.id}
              onClick={() => handleScrollToHeading(heading.id)}
              className={cn(
                "w-full text-left rounded-md px-2 py-1 text-xs text-ink-secondary hover:bg-sidebar-hover transition-colors truncate cursor-pointer",
                heading.level === 1 && "pl-2 font-medium text-sm text-ink",
                heading.level === 2 && "pl-5 text-ink-secondary",
                heading.level === 3 && "pl-8 text-ink-muted"
              )}
            >
              {heading.text}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
