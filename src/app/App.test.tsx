import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { App } from "./App";
import { useVaultSessionStore } from "../stores/useVaultSessionStore";
import { usePreferencesStore } from "../stores/usePreferencesStore";
import { useRestorePromptStore } from "../stores/useRestorePromptStore";

describe("App shell", () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      onboardingCompleted: true,
      language: "en",
    });
    useRestorePromptStore.setState({ proposal: null, dismissed: true });
    useVaultSessionStore.setState({
      state: "uninitialized",
      isLoading: false,
      fetchState: async () => "uninitialized" as const,
    });
  });

  it("renders the frameless shell with window controls and no title bar", async () => {
    render(<App />);
    expect(await screen.findByTestId("app-root")).toBeInTheDocument();
    expect(await screen.findByLabelText("Minimize")).toBeInTheDocument();
    expect(screen.getByLabelText("Maximize")).toBeInTheDocument();
    expect(screen.getByLabelText("Close")).toBeInTheDocument();
    expect(document.querySelector(".titlebar")).toBeNull();
  });

  it("renders the master password screen when the vault is uninitialized", async () => {
    render(<App />);
    expect(await screen.findByText("1. Set Master Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Master Password")).toBeInTheDocument();
  });

  it("renders the lock screen when the vault is locked", async () => {
    useVaultSessionStore.setState({ state: "locked", isLoading: false });
    render(<App />);
    expect(await screen.findByTestId("app-root")).toBeInTheDocument();
    expect(await screen.findByLabelText("Master Password")).toBeInTheDocument();
  });
});
