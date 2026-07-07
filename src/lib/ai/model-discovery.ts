import type { AIModel, AIProvider } from "@/types/ai";

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
}

interface LMStudioModel {
  id: string;
  object: string;
}

export async function discoverOllamaModels(): Promise<AIModel[]> {
  try {
    const res = await fetch("http://localhost:11434/api/tags", {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m: OllamaModel) => ({
      id: m.name,
      name: m.name.replaceAll(":latest", ""),
      providerId: "ollama",
    }));
  } catch {
    return [];
  }
}

export async function discoverLMStudioModels(): Promise<AIModel[]> {
  try {
    const res = await fetch("http://localhost:1234/v1/models", {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((m: LMStudioModel) => ({
      id: m.id,
      name: m.id,
      providerId: "lmstudio",
    }));
  } catch {
    return [];
  }
}

export async function discoverLocalModels(): Promise<AIModel[]> {
  const [ollama, lmstudio] = await Promise.all([
    discoverOllamaModels(),
    discoverLMStudioModels(),
  ]);
  return [...ollama, ...lmstudio];
}
