import React from "react";
import { ShieldCheck, Database, HardDrive, Lock, EyeOff } from "lucide-react";
import { useTranslation } from "../../../i18n";

export const LegalPrivacyPolicy: React.FC = () => {
  const { language } = useTranslation();
  const isTr = language === "tr";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", color: "var(--text-primary)" }}>
      {/* Hero Badge Box */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: "var(--space-4)",
          borderRadius: "var(--radius-lg)",
          backgroundColor: "var(--accent-subtle)",
          border: "1px solid var(--border)",
        }}
      >
        <ShieldCheck size={28} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            {isTr ? "Sıfır Telemetri & Tam Yerel Gizlilik Taahhüdü" : "Zero Telemetry & Absolute Local Privacy Guarantee"}
          </h4>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "3px 0 0 0" }}>
            {isTr
              ? "Env Vault, hiçbir kullanıcı verisini toplamaz, izlemez veya harici bir sunucuya iletmez."
              : "Env Vault does not collect, track, or transmit any user data to any external servers."}
          </p>
        </div>
      </div>

      {/* Section 1: Local-First Storage */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <HardDrive size={16} style={{ color: "var(--accent)" }} />
          <h4 style={{ fontSize: "13.5px", fontWeight: 600, margin: 0 }}>
            {isTr ? "1. Yerel Depolama (Local-First Architecture)" : "1. Local-First Storage Architecture"}
          </h4>
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: "1.6", color: "var(--text-secondary)", margin: 0 }}>
          {isTr
            ? "Tüm ortam değişkenleriniz (.env dosyaları), proje isimleri ve yapılandırma tercihleriniz yalnızca yerel depolama biriminizde (%LOCALAPPDATA%\\com.vellium.envvault) saklanır. Uygulama tamamen çevrimdışı (offline) çalışacak şekilde tasarlanmıştır ve internet bağlantısı gerektirmez."
            : "All your environment variables (.env files), project names, and preferences are stored exclusively on your local disk (%LOCALAPPDATA%\\com.vellium.envvault). The application is engineered to operate strictly offline with zero cloud dependency."}
        </p>
      </div>

      {/* Section 2: Cryptographic Secrecy */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Lock size={16} style={{ color: "var(--accent)" }} />
          <h4 style={{ fontSize: "13.5px", fontWeight: 600, margin: 0 }}>
            {isTr ? "2. Sıfır-Bilgi ve Şifreleme (Zero-Knowledge Privacy)" : "2. Zero-Knowledge Encryption"}
          </h4>
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: "1.6", color: "var(--text-secondary)", margin: 0 }}>
          {isTr
            ? "Verileriniz diske yazılmadan önce AES-256-GCM ve Argon2id algoritmalarıyla şifrelenir. Ana parolanız hiçbir zaman düz metin olarak kaydedilmez. Vellium dahil olmak üzere hiçbir üçüncü taraf şifrelenmiş verilerinize erişemez, anahtarınızı sıfırlayamaz veya içeriğinizi görüntüleyemez."
            : "Your data is strongly encrypted using AES-256-GCM and Argon2id before touching the disk. Your master password is never stored in plain text. Neither Vellium nor any third party possesses backdoors or recovery keys to access your secrets."}
        </p>
      </div>

      {/* Section 3: Telemetry & Analytics Policy */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <EyeOff size={16} style={{ color: "var(--accent)" }} />
          <h4 style={{ fontSize: "13.5px", fontWeight: 600, margin: 0 }}>
            {isTr ? "3. Telemetri ve Analitik Politikası" : "3. Telemetry & Analytics Policy"}
          </h4>
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: "1.6", color: "var(--text-secondary)", margin: 0 }}>
          {isTr
            ? "Env Vault kaynak kodunda çökme raporlama araçları, kullanım izleyicileri, reklam kimlikleri veya analitik kütüphaneleri bulunmamaktadır. Çerez kullanılmaz, cihaz parmak izi (fingerprinting) çıkarılmaz."
            : "Env Vault codebase contains zero crash reporters, usage trackers, advertising identifiers, or analytics libraries. No cookies, tracking tokens, or device fingerprinting are employed."}
        </p>
      </div>

      {/* Section 4: Data Sovereignty & Portability */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Database size={16} style={{ color: "var(--accent)" }} />
          <h4 style={{ fontSize: "13.5px", fontWeight: 600, margin: 0 }}>
            {isTr ? "4. Veri Egemenliği ve Yedekleme" : "4. Data Sovereignty & Portability"}
          </h4>
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: "1.6", color: "var(--text-secondary)", margin: 0 }}>
          {isTr
            ? "Verilerinizin tek sahibi sizsiniz. Dilediğiniz an tüm kasanızı şifreli yedek (.vaultbak) olarak dışa aktarabilir, tek tek .env dosyalarınızı diske kaydedebilir veya kasanızı tamamen sıfırlayarak tüm izleri silebilirsiniz."
            : "You have sovereign control over your data. You can export your entire vault as an encrypted archive (.vaultbak) at any time, export individual .env files to your disk, or wipe the vault completely to erase all traces."}
        </p>
      </div>

      {/* Footer Info */}
      <div
        style={{
          padding: "var(--space-3) var(--space-4)",
          borderRadius: "var(--radius-md)",
          backgroundColor: "var(--surface-subtle)",
          border: "1px solid var(--border-subtle)",
          fontSize: "11.5px",
          color: "var(--text-tertiary)",
        }}
      >
        {isTr
          ? "Son güncelleme: 30 Ağustos 2026 — Vellium Mühendislik & Güvenlik Birimi"
          : "Last updated: August 30, 2026 — Vellium Engineering & Security Team"}
      </div>
    </div>
  );
};
