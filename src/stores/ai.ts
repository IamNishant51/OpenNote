import { create } from "zustand";
import type { AIProvider, AIModel, AIChatMessage, CustomAgent } from "@/types/ai";
import { getDefaultProviders, discoverProviderModels } from "@/lib/ai/provider-registry";

interface AIStore {
  providers: AIProvider[];
  models: AIModel[];
  customAgents: CustomAgent[];
  panelOpen: boolean;
  settingsOpen: boolean;
  chatMessages: AIChatMessage[];
  selectedProviderId: string | null;
  selectedModelId: string | null;
  activeAction: string | null;
  actionResult: string | null;
  actionError: string | null;
  actionLoading: boolean;
  discovering: boolean;

  setPanelOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setProviders: (providers: AIProvider[]) => void;
  updateProvider: (id: string, updates: Partial<AIProvider>) => void;
  setModels: (models: AIModel[]) => void;
  setSelectedProvider: (id: string) => void;
  setSelectedModel: (id: string) => void;
  setActiveAction: (action: string | null) => void;
  setActionResult: (text: string | null) => void;
  setActionError: (error: string | null) => void;
  setActionLoading: (loading: boolean) => void;
  addChatMessage: (message: AIChatMessage) => void;
  clearChat: () => void;
  setCustomAgents: (agents: CustomAgent[]) => void;
  addCustomAgent: (agent: CustomAgent) => void;
  removeCustomAgent: (id: string) => void;
  initializeProviders: () => Promise<void>;
  discoverModels: () => Promise<void>;
}

export const useAIStore = create<AIStore>((set, get) => ({
  providers: [],
  models: [],
  customAgents: [],
  panelOpen: false,
  settingsOpen: false,
  chatMessages: [],
  selectedProviderId: null,
  selectedModelId: null,
  activeAction: null,
  actionResult: null,
  actionError: null,
  actionLoading: false,
  discovering: false,

  setPanelOpen: (open) => set({ panelOpen: open, settingsOpen: false }),
  setSettingsOpen: (open) => set({ settingsOpen: open, panelOpen: false }),
  setProviders: (providers) => set({ providers }),
  updateProvider: (id, updates) =>
    set((state) => {
      const newProviders = state.providers.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      );
      // Persist API keys to localStorage
      const keys: Record<string, { apiKey?: string }> = {};
      for (const p of newProviders) {
        if (p.apiKey) keys[p.id] = { apiKey: p.apiKey };
      }
      localStorage.setItem("opennotes_provider_keys", JSON.stringify(keys));
      return { providers: newProviders };
    }),
  setModels: (models) => set({ models }),
  setSelectedProvider: (id) => {
    const provider = get().providers.find((p) => p.id === id);
    const firstModel = provider?.models?.[0];
    set({
      selectedProviderId: id,
      selectedModelId: firstModel?.id || null,
    });
  },
  setSelectedModel: (id) => set({ selectedModelId: id }),
  setActiveAction: (action) => set({ activeAction: action }),
  setActionResult: (text) => set({ actionResult: text }),
  setActionError: (error) => set({ actionError: error }),
  setActionLoading: (loading) => set({ actionLoading: loading }),
  addChatMessage: (message) =>
    set((state) => ({
      chatMessages: [...state.chatMessages, message],
    })),
  clearChat: () => set({ chatMessages: [] }),
  setCustomAgents: (customAgents) => set({ customAgents }),
  addCustomAgent: (agent) => set((s) => ({ customAgents: [...s.customAgents, agent] })),
  removeCustomAgent: (id) => set((s) => ({ customAgents: s.customAgents.filter(a => a.id !== id) })),
  initializeProviders: async () => {
    const defaults = getDefaultProviders();
    
    // Load persisted API keys and enabled state from localStorage
    const savedKeys = localStorage.getItem("opennotes_provider_keys");
    if (savedKeys) {
      try {
        const keys = JSON.parse(savedKeys);
        for (const provider of defaults) {
          const saved = keys[provider.id];
          if (saved?.apiKey) {
            provider.apiKey = saved.apiKey;
            provider.enabled = true;
          }
        }
      } catch { /* ignore parse errors */ }
    }

    const enabled = defaults.filter((p) => p.enabled || p.apiKey);
    set({ providers: defaults });

    const validModels = enabled.flatMap((p) => p.models);
    set({ models: validModels });

    if (validModels.length > 0) {
      const firstProvider = enabled.find((p) => p.models.length > 0);
      if (firstProvider) {
        set({
          selectedProviderId: firstProvider.id,
          selectedModelId: firstProvider.models[0]?.id || null,
        });
      }
    }
    
    // Load custom agents from localStorage
    const saved = localStorage.getItem("opennotes_custom_agents");
    if (saved) set({ customAgents: JSON.parse(saved) });
  },

  discoverModels: async () => {
    set({ discovering: true });
    try {
      const providers = get().providers;
      const localProviders = providers.filter(p => p.type === "ollama" || p.type === "lmstudio");
      for (const provider of localProviders) {
        try {
          const models = await discoverProviderModels(provider);
          if (models.length > 0) {
            get().updateProvider(provider.id, { models });
          }
        } catch { /* skip failed discovery */ }
      }
      const all = get().providers.flatMap((p) => p.models);
      set({ models: all });
    } finally {
      set({ discovering: false });
    }
  },
}));
