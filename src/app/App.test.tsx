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
    useVaultSessionStore.setState({ state: "uninitialized", isLoading: false });
  });

  it("renders the application root and title bar controls", () => {
    render(<App />);
    expect(screen.getByTestId("app-root")).toBeInTheDocument();
    expect(screen.getByLabelText("Settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Language")).toBeInTheDocument();
  });

  it("renders the master password screen when the vault is uninitialized", () => {
    render(<App />);
    expect(screen.getByText("1. Set Master Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Master Password")).toBeInTheDocument();
  });

  it("renders the lock screen when the vault is locked", () => {
    useVaultSessionStore.setState({ state: "locked", isLoading: false });
    render(<App />);
    expect(screen.getByTestId("app-root")).toBeInTheDocument();
    expect(screen.getByLabelText("Master Password")).toBeInTheDocument();
  });
});
