/**
 * OpenAI provider — ChatGPT models via the OpenAI Chat Completions API.
 */

import {
  AIProvider,
  AIProviderOptions,
  AIResponse,
  AIStreamChunk,
  ChatMessage,
} from "../types.js";
import { env, isProviderConfigured } from "../config.js";
import {
  AIProviderError,
  buildUsage,
  fetchWithTimeout,
  messagesToPromptText,
  parseHttpError,
  providerDisplayName,
} from "../utils.js";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

function toOpenAIMessages(
  messages: ChatMessage[],
  systemInstruction?: string
): Array<{ role: string; content: string }> {
  const result: Array<{ role: string; content: string }> = [];
  if (systemInstruction) {
    result.push({ role: "system", content: systemInstruction });
  }
  for (const msg of messages) {
    result.push({ role: msg.role, content: msg.content });
  }
  return result;
}

export class OpenAIProvider implements AIProvider {
  readonly name = providerDisplayName("openai");
  readonly id = "openai";

  isAvailable(): boolean {
    return isProviderConfigured("openai");
  }

  private ensureKey(): void {
    if (!env.openaiApiKey) {
      throw new AIProviderError(
        "OPENAI_API_KEY is not configured",
        401,
        "MISSING_KEY",
        false
      );
    }
  }

  async generateResponse(
    messages: ChatMessage[],
    options: AIProviderOptions
  ): Promise<AIResponse> {
    this.ensureKey();
    const start = Date.now();

    const body = {
      model: options.model,
      messages: toOpenAIMessages(messages, options.systemInstruction),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      ...(options.topP !== undefined ? { top_p: options.topP } : {}),
      stream: false,
    };

    console.log(`[OpenAI] Request:`, {
      model: options.model,
      messageCount: messages.length,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
      topP: body.top_p,
      hasSystemInstruction: !!options.systemInstruction,
    });

    const response = await fetchWithTimeout(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = await response.text();
    console.log(`[OpenAI] Response Status:`, response.status);
    
    if (!response.ok) {
      console.error(`[OpenAI] Error Response:`, raw);
      throw parseHttpError(response.status, raw, this.name);
    }

    const data = JSON.parse(raw);
    const content: string =
      data.choices?.[0]?.message?.content ?? "No response generated.";

    const promptText = messagesToPromptText(
      messages,
      options.systemInstruction
    );
    const usage = data.usage
      ? {
          promptTokens: data.usage.prompt_tokens ?? 0,
          completionTokens: data.usage.completion_tokens ?? 0,
          totalTokens: data.usage.total_tokens ?? 0,
        }
      : undefined;

    const latencyMs = Date.now() - start;
    console.log(`[OpenAI] Success:`, {
      contentLength: content.length,
      latencyMs,
      usage,
    });

    return {
      content,
      provider: this.name,
      model: options.model,
      usage: buildUsage(promptText, content, usage),
      latencyMs,
    };
  }

  async *streamResponse(
    messages: ChatMessage[],
    options: AIProviderOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    this.ensureKey();
    const start = Date.now();

    const body = {
      model: options.model,
      messages: toOpenAIMessages(messages, options.systemInstruction),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
      ...(options.topP !== undefined ? { top_p: options.topP } : {}),
      stream: true,
      stream_options: { include_usage: true },
    };

    console.log(`[OpenAI] Stream Request:`, {
      model: options.model,
      messageCount: messages.length,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
      topP: body.top_p,
      hasSystemInstruction: !!options.systemInstruction,
    });

    const response = await fetchWithTimeout(OPENAI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log(`[OpenAI] Stream Response Status:`, response.status);

    if (!response.ok) {
      const raw = await response.text();
      console.error(`[OpenAI] Stream Error Response:`, raw);
      throw parseHttpError(response.status, raw, this.name);
    }

    if (!response.body) {
      throw new AIProviderError("Empty stream body", 500, "STREAM_ERROR", true);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let usage: AIResponse["usage"] | undefined;
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload);
          const delta = parsed.choices?.[0]?.delta?.content ?? "";
          if (delta) {
            fullText += delta;
            chunkCount++;
            yield { content: delta };
          }
          if (parsed.usage) {
            usage = {
              promptTokens: parsed.usage.prompt_tokens ?? 0,
              completionTokens: parsed.usage.completion_tokens ?? 0,
              totalTokens: parsed.usage.total_tokens ?? 0,
            };
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    const promptText = messagesToPromptText(messages, options.systemInstruction);
    const latencyMs = Date.now() - start;
    console.log(`[OpenAI] Stream Success:`, {
      contentLength: fullText.length,
      chunkCount,
      latencyMs,
      usage,
    });

    yield {
      content: "",
      done: true,
      provider: this.name,
      model: options.model,
      usage: buildUsage(promptText, fullText, usage),
      latencyMs,
    };
  }
}

export const openaiProvider = new OpenAIProvider();
