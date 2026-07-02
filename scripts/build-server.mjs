import fs from "fs/promises";
import path from "path";
import ts from "typescript";
import { fileURLToPath } from "url";

const workspaceRoot = path.dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const inputPath = path.join(workspaceRoot, "server.ts");
const outputPath = path.join(workspaceRoot, "dist", "server.cjs");

const source = await fs.readFile(inputPath, "utf8");
const result = ts.transpileModule(source, {
  fileName: inputPath,
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    sourceMap: true
  }
});

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, result.outputText);
if (result.sourceMapText) {
  await fs.writeFile(`${outputPath}.map`, result.sourceMapText);
}
