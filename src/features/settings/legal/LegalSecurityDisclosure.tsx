import React from "react";
import { Shield, Cpu, Lock, KeyRound, Terminal, Check } from "lucide-react";
import { useTranslation } from "../../../i18n";

export const LegalSecurityDisclosure: React.FC = () => {
  const { language } = useTranslation();
  const isTr = language === "tr";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", color: "var(--text-primary)" }}>
      {/* Hero Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: "var(--space-4)",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--surface-subtle)",
          border: "1px solid var(--border)",
        }}
      >
        <Shield size={28} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            {isTr ? "Kriptografik Mimari & Güvenlik Bildirimi" : "Cryptographic Architecture & Security Disclosure"}
          </h4>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "3px 0 0 0" }}>
            {isTr
              ? "Env Vault, endüstri standardı modern şifreleme ve bellek temizleme ilkeleriyle geliştirilmiştir."
              : "Env Vault is engineered with industry-standard modern cryptography and memory protection primitives."}
          </p>
        </div>
      </div>

      {/* Crypto Architecture Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
        {/* Card 1: Argon2id */}
        <div
          style={{
            padding: "var(--space-3) var(--space-4)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--surface-subtle)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <KeyRound size={15} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Argon2id (KDF)</span>
          </div>
          <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            {isTr
              ? "Parola türetme: 64 MB bellek maliyeti, 3 yineleme, 4 iş parçacığı ve 128-bit CSPRNG tuzu ile GPU/ASIC saldırılarına dirençli."
              : "Key derivation: 64 MB memory cost, 3 iterations, 4 parallelism lanes, 128-bit CSPRNG salt, highly resistant to GPU/ASIC brute-force."}
          </p>
        </div>

        {/* Card 2: AES-256-GCM */}
        <div
          style={{
            padding: "var(--space-3) var(--space-4)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--surface-subtle)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Lock size={15} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>AES-256-GCM</span>
          </div>
          <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            {isTr
              ? "Simetrik şifreleme: 256-bit anahtar, her dosya için 96-bit benzersiz tek kullanımlık vektör (Nonce) ve 128-bit kimlik doğrulama etiketi."
              : "Symmetric cipher: 256-bit key, 96-bit unique CSPRNG nonce per document, and 128-bit GMAC authentication tag for data integrity."}
          </p>
        </div>

        {/* Card 3: Memory Zeroization */}
        <div
          style={{
            padding: "var(--space-3) var(--space-4)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--surface-subtle)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Cpu size={15} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Zeroize (Memory Scrubbing)</span>
          </div>
          <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            {isTr
              ? "RAM güvenliği: Ham parolalar, türetilmiş anahtarlar ve şifrelenmemiş tamponlar Drop aşamasında anında sıfırlarla (0x00) ezilir."
              : "RAM security: Master passwords, derived keys, and plaintext buffers are securely wiped with 0x00 on Drop to prevent cold-boot memory dumps."}
          </p>
        </div>

        {/* Card 4: Windows DPAPI */}
        <div
          style={{
            padding: "var(--space-3) var(--space-4)",
            borderRadius: "var(--radius-md)",
            backgroundColor: "var(--surface-subtle)",
            border: "1px solid var(--border-subtle)",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Terminal size={15} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Windows DPAPI</span>
          </div>
          <p style={{ fontSize: "11.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
            {isTr
              ? "Platform koruması: Oturum anahtarları ve yerel yapılandırma verileri Windows Data Protection API (DPAPI) ile donanım düzeyinde kilitlenir."
              : "Platform protection: Session tokens and local config payloads are protected using Windows Data Protection API tied to user login credentials."}
          </p>
        </div>
      </div>

      {/* Security Audit & Disclosure */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <h4 style={{ fontSize: "13.5px", fontWeight: 600, margin: 0 }}>
          {isTr ? "Sorumlu Bildirim & Güvenlik Araştırmaları" : "Responsible Disclosure & Security Inquiries"}
        </h4>
        <p style={{ fontSize: "12.5px", lineHeight: "1.6", color: "var(--text-secondary)", margin: 0 }}>
          {isTr
            ? "Env Vault kaynak kodunda olası bir güvenlik açığı veya kriptografik zayıflık tespit ettiğinizde lütfen doğrudan güvenlik ekibimize bildirin: security@vellium.dev"
            : "If you discover a potential vulnerability or cryptographic weakness in Env Vault, please contact our security team responsibly: security@vellium.dev"}
        </p>
      </div>

      {/* Technical Summary List */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          padding: "var(--space-4)",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--surface-subtle)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
          <Check size={14} style={{ color: "var(--accent)" }} />
          <span>{isTr ? "AES-256-GCM ile kimlik doğrulamalı şifreleme" : "Authenticated encryption with AES-256-GCM"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
          <Check size={14} style={{ color: "var(--accent)" }} />
          <span>{isTr ? "Argon2id parola türetme motoru (OWASP tavsiyesi)" : "Argon2id password hashing engine (OWASP compliant)"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
          <Check size={14} style={{ color: "var(--accent)" }} />
          <span>{isTr ? "Zeroize ile RAM bellek izi temizliği" : "Zeroize-backed memory scrubbing in RAM"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
          <Check size={14} style={{ color: "var(--accent)" }} />
          <span>{isTr ? "Sıfır dış ağ bağlantısı, %100 yerel ve izole" : "Zero network activity, 100% offline and isolated"}</span>
        </div>
      </div>
    </div>
  );
};
