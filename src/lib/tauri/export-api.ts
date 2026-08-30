import { invoke } from "@tauri-apps/api/core";
import { BatchExportReport, CollisionPolicy, ExportReport } from "../../types";

export const exportApi = {
  exportEnvDocument: async (
    envId: string,
    targetPath?: string,
    defaultDirectory?: string,
    collision: CollisionPolicy = "ask"
  ): Promise<ExportReport> => {
    return await invoke<ExportReport>("export_env_document", {
      envId,
      targetPath: targetPath || null,
      defaultDirectory: defaultDirectory || null,
      collision,
    });
  },

  exportMultipleEnvDocuments: async (
    envIds: string[],
    targetDirectory: string,
    collision: CollisionPolicy = "ask"
  ): Promise<BatchExportReport> => {
    return await invoke<BatchExportReport>("export_multiple_env_documents", {
      envIds,
      targetDirectory,
      collision,
    });
  },

  exportProjectEnvDocuments: async (
    projectId: string,
    targetDirectory: string,
    collision: CollisionPolicy = "ask"
  ): Promise<BatchExportReport> => {
    return await invoke<BatchExportReport>("export_project_env_documents", {
      projectId,
      targetDirectory,
      collision,
    });
  },

  exportAllProjects: async (
    targetDirectory: string,
    collision: CollisionPolicy = "ask"
  ): Promise<BatchExportReport> => {
    return await invoke<BatchExportReport>("export_all_projects", {
      targetDirectory,
      collision,
    });
  },

  exportMergedProjectEnv: async (
    projectId: string,
    targetPath: string
  ): Promise<ExportReport> => {
    return await invoke<ExportReport>("export_merged_project_env", {
      projectId,
      targetPath,
    });
  },

  startVirtualFileDrag: async (envId: string): Promise<void> => {
    await invoke("start_virtual_file_drag", { envId });
  },
};
