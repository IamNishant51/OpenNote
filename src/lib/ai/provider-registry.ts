import type { AIProvider, AIModel, ProviderType } from "@/types/ai";
import { discoverLocalModels } from "./model-discovery";
import { isTauriRuntime } from "@/lib/tauri";

async function getOpenAI(apiKey?: string, baseURL?: string) {
  const { createOpenAI } = await import("@ai-sdk/openai");
  return createOpenAI({ apiKey, baseURL });
}
async function getAnthropic() {
  const { anthropic } = await import("@ai-sdk/anthropic");
  return anthropic;
}
async function getGoogle() {
  const { google } = await import("@ai-sdk/google");
  return google;
}
async function getMistral() {
  const { mistral } = await import("@ai-sdk/mistral");
  return mistral;
}
async function getDeepseek() {
  const { deepseek } = await import("@ai-sdk/deepseek");
  return deepseek;
}



const providerFactories: Record<string, { createModelAsync: (modelId: string, apiKey?: string, baseUrl?: string) => Promise<any>; defaultBaseUrl: string }> = {
  openai: {
    createModelAsync: async (modelId, apiKey, baseUrl) => {
      try { const p = await getOpenAI(apiKey, baseUrl); return p(modelId); } catch { return null; }
    },
    defaultBaseUrl: "https://api.openai.com/v1",
  },
  anthropic: {
    createModelAsync: async (modelId) => {
      try { const a = await getAnthropic(); return a(modelId as any); } catch { return null; }
    },
    defaultBaseUrl: "https://api.anthropic.com/v1",
  },
  google: {
    createModelAsync: async (modelId) => {
      try { const g = await getGoogle(); return g(modelId); } catch { return null; }
    },
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
  },
  mistral: {
    createModelAsync: async (modelId) => {
      try { const m = await getMistral(); return m(modelId as any); } catch { return null; }
    },
    defaultBaseUrl: "https://api.mistral.ai/v1",
  },
  deepseek: {
    createModelAsync: async (modelId) => {
      try { const d = await getDeepseek(); return d(modelId as any); } catch { return null; }
    },
    defaultBaseUrl: "https://api.deepseek.com/v1",
  },
  ollama: {
    createModelAsync: async (modelId, _apiKey, baseUrl) => {
      try { const p = await getOpenAI(undefined, baseUrl || "http://localhost:11434/v1"); return p(modelId); } catch { return null; }
    },
    defaultBaseUrl: "http://localhost:11434/v1",
  },
  lmstudio: {
    createModelAsync: async (modelId, _apiKey, baseUrl) => {
      try { const p = await getOpenAI(undefined, baseUrl || "http://localhost:1234/v1"); return p(modelId); } catch { return null; }
    },
    defaultBaseUrl: "http://localhost:1234/v1",
  },
};

const defaultModels: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "o3-mini"],
  anthropic: ["claude-sonnet-4-20250514", "claude-haiku-3-5-20241022"],
  google: ["gemini-2.0-flash", "gemini-2.0-pro-exp-02-05"],
  mistral: ["mistral-large-latest", "mistral-small-latest"],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
};

export async function createProviderModel(
  provider: AIProvider,
  modelId: string,
): Promise<any> {
  const factory = providerFactories[provider.type];
  if (!factory) return null;
  return factory.createModelAsync(modelId, provider.apiKey, provider.baseUrl);
}

export function getDefaultModels(type: ProviderType): string[] {
  return defaultModels[type] || [];
}

export async function discoverProviderModels(provider: AIProvider): Promise<AIModel[]> {
  if (provider.type === "ollama" || provider.type === "lmstudio") {
    if (!isTauriRuntime()) {
      return [];
    }
    return discoverLocalModels();
  }
  return getDefaultModels(provider.type).map((id) => ({
    id,
    name: id,
    providerId: provider.id,
  }));
}

export function getDefaultProviders(): AIProvider[] {
  return [
    {
      id: "openai",
      name: "OpenAI",
      type: "openai",
      baseUrl: "https://api.openai.com/v1",
      models: getDefaultModels("openai").map((id) => ({
        id,
        name: id,
        providerId: "openai",
      })),
      enabled: false,
    },
    {
      id: "anthropic",
      name: "Anthropic",
      type: "anthropic",
      baseUrl: "https://api.anthropic.com/v1",
      models: getDefaultModels("anthropic").map((id) => ({
        id,
        name: id,
        providerId: "anthropic",
      })),
      enabled: false,
    },
    {
      id: "ollama",
      name: "Ollama (Local)",
      type: "ollama",
      baseUrl: "http://localhost:11434/v1",
      models: [],
      enabled: true,
    },
    {
      id: "lmstudio",
      name: "LM Studio (Local)",
      type: "lmstudio",
      baseUrl: "http://localhost:1234/v1",
      models: [],
      enabled: true,
    },
    {
      id: "google",
      name: "Google",
      type: "google",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      models: getDefaultModels("google").map((id) => ({
        id,
        name: id,
        providerId: "google",
      })),
      enabled: false,
    },
    {
      id: "mistral",
      name: "Mistral",
      type: "mistral",
      baseUrl: "https://api.mistral.ai/v1",
      models: getDefaultModels("mistral").map((id) => ({
        id,
        name: id,
        providerId: "mistral",
      })),
      enabled: false,
    },
    {
      id: "deepseek",
      name: "DeepSeek",
      type: "deepseek",
      baseUrl: "https://api.deepseek.com/v1",
      models: getDefaultModels("deepseek").map((id) => ({
        id,
        name: id,
        providerId: "deepseek",
      })),
      enabled: false,
    },
  ];
}
