import React, { useState, useEffect } from "react";
import { ArrowDownToLine, ShieldCheck } from "lucide-react";
import { GlassSurface } from "../../components/primitives/GlassSurface";
import { useProjectStore } from "../../stores/useProjectStore";
import { useEnvStore } from "../../stores/useEnvStore";
import { useTranslation } from "../../i18n";

export const ImportDropOverlay: React.FC = () => {
  const { t, language } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const selectedProjectId = useProjectStore((s) => s.selectedProjectId);
  const fetchDocuments = useEnvStore((s) => s.fetchDocuments);

  useEffect(() => {
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes("Files")) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        setIsDragging(false);
        dragCounter = 0;
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      dragCounter = 0;

      if (!selectedProjectId || !e.dataTransfer?.files) return;

      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (!file) continue;

        try {
          const text = await file.text();
          const { createDocument } = useEnvStore.getState();
          await createDocument(selectedProjectId, file.name || ".env", text);
        } catch {}
      }

      await fetchDocuments(selectedProjectId);
    };

    window.addEventListener("dragenter", handleDragEnter);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragenter", handleDragEnter);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("drop", handleDrop);
    };
  }, [selectedProjectId, fetchDocuments]);

  if (!isDragging) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        pointerEvents: "none",
        padding: "var(--space-6)",
      }}
      className="animate-fade-in"
    >
      <GlassSurface
        intensity="strong"
        blur="lg"
        borderRadius="var(--radius-2xl)"
        style={{
          padding: "var(--space-10) var(--space-8)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-4)",
          textAlign: "center",
          maxWidth: "460px",
          border: "2px dashed var(--accent)",
        }}
        className="animate-scale-up"
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "var(--radius-xl)",
            backgroundColor: "var(--accent-subtle)",
            color: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ArrowDownToLine size={28} />
        </div>

        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
            {language === "tr" ? ".env dosyasını bırakın" : "Drop .env file here"}
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {language === "tr" ? "Dosya Vault'a şifreli olarak kopyalanacak." : "The file will be encrypted and imported to Vault."}
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            fontSize: "12px",
            color: "var(--text-tertiary)",
            backgroundColor: "var(--surface-subtle)",
            padding: "6px 12px",
            borderRadius: "var(--radius-full)",
          }}
        >
          <ShieldCheck size={14} style={{ color: "var(--success)" }} />
          <span>{t("envDocument.card.sourceDeletedTooltip")}</span>
        </div>
      </GlassSurface>
    </div>
  );
};
