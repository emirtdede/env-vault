import React, { useState } from "react";
import {
  Folder,
  FolderPlus,
  Star,
  Lock,
  Settings,
  Archive,
  FilePlus,
  FolderDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { useProjectStore } from "../../stores/useProjectStore";
import { useVaultSessionStore } from "../../stores/useVaultSessionStore";
import { useDialogStore } from "../../stores/useDialogStore";
import { IconButton } from "../../components/primitives/IconButton";
import { SearchField } from "../../components/primitives/SearchField";
import { ContextMenu, ContextMenuItem } from "../../components/primitives/ContextMenu";
import { Project } from "../../types";
import { useTranslation } from "../../i18n";

export const ProjectSidebar: React.FC = () => {
  const { t, language } = useTranslation();
  const projects = useProjectStore((s) => s.projects);
  const selectedProjectId = useProjectStore((s) => s.selectedProjectId);
  const selectProject = useProjectStore((s) => s.selectProject);
  const searchQuery = useProjectStore((s) => s.searchQuery);
  const setSearchQuery = useProjectStore((s) => s.setSearchQuery);
  const toggleFavorite = useProjectStore((s) => s.toggleFavorite);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const lockVault = useVaultSessionStore((s) => s.lock);
  const openCreateProject = useDialogStore((s) => s.openCreateProject);
  const openEditProject = useDialogStore((s) => s.openEditProject);
  const openAddEnv = useDialogStore((s) => s.openAddEnv);
  const openSettings = useDialogStore((s) => s.openSettings);
  const openBackup = useDialogStore((s) => s.openBackup);
  const showConfirm = useDialogStore((s) => s.showConfirm);

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    project: Project;
  } | null>(null);

  const [navContextMenu, setNavContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort favorites first, then alphabetically
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (a.favorite === b.favorite) {
      return a.name.localeCompare(b.name, language);
    }
    return a.favorite ? -1 : 1;
  });

  const getProjectMenuItems = (project: Project): ContextMenuItem[] => [
    {
      id: "add-env",
      label: t("project.addEnvFile"),
      icon: <FilePlus size={14} />,
      onClick: () => {
        selectProject(project.id);
        openAddEnv();
      },
    },
    {
      id: "edit-project",
      label: t("project.editProject"),
      icon: <Pencil size={14} />,
      onClick: () => {
        openEditProject(project);
      },
    },
    {
      id: "export-all-env",
      label: language === "tr" ? "Tüm Dosyaları Klasöre Aktar..." : "Export All Files to Folder...",
      icon: <FolderDown size={14} />,
      onClick: async () => {
        try {
          const { open } = await import("@tauri-apps/plugin-dialog");
          const selected = await open({
            directory: true,
            multiple: false,
            title: language === "tr" ? `"${project.name}" Dosyalarının Kaydedileceği Klasörü Seçin` : `Select Folder to Export "${project.name}" Files`,
          });
          if (selected && typeof selected === "string") {
            const { exportApi } = await import("../../lib/tauri/export-api");
            await exportApi.exportProjectEnvDocuments(project.id, selected, "overwrite");
          }
        } catch (e) {
          console.error(e);
        }
      },
    },
    {
      id: "export-merged-env",
      label: language === "tr" ? "Birleşik Tek Dosya Olarak Aktar (.env)..." : "Export as Combined Single File (.env)...",
      icon: <FolderDown size={14} />,
      onClick: async () => {
        try {
          const { save } = await import("@tauri-apps/plugin-dialog");
          const selected = await save({
            defaultPath: `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.combined.env`,
            title: language === "tr" ? `"${project.name}" Birleşik Ortam Dosyasını Kaydet` : `Save "${project.name}" Combined Environment File`,
            filters: [{ name: language === "tr" ? "Ortam Dosyası" : "Environment File", extensions: ["env", "txt"] }],
          });
          if (selected && typeof selected === "string") {
            const { exportApi } = await import("../../lib/tauri/export-api");
            await exportApi.exportMergedProjectEnv(project.id, selected);
          }
        } catch (e) {
          console.error(e);
        }
      },
    },
    {
      id: "toggle-fav",
      label: project.favorite ? t("project.removeFromFavorites") : t("project.addToFavorites"),
      icon: <Star size={14} />,
      onClick: () => toggleFavorite(project.id),
    },
    {
      id: "delete-project",
      label: t("project.deleteProject"),
      icon: <Trash2 size={14} />,
      variant: "danger",
      divider: true,
      onClick: () => {
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
      },
    },
  ];

  return (
    <aside
      style={{
        width: "260px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--border)",
        backgroundColor: "var(--glass-bg, var(--surface))",
        backdropFilter: "blur(var(--glass-blur-sm))",
        WebkitBackdropFilter: "blur(var(--glass-blur-sm))",
        flexShrink: 0,
      }}
    >
      {/* Sidebar Header */}
      <div
        style={{
          padding: "var(--space-4) var(--space-4) var(--space-2) var(--space-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "-0.01em",
                color: "var(--text-primary)",
              }}
            >
              {t("common.projects")}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--text-tertiary)",
                backgroundColor: "var(--surface-subtle)",
                padding: "1px 6px",
                borderRadius: "var(--radius-full)",
              }}
            >
              {projects.length}
            </span>
          </div>
          <IconButton
            icon={<FolderPlus size={16} />}
            aria-label={t("sidebar.newProject")}
            title={t("sidebar.newProject")}
            size="sm"
            variant="subtle"
            onClick={openCreateProject}
          />
        </div>

        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("sidebar.searchProjects")}
          ariaLabel={t("sidebar.searchProjects")}
        />
      </div>

      {/* Project Navigation Items */}
      <nav
        onContextMenu={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            setNavContextMenu({ x: e.clientX, y: e.clientY });
          }
        }}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "var(--space-2) var(--space-2)",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}
      >
        {sortedProjects.length === 0 ? (
          <div
            style={{
              padding: "var(--space-8) var(--space-4)",
              textAlign: "center",
              color: "var(--text-tertiary)",
              fontSize: "12.5px",
            }}
          >
            {searchQuery ? t("sidebar.noProjectsFound") : t("sidebar.emptyProjectsDesc")}
          </div>
        ) : (
          sortedProjects.map((project) => {
            const isSelected = project.id === selectedProjectId;
            return (
              <div
                key={project.id}
                role="button"
                tabIndex={0}
                onClick={() => selectProject(project.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  selectProject(project.id);
                  setNavContextMenu(null);
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    project,
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") selectProject(project.id);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "7px 10px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: isSelected ? "var(--surface-active)" : "transparent",
                  color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all var(--duration-fast)",
                  outline: "none",
                }}
                className="project-nav-item"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", overflow: "hidden" }}>
                  <Folder
                    size={15}
                    style={{
                      color: isSelected ? "var(--accent)" : "var(--text-tertiary)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: isSelected ? 600 : 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {project.name}
                  </span>
                </div>

                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(project.id);
                  }}
                  title={project.favorite ? t("project.removeFromFavorites") : t("project.addToFavorites")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "2px",
                    color: project.favorite ? "var(--warning)" : "var(--text-tertiary)",
                    opacity: project.favorite || isSelected ? 1 : 0,
                    transition: "opacity var(--duration-fast)",
                  }}
                  className="favorite-btn"
                >
                  <Star size={13} fill={project.favorite ? "currentColor" : "none"} />
                </div>
              </div>
            );
          })
        )}
      </nav>

      {/* Project Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          title={contextMenu.project.name}
          items={getProjectMenuItems(contextMenu.project)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Nav Empty Space Context Menu */}
      {navContextMenu && (
        <ContextMenu
          x={navContextMenu.x}
          y={navContextMenu.y}
          items={[
            {
              id: "new-project",
              label: t("sidebar.newProject"),
              icon: <FolderPlus size={14} />,
              onClick: openCreateProject,
            },
            {
              id: "export-all-vault",
              label: language === "tr" ? "Tüm Kasayı Dışa Aktar (Tüm Projeler)..." : "Export Entire Vault (All Projects)...",
              icon: <FolderDown size={14} />,
              onClick: async () => {
                try {
                  const { open } = await import("@tauri-apps/plugin-dialog");
                  const selected = await open({
                    directory: true,
                    multiple: false,
                    title: language === "tr" ? "Tüm Projelerin Çıkarılacağı Ana Klasörü Seçin" : "Select Root Directory to Export All Projects",
                  });
                  if (selected && typeof selected === "string") {
                    const { exportApi } = await import("../../lib/tauri/export-api");
                    await exportApi.exportAllProjects(selected, "overwrite");
                  }
                } catch (e) {
                  console.error(e);
                }
              },
            },
          ]}
          onClose={() => setNavContextMenu(null)}
        />
      )}

      {/* Sidebar Footer Controls */}
      <footer
        style={{
          padding: "var(--space-3) var(--space-4)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "var(--surface-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
          <IconButton
            icon={<Settings size={16} />}
            aria-label={t("sidebar.settings")}
            title={t("sidebar.settings")}
            size="sm"
            onClick={openSettings}
          />
          <IconButton
            icon={<Archive size={16} />}
            aria-label={language === "tr" ? "Yedekleme ve Geri Yükleme" : "Backup & Restore"}
            title={language === "tr" ? "Yedekleme ve Geri Yükleme" : "Backup & Restore"}
            size="sm"
            onClick={openBackup}
          />
        </div>
        <IconButton
          icon={<Lock size={16} />}
          aria-label={t("sidebar.lockVault")}
          title={t("sidebar.lockVault")}
          size="sm"
          variant="subtle"
          onClick={lockVault}
        />
      </footer>
    </aside>
  );
};
