import { invoke } from "@tauri-apps/api/core";

export interface AiModel {
  name: string;
  size: number;
  modifiedAt: string;
}

export interface AiStatus {
  available: boolean;
  models: AiModel[];
  endpoint: string;
}

export interface AiAnswer {
  text: string;
  model: string;
}

export const aiApi = {
  status: (): Promise<AiStatus> => invoke("ai_status"),
  generate: (model: string, prompt: string, system?: string): Promise<AiAnswer> =>
    invoke("ai_generate", { model, prompt, system: system ?? null }),
  pull: (model: string): Promise<AiStatus> => invoke("ai_pull", { model }),
  remove: (model: string): Promise<AiStatus> => invoke("ai_delete", { model }),
  sendWebhook: (event: string, message: string): Promise<void> =>
    invoke("webhook_send", { event, message }),
};
