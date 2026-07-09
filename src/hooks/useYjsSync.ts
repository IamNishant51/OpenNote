import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useCollabStore } from "@/stores/collaboration";
import { safeInvoke } from "@/lib/tauri";

export function useYjsSync(pageId: string | null, enabled = false) {
  // ── Read collab config imperatively (NOT via reactive subscription) ──
  // Using getState() avoids subscribing this hook to the collab store,
  // which previously caused an infinite loop: cleanup called setConnected →
  // store updated → hook re-rendered → effect re-ran → cleanup → repeat.
  const getCollabState = () => useCollabStore.getState();

  const [initialContent, setInitialContent] = useState<any[] | null>(null);
  const [ready, setReady] = useState(false);

  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // Stable ref for pageId so it can be used inside callbacks
  const pageIdRef = useRef(pageId);
  pageIdRef.current = pageId;

  useEffect(() => {
    if (!pageId) {
      setInitialContent(null);
      setReady(false);
      return;
    }

    setReady(false);

    if (!enabled) {
      // ── Local Mode: Load JSON string from SQLite document_states blob ──
      let cancelled = false;
      const loadLocal = async () => {
        try {
          const stateArray = await safeInvoke<number[] | null>("get_document_state", { pageId }, null);
          if (cancelled) return;
          if (stateArray && stateArray.length > 0) {
            const bytes = new Uint8Array(stateArray);
            const jsonText = new TextDecoder("utf-8").decode(bytes);
            try {
              const blocks = JSON.parse(jsonText);
              setInitialContent(blocks);
            } catch {
              setInitialContent(null);
            }
          } else {
            setInitialContent(null);
          }
        } catch (e) {
          console.error("Failed to load local document:", e);
          if (!cancelled) setInitialContent(null);
        } finally {
          if (!cancelled) setReady(true);
        }
      };
      loadLocal();
      // Cleanup: just flag as cancelled so async result is ignored
      return () => { cancelled = true; };
    } else {
      // ── Collaboration Mode: Yjs WebSocket sync ──
      const { wsUrl, userName, userColor } = getCollabState();
      const { setConnected, setPeers } = getCollabState();

      const doc = new Y.Doc();
      docRef.current = doc;

      const provider = new WebsocketProvider(wsUrl, `page-${pageId}`, doc, { connect: true });
      providerRef.current = provider;

      provider.on("status", (event: { status: string }) => {
        useCollabStore.getState().setConnected(event.status === "connected");
      });

      provider.awareness.setLocalStateField("user", { name: userName, color: userColor });

      provider.awareness.on("change", () => {
        useCollabStore.getState().setPeers(provider.awareness.getStates().size);
      });

      provider.on("sync", () => { setReady(true); });

      const handleUpdate = () => {
        if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = window.setTimeout(async () => {
          if (!docRef.current) return;
          try {
            const update = Y.encodeStateAsUpdate(docRef.current);
            await safeInvoke("save_document_state", { pageId, blob: Array.from(update) });
          } catch (e) {
            console.error("Failed to save binary doc update:", e);
          }
        }, 1000);
      };
      doc.on("update", handleUpdate);

      return () => {
        if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
        doc.off("update", handleUpdate);
        provider.disconnect();
        doc.destroy();
        docRef.current = null;
        providerRef.current = null;
        // Use getState() so cleanup doesn't trigger a subscription-based re-render
        useCollabStore.getState().setConnected(false);
        useCollabStore.getState().setPeers(0);
        setReady(false);
      };
    }
  // Only re-run if pageId or enabled changes — NOT on collab store changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, enabled]);

  return { doc: docRef.current, provider: providerRef.current, ready, initialContent };
}
