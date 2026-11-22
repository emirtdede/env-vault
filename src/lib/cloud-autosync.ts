import { useEditorStore } from "../stores/useEditorStore";
import { useEnvStore } from "../stores/useEnvStore";
import { useProjectStore } from "../stores/useProjectStore";
import { usePreferencesStore } from "../stores/usePreferencesStore";
import { cloudApi } from "./tauri/cloud-api";

/**
 * Debounced auto-sync bridge. Watches the stores that mutate vault content and
 * writes the encrypted snapshot to the user-owned cloud folder 300 ms after the
 * last change, matching the native sync contract without hammering the disk.
 */
export function toastOnCloudChange(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running = false;
  let pending = false;

  const schedule = () => {
    if (!usePreferencesStore.getState().autoSyncEnabled) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void flush();
    }, 300);
  };

  const flush = async () => {
    if (running) {
      // A change arrived mid-write; sync again once the current pass finishes.
      pending = true;
      return;
    }
    running = true;
    try {
      const status = await cloudApi.status();
      if (status.connected && status.autoSync) {
        await cloudApi.syncNow();
      }
    } catch {
      // Auto-sync is best effort: the Settings card surfaces actionable errors.
    } finally {
      running = false;
      if (pending) {
        pending = false;
        schedule();
      }
    }
  };

  const unsubscribers = [
    useProjectStore.subscribe(schedule),
    useEnvStore.subscribe(schedule),
    useEditorStore.subscribe(schedule),
  ];

  return () => {
    if (timer) clearTimeout(timer);
    for (const unsubscribe of unsubscribers) unsubscribe();
  };
}
