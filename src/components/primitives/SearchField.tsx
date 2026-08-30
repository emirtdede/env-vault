import React from "react";
import { Search, X } from "lucide-react";
import { IconButton } from "./IconButton";

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  placeholder = "Ara...",
  ariaLabel = "Ara",
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        position: "relative",
        width: "100%",
      }}
    >
      <Search
        size={14}
        style={{
          position: "absolute",
          left: "var(--space-3)",
          color: "var(--text-tertiary)",
          pointerEvents: "none",
        }}
      />
      <input
        type="text"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: "32px",
          paddingLeft: "32px",
          paddingRight: value ? "28px" : "var(--space-3)",
          fontSize: "13px",
          color: "var(--text-primary)",
          backgroundColor: "var(--surface-subtle)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          outline: "none",
          transition: "border-color var(--duration-fast), background-color var(--duration-fast)",
        }}
      />
      {value && (
        <span style={{ position: "absolute", right: "4px" }}>
          <IconButton
            icon={<X size={12} />}
            aria-label="Aramayı Temizle"
            size="sm"
            onClick={() => onChange("")}
          />
        </span>
      )}
    </div>
  );
};
