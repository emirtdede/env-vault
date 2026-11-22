import { describe, it, expect } from "vitest";
import { usePreferencesStore } from "./usePreferencesStore";

describe("usePreferencesStore", () => {
  it("initializes with default settings", () => {
    const state = usePreferencesStore.getState();
    expect(state.theme).toBe("siyah");
    expect(state.autoLockMinutes).toBe(15);
    expect(state.askExportLocation).toBe(true);
    expect(state.exportCollisionPolicy).toBe("ask");
  });

  it("updates theme correctly", () => {
    usePreferencesStore.getState().updateSettings({ theme: "koyu-mavi" });
    expect(usePreferencesStore.getState().theme).toBe("koyu-mavi");

    usePreferencesStore.getState().updateSettings({ theme: "acik-yesil" });
    expect(usePreferencesStore.getState().theme).toBe("acik-yesil");

    usePreferencesStore.getState().updateSettings({ theme: "siyah" });
    expect(usePreferencesStore.getState().theme).toBe("siyah");
  });

  it("updates auto lock duration and options", () => {
    usePreferencesStore.getState().updateSettings({ autoLockMinutes: 30 });
    expect(usePreferencesStore.getState().autoLockMinutes).toBe(30);

    usePreferencesStore.getState().updateSettings({ autoLockMinutes: 0 });
    expect(usePreferencesStore.getState().autoLockMinutes).toBe(0);
  });
});
