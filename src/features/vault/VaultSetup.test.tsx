import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { VaultSetup } from "./VaultSetup";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";

describe("VaultSetup", () => {
  beforeEach(() => {
    useVaultSessionStore.setState({ state: "uninitialized", isLoading: false, error: null });
  });

  it("renders welcome screen with Turkish overview and features", () => {
    render(<VaultSetup />);

    expect(screen.getByText("Env Vault'a Hoş Geldiniz")).toBeInTheDocument();
    expect(screen.getByText("Sıfır Sızıntı & İzolasyon")).toBeInTheDocument();
    expect(screen.getByText("Argon2id + AES-256-GCM")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Kasayı Kurun ve Başlayın/i })).toBeInTheDocument();
  });

  it("navigates to password creation and validates password length", () => {
    render(<VaultSetup />);

    // Proceed to Step 2
    fireEvent.click(screen.getByRole("button", { name: /Kasayı Kurun ve Başlayın/i }));

    const passwordInput = screen.getByLabelText("Ana Parola");
    const confirmInput = screen.getByLabelText("Ana Parolayı Tekrarla");
    const submitBtn = screen.getByRole("button", { name: /Vault Oluştur ve Kilidi Aç/i });

    fireEvent.change(passwordInput, { target: { value: "123" } });
    fireEvent.change(confirmInput, { target: { value: "123" } });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText("Ana parola en az 8 karakter olmalıdır.")
    ).toBeInTheDocument();
  });

  it("navigates to password creation and validates password match", () => {
    render(<VaultSetup />);

    // Proceed to Step 2
    fireEvent.click(screen.getByRole("button", { name: /Kasayı Kurun ve Başlayın/i }));

    const passwordInput = screen.getByLabelText("Ana Parola");
    const confirmInput = screen.getByLabelText("Ana Parolayı Tekrarla");
    const submitBtn = screen.getByRole("button", { name: /Vault Oluştur ve Kilidi Aç/i });

    fireEvent.change(passwordInput, { target: { value: "password123!" } });
    fireEvent.change(confirmInput, { target: { value: "different123!" } });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText("Girdiğiniz parolalar birbiriyle eşleşmiyor.")
    ).toBeInTheDocument();
  });
});
