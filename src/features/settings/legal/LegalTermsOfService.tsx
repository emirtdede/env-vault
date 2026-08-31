import React from "react";
import { FileText, Key, AlertTriangle, Scale, CheckCircle2 } from "lucide-react";
import { useTranslation } from "../../../i18n";

export const LegalTermsOfService: React.FC = () => {
  const { language } = useTranslation();
  const isTr = language === "tr";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", color: "var(--text-primary)" }}>
      {/* License Banner */}
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
        <Scale size={26} style={{ color: "var(--accent)", flexShrink: 0 }} />
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
            {isTr ? "MIT Lisansı & Kullanım Standartları" : "MIT License & Terms of Service"}
          </h4>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "3px 0 0 0" }}>
            {isTr
              ? "Env Vault, açık kaynak kodlu ve serbestçe kullanılabilen bir masaüstü güvenlik aracıdır."
              : "Env Vault is an open-source, freely distributable desktop security utility."}
          </p>
        </div>
      </div>

      {/* Section 1: License Grant */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <FileText size={16} style={{ color: "var(--accent)" }} />
          <h4 style={{ fontSize: "13.5px", fontWeight: 600, margin: 0 }}>
            {isTr ? "1. Lisans Kapsamı ve İzinler" : "1. License Grant & Permissions"}
          </h4>
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: "1.6", color: "var(--text-secondary)", margin: 0 }}>
          {isTr
            ? "Env Vault kaynak kodu MIT Lisansı altında sunulmaktadır. Yazılımı kişisel, ticari veya akademik projelerinizde ücretsiz olarak kullanabilir, kopyalayabilir, değiştirebilir ve dağıtabilirsiniz."
            : "Env Vault is licensed under the MIT License. You are free to use, copy, modify, merge, publish, distribute, and sublicense the software in personal, commercial, or academic environments without charge."}
        </p>
      </div>

      {/* Section 2: Master Password Responsibility */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Key size={16} style={{ color: "var(--accent)" }} />
          <h4 style={{ fontSize: "13.5px", fontWeight: 600, margin: 0 }}>
            {isTr ? "2. Ana Parola ve Kullanıcı Sorumluluğu" : "2. Master Password & User Responsibility"}
          </h4>
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: "1.6", color: "var(--text-secondary)", margin: 0 }}>
          {isTr
            ? "Env Vault sıfır-bilgi mimarisiyle çalıştığından, ana parolanızı yalnızca siz bilirsiniz. Ana parolanızı kaybetmeniz veya unutmanız durumunda şifreli kasadaki veriler matematiksel olarak kurtarılamaz. Parolanızı güvenli bir ortamda yedeklemek tamamen kullanıcının sorumluluğundadır."
            : "Because Env Vault operates on a zero-knowledge architecture, only you know your master password. If you lose or forget your master password, your encrypted data cannot be recovered. Maintaining secure backups of your password and vault is entirely your responsibility."}
        </p>
      </div>

      {/* Section 3: Warranty Disclaimer */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={16} style={{ color: "var(--accent)" }} />
          <h4 style={{ fontSize: "13.5px", fontWeight: 600, margin: 0 }}>
            {isTr ? "3. Garanti Reddi (As-Is Disclaimer)" : "3. Disclaimer of Warranty"}
          </h4>
        </div>
        <p style={{ fontSize: "12.5px", lineHeight: "1.6", color: "var(--text-secondary)", margin: 0 }}>
          {isTr
            ? "Yazılım, açık veya zımni herhangi bir garanti olmaksızın 'olduğu gibi' (AS IS) sağlanmaktadır. Geliştiriciler ve Vellium, yazılımın kullanımından veya kullanılamamasından doğabilecek doğrudan veya dolaylı veri kaybı ya da zararlardan sorumlu tutulamaz."
            : "The software is provided 'as is', without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and noninfringement. In no event shall the authors or Vellium be liable for any claim or damages."}
        </p>
      </div>

      {/* Section 4: Safe Usage Guidelines */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={16} style={{ color: "var(--accent)" }} />
          <h4 style={{ fontSize: "13.5px", fontWeight: 600, margin: 0 }}>
            {isTr ? "4. Güvenli Kullanım Tavsiyeleri" : "4. Safe Usage Recommendations"}
          </h4>
        </div>
        <ul style={{ fontSize: "12.5px", lineHeight: "1.6", color: "var(--text-secondary)", margin: 0, paddingLeft: "20px" }}>
          <li>
            {isTr
              ? "Üretim ortamı anahtarlarını dışa aktarırken hedef dizinin güvenliğinden emin olun."
              : "Ensure the destination directory is secure before exporting production environment secrets."}
          </li>
          <li>
            {isTr
              ? "Düzenli aralıklarla .vaultbak şifreli yedek oluşturun ve güvenli bir harici ortamda saklayın."
              : "Regularly create .vaultbak encrypted backups and store them in a secure secondary location."}
          </li>
        </ul>
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
        {isTr ? "Telif Hakkı © 2026 Vellium. Tüm hakları saklıdır." : "Copyright © 2026 Vellium. All rights reserved."}
      </div>
    </div>
  );
};
