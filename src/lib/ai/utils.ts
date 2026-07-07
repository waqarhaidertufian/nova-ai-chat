/**
 * Shared utilities: error classification, token estimation, fetch helpers.
 */

import { TokenUsage } from "./types.js";
import { PROVIDER_TIMEOUT_MS } from "./config.js";

/** Structured error thrown by providers; router uses `retryable` for fallback decisions. */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly code?: string,
    public readonly retryable = false
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

const RETRYABLE_PATTERNS = [
  /rate limit/i,
  /too many requests/i,
  /overloaded/i,
  /timeout/i,
  /network/i,
  /econnreset/i,
  /enotfound/i,
  /fetch failed/i,
  /service unavailable/i,
];

const BILLING_QUOTA_PATTERNS = [
  /credit balance/i,
  /insufficient balance/i,
  /insufficient quota/i,
  /insufficient_quota/i,
  /billing/i,
  /payment required/i,
  /quota exceeded/i,
  /limit: 0/i,
];

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isQuotaOrBillingError(error: unknown): boolean {
  if (error instanceof AIProviderError) {
    if (error.statusCode === 402) return true;
    if (error.code === "BILLING_ERROR" || error.code === "INSUFFICIENT_QUOTA") return true;
    const msg = error.message;
    return BILLING_QUOTA_PATTERNS.some((p) => p.test(msg));
  }
  if (error instanceof Error) {
    const msg = error.message;
    return BILLING_QUOTA_PATTERNS.some((p) => p.test(msg));
  }
  return false;
}

/**
 * Determines whether the router should attempt the next provider in the fallback chain.
 */
export function isRetryableError(error: unknown): boolean {
  if (isQuotaOrBillingError(error)) {
    return false;
  }
  if (error instanceof AIProviderError) {
    return error.retryable;
  }
  if (error instanceof Error) {
    const msg = error.message;
    if (error.name === "AbortError" || /timeout/i.test(msg)) return true;
    return RETRYABLE_PATTERNS.some((p) => p.test(msg));
  }
  return false;
}

/**
 * Parses upstream HTTP errors into AIProviderError with correct retryable flag.
 */
export function parseHttpError(
  status: number,
  body: string,
  providerName: string
): AIProviderError {
  let message = `${providerName} API error (${status})`;
  let isInsufficientQuota = false;
  try {
    const parsed = JSON.parse(body);
    message =
      parsed?.error?.message ??
      parsed?.message ??
      parsed?.error ??
      message;
      
    if (parsed?.error?.code === "insufficient_quota" || parsed?.error?.type === "insufficient_quota") {
      isInsufficientQuota = true;
    }
  } catch {
    if (body) message = body.slice(0, 500);
  }

  const isBillingOrQuota = isInsufficientQuota || status === 402 || BILLING_QUOTA_PATTERNS.some((p) => p.test(message));

  const retryable =
    !isBillingOrQuota &&
    (RETRYABLE_STATUS.has(status) ||
      (status === 400 && RETRYABLE_PATTERNS.some((p) => p.test(message))) ||
      RETRYABLE_PATTERNS.some((p) => p.test(message)));

  const code =
    status === 401
      ? "UNAUTHORIZED"
      : status === 402 || isBillingOrQuota
        ? "BILLING_ERROR"
        : status === 403
          ? "FORBIDDEN"
          : status === 404
            ? "NOT_FOUND"
            : status === 429
              ? "RATE_LIMIT"
              : status >= 500
                ? "SERVER_ERROR"
                : "API_ERROR";

  return new AIProviderError(message, status, code, retryable);
}

/** Wraps fetch with an abort timeout. */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = PROVIDER_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIProviderError(
        `Request timed out after ${timeoutMs}ms`,
        408,
        "TIMEOUT",
        true
      );
    }
    throw new AIProviderError(
      err instanceof Error ? err.message : "Network failure",
      undefined,
      "NETWORK_ERROR",
      true
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Estimate tokens when the provider omits usage metadata (~4 chars per token). */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function buildUsage(
  promptText: string,
  completionText: string,
  reported?: Partial<TokenUsage>
): TokenUsage {
  const promptTokens =
    reported?.promptTokens ?? estimateTokens(promptText);
  const completionTokens =
    reported?.completionTokens ?? estimateTokens(completionText);
  return {
    promptTokens,
    completionTokens,
    totalTokens:
      reported?.totalTokens ?? promptTokens + completionTokens,
  };
}

export function messagesToPromptText(
  messages: { role: string; content: string }[],
  systemInstruction?: string
): string {
  const parts = messages.map((m) => m.content);
  if (systemInstruction) parts.unshift(systemInstruction);
  return parts.join("\n");
}

/** Maps provider id to display name for API responses. */
export function providerDisplayName(providerId: string): string {
  const map: Record<string, string> = {
    gemini: "Google Gemini",
    openai: "OpenAI",
    anthropic: "Anthropic",
    deepseek: "DeepSeek",
  };
  return map[providerId] ?? providerId;
}
