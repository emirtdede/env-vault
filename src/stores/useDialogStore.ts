import { create } from "zustand";
import { Project } from "../types";

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
}

export interface CollisionDialogOptions {
  filename: string;
  onResolve: (action: "overwrite" | "rename" | "cancel") => void;
}

interface DialogStoreState {
  isCreateProjectOpen: boolean;
  isAddEnvOpen: boolean;
  isSettingsOpen: boolean;
  isBackupOpen: boolean;
  isRestoreOpen: boolean;
  isChangePasswordOpen: boolean;
  isCloseActionOpen: boolean;
  editingProject: Project | null;
  confirmDialog: ConfirmDialogOptions | null;
  collisionDialog: CollisionDialogOptions | null;

  openCreateProject: () => void;
  closeCreateProject: () => void;

  openAddEnv: () => void;
  closeAddEnv: () => void;

  openSettings: () => void;
  closeSettings: () => void;

  openBackup: () => void;
  closeBackup: () => void;

  openRestore: () => void;
  closeRestore: () => void;

  openChangePassword: () => void;
  closeChangePassword: () => void;

  openCloseAction: () => void;
  closeCloseAction: () => void;

  openEditProject: (project: Project) => void;
  closeEditProject: () => void;

  showConfirm: (options: ConfirmDialogOptions) => void;
  closeConfirm: () => void;

  showCollision: (options: CollisionDialogOptions) => void;
  closeCollision: () => void;
}

export const useDialogStore = create<DialogStoreState>((set) => ({
  isCreateProjectOpen: false,
  isAddEnvOpen: false,
  isSettingsOpen: false,
  isBackupOpen: false,
  isRestoreOpen: false,
  isChangePasswordOpen: false,
  isCloseActionOpen: false,
  editingProject: null,
  confirmDialog: null,
  collisionDialog: null,

  openCreateProject: () => set({ isCreateProjectOpen: true }),
  closeCreateProject: () => set({ isCreateProjectOpen: false }),

  openAddEnv: () => set({ isAddEnvOpen: true }),
  closeAddEnv: () => set({ isAddEnvOpen: false }),

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),

  openBackup: () => set({ isBackupOpen: true }),
  closeBackup: () => set({ isBackupOpen: false }),

  openRestore: () => set({ isRestoreOpen: true }),
  closeRestore: () => set({ isRestoreOpen: false }),

  openChangePassword: () => set({ isChangePasswordOpen: true }),
  closeChangePassword: () => set({ isChangePasswordOpen: false }),

  openCloseAction: () => set({ isCloseActionOpen: true }),
  closeCloseAction: () => set({ isCloseActionOpen: false }),

  openEditProject: (project: Project) => set({ editingProject: project }),
  closeEditProject: () => set({ editingProject: null }),

  showConfirm: (options) => set({ confirmDialog: options }),
  closeConfirm: () => set({ confirmDialog: null }),

  showCollision: (options) => set({ collisionDialog: options }),
  closeCollision: () => set({ collisionDialog: null }),
}));
