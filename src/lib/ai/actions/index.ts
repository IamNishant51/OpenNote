import { generateText } from "ai";
import type { AIActionRequest, AIActionResponse } from "@/types/ai";
import { getActionConfig } from "@/lib/ai/action-configs";
import { createProviderModel } from "@/lib/ai/provider-registry";
import { useAIStore } from "@/stores/ai";

function buildPrompt(action: AIActionRequest, config: { systemPrompt: string; userPromptTemplate: string }): { system: string; user: string } {
  let input = action.selectedText || action.fullDocument || "";
  let userPrompt = config.userPromptTemplate
    .replace("{input}", input)
    .replace("{targetLanguage}", action.targetLanguage || "English")
    .replace("{tone}", action.tone || "professional");

  if (!action.selectedText && !action.fullDocument) {
    input = "Write about anything you'd like.";
    userPrompt = config.userPromptTemplate.replace("{input}", input);
  }

  return { system: config.systemPrompt, user: userPrompt };
}

export async function runAIAction(action: AIActionRequest): Promise<AIActionResponse> {
  const config = getActionConfig(action.action);
  if (!config) {
    return { text: "", error: `Unknown action: ${action.action}` };
  }

  const store = useAIStore.getState();
  const provider = store.providers.find((p) => p.id === action.providerId);
  if (!provider) {
    return { text: "", error: `Provider "${action.providerId}" not found` };
  }

  const model = await createProviderModel(provider, action.modelId);
  if (!model) {
    return { text: "", error: `Failed to create model "${action.modelId}" for provider "${provider.name}"` };
  }

  const { system, user } = buildPrompt(action, config);

  try {
    const result = await (generateText as any)({
      model,
      system,
      prompt: user,
    });

    const text = result.text || result.steps?.[0]?.text || "";
    if (!text) {
      return { text: "", error: "AI returned empty response" };
    }

    return { text };
  } catch (e) {
    const message = e instanceof Error ? e.message : "AI action failed";
    return { text: "", error: message };
  }
}
