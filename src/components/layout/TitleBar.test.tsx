import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { TitleBar } from "./TitleBar";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { useNavigationStore } from "../../stores/useNavigationStore";

describe("TitleBar", () => {
  beforeEach(() => {
    usePreferencesStore.setState({ language: "en", theme: "koyu-mavi" });
    useVaultSessionStore.setState({ state: "unlocked" });
    useNavigationStore.setState({ view: "vault", settingsSection: "general" });
  });

  it("exposes settings, language and lock controls when unlocked", () => {
    render(<TitleBar />);
    expect(screen.getByLabelText("Settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Language")).toBeInTheDocument();
    expect(screen.getByLabelText("Switch Theme")).toBeInTheDocument();
    expect(screen.getByLabelText("Lock the vault")).toBeInTheDocument();
  });

  it("opens settings from the quick action", () => {
    render(<TitleBar />);
    fireEvent.click(screen.getByLabelText("Settings"));
    expect(useNavigationStore.getState().view).toBe("settings");
    expect(useNavigationStore.getState().settingsSection).toBe("general");
  });

  it("lists all 73 languages in the language menu", () => {
    render(<TitleBar />);
    fireEvent.click(screen.getByLabelText("Language"));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem").length).toBe(73);
  });
});
