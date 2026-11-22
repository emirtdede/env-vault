import { create } from "zustand";
import { CloudRestoreProposal } from "../types";

interface RestorePromptState {
  proposal: CloudRestoreProposal | null;
  dismissed: boolean;
  setProposal: (proposal: CloudRestoreProposal | null) => void;
  dismiss: () => void;
}

export const useRestorePromptStore = create<RestorePromptState>((set) => ({
  proposal: null,
  dismissed: false,
  setProposal: (proposal) => set({ proposal }),
  dismiss: () => set({ dismissed: true, proposal: null }),
}));
