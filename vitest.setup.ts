import "@testing-library/jest-dom";

import { vi } from "vitest";

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    isMaximized: async () => false,
    minimize: async () => {},
    maximize: async () => {},
    unmaximize: async () => {},
    close: async () => {},
    hide: async () => {},
    show: async () => {},
    unminimize: async () => {},
    setFocus: async () => {},
    onResized: async () => () => {},
  }),
  LogicalSize: class {},
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: async () => () => {},
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: async () => undefined,
}));

if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("dark"),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
