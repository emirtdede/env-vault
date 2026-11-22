#!/usr/bin/env node
/**
 * Locale parity gate.
 *
 * Verifies that every generated locale carries exactly the same key set as the
 * canonical English dictionary, that no value is empty, that interpolation
 * placeholders survive translation and that no English/Turkish leakage exists
 * in locales which are expected to be fully translated.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = path.join(root, "src", "i18n", "locales");

function flatten(value, prefix = "", out = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flatten(child, next, out);
    } else {
      out.set(next, String(child));
    }
  }
  return out;
}

async function loadDictionary(entry) {
  const result = await build({
    entryPoints: [path.join(localesDir, entry)],
    bundle: true,
    format: "esm",
    write: false,
    platform: "node",
  });
  const code = result.outputFiles[0].text;
  const dataUrl = `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
  return import(dataUrl);
}

const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

async function main() {
  const enModule = await loadDictionary("en.ts");
  const en = flatten(enModule.en);
  const codes = fs
    .readdirSync(localesDir)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(/\.json$/, ""))
    .sort();

  const problems = [];
  const translated = ["tr"];
  if (codes.length < 73) {
    problems.push(`Expected 73 generated locale files, found ${codes.length}.`);
  }

  for (const code of codes) {
    const raw = fs.readFileSync(path.join(localesDir, `${code}.json`), "utf8");
    let dict;
    try {
      dict = JSON.parse(raw);
    } catch (error) {
      problems.push(`${code}: invalid JSON (${error.message})`);
      continue;
    }
    const flat = flatten(dict);

    for (const key of en.keys()) {
      if (!flat.has(key)) problems.push(`${code}: missing key "${key}"`);
    }
    for (const key of flat.keys()) {
      if (!en.has(key)) problems.push(`${code}: unknown key "${key}"`);
    }
    for (const [key, value] of flat) {
      if (!value.trim()) problems.push(`${code}: empty value for "${key}"`);
      const expected = placeholders(en.get(key) ?? "");
      const actual = placeholders(value);
      if (expected.join(",") !== actual.join(",")) {
        problems.push(
          `${code}: placeholder mismatch for "${key}" (expected ${expected.join(",") || "none"}, got ${actual.join(",") || "none"})`,
        );
      }
      const source = en.get(key) ?? "";
      // Proper nouns and short labels legitimately stay identical across locales,
      // so only long identical sentences are treated as untranslated.
      if (
        code !== "en" &&
        code !== "tr" &&
        source === value &&
        source.length >= 32 &&
        /\s/.test(source)
      ) {
        problems.push(`${code}: copy of English source in "${key}"`);
      }
    }
    if (translated.includes(code)) {
      for (const [key, value] of flat) {
        const source = en.get(key);
        // Brand names, language endonyms and short labels are intentionally
        // shared with English; only whole sentences count as untranslated.
        if (
          source &&
          value === source &&
          source.length >= 32 &&
          /\s/.test(source) &&
          /\b[a-z]{4,}\b/.test(source)
        ) {
          problems.push(`${code}: untranslated string for "${key}"`);
        }
      }
    }
  }

  if (problems.length) {
    console.error("i18n parity check failed:");
    for (const problem of problems.slice(0, 80)) console.error(` - ${problem}`);
    if (problems.length > 80) console.error(` ... and ${problems.length - 80} more`);
    process.exit(1);
  }
  console.log(`i18n parity check passed for ${codes.length} locales and ${en.size} keys.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
