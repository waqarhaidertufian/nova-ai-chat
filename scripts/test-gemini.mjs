import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { writeFileSync } from "fs";

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const results = [];

async function test(label, params) {
  try {
    const response = await ai.models.generateContent(params);
    results.push({ label, ok: true, text: response.text?.slice(0, 100) });
  } catch (err) {
    results.push({ label, ok: false, error: err.message, status: err.status });
  }
}

await test("broken-format (current server)", {
  model: "gemini-1.5-flash",
  contents: { parts: [{ text: "hello" }] },
  config: {},
});

await test("fixed-format gemini-2.0-flash", {
  model: "gemini-2.0-flash",
  contents: [{ text: "hello" }],
  config: {},
});

await test("fixed-format gemini-2.5-flash", {
  model: "gemini-2.5-flash",
  contents: "hello",
  config: {},
});

writeFileSync("gemini-test-results.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
