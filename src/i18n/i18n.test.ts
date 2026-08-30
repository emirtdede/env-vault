import { describe, it, expect } from "vitest";
import { tr } from "./locales/tr";
import { en } from "./locales/en";
import { translate } from "./index";

function extractAllKeys(obj: any, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      keys = keys.concat(extractAllKeys(v, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

describe("i18n 100% Parity and Integrity", () => {
  const trKeys = extractAllKeys(tr);
  const enKeys = extractAllKeys(en);

  it("has exactly matching key sets between TR and EN dictionaries (100% parity)", () => {
    expect(trKeys.length).toBeGreaterThan(50);
    expect(trKeys.sort()).toEqual(enKeys.sort());
  });

  it("contains no empty translation strings in Turkish dictionary", () => {
    for (const key of trKeys) {
      const val = translate("tr", key);
      expect(val).toBeDefined();
      expect(val.trim().length).toBeGreaterThan(0);
      expect(val).not.toBe(key); // should not fall back to key
    }
  });

  it("contains no empty translation strings in English dictionary", () => {
    for (const key of enKeys) {
      const val = translate("en", key);
      expect(val).toBeDefined();
      expect(val.trim().length).toBeGreaterThan(0);
      expect(val).not.toBe(key); // should not fall back to key
    }
  });

  it("correctly interpolates parameter placeholders", () => {
    const trText = translate("tr", "project.deleteConfirmDesc", { name: "TestApp" });
    expect(trText).toContain('"TestApp"');

    const enText = translate("en", "project.deleteConfirmDesc", { name: "TestApp" });
    expect(enText).toContain('"TestApp"');
  });
});
