import React from "react";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) => {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: "var(--space-4)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {(label || description) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {label && (
            <span style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--text-primary)" }}>
              {label}
            </span>
          )}
          {description && (
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              {description}
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={{
          position: "relative",
          width: "38px",
          height: "22px",
          borderRadius: "var(--radius-full)",
          backgroundColor: checked ? "var(--accent)" : "var(--surface-subtle)",
          border: `1px solid ${checked ? "var(--accent)" : "var(--border)"}`,
          transition: "all var(--duration-fast) var(--ease-smooth)",
          cursor: disabled ? "not-allowed" : "pointer",
          padding: 0,
          outline: "none",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "2px",
            left: checked ? "18px" : "2px",
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            transition: "left var(--duration-fast) var(--ease-smooth)",
          }}
        />
      </button>
    </label>
  );
};
