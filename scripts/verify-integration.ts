import dotenv from "dotenv";
import path from "path";
import { aiRouter } from "../src/lib/ai/router.js";
import { validateApiKeys } from "../src/lib/ai/config.js";

// Load keys
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config();

async function run() {
  console.log("=== API Key Pre-Validation ===");
  const keyDiagnostics = validateApiKeys();
  console.log(JSON.stringify(keyDiagnostics, null, 2));

  console.log("\n=== Running Router Diagnostics ===");
  const diagnostics = await aiRouter.runDiagnostics();
  console.log("Diagnostics Results:", JSON.stringify(diagnostics, null, 2));

  console.log("\n=== Testing Router Generate (OpenAI gpt5 -> Fallback -> Gemini) ===");
  try {
    const result = await aiRouter.generate({
      messages: [{ role: "user", content: "Hello! Respond with the word 'SUCCESS' only." }],
      modelId: "gpt5", // OpenAI model which has insufficient credits
      temperature: 0.7,
    });
    console.log("Generate Result:", {
      success: true,
      selectedProvider: result.selectedProvider,
      actualProvider: result.actualProvider,
      fallbackUsed: result.fallbackUsed,
      attemptedProviders: result.attemptedProviders,
      content: result.content,
      stats: result.usage,
      latencyMs: result.latencyMs,
    });
  } catch (err: any) {
    console.error("Generate Failed:", err.message, err.code, err.statusCode);
  }

  console.log("\n=== Testing Router Streaming (Claude -> Fallback -> Gemini) ===");
  try {
    const stream = aiRouter.stream({
      messages: [{ role: "user", content: "Hello! Respond with the word 'STREAM' only." }],
      modelId: "claude", // Claude model which has insufficient credits
      temperature: 0.7,
    });

    let fullText = "";
    let finalChunk: any = null;

    for await (const chunk of stream) {
      if (chunk.done) {
        finalChunk = chunk;
      } else {
        fullText += chunk.content;
      }
    }

    console.log("Stream Result:", {
      success: true,
      selectedProvider: finalChunk?.selectedProvider,
      actualProvider: finalChunk?.actualProvider,
      fallbackUsed: finalChunk?.fallbackUsed,
      attemptedProviders: finalChunk?.attemptedProviders,
      fullText,
      stats: finalChunk?.usage,
      latencyMs: finalChunk?.latencyMs,
    });
  } catch (err: any) {
    console.error("Stream Failed:", err.message, err.code, err.statusCode);
  }
}

run();
