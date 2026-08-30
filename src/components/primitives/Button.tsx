import React from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "subtle" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  style,
  className = "",
  ...props
}) => {
  const getPadding = () => {
    switch (size) {
      case "sm":
        return "6px 12px";
      case "lg":
        return "12px 24px";
      default:
        return "8px 16px";
    }
  };

  const getFontSize = () => {
    switch (size) {
      case "sm":
        return "12px";
      case "lg":
        return "15px";
      default:
        return "13.5px";
    }
  };

  const getColors = () => {
    switch (variant) {
      case "primary":
        return {
          bg: "var(--accent)",
          color: "var(--accent-text)",
          border: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0 1px 3px rgba(10, 132, 255, 0.3)",
        };
      case "danger":
        return {
          bg: "var(--danger)",
          color: "var(--danger-text)",
          border: "1px solid rgba(0,0,0,0.1)",
          boxShadow: "0 1px 3px rgba(229, 72, 77, 0.3)",
        };
      case "subtle":
        return {
          bg: "var(--surface-subtle)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "none",
        };
      case "ghost":
        return {
          bg: "transparent",
          color: "var(--text-primary)",
          border: "1px solid transparent",
          boxShadow: "none",
        };
      default: // secondary
        return {
          bg: "var(--surface-strong)",
          color: "var(--text-primary)",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        };
    }
  };

  const colors = getColors();

  return (
    <button
      disabled={disabled || isLoading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-2)",
        padding: getPadding(),
        fontSize: getFontSize(),
        fontWeight: 500,
        borderRadius: "var(--radius-md)",
        backgroundColor: colors.bg,
        color: colors.color,
        border: colors.border,
        boxShadow: colors.boxShadow,
        opacity: disabled || isLoading ? 0.6 : 1,
        cursor: disabled || isLoading ? "not-allowed" : "pointer",
        transition: "all var(--duration-fast) var(--ease-smooth)",
        outline: "none",
        ...style,
      }}
      className={`btn-custom ${className}`}
      {...props}
    >
      {isLoading ? (
        <span
          style={{
            display: "inline-block",
            width: "14px",
            height: "14px",
            border: "2px solid currentColor",
            borderRightColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
          }}
        />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
