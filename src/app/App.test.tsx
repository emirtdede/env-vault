import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "./App";
import { useVaultSessionStore } from "../stores/useVaultSessionStore";

describe("App Foundation", () => {
  it("renders vault setup screen when vault is uninitialized", () => {
    useVaultSessionStore.setState({ state: "uninitialized", isLoading: false });
    render(<App />);

    expect(screen.getByTestId("app-root")).toBeInTheDocument();
    expect(screen.getByText("Env Vault'a Hoş Geldiniz")).toBeInTheDocument();
  });

  it("renders lock screen when vault is locked", () => {
    useVaultSessionStore.setState({ state: "locked", isLoading: false });
    render(<App />);

    expect(screen.getByTestId("app-root")).toBeInTheDocument();
    expect(screen.getByText("Env Vault Kilitli")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Kilidi Aç/i })).toBeInTheDocument();
  });

  it("renders main dashboard with sidebar when unlocked", () => {
    useVaultSessionStore.setState({ state: "unlocked", isLoading: false });
    render(<App />);

    expect(screen.getByTestId("app-root")).toBeInTheDocument();
    expect(screen.getByText("Projeler")).toBeInTheDocument();
  });
});
