import { describe, it, expect, vi, beforeEach } from "vitest";
import { tokenize, searchIndex, buildIndex, searchProjectContent } from "./rag";
import { projectApi } from "../tauri/project-api";
import { envApi } from "../tauri/env-api";
import { EnvDocument, Project } from "../../types";

vi.mock("../tauri/project-api", () => ({
  projectApi: { listProjects: vi.fn() },
}));

vi.mock("../tauri/env-api", () => ({
  envApi: { listEnvDocuments: vi.fn(), readEnvDocument: vi.fn() },
}));

const project: Project = {
  id: "p1",
  name: "Atlas API",
  description: "Customer-facing gateway",
  sourcePath: "C:\\work\\atlas",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
  favorite: false,
  sortOrder: 0,
};

const document: EnvDocument = {
  id: "d1",
  projectId: "p1",
  filename: ".env.production",
  sourceImportedAt: "2026-01-03T00:00:00Z",
  createdAt: "2026-01-03T00:00:00Z",
  updatedAt: "2026-01-03T00:00:00Z",
  byteLength: 120,
  keyCount: 3,
};

describe("assistant tokenizer", () => {
  it("drops stop words and short fragments", () => {
    expect(tokenize("Bring me the env file of my project please")).toEqual([
      "bring",
      "me",
      "env",
      "file",
      "of",
      "project",
    ]);
  });

  it("folds ASCII regardless of the runtime locale", () => {
    expect(tokenize("STRIPE_KEY")).toEqual(["stripe_key"]);
  });

  it("keeps dots, dashes and underscores inside filenames", () => {
    expect(tokenize(".env.production")).toEqual(["env.production"]);
  });

  it("handles Turkish stop words", () => {
    expect(tokenize("projemin env dosyasını getir")).toEqual(["env", "dosyasını"]);
  });

  it("returns nothing for punctuation only", () => {
    expect(tokenize("?!...")).toEqual([]);
  });
});

describe("metadata index", () => {
  beforeEach(() => {
    vi.mocked(projectApi.listProjects).mockResolvedValue([project]);
    vi.mocked(envApi.listEnvDocuments).mockResolvedValue([document]);
  });

  it("indexes project and file names without reading contents", async () => {
    const chunks = await buildIndex();
    expect(chunks.map((chunk) => chunk.id)).toEqual(["p1:meta", "p1:d1"]);
    expect(chunks[1]?.text).toContain(".env.production");
    expect(envApi.readEnvDocument).not.toHaveBeenCalled();
  });

  it("survives one unreadable project", async () => {
    vi.mocked(projectApi.listProjects).mockResolvedValue([
      project,
      { ...project, id: "p2", name: "Relay Worker" },
    ]);
    vi.mocked(envApi.listEnvDocuments).mockImplementation(async (id: string) => {
      if (id === "p2") throw new Error("locked");
      return [document];
    });
    const chunks = await buildIndex();
    expect(chunks.some((chunk) => chunk.id === "p1:d1")).toBe(true);
    expect(chunks.some((chunk) => chunk.id === "p2:meta")).toBe(true);
  });

  it("ranks a project match before a document and honours the limit", async () => {
    const chunks = await buildIndex();
    const matches = searchIndex(chunks, "atlas", 1);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.documentName).toBeUndefined();
    expect(searchIndex(chunks, "unknown thing")).toEqual([]);
  });
});

describe("content search", () => {
  beforeEach(() => {
    vi.mocked(envApi.readEnvDocument).mockResolvedValue({
      rawText: "STRIPE_KEY=sk_live_123\nDATABASE_URL=postgres://user:pass@host/db\n",
      parsed: [],
    } as never);
  });

  it("masks values and reports only matching keys", async () => {
    const hits = await searchProjectContent(project, [document], "stripe");
    expect(hits).toHaveLength(1);
    expect(hits[0]?.keys).toEqual(["STRIPE_KEY"]);
    expect(hits[0]?.lines).toEqual(["STRIPE_KEY=<hidden>"]);
    expect(JSON.stringify(hits)).not.toContain("sk_live_123");
  });

  it("returns nothing when no term matches", async () => {
    expect(await searchProjectContent(project, [document], "nothing")).toEqual([]);
  });
});
