import { invoke } from "@tauri-apps/api/core";
import { Project } from "../../types";

export const projectApi = {
  listProjects: async (): Promise<Project[]> => {
    return await invoke<Project[]>("list_projects");
  },

  createProject: async (
    name: string,
    description?: string,
    sourcePath?: string
  ): Promise<Project> => {
    return await invoke<Project>("create_project", {
      name,
      description: description || null,
      sourcePath: sourcePath || null,
    });
  },

  updateProject: async (
    id: string,
    name: string,
    description?: string,
    sourcePath?: string,
    favorite?: boolean
  ): Promise<Project> => {
    return await invoke<Project>("update_project", {
      id,
      name,
      description: description || null,
      sourcePath: sourcePath || null,
      favorite: favorite !== undefined ? favorite : null,
    });
  },

  deleteProject: async (id: string): Promise<void> => {
    await invoke("delete_project", { id });
  },
};
