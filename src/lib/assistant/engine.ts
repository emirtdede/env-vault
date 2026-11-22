import { Project, EnvDocument, EnvSecretPayload } from "../../types";
import { projectApi } from "../tauri/project-api";
import { envApi } from "../tauri/env-api";
import { buildIndex, searchIndex, searchProjectContent, tokenize, ContentHit, RagMatch } from "./rag";

export type AssistantResult =
  | { kind: "project-list"; projects: Project[] }
  | {
      kind: "env-file";
      project: Project;
      documents: EnvDocument[];
      active?: { document: EnvDocument; payload: EnvSecretPayload };
    }
  | { kind: "search"; matches: RagMatch[] }
  | { kind: "content-search"; hits: ContentHit[] }
  | { kind: "ai"; text: string }
  | { kind: "help" }
  | { kind: "error"; code: "read-failed" | "ai-failed" };

function normalize(value: string): string {
  // Locale independent on purpose: a Turkish runtime would fold "I" to a
  // dotless "ı" and break every ASCII search.
  return value.toLowerCase().trim();
}

function matchProject(projects: Project[], question: string): Project | null {
  const terms = tokenize(question);
  const folded = normalize(question);
  const named = projects
    .map((project) => {
      const name = normalize(project.name);
      const mentionsName =
        folded.includes(name) ||
        terms.some((term) => name.includes(term) || term.includes(name));
      const tokenScore = tokenize(project.name).filter((token) =>
        terms.includes(token)
      ).length;
      return { project, score: (mentionsName ? 2 : 0) + tokenScore };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
  return named[0]?.project ?? null;
}

function matchDocument(documents: EnvDocument[], question: string): EnvDocument | null {
  const lower = normalize(question);
  const direct = documents.find((document) =>
    lower.includes(normalize(document.filename))
  );
  if (direct) return direct;
  if (documents.length === 1) return documents[0] ?? null;
  return null;
}

const ENV_HINTS = [".env", "env file", "env dosya", "ortam dosya", "environment file", "env'ini", "envini"];
const SEARCH_HINTS = ["find", "where", "search", "look for", "bul", "nerede", "ara", "hangi dosya"];
const LIST_HINTS = ["list", "show all", "projects", "projeler", "tüm proje", "hepsi"];

export interface AssistantContext {
  aiEnabled: boolean;
  aiModel: string;
  generate?: (prompt: string, system: string) => Promise<string>;
}

/**
 * Deterministic first, AI second. The local engine answers the common
 * "bring me the env file of project X" requests without a model, so the
 * assistant remains useful on machines with no local AI installed.
 */
export async function answer(
  question: string,
  context: AssistantContext
): Promise<AssistantResult> {
  const text = normalize(question);
  if (!text) return { kind: "help" };

  try {
    const projects = await projectApi.listProjects();

    if (LIST_HINTS.some((hint) => text.includes(hint))) {
      return { kind: "project-list", projects };
    }

    const project = matchProject(projects, question);

    if (SEARCH_HINTS.some((hint) => text.includes(hint)) && project) {
      const documents = await envApi.listEnvDocuments(project.id);
      const hits = await searchProjectContent(project, documents, question);
      if (hits.length > 0) return { kind: "content-search", hits };
    }

    if (project && ENV_HINTS.some((hint) => text.includes(hint))) {
      const documents = await envApi.listEnvDocuments(project.id);
      const document = matchDocument(documents, question);
      if (document) {
        const payload = await envApi.readEnvDocument(document.id);
        return { kind: "env-file", project, documents, active: { document, payload } };
      }
      return { kind: "env-file", project, documents };
    }

    if (project) {
      const documents = await envApi.listEnvDocuments(project.id);
      return { kind: "env-file", project, documents };
    }

    const index = await buildIndex();
    const matches = searchIndex(index, question);
    if (matches.length > 0) return { kind: "search", matches };

    if (context.aiEnabled && context.generate) {
      const system = [
        "You are the offline assistant inside Env Vault, a local-first encrypted environment vault.",
        "Answer briefly and never invent secret values. If the user asks for a secret, tell them to open the project.",
        "Only the project names below are known; do not claim access to any file you were not given.",
        `Projects: ${projects.map((entry) => entry.name).join(", ") || "none"}.`,
      ].join(" ");
      try {
        const generated = await context.generate(question, system);
        return { kind: "ai", text: generated };
      } catch {
        return { kind: "error", code: "ai-failed" };
      }
    }

    return { kind: "help" };
  } catch {
    return { kind: "error", code: "read-failed" };
  }
}

export { searchIndex, buildIndex };
