import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Bell, X, CheckCheck, MessageSquare, Share2, Info } from "lucide-react";
import { useCollabStore } from "@/stores/collaboration";
import { useWorkspaceStore } from "@/stores/workspace";
import type { Notification } from "@/types/comments";

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}

const iconMap: Record<string, typeof MessageSquare> = {
  comment: MessageSquare,
  share: Share2,
  info: Info,
};

export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const { notifications, setNotifications, markRead, markAllRead } = useCollabStore();
  const { currentWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (open && currentWorkspace) {
      invoke<Notification[]>("get_notifications", { workspaceId: currentWorkspace.id }).then(setNotifications).catch(console.error);
      invoke("mark_all_notifications_read", { workspaceId: currentWorkspace.id }).then(markAllRead).catch(console.error);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="w-72 border-l border-hairline bg-canvas flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-hairline">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-ink-muted" />
          <span className="text-sm font-medium">Notifications</span>
        </div>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-sidebar-hover text-ink-muted">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-muted text-sm gap-2">
            <CheckCheck className="h-8 w-8" />
            <p>All caught up</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = iconMap[n.type] || Info;
            return (
              <div
                key={n.id}
                className={`px-3 py-2.5 border-b border-hairline hover:bg-sidebar-hover cursor-pointer ${!n.read ? "bg-primary/5" : ""}`}
                onClick={() => markRead(n.id)}
              >
                <div className="flex items-start gap-2">
                  <Icon className="h-4 w-4 text-ink-muted mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-ink-muted line-clamp-2">{n.message}</p>
                    <p className="text-xs text-ink-faint mt-1">{n.created_at}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
