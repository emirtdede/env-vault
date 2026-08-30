import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "subtle" | "accent" | "success" | "warning" | "danger";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "subtle",
  size = "sm",
}) => {
  const getColors = () => {
    switch (variant) {
      case "accent":
        return {
          bg: "var(--accent-subtle)",
          color: "var(--accent)",
          border: "rgba(10, 132, 255, 0.2)",
        };
      case "success":
        return {
          bg: "var(--success-subtle)",
          color: "var(--success)",
          border: "rgba(46, 155, 99, 0.2)",
        };
      case "warning":
        return {
          bg: "var(--warning-subtle)",
          color: "var(--warning)",
          border: "rgba(217, 144, 40, 0.2)",
        };
      case "danger":
        return {
          bg: "var(--danger-subtle)",
          color: "var(--danger)",
          border: "rgba(229, 72, 77, 0.2)",
        };
      default:
        return {
          bg: "var(--surface-subtle)",
          color: "var(--text-secondary)",
          border: "var(--border-subtle)",
        };
    }
  };

  const colors = getColors();

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: size === "sm" ? "2px 6px" : "4px 8px",
        fontSize: size === "sm" ? "11px" : "12px",
        fontWeight: 500,
        borderRadius: "var(--radius-full)",
        backgroundColor: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </span>
  );
};
