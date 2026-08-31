import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsModal } from "./SettingsModal";
import { useDialogStore } from "../../stores/useDialogStore";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";

// Mock Tauri modules
vi.mock("@tauri-apps/api/app", () => ({
  getVersion: vi.fn().mockResolvedValue("1.0.0"),
}));

vi.mock("../../lib/tauri/settings-api", () => ({
  settingsApi: {
    updateSettings: vi.fn().mockResolvedValue({}),
  },
}));

describe("SettingsModal & Legal Pages Navigation", () => {
  beforeEach(() => {
    usePreferencesStore.setState({
      language: "tr",
      theme: "koyu-mavi",
      autoLockMinutes: 15,
      askExportLocation: true,
      defaultExportDirectory: "",
      reduceMotion: false,
      closeAction: "ask",
    });
    useVaultSessionStore.setState({
      state: "unlocked",
    });
    useDialogStore.setState({
      isSettingsOpen: true,
      settingsInitialView: "main",
    });
  });

  it("renders main settings view with Backup & Restore and all legal cards when unlocked", () => {
    render(<SettingsModal />);

    expect(screen.getByText("Yedekleme ve Geri Yükleme")).toBeInTheDocument();
    expect(screen.getByText("Şifreli Yedek Al")).toBeInTheDocument();
    expect(screen.getByText("Yedekten Geri Yükle")).toBeInTheDocument();

    expect(screen.getByText("Yasal & Kurumsal Bilgiler")).toBeInTheDocument();
    expect(screen.getByText("Gizlilik Politikası")).toBeInTheDocument();
    expect(screen.getByText("Kullanım Koşulları")).toBeInTheDocument();
    expect(screen.getByText("Güvenlik & Kriptografi")).toBeInTheDocument();
    expect(screen.getByText("Açık Kaynak Lisansları")).toBeInTheDocument();
    expect(screen.getByText("Vellium Hakkında")).toBeInTheDocument();
  });

  it("when locked, opening Vellium modal does NOT show Back to Settings button and prevents access to main settings", () => {
    useVaultSessionStore.setState({ state: "locked" });
    useDialogStore.setState({
      isSettingsOpen: true,
      settingsInitialView: "about-vellium",
    });

    render(<SettingsModal />);

    // Manifesto is visible
    expect(screen.getByText("Vellium Mühendislik Manifestosu")).toBeInTheDocument();
    // But "Ayarlara Geri Dön" must NOT exist
    expect(screen.queryByText("Ayarlara Geri Dön")).not.toBeInTheDocument();
    // Only close button exists
    expect(screen.getByText("Kapat")).toBeInTheDocument();
  });

  it("opens directly on about-vellium view when settingsInitialView is about-vellium", () => {
    useDialogStore.setState({
      isSettingsOpen: true,
      settingsInitialView: "about-vellium",
    });

    render(<SettingsModal />);

    expect(screen.getByText("Vellium Mühendislik Manifestosu")).toBeInTheDocument();
    expect(screen.getByText("Vellium.dev'i Ziyaret Et")).toBeInTheDocument();
  });

  it("navigates into Privacy Policy view and navigates back when unlocked", () => {
    render(<SettingsModal />);

    // Click Privacy Policy card
    fireEvent.click(screen.getByText("Gizlilik Politikası"));

    // Verify inside Privacy Policy view
    expect(screen.getByText(/Sıfır Telemetri & Tam Yerel Gizlilik Taahhüdü/i)).toBeInTheDocument();
    const backButtons = screen.getAllByText("Ayarlara Geri Dön");
    expect(backButtons[0]).toBeInTheDocument();

    // Click Back to Settings
    fireEvent.click(backButtons[0]!);

    // Verify returned to main settings view
    expect(screen.getByText("Yasal & Kurumsal Bilgiler")).toBeInTheDocument();
  });

  it("navigates into Vellium About page and displays manifesto and link", () => {
    render(<SettingsModal />);

    // Click Vellium card
    fireEvent.click(screen.getByText("Vellium Hakkında"));

    // Verify manifesto text and website button
    expect(screen.getByText("Vellium Mühendislik Manifestosu")).toBeInTheDocument();
    expect(screen.getByText(/Vellium, hassasiyet, gizlilik ve uzun vadeli güvenilirlikle/i)).toBeInTheDocument();
    expect(screen.getByText("Vellium.dev'i Ziyaret Et")).toBeInTheDocument();
  });

  it("navigates into Open Source Licenses view and displays dependencies", () => {
    render(<SettingsModal />);

    // Click Licenses card
    fireEvent.click(screen.getByText("Açık Kaynak Lisansları"));

    // Verify dependencies
    expect(screen.getByText("React & React DOM")).toBeInTheDocument();
    expect(screen.getByText("Tauri Framework & Plugins")).toBeInTheDocument();
    expect(screen.getByText("argon2")).toBeInTheDocument();
    expect(screen.getByText("aes-gcm")).toBeInTheDocument();
    expect(screen.getByText("zeroize")).toBeInTheDocument();
  });

  it("supports English language for legal pages and manifesto", () => {
    usePreferencesStore.setState({ language: "en" });
    render(<SettingsModal />);

    expect(screen.getByText("Legal & Corporate Information")).toBeInTheDocument();
    expect(screen.getByText("Privacy Policy")).toBeInTheDocument();

    // Navigate to Vellium page in English
    fireEvent.click(screen.getByText("About Vellium"));

    expect(screen.getByText("The Vellium Manifesto")).toBeInTheDocument();
    expect(screen.getByText(/Vellium builds enduring software systems shaped by precision/i)).toBeInTheDocument();
    expect(screen.getByText("Visit Vellium.dev")).toBeInTheDocument();
  });
});
