import { useEffect, useState } from "react";
import { useCollabStore } from "@/stores/collaboration";
import type { WebsocketProvider } from "y-websocket";

interface RemoteCursor {
  name: string; color: string; x: number; y: number;
}

export function CursorOverlay({ provider }: { provider: WebsocketProvider | null }) {
  const { peers } = useCollabStore();
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);

  useEffect(() => {
    if (!provider) return;
    const awareness = provider.awareness;

    const update = () => {
      const states = awareness.getStates();
      const remote: RemoteCursor[] = [];
      states.forEach((state, clientId) => {
        if (clientId === awareness.clientID) return;
        const user = state.user;
        if (user && state.cursor) {
          remote.push({
            name: user.name || "Anonymous",
            color: user.color || "#0075de",
            x: state.cursor.x,
            y: state.cursor.y,
          });
        }
      });
      setCursors(remote);
    };

    awareness.on("change", update);
    update();
    return () => { awareness.off("change", update); };
  }, [provider]);

  if (cursors.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {cursors.map((c, i) => (
        <div
          key={i}
          className="absolute flex items-center gap-1 text-xs transition-[left,top] duration-75"
          style={{ left: c.x, top: c.y, color: c.color }}
        >
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
            <path d="M1 1L10 10H6L5 17L1 1Z" fill={c.color} />
          </svg>
          <span className="rounded px-1 py-0.5 leading-none" style={{ backgroundColor: c.color, color: "#fff" }}>
            {c.name}
          </span>
        </div>
      ))}
    </div>
  );
}
