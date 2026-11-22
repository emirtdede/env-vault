import { describe, it, expect, vi, beforeEach } from "vitest";
import { answer } from "./engine";
import { projectApi } from "../tauri/project-api";
import { envApi } from "../tauri/env-api";
import { EnvDocument, EnvSecretPayload, Project } from "../../types";

vi.mock("../tauri/project-api", () => ({
  projectApi: { listProjects: vi.fn() },
}));

vi.mock("../tauri/env-api", () => ({
  envApi: { listEnvDocuments: vi.fn(), readEnvDocument: vi.fn() },
}));

const atlas: Project = {
  id: "p1",
  name: "Atlas API",
  description: "Customer-facing gateway",
  sourcePath: "C:\\work\\atlas",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
  favorite: true,
  sortOrder: 0,
};

const orbit: Project = {
  ...atlas,
  id: "p2",
  name: "Orbit Dashboard",
  description: "Internal analytics",
  sourcePath: "C:\\work\\orbit",
};

const production: EnvDocument = {
  id: "d1",
  projectId: "p1",
  filename: ".env.production",
  sourceImportedAt: "2026-01-03T00:00:00Z",
  createdAt: "2026-01-03T00:00:00Z",
  updatedAt: "2026-01-03T00:00:00Z",
  byteLength: 40,
  keyCount: 1,
};

const local: EnvDocument = { ...production, id: "d2", filename: ".env.local" };

const payload: EnvSecretPayload = {
  filename: ".env.production",
  encoding: "utf-8",
  lineEnding: "lf",
  hadBom: false,
  rawText: "STRIPE_KEY=sk_live_123\n",
};

const context = { aiEnabled: false, aiModel: "" };

describe("assistant intent routing", () => {
  beforeEach(() => {
    vi.mocked(projectApi.listProjects).mockResolvedValue([atlas, orbit]);
    vi.mocked(envApi.listEnvDocuments).mockResolvedValue([production, local]);
    vi.mocked(envApi.readEnvDocument).mockResolvedValue(payload);
  });

  it("asks for help on an empty question", async () => {
    expect(await answer("   ", context)).toEqual({ kind: "help" });
  });

  it("lists projects when the user asks for all of them", async () => {
    const result = await answer("show all projects", context);
    expect(result.kind).toBe("project-list");
    expect(projectApi.listProjects).toHaveBeenCalled();
  });

  it("returns a named project and its files for an env request", async () => {
    const result = await answer("bring me the env file of Atlas API", context);
    expect(result).toMatchObject({ kind: "env-file", project: { id: "p1" } });
    if (result.kind !== "env-file") throw new Error("wrong kind");
    expect(result.documents).toHaveLength(2);
  });

  it("returns the exact document when the filename is named", async () => {
    const result = await answer("open .env.local from Atlas", context);
    if (result.kind !== "env-file") throw new Error("wrong kind");
    expect(result.active?.document.filename).toBe(".env.local");
    expect(envApi.readEnvDocument).toHaveBeenCalledWith("d2");
  });

  it("searches within a project and masks values", async () => {
    const result = await answer("where is stripe in Atlas", context);
    if (result.kind !== "content-search") throw new Error("wrong kind");
    expect(result.hits[0]?.keys).toEqual(["STRIPE_KEY"]);
    expect(JSON.stringify(result)).not.toContain("sk_live_123");
  });

  it("falls back to the metadata index when no project name matches", async () => {
    const result = await answer("analytics", context);
    if (result.kind !== "search") throw new Error("wrong kind");
    expect(result.matches[0]?.projectName).toBe("Orbit Dashboard");
  });

  it("uses the local model only when enabled and the index is empty", async () => {
    vi.mocked(projectApi.listProjects).mockResolvedValue([]);
    const generate = vi.fn().mockResolvedValue("A short answer.");
    const result = await answer("how do I rotate keys", {
      aiEnabled: true,
      aiModel: "llama3",
      generate,
    });
    expect(result).toEqual({ kind: "ai", text: "A short answer." });
    expect(generate).toHaveBeenCalledOnce();
  });

  it("maps a failing model to a typed error", async () => {
    vi.mocked(projectApi.listProjects).mockResolvedValue([]);
    const result = await answer("how do I rotate keys", {
      aiEnabled: true,
      aiModel: "llama3",
      generate: vi.fn().mockRejectedValue(new Error("down")),
    });
    expect(result).toEqual({ kind: "error", code: "ai-failed" });
  });

  it("maps a vault read failure to a typed error", async () => {
    vi.mocked(projectApi.listProjects).mockRejectedValue(new Error("locked"));
    expect(await answer("atlas", context)).toEqual({
      kind: "error",
      code: "read-failed",
    });
  });
});
