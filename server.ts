/**
 * Express server — serves the Vite SPA and delegates /api/chat to the AI Router.
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { handleChatPost } from "./src/app/api/chat/route.js";
import { env } from "./src/lib/ai/config.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      providers: {
        gemini: Boolean(env.geminiApiKey),
        openai: Boolean(env.openaiApiKey),
        anthropic: Boolean(env.anthropicApiKey),
        deepseek: Boolean(env.deepseekApiKey),
      },
    });
  });

  // Single AI endpoint — all providers routed through the modular AI Router
  app.post("/api/chat", (req, res) => {
    void handleChatPost(req, res);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      configLoader: "runner",
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log("AI Router providers:", {
      gemini: env.geminiApiKey ? "configured" : "missing",
      openai: env.openaiApiKey ? "configured" : "missing",
      anthropic: env.anthropicApiKey ? "configured" : "missing",
      deepseek: env.deepseekApiKey ? "configured" : "missing",
    });
  });
}

startServer();
