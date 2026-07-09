import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToastStore, type ToastType } from "@/stores/toast";

const typeConfig: Record<ToastType, { icon: typeof CheckCircle; color: string }> = {
  success: { icon: CheckCircle, color: "text-green-500" },
  error: { icon: XCircle, color: "text-red-500" },
  info: { icon: Info, color: "text-primary" },
  warning: { icon: AlertTriangle, color: "text-amber-500" },
};

function ToastItem({ id, type, message }: { id: string; type: ToastType; message: string }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const [exiting, setExiting] = useState(false);
  const { icon: Icon, color } = typeConfig[type];

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => removeToast(id), 200);
  };

  useEffect(() => {
    const toasts = useToastStore.getState().toasts;
    const t = toasts.find((t) => t.id === id);
    if (t && t.duration !== 0) {
      const timer = setTimeout(handleClose, (t.duration ?? 4000) - 200);
      return () => clearTimeout(timer);
    }
  }, [id]);

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-hairline bg-canvas px-4 py-3 shadow-elevated w-80 pointer-events-auto ${
        exiting ? "animate-fade-out" : "animate-slide-in"
      }`}
    >
      <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${color}`} />
      <p className="flex-1 text-sm text-ink leading-tight pt-0.5">{message}</p>
      <button
        onClick={handleClose}
        className="shrink-0 rounded-md p-0.5 text-ink-muted hover:bg-sidebar-hover hover:text-ink transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const visible = toasts.slice(0, 5);

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {visible.map((t) => (
        <ToastItem key={t.id} id={t.id} type={t.type} message={t.message} />
      ))}
    </div>,
    document.body
  );
}
