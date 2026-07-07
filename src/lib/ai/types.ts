/**
 * Shared AI Router type definitions.
 * Every provider implements AIProvider so the router can treat them uniformly.
 */

export type MessageRole = "user" | "assistant" | "system";

/** A single chat turn passed to any provider. */
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

/** Optional file attachment (Gemini multimodal). */
export interface FileAttachmentData {
  mimeType?: string;
  data?: string;
}

/** Options forwarded from the API route to providers. */
export interface AIProviderOptions {
  /** Provider-specific model id (e.g. gpt-4o, gemini-2.5-flash). */
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemInstruction?: string;
  fileData?: FileAttachmentData;
}

/** Token usage returned with every response. */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Non-streaming response envelope. */
export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  usage: TokenUsage;
  latencyMs: number;
  /** True when a fallback provider answered after the primary failed. */
  fallbackUsed?: boolean;
  attemptedProviders?: string[];
  selectedProvider?: string;
  actualProvider?: string;
}

/** One chunk emitted during streaming. */
export interface AIStreamChunk {
  content: string;
  done?: boolean;
  provider?: string;
  model?: string;
  usage?: TokenUsage;
  latencyMs?: number;
  fallbackUsed?: boolean;
  attemptedProviders?: string[];
}

/**
 * Contract every AI provider must satisfy.
 * Add new providers (Grok, Mistral, Ollama…) by implementing this interface.
 */
export interface AIProvider {
  /** Human-readable provider label returned to the client. */
  readonly name: string;
  /** Internal id used for routing and fallback (e.g. "openai"). */
  readonly id: string;
  /** Whether an API key is configured for this provider. */
  isAvailable(): boolean;
  generateResponse(
    messages: ChatMessage[],
    options: AIProviderOptions
  ): Promise<AIResponse>;
  streamResponse(
    messages: ChatMessage[],
    options: AIProviderOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown>;
}

/** Incoming POST /api/chat body. */
export interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  systemInstruction?: string;
  fileData?: FileAttachmentData;
}

/** Outgoing JSON response (non-streaming). */
export interface ChatResponseBody {
  provider: string;
  model: string;
  content: string;
  /** Legacy field kept for existing UI compatibility. */
  response: string;
  selectedProvider?: string;
  actualProvider?: string;
  fallbackUsed?: boolean;
  fallbackMessage?: string;
  stats: {
    responseTimeMs: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    provider: string;
    model: string;
    fallbackUsed?: boolean;
    attemptedProviders?: string[];
  };
}
