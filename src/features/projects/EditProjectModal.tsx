import React, { useState, useEffect } from "react";
import { Check, FolderOpen } from "lucide-react";
import { Dialog } from "../../components/primitives/Dialog";
import { Input } from "../../components/primitives/Input";
import { Button } from "../../components/primitives/Button";
import { useDialogStore } from "../../stores/useDialogStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useTranslation } from "../../i18n";

export const EditProjectModal: React.FC = () => {
  const { t, language } = useTranslation();
  const project = useDialogStore((s) => s.editingProject);
  const onClose = useDialogStore((s) => s.closeEditProject);
  const updateProject = useProjectStore((s) => s.updateProject);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || "");
      setSourcePath(project.sourcePath || "");
      setError(null);
    }
  }, [project]);

  const handlePickDirectory = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title: language === "tr" ? "Proje Kaynak Klasörünü Seçin" : "Select Project Source Folder",
      });
      if (selected && typeof selected === "string") {
        setSourcePath(selected);
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    if (!name.trim()) {
      setError(t("projectModal.validationNameRequired"));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await updateProject(
        project.id,
        name.trim(),
        description.trim() || undefined,
        sourcePath.trim() || undefined,
        project.favorite
      );
      onClose();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || t("errors.generic");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={!!project} onClose={onClose} title={t("projectModal.editTitle")} maxWidth="480px">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <Input
          label={t("projectModal.projectNameLabel")}
          placeholder={t("projectModal.projectNamePlaceholder")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError(null);
          }}
          error={error || undefined}
          autoFocus
          disabled={isLoading}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <label style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
            {t("projectModal.descLabel")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            placeholder={t("projectModal.descPlaceholder")}
            style={{
              width: "100%",
              minHeight: "72px",
              padding: "var(--space-3)",
              fontSize: "13px",
              color: "var(--text-primary)",
              backgroundColor: "var(--input-bg, var(--surface))",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              outline: "none",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
          <label style={{ fontSize: "12.5px", fontWeight: 500, color: "var(--text-secondary)" }}>
            {t("projectModal.sourcePathLabel")}
          </label>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <input
              type="text"
              placeholder={t("projectModal.sourcePathPlaceholder")}
              value={sourcePath}
              onChange={(e) => setSourcePath(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                height: "36px",
                padding: "0 10px",
                fontSize: "12.5px",
                color: "var(--text-primary)",
                backgroundColor: "var(--input-bg, var(--surface))",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                outline: "none",
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FolderOpen size={14} />}
              type="button"
              onClick={handlePickDirectory}
              disabled={isLoading}
            >
              {t("common.browse")}
            </Button>
          </div>
          <span style={{ fontSize: "11.5px", color: "var(--text-tertiary)", marginTop: "2px" }}>
            {t("projectModal.sourcePathHelp")}
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
          <Button variant="secondary" onClick={onClose} type="button" disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading} leftIcon={<Check size={16} />}>
            {t("projectModal.saveButton")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
