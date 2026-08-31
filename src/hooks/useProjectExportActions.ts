import { useState } from "react";
import { exportApi } from "../lib/tauri/export-api";
import { useTranslation } from "../i18n";

export const useProjectExportActions = () => {
  const { language } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const exportProjectToFolder = async (
    projectId: string,
    projectName: string
  ): Promise<boolean> => {
    try {
      setIsExporting(true);
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
        title:
          language === "tr"
            ? `"${projectName}" Dosyalarının Kaydedileceği Klasörü Seçin`
            : `Select Folder to Export "${projectName}" Files`,
      });

      if (!selected || typeof selected !== "string") {
        setIsExporting(false);
        return false;
      }

      const report = await exportApi.exportProjectEnvDocuments(
        projectId,
        selected,
        "overwrite"
      );

      const msg =
        language === "tr"
          ? `${report.exportedCount} dosya aktarıldı`
          : `${report.exportedCount} files exported`;
      setExportFeedback(msg);
      setTimeout(() => setExportFeedback(null), 3000);
      return true;
    } catch {
      const errMsg =
        language === "tr"
          ? "Dışa aktarma sırasında hata oluştu"
          : "Export failed";
      setExportFeedback(errMsg);
      setTimeout(() => setExportFeedback(null), 3000);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  const exportMergedProject = async (
    projectId: string,
    projectName: string
  ): Promise<boolean> => {
    try {
      setIsExporting(true);
      const { save } = await import("@tauri-apps/plugin-dialog");
      const cleanSlug = projectName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const selected = await save({
        defaultPath: `${cleanSlug}.combined.env`,
        title:
          language === "tr"
            ? `"${projectName}" Birleşik Ortam Dosyasını Kaydet`
            : `Save "${projectName}" Combined Environment File`,
        filters: [
          {
            name: language === "tr" ? "Ortam Dosyası" : "Environment File",
            extensions: ["env", "txt"],
          },
        ],
      });

      if (!selected || typeof selected !== "string") {
        setIsExporting(false);
        return false;
      }

      await exportApi.exportMergedProjectEnv(projectId, selected);
      const msg =
        language === "tr"
          ? "Birleşik dosya kaydedildi"
          : "Combined file saved";
      setExportFeedback(msg);
      setTimeout(() => setExportFeedback(null), 3000);
      return true;
    } catch {
      const errMsg =
        language === "tr"
          ? "Dışa aktarma sırasında hata oluştu"
          : "Export failed";
      setExportFeedback(errMsg);
      setTimeout(() => setExportFeedback(null), 3000);
      return false;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    exportFeedback,
    exportProjectToFolder,
    exportMergedProject,
  };
};
