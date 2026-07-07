/**
 * POST /api/chat — single backend entry point for all AI requests.
 * Works with Express (this project) and mirrors Next.js App Router shape.
 */

import type { Request, Response } from "express";
import { aiRouter } from "../../../lib/ai/router.js";
import { ChatRequestBody, ChatResponseBody } from "../../../lib/ai/types.js";
import { AIProviderError } from "../../../lib/ai/utils.js";
import { resolveModel } from "../../../lib/ai/config.js";

function validateBody(body: unknown): ChatRequestBody {
  if (!body || typeof body !== "object") {
    throw new AIProviderError("Request body is required", 400, "BAD_REQUEST", false);
  }
  const req = body as ChatRequestBody;
  if (!req.messages || !Array.isArray(req.messages)) {
    throw new AIProviderError(
      "Messages array is required",
      400,
      "BAD_REQUEST",
      false
    );
  }
  return req;
}

function toChatResponse(result: {
  content: string;
  provider: string;
  displayModel: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  latencyMs: number;
  fallbackUsed?: boolean;
  attemptedProviders?: string[];
  selectedProvider?: string;
  actualProvider?: string;
}): ChatResponseBody {
  const fallbackMessage = result.fallbackUsed && result.selectedProvider && result.actualProvider
    ? `Response generated using ${result.actualProvider} (Fallback from ${result.selectedProvider})`
    : undefined;

  return {
    provider: result.provider,
    model: result.displayModel,
    content: result.content,
    response: result.content,
    selectedProvider: result.selectedProvider,
    actualProvider: result.actualProvider,
    fallbackUsed: result.fallbackUsed,
    fallbackMessage,
    stats: {
      responseTimeMs: result.latencyMs,
      inputTokens: result.usage.promptTokens,
      outputTokens: result.usage.completionTokens,
      totalTokens: result.usage.totalTokens,
      provider: result.provider,
      model: result.displayModel,
      fallbackUsed: result.fallbackUsed,
      attemptedProviders: result.attemptedProviders,
    },
  };
}

function sendError(res: Response, err: unknown): void {
  const errMsg = err instanceof Error ? err.message : String(err);
  const errCode = err instanceof AIProviderError ? (err.code ?? "AI_ERROR") : "INTERNAL_ERROR";
  console.error("[API /chat] Returning graceful fallback due to error:", err);
  
  const fallbackContent = `I apologize, but we encountered an error while processing your request: ${errMsg} (${errCode}). Please verify your configurations and try again.`;

  res.status(200).json({
    provider: "System Fallback",
    model: "Graceful Fallback",
    content: fallbackContent,
    response: fallbackContent,
    fallbackUsed: true,
    fallbackMessage: "An error occurred, returning system fallback.",
    stats: {
      responseTimeMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      provider: "System",
      model: "Graceful Fallback",
      fallbackUsed: true,
      attemptedProviders: ["gemini", "openai", "anthropic", "deepseek"]
    }
  });
}

/**
 * Core handler — called by Express and usable in Next.js route.ts export.
 */
export async function handleChatPost(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // --- Diagnostics Endpoint ---
    if (req.query?.diagnostics === "true" || req.body?.diagnostics === true) {
      const diag = await aiRouter.runDiagnostics();
      res.json(diag);
      return;
    }

    const body = validateBody(req.body);
    const modelDef = resolveModel(body.model);

    const routerRequest = {
      messages: body.messages,
      modelId: body.model,
      temperature: body.temperature,
      maxTokens: body.maxTokens ?? (body as { maxTokens?: number }).maxTokens,
      topP: body.topP,
      systemInstruction:
        body.systemInstruction ??
        (body as { systemInstruction?: string }).systemInstruction,
      fileData: body.fileData,
    };

    // --- Streaming (SSE) ---
    if (body.stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      try {
        for await (const chunk of aiRouter.stream(routerRequest)) {
          if (chunk.done) {
            const fallbackMessage = chunk.fallbackUsed && chunk.selectedProvider && chunk.actualProvider
              ? `Response generated using ${chunk.actualProvider} (Fallback from ${chunk.selectedProvider})`
              : undefined;

            res.write(
              `event: done\ndata: ${JSON.stringify({
                provider: chunk.provider,
                model: modelDef.displayName,
                apiModel: chunk.model,
                usage: chunk.usage,
                latencyMs: chunk.latencyMs,
                fallbackUsed: chunk.fallbackUsed,
                attemptedProviders: chunk.attemptedProviders,
                selectedProvider: chunk.selectedProvider,
                actualProvider: chunk.actualProvider,
                fallbackMessage,
                stats: {
                  responseTimeMs: chunk.latencyMs,
                  inputTokens: chunk.usage?.promptTokens ?? 0,
                  outputTokens: chunk.usage?.completionTokens ?? 0,
                  totalTokens: chunk.usage?.totalTokens ?? 0,
                  provider: chunk.provider,
                  model: modelDef.displayName,
                  fallbackUsed: chunk.fallbackUsed,
                  attemptedProviders: chunk.attemptedProviders,
                },
              })}\n\n`
            );
          } else if (chunk.content) {
            res.write(
              `event: chunk\ndata: ${JSON.stringify({ content: chunk.content })}\n\n`
            );
          }
        }
        res.write(`event: end\ndata: {}\n\n`);
        res.end();
      } catch (streamErr) {
        console.error("[API /chat] Streaming failed:", streamErr);
        const fallbackContent = "\n\n*System Fallback*: All configured AI providers are currently unavailable or hit quota limits. Please verify your keys and credits.";
        res.write(
          `event: chunk\ndata: ${JSON.stringify({ content: fallbackContent })}\n\n`
        );
        res.write(
          `event: done\ndata: ${JSON.stringify({
            provider: "System Fallback",
            model: "Graceful Fallback",
            content: fallbackContent,
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            latencyMs: 0,
            fallbackUsed: true,
            selectedProvider: "any",
            actualProvider: "System",
            fallbackMessage: "All configured providers failed to respond.",
            stats: {
              responseTimeMs: 0,
              inputTokens: 0,
              outputTokens: 0,
              totalTokens: 0,
              provider: "System",
              model: "Graceful Fallback",
              fallbackUsed: true,
              attemptedProviders: ["gemini", "openai", "anthropic", "deepseek"]
            }
          })}\n\n`
        );
        res.write(`event: end\ndata: {}\n\n`);
        res.end();
      }
      return;
    }

    // --- Non-streaming JSON ---
    const result = await aiRouter.generate(routerRequest);
    res.json(toChatResponse(result));
  } catch (err) {
    sendError(res, err);
  }
}

/** Next.js App Router compatible export (for future migration). */
export async function POST(req: Request): Promise<Response> {
  // Placeholder for Next.js — not used in Express setup
  throw new Error("Use handleChatPost with Express in this project");
}
