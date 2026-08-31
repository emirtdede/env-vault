import React from "react";
import {
  FilePlus,
  Pencil,
  Trash2,
  FolderDown,
  CheckCircle2,
  Folder,
  GitCompare,
} from "lucide-react";
import { useProjectStore } from "../../stores/useProjectStore";
import { useDialogStore } from "../../stores/useDialogStore";
import { useEnvStore } from "../../stores/useEnvStore";
import { Button } from "../../components/primitives/Button";
import { IconButton } from "../../components/primitives/IconButton";
import { useTranslation } from "../../i18n";
import { useProjectExportActions } from "../../hooks/useProjectExportActions";

export interface ProjectHeaderProps {
  onEditProject?: () => void;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({ onEditProject }) => {
  const { t, language } = useTranslation();
  const projects = useProjectStore((s) => s.projects);
  const selectedProjectId = useProjectStore((s) => s.selectedProjectId);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const documents = useEnvStore((s) => s.documents);

  const openAddEnv = useDialogStore((s) => s.openAddEnv);
  const openEditProject = useDialogStore((s) => s.openEditProject);
  const openEnvDiff = useDialogStore((s) => s.openEnvDiff);
  const showConfirm = useDialogStore((s) => s.showConfirm);


  const {
    isExporting,
    exportFeedback,
    exportProjectToFolder,
    exportMergedProject,
  } = useProjectExportActions();

  const project = projects.find((p) => p.id === selectedProjectId);

  if (!project) return null;

  const handleExportAllToFolder = async () => {
    if (!project || documents.length === 0) return;
    await exportProjectToFolder(project.id, project.name);
  };

  const handleExportMerged = async () => {
    if (!project || documents.length === 0) return;
    await exportMergedProject(project.id, project.name);
  };

  const handleDelete = () => {
    showConfirm({
      title: t("project.deleteConfirmTitle"),
      message: t("project.deleteConfirmDesc", { name: project.name }),
      confirmLabel: t("common.delete"),
      cancelLabel: t("common.cancel"),
      isDestructive: true,
      onConfirm: async () => {
        await deleteProject(project.id);
      },
    });
  };


  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-4) var(--space-6)",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--surface)",
        gap: "var(--space-4)",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <h1
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {project.name}
          </h1>
          <IconButton
            icon={<Pencil size={13} />}
            aria-label={t("project.editProject")}
            size="sm"
            onClick={() => {
              if (onEditProject) {
                onEditProject();
              } else {
                openEditProject(project);
              }
            }}
            title={t("project.editProject")}
          />
        </div>
        {project.description && (
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
            {project.description}
          </p>
        )}
        {project.sourcePath && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11.5px",
              color: "var(--text-tertiary)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={`${t("project.sourcePath")}: ${project.sourcePath}`}
          >
            <Folder size={12} style={{ flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{project.sourcePath}</span>
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
        {exportFeedback && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "var(--radius-full)",
              backgroundColor: "rgba(48, 209, 88, 0.15)",
              color: "var(--success)",
              fontSize: "12px",
              fontWeight: 500,
            }}
            className="animate-fade-in"
          >
            <CheckCircle2 size={14} />
            <span>{exportFeedback}</span>
          </div>
        )}

        {documents.length > 0 && (
          <div style={{ display: "flex", gap: "6px" }}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FolderDown size={14} />}
              onClick={handleExportAllToFolder}
              isLoading={isExporting}
              title={t("project.exportAllTooltip")}
            >
              {language === "tr" ? "Klasöre Aktar" : "Export to Folder"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportMerged}
              isLoading={isExporting}
              title={language === "tr" ? "Tüm .env dosyalarını tek bir birleşik dosyada (.env.combined) toplar" : "Combines all .env files into a single file (.env.combined)"}
            >
              {language === "tr" ? "Birleşik Aktar (.env)" : "Export Combined (.env)"}
            </Button>
            {documents.length >= 2 && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<GitCompare size={14} />}
                onClick={openEnvDiff}
                title={language === "tr" ? "İki ortam dosyası arasındaki değişken farklarını gösterir" : "Compare key & value diffs between two environment files"}
              >
                {language === "tr" ? "Karşılaştır" : "Diff"}
              </Button>
            )}
          </div>
        )}

        <Button
          variant="primary"
          size="sm"
          leftIcon={<FilePlus size={15} />}
          onClick={openAddEnv}
        >

          {t("common.file")} {t("project.addEnvFile")}
        </Button>
        <IconButton
          icon={<Trash2 size={15} />}
          aria-label={t("project.deleteProject")}
          size="md"
          variant="danger"
          onClick={handleDelete}
        />
      </div>
    </header>
  );
};
