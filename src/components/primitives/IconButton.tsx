import React from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  "aria-label": string;
  size?: "sm" | "md" | "lg";
  variant?: "subtle" | "ghost" | "danger" | "surface";
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  "aria-label": ariaLabel,
  size = "md",
  variant = "ghost",
  disabled,
  style,
  className = "",
  ...props
}) => {
  const getDimensions = () => {
    switch (size) {
      case "sm":
        return { size: "28px", iconSize: "14px" };
      case "lg":
        return { size: "40px", iconSize: "20px" };
      default:
        return { size: "32px", iconSize: "16px" };
    }
  };

  const getBackground = () => {
    switch (variant) {
      case "subtle":
        return "var(--surface-subtle)";
      case "surface":
        return "var(--surface)";
      case "danger":
        return "var(--danger-subtle)";
      default:
        return "transparent";
    }
  };

  const dims = getDimensions();

  return (
    <button
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: dims.size,
        height: dims.size,
        borderRadius: "var(--radius-md)",
        backgroundColor: getBackground(),
        color: variant === "danger" ? "var(--danger)" : "var(--text-primary)",
        border: "1px solid transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all var(--duration-fast) var(--ease-smooth)",
        outline: "none",
        ...style,
      }}
      className={`icon-btn ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};
