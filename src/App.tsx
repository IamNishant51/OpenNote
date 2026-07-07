import { useEffect, useRef, useCallback } from "react";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { BlockEditor } from "@/components/editor/BlockEditor";
import { QuickFind } from "@/components/search/QuickFind";
import { ImportDialog } from "@/components/import-export/ImportDialog";
import { ExportDialog } from "@/components/import-export/ExportDialog";
import { AiPanel } from "@/components/ai/AiPanel";
import { AiSettings } from "@/components/ai/AiSettings";
import { AISearchPanel } from "@/components/ai/AISearchPanel";
import { AgentsPanel } from "@/components/ai/AgentsPanel";
import { AutomationsPanel } from "@/components/ai/AutomationsPanel";
import { CommentsPanel } from "@/components/shared/CommentsPanel";
import { VersionHistory } from "@/components/shared/VersionHistory";
import { BacklinksPanel } from "@/components/shared/BacklinksPanel";
import { TableOfContentsPanel } from "@/components/shared/TableOfContentsPanel";
import { TemplatesGallery } from "@/components/shared/TemplatesGallery";
import { SharingDialog } from "@/components/collaboration/SharingDialog";
import { NotificationsPanel } from "@/components/collaboration/NotificationsPanel";
import { CursorOverlay } from "@/components/collaboration/CursorOverlay";
import { useWorkspaceStore } from "@/stores/workspace";
import { useUIStore } from "@/stores/ui";
import { useAIStore } from "@/stores/ai";
import { useCollabStore } from "@/stores/collaboration";
import { useTauriCommands } from "@/hooks/useTauriCommands";
import { useYjsSync } from "@/hooks/useYjsSync";
import { Share2, Bell, Search, Bot, Zap } from "lucide-react";

function App() {
  const currentPage = useWorkspaceStore(s => s.currentPage);
  const loading = useWorkspaceStore(s => s.loading);

  const darkMode = useUIStore(s => s.darkMode);
  const importDialogOpen = useUIStore(s => s.importDialogOpen);
  const exportDialogOpen = useUIStore(s => s.exportDialogOpen);
  const templatesGalleryOpen = useUIStore(s => s.templatesGalleryOpen);
  const commentsPanelOpen = useUIStore(s => s.commentsPanelOpen);
  const versionHistoryOpen = useUIStore(s => s.versionHistoryOpen);
  const backlinksOpen = useUIStore(s => s.backlinksOpen);
  const tocOpen = useUIStore(s => s.tocOpen);
  const aiSearchOpen = useUIStore(s => s.aiSearchOpen);
  const agentsOpen = useUIStore(s => s.agentsOpen);
  const automationsOpen = useUIStore(s => s.automationsOpen);
  const setImportDialogOpen = useUIStore(s => s.setImportDialogOpen);
  const setExportDialogOpen = useUIStore(s => s.setExportDialogOpen);
  const setTemplatesGalleryOpen = useUIStore(s => s.setTemplatesGalleryOpen);
  const setCommentsPanelOpen = useUIStore(s => s.setCommentsPanelOpen);
  const setVersionHistoryOpen = useUIStore(s => s.setVersionHistoryOpen);
  const setBacklinksOpen = useUIStore(s => s.setBacklinksOpen);
  const setTocOpen = useUIStore(s => s.setTocOpen);
  const setAiSearchOpen = useUIStore(s => s.setAiSearchOpen);
  const setAgentsOpen = useUIStore(s => s.setAgentsOpen);
  const setAutomationsOpen = useUIStore(s => s.setAutomationsOpen);

  const panelOpen = useAIStore(s => s.panelOpen);
  const settingsOpen = useAIStore(s => s.settingsOpen);
  const setSettingsOpen = useAIStore(s => s.setSettingsOpen);
  const initializeProviders = useAIStore(s => s.initializeProviders);

  const { loadWorkspaces, loadPages, loadPage } = useTauriCommands();

  const connected = useCollabStore(s => s.connected);
  const peers = useCollabStore(s => s.peers);
  const sharingOpen = useCollabStore(s => s.sharingOpen);
  const notificationsOpen = useCollabStore(s => s.notificationsOpen);
  const setSharingOpen = useCollabStore(s => s.setSharingOpen);
  const setNotificationsOpen = useCollabStore(s => s.setNotificationsOpen);

  const editorRef = useRef<any>(null);
  const bootstrappedRef = useRef(false);

  const { doc, provider, ready, initialContent } = useYjsSync(currentPage?.id ?? null, false);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const init = async () => {
      await loadWorkspaces();
      const ws = useWorkspaceStore.getState().currentWorkspace;
      const browserPages = useWorkspaceStore.getState().pages;

      if (ws && browserPages.length === 0) {
        await loadPages(ws.id);
      }

      const store = useWorkspaceStore.getState();
      if (!store.currentPage && store.pages.length > 0) {
        store.setCurrentPage(store.pages[0]);
      }
    };

    init();
    initializeProviders();
  }, [initializeProviders, loadPages, loadWorkspaces]);

  useEffect(() => { document.documentElement.classList.toggle("dark", darkMode); }, [darkMode]);

  const handleEditorReady = useCallback((editor: any) => {
    editorRef.current = editor;
  }, []);

  const getEditorBlocks = useCallback(async () => {
    const editor = editorRef.current; if (!editor) return null;
    try { const [md, html] = await Promise.all([editor.blocksToMarkdownLossy(editor.document), editor.blocksToFullHTML(editor.document)]); return { markdown: md, html }; } catch { return null; }
  }, []);
  const handleImportComplete = useCallback((pageId: string) => { loadPage(pageId); }, [loadPage]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-canvas flex flex-col">
        {currentPage && (
          <div className="flex items-center justify-between px-4 py-1 border-b border-hairline">
            <div className="flex items-center gap-1">
              <button onClick={() => setCommentsPanelOpen(!commentsPanelOpen)} className={`rounded-md px-2 py-1 text-xs transition-colors ${commentsPanelOpen ? "bg-sidebar-active text-ink" : "text-ink-muted hover:bg-sidebar-hover"}`}>Comments</button>
              <button onClick={() => setVersionHistoryOpen(!versionHistoryOpen)} className={`rounded-md px-2 py-1 text-xs transition-colors ${versionHistoryOpen ? "bg-sidebar-active text-ink" : "text-ink-muted hover:bg-sidebar-hover"}`}>History</button>
              <button onClick={() => setBacklinksOpen(!backlinksOpen)} className={`rounded-md px-2 py-1 text-xs transition-colors ${backlinksOpen ? "bg-sidebar-active text-ink" : "text-ink-muted hover:bg-sidebar-hover"}`}>Backlinks</button>
              <button onClick={() => setTocOpen(!tocOpen)} className={`rounded-md px-2 py-1 text-xs transition-colors ${tocOpen ? "bg-sidebar-active text-ink" : "text-ink-muted hover:bg-sidebar-hover"}`}>Outline</button>
            </div>
            <div className="flex items-center gap-1">
              {connected && <span className="flex items-center gap-1 text-xs text-green-600 mr-1"><span className="h-1.5 w-1.5 rounded-full bg-green-500" />{peers}</span>}
              <button onClick={() => setSharingOpen(true)} className="rounded-md p-1.5 text-ink-muted hover:bg-sidebar-hover transition-colors" title="Share">
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="rounded-md p-1.5 text-ink-muted hover:bg-sidebar-hover transition-colors relative" title="Notifications">
                <Bell className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setAiSearchOpen(!aiSearchOpen)} className={`rounded-md p-1.5 transition-colors ${aiSearchOpen ? "bg-sidebar-active text-ink" : "text-ink-muted hover:bg-sidebar-hover"}`} title="AI Search">
                <Search className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setAgentsOpen(!agentsOpen)} className={`rounded-md p-1.5 transition-colors ${agentsOpen ? "bg-sidebar-active text-ink" : "text-ink-muted hover:bg-sidebar-hover"}`} title="Custom Agents">
                <Bot className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setAutomationsOpen(!automationsOpen)} className={`rounded-md p-1.5 transition-colors ${automationsOpen ? "bg-sidebar-active text-ink" : "text-ink-muted hover:bg-sidebar-hover"}`} title="Automations">
                <Zap className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex h-full items-center justify-center text-ink-muted">Loading...</div>
            ) : currentPage ? (
              ready ? (
                <BlockEditor key={currentPage.id} pageId={currentPage.id} onEditorReady={handleEditorReady} ydoc={doc.current} initialContent={initialContent} />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-muted">Loading page...</div>
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-ink-muted gap-4">
                <p className="text-lg">Welcome to OpenNotes</p>
                <p className="text-sm">Create a page to get started</p>
              </div>
            )}
          </div>
          {currentPage && commentsPanelOpen && <CommentsPanel pageId={currentPage.id} open={commentsPanelOpen} onClose={() => setCommentsPanelOpen(false)} />}
          {currentPage && versionHistoryOpen && <VersionHistory pageId={currentPage.id} open={versionHistoryOpen} onClose={() => setVersionHistoryOpen(false)} />}
          {currentPage && backlinksOpen && <BacklinksPanel pageId={currentPage.id} open={backlinksOpen} onClose={() => setBacklinksOpen(false)} />}
          {currentPage && tocOpen && <TableOfContentsPanel open={tocOpen} onClose={() => setTocOpen(false)} />}
          {aiSearchOpen && <AISearchPanel open={aiSearchOpen} onClose={() => setAiSearchOpen(false)} />}
          {agentsOpen && <AgentsPanel open={agentsOpen} onClose={() => setAgentsOpen(false)} />}
          {automationsOpen && <AutomationsPanel open={automationsOpen} onClose={() => setAutomationsOpen(false)} />}
          {notificationsOpen && <NotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />}
          {panelOpen && <AiPanel />}
        </div>
      </main>
      <QuickFind />
      <ImportDialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} onImportComplete={handleImportComplete} />
      <ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} getEditorBlocks={getEditorBlocks} />
      <AiSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <TemplatesGallery open={templatesGalleryOpen} onClose={() => setTemplatesGalleryOpen(false)} />
      {currentPage && <SharingDialog pageId={currentPage.id} open={sharingOpen} onClose={() => setSharingOpen(false)} />}
      {provider.current && ready && <CursorOverlay provider={provider.current} />}
    </div>
  );
}

export default App;