import React from "react";
import { invoke } from "@tauri-apps/api/core";

/**
 * Safely opens an external URL using the system's default web browser
 * via Tauri native command, falling back to window.open if needed.
 */
export async function openExternalUrl(url: string, e?: React.MouseEvent): Promise<void> {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  try {
    await invoke("open_external_url", { url });
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("Tauri invoke('open_external_url') failed, falling back to window.open:", err);
    }
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {}
  }

}
