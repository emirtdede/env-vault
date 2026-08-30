import { invoke } from "@tauri-apps/api/core";
import { BatchImportReport, CollisionPolicy, ImportResult } from "../../types";

export const importApi = {
  importEnvFile: async (
    projectId: string,
    filePath: string,
    collision: CollisionPolicy = "ask"
  ): Promise<ImportResult> => {
    return await invoke<ImportResult>("import_env_file", {
      projectId,
      filePath,
      collision,
    });
  },

  importEnvFiles: async (
    projectId: string,
    filePaths: string[],
    collision: CollisionPolicy = "ask"
  ): Promise<BatchImportReport> => {
    return await invoke<BatchImportReport>("import_env_files", {
      projectId,
      filePaths,
      collision,
    });
  },

  importDirectoryEnvFiles: async (
    projectId: string,
    directoryPath: string,
    recursive = false,
    collision: CollisionPolicy = "ask"
  ): Promise<BatchImportReport> => {
    return await invoke<BatchImportReport>("import_directory_env_files", {
      projectId,
      directoryPath,
      recursive,
      collision,
    });
  },

  importBatchRawDocuments: async (
    projectId: string,
    entries: { filename: string; content: string }[],
    collision: CollisionPolicy = "ask"
  ): Promise<BatchImportReport> => {
    return await invoke<BatchImportReport>("import_batch_raw_documents", {
      projectId,
      entries,
      collision,
    });
  },
};
