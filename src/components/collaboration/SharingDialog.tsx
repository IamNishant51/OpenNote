import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { X, Plus, Trash2, Globe, Mail } from "lucide-react";
import { useCollabStore } from "@/stores/collaboration";
import type { Share } from "@/types/comments";

interface SharingDialogProps {
  pageId: string;
  open: boolean;
  onClose: () => void;
}

export function SharingDialog({ pageId, open, onClose }: SharingDialogProps) {
  const { shares, setShares, addShare, removeShare } = useCollabStore();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState("edit");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && pageId) {
      invoke<Share[]>("get_page_shares", { pageId }).then(setShares).catch(console.error);
    }
  }, [open, pageId]);

  const handleInvite = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const share = await invoke<Share>("share_page", { pageId, userEmail: email.trim(), permissionLevel: permission });
      addShare(share);
      setEmail("");
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    try {
      await invoke("remove_share", { id });
      removeShare(id);
    } catch (e) { console.error(e); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="w-[420px] rounded-lg bg-canvas shadow-xl border border-hairline" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-hairline">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-ink-muted" />
            <span className="text-sm font-medium">Share page</span>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-sidebar-hover text-ink-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address..."
              className="flex-1 rounded-md border border-hairline bg-canvas px-3 py-1.5 text-sm outline-none focus:border-primary"
            />
            <select
              value={permission}
              onChange={(e) => setPermission(e.target.value)}
              className="rounded-md border border-hairline bg-canvas px-2 py-1.5 text-sm outline-none"
            >
              <option value="read">Can read</option>
              <option value="comment">Can comment</option>
              <option value="edit">Can edit</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={loading || !email.trim()}
              className="rounded-md bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-active disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            {shares.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-4">No shared users yet</p>
            ) : (
              shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-sidebar-hover">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-ink-muted" />
                    <span className="text-sm">{share.user_email}</span>
                    <span className="text-xs text-ink-muted bg-sidebar-hover px-1.5 py-0.5 rounded">
                      {share.permission_level}
                    </span>
                  </div>
                  <button onClick={() => handleRemove(share.id)} className="rounded-md p-1 hover:bg-sidebar-hover text-ink-muted">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
