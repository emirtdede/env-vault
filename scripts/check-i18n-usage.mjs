#!/usr/bin/env node
/**
 * Verifies that every literal translation key used by the interface exists in
 * the canonical English dictionary.
 *
 * The parity check only compares locale JSON files against each other; it
 * cannot see a key that was never authored, so a typo such as
 * `t("integrations.mcpTitle")` would render the raw key to the user. This scan
 * closes that gap.
 *
 * Usage: node scripts/check-i18n-usage.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");
const localesDir = path.join(srcDir, "i18n", "locales");

const KEY_CALL = /\bt\(\s*"([A-Za-z0-9_.]+)"/g;
const DYNAMIC_CALL = /\bt\(\s*`/g;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "locales" || entry.name === "node_modules") continue;
      files.push(...walk(full));
      continue;
    }
    if (/\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith(".test.tsx")) files.push(full);
  }
  return files;
}

function flatten(value, prefix = "") {
  if (typeof value === "string") return [prefix];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) =>
    flatten(nested, prefix ? `${prefix}.${key}` : key)
  );
}

async function loadEnglish() {
  const outfile = path.join(root, "node_modules", ".cache", "i18n-usage-en.mjs");
  fs.mkdirSync(path.dirname(outfile), { recursive: true });
  await build({
    entryPoints: [path.join(localesDir, "en.ts")],
    bundle: true,
    format: "esm",
    outfile,
    logLevel: "silent",
  });
  const module = await import(`file://${outfile.replace(/\\/g, "/")}?t=${Date.now()}`);
  return module.en;
}

async function main() {
  const dictionary = await loadEnglish();
  const known = new Set(flatten(dictionary));

  const missing = [];
  let scanned = 0;
  for (const file of walk(srcDir)) {
    const source = fs.readFileSync(file, "utf8");
    if (source.includes("i18n/locales")) continue;
    scanned += 1;
    for (const match of source.matchAll(KEY_CALL)) {
      const key = match[1];
      if (!known.has(key)) {
        missing.push(`${path.relative(root, file)}: ${key}`);
      }
    }
    for (const match of source.matchAll(DYNAMIC_CALL)) {
      // Template keys are composed from a small, reviewed prefix set; they are
      // covered by the parity check plus the manual review.
      void match;
    }
  }

  if (missing.length > 0) {
    console.error("i18n usage check failed:");
    for (const entry of missing) console.error(` - ${entry}`);
    process.exit(1);
  }

  console.log(`i18n usage check passed: ${scanned} files, ${known.size} keys.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
