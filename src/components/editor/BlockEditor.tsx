import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useCreateBlockNote, BlockNoteViewRaw } from "@blocknote/react";
import { invoke } from "@tauri-apps/api/core";
import * as Y from "yjs";
import { useWorkspaceStore } from "@/stores/workspace";
import { useUIStore } from "@/stores/ui";
import { useTauriCommands } from "@/hooks/useTauriCommands";
import { DatabaseView } from "@/components/database/DatabaseView";
import { editorRef } from "@/lib/editorRef";
import { PageIcon } from "@/components/shared/PageIcon";
import { EmojiPicker } from "@/components/shared/EmojiPicker";
import type { Page } from "@/types";
import { Breadcrumbs } from "./Breadcrumbs";

function PageHeader({ page }: { page: Page }) {
  const { savePage, toggleFavorite } = useTauriCommands();
  const [title, setTitle] = useState(page.title);

  useEffect(() => { setTitle(page.title); }, [page.id, page.title]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTitle(val);
    savePage(page.id, val, page.icon, page.font as "default" | "serif" | "mono", page.width as "default" | "full", page.is_favorite);
  }, [page.id, page.icon, page.font, page.width, page.is_favorite, savePage]);

  const handleIconChange = useCallback((icon: string) => {
    savePage(page.id, title, icon, page.font as "default" | "serif" | "mono", page.width as "default" | "full", page.is_favorite);
  }, [page.id, title, page.font, page.width, page.is_favorite, savePage]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div className="mb-2">
          <EmojiPicker value={page.icon || "📄"} onChange={handleIconChange} />
        </div>
        <button onClick={() => toggleFavorite(page.id)}
          className={`text-sm transition-colors ${page.is_favorite ? "text-yellow-500" : "text-ink-faint hover:text-ink-muted"}`}
        >{page.is_favorite ? "★" : "☆"}</button>
      </div>
      <textarea value={title} onChange={handleTitleChange}
        className="w-full resize-none border-none bg-transparent text-h1 font-bold text-ink outline-none placeholder:text-ink-faint"
        rows={1} placeholder="Untitled" />
    </div>
  );
}

interface BlockEditorProps {
  pageId: string;
  onEditorReady?: (editor: any) => void;
  ydoc?: Y.Doc | null;
  initialContent?: any[] | null;
}

export function BlockEditor({ pageId, onEditorReady, ydoc, initialContent }: BlockEditorProps) {
  const currentPage = useWorkspaceStore(s => s.currentPage);
  const pendingTemplateContent = useWorkspaceStore(s => s.pendingTemplateContent);
  const setPendingTemplateContent = useWorkspaceStore(s => s.setPendingTemplateContent);
  const darkMode = useUIStore(s => s.darkMode);

  const pageIdRef = useRef(pageId);
  pageIdRef.current = pageId;

  const initialContentLoaded = useRef(false);

  const options = useMemo(() => ({
    ...(ydoc ? { collaboration: { fragment: ydoc.getXmlFragment("blocknote"), user: { name: "Me", color: "#0075de" } } } : {}),
  }), [ydoc]);

  const editor = useCreateBlockNote(options, [ydoc]);

  useEffect(() => {
    if (!editor) return;
    if (initialContent && !initialContentLoaded.current) {
      try {
        editor.replaceBlocks(editor.document, initialContent);
        initialContentLoaded.current = true;
      } catch (e) {
        console.error("Failed to load initial content:", e);
      }
    } else if (!initialContent && editor.document.length <= 1) {
      const welcome: any[] = [
        { type: "heading", content: "Welcome to OpenNotes", props: { level: 1 }, children: [] },
        { type: "paragraph", content: "Start typing here...", children: [] },
      ];
      editor.replaceBlocks(editor.document, welcome);
    }
  }, [editor, initialContent]);

  // Apply pending template content
  useEffect(() => {
    if (editor && pendingTemplateContent) {
      editor.replaceBlocks(editor.document, pendingTemplateContent);
      setPendingTemplateContent(null);
    }
  }, [editor, pendingTemplateContent, setPendingTemplateContent]);

  // Autosave — only depends on editor and ydoc
  useEffect(() => {
    if (!editor || ydoc) return;
    let saveTimeout: number;
    const unsubscribe = editor.onChange(() => {
      window.clearTimeout(saveTimeout);
      saveTimeout = window.setTimeout(async () => {
        const pid = pageIdRef.current;
        if (!pid) return;
        try {
          const jsonText = JSON.stringify(editor.document);
          const encoder = new TextEncoder();
          const bytes = Array.from(encoder.encode(jsonText));
          await invoke("save_document_state", { pageId: pid, blob: bytes });
        } catch (e) {
          console.error("Failed to save local document state:", e);
        }
      }, 1000);
    });
    return () => { window.clearTimeout(saveTimeout); unsubscribe(); };
  }, [editor, ydoc]);

  // Register editor in module-level ref — NO Zustand store update
  useEffect(() => {
    if (!editor) return;
    editorRef.set(editor);
    if (onEditorReady) onEditorReady(editor);
    return () => { editorRef.set(null); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!currentPage) {
    return <div className="flex h-full items-center justify-center text-ink-muted">Select a page to start editing</div>;
  }

  if (currentPage.is_database) {
    return (
      <div className="h-full flex flex-col">
        <div className="mx-auto w-full max-w-[1200px] px-16 pt-8">
          <Breadcrumbs />
          <PageHeader page={currentPage} />
        </div>
        <div className="flex-1">
          <DatabaseView pageId={currentPage.id} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto h-full max-w-[900px] px-16 py-8 overflow-y-auto">
      <Breadcrumbs />
      <PageHeader page={currentPage} />
      <BlockNoteViewRaw editor={editor as any} theme={darkMode ? "dark" : "light"} />
    </div>
  );
}
