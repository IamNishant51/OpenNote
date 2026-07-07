import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Trash2, Bot, User } from "lucide-react";
import { useAIStore } from "@/stores/ai";
import { createProviderModel } from "@/lib/ai/provider-registry";
import { streamText } from "ai";
import type { AIChatMessage } from "@/types/ai";

export function AiChatAgent() {
  const { providers, selectedProviderId, selectedModelId, chatMessages, addChatMessage, clearChat } = useAIStore();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, streamingContent]);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);
  const hasProvider = !!selectedProvider && !!selectedModelId;

  const handleSend = async () => {
    if (!input.trim() || !hasProvider || streaming) return;

    const userMessage: AIChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    addChatMessage(userMessage);
    setInput("");
    setStreaming(true);
    setStreamingContent("");

    try {
      const model = await createProviderModel(selectedProvider!, selectedModelId!);
      if (!model) {
        setStreamingContent("Failed to create model");
        setStreaming(false);
        return;
      }

      const history = [...chatMessages, userMessage].map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const result = streamText({
        model,
        system: "You are a helpful AI assistant integrated into OpenNotes, a Notion-like note-taking app. Help users with writing, organizing, and managing their notes.",
        messages: history,
      });

      let fullText = "";
      for await (const chunk of result.textStream) {
        fullText += chunk;
        setStreamingContent(fullText);
      }

      const assistantMessage: AIChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fullText,
        timestamp: Date.now(),
      };
      addChatMessage(assistantMessage);
    } catch (e) {
      setStreamingContent(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setStreaming(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!hasProvider) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-2 p-4">
        <Bot className="h-8 w-8 text-ink-faint" />
        <p className="text-sm text-ink-muted">Configure AI to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {chatMessages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <Bot className="h-10 w-10 text-ink-faint" />
            <p className="text-sm text-ink-muted">Ask me anything about your notes</p>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-white"
                  : "bg-sidebar-bg text-ink-secondary"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-bg text-ink-secondary flex-shrink-0 mt-0.5">
                <User className="h-4 w-4" />
              </div>
            )}
          </div>
        ))}

        {streaming && streamingContent && (
          <div className="flex gap-2 justify-start">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0 mt-0.5">
              <Bot className="h-4 w-4" />
            </div>
            <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-sidebar-bg text-ink-secondary">
              <p className="whitespace-pre-wrap">{streamingContent}</p>
            </div>
          </div>
        )}

        {streaming && !streamingContent && (
          <div className="flex gap-2 justify-start">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0 mt-0.5">
              <Bot className="h-4 w-4" />
            </div>
            <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-sidebar-bg text-ink-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-hairline p-2 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI..."
          rows={1}
          className="flex-1 rounded-lg border border-hairline bg-canvas-soft px-3 py-2 text-sm text-ink outline-none resize-none placeholder:text-ink-faint max-h-32"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || streaming}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-active transition-colors disabled:opacity-40 flex-shrink-0"
        >
          {streaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
