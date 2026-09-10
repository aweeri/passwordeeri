import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: bun run test/check-inline-js.ts <html-file>");
  process.exit(1);
}

const html = readFileSync(file, "utf8");
const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
let failed = false;

while ((match = re.exec(html)) !== null) {
  count++;
  const code = match[1];
  console.log(`--- Inline script #${count} (${code.length} chars) ---`);
  try {
    new Function(code);
    console.log("SYNTAX OK");
  } catch (e: any) {
    failed = true;
    console.log("SYNTAX ERROR:", e.message);
  }
}

console.log(`Total inline scripts: ${count}`);
process.exit(failed ? 1 : 0);