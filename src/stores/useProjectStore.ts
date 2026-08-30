import { create } from "zustand";
import { Project } from "../types";
import { projectApi } from "../lib/tauri/project-api";

interface ProjectStoreState {
  projects: Project[];
  selectedProjectId: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  selectProject: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  createProject: (name: string, description?: string, sourcePath?: string) => Promise<Project>;
  updateProject: (id: string, name: string, description?: string, sourcePath?: string, favorite?: boolean) => Promise<Project>;
  toggleFavorite: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  projects: [],
  selectedProjectId: null,
  searchQuery: "",
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    try {
      set({ isLoading: true, error: null });
      const projects = await projectApi.listProjects();
      const currentSelected = get().selectedProjectId;
      
      // If current selected project no longer exists or none selected, pick first project
      let selectedProjectId = currentSelected;
      if (projects.length > 0) {
        if (!currentSelected || !projects.some((p) => p.id === currentSelected)) {
          selectedProjectId = projects[0]?.id || null;
        }
      } else {
        selectedProjectId = null;
      }

      set({ projects, selectedProjectId, isLoading: false });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Projeler yüklenemedi.";
      set({ error: msg, isLoading: false });
    }
  },

  selectProject: (id) => set({ selectedProjectId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  createProject: async (name, description, sourcePath) => {
    try {
      set({ isLoading: true, error: null });
      const project = await projectApi.createProject(name, description, sourcePath);
      set((state) => ({
        projects: [...state.projects, project],
        selectedProjectId: project.id,
        isLoading: false,
      }));
      return project;
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Proje oluşturulamadı.";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  updateProject: async (id, name, description, sourcePath, favorite) => {
    try {
      set({ isLoading: true, error: null });
      const updated = await projectApi.updateProject(id, name, description, sourcePath, favorite);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        isLoading: false,
      }));
      return updated;
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Proje güncellenemedi.";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  toggleFavorite: async (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;
    await get().updateProject(id, project.name, project.description, project.sourcePath, !project.favorite);
  },

  deleteProject: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await projectApi.deleteProject(id);
      set((state) => {
        const remaining = state.projects.filter((p) => p.id !== id);
        return {
          projects: remaining,
          selectedProjectId: remaining[0]?.id || null,
          isLoading: false,
        };
      });
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || "Proje silinemedi.";
      set({ error: msg, isLoading: false });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
