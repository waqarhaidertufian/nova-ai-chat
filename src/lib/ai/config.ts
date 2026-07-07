/**
 * Central configuration: environment variables, model registry, and fallback order.
 */

import dotenv from "dotenv";
import path from "path";

// Load .env.local first (Next.js convention), then .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

/** Provider ids used internally by the router. */
export type ProviderId = "gemini" | "openai" | "anthropic" | "deepseek";

export interface ModelDefinition {
  /** Frontend model id (e.g. "gpt5", "gemini"). */
  id: string;
  /** Display name shown in API responses. */
  displayName: string;
  providerId: ProviderId;
  /** Actual model string sent to the provider API. */
  apiModel: string;
}

/** API keys — never hardcode; read from environment only. */
export const env = {
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  deepseekApiKey: process.env.DEEPSEEK_API_KEY ?? "",
};

/**
 * Maps frontend model selector ids → provider + API model.
 * Extend this table when adding new models (Gemini Pro, Claude Opus, etc.).
 */
export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  gemini: {
    id: "gemini",
    displayName: "Nova Flash",
    providerId: "gemini",
    apiModel: "gemini-2.5-flash",
  },
  "gemini-pro": {
    id: "gemini-pro",
    displayName: "Gemini Pro",
    providerId: "gemini",
    apiModel: "gemini-2.5-flash",
  },
  gpt5: {
    id: "gpt5",
    displayName: "GPT-5 Omni",
    providerId: "openai",
    apiModel: "gpt-4o",
  },
  gpt4: {
    id: "gpt4",
    displayName: "GPT-4 Turbo",
    providerId: "openai",
    apiModel: "gpt-4-turbo",
  },
  claude: {
    id: "claude",
    displayName: "Claude 3.5 Sonnet",
    providerId: "anthropic",
    apiModel: "claude-3-5-sonnet-20241022",
  },
  "claude-opus": {
    id: "claude-opus",
    displayName: "Claude Opus",
    providerId: "anthropic",
    apiModel: "claude-3-opus-20240229",
  },
  deepseek: {
    id: "deepseek",
    displayName: "DeepSeek R1",
    providerId: "deepseek",
    apiModel: "deepseek-reasoner",
  },
  "deepseek-chat": {
    id: "deepseek-chat",
    displayName: "DeepSeek Chat",
    providerId: "deepseek",
    apiModel: "deepseek-chat",
  },
  // UI-only models without dedicated providers — router uses fallback chain
  llama: {
    id: "llama",
    displayName: "Llama 3.3 70B",
    providerId: "gemini",
    apiModel: "gemini-2.5-flash",
  },
  mistral: {
    id: "mistral",
    displayName: "Mistral Large 2",
    providerId: "gemini",
    apiModel: "gemini-2.5-flash",
  },
  qwen: {
    id: "qwen",
    displayName: "Qwen 2.5 Max",
    providerId: "gemini",
    apiModel: "gemini-2.5-flash",
  },
};

/**
 * Fixed fallback order when the primary provider fails with a retryable error.
 * Gemini → OpenAI → Claude → DeepSeek
 */
export const FALLBACK_ORDER: ProviderId[] = [
  "gemini",
  "openai",
  "anthropic",
  "deepseek",
];

/** Default model when none is specified. */
export const DEFAULT_MODEL_ID = "gemini";

/** Request timeout per provider attempt (ms). */
export const PROVIDER_TIMEOUT_MS = 15_000;

export function resolveModel(modelId?: string): ModelDefinition {
  const key = (modelId ?? DEFAULT_MODEL_ID).toLowerCase();
  return MODEL_REGISTRY[key] ?? MODEL_REGISTRY[DEFAULT_MODEL_ID];
}

export interface KeyValidationResult {
  providerId: ProviderId;
  configured: boolean;
  valid: boolean;
  warning?: string;
}

export function validateApiKeys(): KeyValidationResult[] {
  const results: KeyValidationResult[] = [];

  // Gemini
  const geminiKey = env.geminiApiKey;
  const isGeminiConfigured = Boolean(geminiKey && geminiKey !== "YOUR_GEMINI_API_KEY");
  let isGeminiValid = isGeminiConfigured;
  let geminiWarning: string | undefined;
  if (isGeminiConfigured) {
    if (geminiKey.length < 10) {
      isGeminiValid = false;
      geminiWarning = "Key is too short to be a valid Gemini API key.";
    }
  }
  results.push({ providerId: "gemini", configured: isGeminiConfigured, valid: isGeminiValid, warning: geminiWarning });

  // OpenAI
  const openaiKey = env.openaiApiKey;
  const isOpenaiConfigured = Boolean(openaiKey && openaiKey !== "YOUR_OPENAI_API_KEY");
  let isOpenaiValid = isOpenaiConfigured;
  let openaiWarning: string | undefined;
  if (isOpenaiConfigured) {
    if (!openaiKey.startsWith("sk-")) {
      isOpenaiValid = false;
      openaiWarning = "OpenAI key should start with 'sk-'.";
    }
  }
  results.push({ providerId: "openai", configured: isOpenaiConfigured, valid: isOpenaiValid, warning: openaiWarning });

  // Anthropic
  const anthropicKey = env.anthropicApiKey;
  const isAnthropicConfigured = Boolean(anthropicKey && anthropicKey !== "YOUR_ANTHROPIC_API_KEY");
  let isAnthropicValid = isAnthropicConfigured;
  let anthropicWarning: string | undefined;
  if (isAnthropicConfigured) {
    if (!anthropicKey.startsWith("sk-ant-")) {
      isAnthropicValid = false;
      anthropicWarning = "Anthropic key should start with 'sk-ant-'.";
    }
  }
  results.push({ providerId: "anthropic", configured: isAnthropicConfigured, valid: isAnthropicValid, warning: anthropicWarning });

  // DeepSeek
  const deepseekKey = env.deepseekApiKey;
  const isDeepseekConfigured = Boolean(deepseekKey && deepseekKey !== "YOUR_DEEPSEEK_API_KEY");
  let isDeepseekValid = isDeepseekConfigured;
  let deepseekWarning: string | undefined;
  if (isDeepseekConfigured) {
    if (!deepseekKey.startsWith("sk-")) {
      isDeepseekValid = false;
      deepseekWarning = "DeepSeek key should start with 'sk-'.";
    }
  }
  results.push({ providerId: "deepseek", configured: isDeepseekConfigured, valid: isDeepseekValid, warning: deepseekWarning });

  return results;
}

export function isProviderConfigured(providerId: ProviderId): boolean {
  const validation = validateApiKeys().find(r => r.providerId === providerId);
  return Boolean(validation?.configured && validation?.valid);
}

