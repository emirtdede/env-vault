import React, { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Dialog } from "../../components/primitives/Dialog";
import { Input } from "../../components/primitives/Input";
import { Button } from "../../components/primitives/Button";
import { useDialogStore } from "../../stores/useDialogStore";
import { useProjectStore } from "../../stores/useProjectStore";
import { useTranslation } from "../../i18n";

export const CreateProjectModal: React.FC = () => {
  const { t } = useTranslation();
  const isOpen = useDialogStore((s) => s.isCreateProjectOpen);
  const onClose = useDialogStore((s) => s.closeCreateProject);
  const createProject = useProjectStore((s) => s.createProject);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourcePath, setSourcePath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("projectModal.validationNameRequired"));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await createProject(name, description, sourcePath);
      setName("");
      setDescription("");
      setSourcePath("");
      onClose();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || t("errors.generic");
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t("projectModal.createTitle")}>
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

        <Input
          label={t("projectModal.descLabel")}
          placeholder={t("projectModal.descPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
        />

        <Input
          label={t("projectModal.sourcePathLabel")}
          placeholder={t("projectModal.sourcePathPlaceholder")}
          helperText={t("projectModal.sourcePathHelp")}
          value={sourcePath}
          onChange={(e) => setSourcePath(e.target.value)}
          disabled={isLoading}
        />

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
          <Button variant="secondary" onClick={onClose} type="button" disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading} leftIcon={<FolderPlus size={16} />}>
            {t("projectModal.createButton")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
