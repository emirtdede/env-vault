import { useCallback } from "react";
import { AppSettings } from "../types";
import { settingsApi } from "./tauri/settings-api";
import { systemApi } from "./tauri/system-api";
import { usePreferencesStore, toSettingsPayload } from "../stores/usePreferencesStore";

/**
 * Applies a preference change locally, persists it, then lets the native layer
 * align registry autostart, shortcut and icon side effects. Failures are
 * surfaced to the caller so the UI can show a localised error.
 */
export async function persistSettingsPatch(
  patch: Partial<AppSettings>,
  options: { applySideEffects?: boolean } = {}
): Promise<AppSettings> {
  const store = usePreferencesStore.getState();
  store.updateSettings(patch);
  const merged = toSettingsPayload({ ...store, ...patch });
  await settingsApi.updateSettings(merged);
  if (options.applySideEffects) {
    await systemApi.syncSideEffects(merged);
  }
  return merged;
}

export function usePreferencesPersistence() {
  return useCallback(async (patch: Partial<AppSettings>, applySideEffects = false) => {
    return persistSettingsPatch(patch, { applySideEffects });
  }, []);
}
