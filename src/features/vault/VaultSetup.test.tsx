import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { VaultSetup } from "./VaultSetup";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";

describe("VaultSetup", () => {
  beforeEach(() => {
    useVaultSessionStore.setState({
      state: "uninitialized",
      isLoading: false,
      error: null,
    });
  });

  it("renders the master password creation form", () => {
    render(<VaultSetup />);
    expect(screen.getByText("1. Set Master Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Master Password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm Master Password")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Create Vault/i })
    ).toBeInTheDocument();
  });

  it("rejects a short master password", () => {
    render(<VaultSetup />);
    fireEvent.change(screen.getByLabelText("Master Password"), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Master Password"), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Vault/i }));
    expect(
      screen.getByText("Master password must be at least 8 characters long.")
    ).toBeInTheDocument();
  });

  it("rejects mismatched passwords", () => {
    render(<VaultSetup />);
    fireEvent.change(screen.getByLabelText("Master Password"), {
      target: { value: "password123!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Master Password"), {
      target: { value: "different123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create Vault/i }));
    expect(screen.getByText(/do not match/i)).toBeInTheDocument();
  });
});
