import type { AIProvider, AIModel, ProviderType } from "@/types/ai";
import { discoverLocalModels } from "./model-discovery";
import { isTauriRuntime } from "@/lib/tauri";

async function getOpenAI(apiKey?: string, baseURL?: string) {
  const { createOpenAI } = await import("@ai-sdk/openai");
  return createOpenAI({ apiKey: apiKey || "", baseURL });
}
async function getAnthropic(apiKey?: string) {
  const { createAnthropic } = await import("@ai-sdk/anthropic");
  return createAnthropic({ apiKey: apiKey || "" });
}
async function getGoogle(apiKey?: string) {
  const { createGoogleGenerativeAI } = await import("@ai-sdk/google");
  return createGoogleGenerativeAI({ apiKey: apiKey || "" });
}
async function getMistral(apiKey?: string) {
  const { createMistral } = await import("@ai-sdk/mistral");
  return createMistral({ apiKey: apiKey || "" });
}
async function getDeepseek(apiKey?: string) {
  const { createDeepSeek } = await import("@ai-sdk/deepseek");
  return createDeepSeek({ apiKey: apiKey || "" });
}



const providerFactories: Record<string, { createModelAsync: (modelId: string, apiKey?: string, baseUrl?: string) => Promise<any>; defaultBaseUrl: string }> = {
  openai: {
    createModelAsync: async (modelId, apiKey, baseUrl) => {
      try { const p = await getOpenAI(apiKey, baseUrl); return p.chat(modelId); } catch { return null; }
    },
    defaultBaseUrl: "https://api.openai.com/v1",
  },
  anthropic: {
    createModelAsync: async (modelId, apiKey) => {
      try { const a = await getAnthropic(apiKey); return a(modelId as any); } catch { return null; }
    },
    defaultBaseUrl: "https://api.anthropic.com/v1",
  },
  google: {
    createModelAsync: async (modelId, apiKey) => {
      try { const g = await getGoogle(apiKey); return g(modelId); } catch { return null; }
    },
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta",
  },
  mistral: {
    createModelAsync: async (modelId, apiKey) => {
      try { const m = await getMistral(apiKey); return m(modelId as any); } catch { return null; }
    },
    defaultBaseUrl: "https://api.mistral.ai/v1",
  },
  deepseek: {
    createModelAsync: async (modelId, apiKey) => {
      try { const d = await getDeepseek(apiKey); return d(modelId as any); } catch { return null; }
    },
    defaultBaseUrl: "https://api.deepseek.com/v1",
  },
  ollama: {
    createModelAsync: async (modelId, _apiKey, baseUrl) => {
      try { const p = await getOpenAI("", baseUrl || "http://localhost:11434/v1"); return p.chat(modelId); } catch { return null; }
    },
    defaultBaseUrl: "http://localhost:11434/v1",
  },
  lmstudio: {
    createModelAsync: async (modelId, _apiKey, baseUrl) => {
      try { const p = await getOpenAI("", baseUrl || "http://localhost:1234/v1"); return p.chat(modelId); } catch { return null; }
    },
    defaultBaseUrl: "http://localhost:1234/v1",
  },
  nvidia: {
    createModelAsync: async (modelId, apiKey, baseUrl) => {
      try { const p = await getOpenAI(apiKey, baseUrl || "https://integrate.api.nvidia.com/v1"); return p.chat(modelId); } catch { return null; }
    },
    defaultBaseUrl: "https://integrate.api.nvidia.com/v1",
  },
  groq: {
    createModelAsync: async (modelId, apiKey, baseUrl) => {
      try { const p = await getOpenAI(apiKey, baseUrl || "https://api.groq.com/openai/v1"); return p.chat(modelId); } catch { return null; }
    },
    defaultBaseUrl: "https://api.groq.com/openai/v1",
  },
  custom: {
    createModelAsync: async (modelId, apiKey, baseUrl) => {
      try { const p = await getOpenAI(apiKey, baseUrl || "https://api.openai.com/v1"); return p.chat(modelId); } catch { return null; }
    },
    defaultBaseUrl: "",
  },
};

const defaultModels: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "o3-mini"],
  anthropic: ["claude-sonnet-4-20250514", "claude-haiku-3-5-20241022"],
  google: ["gemini-2.0-flash", "gemini-2.0-pro-exp-02-05"],
  mistral: ["mistral-large-latest", "mistral-small-latest"],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  groq: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma2-9b-it", "deepseek-r1-distill-llama-70b"],
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
  if (provider.type === "nvidia") {
    return provider.models.length > 0 ? provider.models : getDefaultModels(provider.type).map((id) => ({
      id,
      name: id,
      providerId: provider.id,
    }));
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
      id: "nvidia",
      name: "NVIDIA NIM",
      type: "nvidia",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      models: [
        { id: "meta/llama-3.3-70b-instruct", name: "Llama 3.3 70B Instruct", providerId: "nvidia" },
        { id: "meta/llama-3.3-405b-instruct", name: "Llama 3.3 405B Instruct", providerId: "nvidia" },
        { id: "deepseek-ai/deepseek-r1", name: "DeepSeek R1", providerId: "nvidia" },
        { id: "qwen/qwen2.5-72b-instruct", name: "Qwen 2.5 72B Instruct", providerId: "nvidia" },
        { id: "qwen/qwen2.5-32b-instruct", name: "Qwen 2.5 32B Instruct", providerId: "nvidia" },
        { id: "meta/llama-3.1-405b-instruct", name: "Llama 3.1 405B Instruct", providerId: "nvidia" },
        { id: "meta/llama-3.1-70b-instruct", name: "Llama 3.1 70B Instruct", providerId: "nvidia" },
        { id: "meta/llama-3.1-8b-instruct", name: "Llama 3.1 8B Instruct", providerId: "nvidia" },
      ],
      enabled: false,
    },
    {
      id: "groq",
      name: "Groq",
      type: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      models: getDefaultModels("groq").map((id) => ({
        id,
        name: id,
        providerId: "groq",
      })),
      enabled: false,
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
