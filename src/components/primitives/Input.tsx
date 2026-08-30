import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, style, className = "", id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", width: "100%" }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{
              fontSize: "12.5px",
              fontWeight: 500,
              color: "var(--text-secondary)",
            }}
          >
            {label}
          </label>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            position: "relative",
            width: "100%",
          }}
        >
          {leftIcon && (
            <span
              style={{
                position: "absolute",
                left: "var(--space-3)",
                display: "flex",
                alignItems: "center",
                color: "var(--text-tertiary)",
                pointerEvents: "none",
              }}
            >
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            style={{
              width: "100%",
              height: "36px",
              paddingLeft: leftIcon ? "36px" : "var(--space-3)",
              paddingRight: rightIcon ? "36px" : "var(--space-3)",
              fontSize: "13.5px",
              color: "var(--text-primary)",
              backgroundColor: "var(--input-bg, var(--surface))",
              border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
              borderRadius: "var(--radius-md)",
              outline: "none",
              transition: "border-color var(--duration-fast), box-shadow var(--duration-fast)",
              ...style,
            }}
            className={`input-custom ${className}`}
            {...props}
          />
          {rightIcon && (
            <span
              style={{
                position: "absolute",
                right: "var(--space-3)",
                display: "flex",
                alignItems: "center",
                color: "var(--text-tertiary)",
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>
        {error ? (
          <span style={{ fontSize: "11.5px", color: "var(--danger)", marginTop: "2px" }}>{error}</span>
        ) : helperText ? (
          <span style={{ fontSize: "11.5px", color: "var(--text-tertiary)", marginTop: "2px" }}>
            {helperText}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
