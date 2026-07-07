import { useState, useEffect } from "react";
import { MessageSquare, Plus, X, Check, CheckCheck, Loader2 } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { cn } from "@/lib/utils";
import type { Comment } from "@/types/comments";

export function CommentsPanel({ pageId, open, onClose }: { pageId: string; open: boolean; onClose: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open && pageId) {
      setLoading(true);
      invoke<Comment[]>("get_comments", { pageId }).then(setComments).catch(() => {}).finally(() => setLoading(false));
    }
  }, [open, pageId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    try {
      const comment = await invoke<Comment>("create_comment", { pageId, parentId: null, blockId: "", author: "You", content: newComment });
      setComments([...comments, comment]);
      setNewComment("");
    } catch (e) { console.error(e); } finally { setSending(false); }
  };

  const handleResolve = async (id: string) => {
    await invoke("resolve_comment", { id });
    setComments(comments.map((c) => c.id === id ? { ...c, resolved: true } : c));
  };

  const handleDelete = async (id: string) => {
    await invoke("delete_comment", { id });
    setComments(comments.filter((c) => c.id !== id && c.parent_id !== id));
  };

  if (!open) return null;

  return (
    <div className="flex h-full w-64 flex-col border-l border-hairline bg-canvas">
      <div className="flex items-center justify-between px-3 py-2 border-b border-hairline">
        <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-ink-muted" /><span className="text-sm font-semibold text-ink">Comments</span></div>
        <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-ink-muted" /></div> :
          comments.filter((c) => !c.parent_id).map((comment) => (
            <div key={comment.id} className={cn("rounded-lg border p-3", comment.resolved ? "border-green-200 bg-green-50/50" : "border-hairline")}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-ink-secondary">{comment.author}</span>
                <div className="flex items-center gap-1">
                  {!comment.resolved && <button onClick={() => handleResolve(comment.id)} className="text-ink-faint hover:text-green-500"><Check className="h-3.5 w-3.5" /></button>}
                  <button onClick={() => handleDelete(comment.id)} className="text-ink-faint hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <p className="text-sm text-ink-secondary">{comment.content}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-ink-faint">{comment.created_at}</span>
                {comment.resolved && <span className="text-xs text-green-600 flex items-center gap-0.5"><CheckCheck className="h-3 w-3" />Resolved</span>}
              </div>
              {comments.filter((r) => r.parent_id === comment.id).map((reply) => (
                <div key={reply.id} className="mt-2 ml-3 pl-3 border-l-2 border-hairline">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink-secondary">{reply.author}</span>
                    <button onClick={() => handleDelete(reply.id)} className="text-ink-faint hover:text-red-500"><X className="h-3 w-3" /></button>
                  </div>
                  <p className="text-sm text-ink-secondary">{reply.content}</p>
                </div>
              ))}
            </div>
          ))
        }
        {!loading && comments.filter((c) => !c.parent_id).length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
            <MessageSquare className="h-8 w-8 text-ink-faint" />
            <p className="text-sm text-ink-muted">No comments yet</p>
          </div>
        )}
      </div>
      <div className="border-t border-hairline p-3">
        <div className="flex gap-2">
          <input value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..."
            className="flex-1 rounded-md border border-hairline bg-canvas-soft px-2.5 py-1.5 text-sm text-ink outline-none placeholder:text-ink-faint"
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()} />
          <button onClick={handleAddComment} disabled={!newComment.trim() || sending}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white hover:bg-primary-active disabled:opacity-40">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
