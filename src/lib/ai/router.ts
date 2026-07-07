/**
 * AI Router — selects the correct provider, handles fallback, and exposes
 * a single generate/stream interface to the API layer.
 */

import {
  AIProvider,
  AIProviderOptions,
  AIResponse,
  AIStreamChunk,
  ChatMessage,
} from "./types.js";
import {
  FALLBACK_ORDER,
  ModelDefinition,
  ProviderId,
  isProviderConfigured,
  resolveModel,
} from "./config.js";
import { 
  AIProviderError, 
  isRetryableError, 
  isQuotaOrBillingError, 
  wait 
} from "./utils.js";
import { geminiProvider } from "./providers/gemini.js";
import { openaiProvider } from "./providers/openai.js";
import { claudeProvider } from "./providers/claude.js";
import { deepseekProvider } from "./providers/deepseek.js";

/** Registry of all providers — inject new providers here to extend the router. */
const PROVIDER_MAP: Record<ProviderId, AIProvider> = {
  gemini: geminiProvider,
  openai: openaiProvider,
  anthropic: claudeProvider,
  deepseek: deepseekProvider,
};

export interface RouterRequest {
  messages: ChatMessage[];
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemInstruction?: string;
  fileData?: { mimeType?: string; data?: string };
}

export interface RouterResult extends AIResponse {
  displayModel: string;
}

export interface ProviderMetrics {
  providerName: string;
  modelName: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: number;
  avgResponseTimeMs: number;
  totalTokensUsed: number;
  lastErrorType?: string;
  consecutiveFailures: number;
}

/** Provider health status cache */
const providerHealth: Record<ProviderId, { healthy: boolean; unhealthyUntil: number }> = {
  gemini: { healthy: true, unhealthyUntil: 0 },
  openai: { healthy: true, unhealthyUntil: 0 },
  anthropic: { healthy: true, unhealthyUntil: 0 },
  deepseek: { healthy: true, unhealthyUntil: 0 },
};

/** Provider metrics registry */
const providerMetrics: Record<ProviderId, ProviderMetrics> = {
  gemini: { providerName: "Google Gemini", modelName: "gemini-2.5-flash", totalCalls: 0, successfulCalls: 0, failedCalls: 0, successRate: 1.0, avgResponseTimeMs: 0, totalTokensUsed: 0, consecutiveFailures: 0 },
  openai: { providerName: "OpenAI", modelName: "gpt-4o", totalCalls: 0, successfulCalls: 0, failedCalls: 0, successRate: 1.0, avgResponseTimeMs: 0, totalTokensUsed: 0, consecutiveFailures: 0 },
  anthropic: { providerName: "Anthropic", modelName: "claude-3-5-sonnet-20241022", totalCalls: 0, successfulCalls: 0, failedCalls: 0, successRate: 1.0, avgResponseTimeMs: 0, totalTokensUsed: 0, consecutiveFailures: 0 },
  deepseek: { providerName: "DeepSeek", modelName: "deepseek-chat", totalCalls: 0, successfulCalls: 0, failedCalls: 0, successRate: 1.0, avgResponseTimeMs: 0, totalTokensUsed: 0, consecutiveFailures: 0 },
};

function isProviderHealthy(providerId: ProviderId): boolean {
  const health = providerHealth[providerId];
  if (!health) return true;
  if (!health.healthy && Date.now() < health.unhealthyUntil) {
    return false;
  }
  return true;
}

function buildProviderOptions(
  modelDef: ModelDefinition,
  req: RouterRequest
): AIProviderOptions {
  return {
    model: modelDef.apiModel,
    temperature: req.temperature,
    maxTokens: req.maxTokens,
    topP: req.topP,
    systemInstruction: req.systemInstruction,
    fileData: req.fileData,
  };
}

/** Builds ordered provider attempt list: healthy primary/fallbacks first, then unhealthy as last resort. */
function buildAttemptOrder(primaryProviderId: ProviderId): ProviderId[] {
  const healthyOrder: ProviderId[] = [];
  const unhealthyOrder: ProviderId[] = [];
  const seen = new Set<ProviderId>();

  const add = (id: ProviderId) => {
    if (!seen.has(id) && isProviderConfigured(id)) {
      seen.add(id);
      if (isProviderHealthy(id)) {
        healthyOrder.push(id);
      } else {
        unhealthyOrder.push(id);
      }
    }
  };

  add(primaryProviderId);
  for (const id of FALLBACK_ORDER) {
    add(id);
  }

  return [...healthyOrder, ...unhealthyOrder];
}

function getProviderForAttempt(
  providerId: ProviderId,
  originalModel: ModelDefinition
): { provider: AIProvider; modelDef: ModelDefinition } {
  const provider = PROVIDER_MAP[providerId];
  if (!provider) {
    throw new AIProviderError(
      `Unknown provider: ${providerId}`,
      500,
      "UNKNOWN_PROVIDER",
      false
    );
  }

  // When falling back, use each provider's default model for that family
  if (providerId !== originalModel.providerId) {
    const fallbackModel =
      providerId === "gemini"
        ? resolveModel("gemini")
        : providerId === "openai"
          ? resolveModel("gpt5")
          : providerId === "anthropic"
            ? resolveModel("claude")
            : resolveModel("deepseek");
    return { provider, modelDef: fallbackModel };
  }

  return { provider, modelDef: originalModel };
}

export class AIRouter {
  constructor(private readonly providers: Record<ProviderId, AIProvider> = PROVIDER_MAP) {}

  /**
   * Non-streaming chat completion with automatic provider fallback and exponential retries.
   */
  async generate(req: RouterRequest): Promise<RouterResult> {
    const modelDef = resolveModel(req.modelId);
    const attemptOrder = buildAttemptOrder(modelDef.providerId);
    const attemptedProviders: string[] = [];
    let lastError: unknown;
    const selectedProvider = PROVIDER_MAP[modelDef.providerId]?.name || modelDef.providerId;

    console.log(`[Router] Selected Provider: ${selectedProvider} | Attempt Order: ${attemptOrder.join(" -> ")}`);

    if (attemptOrder.length === 0) {
      throw new AIProviderError(
        "No AI providers are configured. Add API keys to .env.local",
        503,
        "NO_PROVIDERS",
        false
      );
    }

    const maxAttempts = 2; // 1 initial attempt + 1 retry

    for (let i = 0; i < attemptOrder.length; i++) {
      const providerId = attemptOrder[i];
      const { provider, modelDef: activeModel } = getProviderForAttempt(
        providerId,
        modelDef
      );
      attemptedProviders.push(provider.name);

      if (i > 0) {
        console.log(`[Router] Falling back. Trying ${provider.name} (Model: ${activeModel.apiModel})...`);
      }

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const start = Date.now();
        const metrics = providerMetrics[providerId];
        try {
          const options = buildProviderOptions(activeModel, req);
          const result = await provider.generateResponse(req.messages, options);
          const latencyMs = Date.now() - start;

          // Update metrics on success
          metrics.totalCalls++;
          metrics.successfulCalls++;
          metrics.consecutiveFailures = 0;
          metrics.successRate = metrics.successfulCalls / metrics.totalCalls;
          metrics.totalTokensUsed += result.usage.totalTokens;
          metrics.avgResponseTimeMs = metrics.avgResponseTimeMs === 0 
            ? latencyMs 
            : (metrics.avgResponseTimeMs * (metrics.successfulCalls - 1) + latencyMs) / metrics.successfulCalls;
          metrics.modelName = activeModel.apiModel;

          // Success: reset provider health
          providerHealth[providerId] = { healthy: true, unhealthyUntil: 0 };

          console.log(`[Router] Success: Provider=${provider.name} | Model=${activeModel.apiModel} | Attempt=${attempt + 1}/${maxAttempts} | Latency=${latencyMs}ms | InputTokens=${result.usage.promptTokens} | OutputTokens=${result.usage.completionTokens}`);

          return {
            ...result,
            displayModel: modelDef.displayName,
            model: activeModel.apiModel,
            fallbackUsed: providerId !== modelDef.providerId || i > 0,
            attemptedProviders,
            selectedProvider,
            actualProvider: provider.name,
          };
        } catch (err) {
          lastError = err;
          const latencyMs = Date.now() - start;
          const errorMsg = err instanceof Error ? err.message : String(err);
          const isRetryable = isRetryableError(err);
          const isBilling = isQuotaOrBillingError(err);

          // Update metrics on failure
          metrics.totalCalls++;
          metrics.failedCalls++;
          metrics.consecutiveFailures++;
          metrics.successRate = metrics.successfulCalls / metrics.totalCalls;
          metrics.lastErrorType = err instanceof AIProviderError ? err.code : "UNKNOWN_ERROR";
          metrics.modelName = activeModel.apiModel;

          console.warn(`[Router] Failed: Provider=${provider.name} | Model=${activeModel.apiModel} | Attempt=${attempt + 1}/${maxAttempts} | Latency=${latencyMs}ms | Retryable=${isRetryable} | Billing/Quota=${isBilling} | Error=${errorMsg}`);

          // Repeated failures: mark unhealthy
          if (metrics.consecutiveFailures >= 2) {
            providerHealth[providerId] = { healthy: false, unhealthyUntil: Date.now() + 60_000 };
            console.warn(`[Router] Provider ${provider.name} repeatedly failed. Marking unhealthy for 60s.`);
          }

          // If the error is not retryable or it's the last attempt on this provider
          if (!isRetryable || attempt === maxAttempts - 1) {
            // Also mark unhealthy for safety to bypass on next calls
            providerHealth[providerId] = { healthy: false, unhealthyUntil: Date.now() + 60_000 };
            break; // Break retry loop, try next provider
          }

          // Exponential backoff delay
          const delay = 300 * Math.pow(2, attempt);
          console.log(`[Router] Retrying ${provider.name} in ${delay}ms...`);
          await wait(delay);
        }
      }
    }

    console.error(`[Router] All providers failed. Last Error:`, lastError);
    if (lastError instanceof AIProviderError) throw lastError;
    throw new AIProviderError(
      lastError instanceof Error ? lastError.message : "All providers failed",
      503,
      "ALL_PROVIDERS_FAILED",
      false
    );
  }

  /**
   * Streaming chat completion with fallback before the first byte is sent.
   */
  async *stream(req: RouterRequest): AsyncGenerator<AIStreamChunk, void, unknown> {
    const modelDef = resolveModel(req.modelId);
    const attemptOrder = buildAttemptOrder(modelDef.providerId);
    const attemptedProviders: string[] = [];
    let lastError: unknown;
    const selectedProvider = PROVIDER_MAP[modelDef.providerId]?.name || modelDef.providerId;

    console.log(`[Router] Stream Selected Provider: ${selectedProvider} | Attempt Order: ${attemptOrder.join(" -> ")}`);

    if (attemptOrder.length === 0) {
      throw new AIProviderError(
        "No AI providers are configured. Add API keys to .env.local",
        503,
        "NO_PROVIDERS",
        false
      );
    }

    const maxAttempts = 2; // 1 initial attempt + 1 retry

    for (let i = 0; i < attemptOrder.length; i++) {
      const providerId = attemptOrder[i];
      const { provider, modelDef: activeModel } = getProviderForAttempt(
        providerId,
        modelDef
      );
      attemptedProviders.push(provider.name);

      if (i > 0) {
        console.log(`[Router] Stream falling back. Trying ${provider.name} (Model: ${activeModel.apiModel})...`);
      }

      let started = false;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const start = Date.now();
        const metrics = providerMetrics[providerId];
        try {
          const options = buildProviderOptions(activeModel, req);
          const generator = provider.streamResponse(req.messages, options);

          for await (const chunk of generator) {
            started = true;
            if (chunk.done) {
              const latencyMs = Date.now() - start;
              console.log(`[Router] Stream Success: Provider=${provider.name} | Model=${activeModel.apiModel} | Attempt=${attempt + 1}/${maxAttempts} | Latency=${latencyMs}ms | InputTokens=${chunk.usage?.promptTokens} | OutputTokens=${chunk.usage?.completionTokens}`);
              
              // Update metrics on success
              metrics.totalCalls++;
              metrics.successfulCalls++;
              metrics.consecutiveFailures = 0;
              metrics.successRate = metrics.successfulCalls / metrics.totalCalls;
              if (chunk.usage) metrics.totalTokensUsed += chunk.usage.totalTokens;
              metrics.avgResponseTimeMs = metrics.avgResponseTimeMs === 0 
                ? latencyMs 
                : (metrics.avgResponseTimeMs * (metrics.successfulCalls - 1) + latencyMs) / metrics.successfulCalls;
              metrics.modelName = activeModel.apiModel;

              // Success: reset provider health
              providerHealth[providerId] = { healthy: true, unhealthyUntil: 0 };

              yield {
                ...chunk,
                provider: chunk.provider ?? provider.name,
                model: chunk.model ?? activeModel.apiModel,
                fallbackUsed: providerId !== modelDef.providerId || i > 0,
                attemptedProviders,
                selectedProvider,
                actualProvider: provider.name,
              };
            } else {
              yield chunk;
            }
          }

          if (started) return;
        } catch (err) {
          if (started) {
            // Already sent bytes to user, cannot retry or fall back safely
            console.error(`[Router] Stream failed mid-stream on ${provider.name}. Error:`, err);
            throw err;
          }

          lastError = err;
          const latencyMs = Date.now() - start;
          const errorMsg = err instanceof Error ? err.message : String(err);
          const isRetryable = isRetryableError(err);
          const isBilling = isQuotaOrBillingError(err);

          // Update metrics on failure
          metrics.totalCalls++;
          metrics.failedCalls++;
          metrics.consecutiveFailures++;
          metrics.successRate = metrics.successfulCalls / metrics.totalCalls;
          metrics.lastErrorType = err instanceof AIProviderError ? err.code : "UNKNOWN_ERROR";
          metrics.modelName = activeModel.apiModel;

          console.warn(`[Router] Stream Failed: Provider=${provider.name} | Model=${activeModel.apiModel} | Attempt=${attempt + 1}/${maxAttempts} | Latency=${latencyMs}ms | Retryable=${isRetryable} | Billing/Quota=${isBilling} | Error=${errorMsg}`);

          // Repeated failures: mark unhealthy
          if (metrics.consecutiveFailures >= 2) {
            providerHealth[providerId] = { healthy: false, unhealthyUntil: Date.now() + 60_000 };
            console.warn(`[Router] Provider ${provider.name} repeatedly failed streaming. Marking unhealthy for 60s.`);
          }

          if (!isRetryable || attempt === maxAttempts - 1) {
            // Mark unhealthy for safety
            providerHealth[providerId] = { healthy: false, unhealthyUntil: Date.now() + 60_000 };
            break; // Try next provider
          }

          const delay = 300 * Math.pow(2, attempt);
          console.log(`[Router] Stream retrying ${provider.name} in ${delay}ms...`);
          await wait(delay);
        }
      }
    }

    console.error(`[Router] All stream attempts failed. Last Error:`, lastError);
    if (lastError instanceof AIProviderError) throw lastError;
    throw new AIProviderError(
      lastError instanceof Error ? lastError.message : "All stream providers failed",
      503,
      "ALL_PROVIDERS_FAILED",
      false
    );
  }

  /**
   * Health checks all configured providers independently.
   * Returns a map of provider ID to health check status and exact error if failed.
   */
  async runDiagnostics(): Promise<any> {
    const results: any = {};
    for (const key of Object.keys(PROVIDER_MAP) as ProviderId[]) {
      const provider = PROVIDER_MAP[key];
      const configured = isProviderConfigured(key);
      if (!configured) {
        results[key] = { configured: false, healthy: false, error: "Not configured", metrics: providerMetrics[key] };
        continue;
      }

      try {
        const testModel = key === "gemini" 
          ? "gemini-2.5-flash" 
          : key === "openai" 
            ? "gpt-4o-mini" 
            : key === "anthropic" 
              ? "claude-3-5-sonnet-20241022" 
              : "deepseek-chat";

        const options: AIProviderOptions = {
          model: testModel,
          maxTokens: 5,
          temperature: 0.1
        };

        await provider.generateResponse([{ role: "user", content: "ping" }], options);
        results[key] = { configured: true, healthy: true, metrics: providerMetrics[key] };
        providerHealth[key] = { healthy: true, unhealthyUntil: 0 };
      } catch (err: any) {
        results[key] = { configured: true, healthy: false, error: err.message, metrics: providerMetrics[key] };
        providerHealth[key] = { healthy: false, unhealthyUntil: Date.now() + 60_000 };
      }
    }
    return results;
  }
}

/** Singleton router instance used by the API route. */
export const aiRouter = new AIRouter();

