import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.resolve(rootDir, "messages/src/frontend");
const outDir = path.resolve(rootDir, "messages/frontend");

fs.mkdirSync(outDir, { recursive: true });

const LOCALES = ["ru", "kk", "en"];
const SCHEMA_HEADER = "https://inlang.com/schema/inlang-message-format";

for (const locale of LOCALES) {
  const merged = { $schema: SCHEMA_HEADER };

  if (fs.existsSync(srcDir)) {
    const namespaces = fs.readdirSync(srcDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();

    for (const ns of namespaces) {
      const filePath = path.join(srcDir, ns, `${locale}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          for (const [key, value] of Object.entries(content)) {
            if (key.startsWith("$")) continue;
            merged[key] = value;
          }
        } catch (err) {
          console.error(`[merge-messages] Error parsing ${filePath}:`, err);
        }
      }
    }
  }

  const outPath = path.join(outDir, `${locale}.json`);
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
}

console.log("[merge-messages] Successfully compiled modular component messages into messages/frontend/{locale}.json");
