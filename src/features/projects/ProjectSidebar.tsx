import React, { useMemo, useState } from "react";
import {
  FilePlus,
  Folder,
  FolderDown,
  FolderPlus,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { useProjectStore } from "../../stores/useProjectStore";
import { useDialogStore } from "../../stores/useDialogStore";
import { IconButton } from "../../components/primitives/IconButton";
import { SearchField } from "../../components/primitives/SearchField";
import { ContextMenu, ContextMenuItem } from "../../components/primitives/ContextMenu";
import { Project } from "../../types";
import { useTranslation } from "../../i18n";
import { useProjectExportActions } from "../../hooks/useProjectExportActions";

interface ProjectListProps {
  collapsed?: boolean;
}

/**
 * The project half of the sidebar: search, favourites first, and the project
 * context menu. It only renders content - the surrounding <aside> belongs to
 * AppSidebar.
 */
export const ProjectList: React.FC<ProjectListProps> = ({ collapsed = false }) => {
  const { t, language } = useTranslation();
  const projects = useProjectStore((s) => s.projects);
  const selectedProjectId = useProjectStore((s) => s.selectedProjectId);
  const selectProject = useProjectStore((s) => s.selectProject);
  const searchQuery = useProjectStore((s) => s.searchQuery);
  const setSearchQuery = useProjectStore((s) => s.setSearchQuery);
  const toggleFavorite = useProjectStore((s) => s.toggleFavorite);
  const deleteProject = useProjectStore((s) => s.deleteProject);

  const openCreateProject = useDialogStore((s) => s.openCreateProject);
  const openEditProject = useDialogStore((s) => s.openEditProject);
  const openAddEnv = useDialogStore((s) => s.openAddEnv);
  const showConfirm = useDialogStore((s) => s.showConfirm);

  const { exportProjectToFolder, exportMergedProject } = useProjectExportActions();

  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    project: Project;
  } | null>(null);
  const [navContextMenu, setNavContextMenu] = useState<{ x: number; y: number } | null>(null);

  const sortedProjects = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const filtered = query
      ? projects.filter((project) => project.name.toLowerCase().includes(query))
      : projects;

    return [...filtered].sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      if (a.sortOrder != null && b.sortOrder != null && a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name, language);
    });
  }, [projects, searchQuery, language]);

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
      onClick: () => openEditProject(project),
    },
    {
      id: "export-all-env",
      label: t("project.exportAllEnv"),
      icon: <FolderDown size={14} />,
      onClick: () => exportProjectToFolder(project.id, project.name),
    },
    {
      id: "export-merged-env",
      label: t("project.exportMerged"),
      icon: <FolderDown size={14} />,
      onClick: () => exportMergedProject(project.id, project.name),
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

  if (collapsed) {
    return (
      <div className="sidebar-projects is-collapsed">
        {sortedProjects.map((project) => {
          const isSelected = project.id === selectedProjectId;
          return (
            <button
              key={project.id}
              type="button"
              className={`rail-project${isSelected ? " is-active" : ""}`}
              onClick={() => selectProject(project.id)}
              title={project.name}
              aria-label={project.name}
              aria-current={isSelected ? "page" : undefined}
            >
              {project.favorite ? <Star size={16} aria-hidden /> : <Folder size={16} aria-hidden />}
            </button>
          );
        })}
        <button
          type="button"
          className="rail-project"
          onClick={openCreateProject}
          title={t("sidebar.newProject")}
          aria-label={t("sidebar.newProject")}
        >
          <FolderPlus size={16} aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar-projects">
      <div className="sidebar-section-head">
        <span className="sidebar-section-title">{t("common.projects")}</span>
        <span className="count-pill">{projects.length}</span>
        <IconButton
          icon={<FolderPlus size={15} />}
          aria-label={t("sidebar.newProject")}
          title={t("sidebar.newProject")}
          size="sm"
          variant="subtle"
          onClick={openCreateProject}
        />
      </div>

      <div className="sidebar-search">
        <SearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("sidebar.searchProjects")}
          ariaLabel={t("sidebar.searchProjects")}
        />
      </div>

      <nav
        className="sidebar-nav"
        aria-label={t("common.projects")}
        onContextMenu={(event) => {
          if (event.target === event.currentTarget) {
            event.preventDefault();
            setNavContextMenu({ x: event.clientX, y: event.clientY });
          }
        }}
      >
        {sortedProjects.length === 0 ? (
          <div className="sidebar-empty">
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
                className={`nav-entry project-nav-item${isSelected ? " is-active" : ""}`}
                onClick={() => selectProject(project.id)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  selectProject(project.id);
                  setNavContextMenu(null);
                  setContextMenu({ x: event.clientX, y: event.clientY, project });
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectProject(project.id);
                  }
                }}
              >
                <Folder size={15} className="nav-entry-icon" aria-hidden />
                <span className="nav-entry-text">{project.name}</span>
                <button
                  type="button"
                  className={`favorite-btn${project.favorite ? " is-active" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleFavorite(project.id);
                  }}
                  title={
                    project.favorite ? t("project.removeFromFavorites") : t("project.addToFavorites")
                  }
                  aria-label={
                    project.favorite ? t("project.removeFromFavorites") : t("project.addToFavorites")
                  }
                >
                  <Star size={13} fill={project.favorite ? "currentColor" : "none"} aria-hidden />
                </button>
              </div>
            );
          })
        )}
      </nav>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          title={contextMenu.project.name}
          items={getProjectMenuItems(contextMenu.project)}
          onClose={() => setContextMenu(null)}
        />
      )}

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
              label: t("sidebar.exportVault"),
              icon: <FolderDown size={14} />,
              onClick: async () => {
                try {
                  const { open } = await import("@tauri-apps/plugin-dialog");
                  const selected = await open({
                    directory: true,
                    multiple: false,
                    title: t("sidebar.exportVault"),
                  });
                  if (selected && typeof selected === "string") {
                    const { exportApi } = await import("../../lib/tauri/export-api");
                    await exportApi.exportAllProjects(selected, "overwrite");
                  }
                } catch {
                  // The dialog was cancelled or the export failed; the caller
                  // reports failures through the global toast layer.
                }
              },
            },
          ]}
          onClose={() => setNavContextMenu(null)}
        />
      )}
    </div>
  );
};
