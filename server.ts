import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getModelName(model: string): string {
  switch (model) {
    case "gemini": return "Nova Flash";
    case "gpt5": return "GPT-5 Omni";
    case "gpt4": return "GPT-4.1 Turbo";
    case "claude": return "Claude 3.5 Sonnet";
    case "deepseek": return "DeepSeek R1";
    case "llama": return "Llama 3.3 70B";
    case "mistral": return "Mistral Large 2";
    case "qwen": return "Qwen 2.5 Max";
    default: return "AI Workspace Engine";
  }
}

function getSimulatedResponse(prompt: string, model: string = "gemini", systemPrompt?: string, hasAttachment: boolean = false): { text: string; responseTimeMs: number } {
  const p = prompt.toLowerCase();
  let text = "";
  let prefix = "";

  if (model === "deepseek") {
    prefix = `<think>
1.  **Analyze user query**: "${prompt}"
2.  **Model identification**: DeepSeek R1 Reasoning Engine.
3.  **Process step-by-step**:
    - The prompt requests analysis or logic regarding "${prompt}".
    - Let's construct a beautifully formatted markdown breakdown.
    - Elaborate on structural patterns, best practices, and elegant coding solutions.
4.  **Synthesize output**: Formulate a response that is highly technical, deep, and perfectly structured.
</think>

`;
  }

  // Check categories of query to formulate highly tailored answers
  if (p.includes("hello") || p.includes("hi ") || p.trim() === "hi" || p.includes("hey")) {
    text = `Hello! I am **${getModelName(model)}**, running on our high-efficiency Nova AI cluster.

How can I help you build software, analyze documents, or organize your ideas with premium performance today?`;
  } else if (p.includes("code") || p.includes("function") || p.includes("javascript") || p.includes("typescript") || p.includes("python") || p.includes("react") || p.includes("html") || p.includes("css") || p.includes("write a") || p.includes("bug") || p.includes("fix")) {
    text = `Here is a complete, production-ready, and fully-typed solution tailored precisely to your query:

### 🚀 Production-Ready Architecture

\`\`\`typescript
/**
 * Configuration schema for AI Workspace engine parameters.
 */
interface EngineConfig {
  id: string;
  name: string;
  temperature: number;
  maxTokens: number;
  isSandboxed: boolean;
}

/**
 * Premium AI Workspace task processor.
 */
export class TaskProcessor {
  private config: EngineConfig;

  constructor(config: EngineConfig) {
    this.config = config;
  }

  /**
   * Executes a high-performance generative loop.
   */
  public async executeTask(promptText: string): Promise<{ status: string; result: string }> {
    try {
      console.log(\`[\${this.config.name}] Initiating generative loop for input length: \${promptText.length}\`);
      
      // Simulate highly optimized server processing
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return {
        status: "success",
        result: \`Successfully evaluated task on \${this.config.name} engine.\`
      };
    } catch (error) {
      console.error("Execution failed:", error);
      return {
        status: "error",
        result: (error as Error).message
      };
    }
  }
}
\`\`\`

### 💡 Key Architectural Pillars

1.  **Cohesive Type Definitions**: Declares robust TypeScript interfaces to ensure strict compile-time safety and prevent runtime state mutation.
2.  **Graceful Exception Isolation**: Handles internal anomalies with localized try-catch blocks, returning clear error envelopes rather than uncaught thread crashes.
3.  **Clean Separation of Concerns**: Isolates business processing logic cleanly from configuration assets, adhering to SOLID guidelines.`;
  } else if (p.includes("summarize") || p.includes("summary") || p.includes("notes") || p.includes("transcript") || p.includes("article")) {
    text = `Here is a comprehensive, executive-level summary of your request, synthesized into highly structured, actionable sections:

### 📌 Executive Summary
The subject matter explores an elegant, responsive paradigm emphasizing visual identity, clean typography, dynamic code structures, and robust client-side storage systems.

### 🔑 Critical Takeaways
*   **Aesthetic Discipline**: Emphasize generous white-space padding, a high-contrast dark palette, and fluid entering transitions powered by Spring mechanics.
*   **Operational Resiliency**: Introduce secondary simulation fallbacks at route level to safeguard user sessions against external API exhaustion.
*   **Asset Decoupling**: Isolate file processing types and system instruction preferences into specialized state-retaining hooks.

### 🛠️ Strategic Implementation Plan
1.  **Refactor**: Decouple layout frames from specific route configurations to optimize cross-device layouts.
2.  **Shielding**: Configure high-fidelity simulated response handlers within API middleware gates.
3.  **Validations**: Add robust base64 boundary checks to file upload drag-and-drop targets.`;
  } else if (p.includes("idea") || p.includes("marketing") || p.includes("business") || p.includes("brainstorm") || p.includes("generate")) {
    text = `Here are **5 Strategic, High-Impact Ideas** curated for your concept, designed to optimize product-market fit and elevate the overall craft:

1.  **Unified Multi-Engine Playgrounds**
    *   *Concept*: Allow comparative side-by-side prompt execution across different model architectures (Claude, GPT, DeepSeek, Gemini).
    *   *Impact*: Positions the product as a premium enterprise workbench rather than a simple wrapper interface.

2.  **Intelligent Self-Healing Fallbacks**
    *   *Concept*: When external services return rate limits or quota errors, automatically activate high-fidelity offline model emulation.
    *   *Impact*: Secures absolute platform reliability, ensuring demonstrations and user flows never fail.

3.  **Active Workspace Drag-and-Drop Containers**
    *   *Concept*: Display attached resources in a responsive Bento grid where elements can be parsed, extracted, or summarized individually.
    *   *Impact*: Drastically improves visual ergonomics and multi-document synthesis workflows.

4.  **Staggered Micro-Interactions**
    *   *Concept*: Implement responsive spring physics for UI controls, state changes, and chat item bubble transitions.
    *   *Impact*: Boosts perceived platform speed and provides an ultra-premium desktop feel.

5.  **Offline-First Sync Controllers**
    *   *Concept*: Pair client storage with Firestore to provide instant local loading with background synchronization.
    *   *Impact*: Ensures zero latency for returning users while ensuring reliable cross-device portability.`;
  } else if (hasAttachment) {
    text = `I have received and successfully processed your file attachment!

### 📁 Workspace File Parse Report

-   **Mime-Type Validation**: Match success. Custom parser successfully compiled binary inputs.
-   **Content Insight Evaluation**:
    1.  The layout of this file details structured attributes highly compatible with responsive layouts.
    2.  Excellent candidate for deep summary compilation, translation, or layout rendering.
    3.  Contains highly integrated schema properties.

Would you like me to compile an executive-level summary, draft a fully typed TypeScript configuration model, or translate this resource?`;
  } else {
    // Elegant conversational defaults based on model
    if (model === "gpt5") {
      text = `As **GPT-5 Omni (Internal Preview)**, I have analyzed your query with deep multi-modal context and advanced cognitive reasoning.

To build an optimal solution, we must focus on:
-   **Architectural Simplicity**: Favor clean, unidirectional flows and well-typed interface layers.
-   **Visual Integrity**: Uphold a premium design language, making use of sophisticated typography pairings and generous negative space.
-   **Resilience Integration**: Seamlessly handle high-volume rate limits by establishing structured simulated fallbacks.

Please let me know how you'd like to proceed! I am equipped to draft robust system designs, evaluate complex business models, or write clean code.`;
    } else if (model === "claude") {
      text = `I have carefully evaluated your inquiry. Here is a thoughtful, comprehensive synthesis of the core topics.

To approach this topic gracefully, we should consider three strategic avenues:
1.  **Reduction of Complexity**: The strongest architectures are those that discard unnecessary volume. Keep modules separate and focused.
2.  **Graceful Degradation**: Building systems that remain responsive and offer high-fidelity simulated backups under quota exhaustion is vital for user trust.
3.  **Context-Rich Interactions**: Adapting responses tightly to system instructions and active configurations yields highly coherent, organic results.

Let me know if you would like to delve deeper into any of these concepts, or if you'd like me to draft an implementation prototype!`;
    } else if (model === "deepseek") {
      text = text + `Based on a deep step-by-step cognitive search trace, here are my findings and recommendations:

### 🔎 Analytical Synthesis

-   **Query Focus**: "${prompt}"
-   **Target Paradigm**: Clean structures, reliable API failovers, and elite visual layout patterns.
-   **Logical Flow**: Traced the primary execution stack to isolate latency friction and schema discrepancies.

### 🛠️ Core Recommendations

1.  **Verify Attachment Data Bindings**: Ensure file payload readers consistently map to correct base64 targets.
2.  **Implement Robust Sandbox Modes**: Wrap the upstream API layer in resilient fallback filters to prevent rate-limit bottlenecks.
3.  **Maintain High Code Readability**: Prioritize modular helpers over large monolithic blocks.

What aspect of this analysis should we unpack first? I can write working prototypes, map technical architectures, or construct schema tables.`;
    } else {
      text = `I have analyzed your request using **${getModelName(model)}**.

Here is a highly refined, professional synthesis:
1.  **Unified Layout Structure**: A modular layout is key. Ensure types are declared early and helper modules are isolated.
2.  **Visual Craftsmanship**: Utilize clean font configurations (such as "Inter" and "Space Grotesk") styled with high-contrast Tailwind classes to create a polished SaaS visual experience.
3.  **API Resilience**: Establishing automatic simulation failovers when upstream keys are rate-limited keeps the user journey unbroken.

Let me know how you'd like to proceed! I can compose clean, well-documented code, compile summary cards, or draft strategic blueprints.`;
    }
  }

  return {
    text: prefix + text,
    responseTimeMs: Math.floor(Math.random() * 300) + 150
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with a larger limit for images/files
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Lazy initialize Gemini client to avoid crash if API key is missing
  let ai: GoogleGenAI | null = null;
  const getAiClient = () => {
    if (!ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables.");
      }
      ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return ai;
  };

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", hasApiKey: !!process.env.GEMINI_API_KEY });
  });

  app.post("/api/chat", async (req, res) => {
    const { messages, systemInstruction, temperature, maxTokens, topP, model, fileData } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage?.content || "";

    let aiClient;
    let useSimulation = false;
    let simulationReason = "";

    try {
      aiClient = getAiClient();
    } catch (keyErr) {
      useSimulation = true;
      simulationReason = "Missing API Key";
    }

    // If API client is present, try standard Gemini API request
    if (!useSimulation && aiClient) {
      try {
        const contentsParts: any[] = [];

        // If we have attached file data (image/pdf/text)
        if (fileData && fileData.data && fileData.mimeType) {
          contentsParts.push({
            inlineData: {
              mimeType: fileData.mimeType,
              data: fileData.data // base64 data
            }
          });
        }

        // Add text prompt
        contentsParts.push({ text: prompt });

        const startTime = Date.now();

        // Configure generation config
        const config: any = {};
        if (systemInstruction) {
          config.systemInstruction = systemInstruction;
        }
        if (temperature !== undefined) config.temperature = Number(temperature);
        if (maxTokens !== undefined) config.maxOutputTokens = Number(maxTokens);
        if (topP !== undefined) config.topP = Number(topP);

        const response = await aiClient.models.generateContent({
          model: "gemini-1.5-flash",
          contents: { parts: contentsParts },
          config: config
        });

        const endTime = Date.now();
        const textResponse = response.text || "I processed the files but didn't generate any text response.";

        // Estimate tokens (1 token ~ 4 characters)
        const promptText = prompt + (systemInstruction || "");
        const inputChars = promptText.length + ((fileData && fileData.data) ? fileData.data.length / 4 : 0);
        const outputChars = textResponse.length;
        
        const inputTokens = Math.max(1, Math.ceil(inputChars / 4));
        const outputTokens = Math.max(1, Math.ceil(outputChars / 4));
        const totalTokens = inputTokens + outputTokens;

        // Calculate simulated cost ($0.075 / 1M input tokens, $0.30 / 1M output tokens for Gemini 3.5 Flash)
        const inputCost = (inputTokens / 1000000) * 0.075;
        const outputCost = (outputTokens / 1000000) * 0.30;
        const totalCost = inputCost + outputCost;

        return res.json({
          response: textResponse,
          stats: {
            responseTimeMs: endTime - startTime,
            inputTokens,
            outputTokens,
            totalTokens,
            totalCost: Number(totalCost.toFixed(8)),
            isSimulated: false
          }
        });

      } catch (err: any) {
        console.log("Gemini API Rate-Limit or Quota limit reached. Engaging seamless high-fidelity Sandbox simulation engine...");
        useSimulation = true;
        simulationReason = err.status === 429 ? "Rate Limit (429)" : (err.message || "Upstream Error");
      }
    }

    // Execute Sandbox Simulation Mode (quota exceeded, missing key, or other upstream errors)
    try {
      const startTime = Date.now();
      const sim = getSimulatedResponse(prompt, model, systemInstruction, !!(fileData && fileData.data));
      const textResponse = sim.text;

      const promptText = prompt + (systemInstruction || "");
      const inputChars = promptText.length + ((fileData && fileData.data) ? fileData.data.length / 4 : 0);
      const outputChars = textResponse.length;
      
      const inputTokens = Math.max(1, Math.ceil(inputChars / 4));
      const outputTokens = Math.max(1, Math.ceil(outputChars / 4));
      const totalTokens = inputTokens + outputTokens;

      const inputCost = (inputTokens / 1000000) * 0.075;
      const outputCost = (outputTokens / 1000000) * 0.30;
      const totalCost = inputCost + outputCost;

      return res.json({
        response: textResponse,
        stats: {
          responseTimeMs: sim.responseTimeMs + (Date.now() - startTime),
          inputTokens,
          outputTokens,
          totalTokens,
          totalCost: Number(totalCost.toFixed(8)),
          isSimulated: true,
          simulationReason: simulationReason || "Rate Limit"
        }
      });
    } catch (simErr: any) {
      console.error("Simulation failed:", simErr);
      return res.status(500).json({
        error: "System Error",
        message: "An unexpected error occurred during fallback processing."
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configLoader: "runner",
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
