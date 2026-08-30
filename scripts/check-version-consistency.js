import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function getTauriVersion() {
  const tauriConfPath = path.join(rootDir, "src-tauri", "tauri.conf.json");
  const content = JSON.parse(fs.readFileSync(tauriConfPath, "utf-8"));
  return content.version;
}

function getPackageVersion() {
  const pkgPath = path.join(rootDir, "package.json");
  const content = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  return content.version;
}

function getCargoVersion() {
  const cargoPath = path.join(rootDir, "src-tauri", "Cargo.toml");
  const content = fs.readFileSync(cargoPath, "utf-8");
  const match = content.match(/^version\s*=\s*"([^"]+)"/m);
  if (!match) {
    throw new Error("Cargo.toml version field not found!");
  }
  return match[1];
}

try {
  const tauriVer = getTauriVersion();
  const pkgVer = getPackageVersion();
  const cargoVer = getCargoVersion();

  console.log("=== Env Vault Version Consistency Check ===");
  console.log(`- tauri.conf.json : ${tauriVer}`);
  console.log(`- package.json    : ${pkgVer}`);
  console.log(`- Cargo.toml      : ${cargoVer}`);

  if (tauriVer !== pkgVer || tauriVer !== cargoVer) {
    console.error("\n❌ VERSION MISMATCH DETECTED!");
    console.error(`tauri.conf.json (${tauriVer}) must match package.json (${pkgVer}) and Cargo.toml (${cargoVer})`);
    process.exit(1);
  }

  console.log("\n✅ All version declarations are 100% consistent!");
  process.exit(0);
} catch (err) {
  console.error("❌ Version check error:", err.message);
  process.exit(1);
}
