export type VaultState =
  | "uninitialized"
  | "locked"
  | "unlocking"
  | "unlocked"
  | "locking"
  | "error";

export type BuiltInTheme =
  | "siyah"
  | "koyu-gri"
  | "koyu-mavi"
  | "koyu-mor"
  | "koyu-yesil"
  | "koyu-kirmizi"
  | "koyu-turuncu"
  | "koyu-sari"
  | "beyaz"
  | "acik-gri"
  | "acik-mavi"
  | "acik-mor"
  | "acik-yesil"
  | "acik-kirmizi"
  | "acik-turuncu"
  | "acik-sari"
  | "ozel";

export type ThemeType = BuiltInTheme;

export type AutoLockDuration = 1 | 5 | 15 | 30 | 60 | 0;

export type CollisionPolicy = "ask" | "overwrite" | "rename" | "cancel";

export type CloseAction = "ask" | "minimize-to-tray" | "close-app";

export type AppIconTheme = "obsidian" | "porcelain" | "contrast" | "cyan";

/** Language code from the 73-language catalog in `src/i18n/languages.json`. */
export type Language = string;

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
  customAccent: string;
  followSystemTheme: boolean;
  iconTheme: AppIconTheme;
  uiScale: number;
  startWithWindows: boolean;
  startMinimized: boolean;
  globalShortcutEnabled: boolean;
  notificationsEnabled: boolean;
  notificationSound: boolean;
  autoSyncEnabled: boolean;
  onboardingCompleted: boolean;
  devBridgeEnabled: boolean;
  sidebarCollapsed: boolean;
  aiEnabled: boolean;
  aiModel: string;
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookToken: string;
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

export interface CloudProviderInfo {
  id: string;
  path: string;
  available: boolean;
  isDefault: boolean;
}

export interface CloudSnapshotSummary {
  projects: number;
  documents: number;
}

export interface CloudStatus {
  provider: string;
  folder: string | null;
  cloudDir: string | null;
  connected: boolean;
  autoSync: boolean;
  lastSync: string | null;
  backupFiles: number;
  summary: CloudSnapshotSummary | null;
  providerAvailable: boolean;
}

export interface CloudRestoreProposal {
  found: boolean;
  cloudDir: string;
  exportedAt: string | null;
  summary: CloudSnapshotSummary | null;
}

export interface CloudSyncOutcome {
  written: boolean;
  skippedEmpty: boolean;
  exportedAt: string;
  backupFiles: number;
  summary: CloudSnapshotSummary;
}

export interface SystemInfo {
  appVersion: string;
  os: string;
  arch: string;
  locale: string;
  vaultState: string;
}
