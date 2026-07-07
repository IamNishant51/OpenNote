import { useState, useEffect, useRef } from "react";
import { X, Key, RefreshCw, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAIStore } from "@/stores/ai";

export function AiSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const providers = useAIStore(s => s.providers);
  const updateProvider = useAIStore(s => s.updateProvider);
  const discoverModels = useAIStore(s => s.discoverModels);
  const discovering = useAIStore(s => s.discovering);
  const setSelectedProvider = useAIStore(s => s.setSelectedProvider);
  const setSelectedModel = useAIStore(s => s.setSelectedModel);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  // Use a ref for discoverModels so the effect doesn't re-run every time the store updates
  const discoverModelsRef = useRef(discoverModels);
  discoverModelsRef.current = discoverModels;

  useEffect(() => {
    if (open) discoverModelsRef.current();
  }, [open]); // ← only [open], not [discoverModels], so it never loops

  const handleApiKeyChange = (providerId: string, key: string) => {
    updateProvider(providerId, { apiKey: key, enabled: !!key });
  };

  const handleRescan = async () => {
    await discoverModels();
  };

  const handleSelectModel = (providerId: string, modelId: string) => {
    setSelectedProvider(providerId);
    setSelectedModel(modelId);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[min(92vw,880px)] rounded-2xl bg-canvas shadow-elevated border border-hairline overflow-hidden max-h-[86vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-hairline flex-shrink-0 bg-canvas-soft/60">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-ink-muted" />
            <div>
              <h2 className="text-sm font-semibold text-ink">AI Settings</h2>
              <p className="text-xs text-ink-faint">Connect providers and choose your default model.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-sidebar-hover text-ink-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-canvas-soft/30">
          {providers.map((provider) => (
            <div
              key={provider.id}
              className="rounded-xl border border-hairline bg-canvas p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-medium text-ink">{provider.name}</h3>
                  <p className="text-xs text-ink-faint mt-0.5">{provider.type}</p>
                </div>
                <span
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border",
                    provider.enabled
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-gray-50 text-gray-500 border-gray-200",
                  )}
                >
                  {provider.enabled ? "Connected" : "Disabled"}
                </span>
              </div>

              {provider.type !== "ollama" && provider.type !== "lmstudio" && (
                <div className="relative mb-2">
                  <input
                    type={showKey[provider.id] ? "text" : "password"}
                    value={provider.apiKey || ""}
                    onChange={(e) => handleApiKeyChange(provider.id, e.target.value)}
                    placeholder={`${provider.name} API Key`}
                    className="w-full rounded-lg border border-hairline bg-canvas-soft px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint pr-10"
                  />
                  <button
                    onClick={() =>
                      setShowKey((s) => ({ ...s, [provider.id]: !s[provider.id] }))
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted"
                  >
                    {showKey[provider.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}

              {(provider.type === "ollama" || provider.type === "lmstudio") && (
                <p className="text-xs text-ink-faint mb-3 rounded-lg border border-dashed border-hairline bg-canvas-soft px-3 py-2">
                  Auto-detecting local models at {provider.baseUrl}
                  {provider.models.length > 0 && ` (${provider.models.length} found)`}
                </p>
              )}

              {provider.models.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Models</p>
                  {provider.models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleSelectModel(provider.id, model.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                        model.id ===
                            useAIStore.getState().selectedModelId &&
                            provider.id ===
                              useAIStore.getState().selectedProviderId
                          ? "border-primary bg-primary/5"
                          : "border-hairline hover:bg-sidebar-hover",
                      )}
                    >
                      <Check
                        className={cn(
                          "h-3.5 w-3.5 flex-shrink-0",
                          model.id ===
                            useAIStore.getState().selectedModelId &&
                            provider.id ===
                              useAIStore.getState().selectedProviderId
                            ? "text-primary"
                            : "text-transparent",
                        )}
                      />
                      <span className="text-ink-secondary">{model.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {provider.models.length === 0 && (
                <p className="text-xs text-ink-faint border border-dashed border-hairline rounded-lg px-3 py-2 bg-canvas-soft">No models found</p>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-hairline px-5 py-4 flex items-center justify-between flex-shrink-0 bg-canvas-soft/60">
          <button
            onClick={handleRescan}
            disabled={discovering}
            className="flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink-muted hover:text-ink-secondary transition-colors"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", discovering && "animate-spin")} />
            Rescan local models
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-active transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
