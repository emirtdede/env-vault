import React, { useState } from "react";
import { Package, ExternalLink, Code2, Layers } from "lucide-react";
import { useTranslation } from "../../../i18n";
import { openExternalUrl } from "../../../lib/utils/open-url";


interface DependencyLicense {
  name: string;
  version: string;
  license: string;
  scope: "frontend" | "rust";
  descriptionTr: string;
  descriptionEn: string;
  homepage?: string;
}

const DEPENDENCIES: DependencyLicense[] = [
  // Frontend
  {
    name: "React & React DOM",
    version: "19.0.0",
    license: "MIT",
    scope: "frontend",
    descriptionTr: "Kullanıcı arayüzü bileşen mimarisi motoru.",
    descriptionEn: "Declarative UI component architecture engine.",
    homepage: "https://react.dev",
  },
  {
    name: "CodeMirror 6",
    version: "6.0.1",
    license: "MIT",
    scope: "frontend",
    descriptionTr: "Sözdizimi vurgulama ve gelişmiş metin editörü altyapısı.",
    descriptionEn: "Extensible code and text editor component.",
    homepage: "https://codemirror.net",
  },
  {
    name: "Zustand",
    version: "5.0.3",
    license: "MIT",
    scope: "frontend",
    descriptionTr: "Hafif ve reaktif durum yönetimi kütüphanesi.",
    descriptionEn: "Lightweight, unopinionated reactive state management.",
    homepage: "https://github.com/pmndrs/zustand",
  },
  {
    name: "Lucide React",
    version: "1.16.0",
    license: "ISC",
    scope: "frontend",
    descriptionTr: "Modern ve tutarlı arayüz ikon seti.",
    descriptionEn: "Clean, consistent icon library for modern interfaces.",
    homepage: "https://lucide.dev",
  },
  {
    name: "Vite",
    version: "6.2.0",
    license: "MIT",
    scope: "frontend",
    descriptionTr: "Yüksek hızlı modern web derleme ve paketleme aracı.",
    descriptionEn: "Next generation frontend tooling and bundler.",
    homepage: "https://vite.dev",
  },
  {
    name: "TypeScript",
    version: "5.7.3",
    license: "Apache-2.0",
    scope: "frontend",
    descriptionTr: "Statik tip güvenliği sağlayan programlama dili.",
    descriptionEn: "Typed JavaScript at Any Scale.",
    homepage: "https://www.typescriptlang.org",
  },

  // Rust Backend
  {
    name: "Tauri Framework & Plugins",
    version: "2.2.0",
    license: "MIT / Apache-2.0",
    scope: "rust",
    descriptionTr: "Güvenli ve hafif yerel masaüstü uygulama köprüsü.",
    descriptionEn: "Build smaller, faster, and more secure desktop applications.",
    homepage: "https://tauri.app",
  },
  {
    name: "argon2",
    version: "0.5.3",
    license: "MIT / Apache-2.0",
    scope: "rust",
    descriptionTr: "Bellek sertliği yüksek Argon2id parola türetme motoru.",
    descriptionEn: "Pure Rust implementation of the Argon2 password hashing function.",
    homepage: "https://github.com/RustCrypto/password-hashes",
  },
  {
    name: "aes-gcm",
    version: "0.10.3",
    license: "MIT / Apache-2.0",
    scope: "rust",
    descriptionTr: "AES-GCM kimlik doğrulamalı simetrik şifreleme motoru.",
    descriptionEn: "Pure Rust implementation of AES-GCM authenticated cipher.",
    homepage: "https://github.com/RustCrypto/AEADs",
  },
  {
    name: "zeroize",
    version: "1.8.1",
    license: "MIT / Apache-2.0",
    scope: "rust",
    descriptionTr: "Hassas bellek tamponlarını sıfırlayarak temizleme kütüphanesi.",
    descriptionEn: "Securely clear secrets from memory using zeroization.",
    homepage: "https://github.com/RustCrypto/utils",
  },
  {
    name: "serde & serde_json",
    version: "1.0",
    license: "MIT / Apache-2.0",
    scope: "rust",
    descriptionTr: "Yüksek performanslı JSON ve ikili veri serileştirme.",
    descriptionEn: "Generic serialization/deserialization framework for Rust.",
    homepage: "https://serde.rs",
  },
  {
    name: "windows (Rust Win32 API)",
    version: "0.58",
    license: "MIT / Apache-2.0",
    scope: "rust",
    descriptionTr: "Windows DPAPI, OLE Drag&Drop ve kabuk entegrasyonu.",
    descriptionEn: "Official Microsoft Windows crate for native Win32 system bindings.",
    homepage: "https://github.com/microsoft/windows-rs",
  },
  {
    name: "parking_lot",
    version: "0.12",
    license: "MIT / Apache-2.0",
    scope: "rust",
    descriptionTr: "Kompakt ve hızlı eşzamanlı kilit mekanizmaları (Mutex/RwLock).",
    descriptionEn: "Compact and efficient synchronization primitives.",
    homepage: "https://github.com/Amanieu/parking_lot",
  },
  {
    name: "uuid & chrono",
    version: "1.10 / 0.4",
    license: "MIT / Apache-2.0",
    scope: "rust",
    descriptionTr: "Benzersiz kimlik (UUID v4) ve zaman damgası yönetimi.",
    descriptionEn: "Fast UUID generation and date/time calculation.",
    homepage: "https://github.com/chronotope/chrono",
  },
];

export const LegalLicenses: React.FC = () => {
  const { language } = useTranslation();
  const isTr = language === "tr";
  const [filter, setFilter] = useState<"all" | "frontend" | "rust">("all");

  const filtered = DEPENDENCIES.filter((d) => (filter === "all" ? true : d.scope === filter));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", color: "var(--text-primary)" }}>
      {/* Intro Box */}
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
        <Package size={26} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            {isTr ? "Açık Kaynak Lisansları & Üçüncü Taraf Bildirimi" : "Open Source Licenses & Third-Party Notice"}
          </h4>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "3px 0 0 0" }}>
            {isTr
              ? "Env Vault, açık kaynak topluluğunun geliştirdiği saygın kütüphaneler üzerine inşa edilmiştir."
              : "Env Vault is built upon outstanding open-source projects created by the developer community."}
          </p>
        </div>
      </div>

      {/* Scope Filter Tabs */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          type="button"
          onClick={() => setFilter("all")}
          style={{
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            backgroundColor: filter === "all" ? "var(--accent)" : "var(--surface)",
            color: filter === "all" ? "#FFFFFF" : "var(--text-secondary)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {isTr ? "Tümü" : "All"} ({DEPENDENCIES.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("frontend")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            backgroundColor: filter === "frontend" ? "var(--accent)" : "var(--surface)",
            color: filter === "frontend" ? "#FFFFFF" : "var(--text-secondary)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Code2 size={13} />
          Frontend (React)
        </button>
        <button
          type="button"
          onClick={() => setFilter("rust")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border)",
            backgroundColor: filter === "rust" ? "var(--accent)" : "var(--surface)",
            color: filter === "rust" ? "#FFFFFF" : "var(--text-secondary)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Layers size={13} />
          Backend (Rust)
        </button>
      </div>

      {/* Dependencies List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filtered.map((dep) => (
          <div
            key={dep.name}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--surface-subtle)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {dep.name}
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    padding: "1px 6px",
                    borderRadius: "4px",
                    backgroundColor: "var(--surface)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }}
                >
                  v{dep.version}
                </span>
                <span
                  style={{
                    fontSize: "10.5px",
                    fontWeight: 600,
                    padding: "1px 6px",
                    borderRadius: "4px",
                    backgroundColor: "var(--accent-subtle)",
                    color: "var(--accent)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {dep.license}
                </span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                {isTr ? dep.descriptionTr : dep.descriptionEn}
              </p>
            </div>

            {dep.homepage && (
              <a
                href={dep.homepage}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => openExternalUrl(dep.homepage!, e)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  color: "var(--text-secondary)",
                  fontSize: "12px",
                  textDecoration: "none",
                  padding: "4px 8px",
                  borderRadius: "var(--radius-sm)",
                  flexShrink: 0,
                  cursor: "pointer",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--accent)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--text-secondary)")}
              >
                <ExternalLink size={13} />
              </a>
            )}

          </div>
        ))}
      </div>

      {/* MIT Text Excerpt */}
      <div
        style={{
          padding: "var(--space-4)",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
          {isTr ? "MIT Standart Lisans Metni" : "Standard MIT License Notice"}
        </span>
        <pre
          style={{
            fontSize: "11px",
            lineHeight: 1.5,
            color: "var(--text-secondary)",
            margin: 0,
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
          }}
        >
          {`Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software...`}
        </pre>
      </div>
    </div>
  );
};
