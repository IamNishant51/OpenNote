import { Sparkles } from "lucide-react";
import { useAIStore } from "@/stores/ai";

export function AiToggle() {
  const { panelOpen, setPanelOpen } = useAIStore();

  return (
    <button
      onClick={() => setPanelOpen(!panelOpen)}
      className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors ${
        panelOpen
          ? "bg-primary/10 text-primary"
          : "text-ink-muted hover:bg-sidebar-hover"
      }`}
    >
      <Sparkles className="h-4 w-4" />
      <span>AI</span>
    </button>
  );
}
