export type ProviderType = "openai" | "anthropic" | "google" | "mistral" | "deepseek" | "ollama" | "lmstudio" | "nvidia" | "groq" | "custom";

export interface AIProvider {
  id: string;
  name: string;
  type: ProviderType;
  baseUrl?: string;
  apiKey?: string;
  models: AIModel[];
  enabled: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  providerId: string;
  maxTokens?: number;
}

export type AIActionType =
  | "write"
  | "continue"
  | "summarize"
  | "translate"
  | "explain"
  | "improve"
  | "fix-spelling"
  | "change-tone"
  | "simplify"
  | "expand"
  | "shorten"
  | "brainstorm"
  | "find-actions";

export interface AIActionConfig {
  type: AIActionType;
  label: string;
  icon: string;
  systemPrompt: string;
  userPromptTemplate: string;
  requiresSelection: boolean;
}

export interface AIActionRequest {
  action: AIActionType;
  selectedText: string;
  fullDocument: string;
  modelId: string;
  providerId: string;
  tone?: string;
  targetLanguage?: string;
}

export interface AIActionResponse {
  text: string;
  error?: string;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface CustomAgent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  modelId?: string;
  temperature?: number;
  createdAt?: string;
}
