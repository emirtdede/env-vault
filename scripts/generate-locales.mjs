#!/usr/bin/env node
/**
 * Builds the 73-locale catalog from the canonical English dictionary.
 *
 * - English and Turkish dictionaries are authored in TypeScript and copied as is.
 * - Every other locale is generated through the public Google Translate
 *   endpoint, then committed so the application works fully offline.
 * - Interpolation placeholders and product names are excluded from translation
 *   so every string keeps valid `{placeholder}` tokens.
 *
 * Usage: node scripts/generate-locales.mjs [--force] [--only de,fr]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = path.join(root, "src", "i18n", "locales");
const cacheDir = path.join(root, "node_modules", ".cache", "locale-generation");
const cacheFile = path.join(cacheDir, "translations.json");
const force = process.argv.includes("--force");
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex > -1 ? process.argv[onlyIndex + 1].split(",") : null;

const BRAND_TOKENS = [
  "Env Vault",
  "EnvVault",
  "Vellium",
  "OneDrive",
  "Google Drive",
  "Dropbox",
  "iCloud Drive",
  "Yandex Disk",
  "Nextcloud",
  "GitHub",
  "AES-256-GCM",
  "Argon2id",
  "Tauri",
  "React",
  "Rust",
  "Windows",
  ".vaultbak",
  ".env",
];

const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SPLIT_RE = new RegExp(`(\\{\\w+\\}|${BRAND_TOKENS.map(escape).join("|")})`, "g");

function flatten(value, prefix = "", out = []) {
  for (const [key, child] of Object.entries(value)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) flatten(child, next, out);
    else out.push([next, String(child)]);
  }
  return out;
}

function unflatten(entries) {
  const out = {};
  for (const [key, value] of entries) {
    const parts = key.split(".");
    let node = out;
    for (let i = 0; i < parts.length - 1; i += 1) {
      node[parts[i]] ??= {};
      node = node[parts[i]];
    }
    node[parts.at(-1)] = value;
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
  return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function translateBatch(segments, target, attempt = 0) {
  const params = new URLSearchParams();
  params.set("client", "gtx");
  params.set("sl", "en");
  params.set("tl", target === "zh-tw" ? "zh-TW" : target);
  params.set("dt", "t");
  for (const segment of segments) params.append("q", segment);

  try {
    const response = await fetch(`https://translate.googleapis.com/translate_a/t?${params.toString()}`, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        "accept-language": "en-US,en;q=0.9",
      },
    });
    if (response.status === 429) throw new Error("HTTP 429");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || data.length !== segments.length) {
      throw new Error(`unexpected payload length ${Array.isArray(data) ? data.length : typeof data}`);
    }
    return data.map((item) => (typeof item === "string" ? item : item?.[0] ?? ""));
  } catch (error) {
    if (attempt >= 6) throw error;
    await delay(1000 * 2 ** attempt);
    return translateBatch(segments, target, attempt + 1);
  }
}

function sanitize(text) {
  return text
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function batches(items, maxLength = 1400) {
  const result = [];
  let current = [];
  let length = 0;
  for (const item of items) {
    const size = encodeURIComponent(item).length + 3;
    if (current.length && length + size > maxLength) {
      result.push(current);
      current = [];
      length = 0;
    }
    current.push(item);
    length += size;
  }
  if (current.length) result.push(current);
  return result;
}

async function buildLocale(target, enEntries, cache) {
  const destination = path.join(localesDir, `${target}.json`);
  if (!force && fs.existsSync(destination)) {
    const existing = JSON.parse(fs.readFileSync(destination, "utf8"));
    if (flatten(existing).length === enEntries.length) {
      console.log(`skip ${target} (up to date)`);
      return;
    }
  }

  cache[target] ??= {};
  const dictionary = cache[target];

  const templates = enEntries.map(([key, value]) => ({
    key,
    pieces: value.split(SPLIT_RE),
  }));

  const pending = new Set();
  for (const { pieces } of templates) {
    pieces.forEach((piece, index) => {
      if (index % 2 === 0 && piece.trim().length > 0 && !(piece in dictionary)) pending.add(piece);
    });
  }

  const work = batches([...pending]);
  for (let i = 0; i < work.length; i += 1) {
    const batch = work[i];
    const translated = await translateBatch(batch, target);
    batch.forEach((source, index) => {
      dictionary[source] = translated[index] ?? source;
    });
    fs.writeFileSync(cacheFile, JSON.stringify(cache));
    if (i % 10 === 0) console.log(` ${target}: ${i + 1}/${work.length} batches`);
    await delay(140);
  }

  const entries = templates.map(({ key, pieces }) => {
    const rebuilt = pieces
      .map((piece, index) => {
        if (index % 2 === 0) return piece.trim().length === 0 ? piece : sanitize(dictionary[piece] ?? piece);
        return piece;
      })
      .join("");
    return [key, rebuilt];
  });

  fs.writeFileSync(destination, `${JSON.stringify(unflatten(entries), null, 2)}\n`, "utf8");
  console.log(`wrote ${target}.json`);
}

async function main() {
  fs.mkdirSync(cacheDir, { recursive: true });
  const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, "utf8")) : {};

  const en = (await loadDictionary("en.ts")).en;
  const tr = (await loadDictionary("tr.ts")).tr;
  const enEntries = flatten(en);

  fs.writeFileSync(path.join(localesDir, "en.json"), `${JSON.stringify(en, null, 2)}\n`, "utf8");
  fs.writeFileSync(path.join(localesDir, "tr.json"), `${JSON.stringify(tr, null, 2)}\n`, "utf8");

  const manifest = JSON.parse(fs.readFileSync(path.join(localesDir, "..", "languages.json"), "utf8"));
  const targets = manifest.languages
    .map((language) => language.code)
    .filter((code) => code !== "en" && code !== "tr")
    .filter((code) => !only || only.includes(code));

  const queue = [...targets];
  const workers = Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const target = queue.shift();
      try {
        await buildLocale(target, enEntries, cache);
      } catch (error) {
        console.error(`failed ${target}: ${error.message}`);
      }
    }
  });
  await Promise.all(workers);
  fs.writeFileSync(cacheFile, JSON.stringify(cache));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
