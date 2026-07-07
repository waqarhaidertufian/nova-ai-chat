/**
 * Google Gemini provider — implements AIProvider using @google/genai SDK.
 */

import { GoogleGenAI } from "@google/genai";
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
  messagesToPromptText,
  providerDisplayName,
  isRetryableError,
  isQuotaOrBillingError,
} from "../utils.js";

function buildGeminiContents(
  messages: ChatMessage[],
  fileData?: { mimeType?: string; data?: string }
) {
  return messages.map((msg, index) => {
    const isLast = index === messages.length - 1;
    const parts: Array<
      { text: string } | { inlineData: { mimeType: string; data: string } }
    > = [];

    if (isLast && fileData?.data && fileData?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.data,
        },
      });
    }

    if (msg.content) {
      parts.push({ text: msg.content });
    }

    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts,
    };
  });
}

export class GeminiProvider implements AIProvider {
  readonly name = providerDisplayName("gemini");
  readonly id = "gemini";

  private client: GoogleGenAI | null = null;

  isAvailable(): boolean {
    return isProviderConfigured("gemini");
  }

  private getClient(): GoogleGenAI {
    if (!this.client) {
      if (!env.geminiApiKey) {
        throw new AIProviderError(
          "GEMINI_API_KEY is not configured",
          401,
          "MISSING_KEY",
          false
        );
      }
      this.client = new GoogleGenAI({ apiKey: env.geminiApiKey });
    }
    return this.client;
  }

  async generateResponse(
    messages: ChatMessage[],
    options: AIProviderOptions
  ): Promise<AIResponse> {
    const start = Date.now();
    const client = this.getClient();
    const contents = buildGeminiContents(messages, options.fileData);

    const config: Record<string, unknown> = {};
    if (options.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    if (options.temperature !== undefined) {
      config.temperature = Number(options.temperature);
    }
    if (options.maxTokens !== undefined) {
      config.maxOutputTokens = Number(options.maxTokens);
    }
    if (options.topP !== undefined) config.topP = Number(options.topP);

    console.log(`[Gemini] Request:`, {
      model: options.model,
      messageCount: messages.length,
      temperature: config.temperature,
      maxTokens: config.maxOutputTokens,
      topP: config.topP,
      hasSystemInstruction: !!options.systemInstruction,
      hasFileData: !!options.fileData?.data,
    });

    try {
      const response = await client.models.generateContent({
        model: options.model,
        contents,
        config,
      });

      const content =
        response.text ??
        "I processed the request but did not generate a text response.";

      const promptText = messagesToPromptText(
        messages,
        options.systemInstruction
      );

      const latencyMs = Date.now() - start;
      console.log(`[Gemini] Success:`, {
        contentLength: content.length,
        latencyMs,
      });

      return {
        content,
        provider: this.name,
        model: options.model,
        usage: buildUsage(promptText, content),
        latencyMs,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const status =
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        typeof (err as { status: unknown }).status === "number"
          ? (err as { status: number }).status
          : undefined;
      
      const isBilling = isQuotaOrBillingError(err) || isQuotaOrBillingError(message);
      const retryable = !isBilling && (status === 429 || status === 503 || isRetryableError(err) || isRetryableError(message));
      
      console.error(`[Gemini] Error:`, {
        message,
        status,
        retryable,
        error: err,
      });

      throw new AIProviderError(message, status, isBilling ? "BILLING_ERROR" : "GEMINI_ERROR", retryable);
    }
  }

  async *streamResponse(
    messages: ChatMessage[],
    options: AIProviderOptions
  ): AsyncGenerator<AIStreamChunk, void, unknown> {
    const start = Date.now();
    const client = this.getClient();
    const contents = buildGeminiContents(messages, options.fileData);

    const config: Record<string, unknown> = {};
    if (options.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    if (options.temperature !== undefined) {
      config.temperature = Number(options.temperature);
    }
    if (options.maxTokens !== undefined) {
      config.maxOutputTokens = Number(options.maxTokens);
    }
    if (options.topP !== undefined) config.topP = Number(options.topP);

    console.log(`[Gemini] Stream Request:`, {
      model: options.model,
      messageCount: messages.length,
      temperature: config.temperature,
      maxTokens: config.maxOutputTokens,
      topP: config.topP,
      hasSystemInstruction: !!options.systemInstruction,
      hasFileData: !!options.fileData?.data,
    });

    try {
      const stream = await client.models.generateContentStream({
        model: options.model,
        contents,
        config,
      });

      let fullText = "";
      let chunkCount = 0;
      for await (const chunk of stream) {
        const delta = chunk.text ?? "";
        if (delta) {
          fullText += delta;
          chunkCount++;
          yield { content: delta };
        }
      }

      const promptText = messagesToPromptText(
        messages,
        options.systemInstruction
      );

      const latencyMs = Date.now() - start;
      console.log(`[Gemini] Stream Success:`, {
        contentLength: fullText.length,
        chunkCount,
        latencyMs,
      });

      yield {
        content: "",
        done: true,
        provider: this.name,
        model: options.model,
        usage: buildUsage(promptText, fullText),
        latencyMs,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const status =
        typeof err === "object" &&
        err !== null &&
        "status" in err &&
        typeof (err as { status: unknown }).status === "number"
          ? (err as { status: number }).status
          : undefined;
          
      const isBilling = isQuotaOrBillingError(err) || isQuotaOrBillingError(message);
      const retryable = !isBilling && (status === 429 || isRetryableError(err) || isRetryableError(message));
      
      console.error(`[Gemini] Stream Error:`, {
        message,
        status,
        retryable,
        error: err,
      });

      throw new AIProviderError(message, status, isBilling ? "BILLING_ERROR" : "GEMINI_STREAM_ERROR", retryable);
    }
  }
}

export const geminiProvider = new GeminiProvider();
