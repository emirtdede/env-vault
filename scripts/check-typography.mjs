#!/usr/bin/env node
/**
 * Typography gate.
 *
 * Enforces the project writing rules:
 *  - No long dashes (em dash U+2014, en dash U+2013) anywhere in source or docs.
 *  - No emoji in source, docs or the README.
 *
 * Hyphens and arrows (->) are the accepted substitutes.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const ROOT = process.cwd();
const TARGETS = ["src", "src-tauri/src", "scripts", "docs", "README.md"];
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".css",
  ".html",
  ".md",
  ".rs",
  ".toml",
  ".yml",
  ".yaml",
]);
const SKIP_DIRECTORIES = new Set(["node_modules", "target", "dist", "screenshots"]);

const LONG_DASH = /[\u2013\u2014]/g;
const EMOJI = /\p{Extended_Pictographic}/gu;
// Copyright, registered and trademark signs are typographic marks, not emoji.
const ALLOWED_MARKS = new Set(["\u00A9", "\u00AE", "\u2122"]);

function walk(path) {
  let stats;
  try {
    stats = statSync(path);
  } catch {
    return [];
  }
  if (stats.isFile()) return [path];
  if (!stats.isDirectory()) return [];
  const entries = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRECTORIES.has(entry.name)) continue;
    entries.push(...walk(join(path, entry.name)));
  }
  return entries;
}

const findings = [];
for (const target of TARGETS) {
  for (const file of walk(join(ROOT, target))) {
    if (!TEXT_EXTENSIONS.has(extname(file))) continue;
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    lines.forEach((line, index) => {
      for (const match of line.matchAll(LONG_DASH)) {
        findings.push({
          file: relative(ROOT, file),
          line: index + 1,
          kind: "long dash",
          text: line.trim().slice(0, 120),
          char: match[0],
        });
      }
      for (const match of line.matchAll(EMOJI)) {
        if (ALLOWED_MARKS.has(match[0])) continue;
        findings.push({
          file: relative(ROOT, file),
          line: index + 1,
          kind: "emoji",
          text: line.trim().slice(0, 120),
          char: match[0],
        });
      }
    });
  }
}

if (findings.length > 0) {
  console.error(`Typography check failed with ${findings.length} violation(s):`);
  for (const finding of findings.slice(0, 100)) {
    console.error(
      `  ${finding.file}:${finding.line} [${finding.kind}] ${JSON.stringify(finding.char)} ${finding.text}`,
    );
  }
  if (findings.length > 100) {
    console.error(`  ... and ${findings.length - 100} more`);
  }
  process.exit(1);
}

console.log("Typography check passed: no long dashes and no emoji.");
