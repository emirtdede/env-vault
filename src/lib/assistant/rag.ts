import { projectApi } from "../tauri/project-api";
import { envApi } from "../tauri/env-api";
import { EnvDocument, Project } from "../../types";

/**
 * A deliberately small, local retrieval index. It reads project metadata and
 * environment *key names* only; secret values are fetched exclusively when the
 * user asks for one specific file, and never leave the machine.
 */
export interface RagChunk {
  id: string;
  projectId: string;
  projectName: string;
  documentId?: string;
  documentName?: string;
  text: string;
}

export interface RagMatch extends RagChunk {
  score: number;
}

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "this", "that", "from", "what", "which",
  "where", "when", "how", "please", "show", "give", "get", "find", "my",
  "bir", "ve", "ile", "için", "bu", "şu", "olan", "olarak", "hangi",
  "nedir", "göster", "getir", "bul", "benim", "proje", "projemin",
]);

/**
 * Matching is deliberately locale independent. `toLocaleLowerCase` would turn
 * "STRIPE_KEY" into "strıpe_key" on a Turkish machine, which would make every
 * search miss. Only presentation uses locale-aware casing.
 */
function fold(value: string): string {
  return value.toLowerCase();
}

export function tokenize(value: string): string[] {
  return fold(value)
    .split(/[^\p{L}\p{N}_.-]+/u)
    .map((token) => token.replace(/^[-_.]+|[-_.]+$/g, ""))
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function scoreChunk(chunk: RagChunk, terms: string[]): number {
  if (terms.length === 0) return 0;
  const haystack = fold(chunk.text);
  let score = 0;
  for (const term of terms) {
    if (!haystack.includes(term)) continue;
    score += 1;
    if (fold(chunk.projectName).includes(term)) score += 2;
    if (chunk.documentName && fold(chunk.documentName).includes(term)) score += 1;
  }
  return score / terms.length;
}

/** Builds a metadata-only index for every project in the vault. */
export async function buildIndex(): Promise<RagChunk[]> {
  const projects = await projectApi.listProjects();
  const chunks: RagChunk[] = [];
  await Promise.all(
    projects.map(async (project: Project) => {
      chunks.push({
        id: `${project.id}:meta`,
        projectId: project.id,
        projectName: project.name,
        text: [
          project.name,
          project.description ?? "",
          project.sourcePath ?? "",
        ].join(" "),
      });
      try {
        const documents = await envApi.listEnvDocuments(project.id);
        for (const document of documents) {
          chunks.push({
            id: `${project.id}:${document.id}`,
            projectId: project.id,
            projectName: project.name,
            documentId: document.id,
            documentName: document.filename,
            text: `${project.name} ${document.filename}`,
          });
        }
      } catch {
        // A single unreadable project must not invalidate the whole index.
      }
    })
  );
  return chunks;
}

/** Scores an existing index with the obvious, explainable keyword model. */
export function searchIndex(chunks: RagChunk[], query: string, limit = 6): RagMatch[] {
  const terms = tokenize(query);
  return chunks
    .map((chunk) => ({ ...chunk, score: scoreChunk(chunk, terms) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export interface ContentHit {
  projectName: string;
  documentName: string;
  keys: string[];
  lines: string[];
}

/**
 * Searches the *decrypted* contents of the requested project. Only key names
 * and masked lines are returned so values stay out of the chat transcript
 * unless the user explicitly opens the file.
 */
export async function searchProjectContent(
  project: Project,
  documents: EnvDocument[],
  query: string
): Promise<ContentHit[]> {
  const terms = tokenize(query);
  if (terms.length === 0) return [];
  const hits: ContentHit[] = [];
  for (const document of documents) {
    try {
      const payload = await envApi.readEnvDocument(document.id);
      const lines = payload.rawText.split(/\r?\n/);
      const matched = lines.filter((line) => {
        const lower = fold(line);
        return terms.some((term) => lower.includes(term));
      });
      if (matched.length === 0) continue;
      const keys = matched
        .filter((line) => line.includes("="))
        .map((line) => line.split("=")[0]?.trim() ?? "")
        .filter(Boolean);
      hits.push({
        projectName: project.name,
        documentName: document.filename,
        keys: [...new Set(keys)].slice(0, 12),
        lines: matched.slice(0, 8).map((line) => line.replace(/=.*$/, "=<hidden>")),
      });
    } catch {
      // Locked or unreadable files are skipped silently.
    }
  }
  return hits;
}
