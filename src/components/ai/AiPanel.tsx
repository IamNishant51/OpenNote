import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Send, Loader2, Bot, User, Sparkles, X, Settings, Trash2, Copy, Check } from "lucide-react";
import { useAIStore } from "@/stores/ai";
import { useWorkspaceStore } from "@/stores/workspace";
import { useToastStore } from "@/stores/toast";
import { createProviderModel } from "@/lib/ai/provider-registry";
import { streamText, tool, jsonSchema } from "ai";
import { editorRef } from "@/lib/editorRef";
import type { AIChatMessage, AIActionType } from "@/types/ai";
import { cn } from "@/lib/utils";

interface CommandDef {
  trigger: string;
  actionType: AIActionType;
  description: string;
}

const COMMANDS: CommandDef[] = [
  { trigger: "/write", actionType: "write", description: "Write new content" },
  { trigger: "/improve", actionType: "improve", description: "Improve writing quality" },
  { trigger: "/summarize", actionType: "summarize", description: "Summarize the page" },
  { trigger: "/translate", actionType: "translate", description: "Translate content" },
  { trigger: "/explain", actionType: "explain", description: "Explain the content" },
  { trigger: "/fix-spelling", actionType: "fix-spelling", description: "Fix spelling & grammar" },
  { trigger: "/tone", actionType: "change-tone", description: "Change the tone" },
  { trigger: "/simplify", actionType: "simplify", description: "Simplify the language" },
  { trigger: "/expand", actionType: "expand", description: "Add more detail" },
  { trigger: "/shorten", actionType: "shorten", description: "Make it concise" },
  { trigger: "/brainstorm", actionType: "brainstorm", description: "Generate ideas" },
  { trigger: "/actions", actionType: "find-actions", description: "Find action items" },
];

const COMMAND_MAP: Record<string, AIActionType> = {};
for (const cmd of COMMANDS) {
  COMMAND_MAP[cmd.trigger.slice(1)] = cmd.actionType;
}

const DEFAULT_PROMPTS: Record<string, string> = {
  write: "Write new content for this page",
  improve: "Improve the writing on this page",
  summarize: "Summarize this page",
  translate: "Translate this page to English",
  explain: "Explain the content on this page",
  "fix-spelling": "Fix spelling and grammar on this page",
  "change-tone": "Rewrite this page in a professional tone",
  simplify: "Simplify the content on this page",
  expand: "Add more detail to this page",
  shorten: "Make this page more concise",
  brainstorm: "Brainstorm ideas about this topic",
  "find-actions": "Find action items in this page",
};

const CONFIRMATIONS: Record<string, string> = {
  write: "I've written new content to your page.",
  improve: "I've improved the writing on this page.",
  summarize: "I've summarized the content on this page.",
  translate: "I've translated the content on this page.",
  "fix-spelling": "I've fixed spelling and grammar on this page.",
  "change-tone": "I've rewritten this page in a professional tone.",
  simplify: "I've simplified the content on this page.",
  expand: "I've expanded the content on this page.",
  shorten: "I've shortened the content on this page.",
  brainstorm: "I've brainstormed ideas for you.",
  "find-actions": "I've found action items from this page.",
};

function parseInput(text: string): { actionType?: AIActionType; prompt: string } {
  const trimmed = text.trim();
  const match = trimmed.match(/^\/([\w][\w-]*)\s*(.*)$/s);
  if (match) {
    const cmd = match[1].toLowerCase();
    const args = match[2].trim();
    const actionType = COMMAND_MAP[cmd];
    if (actionType) {
      return { actionType, prompt: args || DEFAULT_PROMPTS[actionType] };
    }
  }
  return { actionType: undefined, prompt: trimmed };
}

function supportsToolCalling(providerType: string): boolean {
  return !["ollama", "lmstudio", "custom"].includes(providerType);
}

function buildSystemPrompt(pageTitle?: string, pageContent?: string, actionType?: string): string {
  const parts: string[] = [
    "You are OpenNotes AI, an AI writing assistant inside a note-taking app.",
    "You have access to tools: search_web (Wikipedia) and search_youtube (YouTube). Use them when the user asks about current events, wants to find videos, or needs information beyond the page content.",
    "",
    "## CRITICAL OUTPUT RULES",
    "- Output ONLY the page content. NO greetings, NO explanations, NO meta-commentary.",
    "- Never say \"Here is\" or \"Let me know\" or \"I've created\" or anything beyond the raw content.",
    "- If the user says \"remove everything and write X\", output ONLY the new content X.",
    "- If the user says \"improve this\", output ONLY the improved version.",
    "- Use markdown for formatting (headings, lists, bold, links).",
    "- For YouTube videos the user asks for, include the URL as a markdown link.",
    "- If no content change is needed (e.g., user just asked a question), output a brief answer only.",
    "",
    "## PAGE CONTEXT",
    `Title: ${pageTitle || "Untitled"}`,
    `Content: ${(pageContent || "(empty)").slice(0, 8000)}`,
  ];

  if (actionType) {
    const cmds: Record<string, string> = {
      write: "\n\nUser wants new content from scratch. Output ONLY the content they asked for.",
      improve: "\n\nUser wants improved writing. Fix clarity, flow, grammar, style. Preserve all meaning. Output ONLY the improved version.",
      summarize: "\n\nUser wants a summary. Be concise, preserve key info. Output ONLY the summary.",
      translate: "\n\nUser wants translation. Preserve meaning and tone. Output ONLY the translated version.",
      explain: "\n\nUser wants an explanation. Output ONLY the explanation.",
      "fix-spelling": "\n\nUser wants spelling/grammar fixes. Do NOT change style or meaning. Output ONLY the corrected version.",
      "change-tone": "\n\nUser wants a tone change. Preserve meaning. Output ONLY the rewritten version.",
      simplify: "\n\nUser wants simplification. Use simpler words. Preserve key info. Output ONLY the simplified version.",
      expand: "\n\nUser wants expansion. Add detail and depth. Output ONLY the expanded version.",
      shorten: "\n\nUser wants it shorter. Preserve key info. Output ONLY the shortened version.",
      brainstorm: "\n\nUser wants brainstorming. Be creative. Output ideas with brief descriptions.",
      "find-actions": "\n\nUser wants action items extracted. List them clearly.",
    };
    parts.push(cmds[actionType] || "");
  }

  return parts.join("\n");
}

export function AiPanel() {
  const { providers, selectedProviderId, selectedModelId, chatMessages, addChatMessage, clearChat, setPanelOpen, setSettingsOpen, customAgents } = useAIStore();
  const addToast = useToastStore(s => s.addToast);
  const currentPage = useWorkspaceStore(s => s.currentPage);
  const [input, setInput] = useState("");
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCmd, setSelectedCmd] = useState(0);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedProvider = providers.find(p => p.id === selectedProviderId);
  const hasProvider = !!selectedProvider && !!selectedModelId;
  const selectedAgent = selectedAgentId ? customAgents.find(a => a.id === selectedAgentId) ?? null : null;

  const filteredCommands = useMemo(() => {
    if (!showCommands) return [];
    const query = input.slice(1).toLowerCase();
    if (!query) return COMMANDS;
    return COMMANDS.filter(c => c.trigger.slice(1).startsWith(query) || c.trigger.slice(1).includes(query));
  }, [showCommands, input]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, streamingContent]);

  const getContext = useCallback(async () => {
    const editor = editorRef.get();
    if (!editor || !currentPage) return { title: "", content: "" };
    try {
      const md = editor.blocksToMarkdownLossy(editor.document);
      return { title: currentPage.title || "", content: md || "" };
    } catch {
      return { title: currentPage.title || "", content: "" };
    }
  }, [currentPage]);

  const insertToPage = useCallback((text: string) => {
    const editor = editorRef.get();
    if (!editor) return false;
    try {
      const blocks = editor.tryParseMarkdownToBlocks(text);
      if (blocks?.length) {
        editor.replaceBlocks(editor.document, blocks);
        return true;
      }
    } catch {}
    return false;
  }, []);

  const searchWeb = useMemo(() => tool({
    inputSchema: jsonSchema<{ query: string }>({
      type: "object",
      properties: { query: { type: "string", description: "The search query" } },
      required: ["query"],
    }),
    description: "Search the web for current information, news, facts, and general knowledge. Use when the user asks about events, people, concepts, or anything beyond the page content.",
    execute: async ({ query }) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(
          `https://en.wikipedia.org/w/api.php?origin=*&action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=5`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        const data = await res.json();
        const results = (data.query?.search || []).slice(0, 5).map((r: any) => ({
          title: r.title,
          snippet: r.snippet.replace(/<\/?[^>]+(>|$)/g, ""),
          url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title)}`,
        }));
        return JSON.stringify({ source: "Wikipedia", results });
      } catch {
        return JSON.stringify({ source: "Wikipedia", results: [] });
      }
    },
  }), []);

  const searchYouTube = useMemo(() => tool({
    inputSchema: jsonSchema<{ query: string }>({
      type: "object",
      properties: { query: { type: "string", description: "What to search for on YouTube" } },
      required: ["query"],
    }),
    description: "Search for YouTube videos on any topic. Returns video titles, URLs, and channel names. Use when the user asks to find videos, tutorials, or anything video-related.",
    execute: async ({ query }) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(
          `https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        const data = await res.json();
        const videos = (Array.isArray(data) ? data : []).slice(0, 5).map((v: any) => ({
          title: v.title,
          url: `https://youtube.com/watch?v=${v.videoId}`,
          channel: v.author || "",
          duration: v.lengthSeconds || 0,
        }));
        return JSON.stringify({ videos });
      } catch {
        return JSON.stringify({ videos: [] });
      }
    },
  }), []);

  const sendMessage = useCallback(async (text: string, actionType?: string) => {
    if (!text.trim() || !hasProvider || streaming) return;

    const userMsg: AIChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };
    addChatMessage(userMsg);
    setInput("");
    setStreaming(true);
    setStreamingContent("");
    const startTime = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - startTime), 200);

    try {
      const model = await createProviderModel(selectedProvider!, selectedModelId!);
      if (!model) {
        setStreamingContent("Failed to create AI model. Check your provider settings.");
        return;
      }

      const ctx = await getContext();
      const system = selectedAgent
        ? `${selectedAgent.systemPrompt}\n\n## PAGE CONTEXT\nTitle: ${ctx.title || "Untitled"}\nContent: ${(ctx.content || "(empty)").slice(0, 8000)}`
        : buildSystemPrompt(ctx.title, ctx.content, actionType);
      const history = [...chatMessages, userMsg].map(m => ({ role: m.role, content: m.content }) as { role: "user" | "assistant"; content: string });

      const hasTools = supportsToolCalling(selectedProvider!.type);
      const doStream = async (withTools: boolean) => {
        let streamError: Error | null = null;
        const result = streamText({
          model,
          system,
          messages: history,
          ...(withTools ? { tools: { search_web: searchWeb, search_youtube: searchYouTube } } : {}),
          onError: (err: unknown) => {
            streamError = err instanceof Error ? err : new Error(String(err));
          },
        });
        let full = "";
        try {
          for await (const chunk of result.textStream) {
            full += chunk;
            setStreamingContent(full);
          }
        } catch (e) {
          streamError = e instanceof Error ? e : new Error(String(e));
        }
        if (streamError && !full.trim()) {
          throw streamError;
        }
        return full.trim();
      };

      let content: string;
      try {
        content = await doStream(hasTools);
      } catch (streamErr) {
        if (hasTools) {
          const msg = String(streamErr).toLowerCase();
          if (msg.includes("tool") || msg.includes("not support") || msg.includes("400")) {
            console.warn("Tools not supported by this model, retrying without:", msg);
            content = await doStream(false);
          } else {
            throw streamErr;
          }
        } else {
          throw streamErr;
        }
      }

      if (!content) {
        setStreamingContent("The model returned an empty response. Try a different prompt or provider.");
        return;
      }

      insertToPage(content);
      addChatMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: actionType && CONFIRMATIONS[actionType] ? CONFIRMATIONS[actionType] : "Done. I've updated the page.",
        timestamp: Date.now(),
      });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "AI request failed";
      setStreamingContent(`Error: ${errMsg}`);
      addToast({ type: "error", message: `AI: ${errMsg}` });
      console.error("[AiPanel] sendMessage error:", e);
    } finally {
      setStreaming(false);
      setStreamingContent("");
      clearInterval(timer);
      setElapsed(0);
    }
  }, [hasProvider, streaming, selectedProvider, selectedModelId, chatMessages, addChatMessage, getContext, insertToPage, searchWeb, searchYouTube, setElapsed, selectedAgent, addToast]);

  const handleSend = useCallback(() => {
    const { actionType, prompt } = parseInput(input);
    sendMessage(prompt, actionType);
  }, [input, sendMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    setShowCommands(val.startsWith("/"));
    setSelectedCmd(0);
  };

  const selectCommand = useCallback((cmd: CommandDef) => {
    setInput(cmd.trigger + " ");
    setShowCommands(false);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showCommands && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedCmd(i => Math.min(i + 1, filteredCommands.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedCmd(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Tab" || e.key === "Enter") { e.preventDefault(); selectCommand(filteredCommands[selectedCmd]); return; }
      if (e.key === "Escape") { setShowCommands(false); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = useCallback((text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  return (
    <div className="flex h-full w-80 flex-col border-l border-hairline bg-canvas">
      <div className="flex items-center justify-between px-3 py-2 border-b border-hairline flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-ink">{selectedAgent ? `AI - ${selectedAgent.name}` : "AI"}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => clearChat()} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted" title="Clear chat"><Trash2 className="h-3.5 w-3.5" /></button>
          <button onClick={() => setSettingsOpen(true)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted" title="AI Settings"><Settings className="h-3.5 w-3.5" /></button>
          <button onClick={() => setPanelOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-sidebar-hover text-ink-muted" title="Close"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {customAgents.length > 0 && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-hairline flex-shrink-0">
          <select
            value={selectedAgentId ?? ""}
            onChange={e => setSelectedAgentId(e.target.value || null)}
            className="flex-1 text-xs text-ink-muted bg-canvas-soft rounded-lg border border-hairline px-2 py-1 outline-none"
          >
            <option value="">Default AI</option>
            {customAgents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {selectedAgent && (
            <button
              onClick={() => setSelectedAgentId(null)}
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-sidebar-hover text-ink-faint"
              title="Reset to Default AI"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {!hasProvider ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <Sparkles className="h-8 w-8 text-ink-faint" />
            <p className="text-sm text-ink-muted">No AI provider configured</p>
            <button onClick={() => setSettingsOpen(true)} className="text-sm text-primary hover:underline">Open AI Settings</button>
          </div>
        ) : chatMessages.length === 0 && !streaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <Bot className="h-10 w-10 text-ink-faint" />
            <p className="text-sm text-ink-muted">Tell AI what to write or edit</p>
            <p className="text-xs text-ink-faint">Type / for commands</p>
          </div>
        ) : (
          <>
            {chatMessages.map(msg => (
              <div key={msg.id} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div className={cn("max-w-[85%] rounded-lg px-3 py-2 text-sm", msg.role === "user" ? "bg-primary text-white" : "bg-sidebar-bg text-ink-secondary")}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-3 mt-2 pt-2 border-t border-hairline/50">
                      <button onClick={() => handleCopy(msg.content, msg.id)} className="flex items-center gap-1 text-xs text-ink-faint hover:text-ink-muted transition-colors">
                        {copiedId === msg.id ? <><Check className="h-3 w-3 text-green-500" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                      </button>
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-bg text-ink-secondary flex-shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {streaming && (
              <div className="flex gap-2 justify-start">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0 mt-0.5"><Bot className="h-4 w-4" /></div>
                <div className="max-w-[85%] rounded-lg px-3 py-2 text-sm bg-sidebar-bg text-ink-secondary">
                  {streamingContent ? (
                    <p className="whitespace-pre-wrap">{streamingContent}</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
                      <span className="text-xs text-ink-faint">Thinking{(elapsed > 2000 ? ` (${(elapsed / 1000).toFixed(0)}s)` : "")}...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-hairline flex-shrink-0 relative">
        {showCommands && filteredCommands.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mx-3 mb-1 rounded-lg border border-hairline bg-canvas shadow-elevated overflow-hidden">
            {filteredCommands.map((cmd, i) => (
              <button key={cmd.trigger} onClick={() => selectCommand(cmd)} onMouseEnter={() => setSelectedCmd(i)}
                className={cn("flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors", i === selectedCmd ? "bg-sidebar-active text-ink" : "text-ink-secondary hover:bg-sidebar-hover")}
              >
                <span className="font-medium text-primary">{cmd.trigger}</span>
                <span className="text-ink-faint">{cmd.description}</span>
              </button>
            ))}
          </div>
        )}
        <div className="p-3">
          <div className="flex items-end gap-2">
            <textarea ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
              placeholder={input.startsWith("/") ? "Type a command..." : "Ask AI to write or edit..."}
              rows={1} className="flex-1 rounded-lg border border-hairline bg-canvas-soft px-3 py-2 text-sm text-ink outline-none resize-none placeholder:text-ink-faint max-h-32"
            />
            <button onClick={handleSend} disabled={!input.trim() || streaming || !hasProvider}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white hover:bg-primary-active transition-colors disabled:opacity-40 flex-shrink-0"
            >
              {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
