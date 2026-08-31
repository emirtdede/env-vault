import React, { useState, useEffect } from "react";
import { ArrowRightLeft, FileCode, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { Dialog } from "../../components/primitives/Dialog";
import { Button } from "../../components/primitives/Button";
import { useDialogStore } from "../../stores/useDialogStore";
import { useEnvStore } from "../../stores/useEnvStore";
import { envApi } from "../../lib/tauri/env-api";
import { useTranslation } from "../../i18n";

interface DiffRow {
  key: string;
  val1: string | null;
  val2: string | null;
  status: "same" | "diff" | "only-left" | "only-right";
}

export const EnvDiffModal: React.FC = () => {
  const { t, language } = useTranslation();
  const isOpen = useDialogStore((s) => s.isEnvDiffOpen);
  const onClose = useDialogStore((s) => s.closeEnvDiff);
  const documents = useEnvStore((s) => s.documents);

  const [leftDocId, setLeftDocId] = useState<string>("");
  const [rightDocId, setRightDocId] = useState<string>("");
  const [leftContent, setLeftContent] = useState<string>("");
  const [rightContent, setRightContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hideIdentical, setHideIdentical] = useState(false);


  useEffect(() => {
    if (isOpen && documents.length >= 2) {
      const doc0 = documents[0];
      const doc1 = documents[1];
      if (doc0 && (!leftDocId || !documents.some((d) => d.id === leftDocId))) {
        setLeftDocId(doc0.id);
      }
      if (doc1 && (!rightDocId || !documents.some((d) => d.id === rightDocId))) {
        setRightDocId(doc1.id);
      }
    }
  }, [isOpen, documents, leftDocId, rightDocId]);


  useEffect(() => {
    let mounted = true;
    if (isOpen && leftDocId && rightDocId) {
      (async () => {
        try {
          setIsLoading(true);
          const [leftPayload, rightPayload] = await Promise.all([
            envApi.readEnvDocument(leftDocId),
            envApi.readEnvDocument(rightDocId),
          ]);
          if (mounted) {
            setLeftContent(leftPayload.rawText);
            setRightContent(rightPayload.rawText);
          }
        } catch {
          // Handled
        } finally {
          if (mounted) setIsLoading(false);
        }
      })();
    }
    return () => {
      mounted = false;
    };
  }, [isOpen, leftDocId, rightDocId]);

  const parseEnvMap = (text: string): Map<string, string> => {
    const map = new Map<string, string>();
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const k = trimmed.slice(0, eqIdx).trim();
        const v = trimmed.slice(eqIdx + 1).trim();
        if (k) map.set(k, v);
      }
    }
    return map;
  };

  const diffRows = React.useMemo<DiffRow[]>(() => {
    const map1 = parseEnvMap(leftContent);
    const map2 = parseEnvMap(rightContent);
    const allKeys = Array.from(new Set([...Array.from(map1.keys()), ...Array.from(map2.keys())])).sort();

    const rows: DiffRow[] = [];
    for (const key of allKeys) {
      const v1 = map1.has(key) ? map1.get(key)! : null;
      const v2 = map2.has(key) ? map2.get(key)! : null;

      let status: DiffRow["status"] = "same";
      if (v1 === null) status = "only-right";
      else if (v2 === null) status = "only-left";
      else if (v1 !== v2) status = "diff";

      rows.push({ key, val1: v1, val2: v2, status });
    }
    return rows;
  }, [leftContent, rightContent]);

  const filteredRows = hideIdentical ? diffRows.filter((r) => r.status !== "same") : diffRows;

  const diffCounts = React.useMemo(() => {
    let same = 0;
    let diff = 0;
    let onlyLeft = 0;
    let onlyRight = 0;
    for (const r of diffRows) {
      if (r.status === "same") same++;
      else if (r.status === "diff") diff++;
      else if (r.status === "only-left") onlyLeft++;
      else if (r.status === "only-right") onlyRight++;
    }
    return { same, diff, onlyLeft, onlyRight };
  }, [diffRows]);

  const leftDoc = documents.find((d) => d.id === leftDocId);
  const rightDoc = documents.find((d) => d.id === rightDocId);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={language === "tr" ? "Ortam Dosyalarını Karşılaştır (Diff)" : "Compare Environment Files (Diff)"}
      maxWidth="840px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {documents.length < 2 ? (
          <div
            style={{
              padding: "var(--space-6)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-3)",
            }}
          >
            <Info size={32} style={{ color: "var(--accent)" }} />
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              {language === "tr"
                ? "Karşılaştırma yapabilmek için bu projede en az 2 ortam dosyası bulunmalıdır."
                : "At least 2 environment files are required in this project to perform a comparison."}
            </p>
            <Button variant="secondary" size="sm" onClick={onClose}>
              {t("common.close")}
            </Button>
          </div>
        ) : (
          <>
            {/* Header Selectors */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                gap: "var(--space-3)",
                padding: "var(--space-3)",
                backgroundColor: "var(--surface-subtle)",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {/* Left Selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>
                  {language === "tr" ? "1. Dosya (Kaynak)" : "File 1 (Source)"}
                </span>
                <select
                  value={leftDocId}
                  onChange={(e) => setLeftDocId(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontWeight: 500,
                    outline: "none",
                  }}
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id} disabled={d.id === rightDocId}>
                      {d.filename}
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap / Arrow */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => {
                    const temp = leftDocId;
                    setLeftDocId(rightDocId);
                    setRightDocId(temp);
                  }}
                  title={language === "tr" ? "Dosyaların Yerini Değiştir" : "Swap Files"}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    padding: "6px 8px",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                >
                  <ArrowRightLeft size={14} />
                </button>
              </div>

              {/* Right Selector */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>
                  {language === "tr" ? "2. Dosya (Hedef)" : "File 2 (Target)"}
                </span>
                <select
                  value={rightDocId}
                  onChange={(e) => setRightDocId(e.target.value)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--surface)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    fontWeight: 500,
                    outline: "none",
                  }}
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id} disabled={d.id === leftDocId}>
                      {d.filename}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "12px" }}>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <CheckCircle2 size={13} /> {diffCounts.same} {language === "tr" ? "Aynı" : "Same"}
                </span>
                <span style={{ color: "#D99028", display: "flex", alignItems: "center", gap: "4px" }}>
                  <AlertTriangle size={13} /> {diffCounts.diff} {language === "tr" ? "Değer Farkı" : "Value Diff"}
                </span>
                <span style={{ color: "var(--accent)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <FileCode size={13} /> {diffCounts.onlyLeft + diffCounts.onlyRight} {language === "tr" ? "Eksik / Tekil" : "Missing / Unique"}
                </span>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={hideIdentical}
                  onChange={(e) => setHideIdentical(e.target.checked)}
                />
                {language === "tr" ? "Aynı olanları gizle" : "Hide identical"}
              </label>
            </div>

            {/* Diff Table */}
            <div
              style={{
                maxHeight: "360px",
                overflowY: "auto",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--surface)",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: "var(--surface-subtle)",
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                      fontSize: "11px",
                      textAlign: "left",
                    }}
                  >
                    <th style={{ padding: "8px 12px", width: "30%" }}>{language === "tr" ? "Değişken Adı" : "Variable Key"}</th>
                    <th style={{ padding: "8px 12px", width: "35%" }}>{leftDoc?.filename || "Dosya 1"}</th>
                    <th style={{ padding: "8px 12px", width: "35%" }}>{rightDoc?.filename || "Dosya 2"}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "var(--text-tertiary)" }}>
                        {language === "tr" ? "Değişkenler yükleniyor..." : "Loading variables..."}
                      </td>
                    </tr>
                  ) : filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ padding: "24px", textAlign: "center", color: "var(--text-tertiary)" }}>
                        {language === "tr" ? "Görüntülenecek fark bulunamadı." : "No differences found."}
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => {

                      let bg = "transparent";
                      if (row.status === "diff") bg = "rgba(217, 144, 40, 0.08)";
                      else if (row.status === "only-left") bg = "rgba(10, 132, 255, 0.06)";
                      else if (row.status === "only-right") bg = "rgba(239, 68, 68, 0.06)";

                      return (
                        <tr
                          key={row.key}
                          style={{
                            backgroundColor: bg,
                            borderBottom: "1px solid var(--border-subtle)",
                            fontFamily: "var(--font-mono, monospace)",
                          }}
                        >
                          <td style={{ padding: "7px 12px", fontWeight: 600, color: "var(--text-primary)" }}>
                            {row.key}
                          </td>
                          <td
                            style={{
                              padding: "7px 12px",
                              color: row.val1 === null ? "var(--text-tertiary)" : "var(--text-secondary)",
                              fontStyle: row.val1 === null ? "italic" : "normal",
                            }}
                          >
                            {row.val1 !== null ? row.val1 : (language === "tr" ? "(tanımsız)" : "(not set)")}
                          </td>
                          <td
                            style={{
                              padding: "7px 12px",
                              color: row.val2 === null ? "var(--text-tertiary)" : "var(--text-secondary)",
                              fontStyle: row.val2 === null ? "italic" : "normal",
                            }}
                          >
                            {row.val2 !== null ? row.val2 : (language === "tr" ? "(tanımsız)" : "(not set)")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
              <Button variant="secondary" size="sm" onClick={onClose}>
                {t("common.close")}
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
};
