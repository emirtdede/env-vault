export type VaultState =
  | "uninitialized"
  | "locked"
  | "unlocking"
  | "unlocked"
  | "locking"
  | "error";

export type ThemeType =
  // Koyu Temalar (Dark Themes)
  | "siyah"
  | "koyu-gri"
  | "koyu-mavi"
  | "koyu-mor"
  | "koyu-yesil"
  | "koyu-kirmizi"
  | "koyu-turuncu"
  | "koyu-sari"
  // Açık Temalar (Light Themes)
  | "beyaz"
  | "acik-gri"
  | "acik-mavi"
  | "acik-mor"
  | "acik-yesil"
  | "acik-kirmizi"
  | "acik-turuncu"
  | "acik-sari";

export type AutoLockDuration = 1 | 5 | 15 | 30 | 60 | 0; // 0 = When app closes

export type CollisionPolicy = "ask" | "overwrite" | "rename" | "cancel";

export type CloseAction = "ask" | "minimize-to-tray" | "close-app";

export type Language = "tr" | "en";

export interface Project {
  id: string;
  name: string;
  description?: string;
  sourcePath?: string;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  sortOrder?: number;
}

export interface EnvDocument {
  id: string;
  projectId: string;
  filename: string;
  displayName?: string;
  sourcePath?: string;
  sourceImportedAt: string;
  createdAt: string;
  updatedAt: string;
  byteLength: number;
  keyCount?: number;
  keys?: string[];
}

export interface EnvSecretPayload {
  filename: string;
  encoding: "utf-8";
  lineEnding: "lf" | "crlf";
  hadBom: boolean;
  rawText: string;
}

export interface AppSettings {
  theme: ThemeType;
  language: Language;
  autoLockMinutes: AutoLockDuration;
  autoUnlockWithWindows: boolean;
  autoHideSecrets: boolean;
  clearClipboardSeconds: number;
  askExportLocation: boolean;
  defaultExportDirectory: string | null;
  exportCollisionPolicy: CollisionPolicy;
  closeAction: CloseAction;
  reduceMotion: boolean;
}

export interface ImportResult {
  document: EnvDocument;
  renamedFrom?: string | null;
}

export interface BatchImportReport {
  totalFiles: number;
  importedCount: number;
  skippedCount: number;
  failedCount: number;
  results: ImportResult[];
  errors: string[];
}

export interface ExportReport {
  destinationPath: string;
  bytesWritten: number;
  filename: string;
}

export interface BatchExportReport {
  totalRequested: number;
  exportedCount: number;
  destinationDirectory: string;
  reports: ExportReport[];
  errors: string[];
}

export interface BackupPreview {
  formatVersion: number;
  createdAt: string;
  projectCount: number;
  envDocumentCount: number;
}

export interface AppErrorResponse {
  code: string;
  message: string;
  details?: string;
}
