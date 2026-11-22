import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { AppSidebar } from "./AppSidebar";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";
import { usePreferencesStore } from "../../stores/usePreferencesStore";
import { useNavigationStore } from "../../stores/useNavigationStore";

describe("AppSidebar", () => {
  beforeEach(() => {
    usePreferencesStore.setState({ language: "en", sidebarCollapsed: false });
    useVaultSessionStore.setState({ state: "unlocked" });
    useNavigationStore.setState({ view: "vault", settingsSection: "general" });
  });

  it("exposes every primary destination", () => {
    render(<AppSidebar />);
    expect(screen.getByRole("button", { name: "Vault" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Assistant" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Integrations" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Documentation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Support" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "About" })).toBeInTheDocument();
  });

  it("keeps the brand header draggable so the frameless window can move", () => {
    const { container } = render(<AppSidebar />);
    const brand = container.querySelector(".sidebar-brand");
    expect(brand).toHaveAttribute("data-tauri-drag-region", "deep");
  });

  it("navigates between views", () => {
    render(<AppSidebar />);
    fireEvent.click(screen.getByRole("button", { name: "Documentation" }));
    expect(useNavigationStore.getState().view).toBe("docs");
  });

  it("offers a lock action only while the vault is unlocked", () => {
    render(<AppSidebar />);
    expect(screen.getByRole("button", { name: "Lock Vault" })).toBeInTheDocument();
  });

  it("hides text labels when collapsed but keeps accessible names", () => {
    usePreferencesStore.setState({ sidebarCollapsed: true });
    const { container } = render(<AppSidebar />);
    expect(container.querySelector(".app-sidebar")).toHaveClass("is-collapsed");
    expect(screen.getByTitle("Vault")).toBeInTheDocument();
  });
});
