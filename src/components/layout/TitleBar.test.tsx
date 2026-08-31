import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { TitleBar } from "./TitleBar";
import { useDialogStore } from "../../stores/useDialogStore";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";
import { usePreferencesStore } from "../../stores/usePreferencesStore";

describe("TitleBar Header Controls", () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      language: "tr",
      theme: "koyu-mavi",
    });
    useDialogStore.setState({
      isSettingsOpen: false,
      settingsInitialView: "main",
    });
    useVaultSessionStore.setState({
      state: "unlocked",
    });
  });

  it("renders Theme, Language, Vellium, Settings, and Lock buttons when vault is unlocked", () => {
    render(<TitleBar />);

    const themeBtn = screen.getByLabelText(/tema|theme/i);
    const langBtn = screen.getByLabelText(/dil|language/i);
    const velliumBtn = screen.getByLabelText(/vellium hakkında|about vellium/i);
    const settingsBtn = screen.getByLabelText(/ayarlar|settings/i);
    const lockBtn = screen.getByLabelText(/kasayı kilitle|lock vault/i);

    expect(themeBtn).toBeInTheDocument();
    expect(langBtn).toBeInTheDocument();
    expect(velliumBtn).toBeInTheDocument();
    expect(settingsBtn).toBeInTheDocument();
    expect(lockBtn).toBeInTheDocument();
  });

  it("hides Settings and Lock buttons when vault is locked or uninitialized", () => {
    useVaultSessionStore.setState({ state: "locked" });

    render(<TitleBar />);

    expect(screen.getByLabelText(/tema|theme/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dil|language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/vellium hakkında|about vellium/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/ayarlar|settings/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/kasayı kilitle|lock vault/i)).not.toBeInTheDocument();
  });

  it("clicking Vellium button opens Settings modal directly on about-vellium view", () => {
    render(<TitleBar />);

    const velliumBtn = screen.getByLabelText(/vellium hakkında|about vellium/i);
    fireEvent.click(velliumBtn);

    const dialogState = useDialogStore.getState();
    expect(dialogState.isSettingsOpen).toBe(true);
    expect(dialogState.settingsInitialView).toBe("about-vellium");
  });

  it("clicking Settings button opens Settings modal on main view", () => {
    render(<TitleBar />);

    const settingsBtn = screen.getByLabelText(/ayarlar|settings/i);
    fireEvent.click(settingsBtn);

    const dialogState = useDialogStore.getState();
    expect(dialogState.isSettingsOpen).toBe(true);
    expect(dialogState.settingsInitialView).toBe("main");
  });

  it("clicking Lock button triggers lock on vault session", () => {
    const lockSpy = vi.fn();
    useVaultSessionStore.setState({ lock: lockSpy, state: "unlocked" });

    render(<TitleBar />);

    const lockBtn = screen.getByLabelText(/kasayı kilitle|lock vault/i);
    fireEvent.click(lockBtn);

    expect(lockSpy).toHaveBeenCalled();
  });
});
