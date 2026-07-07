import { useState } from "react";
import {
  Sparkles,
  X,
  Settings,
  MessageSquare,
  Loader2,
  Copy,
  Check,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAIStore } from "@/stores/ai";
import { actionConfigs } from "@/lib/ai/action-configs";
import { runAIAction } from "@/lib/ai/actions";
import { AiChatAgent } from "./AiChatAgent";
import type { AIActionType, AIActionResponse } from "@/types/ai";
import { ArrowRight, BrainCircuit, CheckCheck, Languages, Lightbulb, ListTodo, PenLine, Scissors, WandSparkles, ZoomIn, FileText, Workflow } from "lucide-react";

type Tab = "actions" | "chat";

const actionIconMap: Record<AIActionType, React.ReactNode> = {
  write: <PenLine className="h-3.5 w-3.5" />,
  continue: <ArrowRight className="h-3.5 w-3.5" />,
  summarize: <FileText className="h-3.5 w-3.5" />,
  translate: <Languages className="h-3.5 w-3.5" />,
  explain: <Lightbulb className="h-3.5 w-3.5" />,
  improve: <Sparkles className="h-3.5 w-3.5" />,
  "fix-spelling": <CheckCheck className="h-3.5 w-3.5" />,
  "change-tone": <Workflow className="h-3.5 w-3.5" />,
  simplify: <WandSparkles className="h-3.5 w-3.5" />,
  expand: <ZoomIn className="h-3.5 w-3.5" />,
  shorten: <Scissors className="h-3.5 w-3.5" />,
  brainstorm: <BrainCircuit className="h-3.5 w-3.5" />,
  "find-actions": <ListTodo className="h-3.5 w-3.5" />,
};

export function AiPanel() {
  const {
    panelOpen,
    providers,
    selectedProviderId,
    selectedModelId,
    actionLoading,
    actionResult,
    actionError,
    setPanelOpen,
    setSettingsOpen,
    setActiveAction,
    setActionResult,
    setActionError,
    setActionLoading,
  } = useAIStore();

  const [tab, setTab] = useState<Tab>("actions");
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  if (!panelOpen) return null;

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);
  const selectedModel = selectedProvider?.models.find(
    (m) => m.id === selectedModelId,
  );
  const hasProvider = !!selectedProvider && !!selectedModel;

  const handleAction = async (type: AIActionType) => {
    if (!selectedProviderId || !selectedModelId) return;
    if (!input.trim() && actionConfigs.find((a) => a.type === type)?.requiresSelection) return;

    setActiveAction(type);
    setActionLoading(true);
    setActionResult(null);
    setActionError(null);

    const result: AIActionResponse = await runAIAction({
      action: type,
      selectedText: input,
      fullDocument: input,
      modelId: selectedModelId,
      providerId: selectedProviderId,
    });

    if (result.error) {
      setActionError(result.error);
    } else {
      setActionResult(result.text);
    }
    setActionLoading(false);
  };

  const handleCopyResult = async () => {
    if (actionResult) {
      await navigator.clipboard.writeText(actionResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex h-full w-72 flex-col border-l border-hairline bg-canvas">
      <div className="flex items-center justify-between px-3 py-2 border-b border-hairline">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-ink">AI</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPanelOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-hairline">
        <button
          onClick={() => setTab("actions")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2",
            tab === "actions"
              ? "border-primary text-primary"
              : "border-transparent text-ink-muted hover:text-ink-secondary",
          )}
        >
          <Zap className="h-3.5 w-3.5" />
          Actions
        </button>
        <button
          onClick={() => setTab("chat")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors border-b-2",
            tab === "chat"
              ? "border-primary text-primary"
              : "border-transparent text-ink-muted hover:text-ink-secondary",
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "actions" ? (
          <div className="p-3 space-y-3">
            {!hasProvider ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
                <Sparkles className="h-8 w-8 text-ink-faint" />
                <p className="text-sm text-ink-muted">No AI provider configured</p>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Open AI Settings
                </button>
              </div>
            ) : (
              <>
                <div className="text-xs text-ink-faint">
                  Using: <span className="text-ink-muted">{selectedModel?.name || selectedModelId}</span>
                </div>

                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type or paste text to work with..."
                  className="w-full rounded-lg border border-hairline bg-canvas-soft p-2.5 text-sm text-ink outline-none resize-none placeholder:text-ink-faint"
                  rows={4}
                />

                <div className="grid grid-cols-2 gap-1.5">
                  {actionConfigs.map((action) => (
                    <button
                      key={action.type}
                      onClick={() => handleAction(action.type)}
                      disabled={actionLoading || !input.trim() && action.requiresSelection}
                      className={cn(
                        "flex items-center gap-1.5 rounded-md border border-hairline px-2 py-1.5 text-xs transition-colors",
                        "hover:bg-sidebar-hover disabled:opacity-40 disabled:cursor-not-allowed",
                      )}
                    >
                      <span className="text-ink-muted">{actionIconMap[action.type]}</span>
                      <span className="truncate">{action.label}</span>
                    </button>
                  ))}
                </div>

                {actionLoading && (
                  <div className="flex items-center gap-2 text-sm text-ink-muted py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                )}

                {actionError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                    {actionError}
                  </div>
                )}

                {actionResult && (
                  <div className="rounded-lg border border-hairline bg-canvas-soft p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-ink-muted">Result</span>
                      <button
                        onClick={handleCopyResult}
                        className="flex items-center gap-1 text-xs text-ink-faint hover:text-ink-muted"
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm text-ink-secondary whitespace-pre-wrap">
                      {actionResult}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <AiChatAgent />
        )}
      </div>
    </div>
  );
}
