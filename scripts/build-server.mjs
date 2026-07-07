import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const workspaceRoot = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const outputPath = path.join(workspaceRoot, "dist", "server.cjs");

await esbuild.build({
  entryPoints: [path.join(workspaceRoot, "server.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: outputPath,
  sourcemap: true,
  external: ["express", "vite", "@google/genai", "dotenv"],
});

console.log(`Server bundled → ${outputPath}`);
