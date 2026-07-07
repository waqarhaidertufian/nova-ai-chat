/**
 * Anthropic Claude provider — Messages API with streaming support.
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

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

function toAnthropicMessages(
  messages: ChatMessage[]
): Array<{ role: "user" | "assistant"; content: string }> {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
}

export class ClaudeProvider implements AIProvider {
  readonly name = providerDisplayName("anthropic");
  readonly id = "anthropic";

  isAvailable(): boolean {
    return isProviderConfigured("anthropic");
  }

  private ensureKey(): void {
    if (!env.anthropicApiKey) {
      throw new AIProviderError(
        "ANTHROPIC_API_KEY is not configured",
        401,
        "MISSING_KEY",
        false
      );
    }
  }

  private buildBody(
    messages: ChatMessage[],
    options: AIProviderOptions,
    stream: boolean
  ) {
    return {
      model: options.model,
      max_tokens: options.maxTokens ?? 2048,
      ...(options.systemInstruction
        ? { system: options.systemInstruction }
        : {}),
      messages: toAnthropicMessages(messages),
      ...(options.temperature !== undefined
        ? { temperature: options.temperature }
        : {}),
      ...(options.topP !== undefined ? { top_p: options.topP } : {}),
      stream,
    };
  }

  async generateResponse(
    messages: ChatMessage[],
    options: AIProviderOptions
  ): Promise<AIResponse> {
    this.ensureKey();
    const start = Date.now();

    const body = this.buildBody(messages, options, false);

    console.log(`[Claude] Request:`, {
      model: options.model,
      messageCount: messages.length,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
      topP: body.top_p,
      hasSystemInstruction: !!options.systemInstruction,
    });

    const response = await fetchWithTimeout(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": env.anthropicApiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const raw = await response.text();
    console.log(`[Claude] Response Status:`, response.status);

    if (!response.ok) {
      console.error(`[Claude] Error Response:`, raw);
      throw parseHttpError(response.status, raw, this.name);
    }

    const data = JSON.parse(raw);
    const content =
      data.content
        ?.filter((block: { type: string }) => block.type === "text")
        .map((block: { text: string }) => block.text)
        .join("") ?? "No response generated.";

    const promptText = messagesToPromptText(
      messages,
      options.systemInstruction
    );
    const usage = data.usage
      ? {
          promptTokens: data.usage.input_tokens ?? 0,
          completionTokens: data.usage.output_tokens ?? 0,
          totalTokens:
            (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
        }
      : undefined;

    const latencyMs = Date.now() - start;
    console.log(`[Claude] Success:`, {
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

    const body = this.buildBody(messages, options, true);

    console.log(`[Claude] Stream Request:`, {
      model: options.model,
      messageCount: messages.length,
      temperature: body.temperature,
      maxTokens: body.max_tokens,
      topP: body.top_p,
      hasSystemInstruction: !!options.systemInstruction,
    });

    const response = await fetchWithTimeout(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": env.anthropicApiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log(`[Claude] Stream Response Status:`, response.status);

    if (!response.ok) {
      const raw = await response.text();
      console.error(`[Claude] Stream Error Response:`, raw);
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
        if (!payload || payload === "[DONE]") continue;

        try {
          const parsed = JSON.parse(payload);
          if (
            parsed.type === "content_block_delta" &&
            parsed.delta?.type === "text_delta"
          ) {
            const delta = parsed.delta.text ?? "";
            if (delta) {
              fullText += delta;
              chunkCount++;
              yield { content: delta };
            }
          }
          if (parsed.type === "message_delta" && parsed.usage) {
            usage = {
              promptTokens: parsed.usage.input_tokens ?? 0,
              completionTokens: parsed.usage.output_tokens ?? 0,
              totalTokens:
                (parsed.usage.input_tokens ?? 0) +
                (parsed.usage.output_tokens ?? 0),
            };
          }
          if (parsed.type === "message_stop" && parsed.message?.usage) {
            usage = {
              promptTokens: parsed.message.usage.input_tokens ?? 0,
              completionTokens: parsed.message.usage.output_tokens ?? 0,
              totalTokens:
                (parsed.message.usage.input_tokens ?? 0) +
                (parsed.message.usage.output_tokens ?? 0),
            };
          }
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    const promptText = messagesToPromptText(messages, options.systemInstruction);
    const latencyMs = Date.now() - start;
    console.log(`[Claude] Stream Success:`, {
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

export const claudeProvider = new ClaudeProvider();
