import { invoke } from "@tauri-apps/api/core";
import { EnvDocument, EnvSecretPayload } from "../../types";

export const envApi = {
  listEnvDocuments: async (projectId: string): Promise<EnvDocument[]> => {
    return await invoke<EnvDocument[]>("list_env_documents", { projectId });
  },

  readEnvDocument: async (envId: string): Promise<EnvSecretPayload> => {
    return await invoke<EnvSecretPayload>("read_env_document", { envId });
  },

  createEnvDocument: async (
    projectId: string,
    filename: string,
    rawText: string
  ): Promise<EnvDocument> => {
    return await invoke<EnvDocument>("create_env_document", {
      projectId,
      filename,
      rawText,
    });
  },

  updateEnvDocument: async (
    envId: string,
    rawText: string
  ): Promise<EnvDocument> => {
    return await invoke<EnvDocument>("update_env_document", {
      envId,
      rawText,
    });
  },

  renameEnvDocument: async (
    envId: string,
    newFilename: string
  ): Promise<EnvDocument> => {
    return await invoke<EnvDocument>("rename_env_document", {
      envId,
      newFilename,
    });
  },

  deleteEnvDocument: async (envId: string): Promise<void> => {
    await invoke("delete_env_document", { envId });
  },

  deleteEnvDocumentsBatch: async (envIds: string[]): Promise<void> => {
    await invoke("delete_env_documents_batch", { envIds });
  },
};

